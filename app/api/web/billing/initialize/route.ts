import { proxyToBackend } from "../../_proxy";

export async function POST(req: Request) {
  // backend assumed: POST /api/billing/initialize
  return proxyToBackend(req, "/api/billing/initialize");
}