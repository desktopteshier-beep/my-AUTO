import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Portfolio Control Plane',
    short_name: 'Console',
    description: 'Deployments, monitoring, and billing in one place.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#1B1E25',
    theme_color: '#1B1E25',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
