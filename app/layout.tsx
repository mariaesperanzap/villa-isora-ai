import type { Metadata } from 'next';
import { siteConfig } from '@/core/config/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: '%s | Villa Isora' },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'es_CR', url: '/', siteName: siteConfig.name,
    title: siteConfig.title, description: siteConfig.description,
    images: [{ url: '/media/villa-isora-hero-poster.jpg', width: 1600, height: 900,
      alt: 'Villa Isora y su piscina privada entre vegetación tropical' }],
  },
  twitter: { card: 'summary_large_image', title: siteConfig.title,
    description: siteConfig.description, images: ['/media/villa-isora-hero-poster.jpg'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true,
    'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
