import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import EntryBootstrapProvider from "@/components/entry-bootstrap-provider";
import { SITE } from "@/lib/site";

const companyLogo = "/bms-logo.jpg";
const companyFavicon = "/favicon.svg";

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.companyName}`,
  description: `${SITE.name} by ${SITE.companyName}. ${SITE.slogan}`,
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
    "facebook-domain-verification": "1da7tqv44h2lu0wyv7vmm9o4eh9us6",
  },
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
