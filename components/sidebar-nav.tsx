'use client'

import { usePathname } from 'next/navigation'

const items = [
  { href: '/', icon: '⌂', label: 'Overview' },
  { href: '/deploys', icon: '⇡', label: 'Deploys' },
  { href: '/monitoring', icon: '◉', label: 'Monitoring' },
  { href: '/users', icon: '♙', label: 'Users' },
  { href: '/billing', icon: '▣', label: 'Billing' },
  { href: '/settings', icon: '⚙', label: 'Settings' },
]

export function SidebarNav() {
  const pathname = usePathname()
  return <nav className="side-nav">
    {items.map(item => <a key={item.href} className={`nav-item${pathname === item.href ? ' active' : ''}`} href={item.href}><span>{item.icon}</span>{item.label}</a>)}
  </nav>
}

export const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/deploys': 'Deploys',
  '/monitoring': 'Monitoring',
  '/users': 'Users',
  '/billing': 'Billing',
  '/settings': 'Settings',
}
