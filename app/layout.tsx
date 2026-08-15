import type { Metadata } from 'next'
import { Syne, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-syne',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CodeLearn — Learn to Code',
    template: '%s — CodeLearn',
  },
  description: 'Master C, C++, and Python through interactive, scaffolded lessons.',
  keywords: ['learn to code', 'C', 'C++', 'Python', 'programming courses', 'interactive coding'],
  openGraph: {
    title: 'CodeLearn — Learn to Code',
    description: 'Master C, C++, and Python through interactive, scaffolded lessons.',
    url: siteUrl,
    siteName: 'CodeLearn',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeLearn — Learn to Code',
    description: 'Master C, C++, and Python through interactive, scaffolded lessons.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#0d1117] text-[#e6edf3] antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
