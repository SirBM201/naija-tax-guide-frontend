import { proxyToBackend } from "../../_proxy";

export async function POST(req: Request) {
  // backend assumed: POST /api/auth/start
  return proxyToBackend(req, "/api/auth/start");
}