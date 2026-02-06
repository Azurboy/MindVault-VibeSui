# MindVault

> **Your AI conversations. Decoupled from your identity. Stored in your own vault.**

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## The Problem

There are two ways people interact with AI today. Both have serious issues:

### Web Apps (ChatGPT, Claude, Gemini...)

Every conversation is **permanently tied to your identity** — email, phone, payment method. Over time, these platforms build a complete psychological profile: your anxieties, your ambitions, your secrets. All linked to exactly who you are.

### API Clients (SillyTavern, Cherry Studio, etc.)

You call APIs directly, which provides some anonymity. But your conversation history is **scattered across local files**, impossible to sync across devices, easy to lose, hard to migrate. There's no continuity, no provable record.

| | Web Apps | API Clients | MindVault |
|---|----------|-------------|-----------|
| Identity binding | ❌ Strongly tied | ✅ Decoupled | ✅ Decoupled |
| Data persistence | ✅ Cloud-synced | ❌ Local only, fragile | ✅ On-chain vault |
| Cross-device access | ✅ Yes | ❌ Manual export | ✅ Wallet = access |
| Context control | ❌ Platform holds all | ⚠️ Manual copy-paste | ✅ Selective disclosure |
| Provable timestamps | ❌ No | ❌ No | ✅ Blockchain-anchored |

---

## What MindVault Actually Does (Today)

Let's be honest about what we can and cannot do:

### ✅ What We Solve Now

1. **Identity-Data Decoupling**
   - Each API call is independent, can route through anonymous relays
   - The AI provider may see your message content, but **cannot link it to your real identity**
   - They might know "someone is worried about a promotion" — but not *who*

2. **Persistent, Portable Chat Vault**
   - Your conversations are encrypted client-side (AES-256-GCM) and stored on Walrus
   - Your wallet = your key. Access your history from any device, anytime
   - No more losing years of AI conversations when you switch computers

3. **Selective Context Disclosure**
   - You choose which past conversations to include as context
   - Minimum necessary disclosure — don't hand over your entire history every time

4. **On-Chain Provenance**
   - Every conversation gets a tamper-proof timestamp on Sui
   - Perfect for: IP disputes, research priority, proving AI collaboration
   - "Code is cheap, show me the prompt" — now you can actually prove it

### ⚠️ Current Limitations (We're Honest)

- **API providers still see current messages** — they just can't link them to your identity
- **This is progressive privacy, not absolute privacy** — we reduce exposure, not eliminate it
- **On-chain storage has costs** — meaningful for heavy users

---

## Who Is This For?

### The Privacy-Conscious Professional

**Sarah** uses AI for business strategy. With ChatGPT, her company's secrets are stored on OpenAI's servers, tied to her work email.

*With MindVault:* Her conversations are encrypted and identity-decoupled. Even if data leaks, it can't be traced back to Sarah or her company.

### The Creator Who Needs Proof

**Alex** is a hackathon participant. The judges want to see his AI collaboration process — "show me the prompt." Screenshots can be faked.

*With MindVault:* His entire conversation history is anchored on-chain with timestamps. He can prove exactly when he had each idea, verifiable by anyone.

### The Power User Who Wants Continuity

**Dr. Chen** has used AI clients like Cherry Studio for years, but lost months of valuable research conversations when her laptop died.

*With MindVault:* Her chat history lives on Walrus, accessible from any device with her wallet. Switch computers, switch clients — her context follows her.

---

## Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR BROWSER (Trust Zone)                    │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────────┐  │
│  │ Sui Wallet│  │ AES-256   │  │ Key = HKDF(wallet.sign(...))│  │
│  │ (identity)│  │ (encrypt) │  │ (only you have this)        │  │
│  └───────────┘  └───────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                                     │
           ▼                                     ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│   YOUR VAULT (Web3)     │       │   API CALL (Stateless)      │
│                         │       │                             │
│  Sui: metadata, proofs  │       │  → Anonymous relay (opt.)   │
│  Walrus: encrypted blobs│       │  → LLM processes message    │
│                         │       │  → Response returned        │
│  📌 Encrypted. Yours.   │       │  📌 Sees content, not you.  │
└─────────────────────────┘       └─────────────────────────────┘
```

### Privacy Levels

| Setup | Storage | Inference |
|-------|---------|-----------|
| MindVault + Direct API | Only you | Provider sees content, not identity |
| MindVault + Anonymous relay | Only you | No identity link at all |
| MindVault + Local model | Only you | Never leaves your device |

---

## Roadmap: From Today to True Privacy

### Phase 1: Now (Identity Decoupling + On-Chain Vault)
- ✅ Client-side encryption with wallet-derived keys
- ✅ Decentralized storage on Walrus + Sui
- ✅ Selective context disclosure
- ✅ On-chain timestamps for provenance
- ⚠️ API providers see content (but not identity)

### Phase 2: Next (Anonymous API Layer)
- 🔄 Built-in anonymous relay integration
- 🔄 Crypto payments for API calls (no account needed)
- 🔄 Multi-provider routing for redundancy

### Phase 3: Endgame (TEE-Based Inference)
- 🎯 MindVault becomes an API provider itself
- 🎯 AI runs inside TEE (Trusted Execution Environment)
- 🎯 Even we cannot see your data during inference
- 🎯 On-chain authorization: grant/revoke access anytime
- 🎯 Fully verifiable pipeline from input to output

*Why not jump to Phase 3?* TEE + LLM is still experimental, performance overhead is significant, and infrastructure isn't mature. But the direction is clear — we're building toward true end-to-end privacy.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/Azurboy/MindVault-VibeSui.git
cd MindVault-VibeSui/frontend
npm install

# Configure
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_PACKAGE_ID=0xd8e2b3...

# Run
npm run dev
```

Then: Connect wallet → Settings → Add your AI provider → Start chatting

---

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Azurboy/MindVault-VibeSui&root-directory=frontend&env=NEXT_PUBLIC_PACKAGE_ID)

Set **Root Directory** to `frontend`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, TypeScript, Tailwind |
| Blockchain | Sui (Move 2024) |
| Storage | Walrus |
| Encryption | AES-256-GCM, HKDF |
| AI | Any OpenAI-compatible API |

---

## Links

- **[Live Demo](https://mind-vault-vibe-sui.vercel.app)**
- [GitHub](https://github.com/Azurboy/MindVault-VibeSui)
- [Sui Docs](https://docs.sui.io/) · [Walrus Docs](https://docs.walrus.site/)

---

<a name="中文"></a>

# MindVault

> **你的 AI 对话。与身份解耦。存入你自己的保险箱。**

---

## 问题

当今人们与 AI 交互有两种方式，都有严重问题：

### 网页应用（ChatGPT、Claude、Gemini...）

每次对话都**永久绑定你的身份** —— 邮箱、手机号、支付方式。随着时间推移，这些平台会构建出一个完整的心理画像：你的焦虑、你的野心、你的秘密。全部关联到你这个人。

### API 客户端（酒馆/SillyTavern、Cherry Studio 等）

你直接调用 API，获得了一定的匿名性。但你的对话历史**散落在本地文件中**，无法跨设备同步，容易丢失，难以迁移。没有连续性，没有可证明的记录。

| | 网页应用 | API 客户端 | MindVault |
|---|----------|-------------|-----------|
| 身份绑定 | ❌ 强绑定 | ✅ 解耦 | ✅ 解耦 |
| 数据持久化 | ✅ 云同步 | ❌ 仅本地，脆弱 | ✅ 链上保险箱 |
| 跨设备访问 | ✅ 是 | ❌ 手动导出 | ✅ 钱包即访问 |
| 上下文控制 | ❌ 平台持有全部 | ⚠️ 手动复制粘贴 | ✅ 选择性披露 |
| 可证明时间戳 | ❌ 无 | ❌ 无 | ✅ 区块链锚定 |

---

## MindVault 现在能做什么（实话实说）

让我们诚实地说明我们能做和不能做的事：

### ✅ 我们现在解决的问题

1. **身份-数据解耦**
   - 每次 API 调用独立，可通过匿名中转路由
   - AI 提供商可能看到你的消息内容，但**无法将其与你的真实身份关联**
   - 他们可能知道"有人在担心升职问题"——但不知道*是谁*

2. **持久化、可迁移的聊天保险箱**
   - 你的对话在客户端加密（AES-256-GCM）并存储在 Walrus
   - 你的钱包 = 你的密钥。随时从任何设备访问你的历史
   - 换电脑再也不会丢失多年的 AI 对话

3. **选择性上下文披露**
   - 你选择将哪些过往对话作为上下文
   - 最小必要披露 —— 不必每次都交出全部历史

4. **链上溯源**
   - 每次对话都在 Sui 上获得防篡改的时间戳
   - 完美适用于：知识产权纠纷、研究优先权、证明 AI 协作
   - "Code is cheap, show me the prompt" —— 现在你可以真正证明它了

### ⚠️ 当前局限（我们诚实相告）

- **API 提供商仍能看到当前消息** —— 只是无法将其与你的身份关联
- **这是渐进式隐私，不是绝对隐私** —— 我们减少暴露，而非消除
- **链上存储有成本** —— 对重度用户有影响

---

## 这是给谁用的？

### 注重隐私的专业人士

**Sarah** 用 AI 做商业战略。用 ChatGPT 时，她公司的机密存储在 OpenAI 服务器上，绑定她的工作邮箱。

*使用 MindVault：* 她的对话被加密且与身份解耦。即使数据泄露，也无法追溯到 Sarah 或她的公司。

### 需要证明的创作者

**Alex** 是一名黑客松参赛者。评委想看他的 AI 协作过程 —— "show me the prompt"。截图可以伪造。

*使用 MindVault：* 他的整个对话历史都锚定在链上并带有时间戳。他可以证明每个想法的确切产生时间，任何人都可验证。

### 追求连续性的重度用户

**陈博士** 多年来一直使用 Cherry Studio 等 AI 客户端，但笔记本电脑坏掉时丢失了几个月宝贵的研究对话。

*使用 MindVault：* 她的聊天历史存储在 Walrus 上，用钱包从任何设备都能访问。换电脑、换客户端 —— 她的上下文跟着她走。

---

## 隐私架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     你的浏览器（信任区）                          │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────────┐  │
│  │ Sui 钱包  │  │ AES-256   │  │ 密钥 = HKDF(钱包签名(...))  │  │
│  │ （身份）  │  │ （加密）  │  │ （只有你有这个）            │  │
│  └───────────┘  └───────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                                     │
           ▼                                     ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│   你的保险箱（Web3）     │       │   API 调用（无状态）         │
│                         │       │                             │
│  Sui: 元数据、证明       │       │  → 匿名中转（可选）          │
│  Walrus: 加密数据块      │       │  → LLM 处理消息             │
│                         │       │  → 返回响应                 │
│  📌 加密的。你的。       │       │  📌 看到内容，不知道是谁。   │
└─────────────────────────┘       └─────────────────────────────┘
```

### 隐私级别

| 设置 | 存储 | 推理 |
|------|------|------|
| MindVault + 直连 API | 只有你 | 提供商看到内容，不知身份 |
| MindVault + 匿名中转 | 只有你 | 完全无身份关联 |
| MindVault + 本地模型 | 只有你 | 永不离开你的设备 |

---

## 路线图：从今天到真正的隐私

### 第一阶段：现在（身份解耦 + 链上保险箱）
- ✅ 钱包派生密钥的客户端加密
- ✅ Walrus + Sui 去中心化存储
- ✅ 选择性上下文披露
- ✅ 链上时间戳用于溯源
- ⚠️ API 提供商看到内容（但不知身份）

### 第二阶段：下一步（匿名 API 层）
- 🔄 内置匿名中转集成
- 🔄 加密货币支付 API 调用（无需账号）
- 🔄 多提供商路由以提高冗余性

### 第三阶段：终局（基于 TEE 的推理）
- 🎯 MindVault 自己成为 API 提供商
- 🎯 AI 在 TEE（可信执行环境）内运行
- 🎯 即使我们也无法在推理时看到你的数据
- 🎯 链上授权：随时授予/撤销访问权限
- 🎯 从输入到输出完全可验证的流程

*为什么不直接跳到第三阶段？* TEE + LLM 仍在实验阶段，性能开销显著，基础设施不成熟。但方向是明确的 —— 我们正在构建真正的端到端隐私。

---

## 快速开始

```bash
# 克隆并安装
git clone https://github.com/Azurboy/MindVault-VibeSui.git
cd MindVault-VibeSui/frontend
npm install

# 配置
cp .env.example .env.local
# 编辑 .env.local: NEXT_PUBLIC_PACKAGE_ID=0xd8e2b3...

# 运行
npm run dev
```

然后：连接钱包 → 设置 → 添加你的 AI 提供商 → 开始聊天

---

## 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Azurboy/MindVault-VibeSui&root-directory=frontend&env=NEXT_PUBLIC_PACKAGE_ID)

将 **Root Directory** 设置为 `frontend`

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15, TypeScript, Tailwind |
| 区块链 | Sui (Move 2024) |
| 存储 | Walrus |
| 加密 | AES-256-GCM, HKDF |
| AI | 任何 OpenAI 兼容的 API |

---

## 链接

- **[在线体验](https://mind-vault-vibe-sui.vercel.app)**
- [GitHub](https://github.com/Azurboy/MindVault-VibeSui)
- [Sui 文档](https://docs.sui.io/) · [Walrus 文档](https://docs.walrus.site/)
