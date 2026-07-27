import './styles.css'
import './dashboard-enhancements.css'
import '../components/project-table.css'
import './status-neutral.css'
import './subscription-access.css'
import './liquid-glass.css'
import type { Metadata, Viewport } from 'next'
import { ServiceWorkerRegister } from '@/components/service-worker'

export const metadata: Metadata = { title: 'Portfolio Control Plane', description: 'Deployments, monitoring, and billing in one place.', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Console' } }
export const viewport: Viewport = { themeColor: '#1B1E25' }
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" data-theme="dark"><body>{children}<ServiceWorkerRegister /></body></html> }
