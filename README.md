# GenLegal AI

AI-powered legal contract analysis, settled on-chain through GenLayer's
Optimistic Democracy consensus. Paste or upload a contract; an Intelligent
Contract asks an LLM to summarize it, extract obligations and risks, and
assign a risk score - and GenLayer's AI validators independently verify that
score before it's written to the chain.

```
genlegal-ai/
  contracts/legal_contract_analyzer.py   # the Intelligent Contract
  tests/direct/                          # fast in-memory tests (mocked LLM)
  tests/integration/                     # full-consensus tests (gltest)
  deploy/deployScript.ts                 # genlayer deploy entry point
  frontend/                              # Next.js + genlayer-js dApp
  gltest.config.yaml, pyproject.toml, requirements.txt
```

## Why GenLayer for this

A deterministic smart contract can't read a contract's prose and decide
whether a liability clause is "broad" or a renewal term is risky - that's a
judgment call. GenLayer's Equivalence Principle lets a leader validator ask
an LLM for that judgment and lets the rest of the network independently
reproduce and check the *decision* (risk level, risk score) without
requiring byte-identical free text, which is exactly the `typical-use-cases`
"Rule & Constitution Verification" / subjective-decision pattern GenLayer is
built for.

## Contract design

**Storage** (`contracts/legal_contract_analyzer.py`) is intentionally flat:

```python
class LegalContractAnalyzer(gl.Contract):
    analyses: DynArray[Analysis]          # @allow_storage dataclass, scalar fields only
    analysis_index: TreeMap[str, u32]     # id -> index in analyses
    user_analysis_ids: TreeMap[Address, str]  # owner -> JSON array of ids
    next_id: u256
```

`Analysis.obligations`/`risks` are stored as compact JSON strings rather than
nested `DynArray[str]` fields. Per the storage docs, a `DynArray`/`TreeMap`
field nested inside a stored dataclass needs `gl.storage.inmem_allocate` to
construct in memory; flattening to JSON strings keeps the contract simple
and avoids that entirely, at the cost of `json.loads`/`json.dumps` on read
and write. Counters/ids use sized types (`u32`, `u256`) per the "no raw
`int` in storage" rule.

**Equivalence Principle** (`analyze_contract`): uses a hand-written
leader/validator pair via `gl.vm.run_nondet_unsafe`, not `strict_eq` (the LLM
output is inherently non-deterministic) and not the `prompt_comparative`
convenience wrapper (this needs deterministic, programmatic control, which
the docs recommend over LLM-judging-LLM for classification/scoring tasks).
The validator:

1. Rejects if the leader errored, using error-prefix classification
   (`[EXPECTED]`/`[EXTERNAL]` must match exactly, `[TRANSIENT]` agrees if
   both sides see one, `[LLM_ERROR]`/unclassified always disagrees and forces
   a new leader).
2. Otherwise re-runs the same prompt independently and compares only the
   *decision* fields: `risk_level` must match exactly, `risk_score` must be
   within `RISK_SCORE_TOLERANCE` (12 points). Free text (`summary`,
   `obligations`, `risks` wording) is stored from the leader's answer but
   never compared - two LLMs will phrase the same judgement differently,
   same as the "analysis" field in the docs' football-match example.

**Defensive LLM parsing**: `_normalize_analysis_response` tolerates common
key aliases (`risk_score`/`score`/`risk`, `risks`/`risks_identified`, ...),
clamps the score to 0-100, derives `risk_level` from the score if the label
is missing/garbled, and raises `[LLM_ERROR]`-tagged `gl.vm.UserError` on
anything unsalvageable - this is what the validator's error-classification
branch reacts to.

## Frontend

`frontend/` is a Next.js 14 + TypeScript + Tailwind app, structured the same
way as the official `genlayer-project-boilerplate` (`lib/genlayer/client.ts`
+ `WalletProvider.tsx` for MetaMask, `lib/contracts/*.ts` as a typed
`genlayer-js` wrapper class, `lib/hooks/*` for the React-facing API) so it
drops into the same mental model as other GenLayer dApps. It replicates the
provided design (dark theme, purple/violet accent, sidebar dashboard, risk
donut, score rings, tabbed analysis detail, upload-or-paste form).

**Verified in this environment:** `npx tsc --noEmit` is clean and
`npm run build` produces both routes successfully (see "What's blocked"
below for what couldn't be verified against a live network).

## Setup

### Contract toolchain

```bash
pip install genvm-linter genlayer-test --break-system-packages
# or: pip install -r requirements.txt   (pins the same git sources the
# official boilerplate uses)

genvm-lint check contracts/legal_contract_analyzer.py --json
pytest tests/direct/ -v
```

### Local network + deploy

```bash
npm install -g genlayer
genlayer init      # sets up Docker + GenVM, pick an LLM provider
genlayer up        # starts the local validator network
genlayer network set localnet   # or: studionet
genlayer deploy    # runs deploy/deployScript.ts, prints the contract address
gltest tests/integration/ -v -s
```

Copy the printed address into `frontend/.env`:

```bash
cd frontend
cp .env.example .env
# edit .env: NEXT_PUBLIC_CONTRACT_ADDRESS=<address from genlayer deploy>
npm install
npm run dev
```

Open `http://localhost:3000`. "Connect Wallet" adds/switches MetaMask to
whichever network `NEXT_PUBLIC_GENLAYER_NETWORK` selects (`studionet` by
default - hosted, gasless, no Docker needed; set it to `localnet` and
`NEXT_PUBLIC_GENLAYER_RPC_URL=http://127.0.0.1:4000/api` to point at your own
`genlayer up` node instead).

### Putting this on GitHub (with GitHub Desktop) and deploying to Vercel

This folder is **not** a git repo yet on purpose - a `.git` folder baked
into a zip has to survive download + extraction perfectly intact, and any
hiccup there (e.g. a "replace files?" prompt where one file gets skipped)
leaves git's internal database corrupted, which is exactly why GitHub
Desktop didn't recognize the previous version as a repository. Letting
GitHub Desktop create the repo itself avoids that entirely:

1. Open **GitHub Desktop** -> `File > Add Local Repository`.
2. Browse to the extracted `genlegal-ai` folder and select it.
3. It will say *"This directory does not appear to be a Git repository"*
   with a **"create a repository"** link right there - click it, keep the
   defaults, click **Create Repository**.
4. You'll now see every file as a change ready to commit. Write a commit
   message (e.g. "Initial commit") and click **Commit to main**.
5. Click **Publish repository** (top bar) to push it to your GitHub account.

`.gitignore` is already in the folder, so `node_modules/` and `.next/`
won't get committed. `frontend/.env` (network + the already-deployed
contract address `0xe5aF...7052`) **will** get committed - these are
public, non-secret values (a network name and an on-chain address), so
Vercel's build picks them up automatically with nothing to type into its
Environment Variables UI.

Then on Vercel:

1. Import that GitHub repo as a new project.
2. **Set "Root Directory" to `frontend`.**
3. Click Deploy.

That field is the one step that can't be preconfigured from inside the
repo: Vercel's Next.js builder needs to run *from* the app's own directory
to detect the App Router correctly, and the documented, reliable way to
point it there for a monorepo is that Root Directory setting in the
project's dashboard - not a root-level `vercel.json` override, which
several teams in Vercel's own community threads report breaking dynamic
routes when used to redirect a Next.js build into a subfolder. So: one
field, ~5 seconds, then it's fully automatic from there.

To point at a different contract or network later (e.g. your own
`genlayer deploy` once you have a funded testnet account), either edit
`frontend/.env` and redeploy, or add the same two keys in Vercel's
Environment Variables UI - values set there override the committed
`.env` defaults without needing a code change.

## What's blocked in this sandbox (and what's verified)

This project was built in a sandboxed environment without Docker and with a
restricted network egress allowlist. Here's exactly what that did and
didn't affect, so nothing here is taken on faith:

| Check | Result |
|---|---|
| `genvm-lint lint` (fast AST safety checks) | **Passed, 3/3**, run for real against the actual contract file |
| `npx tsc --noEmit` (whole frontend) | **Passed, 0 errors** |
| `npm run build` (Next.js production build) | **Passed**, both routes compiled and prerendered |
| `genvm-lint validate`/`typecheck`/`schema` and `pytest tests/direct/` | **Blocked** - see below |
| `gltest tests/integration/` | **Blocked** - needs a running `genlayer up` / Docker node, not available here |
| Live deploy / on-chain transactions | **Blocked** - no funded account, no running node |

The deep checks and `pytest` need to download the real GenVM SDK runtime
(the thing that makes `from genlayer import *` resolve to actual
`gl.Contract`/`gl.vm`/`gl.nondet` implementations). That download redirects
through `release-assets.githubusercontent.com`, which returned, verbatim,
from this sandbox's egress proxy:

```
Host not in allowlist: release-assets.githubusercontent.com. Add this host
to your network egress settings to allow access.
```

That's an infrastructure limitation of *this* environment, not a finding
about the contract. `tests/direct/test_legal_contract_analyzer.py` does
collect and run correctly up to that exact point (12 tests, using the
official `direct_vm`/`direct_deploy`/`direct_alice`/`direct_bob` pytest
fixtures that `genlayer-test` auto-registers) - it just can't finish
importing the real SDK here. Run `pytest tests/direct/ -v` locally (or
anywhere with normal internet access) to execute them for real; add
`release-assets.githubusercontent.com` to your network egress settings if
you hit the same message elsewhere.

Every GenLayer-specific API used in the contract and the test files
(`gl.vm.run_nondet_unsafe`, `gl.eq_principle.*`, `gl.nondet.exec_prompt`,
`gl.storage.copy_to_memory`, `TreeMap`/`DynArray`/`@allow_storage`,
`direct_vm.mock_llm`/`run_validator`, `get_contract_factory`/`.transact`/
`.call`, `createClient`/`readContract`/`writeContract` from `genlayer-js`)
was checked against the official docs (docs.genlayer.com), the GenVM SDK
source actually installed in this sandbox (`gltest.direct.vm`/`loader`), and
the real `genlayer-project-boilerplate` repository - not guessed.

## Next steps for you

1. Run the two blocked commands locally to get a clean pass/fail signal:
   `pytest tests/direct/ -v` and `genvm-lint check contracts/legal_contract_analyzer.py --json`.
2. `genlayer init && genlayer up` to get a local network, then `genlayer deploy`.
3. Wire the printed contract address into `frontend/.env` and `npm run dev`.
4. If you want real LLM-backed analyses rather than StudioNet's defaults,
   configure a provider during `genlayer init` (Llama3 needs no key; OpenAI/
   Heurist need one).
