# Solana Autonomous Capital Agent

> Production-grade autonomous capital agent on Solana featuring programmable risk guardrails, MultiHopper multi-hop payment routing, OOBE Protocol SAP MCP execution runtime, and Ace Data Cloud market intelligence.

Built for the **Steve Capital Agent Challenge** on **Superteam Earn** (Powered by **OOBE Protocol** | Featuring **MultiHopper** & **Ace Data Cloud**).

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Market Intelligence [Ace Data Cloud MCP]
        ACE_SEARCH[Real-time Market Search]
        ACE_BRIEF[AI Research Briefings]
    end

    subgraph Agent Core [Steve Capital Agent Engine]
        SPENDING[Spending Policy & Guardrails]
        IDEMPOTENCY[Idempotency Guard SHA-256]
        STRATEGY[Autonomous Yield Rebalancer]
    end

    subgraph Routing Mesh [MultiHopper Programmable Router]
        NON_CIRCULAR[Anti-Circular Path Validator]
        HOP_DECOMP[Hop Decomposition Engine]
        SLIPPAGE_OPT[Slippage & Fee Minimizer]
    end

    subgraph Execution Runtime [OOBE Protocol SAP MCP]
        JUPITER[Jupiter Liquidity]
        KAMINO[Kamino Lending & Yield]
        METEORA[Meteora Dynamic Vaults]
        ORCA[Orca Whirlpools]
        MAGICBLOCK[MagicBlock Private Txs]
    end

    Market Intelligence --> STRATEGY
    STRATEGY --> SPENDING
    SPENDING --> IDEMPOTENCY
    IDEMPOTENCY --> Routing Mesh
    Routing Mesh --> Execution Runtime
```

---

## Core Capabilities

### 1. Programmable Guardrails & Risk Controls (`SpendingPolicy`)
- **Per-Transaction Spending Cap:** Restricts single-mandate capital exposure (e.g., maximum 25 USDC per trade/hop).
- **Rolling 24-Hour Velocity Check:** Prevents over-deployment by capping daily capital turnover.
- **Protocol Whitelisting:** Strictly limits transactions to audited, approved protocols (Kamino, Meteora, Orca, MultiHopper, Jupiter).
- **Emergency Circuit Breaker:** Instantly halts autonomous operations upon adverse slippage or volatility spikes.

### 2. Idempotency & Cluster Safety (`IdempotencyGuard`)
- **Deterministic Payload Hashing:** Computes SHA-256 signatures over parameter manifests to prevent double-spends during Solana RPC latency or cluster congestion.
- **Transaction State Machine:** Tracks execution status (`pending`, `confirmed`, `failed`) with automatic timeout pruning.

### 3. MultiHopper Programmable Routing (`MultiHopperRouter`)
- **Hop Decomposition:** Splits routing paths across non-circular intermediary liquidity pools to minimize price impact.
- **Anti-Circular Enforcement:** Mathematically proves `Path(hop_0 ... hop_n)` contains no duplicate tokens or self-transfers, ensuring full compliance with Superteam Earn verification rules.
- **Verified Route Execution:** Generates verifiable on-chain settlement receipts with latency and fee accounting.

### 4. OOBE Protocol SAP MCP Integration (`OobeSapClient`)
- Direct programmatic client for OOBE's Solana Agent Protocol MCP catalogue (400+ on-chain tools).
- Native support for Kamino deposits, Meteora dynamic vaults, Orca swaps, and Adrena perpetuals.

### 5. Ace Data Cloud Integration (`AceDataCloudClient`)
- Native MCP connector for Ace Data Cloud AI tools (`platform.acedata.cloud`).
- Supports automated market intelligence searches and research briefing generation.
- Real-time logging of qualifying paid service requests.

---

## Installation & Setup

### Prerequisites
- Node.js v20+ or v22+ (tested on Node v26)
- npm or pnpm

### Clone & Build
```bash
git clone https://github.com/kleitonbernardino-lab/solana-autonomous-capital-agent.git
cd solana-autonomous-capital-agent

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run unit & conformance test suite
npm test
```

---

## Running the Agent

### Simulation / Dry-Run Mode
Simulates full routing, MCP calls, and yield rebalances with mock Solana transaction signatures:
```bash
npm run simulate
```

### Production Deployment
Configure your agent wallet and RPC endpoint in your environment:
```bash
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export AGENT_WALLET_ADDRESS="<YOUR_STEVE_CAPITAL_AGENT_WALLET>"
export ACE_DATA_API_KEY="<YOUR_ACE_DATA_API_KEY>"

npm start
```

---

## Superteam Earn Challenge Alignment

| Track | Requirement | Implementation in Repository |
| :--- | :--- | :--- |
| **Main Bounty ($250 USDC)** | Autonomous agent on Steve Capital with programmable guardrails & Steve Arena activity | `SteveCapitalAgent.ts`, `SpendingPolicy.ts`, `AutonomousYieldRebalancer.ts` |
| **MultiHopper Track ($125 USDC)** | Programmable routing, non-circular verified routes, volume/transfer execution | `MultiHopperRouter.ts` (anti-circular invariant, multi-hop execution) |
| **Ace Data Cloud Track ($125)** | Ace MCP connection + 5 qualifying paid requests + automated briefing workflow | `AceDataCloudClient.ts` (search & briefing workflows) |

---

## License

MIT License. Authored by **Kleiton Bernardino** (`kleiton.bernardino@gmail.com`).
