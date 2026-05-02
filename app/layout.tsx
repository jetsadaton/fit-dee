import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-sans-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Coachly · โค้ชดี',
  description: 'โค้ช AI ส่วนตัวในมือคุณ — แชทกับโค้ชดี บอกว่ากินอะไร เราจัดแผนกินและออกกำลังให้พอดีตัว',
  applicationName: 'โค้ชดี',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'โค้ชดี',
  },
};

export const viewport: Viewport = {
  themeColor: '#0E0F12',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${inter.variable} ${notoSansThai.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
