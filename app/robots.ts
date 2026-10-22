import type { MetadataRoute } from 'next';
import { siteConfig } from '@/core/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/listings',
      '/reservations', '/messages', '/settings', '/sign-in'] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
