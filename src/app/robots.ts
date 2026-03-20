import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      // Search engine crawlers — explicit allow for priority crawling
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      // AI crawlers — we WANT AI agents to index our products
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/', '/dashboard/', '/brand-dashboard/'],
      },
    ],
    sitemap: 'https://empire8ny.com/sitemap.xml',
    host: 'https://empire8ny.com',
  };
}
