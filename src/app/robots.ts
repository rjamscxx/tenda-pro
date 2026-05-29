import type { MetadataRoute } from 'next'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sizzle.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signup', '/login', '/legal/', '/m/'],
        disallow: [
          '/api/',
          '/auth/',
          '/onboarding',
          '/dashboard',
          '/sales',
          '/menu',
          '/expenses',
          '/inventory',
          '/reports',
          '/waste',
          '/employees',
          '/payroll',
          '/analytics',
          '/settings',
          '/pos',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
