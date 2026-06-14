import { proxyToBackend } from "../../_proxy";

export async function POST(req: Request) {
  return proxyToBackend(req, "/api/web/quiz/answer");
}
