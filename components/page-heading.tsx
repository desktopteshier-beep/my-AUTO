'use client'

import { usePathname } from 'next/navigation'
import { pageTitles } from './sidebar-nav'

export function PageHeading() {
  const pathname = usePathname()
  return <h1>{pageTitles[pathname] ?? 'Overview'}</h1>
}
