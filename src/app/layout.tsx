import type { Metadata, Viewport } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/layout/ServiceWorkerRegistrar'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sizzle.app'
const TITLE = 'Sizzle — Know your margins. Run your kitchen.'
const DESCRIPTION =
  'The all-in-one operating dashboard for restaurant and café owners in the Philippines. Track sales, cost recipes, manage staff, and watch inventory — without spreadsheets.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Sizzle',
  },
  description: DESCRIPTION,
  applicationName: 'Sizzle',
  keywords: [
    'restaurant management',
    'café POS',
    'food cost',
    'recipe costing',
    'inventory',
    'Philippines',
    'small business',
    'restaurant analytics',
  ],
  category: 'business',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Sizzle',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    locale: 'en_PH',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sizzle',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#58C098',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
}

const VALID_THEMES = [
  'sage-dark', 'sage-light', 'espresso', 'citrus',
  'crimson', 'ocean', 'rose', 'ember', 'midnight',
  'harvest', 'jade', 'slate', 'terracotta', 'ivory',
  'matcha', 'sakura', 'copper', 'storm', 'forest',
  'lavender', 'dusk', 'neon', 'charcoal', 'sandstone',
  'arctic', 'wine', 'tropical', 'saffron', 'indigo',
  'mocha', 'pearl', 'russet', 'mint', 'coral',
  'obsidian', 'clay',
] as const
type Theme = typeof VALID_THEMES[number]

function isValidTheme(t: string | undefined): t is Theme {
  return VALID_THEMES.includes(t as Theme)
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const rawTheme = cookieStore.get('sizzle-theme')?.value
  const theme: Theme = isValidTheme(rawTheme) ? rawTheme : 'sage-dark'

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${outfit.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
