import { getStripe } from '@/lib/stripe'

type CreateSubscriptionCheckout = {
  siteId: string
  authUserId: string
  priceId: string
  plan: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}

// Call only from a site's trusted backend after verifying the shared Supabase session.
// Duplicating metadata on both objects makes webhook delivery order irrelevant.
export async function createSubscriptionCheckout(input: CreateSubscriptionCheckout) {
  return getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    client_reference_id: input.authUserId,
    metadata: { site_id: input.siteId, auth_user_id: input.authUserId, plan: input.plan },
    subscription_data: { metadata: { site_id: input.siteId, auth_user_id: input.authUserId, plan: input.plan } },
  })
}
