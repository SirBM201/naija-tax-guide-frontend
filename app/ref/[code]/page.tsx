// app/ref/[code]/page.tsx
import ReferralHubPage from "@/components/referral-hub-page";

type PageProps = {
  params: Promise<{ code: string }> | { code: string };
};

export async function generateMetadata({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const refCode = String(resolved?.code || "").toUpperCase();

  return {
    title: `Naija Tax Guide Referral ${refCode}`,
    description: "Choose Website, WhatsApp, or Telegram to continue with Naija Tax Guide.",
  };
}

export default async function Page({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  return <ReferralHubPage refCode={resolved.code} />;
}
