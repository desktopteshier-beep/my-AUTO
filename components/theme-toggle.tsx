'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
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
  return <button className="theme-toggle" onClick={toggle} aria-label="Toggle color theme">{dark ? 'LIGHT' : 'DARK'}</button>
}
