# MEV Protection & Private Bundle Architecture

## Threat Model
Public mempool transactions are vulnerable to:
1. **Front-running:** Searchers place higher priority buy orders before target swap.
2. **Back-running:** Searchers dump accumulated tokens immediately after target price impact.

## Jito Bundle Defense
All capital agent swaps are bundled atomically:
- Submissions sent via Jito Block Engine endpoint.
- Tip paid directly to leader validator within transaction instructions.
- Guaranteed all-or-nothing bundle inclusion eliminating front-run execution.
