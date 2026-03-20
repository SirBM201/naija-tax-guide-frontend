import { backendUrl, BACKEND } from "../../_proxy";

export async function GET(req: Request) {
  if (!BACKEND) {
    return new Response(JSON.stringify({ ok: false, error: "API_BASE_URL not set" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const u = new URL(req.url);
  const reference = u.searchParams.get("reference") || "";
  const url = backendUrl(`/api/billing/verify?reference=${encodeURIComponent(reference)}`);

  const headers = new Headers(req.headers);
  headers.set("content-type", "application/json");

  const r = await fetch(url, { method: "GET", headers });
  const text = await r.text();

  return new Response(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}