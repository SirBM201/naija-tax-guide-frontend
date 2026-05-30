import { redirect } from "next/navigation";

export default async function ShortPromoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolved = await params;
  redirect(`/promo/${encodeURIComponent(resolved.code || "")}`);
}
