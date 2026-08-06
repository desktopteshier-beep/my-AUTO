import { formatMoneyBreakdown } from '@/lib/currency'
import type { ProjectGains } from '@/lib/dashboard-data'

function sumBreakdowns(rows: ProjectGains[], key: 'subscriptionByCurrency' | 'manualByCurrency' | 'totalByCurrency') {
  const totals: Record<string, number> = {}
  for (const row of rows) for (const [currency, cents] of Object.entries(row[key])) totals[currency] = (totals[currency] ?? 0) + cents
  return totals
}

export function ProjectGainsBoard({ rows }: { rows: ProjectGains[] }) {
  const totalMrr = sumBreakdowns(rows, 'subscriptionByCurrency')
  const totalManual = sumBreakdowns(rows, 'manualByCurrency')
  const totalCombined = sumBreakdowns(rows, 'totalByCurrency')
  const atRisk = rows.reduce((n, r) => n + r.subscriptionAtRisk + r.manualAtRisk, 0)

  return <>
    <section className="metrics" aria-label="Revenue metrics">
      <article><span>Subscription MRR</span><b>{formatMoneyBreakdown(totalMrr)}</b></article>
      <article><span>Manual access revenue</span><b>{formatMoneyBreakdown(totalManual)}</b></article>
      <article><span>Total gained</span><b>{formatMoneyBreakdown(totalCombined)}</b></article>
      <article><span>At risk</span><b className={atRisk ? 'warning-number' : ''}>{atRisk || '—'}</b></article>
    </section>
    <div className="table-wrap">
      <table>
        <thead><tr><th>Project</th><th>Subscribers</th><th>Subscription revenue</th><th>Manual access</th><th>Manual revenue</th><th>Total gained</th><th>At risk</th></tr></thead>
        <tbody>
          {rows.map(row => {
            const rowAtRisk = row.subscriptionAtRisk + row.manualAtRisk
            return <tr key={row.siteName}>
              <td><strong>{row.siteName}</strong></td>
              <td className="numeric">{row.subscriptionActive || '—'}</td>
              <td className="numeric">{formatMoneyBreakdown(row.subscriptionByCurrency)}</td>
              <td className="numeric">{row.manualActive || '—'}</td>
              <td className="numeric">{formatMoneyBreakdown(row.manualByCurrency)}</td>
              <td className="numeric"><strong>{formatMoneyBreakdown(row.totalByCurrency)}</strong></td>
              <td className={rowAtRisk ? 'warning-number numeric' : 'numeric'}>{rowAtRisk || '—'}</td>
            </tr>
          })}
          {!rows.length && <tr><td colSpan={7} className="empty"><strong>No revenue yet</strong><p>Gains appear here once subscriptions or manual access are active.</p></td></tr>}
        </tbody>
      </table>
    </div>
  </>
}
