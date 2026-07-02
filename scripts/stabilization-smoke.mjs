#!/usr/bin/env node

const baseUrl = (process.env.NTG_BASE_URL || "https://www.naijataxguides.com").replace(/\/$/, "");

const publicRoutes = [
  "/",
  "/pricing",
  "/about",
  "/privacy",
  "/terms",
  "/refund",
  "/data-deletion",
  "/support",
  "/contact",
  "/faq",
  "/safety",
  "/sources",
  "/startup-readiness",
  "/review",
];

const protectedRoutes = [
  "/dashboard",
  "/ask",
  "/channels",
  "/workspace",
  "/billing",
  "/plans",
  "/credits",
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function fetchRoute(route) {
  const url = `${baseUrl}${route}`;
  const res = await fetch(url, { redirect: "manual" });
  const text = await res.text().catch(() => "");
  return { route, url, status: res.status, location: res.headers.get("location") || "", text };
}

function hasWorkspaceSidebar(html) {
  return (
    html.includes("WORKSPACE") &&
    html.includes("Dashboard") &&
    html.includes("Channels") &&
    html.includes("Workspace") &&
    html.includes("Company Contact")
  );
}

async function checkPublicRoutes() {
  console.log(`Checking public routes on ${baseUrl}`);
  for (const route of publicRoutes) {
    const result = await fetchRoute(route);
    const redirectedToLogin = result.status >= 300 && result.status < 400 && result.location.includes("/login");
    if (redirectedToLogin) {
      fail(`${route} redirects to login (${result.location})`);
      continue;
    }
    if (result.status >= 400) {
      fail(`${route} returned HTTP ${result.status}`);
      continue;
    }
    if (route !== "/" && hasWorkspaceSidebar(result.text)) {
      fail(`${route} appears to expose the workspace sidebar`);
      continue;
    }
    console.log(`OK public ${route} (${result.status})`);
  }
}

async function checkProtectedRoutes() {
  console.log("Checking protected workspace routes as logged-out visitor");
  for (const route of protectedRoutes) {
    const result = await fetchRoute(route);
    const redirectsToLogin = result.status >= 300 && result.status < 400 && result.location.includes("/login");
    const rendersLogin = result.text.includes("/login") || result.text.toLowerCase().includes("sign in");
    if (!redirectsToLogin && !rendersLogin) {
      fail(`${route} did not clearly require login for logged-out access (HTTP ${result.status})`);
      continue;
    }
    console.log(`OK protected ${route} (${result.status})`);
  }
}

try {
  await checkPublicRoutes();
  await checkProtectedRoutes();
  if (process.exitCode) {
    console.error("Stabilization smoke test failed.");
  } else {
    console.log("Stabilization smoke test passed.");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
