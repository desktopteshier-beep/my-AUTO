type Subscription = { plan?: string; payment_status?: string; sites?: { name?: string } | null }
type RegisteredUser = { id: string; email: string; created_at: string; subscriptions?: Subscription[] | null }

export function RegisteredUsersTable({ users }: { users: RegisteredUser[] }) {
  return <div className="table-wrap"><table><thead><tr><th>Email</th><th>Sites and payment</th><th>Registered</th></tr></thead><tbody>
    {users.map(user => <tr key={user.id}><td>{user.email}</td><td>{user.subscriptions?.length ? user.subscriptions.map(subscription => `${subscription.sites?.name ?? 'Site'} — ${subscription.payment_status ?? 'unknown'} (${subscription.plan ?? 'default'})`).join(', ') : 'No central subscription yet'}</td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr>)}
    {!users.length && <tr><td colSpan={3} className="empty"><strong>No shared-account users yet</strong><p>Users appear here after signing up through this dashboard’s shared Supabase Auth project.</p></td></tr>}
  </tbody></table></div>
}
