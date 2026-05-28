import { redirect } from "next/navigation";

type RouteParams = {
  code?: string;
};

type PageProps = {
  params: Promise<RouteParams>;
};

/**
 * Smart referral short-link route.
 *
 * Keep only ONE dynamic folder under app/r:
 *   app/r/[code]/page.tsx
 *
 * Delete this duplicate if present:
 *   app/r/[refCode]/page.tsx
 *
 * This route redirects the short public link:
 *   /r/NTGR6RKUG
 *
 * to the full referral hub page:
 *   /ref/NTGR6RKUG
 */
export default async function ReferralShortLinkPage({ params }: PageProps) {
  const resolvedParams = await params;
  const code = String(resolvedParams?.code || "").trim();

  if (!code) {
    redirect("/signup");
  }

  redirect(`/ref/${encodeURIComponent(code)}`);
}
