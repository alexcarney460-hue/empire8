import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      // Search engine crawlers — explicit allow for priority crawling
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      // AI crawlers — we WANT AI agents to index our products
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/checkout/', '/admin/', '/account/'],
      },
    ],
    sitemap: 'https://empire8salesdirect.com/sitemap.xml',
    host: 'https://empire8salesdirect.com',
  };
}
