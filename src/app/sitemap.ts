import type { MetadataRoute } from 'next';
import PRODUCTS from '@/lib/products';

const BASE = 'https://empire8salesdirect.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/catalog`,             lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/wholesale`,           lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/dispensary-signup`,    lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/affiliate`,           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`,             lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/commercial`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/track`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/llms.txt`,            lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${BASE}/catalog/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.88,
    images: p.images.map((img) =>
      img.startsWith('http') ? img : `${BASE}${img}`,
    ),
  }));

  return [...staticRoutes, ...productRoutes];
}
