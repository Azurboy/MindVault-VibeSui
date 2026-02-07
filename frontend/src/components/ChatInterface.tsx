"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Lock, AlertCircle, Settings, Download, History, Upload, Check } from "lucide-react";
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
  synced?: boolean; // Whether this message has been synced to vault
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
const LOCAL_MESSAGES_KEY = "mindvault_local_messages";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [providerConfig, setProviderConfig] = useState<AIProviderConfig | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const account = useCurrentAccount();
  const { encrypt, decrypt, isInitialized, initialize, isInitializing } = useEncryption();
  const { currentVault, storeBlob, loadHistory, fetchVaults } = useVault();

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

  // Load local messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_MESSAGES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })));
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Count unsynced messages
  const unsyncedCount = messages.filter(m => !m.synced).length;

  // Load history from vault
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
          synced: true,
          blobIndex: msg.blobIndex,
          blobId: msg.blobId,
          chainTimestamp: msg.chainTimestamp,
        }));

        // Merge with existing unsynced messages
        const unsyncedMessages = messages.filter(m => !m.synced);
        setMessages([...loadedMessages, ...unsyncedMessages]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentVault, isInitialized, isLoadingHistory, loadHistory, decrypt, messages]);

  // Sync unsynced messages to vault - BATCH MODE: all messages in ONE transaction
  const handleSyncToVault = async () => {
    const unsyncedMessages = messages.filter(m => !m.synced);
    if (unsyncedMessages.length === 0) {
      alert("No messages to sync!");
      return;
    }

    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    // Initialize encryption if needed
    if (!isInitialized) {
      const success = await initialize();
      if (!success) {
        alert("Failed to initialize encryption. Please try again.");
        return;
      }
    }

    // Fetch vaults if needed
    if (!currentVault) {
      await fetchVaults();
    }

    if (!currentVault) {
      alert("No vault found. Please create a vault in Dashboard first.");
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 1 }); // Just 1 batch operation

    try {
      // Pack ALL unsynced messages into a single blob
      const messagesToStore: StoredMessage[] = unsyncedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.getTime(),
      }));

      // Encrypt the entire batch as one JSON array
      const { ciphertext, iv } = await encrypt(JSON.stringify(messagesToStore));

      // Upload to Walrus (one upload)
      const result = await uploadToWalrus(ciphertext);

      // Store on chain (one transaction, one signature)
      const blobIdBytes = new TextEncoder().encode(result.blobId);
      await storeBlob(blobIdBytes, 0, iv);

      setSyncProgress({ current: 1, total: 1 });

      // Mark all messages as synced
      const updatedMessages = messages.map(msg => {
        if (!msg.synced) {
          return {
            ...msg,
            synced: true,
            blobId: result.blobId,
            blobIndex: currentVault.blobCount,
            chainTimestamp: Date.now(),
          };
        }
        return msg;
      });

      setMessages(updatedMessages);
      alert(`Successfully synced ${unsyncedMessages.length} messages to your vault in 1 transaction!`);
    } catch (err) {
      console.error("Sync failed:", err);
      alert("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  // Export proof for a message (or batch of messages sharing the same blobId)
  const handleExportProof = async (message: Message) => {
    if (!currentVault || !message.blobId || message.blobIndex === undefined) {
      alert("Cannot export proof: message not synced to vault");
      return;
    }

    try {
      // Get vault owner - use account address if vault.owner is not set
      const vaultOwner = currentVault.owner || account?.address || "";

      // For batch synced messages, include all messages in the same blob
      const batchMessages = messages.filter(m => m.blobId === message.blobId);
      const contentForHash = batchMessages.length > 1
        ? JSON.stringify(batchMessages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp.getTime() })))
        : message.content;

      const proof = await generateProof({
        vaultId: currentVault.objectId,
        vaultOwner: vaultOwner,
        blobIndex: message.blobIndex,
        blobId: message.blobId,
        chainTimestamp: message.chainTimestamp || message.timestamp.getTime(),
        content: contentForHash,
      });

      downloadProof(proof);
    } catch (err) {
      console.error("Failed to export proof:", err);
      alert("Failed to export proof");
    }
  };

  // Clear local messages
  const handleClearMessages = () => {
    if (unsyncedCount > 0) {
      if (!confirm(`You have ${unsyncedCount} unsynced messages. Clear anyway?`)) {
        return;
      }
    }
    setMessages([]);
    localStorage.removeItem(LOCAL_MESSAGES_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !providerConfig) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
      synced: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
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
        synced: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error instanceof Error ? `Error: ${error.message}` : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        synced: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="flex items-center gap-3">
          {/* Load History Button */}
          {account && (
            <button
              onClick={handleLoadHistory}
              disabled={isLoadingHistory || !isInitialized}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Load chat history from Walrus"
            >
              {isLoadingHistory ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <History className="w-4 h-4" />
              )}
              Load History
            </button>
          )}

          {/* Sync to Vault Button - THE MAIN FEATURE */}
          {account && unsyncedCount > 0 && (
            <button
              onClick={handleSyncToVault}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all shadow-lg hover:shadow-blue-500/25"
              title="Sync unsynced messages to your vault"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing {syncProgress.current}/{syncProgress.total}...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Sync to Vault ({unsyncedCount})
                </>
              )}
            </button>
          )}

          {/* Clear Messages */}
          {messages.length > 0 && (
            <button
              onClick={handleClearMessages}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              title="Clear all messages"
            >
              Clear
            </button>
          )}
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

      {/* Sync Status Info */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800 text-xs text-gray-500">
          <span>
            {messages.length} messages ({unsyncedCount} unsynced, {messages.length - unsyncedCount} on-chain)
          </span>
          {!account && unsyncedCount > 0 && (
            <span className="text-yellow-500">
              Connect wallet to sync messages to your vault
            </span>
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
            <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
            <p className="text-sm text-center max-w-md">
              Chat freely — messages stay local until you choose to sync.
              <br />
              <span className="text-blue-400">Click &quot;Sync to Vault&quot; when you want to save on-chain.</span>
            </p>
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
                {message.synced ? (
                  <span className="flex items-center gap-1 text-green-400">
                    <Check className="w-3 h-3" />
                    On-chain
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Lock className="w-3 h-3" />
                    Local
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
