import { proxyToBackend } from "../../_proxy";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return proxyToBackend(req, `/api/web/quiz/question${url.search || ""}`);
}
