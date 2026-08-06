'use client'

import { usePathname } from 'next/navigation'

const groups = [
  { label: 'Main navigation', items: [
    { href: '/', icon: '⌂', label: 'Overview' },
    { href: '/deploys', icon: '⇡', label: 'Deploys' },
    { href: '/monitoring', icon: '◉', label: 'Monitoring' },
  ] },
  { label: 'Accounts', items: [
    { href: '/users', icon: '♙', label: 'Users' },
    { href: '/billing', icon: '▣', label: 'Billing' },
  ] },
  { label: 'Console', items: [
    { href: '/settings', icon: '⚙', label: 'Settings' },
  ] },
]

export function SidebarNav() {
  const pathname = usePathname()
  return <nav className="side-nav">
    {groups.map(group => <div key={group.label}><p className="nav-group-label">{group.label}</p>{group.items.map(item => <a key={item.href} className={`nav-item${pathname === item.href ? ' active' : ''}`} href={item.href}><span>{item.icon}</span>{item.label}</a>)}</div>)}
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
