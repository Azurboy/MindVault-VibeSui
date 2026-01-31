# AI Usage Disclosure

This document discloses the use of AI tools in the development of MindVault, as required by the hackathon rules.

## AI Tools Used

### 1. Claude (Anthropic)

- **Model Version**: Claude Opus 4.5 (claude-opus-4-5-20251101)
- **Tool**: Claude Code CLI
- **Usage**: Code generation, architecture design, documentation

### Key Prompts Used

#### Project Architecture Design

```
Implement the following plan:

# MindVault: 隐私 AI API 网关 - 实施计划

> **GitHub 仓库**: https://github.com/Azurboy/MindVault-Sui

## 项目概述

构建一个基于 Sui 区块链的隐私 AI API 网关，让用户拥有自己的 AI 对话数据，通过客户端加密和链上授权管理，确保数据所有权 100% 归用户所有。

[Full implementation plan with architecture diagrams, code snippets, and technical specifications]
```

#### Smart Contract Development

The Move smart contract was developed with AI assistance for:
- Sui-native object model design (Owned Objects, Dynamic Fields)
- Authorization management using Dynamic Fields instead of transferable capabilities
- Event emission for frontend integration

#### Frontend Development

AI assistance was used for:
- Next.js 14 App Router structure
- Sui dapp-kit integration
- Client-side encryption implementation (AES-256-GCM with HKDF key derivation)
- Walrus storage integration
- React component development

## Human Contributions

- Overall product vision and requirements
- Architecture decisions and trade-offs
- Security model design
- Testing and validation
- Deployment configuration

## Verification

All AI-generated code was reviewed and tested by human developers before inclusion in the final project.

---

*This disclosure is provided in compliance with hackathon requirements for AI tool usage transparency.*
