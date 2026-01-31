# MindVault: Privacy AI API Gateway

> Own your AI conversation data with client-side encryption and blockchain-based access control on Sui.

## Overview

MindVault is a privacy-focused AI API gateway that gives users 100% ownership of their AI conversation data. Using client-side encryption and Sui blockchain for access control, your data remains private and under your control.

### Key Features

- **Client-Side Encryption**: AES-256-GCM encryption in your browser before data leaves your device
- **Walrus Storage**: Encrypted data stored on decentralized Walrus storage
- **Sui Access Control**: On-chain authorization management with instant revocation
- **Stateless Processing**: AI inference in serverless functions with no data persistence
- **Multi-Provider Support**: OpenAI and Claude AI providers

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
│  - AES-256 encrypted blobs    │  │  LLM APIs: OpenAI / Claude                │
└───────────────────────────────┘  └───────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+, TypeScript, Tailwind CSS |
| Blockchain | Sui, Move 2024 |
| Storage | Walrus |
| AI | OpenAI API, Anthropic Claude API |
| Deployment | Vercel |

## Project Structure

```
MindVault-Sui/
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
git clone https://github.com/Azurboy/MindVault-Sui.git
cd MindVault-Sui
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
3. Set environment variables
4. Deploy

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

- [GitHub Repository](https://github.com/Azurboy/MindVault-Sui)
- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.walrus.site/)
