import { MetadataRoute } from 'next'

/**
 * Robots.txt configuration
 * Allows all crawlers and points to sitemap
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/dashboard/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
