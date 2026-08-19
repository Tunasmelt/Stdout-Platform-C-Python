import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stdout — Learn to Code',
    short_name: 'Stdout',
    description: 'Master C, C++, and Python through interactive, scaffolded lessons.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#0d1117',
    icons: [
      { src: '/manifest-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/manifest-icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/manifest-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
