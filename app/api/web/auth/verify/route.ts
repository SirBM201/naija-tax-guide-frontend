import { proxyToBackend } from "../../_proxy";

export async function POST(req: Request) {
  // backend assumed: POST /api/auth/verify
  return proxyToBackend(req, "/api/auth/verify");
}