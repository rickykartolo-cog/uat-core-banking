# FLEXCUBE Full Interactivity — Draft

## Problem Statement
The current mock is a 30-step guided journey: the app renders a faithful Oracle FLEXCUBE shell, but most of the chrome (menu bar, tree, fast path, tabs, LOV buttons, window controls) is static. The user wants the mock to feel like a real app where *everything* in the Oracle FLEXCUBE Universal Banking UI is clickable.

## Current State
- `FCShell` renders a titlebar, menubar, left `FCTree`, and a work area.
- `FCTree` shows favorites, teller, vault, and branch functions; only a `current` highlight is supported.
- The top menubar (`Interactions`, `Customer`, `Workflow`, `Batch`, `Preferences`, `Sign off`) is non-interactive.
- Screen-level buttons are wired (Sign on, Save, Authorize, etc.), but tabs, fields, LOV buttons, and window-title buttons are mostly static.
- Navigation is currently step-based (`currentStep` 0–29) driven by `PREV`/`NEXT` arrow keys and in-screen primary actions.

## Proposed Direction
Add state-driven interactivity to every UI element:
1. **Top menubar** — clickable menu items (possibly with dropdowns) and actions such as Sign off.
2. **Left tree / Fast path** — clickable function launchers that navigate to or open functions.
3. **Window chrome** — minimize / maximize / close, and window-title actions.
4. **Tabs, fields, and LOV buttons** — switch tabs, edit fields, open list-of-values dialogs.
5. **Navigation model** — decide whether the app stays a guided 30-step journey or becomes a free-form multi-function app.

## Open Assumptions / Questions
1. ✅ **Navigation model** — resolved: the app is a full, free-form FLEXCUBE app; the 30-step scenario is driven by a separate external script and is not part of the UI.
2. ✅ **Clickable scope** — resolved: every visible control is clickable, including decorative chrome; non-functional items show a placeholder response.
3. ✅ **Function launch state** — resolved: launching a function from the tree/menu/Fast Path loads the state from the corresponding step in the 30-step scenario.
4. ✅ **Business-rule enforcement** — resolved: no enforcement; any function can be opened regardless of state (e.g., Cash deposit can be opened before till is open).
5. ✅ **Top menubar** — resolved: each menu item opens a dropdown with realistic submenu items.
6. ✅ **Fast Path** — resolved: the Fast Path input accepts typed function codes and offers autocomplete to launch functions.
7. ✅ **LOV buttons** — resolved: open a real, searchable list-of-values dialog.
8. ✅ **Scenario script scope** — resolved: external 30-step scenario script is out of scope for this deliverable; the app is built to be scriptable later.

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
