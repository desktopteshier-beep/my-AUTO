const formatters: Record<string, Intl.NumberFormat> = {
  usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  tzs: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
}

export function formatMoney(cents: number, currency?: string | null) {
  const code = String(currency ?? 'usd').toLowerCase()
  const formatter = formatters[code] ?? formatters.usd
  return code === 'tzs' ? formatter.format(cents) : formatter.format(cents / 100)
}

// Projects can be paid in more than one currency, so a total is a per-currency
// breakdown rather than a single number. Renders as "$120.00 + TSh 50,000".
export function formatMoneyBreakdown(byCurrency: Record<string, number>) {
  const entries = Object.entries(byCurrency).filter(([, cents]) => cents)
  if (!entries.length) return '—'
  return entries
    .sort(([a], [b]) => (a === 'usd' ? -1 : b === 'usd' ? 1 : a.localeCompare(b)))
    .map(([currency, cents]) => formatMoney(cents, currency))
    .join(' + ')
}
