export const BACKEND = (process.env.API_BASE_URL || "").replace(/\/$/, "");

export function backendUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND}${p}`;
}

export async function proxyToBackend(req: Request, backendPath: string) {
  if (!BACKEND) {
    return new Response(
      JSON.stringify({ ok: false, error: "API_BASE_URL is not set in .env.local" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // Forward headers (Authorization is key)
  const headers = new Headers(req.headers);
  headers.set("content-type", "application/json");

  const url = backendUrl(backendPath);

  // Read body only if needed
  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  const body = hasBody ? await req.text() : undefined;

  const r = await fetch(url, {
    method,
    headers,
    body,
    // no cookies needed unless you decide cookie auth later
  });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}