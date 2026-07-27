'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './project-form.module.css'

const fields = [
  ['siteName', 'Site name', 'My shop', true], ['domain', 'Domain', 'myshop.com', true],
  ['name', 'Project name', 'My shop website', true], ['githubOwner', 'GitHub owner', 'desktopteshier-beep', true],
  ['githubRepo', 'GitHub repository', 'my-shop', true], ['monitoringEndpoint', 'Health URL', 'https://myshop.com/api/health', true],
  ['monitoringCheckId', 'Better Uptime monitor ID', '123456', false], ['sentryProjectSlug', 'Sentry project slug', 'my-shop', false],
  ['awsRegion', 'AWS region', 'eu-west-1', false],
] as const

export default function NewProjectPage() {
  const router = useRouter(); const [target, setTarget] = useState('vercel'); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const response = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, deployTarget: target }) })
    const result = await response.json(); setSaving(false)
    if (!response.ok) return setMessage(result.error ?? 'Unable to save project.')
    router.push('/'); router.refresh()
  }
  return <main className={styles.page}>
    <header className={styles.topbar}><a href="/">← Back to overview</a><strong>Add project</strong></header>
    <div className={styles.content}><p className={styles.eyebrow}>Project inventory</p><h1>Add a website, app, or backend</h1><p className={styles.intro}>Add the service once. Its deployment, uptime, error, and billing data will be shown together in your overview.</p>
      <form className={styles.form} onSubmit={submit}>
        <section><h2>Basic details</h2><div className={styles.grid}>{fields.slice(0, 3).map(([key, label, placeholder, required]) => <label key={key}>{label}<input required={required} name={key} placeholder={placeholder} /></label>)}</div></section>
        <section><h2>Source and deployment</h2><div className={styles.grid}>{fields.slice(3, 5).map(([key, label, placeholder, required]) => <label key={key}>{label}<input required={required} name={key} placeholder={placeholder} /></label>)}<label>Deployment target<select value={target} onChange={e => setTarget(e.target.value)}><option value="vercel">Vercel frontend</option><option value="aws_lambda">AWS Lambda</option><option value="aws_ecs">AWS ECS</option></select></label><label className={target === 'vercel' ? styles.dimmed : ''}>AWS region <span>(AWS only)</span><input name="awsRegion" disabled={target === 'vercel'} placeholder="eu-west-1" /></label></div></section>
        <section><h2>Monitoring</h2><div className={styles.grid}>{fields.slice(5, 8).map(([key, label, placeholder, required]) => <label key={key}>{label}<input required={required} name={key} placeholder={placeholder} /></label>)}</div></section>
        {message && <p className={styles.error}>{message}</p>}<div className={styles.actions}><a href="/">Cancel</a><button disabled={saving}>{saving ? 'Saving…' : 'Add project'}</button></div>
      </form>
    </div>
  </main>
}
