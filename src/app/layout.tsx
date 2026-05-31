import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/layout/ServiceWorkerRegistrar'

// SF Pro is Apple-licensed and cannot be hosted via @font-face on the web.
// The standard approach is the Apple system-font stack: real SF Pro renders
// on macOS/iOS (where it ships as the OS UI font), and Windows/Android fall
// back to their closest system font (Segoe UI / Roboto). Stack lives in
// globals.css under --font-sans, applied to body.
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

// Inline pre-paint theme bootstrap. Two behaviors, picked by URL:
// • Landing (`/`): no cookie read, no cookie write — pick a RANDOM theme
//   on every visit so each load feels fresh. Each landing render samples
//   one of the 25 themes; great for marketing-page polish.
// • App (everywhere else): respect the sizzle-theme cookie set in Settings.
//   The owner's choice persists across sessions and never randomizes.
// Runs before the body paints; layout stays static + bf-cache friendly.
const THEME_INIT = `(function(){try{
  var p=location.pathname;
  if(p==='/'||p===''){
    var T=['sage-dark','sage-light','espresso','citrus','crimson','ocean','rose','ember','midnight','harvest','jade','slate','wasabi','trattoria','mariachi','imperial','saffron','diner','halo','boba','linen','lavender','cloud','mint','sand'];
    document.documentElement.setAttribute('data-theme',T[Math.floor(Math.random()*T.length)]);
    return;
  }
  var m=document.cookie.match(/(?:^|; )sizzle-theme=([^;]+)/);
  if(m){var v=decodeURIComponent(m[1]);if(/^[a-z][a-z0-9-]{0,30}$/.test(v))document.documentElement.setAttribute('data-theme',v);}else{document.documentElement.setAttribute('data-theme','ember');}
}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full`}
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
