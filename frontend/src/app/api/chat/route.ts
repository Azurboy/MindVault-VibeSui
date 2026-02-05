/**
 * MindVault AI Chat API Route
 *
 * Stateless Enclave - No data persistence
 * 1. READ: Receive decrypted plaintext from frontend
 * 2. PROCESS: Call LLM for inference
 * 3. FORGET: Request ends, memory released, no disk persistence
 *
 * Supports custom AI providers via OpenAI-compatible protocol.
 * User provides their own baseURL, apiKey, and model.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

interface ChatRequest {
  message: string;
  provider: AIProviderConfig;
  history?: ChatMessage[];
}

/**
 * Call any OpenAI-compatible API
 * Most AI providers (OpenAI, DeepSeek, Moonshot, local Ollama) use this format
 */
async function callOpenAICompatible(
  config: AIProviderConfig,
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const client = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful AI assistant. Be concise and helpful.",
    },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const completion = await client.chat.completions.create({
    model: config.model,
    messages,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

/**
 * Call Anthropic Claude API (different format from OpenAI)
 */
async function callClaude(
  config: AIProviderConfig,
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const messages = [
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch(`${config.baseURL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0]?.text || "No response generated.";
}

/**
 * Detect if this is an Anthropic Claude endpoint
 */
function isClaudeEndpoint(baseURL: string): boolean {
  return baseURL.includes("anthropic.com");
}

export async function POST(request: NextRequest) {
  try {
    // 1. READ: Parse request body
    const body: ChatRequest = await request.json();
    const { message, provider, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!provider || !provider.baseURL || !provider.apiKey || !provider.model) {
      return NextResponse.json(
        { error: "AI provider configuration is required (baseURL, apiKey, model)" },
        { status: 400 }
      );
    }

    // 2. PROCESS: Call appropriate LLM based on endpoint type
    let response: string;

    if (isClaudeEndpoint(provider.baseURL)) {
      // Use Anthropic-specific API format
      response = await callClaude(provider, message, history);
    } else {
      // Use OpenAI-compatible format (works for OpenAI, DeepSeek, Moonshot, Ollama, etc.)
      response = await callOpenAICompatible(provider, message, history);
    }

    // 3. FORGET: Return response
    // After this function returns, all local variables (message, response, history, provider)
    // are garbage collected. Serverless functions have no persistent storage.
    // No database writes, no log persistence, no cache storage.
    // The API key is used only for this request and never stored.

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Disable body parsing for streaming (future enhancement)
export const runtime = "nodejs";
