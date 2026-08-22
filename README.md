# GenLegal AI — Smart Contract Auditor

`SmartContractAuditor` is a GenLayer Intelligent Contract that audits smart
contract source code (Solidity, Vyper, etc.) for security vulnerabilities,
settled on-chain through GenLayer's Optimistic Democracy consensus. Paste or
upload a contract's source; the Intelligent Contract asks an LLM to
summarize it, flag security risks, recommend fixes, and assign a risk score
- and GenLayer's AI validators independently verify that score before it's
written to the chain.

```
genlegal-ai/
  contracts/smart_contract_auditor.py         # the Intelligent Contract
  tests/direct/                               # fast in-memory tests (mocked LLM, run for real)
  tests/direct/conftest.py                    # pins the GenVM SDK version
  tests/integration/                          # full-consensus tests (gltest)
  deploy/deployScript.ts                      # genlayer deploy entry point
  frontend/                                   # Next.js + genlayer-js dApp
  gltest.config.yaml, pyproject.toml, requirements.txt
```

**Deployed contract (StudioNet):** `0xc43D669Ae027CbF37Ee21Ab31038D152313E7605`
[Explorer](https://explorer-studio.genlayer.com/address/0xc43D669Ae027CbF37Ee21Ab31038D152313E7605)
· [Import into Studio](https://studio.genlayer.com/?import-contract=0xc43D669Ae027CbF37Ee21Ab31038D152313E7605)

## Domain correction (read this first)

A previous version of this contract (`LegalContractAnalyzer`, class and file
both since renamed) was written as a legal document reviewer - its prompt
said *"You are an expert contract-review assistant helping a non-lawyer
understand a {contract_type} agreement"* and asked the LLM to extract
"obligations" between parties. That didn't match this project's actual
purpose: auditing smart contract code, not legal prose.

That mismatch caused a real production failure. A transaction submitting a
minimal Solidity contract (a public string variable with an unrestricted
setter) went through 3 leader rotations and finalized as
`MAJORITY_DISAGREE` / `UNDETERMINED`. Different LLM providers, all given a
legal-agreement prompt but actual code as input, guessed differently at what
they were supposed to be doing - one provider happened to produce a
reasonable code-security-style analysis anyway, but several others visibly
disagreed with it. This is the same class of failure as feeding any
under-specified or wrong-domain prompt to a leader/validator pair: it
produces cross-provider disagreement, not a consensus-mechanism bug.

**Fix:** the prompt, parameter names, and field names are rewritten
specifically for smart contract security auditing:

| Before (legal) | After (code audit) |
|---|---|
| `contract_type` param | `language` param (e.g. `"Solidity"`, `"Vyper"`; defaults to `"Solidity"`) |
| `text` param | `code` param |
| `obligations` field | `recommendations` field (recommended fixes/best practices) |
| *"helping a non-lawyer understand a {type} agreement"* | *"expert smart contract security auditor reviewing {language} source code"* |
| risk criteria: liability, renewal, termination clauses | risk criteria: access control, reentrancy, unchecked calls, overflow, front-running, DoS, delegatecall/selfdestruct misuse, missing events, centralization |

`risks` (security findings) and `risk_score`/`risk_level` (unchanged
derivation logic, see below) already fit a code-audit context and were kept
as-is - only their *meaning* changed with the prompt, not their name.

This required a fresh deployment - the class was renamed
`LegalContractAnalyzer` → `SmartContractAuditor` and the file
`legal_contract_analyzer.py` → `smart_contract_auditor.py`. The frontend
(`frontend/lib/contracts/`, `frontend/lib/hooks/`) and `deploy/deployScript.ts`
were updated to match: same renames, plus every dashboard component that
reads `Analysis` fields (`analyze/page.tsx`, `AnalysisDetail.tsx`,
`DocumentDetailPanel.tsx`, `documents/page.tsx`, `analytics/page.tsx`) now
reads `language`/`recommendations`/`risks` instead of
`contract_type`/`obligations`/`risks` from the legal-domain schema. The
landing page copy was already smart-contract-security-themed from a prior
pass and needed no further change here.

## risk_level is already fully derived (no bidirectional gap)

`risk_level` in this contract has been fully derived from `risk_score` from
the start (`_derive_risk_level`, see below) - it is never requested from the
LLM, so there is no separate LLM-reported label for it to disagree with, and
no bidirectional-invariant gap to close.

## Other fixes carried over unaffected by the domain correction

- `risk_level` is always derived from `risk_score` (`_derive_risk_level`),
  never taken directly from the LLM. An LLM self-reporting a label that
  contradicts its own score (e.g. `risk_level: "High"` with
  `risk_score: 20`) would otherwise be trusted and stored as-is; the prompt
  no longer even asks for the label.
- `Address(owner_address)` in `get_my_analyses` is wrapped in a try/except
  raising a properly `[EXPECTED]`-tagged `gl.vm.UserError` instead of an
  untagged generic exception on a malformed address.

## Why GenLayer for this

A deterministic smart contract can't read another contract's code and decide
whether a reentrancy pattern is exploitable or a missing access-control check
is severe - that's a judgment call. GenLayer's Equivalence Principle lets a
leader validator ask an LLM for that judgment and lets the rest of the
network independently reproduce and check the *decision* (risk level, risk
score) without requiring byte-identical free text, which is exactly the
`typical-use-cases` "Rule & Constitution Verification" / subjective-decision
pattern GenLayer is built for.

## Contract design

**Storage** (`contracts/smart_contract_auditor.py`) is intentionally flat:

```python
class SmartContractAuditor(gl.Contract):
    analyses: DynArray[Analysis]              # @allow_storage dataclass, scalar fields only
    analysis_index: TreeMap[str, u32]         # id -> index in analyses
    user_analysis_ids: TreeMap[Address, str]  # owner -> JSON array of ids
    next_id: u256
```

`Analysis.recommendations`/`risks` are stored as compact JSON strings rather
than nested `DynArray[str]` fields. Per the storage docs, a
`DynArray`/`TreeMap` field nested inside a stored dataclass needs
`gl.storage.inmem_allocate` to construct in memory; flattening to JSON
strings keeps the contract simple and avoids that entirely, at the cost of
`json.loads`/`json.dumps` on read and write. Counters/ids use sized types
(`u32`, `u256`) per the "no raw `int` in storage" rule.

## Consensus design

The Equivalence Principle validator (`analyze_contract`, via
`gl.vm.run_nondet_unsafe` - not `strict_eq`, since LLM output is inherently
non-deterministic, and not the `prompt_comparative` convenience wrapper,
since this needs deterministic, programmatic control) compares `risk_level`
for an exact match **and** `risk_score` within `RISK_SCORE_TOLERANCE` (12
points) - both checks, not either/or:

1. Rejects if the leader errored, using error-prefix classification
   (`[EXPECTED]`/`[EXTERNAL]` must match exactly, `[TRANSIENT]` agrees if
   both sides see one, `[LLM_ERROR]`/unclassified always disagrees and forces
   a new leader).
2. Otherwise re-runs the same prompt independently. Since `risk_level` is a
   pure function of `risk_score`, the exact-match check is really an
   exact-match check on a discrete risk bucket (Low/Medium/High), with the
   numeric tolerance as a tighter secondary constraint on top of it - see
   `test_validator_agrees_when_same_bucket_and_within_tolerance`,
   `test_validator_disagrees_across_risk_level_boundary_despite_small_score_gap`,
   and `test_validator_disagrees_when_gap_exceeds_tolerance_even_within_same_bucket`
   in `tests/direct/test_smart_contract_auditor.py` for the three boundary
   cases this is tested against.

Free-text fields (`summary`, `recommendations`, `risks`) are stored from the
leader's answer and are not required to match byte-for-byte between leader
and validator - a deliberate, documented trade-off (two LLMs phrase the same
finding differently), not a gap.

**Defensive LLM parsing**: `_normalize_analysis_response` tolerates common
key aliases (`risk_score`/`score`/`risk`, `risks`/`vulnerabilities`/
`findings`, ...), clamps the score to 0-100, and raises
`[LLM_ERROR]`-tagged `gl.vm.UserError` on anything unsalvageable - this is
what the validator's error-classification branch reacts to.

## Frontend

`frontend/` is a Next.js 14 + TypeScript + Tailwind app, structured the same
way as the official `genlayer-project-boilerplate` (`lib/genlayer/client.ts`
+ `WalletProvider.tsx` for MetaMask, `lib/contracts/SmartContractAuditor.ts`
as a typed `genlayer-js` wrapper class, `lib/hooks/useSmartContractAuditor.ts`
for the React-facing API). It replicates the provided design (dark theme,
purple/violet accent, sidebar dashboard, risk donut, score rings, tabbed
analysis detail, upload-or-paste form) and is wired to the deployed contract
address above via `frontend/.env`.

### Identifying the exact analysis a transaction created

`analyze_contract` returns the new id as its Python return value, but
GenLayer write calls only surface a transaction hash to the client directly
- the return value has to be read back out of the receipt. An earlier
version of this fix snapshotted the caller's own `get_my_analyses()` list
before submitting and diffed against it afterwards to find "the new id" -
this was rejected on review: with two overlapping submissions from the same
wallet (two tabs, a retried click), the diff can surface more than one new
id, and picking one from that set still isn't actually tied to *this*
receipt.

The fix now decodes the id straight from the transaction's own return value
instead of inferring it from list state at all
(`SmartContractAuditor.extractReturnedId`). On Studio-family networks
(`isStudio: true` - covers `studionet`, which this app targets by default),
`genlayer-js` decodes a successful write's return value into
`receipt.consensus_data.leader_receipt[0].result.payload.readable` as a
JSON-encoded string (a Python `str` return goes through
`JSON.stringify`-equivalent encoding on the SDK side), so
`JSON.parse(readable)` recovers the id directly - verified by reading
`genlayer-js@1.1.8`'s own `resultToUserFriendlyJson`/`calldataToUserFriendlyJson`/
`toStringImpl` source. If that shape isn't present (`result.status !==
"return"`, or the field is missing/malformed), `extractReturnedId` returns
`null` rather than falling back to a guess, and `analyze/page.tsx` surfaces
an honest error pointing the user at Documents instead of silently
attaching the audit to the wrong record.

**Verified in this environment:**

| Check | Result |
|---|---|
| `genvm-lint check contracts/smart_contract_auditor.py` | **Passed, 3/3**, run for real |
| `genvm-lint typecheck contracts/smart_contract_auditor.py` (Pyright + GenLayer SDK) | **Passed, 0 errors** |
| `genvm-lint schema contracts/smart_contract_auditor.py` | 5 methods (4 view, 1 write), matches the contract |
| `pytest tests/direct/ -v` (real GenVM runtime, not mocked at the SDK level) | **17/17 passed**, including a regression test replaying the `HolaMundo`-shaped input from the failed transaction |
| `npx tsc --noEmit` (whole frontend) | **Passed, 0 errors** |
| `npm run build` (Next.js production build) | **Passed**, all 13 routes compiled and prerendered |

`tests/direct/conftest.py` pins the GenVM SDK to `v0.2.16`: `genlayer-test`'s
"latest" auto-resolution currently follows
`github.com/genlayerlabs/genvm/releases/latest`, which points at
`v0.3.0-rc7` - a pre-release that doesn't ship a `genvm-universal.tar.xz`
asset under the name the downloader expects, so every direct-mode test fails
before it even runs with an unrelated-looking 404. `v0.2.16` is the latest
version confirmed (`curl -I`, HTTP 302 to a real asset URL) to have a
working asset, and this contract's `Depends` header
(`py-genlayer:1jb45aa8...`) already targets the pre-v0.3.0 API anyway, so
it's the correct pin, not just a workaround.

**Not independently verified:** this sandbox's network egress does not allow
reaching `studio.genlayer.com`, so the deployed contract's on-chain code
could not be queried directly (`gen_getContractCode`) to confirm it matches
`contracts/smart_contract_auditor.py` byte-for-byte. The uploaded contract
file's `genvm-lint schema` output (`analyze_contract(title, language, code)`,
fields `recommendations`/`risks`/`risk_level`/`risk_score`/`summary`)
matches the decoded parameters and Return Value of the provided example
transaction exactly, which is strong corroborating evidence, but is not the
same as an independent on-chain read.

**`extractReturnedId` - confirmed against a real transaction.** The decode
path was designed by reading `genlayer-js@1.1.8`'s own source (see
"Identifying the exact analysis a transaction created" above), but this
sandbox couldn't exercise it end-to-end for the same network-access reason.
It has since been confirmed working against a real submission from this
app: tx `0xc5e53bcc94ae90a51fe511f591f95ae28ea8bd8ee67c99ed47928d2dabc9dc4c`
(`analyze_contract("SimpleStorage", "Solidity", <code>)`) correctly resolved
to analysis id `"1"` - the app could only have reached the result screen and
offered the "Download JSON" button (which is where the exported
`SimpleStorage` record with `id: "1"` came from) if `extractReturnedId` had
decoded a non-null id from that specific receipt; a failed decode raises an
error and stops before that point (see "Identifying the exact analysis a
transaction created" above), so this isn't a case that could have passed by
falling through to some other code path.

## Setup

### Contract toolchain

```bash
pip install genvm-linter genlayer-test
# or: pip install -r requirements.txt   (pins the same git sources the
# official boilerplate uses)

genvm-lint check contracts/smart_contract_auditor.py --json
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
leaves git's internal database corrupted. Letting GitHub Desktop create the
repo itself avoids that entirely:

1. Open **GitHub Desktop** -> `File > Add Local Repository`.
2. Browse to the extracted `genlegal-ai` folder and select it.
3. It will say *"This directory does not appear to be a Git repository"*
   with a **"create a repository"** link right there - click it, keep the
   defaults, click **Create Repository**.
4. You'll now see every file as a change ready to commit. Write a commit
   message (e.g. "Initial commit") and click **Commit to main**.
5. Click **Publish repository** (top bar) to push it to your GitHub account.

`.gitignore` is already in the folder, so `node_modules/`, `.next/`,
`__pycache__/`, `.pytest_cache/`, and `artifacts/` won't get committed.
`frontend/.env` **will** get committed - it's public, non-secret values (a
network name and the on-chain address above), so Vercel's build picks it up
automatically with nothing to type into its Environment Variables UI.

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
routes when used to redirect a Next.js build into a subfolder.

To point at a different contract or network later, either edit
`frontend/.env` and redeploy, or add the same two keys in Vercel's
Environment Variables UI - values set there override the committed `.env`
defaults without needing a code change.

## What's blocked in this sandbox

| Check | Result |
|---|---|
| `gltest tests/integration/` | **Blocked** - needs a running `genlayer up` / Docker node, not available here |
| Independent on-chain read of the deployed contract's code | **Blocked** - `studio.genlayer.com` is not in this sandbox's network egress allowlist |
| Live deploy / new on-chain transactions | **Blocked** - no funded account, no running node |

## Next steps for you

1. `gltest tests/integration/ -v -s` locally once you have `genlayer up`
   running, for a full-consensus signal beyond the direct-mode suite.
2. If you want real LLM-backed analyses rather than StudioNet's defaults,
   configure a provider during `genlayer init` (Llama3 needs no key; OpenAI/
   Heurist need one).
3. If you redeploy again later, remember the checklist this round followed:
   rename file + class together, update `deploy/deployScript.ts`,
   `frontend/lib/contracts/*.ts` + `frontend/lib/hooks/*.ts`, every
   dashboard component reading `Analysis` fields, `frontend/.env` +
   `frontend/lib/constants.ts`, and `package.json`'s `lint` script.
