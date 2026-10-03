import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wing-frontend.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/explore', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/trending', priority: 0.9, changeFrequency: 'hourly' as const },
    { path: '/search', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/waitlist', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/business', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/login', priority: 0.4, changeFrequency: 'yearly' as const },
    { path: '/register', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/copyright', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  return staticPages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}