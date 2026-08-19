# FLEXCUBE Full Interactivity PRD

## Problem Statement
The existing mock is a 30-step guided journey rendered inside an Oracle FLEXCUBE shell. Most of the FLEXCUBE chrome — the top menubar, left tree, Fast Path, tabs, field-level LOV buttons, and window controls — is non-interactive. The goal is to turn the mock into a convincing, fully clickable FLEXCUBE Universal Banking application while keeping the 30-step scenario available as an external, scriptable drive path that is not visible in the UI.

## Proposed Solution
Refactor the application so the shell is the primary navigation surface and the `currentStep` is only one way (among several) to load function state.

### Architecture
1. **Function-centric state**  
   Introduce a `view` concept keyed by `fnId` (e.g., `1401`, `1001`, `9007`, `9008`, `Pending authorization`, `Reversal`, `Till position`, `Branch batch`). Launching a function sets `fnId` and optionally a `scenarioStep` index whose initial data is used to hydrate the transaction (`tx`) and session state. Existing `currentStep` is preserved for future external scripting but is no longer the main driver of the UI.
2. **Clickable shell chrome**  
   - **Top menubar**: every label (`Interactions`, `Customer`, `Workflow`, `Batch`, `Preferences`, `Sign off`) opens a dropdown with realistic submenu items. Selecting an item either launches a function or shows a placeholder dialog/toast.
   - **Left tree / Fast Path**: tree nodes launch functions; the Fast Path input accepts typed function codes and offers autocomplete. Launching loads the function in its scenario-step state.
   - **Window title bar**: `_`, `□`, `×` buttons dispatch placeholder actions (minimize, maximize, close).
   - **Tabs, fields, LOV buttons**: tabs switch; fields with `lov` open a searchable List-of-Values dialog; action buttons continue to execute business logic.
3. **Placeholder behavior**  
   Controls that are not wired to real backend behavior (e.g., `Preferences`, `Sign off`, window maximize) show a temporary message or dialog describing what they would do, keeping the UI responsive.
4. **No out-of-order enforcement**  
   Any function can be opened from the shell regardless of till state, login state, or prior steps. Business rules inside a function (e.g., insufficient balance on withdrawal) still produce their existing error dialogs, but they do not gate navigation.

### Affected Components
- `components/App.tsx` — orchestrates shell-level state and dispatches global actions.
- `components/ui.tsx` — `FCShell`, `FCTree`, `Field`, `Win`, `Dialog`, `ActionBar`, and a new `LovDialog` / `MenuBar`.
- `lib/state.ts` — reducer gains actions for `LAUNCH_FUNCTION`, `MENU_SELECT`, `LOV_SELECT`, `PLACEHOLDER`, and window chrome.
- `lib/config.ts` — maps function codes to scenario step indices and menu dropdown content.
- `components/screens/*.tsx` — consume the new `fnId`-based routing and expose their action handlers to the shell.

## User Journeys

### Journey 1 — Launch a function from the tree
1. User sees the FLEXCUBE dashboard.
2. Clicks **Favorites → Cash deposit (1401)** in the left tree.
3. The work area loads the Cash Deposit screen with the scenario step 7/8 state pre-populated (account fetched, default denomination table).
4. User can edit fields, switch tabs, or save.

### Journey 2 — Launch a function via Fast Path
1. User clicks into the Fast Path input.
2. Types `10`; an autocomplete dropdown shows `1001`, `1002`, etc.
3. Selects `1001` and presses Enter.
4. Cash Withdrawal loads with the scenario step 17 state.

### Journey 3 — Use the top menubar
1. User clicks **Interactions** in the menubar.
2. A dropdown appears with options such as **New Deposit**, **New Withdrawal**, **Buy Cash from Vault**.
3. Selecting an item launches the corresponding function.
4. Clicking **Preferences** shows a placeholder dialog: "Preferences would open the user settings panel."

### Journey 4 — Use an LOV
1. User is on the Cash Deposit screen.
2. Clicks the `▼` LOV button next to the Account Number field.
3. A searchable dialog opens listing the mock customer accounts.
4. User selects an account; the form is populated.

### Journey 5 — Click decorative chrome
1. User clicks the window close `×` or **Sign off**.
2. A placeholder dialog/toast appears explaining the action.
3. No navigation occurs, but the control is visibly interactive.

### Journey 6 — Switch tabs and edit fields
1. User opens Cash Deposit.
2. Clicks **Charge** tab.
3. Edits charge amount; account amount recalculates live.
4. Clicks **Denomination** tab; the denomination table is editable.

## Constraints
- Tech stack: Next.js 16 App Router, TypeScript, React `useReducer`, global CSS (no CSS Modules currently).
- Output: static export (`output: "export"`, `distDir: "out"`).
- No backend or API integration; all data mocked in `lib/config.ts`.
- No external 30-step scenario script in this deliverable, but the app state must remain scriptable later.
- Existing business-rule error dialogs are kept, but they must not block free navigation between functions.

## Decisions Log
| # | Decision | Rationale |
|---|----------|-----------|
| 1 | The app is a full, free-form FLEXCUBE app; the 30-step scenario is an external script, not part of the UI. | User wants a real app and explicitly said the navigation/rail should be a separate script. |
| 2 | No business-rule enforcement out of order; functions can be opened freely. | User selected "No enforcement" for free exploration. |
| 3 | Every visible control is clickable, including decorative chrome, with placeholder responses for non-functional items. | User selected "Everything, with placeholders." |
| 4 | Top menubar items open dropdown menus with realistic submenu items. | User selected "Dropdown menus." |
| 5 | LOV buttons open a real, searchable list-of-values dialog. | User selected "Real searchable dialog." |
| 6 | Fast Path input accepts typed function codes with autocomplete. | User selected "Yes, with autocomplete." |
| 7 | Launching a function from the tree/menu/Fast Path loads the corresponding scenario step state. | User selected "Replay scenario state." |
| 8 | External 30-step scenario script is out of scope for this deliverable. | User selected "App only, script later." |

## Out of Scope
- External 30-step scenario driver script.
- Real backend, authentication, or persisted sessions.
- Full regulatory/business-rule enforcement across the entire app.
- Multi-language, accessibility audit, or print/export features.
- Browser-native window management (minimize/maximize/close only show placeholders).
