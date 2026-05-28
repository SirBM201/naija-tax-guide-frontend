// app/ref/[refCode]/page.tsx
import ReferralHubPage from "@/components/referral-hub-page";

type PageProps = {
  params: Promise<{ refCode: string }> | { refCode: string };
};

export async function generateMetadata({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const refCode = String(resolved?.refCode || "").toUpperCase();

  return {
    title: `Naija Tax Guide Referral ${refCode}`,
    description: "Choose Website, WhatsApp, or Telegram to continue with Naija Tax Guide.",
  };
}

export default async function Page({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  return <ReferralHubPage refCode={resolved.refCode} />;
}
