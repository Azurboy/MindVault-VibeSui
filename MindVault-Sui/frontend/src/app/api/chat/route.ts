/**
 * MindVault AI Chat API Route
 *
 * Stateless Enclave - No data persistence
 * 1. READ: Receive decrypted plaintext from frontend
 * 2. PROCESS: Call LLM for inference
 * 3. FORGET: Request ends, memory released, no disk persistence
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Anthropic API configuration
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  provider: "openai" | "claude";
  history?: ChatMessage[];
}

async function callOpenAI(message: string, history: ChatMessage[] = []): Promise<string> {
  const openai = getOpenAIClient();

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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

async function callClaude(message: string, history: ChatMessage[] = []): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  const messages = [
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
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

    // 2. PROCESS: Call appropriate LLM
    let response: string;

    if (provider === "claude") {
      response = await callClaude(message, history);
    } else {
      response = await callOpenAI(message, history);
    }

    // 3. FORGET: Return response
    // After this function returns, all local variables (message, response, history)
    // are garbage collected. Serverless functions have no persistent storage.
    // No database writes, no log persistence, no cache storage.

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
