// lib/chat_api.ts
import { apiPost } from "@/lib/http";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  ts: number; // epoch ms
};

export type ChatRequest = {
  messages: Array<{ role: ChatRole; content: string }>;
};

export type ChatResponse = {
  ok: boolean;
  answer?: string;
  message?: string;
  error?: string;
  // optional: backend may return extra fields
  [k: string]: any;
};

/**
 * Backend route placeholder:
 * - Update CHAT_ENDPOINT once your backend endpoint is finalized.
 * - Keep payload stable: { messages: [{role, content}, ...] }
 */
export const CHAT_ENDPOINT = "/api/chat"; // <-- change later if needed

export async function sendChatToBackend(
  req: ChatRequest,
  token: string | null
): Promise<ChatResponse> {
  return apiPost<ChatResponse>(CHAT_ENDPOINT, req, token);
}

/**
 * Bypass-mode response generator (UI preview)
 */
export function mockAssistantReply(userText: string): string {
  const trimmed = userText.trim();
  if (!trimmed) return "Please type a question so I can help.";

  // Simple “professional” mock reply
  return (
    `BYPASS MODE (UI Preview): I received your message:\n\n` +
    `"${trimmed}"\n\n` +
    `When backend chat is connected, you'll get a real tax-guidance response here with full context from the conversation above.`
  );
}
