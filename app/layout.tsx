import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "NaijaTax Guide",
  description: "NaijaTax Guide Web Portal",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}