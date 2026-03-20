import { proxyToBackend } from "../_proxy";

export async function POST(req: Request) {
  // backend assumed: POST /api/ask
  return proxyToBackend(req, "/api/ask");
}