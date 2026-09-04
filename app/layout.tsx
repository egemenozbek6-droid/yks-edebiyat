import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'] })

export const metadata: Metadata = {
  title: 'EdebiKart: YKS Yazar Eser & Düello',
  description: 'EZBERLEME, NOKTA ATIŞI YAP! 🎯 — YKS/AYT edebiyat yazar-eser ezber uygulaması.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0F172A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`${jakarta.variable} ${fraunces.variable} bg-background`} suppressHydrationWarning>
      <body className="antialiased font-sans">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
