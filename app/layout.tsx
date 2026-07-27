import './styles.css'
import './dashboard-enhancements.css'
import '../components/project-table.css'
import './status-neutral.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Portfolio Control Plane', description: 'Deployments, monitoring, and billing in one place.' }
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" data-theme="dark"><body>{children}</body></html> }
