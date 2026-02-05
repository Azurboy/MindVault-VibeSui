# MindVault

> **Your Data, Your Rules.** | **你的数据，你做主。**

AI conversations you truly own. Client-side encryption, decentralized storage, and blockchain-based access control on Sui.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Azurboy/MindVault-VibeSui&root-directory=frontend&env=NEXT_PUBLIC_PACKAGE_ID)

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## Author's Philosophy

### Why MindVault?

When we use ChatGPT, Claude, or other AI services, there's an uncomfortable reality:
- Your conversation history is stored on the provider's servers
- You don't know who can access your data, or if it's used for training
- You can't truly delete or migrate your data

MindVault was built to answer one question: **Who should own AI conversation data?**

Our answer: **The user.**

### An Honest Disclosure

We believe in transparency. Here's exactly what MindVault can and cannot do:

**What We Can Do:**
- Encrypt your conversations before storage - the platform never sees plaintext
- Store data on decentralized infrastructure you control (Walrus)
- Manage access permissions on-chain with instant revocation (Sui)
- Process AI requests statelessly - no server-side data retention
- Let you export, delete, or migrate your data freely

**What We Cannot Do (Yet):**
- Hide your messages from the AI provider during inference - they need to see plaintext to process it
- This is a fundamental limitation of current LLM technology, not something we can bypass

### Future Direction

We're researching next-generation privacy AI technologies:
- **TEE (Trusted Execution Environment)**: Run AI inference in hardware-secured enclaves where even operators can't see your data
- **Local Models**: Support running open-source models locally so your data never leaves your device

MindVault aims to become **privacy AI infrastructure**, progressively achieving true end-to-end privacy as technology evolves.

---

## User Story

### The Problem

Alex is a freelancer who uses AI assistants to:
- Organize client requirements
- Draft contracts and emails
- Brainstorm product ideas

But Alex has a concern: these conversations contain client-sensitive information, business ideas, and even private thoughts. Alex doesn't know how long the data is stored, if it's used for training, or who might access it.

### The MindVault Solution

With MindVault:

1. **Connect Wallet**: Alex logs in with a Sui wallet - no registration needed
2. **Encrypted Storage**: Every message is encrypted in the browser before being stored
3. **Keys in Your Hands**: The encryption key is derived from Alex's wallet signature - only Alex can decrypt
4. **Full Control**: Alex can delete any conversation instantly, without "requesting" deletion
5. **Fully Portable**: If a better service comes along, Alex can export all data and take it

Alex can finally discuss sensitive topics with AI confidently - not because the AI can't see it (it still does during inference), but because the data is **completely under Alex's control** and won't persist on some unknown server forever.

---

## Current Features

| Feature | Status | Description |
|---------|--------|-------------|
| Wallet Connection | Live | Sui Wallet, Suiet, and more |
| Client-Side Encryption | Live | AES-256-GCM, key derived from wallet signature |
| Decentralized Storage | Live | Walrus testnet integration |
| On-Chain Access Control | Live | Sui smart contract for permissions |
| Instant Revocation | Live | User can unilaterally revoke any authorization |
| Custom AI Providers | Live | Bring your own API key (OpenAI, Claude, DeepSeek, etc.) |
| Stateless Processing | Live | API layer never persists any data |
| Local Models | Planned | WebLLM / Ollama support |
| TEE Inference | Research | Hardware-secured AI processing |

---

## Architecture

### Dual-Layer Privacy Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           User Browser (Trust Zone)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │ Sui Wallet  │  │ AES-256     │  │ Key Derivation (from wallet sig)    │  │
│  │ Connect     │  │ Encrypt     │  │ Key = HKDF(wallet.sign("mindvault"))│  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────────────────┐  ┌───────────────────────────────────────────┐
│   Cold Storage Layer          │  │   Hot Processing Layer                     │
│        100% Web3              │  │      Stateless Enclave                    │
├───────────────────────────────┤  ├───────────────────────────────────────────┤
│  Sui Blockchain               │  │  Next.js API Routes (Serverless)          │
│  - DataVault Object           │  │  - READ: Receive decrypted plaintext      │
│  - Authorization (Dynamic)    │  │  - PROCESS: Call LLM                      │
│                               │  │  - FORGET: Memory released, no persistence│
│  Walrus Storage               │  │                                           │
│  - AES-256 encrypted blobs    │  │  LLM APIs: OpenAI, Claude, DeepSeek, etc  │
└───────────────────────────────┘  └───────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Sui CLI (optional, for contract deployment)
- Sui Wallet (Sui Wallet, Suiet, etc.)

### 1. Clone the Repository

```bash
git clone https://github.com/Azurboy/MindVault-VibeSui.git
cd MindVault-VibeSui
```

### 2. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_PACKAGE_ID=0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Configure AI Provider

1. Connect your Sui wallet
2. Go to **Settings** page
3. Configure your AI provider (baseURL, API key, model)
4. Start chatting!

---

## Vercel Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Azurboy/MindVault-VibeSui&root-directory=frontend&env=NEXT_PUBLIC_PACKAGE_ID)

### Manual Deployment Steps

1. Fork this repository to your GitHub account

2. Create a new project in Vercel
   - Click "Add New" → "Project"
   - Select your forked repository

3. **Important Configuration**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. Set environment variables:

   | Variable | Value | Required |
   |----------|-------|----------|
   | `NEXT_PUBLIC_PACKAGE_ID` | `0xd8e2b3...` | Yes |

5. Click Deploy

### Custom AI Provider Configuration

MindVault supports user-configured AI providers in the Settings page - no code changes needed:

```
Settings → AI Provider Configuration
├── API Base URL: https://api.openai.com/v1  (or any compatible endpoint)
├── API Key: sk-xxx... (stored in browser localStorage only)
└── Model: gpt-4o / claude-sonnet-4-20250514 / deepseek-chat / ...
```

**Supported Compatible Endpoints:**
- OpenAI API
- Anthropic Claude API
- Azure OpenAI
- DeepSeek
- Moonshot
- Any OpenAI-compatible API (e.g., local Ollama)

### FAQ

**Q: Deployment fails with "No Next.js version detected"**

A: Make sure Root Directory is set to `frontend`, not the project root.

**Q: How do I update the deployed contract address?**

A: Go to Vercel project settings → Environment Variables, modify `NEXT_PUBLIC_PACKAGE_ID`, then redeploy.

**Q: Do I need server-side API keys?**

A: No. Users configure their own API keys in the browser. The keys are stored in localStorage and never sent to our servers for storage.

---

## Smart Contract

The `DataVault` contract uses Sui's native features for maximum user control:

### Core Design

- **Owned Objects**: DataVault is owned by the user, ensuring 100% control
- **Dynamic Fields**: Authorization and blob references stored as dynamic fields
- **Instant Revocation**: Users can revoke access anytime since auth data lives in their vault

### Key Functions

```move
// Create a new vault
public entry fun create_vault(clock: &Clock, ctx: &mut TxContext)

// Store encrypted blob reference
public entry fun store_blob(vault: &mut DataVault, blob_id: vector<u8>, blob_type: u8, iv: vector<u8>, ...)

// Grant access to a provider (stores auth in user's vault)
public entry fun grant_access(vault: &mut DataVault, provider: address, scope: u8, expires_at: u64, ...)

// Revoke access (user can always do this unilaterally)
public entry fun revoke_access(vault: &mut DataVault, provider: address, ...)

// Check if provider is authorized (view function)
public fun is_authorized(vault: &DataVault, provider: address, clock: &Clock): bool
```

### Deployed Contract (Testnet)

- **Package ID**: `0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6`
- **Transaction**: `AdH8tBSVJ87FRG8tPuG2NDSUtX9F4ExBwZ9SuDt5Q4M6`

### Deploy Your Own

```bash
cd contracts/data_vault
sui client publish --gas-budget 100000000
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Blockchain | Sui, Move 2024 |
| Storage | Walrus |
| AI | Any OpenAI-compatible API |
| Deployment | Vercel |

---

## Project Structure

```
MindVault-VibeSui/
├── contracts/
│   └── data_vault/
│       ├── Move.toml
│       └── sources/
│           └── data_vault.move    # Sui smart contract
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js pages
│   │   │   ├── api/chat/          # AI chat API route
│   │   │   ├── chat/              # Chat page
│   │   │   ├── dashboard/         # Dashboard page
│   │   │   └── settings/          # Settings page
│   │   ├── components/            # React components
│   │   ├── hooks/                 # Custom hooks
│   │   └── lib/                   # Utilities (encryption, sui, walrus)
│   └── package.json
├── README.md
└── AI_DISCLOSURE.md
```

---

## Security Model

1. **Encryption Key**: Derived from wallet signature using HKDF, never stored on any server
2. **Data at Rest**: AES-256-GCM encrypted on Walrus, only user can decrypt
3. **Access Control**: On-chain authorization stored in user's vault, instant revocation
4. **Processing**: Stateless serverless functions, no database, no logs, no persistence
5. **API Keys**: User-provided, stored only in browser localStorage

---

## License

MIT License

---

## Links

- [GitHub Repository](https://github.com/Azurboy/MindVault-VibeSui)
- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.walrus.site/)

---

<a name="中文"></a>

# MindVault: 隐私AI API网关

> **你的数据，你做主。**

真正属于你的AI对话。客户端加密、去中心化存储、基于Sui区块链的访问控制。

---

## 作者思路

### 为什么做 MindVault?

当我们使用 ChatGPT、Claude 等 AI 服务时，有一个尴尬的事实：
- 你的对话历史存储在厂商的服务器上
- 你不知道谁在看你的数据，数据会不会被用于训练
- 你无法真正删除或迁移你的数据

MindVault 的初衷是解决一个问题：**谁应该拥有 AI 对话数据？**

我们的答案是：**用户自己。**

### 诚实的声明

我们相信透明。这是 MindVault 能做到和还做不到的：

**我们能做到的：**
- 对话数据加密存储，平台不持久化任何明文数据
- 链上授权管理，完全透明可追溯
- 用户可以导出、删除、迁移自己的数据
- 无服务器处理，API 层不落盘

**我们还做不到的：**
- AI 推理时，明文仍然会发送给模型提供商（Claude/OpenAI等）
- 这是当前 LLM 技术的限制，不是我们能绕过的

### 未来方向

我们正在研究下一代隐私 AI 技术：
- **TEE（可信执行环境）**：在硬件安全区域运行 AI 推理，连运营者都看不到数据
- **本地模型**：支持用户在本地运行开源模型，数据完全不出设备

MindVault 的目标是成为**隐私 AI 基础设施**，随着技术演进，逐步实现真正的端到端隐私。

---

## 用户场景

### 小明的 AI 助手烦恼

小明是一名自由职业者，他经常用 AI 助手来：
- 整理客户需求文档
- 草拟合同和邮件
- 头脑风暴产品创意

但他有一个担忧：这些对话包含客户的敏感信息、商业创意、甚至私人想法。他不知道这些数据会被存储多久，会不会被用于训练，会不会被某个员工看到。

### 小明发现了 MindVault

使用 MindVault 后：

1. **连接钱包**：小明用 Sui 钱包登录，不需要注册账号
2. **对话加密存储**：每条消息都在他的浏览器里加密，然后存到去中心化存储
3. **密钥在自己手里**：加密密钥从他的钱包签名派生，只有他能解密
4. **随时可删除**：小明可以随时删除任何对话，不需要"申请"
5. **完全可迁移**：如果有更好的服务，小明可以导出所有数据带走

小明终于可以安心地和 AI 讨论敏感话题了——不是因为 AI 看不到（它还是能看到），而是因为这些数据**完全在他的掌控之中**，不会在某个服务器上永久留存。

---

## 当前功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 钱包连接 | 已上线 | 支持 Sui Wallet、Suiet 等 |
| 客户端加密 | 已上线 | AES-256-GCM，密钥从钱包签名派生 |
| 去中心化存储 | 已上线 | Walrus 测试网集成 |
| 链上授权 | 已上线 | Sui 智能合约管理访问权限 |
| 即时撤销 | 已上线 | 用户可单方面撤销任何授权 |
| 自定义AI提供商 | 已上线 | 自带API密钥（OpenAI、Claude、DeepSeek等） |
| 无状态处理 | 已上线 | API 层不持久化任何数据 |
| 本地模型 | 计划中 | WebLLM / Ollama 支持 |
| TEE 推理 | 研究中 | 硬件安全的 AI 处理 |

---

## 快速开始

### 前置要求

- Node.js 18+
- Sui CLI（可选，用于合约部署）
- Sui钱包（Sui Wallet、Suiet等）

### 1. 克隆仓库

```bash
git clone https://github.com/Azurboy/MindVault-VibeSui.git
cd MindVault-VibeSui
```

### 2. 设置前端

```bash
cd frontend
npm install
cp .env.example .env.local
```

编辑 `.env.local`：
```env
NEXT_PUBLIC_PACKAGE_ID=0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6
```

### 3. 运行开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 4. 配置 AI 提供商

1. 连接你的 Sui 钱包
2. 进入 **Settings** 页面
3. 配置你的 AI 提供商（baseURL、API密钥、模型）
4. 开始聊天！

---

## Vercel 部署

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Azurboy/MindVault-VibeSui&root-directory=frontend&env=NEXT_PUBLIC_PACKAGE_ID)

### 手动部署步骤

1. Fork 本仓库到你的 GitHub 账号

2. 在 Vercel 创建新项目
   - 点击 "Add New" → "Project"
   - 选择你 fork 的仓库

3. **重要配置**：
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. 设置环境变量：

   | 变量名 | 值 | 必需 |
   |-------|---|-----|
   | `NEXT_PUBLIC_PACKAGE_ID` | `0xd8e2b3...` | 是 |

5. 点击 Deploy

### 自定义 AI 提供商

MindVault 支持用户在界面中自定义 AI 提供商，无需修改代码：

```
设置页面 → AI 提供商配置
├── API Base URL: https://api.openai.com/v1  (或其他兼容的端点)
├── API Key: sk-xxx... (存储在浏览器 localStorage)
└── Model: gpt-4o / claude-sonnet-4-20250514 / deepseek-chat / ...
```

**支持的兼容端点：**
- OpenAI API
- Anthropic Claude API
- Azure OpenAI
- DeepSeek
- Moonshot
- 任何 OpenAI 兼容的 API（如本地 Ollama）

---

## 智能合约

`DataVault` 合约使用 Sui 的原生特性：

- **拥有对象**：DataVault 由用户拥有，确保100%控制权
- **动态字段**：授权和数据块引用存储为动态字段
- **即时撤销**：用户可以随时撤销访问权限，因为授权数据存储在用户的 vault 中

### 已部署合约（测试网）

- **Package ID**: `0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6`
- **交易哈希**: `AdH8tBSVJ87FRG8tPuG2NDSUtX9F4ExBwZ9SuDt5Q4M6`

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15, TypeScript, Tailwind CSS |
| 区块链 | Sui, Move 2024 |
| 存储 | Walrus |
| AI | 任何 OpenAI 兼容的 API |
| 部署 | Vercel |

---

## 安全模型

1. **加密密钥**：通过 HKDF 从钱包签名派生，从不存储在任何服务器
2. **静态数据**：在 Walrus 上使用 AES-256-GCM 加密，只有用户能解密
3. **访问控制**：链上授权存储在用户的 vault 中，即时撤销
4. **处理过程**：无状态无服务器函数，无数据库，无日志，无持久化
5. **API密钥**：用户自己提供，只存储在浏览器 localStorage

---

## 许可证

MIT License

---

## 链接

- [GitHub仓库](https://github.com/Azurboy/MindVault-VibeSui)
- [Sui文档](https://docs.sui.io/)
- [Walrus文档](https://docs.walrus.site/)
