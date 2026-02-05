"use client";

import { useState } from "react";
import { Shield, CheckCircle, XCircle, Loader2, FileText, ExternalLink } from "lucide-react";
import { verifyProof, parseProof, ConversationProof, VerifyResult } from "@/lib/proof";
import { NETWORK } from "@/lib/sui";
import Link from "next/link";

export default function VerifyPage() {
  const [proofInput, setProofInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [parsedProof, setParsedProof] = useState<ConversationProof | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleVerify = async () => {
    setParseError(null);
    setResult(null);

    // Parse the proof
    const proof = parseProof(proofInput);
    if (!proof) {
      setParseError("Invalid proof format. Please paste a valid MindVault proof JSON.");
      return;
    }

    setParsedProof(proof);
    setIsVerifying(true);

    try {
      const verifyResult = await verifyProof(proof);
      setResult(verifyResult);
    } catch (err) {
      setResult({
        valid: false,
        details: `Verification error: ${err instanceof Error ? err.message : "Unknown error"}`,
        checks: {
          vaultExists: false,
          blobExists: false,
          timestampValid: false,
        },
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasteExample = () => {
    const example: ConversationProof = {
      vaultId: "0x...",
      vaultOwner: "0x...",
      blobIndex: 0,
      blobId: "example-blob-id",
      chainTimestamp: Date.now(),
      network: "testnet",
      packageId: "0x...",
      version: "1.0.0",
    };
    setProofInput(JSON.stringify(example, null, 2));
  };

  const getSuiExplorerUrl = (type: "object" | "tx", id: string) => {
    const network = NETWORK as string;
    const baseUrl = network === "mainnet"
      ? "https://suiscan.xyz/mainnet"
      : "https://suiscan.xyz/testnet";
    return type === "object" ? `${baseUrl}/object/${id}` : `${baseUrl}/tx/${id}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-500" />
            <h1 className="text-3xl font-bold">Verify Conversation Proof</h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Verify the authenticity of a MindVault conversation proof. This checks that the
            conversation was stored on-chain at the claimed time and the data still exists on Walrus.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg font-medium flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Proof JSON
            </label>
            <button
              onClick={handlePasteExample}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Paste Example
            </button>
          </div>

          <textarea
            value={proofInput}
            onChange={(e) => {
              setProofInput(e.target.value);
              setParseError(null);
              setResult(null);
            }}
            placeholder={`Paste the proof JSON here...\n\n{\n  "vaultId": "0x...",\n  "vaultOwner": "0x...",\n  "blobIndex": 0,\n  "blobId": "...",\n  "chainTimestamp": 1234567890,\n  "network": "testnet",\n  "packageId": "0x...",\n  "version": "1.0.0"\n}`}
            className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          />

          {parseError && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <XCircle className="w-4 h-4" />
              {parseError}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={!proofInput.trim() || isVerifying}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Verify Proof
              </>
            )}
          </button>
        </div>

        {/* Result Section */}
        {result && (
          <div
            className={`rounded-xl p-6 mb-8 ${
              result.valid
                ? "bg-green-900/30 border border-green-700"
                : "bg-red-900/30 border border-red-700"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {result.valid ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <h2 className="text-xl font-bold text-green-400">Proof Valid</h2>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-400" />
                  <h2 className="text-xl font-bold text-red-400">Proof Invalid</h2>
                </>
              )}
            </div>

            <p className={`mb-6 ${result.valid ? "text-green-300" : "text-red-300"}`}>
              {result.details}
            </p>

            {/* Verification Checks */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Verification Checks
              </h3>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  {result.checks.vaultExists ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm">Vault exists on chain</span>
                </div>

                <div className="flex items-center gap-2">
                  {result.checks.blobExists ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm">Blob exists on Walrus</span>
                </div>

                <div className="flex items-center gap-2">
                  {result.checks.timestampValid ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm">Timestamp is valid</span>
                </div>

                {result.checks.transactionValid !== undefined && (
                  <div className="flex items-center gap-2">
                    {result.checks.transactionValid ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm">Transaction verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Proof Details */}
        {parsedProof && (
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Proof Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Network</label>
                  <p className="font-mono text-sm">{parsedProof.network}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Timestamp</label>
                  <p className="font-mono text-sm">
                    {new Date(parsedProof.chainTimestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Blob Index</label>
                  <p className="font-mono text-sm">{parsedProof.blobIndex}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Version</label>
                  <p className="font-mono text-sm">{parsedProof.version}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Vault ID</label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all">{parsedProof.vaultId}</p>
                  <a
                    href={getSuiExplorerUrl("object", parsedProof.vaultId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Vault Owner</label>
                <p className="font-mono text-sm break-all">{parsedProof.vaultOwner}</p>
              </div>

              <div>
                <label className="text-sm text-gray-400">Blob ID</label>
                <p className="font-mono text-sm break-all">{parsedProof.blobId}</p>
              </div>

              {parsedProof.storeTxDigest && (
                <div>
                  <label className="text-sm text-gray-400">Transaction</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm break-all">{parsedProof.storeTxDigest}</p>
                    <a
                      href={getSuiExplorerUrl("tx", parsedProof.storeTxDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {parsedProof.contentHash && (
                <div>
                  <label className="text-sm text-gray-400">Content Hash (SHA-256)</label>
                  <p className="font-mono text-sm break-all">{parsedProof.contentHash}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Proofs are generated by MindVault users and can be verified by anyone.
          </p>
          <p>
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              Learn more about MindVault
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
