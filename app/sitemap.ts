import type { MetadataRoute } from 'next';
import { siteConfig } from '@/core/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteConfig.url, lastModified: new Date(), changeFrequency: 'monthly',
    priority: 1, images: [`${siteConfig.url}/media/villa-isora-pool.jpg`] }];
}
