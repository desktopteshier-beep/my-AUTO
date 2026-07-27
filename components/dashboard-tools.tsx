'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = { id: string; name: string; domain?: string; email?: string }
export function DashboardTools({ projects, users }: { projects: Item[]; users: Item[] }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const [toast, setToast] = useState('')
  useEffect(() => { const listener = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true) } if (event.key === 'Escape') setOpen(false) }; addEventListener('keydown', listener); return () => removeEventListener('keydown', listener) }, [])
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 2800); return () => clearTimeout(id) }, [toast])
  const results = useMemo(() => { const q = query.toLowerCase().trim(); const all = [...projects.map(p => ({ ...p, kind: 'Project' })), ...users.map(u => ({ ...u, name: u.email ?? u.name, kind: 'User' }))]; return q ? all.filter(item => `${item.name} ${item.domain ?? ''}`.toLowerCase().includes(q)).slice(0, 8) : all.slice(0, 8) }, [projects, users, query])
  return <><div className="actions"><button className="secondary command-button" onClick={() => setOpen(true)}>Search <kbd>⌘ K</kbd></button><button className="secondary" onClick={() => { router.refresh(); setToast('Dashboard refreshed') }}>Refresh</button><a className="primary action-link" href="/projects/new">Add project</a></div>{open && <div className="palette-backdrop" onMouseDown={() => setOpen(false)}><div className="palette" onMouseDown={event => event.stopPropagation()}><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects, users, or pages…" /><div className="palette-label">Quick jump</div><a href="/">Overview</a><a href="#projects">Projects</a><a href="#users">Users and billing</a><div className="palette-label">Results</div>{results.map(item => <button key={`${item.kind}-${item.id}`} onClick={() => { setOpen(false); location.hash = item.kind === 'Project' ? 'projects' : 'users' }}><span>{item.name}</span><small>{item.kind}{item.domain ? ` · ${item.domain}` : ''}</small></button>)}{!results.length && <p className="palette-empty">No matching projects or users.</p>}</div></div>}{toast && <div className="toast"><span>✓</span>{toast}</div>}</>
}
