import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { BrandingProvider } from "@/contexts/branding-context";
import { PRE_PAINT_SCRIPT } from "@/lib/branding/storage";
import { ErrorOverlayProvider } from "@/components/debug/error-overlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// NOTE: no `icons` and no `manifest` here on purpose. BrandingProvider owns
// those <link> tags at runtime so they can follow each company, and React must
// not also be managing them — mixing the two crashes the commit phase.
export const metadata: Metadata = {
  title: "CSApp — Gestão de Loteamentos",
  description: "Sistema completo de gestão imobiliária com foco em loteamentos, clientes, financeiro e serviços",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CSApp",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  keywords: ["loteamentos", "gestão imobiliária", "clientes", "financeiro", "boletos", "CSApp"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2C3E50" },
    { media: "(prefers-color-scheme: dark)", color: "#2C3E50" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Replays the cached company palette before the first paint, so a
            branded tenant never flashes the platform colours on load. */}
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorOverlayProvider>
          <AuthProvider>
            <BrandingProvider>
              {children}
              <Toaster richColors position="top-right" />
            </BrandingProvider>
          </AuthProvider>
        </ErrorOverlayProvider>
      </body>
    </html>
  );
}
