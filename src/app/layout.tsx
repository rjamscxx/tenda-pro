import type { Metadata } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sizzle',
  description: 'All-in-one operating dashboard for restaurants and cafés.',
}

const VALID_THEMES = [
  'sage-dark', 'sage-light', 'espresso', 'citrus',
  'crimson', 'ocean', 'rose', 'ember', 'midnight',
  'harvest', 'jade', 'slate', 'terracotta', 'ivory',
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
      <body className="h-full">{children}</body>
    </html>
  )
}
