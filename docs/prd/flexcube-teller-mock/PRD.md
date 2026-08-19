# PRD: Interactive FLEXCUBE Teller Journey Mock

Status: Draft awaiting sign-off.  
Scope: A fully interactive, faithful clone of the Oracle FLEXCUBE Universal Banking teller cash-deposit / withdrawal journey, built as a Next.js app for user-testing / UX research.

---

## 1. Problem Statement

We need a browser-based, self-contained simulator of the Oracle FLEXCUBE Universal Banking teller journey for cash deposits and withdrawals. The source of truth is an existing single-file prototype:

`/Users/ricky.k/Library/Application Support/Claude/local-agent-mode-sessions/18e40c01-3e11-4653-b6c7-8d81f85e4a42/1871293f-9485-4748-89c5-35825ef02f0b/local_ed70db19-ef3e-466b-baa7-c40d196da621/outputs/flexcube-teller-journey.html`

The new mock must let participants interact with the interface as if they were a real teller: typing fields, triggering validations, seeing override dialogs, and progressing through the end-to-end workflow. It is intended for UX research, so the experience should be app-only (no explanatory notes, no embedded task copy) while still behaving realistically enough to surface usability issues.

---

## 2. Proposed Solution

Build a **Next.js** application at the root of `/Users/ricky.k/workspaces/cognition/uat-core-banking/`. The app contains one main page that renders the FLEXCUBE simulator.

### 2.1 High-level structure

- **Single-page app** (`app/page.tsx` using Next.js App Router). The entire experience lives in one route.
- **Client-side state** drives the simulator. All forms, dialogs, and screen transitions happen without a backend.
- **Faithful visual clone** of the source file: Oracle FLEXCUBE 12.x/14.x branch chrome, blue title bar, left tree menu, fast-path box, form grids, audit bar, status messages, and modal dialogs.
- **Configurable defaults**: branch, teller, till, customers, limits, and currency are stored in a top-level `config.ts` file.
- **Static export support**: `next.config.js` uses `output: 'export'` so `next build` produces plain HTML/JS/CSS that can be opened from `out/` or deployed to any static host.

### 2.2 State model

A single `SessionState` object holds:

- `currentStep` — index of the active step in the journey.
- `user` / `till` / `branch` — current session context.
- `tillOpen` / `tillBalance` / `retentionLimit` — till state.
- `vaultBalance` — vault position.
- `transactions` — array of completed/unauthorized transactions with fields: reference, fnId, amount, ccy, customer, status, maker, checker, denominations.
- `currentTransaction` — the in-progress transaction being edited on a screen.
- `dialogs` — stack of active modal dialogs.
- `flags` — one-off state such as `sigOk`, `chargeTab`, `selectedDenominationRow`, `errors`, `messages`.

State updates are handled by a reducer. Side effects (validation, auto-authorization, reference-number generation, balance updates) are pure functions that receive `state` + `action` and return a new `state`.

### 2.3 Component architecture

| Component | Responsibility |
|-----------|----------------|
| `AppShell` | Outer prototype chrome: proto bar (title, phase pill, counter, Prev/Next buttons) and two-column layout (rail + stage). |
| `StepRail` | Left rail grouped by phase. Highlights active step; clicking jumps to that step. |
| `FCWindow` | The Oracle FLEXCUBE shell: title bar, menu bar, tree, work area. Renders children inside the work area. |
| `FCTree` | Left navigation tree with fast-path input and function list. Highlights the current function. |
| `FCForm` | Generic form row renderer (label + value/input with optional `readonly`, `number`, `lov`, `required`, `focus`). |
| `FCField` | Individual field with input, LOV chevron, and focus state. |
| `DenominationGrid` | Editable table with denomination code, value, units, and computed total. Computes total amount and validates against header amount. |
| `ActionBar` | Row of buttons (New, Enter query, Save, Hold, Clear, Print advice, Reverse, etc.). |
| `AuditBar` | Maker/checker/mod-no/authorization status strip. |
| `StatusMessage` | Success/warning/error message bar. |
| `Dialog` | Modal with icon, code, message, and action buttons. |
| `Tabs` | Tab strip for Denomination / Charge / MIS / UDF etc. |

Each major screen (`SignOn`, `TellerDashboard`, `CashDeposit`, `CashWithdrawal`, `BuyCashFromVault`, `TransferCashToVault`, `PendingAuth`, `TransactionReversal`, `TillPosition`, `BranchBatch`) is a component that maps the current `SessionState` to JSX.

### 2.4 Key interactions

- **Step navigation**:
  - `←` / `→` keys or **Prev** / **Next** buttons move linearly.
  - Clicking a rail step jumps directly to that step.
  - Jumping resets the session to that step’s default snapshot so the screen is always internally consistent.
- **Form input**:
  - Tellers can type account numbers, amounts, and denomination units.
  - `Tab` or `Enter` on the account field fetches customer data (using a hard-coded lookup table keyed by config).
  - The amount field updates derived fields: account amount = transaction amount × exchange rate.
- **Validation**:
  - Real-time checks on amount > 0, available balance, denomination total matching header, till stock for withdrawals.
  - Business rules: retention limit, per-transaction teller limit, till-open requirement, dormant/no-debit/no-credit flags.
- **Save / override / authorization**:
  - `Save` validates everything; if a rule is breached the transaction is parked as **Unauthorized** and an override dialog is shown.
  - Auto-authorization happens when the amount is within limits and the product config allows it.
  - Supervisor steps sign in as `SUPV_02` and use the **Authorize** / **Reject** actions.
- **Denomination math**:
  - `Total amount = Σ(value × units)`.
  - For withdrawals, the till’s per-denomination stock is checked before allowing save.
  - For the close-of-day screen, the counted units can be edited; differences are highlighted and must be zero before the till closes.

### 2.5 Reference / transaction numbering

Reference numbers follow the source pattern: `000` branch + `CHDP`/`CHWL`/`CHVT`/`CHTV` product code + `26230` Julian date + 4-digit serial. The mock can generate sequential serials; exact uniqueness is not critical for UX research.

---

## 3. User Journeys

All journeys are presented in the order they appear in the simulator. Each step has an **actor**, **function id**, **screen name**, and the primary interaction.

### Phase 1 — Start of day

1. **Teller signs on**  
   Actor: Teller (`OPS_USER1`) · Fn id: `Sign on` · Screen: FLEXCUBE branch sign-on  
   - Inputs user id, password, branch.  
   - System validates user enabled, not locked, and linked to branch; branch is in `TI` stage.  
   - Successful sign-on lands on the dashboard.

2. **Dashboard — till still closed**  
   Actor: Teller · Fn id: `Teller dashboard` · Screen: Teller dashboard  
   - Shows branch stage, till status `Closed`, balance `0.00`, retention limit, pending items.  
   - No cash transactions can be posted yet.

3. **Attempt a deposit before opening the till**  
   Actor: Teller · Fn id: `1401` · Screen: Cash deposit — blocked  
   - Teller launches `1401`.  
   - System shows error `ST-TILL-002`: till is not open for this user/branch date.  
   - Journey demonstrates the cash-logistics prerequisite.

4. **Buy opening cash from the vault**  
   Actor: Teller · Fn id: `9007` · Screen: Buy cash from vault  
   - Teller requests SGD 150,000.00 from `VAULT000`.  
   - Denomination grid is mandatory and must total the header amount.  
   - Validates vault stock and retention limit.

5. **Retention-limit override**  
   Actor: Teller → Supervisor · Fn id: `9007` · Screen: Buy cash from vault — override  
   - Amount exceeds SGD 50,000 retention limit.  
   - Override dialog `ST-CASH-118` warns that supervisor authorization is required.  
   - On acceptance, record is saved as `Unauthorized`.

6. **Vault teller authorizes — till is open**  
   Actor: Vault teller / Supervisor (`SUPV_02`) · Fn id: `9007` · Screen: Buy cash from vault — authorized  
   - Second user authorizes; maker-checker enforced.  
   - Till status flips to `Open` with SGD 150,000.00 cash position.  
   - Accounting: Dr Till GL TILL001 150,000.00; Cr Vault GL VAULT000 150,000.00.

### Phase 2 — Cash deposit (1401)

7. **Launch cash deposit**  
   Actor: Teller · Fn id: `1401` · Screen: Cash deposit — empty  
   - Fast path `1401`; all fields blank; focus on account number.

8. **Account number fetches customer context**  
   Actor: Teller · Fn id: `1401` · Screen: Cash deposit — account fetched  
   - Tab-out fetches branch, description, account class, currency, balances, status flags.  
   - Blocks if account is closed, frozen, or no-credit.

9. **Enter currency and amount**  
   Actor: Teller · Fn id: `1401` · Screen: Cash deposit — amount keyed  
   - Transaction currency SGD; exchange rate 1.0000; account amount mirrors transaction amount.  
   - Validates amount > 0 and product min/max.

10. **Denomination breakdown**  
    Actor: Teller · Fn id: `1401` · Screen: Cash deposit — denomination tab  
    - Teller enters 200 × 100 and 100 × 50 = 25,000.00.  
    - Total must equal header amount; grid drives till denomination position.

11. **Charges from ARC maintenance**  
    Actor: Teller · Fn id: `1401` · Screen: Cash deposit — charge tab  
    - Shows charge components and tax computed on charges.  
    - Waiver tick boxes are auditable overrides.  
    - Charge debit account must be debitable.

12. **Narrative, MIS and UDFs**  
    Actor: Teller · Fn id: `1401` · Screen: Cash deposit — MIS / UDF tab  
    - Narrative, MIS group, cost centre, UDF source/purpose.  
    - Mandatory UDFs enforced on save.

13. **Save — teller limit breached**  
    Actor: Teller · Fn id: `1401` · Screen: Cash deposit — override on save  
    - Save runs all validations; amount exceeds teller limit SGD 20,000.00.  
    - Override `ST-LIMT-011`; record saved `Unauthorized` and queued.

14. **Saved unauthorized with a reference number**  
    Actor: Teller · Fn id: `1401` · Screen: Cash deposit — saved  
    - Reference generated: `000CHDP262300001`.  
    - Status unauthorized; customer balance not yet updated.

### Phase 3 — Authorization

15. **Supervisor opens the pending queue**  
    Actor: Supervisor (`SUPV_02`) · Fn id: `Pending authorization` · Screen: Pending authorization  
    - Supervisor signs on and fetches records pending authorization for the branch.  
    - Queue shows maker, amount, and override reason; self-authorization disallowed.

16. **Review the transaction in authorize mode**  
    Actor: Supervisor · Fn id: `1401` · Screen: Cash deposit — authorize mode  
    - Same 1401 screen read-only with `Authorize`/`Reject` actions.  
    - Supervisor reviews cash, denominations, overrides, and pending accounting.

17. **Authorized — accounting posted**  
    Actor: Supervisor · Fn id: `1401` · Screen: Cash deposit — authorized  
    - Entries post with value date; customer balance updated from 12,340.55 to 37,338.37 (after charges).  
    - Till cash position rises to SGD 175,000.00.  
    - Advice can now be printed.

### Phase 4 — Cash withdrawal (1001)

18. **Launch cash withdrawal**  
    Actor: Teller · Fn id: `1001` · Screen: Cash withdrawal — account fetched  
    - Fast path `1001` for current account `000987654321`.  
    - Ledger 9,200.00; available 8,200.00 (after 1,000.00 minimum balance).

19. **Insufficient funds — hard stop**  
    Actor: Teller · Fn id: `1001` · Screen: Cash withdrawal — insufficient balance  
    - Teller enters 8,500.00; amount + charge 1.00 = 8,501.00 > available 8,200.00.  
    - Hard error `ST-ACC-041` unless force-debit entitlement exists.

20. **Amend to a payable amount**  
    Actor: Teller · Fn id: `1001` · Screen: Cash withdrawal — amount corrected  
    - Amount corrected to 8,000.00; account amount 8,001.00 with charge.  
    - Under teller limit; no override needed.

21. **Signature verification**  
    Actor: Teller · Fn id: `1001` · Screen: Cash withdrawal — verification tab  
    - Teller confirms signature viewed and matched for amount above branch threshold.  
    - Mandatory before save.

22. **Denomination payout vs till stock**  
    Actor: Teller · Fn id: `1001` · Screen: Cash withdrawal — denomination tab  
    - Teller specifies 70 × 100 + 20 × 50 = 8,000.00.  
    - Till stock per denomination is decremented and validated.

23. **Save — auto-authorized and paid**  
    Actor: Teller · Fn id: `1001` · Screen: Cash withdrawal — completed  
    - Auto-authorized by product config; checker shown as `Auto`.  
    - Ledger balance falls to 1,199.00; available to 199.00.  
    - Cash paid; advice printed; till position SGD 167,000.00.

24. **Same-day reversal path**  
    Actor: Teller → Supervisor · Fn id: `Reversal` · Screen: Transaction reversal  
    - Teller queries reference `000CHWL262300012` and requests reversal.  
    - Supervisor confirms; contra entries posted and till denominations restored.  
    - Reversal always requires a checker.

### Phase 5 — Close of day

25. **Till position vs physical count**  
    Actor: Teller · Fn id: `Till position` · Screen: Till position and balancing  
    - System position: 150,000.00 + 25,000.00 − 8,000.00 = 167,000.00.  
    - Teller counts drawer and keys counted units per denomination.  
    - Difference must be zero on every line.

26. **Cash above retention must go to the vault**  
    Actor: Teller · Fn id: `Till position` · Screen: Till position — close blocked  
    - Till position 167,000.00 > retention limit 50,000.00.  
    - Error `ST-CASH-207`: transfer excess 117,000.00 to vault using `9008`.

27. **Transfer excess cash to vault**  
    Actor: Teller · Fn id: `9008` · Screen: Transfer cash to vault  
    - Teller hands over 50 × 1,000 + 600 × 100 + 140 × 50 = 117,000.00.  
    - Vault teller authorizes; till drops to exactly retention limit.

28. **Till balanced and closed**  
    Actor: Teller · Fn id: `Till position` · Screen: Till position — closed  
    - Position 50,000.00, counted and confirmed, differences zero.  
    - Till status set to `Closed`; teller totals report generated.

29. **EOTI blocked by an unauthorized record**  
    Actor: Branch manager (`BRMGR_01`) · Fn id: `Branch batch` · Screen: Branch batch — EOTI blocked  
    - EOTI cannot be marked while any till is open or unauthorized records exist.  
    - Pre-EOTI checks fail: 1 till open, 2 unauthorized records.

30. **EOTI marked, EOD runs**  
    Actor: Branch manager → System · Fn id: `Branch batch` · Screen: Branch batch — EOTI complete  
    - All checks pass; branch marked `EOTI`.  
    - Online input closed; EOD batch queued (interest, GL proofing, statements, CTR extract).

### Cross-cutting rules

- **Maker-checker**: a transaction created by `OPS_USER1` cannot be authorized by `OPS_USER1`.
- **Auto-authorization**: products/amounts within role limits post immediately with checker `Auto`.
- **Unauthorized records**: block EOTI and do not update customer/till balances until authorized.
- **Reversal**: always requires a checker and posts contra entries; original record remains.
- **Till state**: opening buy (9007), deposits, withdrawals, vault transfers, and counted units all update the till cash position and per-denomination stock.

---

## 4. Constraints

- **No backend**: all data and validation logic live in the browser. No API calls, no database.
- **No real authentication**: user id/password fields accept any non-empty input, but the simulator switches context based on the configured actor for each step.
- **Single configurable currency**: the mock defaults to SGD and a fixed exchange rate of `1.0000`. Multi-currency rate maintenance is out of scope.
- **Faithful visual clone**: fonts, colors, spacing, and widget styles must match the source file (Tahoma/Verdana, #1f4e79 blue title bar, #dce6f1 panels, etc.).
- **Next.js with static export**: the app must build to static HTML/JS/CSS.
- **App-only UI**: no explanatory notes, no task banners, no facilitator-only overlays in the participant view.
- **Desktop-first**: layout is optimized for a desktop browser, matching FLEXCUBE branch terminal usage.

---

## 5. Decisions Log

| # | Decision | Alternatives considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | **Scope = full end-to-end journey** | Subset (deposit only, withdrawal only, custom) | User wants the complete 30-step narrative from sign-on to EOTI. |
| 2 | **Interactivity = fully simulated** | Static click-through, guided interactive | Users can type, trigger validations, and see realistic state changes, which is required for UX research. |
| 3 | **Fidelity = faithful clone** | Refined modern UI, hybrid | The prototype must look like the real FLEXCUBE app so research findings map to the production system. |
| 4 | **Tech stack = Next.js** | Single vanilla HTML, React+Vite, Vue+Vite | User selected Next.js; gives component structure and a path to deployment. |
| 5 | **Data = configurable defaults** | Hard-coded source data only, brand-new scenario data | Keeps source data as the default but exposes config constants for reuse across studies. |
| 6 | **Audience / purpose = UX research** | Demo, engineering handoff, training, interview | Drives the app-only, no-notes, no-task-banner requirements. |
| 7 | **Output location = workspace root** | `mock/` or `outputs/` sub-folder | User wants the Next.js project at the top level of the current workspace. |
| 8 | **Notes panel = removed** | Visible, observer-only toggle | The mock should show only the app; explanatory notes are not part of the participant experience. |
| 9 | **Task scenarios = none inline** | Inline banner, separate scenario panel | Facilitators provide tasks outside the app; UI remains identical to production. |
| 10 | **State management = React Context + useReducer** | Redux, Zustand, props drilling | A single session store is enough for this simulator and avoids extra dependencies. |
| 11 | **Styling = CSS Modules + global CSS reset** | Tailwind, styled-jsx, CSS-in-JS | CSS Modules make the legacy pixel-perfect styles easy to audit and port from the source file. |
| 12 | **Language = TypeScript** | JavaScript | TypeScript improves maintainability for a state-heavy simulator and is the default Next.js experience. |
| 13 | **Routing = App Router (`app/page.tsx`) with `'use client'`** | Pages Router | Modern Next.js default; a single client component at the root keeps the simulator simple. |
| 14 | **Build = static export** | SSR/dev only | Produces plain HTML/JS/CSS files for local testing or static hosting without a Node server. |

---

## 6. Out of Scope

- Backend integration, real APIs, databases, or authentication services.
- Printing to physical printers; only on-screen advice/print preview.
- Multi-currency exchange-rate maintenance and cross-currency spread logic.
- Cheque-based withdrawal (`1013` / `CQWL`) beyond a note that it is a separate function.
- Account-to-account transfer (`1006`) UI beyond its appearance in the pending-auth queue.
- Actual EOD batch execution; the mock only shows the batch status and queued jobs.
- Mobile / tablet responsiveness.
- Accessibility audits beyond semantic HTML and focus states.
- Persistence across browser sessions; refresh resets to step 1.

---

## 7. Acceptance Criteria

- [ ] `npm install && npm run dev` starts the app on `localhost:3000`.
- [ ] The landing page is the FLEXCUBE sign-on screen.
- [ ] All 30 steps are reachable via the rail and `←` / `→` keys.
- [ ] Account numbers, amounts, and denominations can be edited; validation messages and dialogs appear for invalid inputs.
- [ ] Save on the deposit flow parks the record unauthorized and generates a reference when the teller limit is exceeded.
- [ ] Supervisor authorization updates customer balance and till position.
- [ ] Withdrawal with insufficient funds shows `ST-ACC-041` and prevents save.
- [ ] Till close is blocked when position exceeds retention limit; `9008` resolves it.
- [ ] EOTI is blocked when tills are open or records are unauthorized.
- [ ] `npm run build` produces a static `out/` folder with an `index.html`.
- [ ] No explanatory notes or task instructions appear inside the app.
