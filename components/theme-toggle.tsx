'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle({ variant = 'compact' }: { variant?: 'compact' | 'full' } = {}) {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const saved = localStorage.getItem('control-plane-theme')
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved
    setDark(document.documentElement.dataset.theme !== 'light')
  }, [])
  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    localStorage.setItem('control-plane-theme', next ? 'dark' : 'light')
  }
  if (variant === 'full') {
    return <button className="theme-toggle theme-toggle-full" onClick={toggle} aria-label="Toggle color theme" data-mode={dark ? 'dark' : 'light'}>
      <span className="theme-toggle-thumb" aria-hidden="true">{dark ? '🌙' : '☀️'}</span>
      <span className="theme-toggle-label">{dark ? 'Dark' : 'Light'} mode</span>
    </button>
  }
  return <button className="theme-toggle" onClick={toggle} aria-label="Toggle color theme">{dark ? 'LIGHT' : 'DARK'}</button>
}
