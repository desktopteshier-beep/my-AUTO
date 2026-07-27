type Subscription = { plan?: string; payment_status?: string; sites?: { name?: string } | null }
type RegisteredUser = { id: string; email: string; created_at: string; subscriptions?: Subscription[] | null }

export function RegisteredUsersTable({ users, usageDays }: { users: RegisteredUser[]; usageDays?: Record<string, number> }) {
  return <div className="table-wrap"><table><thead><tr><th>Email</th><th>Sites and payment</th><th>Days used</th><th>Registered</th></tr></thead><tbody>
    {users.map(user => { const days = usageDays?.[user.email.toLowerCase()] ?? 0; return <tr key={user.id}><td>{user.email}</td><td>{user.subscriptions?.length ? user.subscriptions.map(subscription => `${subscription.sites?.name ?? 'Site'} — ${subscription.payment_status ?? 'unknown'} (${subscription.plan ?? 'default'})`).join(', ') : 'No central subscription yet'}</td><td className="numeric">{days ? `${days} day${days === 1 ? '' : 's'}` : '—'}</td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr> })}
    {!users.length && <tr><td colSpan={4} className="empty"><strong>No shared-account users yet</strong><p>Users appear here after signing up through this dashboard’s shared Supabase Auth project.</p></td></tr>}
  </tbody></table></div>
}
