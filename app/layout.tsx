import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/CartContext';
import { WishlistProvider } from '@/lib/WishlistContext';
import LayoutShell from '@/components/LayoutShell';

import { syncCustomFavicon } from '@/lib/faviconSync';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Dhati',
    template: '%s | Dhati',
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/api/favicon', sizes: 'any' },
      { url: '/api/favicon', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/api/favicon',
    apple: '/api/favicon',
  },
  description: 'Shop authentic products, fashion, clothing, lifestyle and daily essentials in Bangladesh with cash on delivery.',
  keywords: 'Dhati, Bangladesh ecommerce, online store, fashion, clothing, saree, panjabi, shoes, kids',
  openGraph: {
    title: 'Dhati',
    description: 'Shop authentic collections, fashion, and lifestyle essentials in Bangladesh.',
    url: siteUrl,
    siteName: 'Dhati',
    locale: 'en_BD',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sync custom favicon if present in public/logo/fav.png
  syncCustomFavicon();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@100..800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/api/favicon" sizes="any" />
        <link rel="shortcut icon" href="/api/favicon" />
        <link rel="apple-touch-icon" href="/api/favicon" />
      </head>
      <body className="antialiased bg-white text-black min-h-screen">
        <CartProvider>
          <WishlistProvider>
            <LayoutShell>
              {children}
            </LayoutShell>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
