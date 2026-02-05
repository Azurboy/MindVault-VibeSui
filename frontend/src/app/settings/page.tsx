"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useVault } from "@/hooks/useVault";
import {
  Shield,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  Settings,
  Key,
  Server,
  Cpu,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

// AI Provider Presets
const AI_PRESETS = [
  {
    name: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o",
    description: "GPT-4o, GPT-4, GPT-3.5",
  },
  {
    name: "Claude",
    baseURL: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-20250514",
    description: "Claude Sonnet 4, Opus, Haiku",
  },
  {
    name: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    description: "DeepSeek Chat, Coder",
  },
  {
    name: "Ollama",
    baseURL: "http://localhost:11434/v1",
    model: "llama3",
    description: "Local models (Llama, Mistral)",
  },
];

// Known AI provider addresses (for demo purposes)
const KNOWN_PROVIDERS = [
  {
    name: "OpenAI Gateway",
    address: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    description: "Official OpenAI API gateway",
  },
  {
    name: "Claude Gateway",
    address: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    description: "Official Anthropic Claude API gateway",
  },
];

interface AIProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

interface Authorization {
  provider: string;
  name: string;
  scope: number;
  expiresAt: number;
}

const STORAGE_KEY = "mindvault_ai_provider";

export default function SettingsPage() {
  const account = useCurrentAccount();
  const { currentVault, grantAccess, revokeAccess, isLoading, error } = useVault();

  // AI Provider state
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    baseURL: "",
    apiKey: "",
    model: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Authorization state
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [customProvider, setCustomProvider] = useState("");
  const [scope, setScope] = useState(1);
  const [expiresIn, setExpiresIn] = useState(0);

  // Load AI config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAiConfig(parsed);
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  const handlePresetSelect = (preset: typeof AI_PRESETS[0]) => {
    setAiConfig({
      ...aiConfig,
      baseURL: preset.baseURL,
      model: preset.model,
    });
    setTestResult(null);
    setIsSaved(false);
  };

  const handleSaveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aiConfig));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!aiConfig.baseURL || !aiConfig.apiKey || !aiConfig.model) {
      setTestResult({ success: false, message: "Please fill in all fields" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hello, this is a test message. Reply with 'Connection successful!' only.",
          provider: aiConfig,
          history: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Connection failed");
      }

      setTestResult({ success: true, message: "Connection successful!" });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-gray-400">
            Connect your Sui wallet to manage settings.
          </p>
        </div>
      </div>
    );
  }

  const handleGrantAccess = async () => {
    const provider = selectedProvider || customProvider;
    if (!provider) return;

    const expiresAt = expiresIn > 0 ? Date.now() + expiresIn * 24 * 60 * 60 * 1000 : 0;

    const result = await grantAccess(provider, scope, expiresAt);
    if (result) {
      const providerInfo = KNOWN_PROVIDERS.find((p) => p.address === provider);
      setAuthorizations((prev) => [
        ...prev.filter((a) => a.provider !== provider),
        {
          provider,
          name: providerInfo?.name || "Custom Provider",
          scope,
          expiresAt,
        },
      ]);
      setShowGrantModal(false);
      setSelectedProvider("");
      setCustomProvider("");
    }
  };

  const handleRevokeAccess = async (provider: string) => {
    const result = await revokeAccess(provider);
    if (result) {
      setAuthorizations((prev) => prev.filter((a) => a.provider !== provider));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-gray-400 mb-8">
        Configure your AI provider and manage access permissions.
      </p>

      {/* AI Provider Configuration */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold">AI Provider Configuration</h2>
        </div>

        {/* Preset Buttons */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-3">Quick Presets</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AI_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-lg border transition-colors text-left ${
                  aiConfig.baseURL === preset.baseURL
                    ? "border-blue-600 bg-blue-600/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <p className="font-medium">{preset.name}</p>
                <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Fields */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Server className="w-4 h-4" />
              API Base URL
            </label>
            <input
              type="text"
              value={aiConfig.baseURL}
              onChange={(e) => {
                setAiConfig({ ...aiConfig, baseURL: e.target.value });
                setTestResult(null);
                setIsSaved(false);
              }}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Key className="w-4 h-4" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={aiConfig.apiKey}
                onChange={(e) => {
                  setAiConfig({ ...aiConfig, apiKey: e.target.value });
                  setTestResult(null);
                  setIsSaved(false);
                }}
                placeholder="sk-..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Cpu className="w-4 h-4" />
              Model
            </label>
            <input
              type="text"
              value={aiConfig.model}
              onChange={(e) => {
                setAiConfig({ ...aiConfig, model: e.target.value });
                setTestResult(null);
                setIsSaved(false);
              }}
              placeholder="gpt-4o / claude-sonnet-4-20250514 / deepseek-chat"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              testResult.success
                ? "bg-green-900/20 border border-green-800 text-green-400"
                : "bg-red-900/20 border border-red-800 text-red-400"
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !aiConfig.baseURL || !aiConfig.apiKey || !aiConfig.model}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </button>
          <button
            onClick={handleSaveConfig}
            disabled={!aiConfig.baseURL || !aiConfig.apiKey || !aiConfig.model}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              "Save Configuration"
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>Security:</strong> Your API key is stored only in your browser&apos;s localStorage.
            It is never sent to our servers for storage. The key is only used during AI requests
            and is processed in a stateless serverless function.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Access Management Section */}
      {currentVault && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold">Access Management</h2>
            </div>
            <button
              onClick={() => setShowGrantModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Grant Access
            </button>
          </div>

          {authorizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No providers authorized yet.</p>
              <p className="text-sm">Grant access to AI providers to start using them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {authorizations.map((auth) => (
                <div
                  key={auth.provider}
                  className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4"
                >
                  <div>
                    <p className="font-semibold">{auth.name}</p>
                    <p className="text-sm text-gray-400 font-mono">
                      {auth.provider.slice(0, 16)}...{auth.provider.slice(-8)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        {auth.scope === 1 ? "Read Only" : "Read & Write"}
                      </span>
                      {auth.expiresAt > 0 && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          Expires: {new Date(auth.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeAccess(auth.provider)}
                    disabled={isLoading}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Vault Warning */}
      {!currentVault && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-semibold text-yellow-400">No Vault Found</h2>
          </div>
          <p className="text-gray-400">
            Create a Data Vault from the Dashboard to enable access management features.
            You can still configure your AI provider above.
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6">
        <h3 className="font-semibold mb-2">How Access Control Works</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
            Authorization data is stored in your Vault as Dynamic Fields on Sui blockchain.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
            You can revoke access at any time - the authorization lives in YOUR vault.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
            Providers can only verify their authorization by querying your vault.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
            Even with access, providers cannot decrypt your data - only you have the key.
          </li>
        </ul>
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Grant Access</h2>

            {/* Provider Selection */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Select Provider
              </label>
              <div className="space-y-2">
                {KNOWN_PROVIDERS.map((provider) => (
                  <button
                    key={provider.address}
                    onClick={() => {
                      setSelectedProvider(provider.address);
                      setCustomProvider("");
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedProvider === provider.address
                        ? "border-blue-600 bg-blue-600/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-gray-400">{provider.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Provider */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Or enter custom address
              </label>
              <input
                type="text"
                value={customProvider}
                onChange={(e) => {
                  setCustomProvider(e.target.value);
                  setSelectedProvider("");
                }}
                placeholder="0x..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Scope Selection */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Permission Scope
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setScope(1)}
                  className={`flex-1 p-2 rounded-lg border transition-colors ${
                    scope === 1
                      ? "border-blue-600 bg-blue-600/20"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  Read Only
                </button>
                <button
                  onClick={() => setScope(2)}
                  className={`flex-1 p-2 rounded-lg border transition-colors ${
                    scope === 2
                      ? "border-blue-600 bg-blue-600/20"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  Read & Write
                </button>
              </div>
            </div>

            {/* Expiration */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Expires In
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={0}>Never</option>
                <option value={1}>1 Day</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowGrantModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantAccess}
                disabled={isLoading || (!selectedProvider && !customProvider)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Granting...
                  </>
                ) : (
                  "Grant Access"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
