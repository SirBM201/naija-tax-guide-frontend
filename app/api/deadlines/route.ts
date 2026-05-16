import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

function backendBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/$/, "");
}

function copyRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);

  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  const xAuthToken = req.headers.get("x-auth-token");
  if (xAuthToken) headers.set("X-Auth-Token", xAuthToken);

  const xDebug = req.headers.get("x-debug");
  if (xDebug) headers.set("X-Debug", xDebug);

  return headers;
}

async function proxyDeadlines(req: NextRequest): Promise<NextResponse> {
  const incomingUrl = new URL(req.url);
  const backendUrl = new URL(`${backendBaseUrl()}/api/deadlines`);
  backendUrl.search = incomingUrl.search;

  const method = req.method.toUpperCase();
  const headers = copyRequestHeaders(req);

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const raw = await req.text();
    body = raw || undefined;
    if (body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  try {
    const res = await fetch(backendUrl.toString(), {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const text = await res.text();
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", res.headers.get("content-type") || "application/json");

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("Set-Cookie", setCookie);

    return new NextResponse(text, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "deadlines_proxy_failed",
        message: error?.message || "Unable to reach backend deadlines API.",
        backend_url: backendUrl.toString(),
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyDeadlines(req);
}

export async function POST(req: NextRequest) {
  return proxyDeadlines(req);
}

export async function PUT(req: NextRequest) {
  return proxyDeadlines(req);
}

export async function PATCH(req: NextRequest) {
  return proxyDeadlines(req);
}

export async function DELETE(req: NextRequest) {
  return proxyDeadlines(req);
}
