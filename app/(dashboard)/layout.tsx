import { requireDashboardAdmin } from '@/lib/auth'
import { getNavSearchData } from '@/lib/dashboard-data'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardTools } from '@/components/dashboard-tools'
import { SidebarNav } from '@/components/sidebar-nav'
import { PageHeading } from '@/components/page-heading'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireDashboardAdmin()
  const { projects, users } = await getNavSearchData()
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="product" href="/"><img className="logo-mark" src="/system-icon.svg" alt="" /><span>Automation<br />console</span></a>
      <SidebarNav />
      <div className="sidebar-bottom"><ThemeToggle /><a href="/api/auth/signout">Sign out</a></div>
    </aside>
    <main>
      <header className="topbar"><PageHeading /><DashboardTools projects={projects} users={users} /></header>
      {children}
    </main>
  </div>
}
