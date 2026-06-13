import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/layout/ServiceWorkerRegistrar'

// Geist Sans is the UI face — clean, modern, ownable without being loud, and a
// perfect pair with Geist Mono (used for all numbers). The Apple system stack
// stays as the fallback in globals.css's --font-sans, so SF Pro / Segoe still
// render if the web font is slow.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'], display: 'swap' })

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tenda.ph'
const TITLE = 'Tenda — Know your margins. Run your kitchen.'
const DESCRIPTION =
  'The all-in-one operating dashboard for restaurant and café owners in the Philippines. Track sales, cost recipes, manage staff, and watch inventory — without spreadsheets.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Tenda',
  },
  description: DESCRIPTION,
  applicationName: 'Tenda',
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
    siteName: 'Tenda',
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
    title: 'Tenda',
  },
  icons: {
    icon: '/api/pwa-icon?size=192',
    apple: [{ url: '/api/pwa-icon?size=180', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
}

// Inline pre-paint theme bootstrap. Two behaviors, picked by URL:
// • Landing (`/`): default to ember — brand-aligned warm tone. The on-page
//   theme picker still lets visitors browse other themes for the session,
//   but no cookie write happens so we never persist a landing pick.
// • App (everywhere else): respect the sizzle-theme cookie set in Settings.
//   The owner's choice persists across sessions; default is ember.
// Runs before the body paints; layout stays static + bf-cache friendly.
const THEME_INIT = `(function(){try{
  var p=location.pathname;
  if(p==='/'||p===''){
    document.documentElement.setAttribute('data-theme','ember');
    return;
  }
  var m=document.cookie.match(/(?:^|; )sizzle-theme=([^;]+)/);
  if(m){var v=decodeURIComponent(m[1]);if(/^[a-z][a-z0-9-]{0,30}$/.test(v))document.documentElement.setAttribute('data-theme',v);}else{document.documentElement.setAttribute('data-theme','ember');}
}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="h-full">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
