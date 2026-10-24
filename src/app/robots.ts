import type { MetadataRoute } from 'next';
import { siteUrl } from './site';

export default function robots(): MetadataRoute.Robots {
  return {
    // The content panel has nothing for search engines.
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
