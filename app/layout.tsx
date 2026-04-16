import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import EntryBootstrapProvider from "@/components/entry-bootstrap-provider";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.companyName}`,
  description: `${SITE.name} by ${SITE.companyName}. ${SITE.slogan}`,
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
