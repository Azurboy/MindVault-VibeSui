# MindVault

> **Your AI conversations. Your encryption keys. Your rules.**

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## The Problem

Every message you send to ChatGPT, Claude, or any AI service is:

- **Tied to your identity** — email, phone, payment method
- **Stored on their servers** — indefinitely, without your control
- **Potentially used for training** — your thoughts become their product
- **Building your psychological profile** — one conversation at a time

You're not just asking questions. You're handing over your thought patterns, business secrets, personal struggles, and creative ideas — all linked to who you are.

**MindVault exists because this shouldn't be normal.**

---

## The Solution

MindVault is a privacy-first AI chat interface where:

| What | How |
|------|-----|
| **Your messages are encrypted** | AES-256-GCM encryption happens in your browser, before anything leaves |
| **You hold the keys** | Encryption key derived from your wallet signature — only you can decrypt |
| **Storage is decentralized** | Encrypted data stored on Walrus, metadata on Sui blockchain |
| **History belongs to you** | Load past conversations anytime, from any device, with your wallet |
| **Proofs are on-chain** | Tamper-proof timestamps prove when conversations happened |

---

## Who Is This For?

### The Privacy-Conscious Professional

**Sarah** is a startup founder who uses AI to brainstorm product strategies, draft investor emails, and analyze competitors. Her conversations contain trade secrets she'd never share publicly.

*With traditional AI services:* All her strategic thinking is stored on OpenAI's servers, tied to her company email, potentially used for training, and vulnerable to data breaches.

*With MindVault:* Her conversations are encrypted before leaving her browser. Even if Walrus is compromised, attackers get meaningless ciphertext. She can prove when she had an idea (for IP disputes) without revealing what it was.

---

### The Researcher Who Needs Proof

**Dr. Chen** is documenting a novel research methodology through AI-assisted brainstorming. Six months later, a competitor publishes something similar.

*The problem:* Screenshots can be faked. Server logs can be altered. How do you prove you had the idea first?

*With MindVault:* Every conversation is anchored to the Sui blockchain with a precise timestamp. Dr. Chen exports a cryptographic proof showing her encrypted conversation existed on a specific date. She can optionally reveal the content to prove what was inside. The blockchain doesn't lie.

---

### The User Who Wants Control

**Alex** simply doesn't want a corporation building a psychological profile from years of AI conversations. He wants to use AI without becoming the product.

*With MindVault:*
- Identity = wallet address (pseudonymous)
- Current conversation = sent to AI, but can use anonymous API relays
- History = encrypted, only Alex can read it

Even if data leaks, it's **fragmented, encrypted, and unlinked**. A broken profile is infinitely better than a complete one.

---

## Privacy Levels

Choose your tradeoff:

| Setup | Who sees your data? |
|-------|---------------------|
| MindVault + OpenAI/Claude API | Storage: Only you / Inference: Provider sees current message |
| MindVault + Anonymous API relay | Storage: Only you / Inference: No identity link |
| MindVault + Local model (Ollama) | Storage: Only you / Inference: Never leaves your device |

**Key insight:** Pair MindVault with an anonymous API (crypto payment, no account) for true end-to-end privacy.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR BROWSER (Trust Zone)                    │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────────┐  │
│  │ Sui Wallet│  │ AES-256   │  │ Key = HKDF(wallet.sign(...))│  │
│  │ (identity)│  │ (encrypt) │  │ (only you have this)        │  │
│  └───────────┘  └───────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                     ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│   COLD STORAGE (Web3)   │       │   HOT PROCESSING (Stateless)│
│                         │       │                             │
│  Sui: metadata, proofs  │       │  API Routes: call LLM,      │
│  Walrus: encrypted blobs│       │  return response, forget    │
│                         │       │                             │
│  📌 You own this. 100%. │       │  📌 We see it briefly,      │
│                         │       │     but never store it.     │
└─────────────────────────┘       └─────────────────────────────┘
```

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

## What We're Building Toward

MindVault today is step one. The vision:

- **TEE-based inference** — AI runs in secure enclaves, even we can't see your data
- **Crypto payments** — No identity required, ever
- **Fully trustless pipeline** — Verifiable from input to output

*Why not today?* TEE + LLM is experimental, performance overhead is significant, infrastructure isn't mature. But the direction is clear.

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

> **你的 AI 对话。你的加密密钥。你的规则。**

---

## 问题

每次你向 ChatGPT、Claude 或任何 AI 服务发送消息：

- **与你的身份绑定** —— 邮箱、手机号、支付方式
- **存储在他们的服务器上** —— 无限期，你无法控制
- **可能用于训练** —— 你的思想成为他们的产品
- **构建你的心理画像** —— 一次对话接一次

你不只是在提问。你在交出你的思维模式、商业机密、个人困扰和创意想法——全部与你的身份关联。

**MindVault 的存在，是因为这不应该成为常态。**

---

## 解决方案

MindVault 是一个隐私优先的 AI 聊天界面：

| 什么 | 如何实现 |
|------|---------|
| **消息被加密** | AES-256-GCM 加密在浏览器中完成，数据离开前已加密 |
| **密钥在你手中** | 加密密钥从钱包签名派生——只有你能解密 |
| **存储去中心化** | 加密数据存储在 Walrus，元数据在 Sui 区块链 |
| **历史属于你** | 随时从任何设备加载过去的对话，用你的钱包 |
| **证明在链上** | 防篡改的时间戳证明对话何时发生 |

---

## 这是给谁用的？

### 注重隐私的专业人士

**Sarah** 是一位创业公司创始人，她用 AI 来头脑风暴产品策略、起草投资人邮件、分析竞争对手。她的对话包含她绝不会公开分享的商业机密。

*使用传统 AI 服务：* 她所有的战略思考都存储在 OpenAI 的服务器上，与她的公司邮箱绑定，可能用于训练，容易受到数据泄露的影响。

*使用 MindVault：* 她的对话在离开浏览器前就被加密。即使 Walrus 被攻破，攻击者得到的只是无意义的密文。她可以证明她何时有了某个想法（用于知识产权纠纷），而不需要透露想法是什么。

---

### 需要证明的研究者

**陈博士** 正在通过 AI 辅助的头脑风暴记录一种新颖的研究方法。六个月后，一个竞争对手发表了类似的东西。

*问题：* 截图可以伪造。服务器日志可以被篡改。你怎么证明你先想到的？

*使用 MindVault：* 每次对话都锚定到 Sui 区块链，带有精确的时间戳。陈博士导出一个密码学证明，显示她的加密对话在特定日期存在。她可以选择性地揭示内容来证明里面是什么。区块链不会说谎。

---

### 想要掌控的用户

**Alex** 只是不想让一家公司从他多年的 AI 对话中构建心理画像。他想使用 AI，但不想成为产品。

*使用 MindVault：*
- 身份 = 钱包地址（匿名）
- 当前对话 = 发送给 AI，但可以使用匿名 API 中转
- 历史记录 = 加密，只有 Alex 能读取

即使数据泄露，它也是**碎片化的、加密的、无法关联的**。破碎的画像比完整的画像好无限倍。

---

## 隐私级别

选择你的权衡：

| 设置 | 谁能看到你的数据？ |
|------|-------------------|
| MindVault + OpenAI/Claude API | 存储：只有你 / 推理：提供商看到当前消息 |
| MindVault + 匿名 API 中转 | 存储：只有你 / 推理：无身份关联 |
| MindVault + 本地模型 (Ollama) | 存储：只有你 / 推理：永不离开你的设备 |

**关键洞察：** 将 MindVault 与匿名 API（加密货币支付，无需账号）配合使用，实现真正的端到端隐私。

---

## 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     你的浏览器（信任区）                          │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────────┐  │
│  │ Sui 钱包  │  │ AES-256   │  │ 密钥 = HKDF(钱包签名(...))  │  │
│  │ （身份）  │  │ （加密）  │  │ （只有你有这个）            │  │
│  └───────────┘  └───────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                     ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│   冷存储（Web3）         │       │   热处理（无状态）           │
│                         │       │                             │
│  Sui: 元数据、证明       │       │  API 路由：调用 LLM，       │
│  Walrus: 加密数据块      │       │  返回响应，然后遗忘         │
│                         │       │                             │
│  📌 这是你的。100%。    │       │  📌 我们短暂看到，          │
│                         │       │     但从不存储。            │
└─────────────────────────┘       └─────────────────────────────┘
```

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

## 我们正在构建的未来

今天的 MindVault 是第一步。愿景：

- **基于 TEE 的推理** —— AI 在安全飞地中运行，即使我们也看不到你的数据
- **加密货币支付** —— 永远不需要身份
- **完全无需信任的流程** —— 从输入到输出都可验证

*为什么现在做不到？* TEE + LLM 还在实验阶段，性能开销显著，基础设施不成熟。但方向是明确的。

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
