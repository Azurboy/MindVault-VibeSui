# MindVault: Privacy AI API Gateway

[English](#english) | [中文](#中文)

---

<a name="english"></a>

> Own your AI conversation data with client-side encryption and blockchain-based access control on Sui.

## Vision

**Current Phase**: MindVault enables users to securely manage and encrypt their AI conversation memories. Your chat history, preferences, and AI interactions are encrypted client-side and stored on decentralized infrastructure - only you hold the keys.

**Future Roadmap**: We aim to become a **decentralized AI API layer** that fundamentally transforms how AI services handle user data:

- **Cryptographic Privacy**: Implement advanced cryptographic protocols (MPC, FHE, TEE) to enable AI inference on encrypted data
- **Distributed AI Network**: Build a decentralized network of AI providers where no single entity can access user data
- **Zero-Knowledge Proofs**: Verify AI computations without revealing underlying data
- **User-Sovereign AI**: Create a world where users truly own their AI interactions, with complete privacy guarantees

## Overview

MindVault is a privacy-focused AI API gateway that gives users 100% ownership of their AI conversation data. Using client-side encryption and Sui blockchain for access control, your data remains private and under your control.

### Key Features

- **Client-Side Encryption**: AES-256-GCM encryption in your browser before data leaves your device
- **Walrus Storage**: Encrypted data stored on decentralized Walrus storage
- **Sui Access Control**: On-chain authorization management with instant revocation
- **Stateless Processing**: AI inference in serverless functions with no data persistence
- **Multi-Provider Support**: Claude AI provider (more coming soon)

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
│   🧊 Cold Storage Layer       │  │   🔥 Hot Processing Layer                  │
│        100% Web3              │  │      Stateless Enclave                    │
├───────────────────────────────┤  ├───────────────────────────────────────────┤
│  Sui Blockchain               │  │  Next.js API Routes (Serverless)          │
│  - DataVault Object           │  │  - READ: Receive decrypted plaintext      │
│  - Authorization (Dynamic)    │  │  - PROCESS: Call LLM                      │
│                               │  │  - FORGET: Memory released, no persistence│
│  Walrus Storage               │  │                                           │
│  - AES-256 encrypted blobs    │  │  LLM APIs: Claude                         │
└───────────────────────────────┘  └───────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Blockchain | Sui, Move 2024 |
| Storage | Walrus |
| AI | Anthropic Claude API |
| Deployment | Vercel |

## Project Structure

```
SuiVibe/
├── contracts/
│   └── data_vault/
│       ├── Move.toml
│       └── sources/
│           └── data_vault.move    # Sui smart contract
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js pages
│   │   ├── components/            # React components
│   │   ├── hooks/                 # Custom hooks
│   │   └── lib/                   # Utilities
│   └── package.json
├── README.md
└── AI_DISCLOSURE.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Sui CLI
- Sui Wallet (Sui Wallet, Suiet, etc.)

### 1. Clone the Repository

```bash
git clone https://github.com/Azurboy/SuiVibe.git
cd SuiVibe
```

### 2. Deploy Smart Contract

```bash
cd contracts/data_vault
sui client publish --gas-budget 100000000
```

Note the Package ID from the output.

**Deployed Contract (Testnet):**
- Package ID: `0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6`
- Transaction: `AdH8tBSVJ87FRG8tPuG2NDSUtX9F4ExBwZ9SuDt5Q4M6`

### 3. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_PACKAGE_ID=0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6
ANTHROPIC_API_KEY=<your_anthropic_key>
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contract

The `DataVault` contract uses Sui's native features:

- **Owned Objects**: DataVault is owned by the user, ensuring 100% control
- **Dynamic Fields**: Authorization and blob references stored as dynamic fields
- **Instant Revocation**: Users can revoke access anytime since auth data lives in their vault

### Key Functions

```move
// Create a new vault
public entry fun create_vault(clock: &Clock, ctx: &mut TxContext)

// Store encrypted blob reference
public entry fun store_blob(vault: &mut DataVault, blob_id: vector<u8>, ...)

// Grant access to a provider
public entry fun grant_access(vault: &mut DataVault, provider: address, scope: u8, ...)

// Revoke access (user can always do this)
public entry fun revoke_access(vault: &mut DataVault, provider: address, ...)
```

## Security Model

1. **Encryption Key**: Derived from wallet signature using HKDF, never stored
2. **Data at Rest**: AES-256-GCM encrypted on Walrus
3. **Access Control**: On-chain authorization in user's vault
4. **Processing**: Stateless serverless functions, no persistence

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Set Root Directory to `frontend`
4. Set environment variables
5. Deploy

### Contract Deployment

```bash
# Testnet
sui client publish --gas-budget 100000000

# Mainnet (when ready)
sui client switch --env mainnet
sui client publish --gas-budget 100000000
```

## License

MIT License

## Links

- [GitHub Repository](https://github.com/Azurboy/SuiVibe)
- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.walrus.site/)

---

<a name="中文"></a>

# MindVault: 隐私AI API网关

> 通过客户端加密和Sui区块链访问控制，真正拥有你的AI对话数据。

## 愿景

**当前阶段**：MindVault让用户能够安全地管理和加密他们的AI对话记忆。你的聊天历史、偏好设置和AI交互都在客户端加密后存储在去中心化基础设施上——只有你持有密钥。

**未来路线图**：我们的目标是成为一个**去中心化AI API层**，从根本上改变AI服务处理用户数据的方式：

- **密码学隐私**：实现先进的密码学协议（MPC多方计算、FHE全同态加密、TEE可信执行环境），在加密数据上进行AI推理
- **分布式AI网络**：构建去中心化的AI提供商网络，没有任何单一实体能够访问用户数据
- **零知识证明**：在不泄露底层数据的情况下验证AI计算结果
- **用户主权AI**：创造一个用户真正拥有其AI交互的世界，提供完整的隐私保障

## 概述

MindVault是一个以隐私为核心的AI API网关，让用户100%拥有自己的AI对话数据。通过客户端加密和Sui区块链访问控制，你的数据始终保持私密并在你的掌控之下。

### 核心特性

- **客户端加密**：数据离开设备前在浏览器中使用AES-256-GCM加密
- **Walrus存储**：加密数据存储在去中心化的Walrus存储上
- **Sui访问控制**：链上授权管理，支持即时撤销
- **无状态处理**：AI推理在无服务器函数中进行，不持久化任何数据
- **多提供商支持**：支持Claude AI（更多即将推出）

## 架构

### 双层隐私模型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           用户浏览器（信任区域）                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │ Sui钱包     │  │ AES-256     │  │ 密钥派生（来自钱包签名）              │  │
│  │ 连接        │  │ 加密        │  │ Key = HKDF(wallet.sign("mindvault"))│  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────────────────┐  ┌───────────────────────────────────────────┐
│   🧊 冷存储层                  │  │   🔥 热处理层                              │
│      100% Web3                │  │      无状态飞地                            │
├───────────────────────────────┤  ├───────────────────────────────────────────┤
│  Sui区块链                    │  │  Next.js API路由（无服务器）               │
│  - DataVault对象              │  │  - 读取：接收解密后的明文                  │
│  - 授权（动态字段）            │  │  - 处理：调用LLM                          │
│                               │  │  - 遗忘：内存释放，无持久化                │
│  Walrus存储                   │  │                                           │
│  - AES-256加密的数据块         │  │  LLM APIs: Claude                         │
└───────────────────────────────┘  └───────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15, TypeScript, Tailwind CSS |
| 区块链 | Sui, Move 2024 |
| 存储 | Walrus |
| AI | Anthropic Claude API |
| 部署 | Vercel |

## 项目结构

```
SuiVibe/
├── contracts/
│   └── data_vault/
│       ├── Move.toml
│       └── sources/
│           └── data_vault.move    # Sui智能合约
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js页面
│   │   ├── components/            # React组件
│   │   ├── hooks/                 # 自定义Hooks
│   │   └── lib/                   # 工具库
│   └── package.json
├── README.md
└── AI_DISCLOSURE.md
```

## 快速开始

### 前置要求

- Node.js 18+
- Sui CLI
- Sui钱包（Sui Wallet、Suiet等）

### 1. 克隆仓库

```bash
git clone https://github.com/Azurboy/SuiVibe.git
cd SuiVibe
```

### 2. 部署智能合约

```bash
cd contracts/data_vault
sui client publish --gas-budget 100000000
```

记录输出中的Package ID。

**已部署合约（测试网）：**
- Package ID: `0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6`
- 交易哈希: `AdH8tBSVJ87FRG8tPuG2NDSUtX9F4ExBwZ9SuDt5Q4M6`

### 3. 设置前端

```bash
cd frontend
npm install
cp .env.example .env.local
```

编辑 `.env.local` 配置：
```
NEXT_PUBLIC_PACKAGE_ID=0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6
ANTHROPIC_API_KEY=<你的anthropic密钥>
```

### 4. 运行开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 智能合约

`DataVault` 合约使用Sui的原生特性：

- **拥有对象**：DataVault由用户拥有，确保100%控制权
- **动态字段**：授权和数据块引用存储为动态字段
- **即时撤销**：用户可以随时撤销访问权限，因为授权数据存储在用户的vault中

### 核心函数

```move
// 创建新的vault
public entry fun create_vault(clock: &Clock, ctx: &mut TxContext)

// 存储加密数据块引用
public entry fun store_blob(vault: &mut DataVault, blob_id: vector<u8>, ...)

// 授予提供商访问权限
public entry fun grant_access(vault: &mut DataVault, provider: address, scope: u8, ...)

// 撤销访问权限（用户随时可以执行）
public entry fun revoke_access(vault: &mut DataVault, provider: address, ...)
```

## 安全模型

1. **加密密钥**：通过HKDF从钱包签名派生，从不存储
2. **静态数据**：在Walrus上使用AES-256-GCM加密
3. **访问控制**：链上授权存储在用户的vault中
4. **处理过程**：无状态无服务器函数，无持久化

## 部署

### Vercel部署

1. 推送到GitHub
2. 在Vercel中导入项目
3. 设置Root Directory为 `frontend`
4. 设置环境变量
5. 部署

### 合约部署

```bash
# 测试网
sui client publish --gas-budget 100000000

# 主网（准备就绪时）
sui client switch --env mainnet
sui client publish --gas-budget 100000000
```

## 许可证

MIT License

## 链接

- [GitHub仓库](https://github.com/Azurboy/SuiVibe)
- [Sui文档](https://docs.sui.io/)
- [Walrus文档](https://docs.walrus.site/)
