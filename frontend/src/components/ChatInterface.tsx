"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Lock, AlertCircle, Settings, Download, History, RefreshCw } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEncryption } from "@/hooks/useEncryption";
import { useVault, StoredMessage } from "@/hooks/useVault";
import { uploadToWalrus } from "@/lib/walrus";
import { generateProof, downloadProof } from "@/lib/proof";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  encrypted?: boolean;
  blobIndex?: number;
  blobId?: string;
  chainTimestamp?: number;
}

interface AIProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = "mindvault_ai_provider";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveToWalrus, setSaveToWalrus] = useState(true);
  const [providerConfig, setProviderConfig] = useState<AIProviderConfig | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const account = useCurrentAccount();
  const { encrypt, decrypt, isInitialized, initialize, isInitializing } = useEncryption();
  const { currentVault, storeBlob, loadHistory } = useVault();

  // Load provider config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.baseURL && parsed.apiKey && parsed.model) {
          setProviderConfig(parsed);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

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

  // Load history when vault and encryption are ready
  const handleLoadHistory = useCallback(async () => {
    if (!currentVault || !isInitialized || isLoadingHistory) return;

    setIsLoadingHistory(true);
    try {
      const history = await loadHistory(decrypt);

      if (history.length > 0) {
        const loadedMessages: Message[] = history.map((msg: StoredMessage) => ({
          id: crypto.randomUUID(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          encrypted: true,
          blobIndex: msg.blobIndex,
          blobId: msg.blobId,
          chainTimestamp: msg.chainTimestamp,
        }));

        setMessages(loadedMessages);
        setHistoryLoaded(true);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentVault, isInitialized, isLoadingHistory, loadHistory, decrypt]);

  // Auto-load history when vault and encryption are ready (only once)
  useEffect(() => {
    if (currentVault && isInitialized && !historyLoaded && !isLoadingHistory && messages.length === 0) {
      handleLoadHistory();
    }
  }, [currentVault, isInitialized, historyLoaded, isLoadingHistory, messages.length, handleLoadHistory]);

  // Export proof for a message
  const handleExportProof = async (message: Message) => {
    if (!currentVault || !message.blobId || message.blobIndex === undefined) {
      alert("Cannot export proof: message not stored on chain");
      return;
    }

    try {
      const proof = await generateProof({
        vaultId: currentVault.objectId,
        vaultOwner: currentVault.owner || "",
        blobIndex: message.blobIndex,
        blobId: message.blobId,
        chainTimestamp: message.chainTimestamp || message.timestamp.getTime(),
        content: message.content,
      });

      downloadProof(proof);
    } catch (err) {
      console.error("Failed to export proof:", err);
      alert("Failed to export proof");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !providerConfig) return;

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
          // Store as structured message
          const messageToStore: StoredMessage = {
            role: "user",
            content: input,
            timestamp: Date.now(),
          };
          const { ciphertext, iv } = await encrypt(JSON.stringify(messageToStore));
          const result = await uploadToWalrus(ciphertext);
          const blobIdBytes = new TextEncoder().encode(result.blobId);
          await storeBlob(blobIdBytes, 0, iv);
          userMessage.encrypted = true;
          userMessage.blobId = result.blobId;
          userMessage.blobIndex = currentVault.blobCount;
          userMessage.chainTimestamp = Date.now();
        } catch (err) {
          console.error("Failed to save to Walrus:", err);
        }
      }

      // Call AI API with user's provider config - send full history as context
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          provider: providerConfig,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
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
          // Store as structured message
          const messageToStore: StoredMessage = {
            role: "assistant",
            content: data.response,
            timestamp: Date.now(),
          };
          const { ciphertext, iv } = await encrypt(JSON.stringify(messageToStore));
          const result = await uploadToWalrus(ciphertext);
          const blobIdBytes = new TextEncoder().encode(result.blobId);
          await storeBlob(blobIdBytes, 0, iv);
          assistantMessage.encrypted = true;
          assistantMessage.blobId = result.blobId;
          assistantMessage.blobIndex = currentVault.blobCount;
          assistantMessage.chainTimestamp = Date.now();
        } catch (err) {
          console.error("Failed to save response to Walrus:", err);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error instanceof Error ? `Error: ${error.message}` : "Sorry, I encountered an error. Please try again.",
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

  // Get provider display name
  const getProviderName = () => {
    if (!providerConfig) return null;
    if (providerConfig.baseURL.includes("openai.com")) return "OpenAI";
    if (providerConfig.baseURL.includes("anthropic.com")) return "Claude";
    if (providerConfig.baseURL.includes("deepseek.com")) return "DeepSeek";
    if (providerConfig.baseURL.includes("localhost")) return "Local";
    return "Custom";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Provider Status Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          {providerConfig ? (
            <>
              <span className="text-sm text-gray-400">AI Provider:</span>
              <span className="px-3 py-1.5 rounded-lg text-sm bg-green-600/20 text-green-400 border border-green-600/50">
                {getProviderName()} - {providerConfig.model}
              </span>
              <Link
                href="/settings"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Change
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg text-sm bg-yellow-600/20 text-yellow-400 border border-yellow-600/50">
                No AI provider configured
              </span>
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configure
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Load History Button */}
          {currentVault && isInitialized && (
            <button
              onClick={handleLoadHistory}
              disabled={isLoadingHistory}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Load chat history from Walrus"
            >
              {isLoadingHistory ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <History className="w-4 h-4" />
              )}
              {isLoadingHistory ? "Loading..." : "Load History"}
            </button>
          )}

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

      {/* No Provider Warning */}
      {!providerConfig && (
        <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border-b border-yellow-800 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Please configure your AI provider in{" "}
            <Link href="/settings" className="underline hover:text-yellow-300">
              Settings
            </Link>{" "}
            to start chatting. You&apos;ll need to provide your own API key.
          </span>
        </div>
      )}

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
        {isLoadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Loading Chat History</h3>
            <p className="text-sm text-center max-w-md">
              Decrypting your conversation history from Walrus...
            </p>
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-medium mb-2">Start a Private Conversation</h3>
            <p className="text-sm text-center max-w-md">
              Your messages are encrypted client-side before being stored.
              Only you can decrypt and read your conversation history.
            </p>
            {historyLoaded && currentVault && currentVault.blobCount > 0 && (
              <p className="text-sm text-center max-w-md mt-2 text-blue-400">
                {currentVault.blobCount} encrypted messages found. Click &quot;Load History&quot; to view.
              </p>
            )}
            {!providerConfig && (
              <Link
                href="/settings"
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configure AI Provider
              </Link>
            )}
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
                {message.blobId && (
                  <button
                    onClick={() => handleExportProof(message)}
                    className="flex items-center gap-1 hover:opacity-100 opacity-60 transition-opacity"
                    title="Export proof of this message"
                  >
                    <Download className="w-3 h-3" />
                    Proof
                  </button>
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
            placeholder={providerConfig ? "Type your message..." : "Configure AI provider in Settings first..."}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isLoading || !providerConfig}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !providerConfig}
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
