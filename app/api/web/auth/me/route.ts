import { proxyToBackend } from "../../_proxy";

export async function GET(req: Request) {
  // backend assumed: GET /api/me
  return proxyToBackend(req, "/api/me");
}