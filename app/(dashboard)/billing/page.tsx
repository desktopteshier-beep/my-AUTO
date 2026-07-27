import { getSubscriptionsData, getSitesData, getManualAccessData, getActivityData, getUsageDaysData } from '@/lib/dashboard-data'
import { SubscriptionTable } from '@/components/subscription-table'
import { ManualAccessForm } from '@/components/manual-access-form'
import { ManualAccessTable } from '@/components/manual-access-table'

export default async function BillingPage({ searchParams }: { searchParams: { site?: string; plan?: string } }) {
  const [subscriptions, sites, manualAccess, activity, usageDays] = await Promise.all([getSubscriptionsData(), getSitesData(), getManualAccessData(), getActivityData(), getUsageDaysData()])
  const siteNames = [...new Set(subscriptions.map((s: any) => s.sites?.name).filter(Boolean))] as string[]
  const plans = [...new Set(subscriptions.map((s: any) => s.plan).filter(Boolean))] as string[]
  const filtered = subscriptions.filter((s: any) => (!searchParams.site || s.sites?.name === searchParams.site) && (!searchParams.plan || s.plan === searchParams.plan))

  return <div className="page-enter">
    <section><div className="section-heading"><div><h2>Subscriptions</h2><p>Central billing. Pause access per site without disabling the user's shared account.</p></div><form className="filters"><select name="site" defaultValue={searchParams.site ?? ''} aria-label="Filter by site"><option value="">All sites</option>{siteNames.map(site => <option key={site}>{site}</option>)}</select><select name="plan" defaultValue={searchParams.plan ?? ''} aria-label="Filter by plan"><option value="">All plans</option>{plans.map(plan => <option key={plan}>{plan}</option>)}</select><button className="secondary">Filter</button></form></div><SubscriptionTable subscriptions={filtered as any[]} /></section>
    <section id="manual-access"><div className="section-heading"><div><h2>Manual billing</h2><p>For apps with their own Supabase/Auth. Confirm payment, review the user's latest activity, and pause or restore each account by email.</p></div></div><ManualAccessForm sites={sites as any[]} /><ManualAccessTable entries={manualAccess as any[]} activity={activity as any[]} usageDays={usageDays.perSite} /></section>
  </div>
}
