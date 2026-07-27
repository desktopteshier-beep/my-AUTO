import { requireDashboardAdmin } from '@/lib/auth'
import { getSitesData, getProjectConnectionsData } from '@/lib/dashboard-data'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteSettingsTable } from '@/components/site-settings-table'
import { ProjectConnectionTable } from '@/components/project-connection-table'

export default async function SettingsPage() {
  const user = await requireDashboardAdmin()
  const [sites, projectConnections] = await Promise.all([getSitesData(), getProjectConnectionsData()])
  return <div className="page-enter">
    <section><div className="section-heading"><div><h2>Account & appearance</h2><p>Your admin identity and how the console looks.</p></div></div>
      <div className="settings-grid"><div className="settings-card">
        <div className="settings-row"><div><h3>Signed in as</h3><p className="muted">This dashboard is limited to the admin accounts in DASHBOARD_ADMIN_USER_IDS.</p></div><strong>{user.email}</strong></div>
        <div className="settings-row"><div><h3>Appearance</h3><p className="muted">Switch between light and dark. Saved to this browser.</p></div><ThemeToggle variant="full" /></div>
        <div className="settings-row"><div><h3>Session</h3><p className="muted">Sign out of the dashboard on this device.</p></div><a className="secondary" href="/api/auth/signout">Sign out</a></div>
      </div></div>
    </section>
    <section><div className="section-heading"><div><h2>Sites</h2><p>Rename a site, fix its domain, or copy its tracking key for the beacon script.</p></div></div><SiteSettingsTable sites={sites as any[]} /></section>
    <section><div className="section-heading"><div><h2>Project connections</h2><p>Connect a project's own Supabase project (URL + service role key) so its real signed-up users show up automatically when you add manual access — instead of typing an email blind. The key is encrypted before it's stored and never sent back to the browser.</p></div></div><ProjectConnectionTable projects={projectConnections} /></section>
  </div>
}
