import { getUsersData, getActivityData, getUsageDaysData } from '@/lib/dashboard-data'
import { RegisteredUsersTable } from '@/components/registered-users-table'
import { ActivityTable } from '@/components/activity-table'

export default async function UsersPage() {
  const [users, activity, usageDays] = await Promise.all([getUsersData(), getActivityData(), getUsageDaysData()])
  return <div className="page-enter">
    <section><div className="section-heading"><div><h2>Registered users</h2><p>All accounts from the shared login system, including users without a subscription.</p></div></div><RegisteredUsersTable users={users as any[]} usageDays={usageDays.perEmail} /></section>
    <section><div className="section-heading"><div><h2>Site activity</h2><p>Recent visitor and signed-in user activity. Visitor IDs are anonymous unless a trusted site sends an email.</p></div></div><ActivityTable activity={activity as any[]} /></section>
  </div>
}
