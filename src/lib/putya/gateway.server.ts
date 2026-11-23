// Server-only Lovable AI call for "Ask Putya". Streams, then returns final text.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const RUN_ID = "X-Lovable-AIG-Run-ID";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";
export const PUTYA_MODEL = "openai/gpt-6-astra";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
}

export class PutyaAiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function statusOf(e: unknown): number {
  const any = e as { statusCode?: number; status?: number; cause?: { statusCode?: number } };
  return any?.statusCode ?? any?.status ?? any?.cause?.statusCode ?? 500;
}

export async function askPutyaModel(instructions: string, messages: ModelMessage[], signal?: AbortSignal): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new PutyaAiError(401, "Putya's uplink isn't configured.");
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  let failure: unknown = null;
  const result = streamText({
    model: provider.responses(PUTYA_MODEL),
    instructions,
    messages,
    maxRetries: 1,
    ...(signal ? { abortSignal: signal } : {}),
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  let text = "";
  for await (const part of result.textStream) text += part;
  if (failure && !text) {
    const status = statusOf(failure);
    if (status === 402) throw new PutyaAiError(402, "Putya's out of AI credits for now. Try again later.");
    if (status === 429) throw new PutyaAiError(429, "Putya's swamped. Give her a minute.");
    if (status === 403) throw new PutyaAiError(403, "Putya's AI access is blocked right now.");
    throw new PutyaAiError(status, "Putya lost the signal. Try again.");
  }
  return text.trim();
}
