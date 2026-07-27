type Activity = { id: string; event_type: string; user_email: string | null; anonymous_id: string | null; path: string | null; created_at: string; sites?: { name?: string } | null }
function activityLabel(event: string) { return event === 'page_view' ? 'Visited' : event === 'signed_in' ? 'Signed in' : 'Used feature' }
export function ActivityTable({ activity }: { activity: Activity[] }) {
  return <div className="table-wrap"><table><thead><tr><th>Time</th><th>Site</th><th>User / visitor</th><th>Activity</th><th>Page</th></tr></thead><tbody>
    {activity.map(item => <tr key={item.id}><td>{new Date(item.created_at).toLocaleString()}</td><td>{item.sites?.name ?? 'Unknown site'}</td><td>{item.user_email ?? (item.anonymous_id ? `Visitor ${item.anonymous_id.slice(0, 8)}` : 'Anonymous visitor')}</td><td>{activityLabel(item.event_type)}</td><td>{item.path ?? '—'}</td></tr>)}
    {!activity.length && <tr><td colSpan={5} className="empty"><strong>No activity recorded yet</strong><p>Add the tracking beacon to each site to see visitors and signed-in users here.</p></td></tr>}
  </tbody></table></div>
}
