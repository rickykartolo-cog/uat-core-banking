# DRAFT: Interactive mock HTML for FLEXCUBE teller journey

Working document for the spec interview. All assumptions below must be resolved before the PRD is finalized.

## Problem statement
Create an interactive, self-contained HTML prototype that demonstrates the Oracle FLEXCUBE Universal Banking teller journey for cash deposit and withdrawal. The source material is an existing prototype at:
`/Users/ricky.k/Library/Application Support/Claude/local-agent-mode-sessions/18e40c01-3e11-4653-b6c7-8d81f85e4a42/1871293f-9485-4748-89c5-35825ef02f0b/local_ed70db19-ef3e-466b-baa7-c40d196da621/outputs/flexcube-teller-journey.html`.

The goal is a buildable, zero-ambiguity specification for the final interactive mock.

## Best-guess proposed solution
Produce a single HTML file (`flexcube-teller-journey.html`) that replicates the structure and content of the source prototype:
- Left step rail grouping steps by phase (Start of day, Cash deposit, Authorization, Cash withdrawal, Close of day).
- Main stage rendering each FLEXCUBE screen as HTML/CSS in the Oracle 12.x/14.x branch chrome style.
- Notes panel per step summarizing what happens, system validations, accounting entries, and gotchas.
- Keyboard and button navigation (Previous/Next, rail click, arrow keys).
- Static, self-contained: no server, no build step.

## Proposed files
- `docs/prd/flexcube-teller-mock/DRAFT.md` — this working document.
- `docs/prd/flexcube-teller-mock/PRD.md` — final specification (after interview sign-off).
- `flexcube-teller-journey.html` — final interactive mock (created after PRD approval).

## Rough user journey (from source)
1. **Start of day** — teller sign-on, dashboard, attempt deposit before till open, buy cash from vault (9007), retention-limit override, supervisor authorization.
2. **Cash deposit (1401)** — launch, fetch account, enter amount, denomination grid, charge tab, MIS/UDF tab, save, limit-breach override, unauthorized → supervisor authorization.
3. **Authorization** — supervisor queue, review in authorize mode, approve.
4. **Cash withdrawal (1001)** — launch, insufficient funds error, correction, signature verification, denomination payout, auto-authorize, reversal.
5. **Close of day** — till position, retention excess, transfer to vault (9008), close till, EOTI batch.

## Assumptions to resolve
All major assumptions resolved during the interview.

## Decisions log
| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Scope = full end-to-end journey** | The user confirmed the full 28-step flow across all 5 phases. This keeps the narrative continuity of the source material and supports a complete walkthrough from sign-on to EOTI. |
| 2 | **Interactivity = fully simulated** | The user wants near-real behavior: editable inputs, live validation, state progression, and dynamic dialogs. This turns the mock into a lightweight simulator rather than a slide deck. |
| 3 | **Fidelity = faithful clone** | The user wants the prototype to look and feel like the existing Oracle FLEXCUBE 12.x/14.x UI, preserving the legacy chrome, colors, and widgets. |
| 4 | **Tech stack = Next.js** | The user selected Next.js. This gives a React-based component structure, a dev server, and a path to deployment if the mock needs to be shared or expanded. |
| 5 | **Data = configurable defaults** | The source data will be kept as defaults, but extracted into a config object so users can change branch, teller, customers, limits, and other constants without editing component code. |
| 6 | **Audience / purpose = user testing / UX research** | The mock will be used by participants who interact directly with it. This implies clear affordances, realistic validation feedback, and optionally task scenarios or instructions. |
| 7 | **Output location = workspace root** | The Next.js project and PRD will live at the top level of `/Users/ricky.k/workspaces/cognition/uat-core-banking/`. |
| 8 | **Notes panel = removed** | The mock should show only the FLEXCUBE application UI. Explanatory notes, validations, and gotchas from the source are not displayed to participants. |
| 9 | **Task scenarios = none inline** | No task instructions or scenario banners are shown inside the app. Facilitators provide tasks separately. |
