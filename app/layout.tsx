import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import EntryBootstrapProvider from "@/components/entry-bootstrap-provider";
import { SITE } from "@/lib/site";

const companyLogo = "/bms-logo.jpg";
const companyFavicon = "/favicon.svg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  title: `${SITE.name} | ${SITE.companyName}`,
  description: `${SITE.name} by ${SITE.companyName}. ${SITE.slogan}`,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: companyFavicon, type: "image/svg+xml", sizes: "any" },
      { url: companyLogo, type: "image/jpeg", sizes: "512x512" },
    ],
    shortcut: [companyFavicon],
    apple: [
      { url: companyLogo, type: "image/jpeg", sizes: "180x180" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": SITE.name,
    "facebook-domain-verification": "1da7tqv44h2lu0wyv7vmm9o4eh9us6",
  },
};

export const viewport: Viewport = {
  themeColor: "#050816",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <EntryBootstrapProvider />
          {children}
        </Providers>
      </body>
    </html>
  );
}
