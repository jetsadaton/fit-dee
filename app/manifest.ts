import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'โค้ชดี — Coachly',
    short_name: 'โค้ชดี',
    description: 'โค้ช AI ส่วนตัวด้านออกกำลังและโภชนาการ — พูดภาษาไทย',
    start_url: '/today',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0E0F12',
    theme_color: '#0E0F12',
    lang: 'th',
    categories: ['health', 'fitness'],
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    screenshots: [],
  };
}
