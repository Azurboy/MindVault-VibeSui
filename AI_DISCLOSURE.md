# AI Usage Disclosure | AI 使用披露

This document discloses the use of AI tools in the development of MindVault, as required by the hackathon rules.

本文档披露 MindVault 开发过程中使用的 AI 工具，符合黑客松比赛要求。

---

## AI Tools Used | 使用的 AI 工具

| Tool | Model Version | Usage |
|------|---------------|-------|
| **Claude Code (CLI)** | Claude Opus 4.6 (`claude-opus-4-6-cc`) | Primary development assistant |

---

## Collaboration Log | 协作记录

The complete conversation log with Claude is available in:

完整的 Claude 对话记录位于：

```
AI_COLLABORATION_LOG.jsonl
```

This file contains the full transcript of all AI-assisted development sessions, including:
- Architecture design discussions
- Code implementation
- Bug fixes
- README writing
- Feature planning

该文件包含所有 AI 辅助开发会话的完整记录，包括：
- 架构设计讨论
- 代码实现
- Bug 修复
- README 编写
- 功能规划

---

## Key Prompts | 关键 Prompt

### 1. Initial Architecture Design

```
构建一个基于 Sui 区块链的隐私 AI API 网关，让用户拥有自己的 AI 对话数据，
通过客户端加密和链上授权管理，确保数据所有权 100% 归用户所有。
```

### 2. Manual Sync Feature

```
帮我修改一下项目。现在项目每一次和AI对话时都要链接钱包，非常地麻烦。
我想改一下逻辑，改为"手动存档"。

逻辑：聊天时只在本地（Local Storage / 内存）跑，完全不与 Sui 交互。
修改：在聊天界面加一个显眼的按钮 "Sync Session to Vault"。
效果：用户聊了 n 句，觉得这段对话很棒，点击一次"同步"，弹窗一次，把这 10 句打包上链。
```

### 3. README Rewrite

```
重新写readme。新功能不应该写成新功能，而是应该融入整个叙事中。
我想要一个宣言式的开头，诚实地说明我们能做到什么、不能做到什么。
```

### 4. Wallet Persistence Fix

```
上一版本中我发现网站似乎不会存储钱包的登录信息，
往往总是一直在重复要求链接钱包输入密码等操作，有点麻烦，重点关注这块儿。
```

---

## What AI Helped With | AI 帮助完成的内容

1. **Smart Contract Design** - DataVault Move contract with dynamic fields
2. **Frontend Implementation** - React components, hooks, encryption service
3. **Encryption Architecture** - AES-256-GCM with HKDF key derivation
4. **Walrus Integration** - Upload/download encrypted blobs
5. **Proof Verification System** - On-chain timestamp verification
6. **Manual Sync Pattern** - Local-first with batch upload
7. **Documentation** - README, architecture diagrams

---

## Human Contributions | 人类贡献

1. **Product Vision** - Core concept of privacy-first AI chat
2. **UX Decisions** - Manual sync vs auto-sync choice
3. **Narrative Direction** - README tone and messaging
4. **Testing & Feedback** - Identifying wallet persistence issues
5. **Final Review** - All code reviewed and approved by human

---

## Verification | 验证

The AI collaboration log (`AI_COLLABORATION_LOG.jsonl`) can be parsed to verify:
- Timestamps of all interactions
- Exact prompts given by human
- Exact responses from AI
- All code generated

AI 协作日志可用于验证：
- 所有交互的时间戳
- 人类给出的确切 prompt
- AI 的确切回复
- 所有生成的代码
