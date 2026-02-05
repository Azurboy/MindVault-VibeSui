"use client";

import Link from "next/link";
import { Lock, Database, Zap, Shield, ArrowRight, Github, ExternalLink } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export default function Home() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/30 rounded-full text-blue-400 text-sm mb-6">
            <Lock className="w-4 h-4" />
            <span>Built on Sui + Walrus</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your Data,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Your Rules.
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            AI conversations you truly own. Client-side encryption, decentralized storage,
            and blockchain-based access control.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {account ? (
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Start Chatting
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <ConnectButton />
          )}
          <a
            href="#learn-more"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
          >
            Learn More
          </a>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Client-Side Encryption</h3>
            <p className="text-gray-400 text-sm">
              AES-256-GCM encryption happens in your browser. Your key is derived from your wallet - never stored anywhere.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Decentralized Storage</h3>
            <p className="text-gray-400 text-sm">
              Encrypted data stored on Walrus. No central server holds your conversations - you control the data.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Stateless Processing</h3>
            <p className="text-gray-400 text-sm">
              AI requests processed in serverless functions. No logs, no persistence - data is forgotten after each request.
            </p>
          </div>
        </div>
      </section>

      {/* User Story Section */}
      <section id="learn-more" className="bg-gray-900/50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why MindVault?</h2>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">:thinking:</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">The Problem</h3>
                <p className="text-gray-400">
                  When you use ChatGPT, Claude, or other AI services, your conversations are stored on their servers.
                  You don&apos;t know who can access your data, how long it&apos;s kept, or if it&apos;s used for training.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">The MindVault Solution</h3>
                <p className="text-gray-400 mb-4">
                  With MindVault, your conversations are encrypted before they leave your browser.
                  The encrypted data is stored on decentralized infrastructure (Walrus), and access control
                  is managed through Sui blockchain. You can delete, export, or migrate your data anytime.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Connect with your Sui wallet - no account needed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Messages encrypted client-side with AES-256-GCM
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Encryption key derived from your wallet signature
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    You control who can access and when to revoke
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Disclosure Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">An Honest Disclosure</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            We believe in transparency. Here&apos;s exactly what MindVault can and cannot do.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* What We Can Do */}
            <div className="bg-green-900/20 border border-green-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                What We Can Do
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span>Encrypt your conversations before storage - the platform never sees plaintext</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span>Store data on decentralized infrastructure you control</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span>Manage access permissions on-chain with instant revocation</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span>Process AI requests statelessly - no server-side data retention</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span>Let you export, delete, or migrate your data freely</span>
                </li>
              </ul>
            </div>

            {/* What We Cannot Do Yet */}
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                What We Cannot Do (Yet)
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-yellow-400 mt-0.5">!</span>
                  <span>Hide your messages from the AI provider during inference - they see the plaintext to process it</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-yellow-400 mt-0.5">!</span>
                  <span>This is a fundamental limitation of current LLM technology, not something we can bypass</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-yellow-800/50">
                <p className="text-sm text-yellow-300/80">
                  <strong>Future Direction:</strong> We&apos;re researching TEE (Trusted Execution Environment)
                  and local model support to enable truly private AI inference.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            MindVault protects your <strong>data at rest</strong> and gives you <strong>ownership</strong> -
            but during AI inference, the model provider processes your message in plaintext.
            This is the honest reality of current AI technology.
          </p>
        </div>
      </section>

      {/* Current Features */}
      <section className="bg-gray-900/50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Current Features</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-400 font-medium">Feature</th>
                  <th className="pb-4 text-gray-400 font-medium">Status</th>
                  <th className="pb-4 text-gray-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-800">
                  <td className="py-4">Wallet Connection</td>
                  <td className="py-4"><span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Live</span></td>
                  <td className="py-4 text-gray-400">Sui Wallet, Suiet, and more</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Client-Side Encryption</td>
                  <td className="py-4"><span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Live</span></td>
                  <td className="py-4 text-gray-400">AES-256-GCM, key from wallet signature</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Decentralized Storage</td>
                  <td className="py-4"><span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Live</span></td>
                  <td className="py-4 text-gray-400">Walrus testnet integration</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">On-Chain Access Control</td>
                  <td className="py-4"><span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Live</span></td>
                  <td className="py-4 text-gray-400">Sui smart contract for permissions</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Custom AI Providers</td>
                  <td className="py-4"><span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Live</span></td>
                  <td className="py-4 text-gray-400">Bring your own API key (OpenAI, Claude, etc.)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Local Models</td>
                  <td className="py-4"><span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">Planned</span></td>
                  <td className="py-4 text-gray-400">WebLLM / Ollama support</td>
                </tr>
                <tr>
                  <td className="py-4">TEE Inference</td>
                  <td className="py-4"><span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">Research</span></td>
                  <td className="py-4 text-gray-400">Hardware-secured AI processing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Own Your AI Data?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Connect your Sui wallet, configure your AI provider, and start having conversations that you truly control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {account ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold">MindVault</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a
                href="https://github.com/Azurboy/MindVault-VibeSui"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
                GitHub
              </a>
              <a
                href="https://docs.sui.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Sui Docs
              </a>
              <a
                href="https://docs.walrus.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Walrus Docs
              </a>
            </div>

            <div className="text-sm text-gray-500">
              Built for Sui Hackathon
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
