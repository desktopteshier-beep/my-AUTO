type Access = { id: string; email: string; plan: string; payment_status: string; access_override: string; sites?: { name?: string } }
export function ManualAccessTable({ entries }: { entries: Access[] }) {
  return <div className="table-wrap"><table><thead><tr><th>User email</th><th>Project</th><th>Plan</th><th>Payment</th><th>Access</th></tr></thead><tbody>{entries.map(item => <tr key={item.id}><td>{item.email}</td><td>{item.sites?.name}</td><td>{item.plan}</td><td>{item.payment_status}</td><td>{item.access_override === 'paused' ? 'Paused' : 'Allowed by payment'}</td></tr>)}{!entries.length && <tr><td colSpan={5} className="empty"><strong>No manual access records</strong><p>Add a user above to control access for an existing project.</p></td></tr>}</tbody></table></div>
}
