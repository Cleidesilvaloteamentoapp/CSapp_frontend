import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { NetworkStatus } from '@/components/pwa/NetworkStatus';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Sistema Imobiliária - Gestão de Loteamentos',
    template: '%s | Sistema Imobiliária',
  },
  description: 'Sistema de gestão para corretora de loteamentos',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['imobiliária', 'loteamentos', 'gestão', 'boletos', 'serviços'],
  authors: [{ name: 'CSapp' }],
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
    { rel: 'icon', url: '/favicon.ico' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Imobiliária',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#3B82F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Imobiliária" />
      </head>
      <body className={inter.className}>
        <Providers>
          <OfflineIndicator />
          {children}
          <InstallPrompt />
          <UpdatePrompt />
          <NetworkStatus />
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
