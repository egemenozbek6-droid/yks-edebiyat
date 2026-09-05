import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

// Hem sans hem serif değişkenlerini tek ve tok modern sans fonta bağlıyoruz
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap'
})

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

const temaScripti = `
(function () {
  try {
    document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // fraunces yerine font-serif için de jakarta değişkenini veriyoruz; böylece bileşenlerde font-serif yazsa bile tırnaklı fonta düşemez
    <html lang="tr" className={`${jakarta.variable} bg-background font-sans`} style={{ ['--font-serif' as any]: 'var(--font-sans)' }} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaScripti }} />
      </head>
      <body className="antialiased font-sans font-medium selection:bg-sky-500/30 selection:text-sky-200">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
