const hues = ['--accent', '--badge-blue', '--badge-amber', '--badge-rose', '--healthy']

export function hueFor(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hues[hash % hues.length]
}

function hueStyle(hue: string) {
  return { background: `color-mix(in srgb, var(${hue}) 20%, transparent)`, color: `var(${hue})` }
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(/[@.\s]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?'
  return <span className="avatar" style={hueStyle(hueFor(name))} aria-hidden="true">{initials}</span>
}

export function Tag({ value }: { value: string }) {
  return <span className="tag" style={hueStyle(hueFor(value))}>{value}</span>
}
