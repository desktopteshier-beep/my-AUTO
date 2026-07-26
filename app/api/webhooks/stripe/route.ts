import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

type SubscriptionPayload = {
  siteId: string
  authId: string
  plan: string
  subscription: Stripe.Subscription
}

async function syncSubscription({ siteId, authId, plan, subscription }: SubscriptionPayload) {
  const db = getAdminSupabase()
  const { data: user, error: userError } = await db.from('users').select('id').eq('auth_id', authId).single()
  if (userError || !user) throw new Error(`No shared Auth user found for ${authId}`)

  const periodEnd = subscription.current_period_end
  const price = subscription.items.data[0]?.price
  const unitAmount = price?.unit_amount ?? null
  const interval = price?.recurring?.interval
  const mrrCents = unitAmount === null ? null : interval === 'year' ? Math.round(unitAmount / 12) : interval === 'month' ? unitAmount : null
  const { error } = await db.from('subscriptions').upsert({
    user_id: user.id,
    site_id: siteId,
    plan,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    payment_status: subscription.status,
    renewal_date: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    mrr_cents: mrrCents,
    currency: price?.currency ?? null,
  }, { onConflict: 'stripe_subscription_id' })
  if (error) throw error
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return new NextResponse('Webhook configuration missing', { status: 500 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return new NextResponse('Invalid Stripe signature', { status: 400 })
  }

  try {
    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription
      const siteId = subscription.metadata.site_id
      const authId = subscription.metadata.auth_user_id
      const plan = subscription.metadata.plan ?? subscription.items.data[0]?.price.lookup_key ?? 'default'
      if (!siteId || !authId) throw new Error('Subscription metadata must include site_id and auth_user_id')
      await syncSubscription({ siteId, authId, plan, subscription })
    }

    // Checkout completion is handled as a fallback when the subscription event arrives first/late.
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && typeof session.subscription === 'string') {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription)
        const siteId = subscription.metadata.site_id || session.metadata?.site_id
        const authId = subscription.metadata.auth_user_id || session.metadata?.auth_user_id
        if (siteId && authId) await syncSubscription({ siteId, authId, plan: subscription.metadata.plan ?? session.metadata?.plan ?? 'default', subscription })
      }
    }
  } catch (error) {
    console.error('Stripe subscription sync failed', error)
    return new NextResponse('Subscription sync failed', { status: 500 })
  }
  return NextResponse.json({ received: true })
}
