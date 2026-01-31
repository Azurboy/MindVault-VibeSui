"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Lock, AlertCircle } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEncryption } from "@/hooks/useEncryption";
import { useVault } from "@/hooks/useVault";
import { uploadToWalrus } from "@/lib/walrus";
import { toBase64 } from "@/lib/encryption";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  encrypted?: boolean;
}

type Provider = "openai" | "claude";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("openai");
  const [saveToWalrus, setSaveToWalrus] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const account = useCurrentAccount();
  const { encrypt, isInitialized, initialize, isInitializing } = useEncryption();
  const { currentVault, storeBlob } = useVault();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize encryption when component mounts
  useEffect(() => {
    if (account && !isInitialized && !isInitializing) {
      initialize();
    }
  }, [account, isInitialized, isInitializing, initialize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save to Walrus if enabled and vault exists
      if (saveToWalrus && currentVault && isInitialized) {
        try {
          const { ciphertext, iv } = await encrypt(input);
          const result = await uploadToWalrus(ciphertext);
          const blobIdBytes = new TextEncoder().encode(result.blobId);
          await storeBlob(blobIdBytes, 0, iv);
          userMessage.encrypted = true;
        } catch (err) {
          console.error("Failed to save to Walrus:", err);
        }
      }

      // Call AI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          provider,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant response to Walrus
      if (saveToWalrus && currentVault && isInitialized) {
        try {
          const { ciphertext, iv } = await encrypt(data.response);
          const result = await uploadToWalrus(ciphertext);
          const blobIdBytes = new TextEncoder().encode(result.blobId);
          await storeBlob(blobIdBytes, 0, iv);
          assistantMessage.encrypted = true;
        } catch (err) {
          console.error("Failed to save response to Walrus:", err);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Lock className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p>Connect your Sui wallet to start a private AI conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Provider Selection */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">AI Provider:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setProvider("openai")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                provider === "openai"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              OpenAI
            </button>
            <button
              onClick={() => setProvider("claude")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                provider === "claude"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Claude
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToWalrus}
              onChange={(e) => setSaveToWalrus(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
            />
            <Lock className="w-4 h-4" />
            Save encrypted to Walrus
          </label>
        </div>
      </div>

      {/* Encryption Status */}
      {!isInitialized && (
        <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border-b border-yellow-800 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {isInitializing ? (
            <span>Initializing encryption... Please sign the message in your wallet.</span>
          ) : (
            <span>Encryption not initialized. Messages will not be saved to Walrus.</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-medium mb-2">Start a Private Conversation</h3>
            <p className="text-sm text-center max-w-md">
              Your messages are encrypted client-side before being stored.
              Only you can decrypt and read your conversation history.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
                <span>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {message.encrypted && (
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Encrypted
                  </span>
                )}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
