"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useVault } from "@/hooks/useVault";
import { useEncryption } from "@/hooks/useEncryption";
import {
  Shield,
  Database,
  Key,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const account = useCurrentAccount();
  const {
    vaults,
    currentVault,
    isLoading,
    error,
    createVault,
  } = useVault();
  const { isInitialized, initialize, isInitializing } = useEncryption();

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-gray-400">
            Connect your Sui wallet to access your MindVault dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Wallet Status */}
        <StatusCard
          icon={<Key className="w-6 h-6" />}
          title="Wallet Connected"
          status="success"
          value={`${account.address.slice(0, 8)}...${account.address.slice(-6)}`}
        />

        {/* Encryption Status */}
        <StatusCard
          icon={<Shield className="w-6 h-6" />}
          title="Encryption"
          status={isInitialized ? "success" : "warning"}
          value={isInitialized ? "Initialized" : "Not Initialized"}
          action={
            !isInitialized && (
              <button
                onClick={initialize}
                disabled={isInitializing}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize"
                )}
              </button>
            )
          }
        />

        {/* Vault Status */}
        <StatusCard
          icon={<Database className="w-6 h-6" />}
          title="Data Vault"
          status={currentVault ? "success" : "warning"}
          value={currentVault ? `${currentVault.blobCount} blobs stored` : "No vault"}
          action={
            !currentVault && (
              <button
                onClick={createVault}
                disabled={isLoading}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    Create Vault
                  </>
                )}
              </button>
            )
          }
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Vault Details */}
      {currentVault && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Data Vault</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Vault ID</p>
              <p className="font-mono text-sm break-all">{currentVault.objectId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Created</p>
              <p>{new Date(currentVault.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Stored Blobs</p>
              <p>{currentVault.blobCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">View on Explorer</p>
              <a
                href={`https://suiscan.xyz/testnet/object/${currentVault.objectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Suiscan
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/chat"
          className="bg-blue-600/20 border border-blue-600 rounded-xl p-6 hover:bg-blue-600/30 transition-colors group"
        >
          <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400">
            Start AI Chat
          </h3>
          <p className="text-gray-400 text-sm">
            Have a private conversation with AI. Your messages are encrypted and stored on Walrus.
          </p>
        </Link>

        <Link
          href="/settings"
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors group"
        >
          <h3 className="text-lg font-semibold mb-2 group-hover:text-gray-300">
            Manage Access
          </h3>
          <p className="text-gray-400 text-sm">
            Grant or revoke access to AI providers. Control who can process your data.
          </p>
        </Link>
      </div>

      {/* All Vaults */}
      {vaults.length > 1 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Vaults</h2>
          <div className="space-y-3">
            {vaults.map((vault) => (
              <div
                key={vault.objectId}
                className={`bg-gray-800/50 border rounded-xl p-4 ${
                  vault.objectId === currentVault?.objectId
                    ? "border-blue-600"
                    : "border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm">
                      {vault.objectId.slice(0, 16)}...{vault.objectId.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {vault.blobCount} blobs
                    </p>
                  </div>
                  {vault.objectId === currentVault?.objectId && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  status,
  value,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  status: "success" | "warning" | "error";
  value: string;
  action?: React.ReactNode;
}) {
  const statusColors = {
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
  };

  const StatusIcon = status === "success" ? CheckCircle : AlertCircle;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-700 rounded-lg text-gray-400">{icon}</div>
        <StatusIcon className={`w-5 h-5 ${statusColors[status]}`} />
      </div>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="font-semibold truncate">{value}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
