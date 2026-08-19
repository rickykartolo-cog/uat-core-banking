export interface Customer {
  acc: string;
  name: string;
  short: string;
  br: string;
  ccy: string;
  bal: number;
  avail: number;
  cls: string;
  min?: number;
  noDebit?: boolean;
  noCredit?: boolean;
  dormant?: boolean;
  frozen?: boolean;
}

export interface Environment {
  branch: string;
  branchName: string;
  date: string;
  teller: string;
  till: string;
  supervisor: string;
  vault: string;
  ccy: string;
  tellerLimit: number;
  retention: number;
}

export const ENV: Environment = {
  branch: "000",
  branchName: "Main Branch — Singapore",
  date: "18-AUG-2026",
  teller: "OPS_USER1",
  till: "TILL001",
  supervisor: "SUPV_02",
  vault: "VAULT000",
  ccy: "SGD",
  tellerLimit: 20000,
  retention: 50000,
};

export const CUSTOMERS: Record<string, Customer> = {
  "000123456789": {
    acc: "000123456789",
    name: "MAYA RODRIGUEZ",
    short: "MRODRIGUEZ",
    br: "000",
    ccy: "SGD",
    bal: 12340.55,
    avail: 12340.55,
    cls: "SBACC — Savings Regular",
  },
  "000987654321": {
    acc: "000987654321",
    name: "CHANDRA WIJAYA",
    short: "CWIJAYA",
    br: "000",
    ccy: "SGD",
    bal: 9200.0,
    avail: 8200.0,
    cls: "CAACC — Current Account",
    min: 1000.0,
  },
};

export const TREE_ITEMS = [
  { g: "Favorites" },
  { t: "Cash deposit (1401)", k: "dep" },
  { t: "Cash withdrawal (1001)", k: "wdl" },
  { t: "Buy cash from vault (9007)", k: "vin" },
  { t: "Transfer cash to vault (9008)", k: "vout" },
  { g: "Teller" },
  { t: "Transactions" },
  { t: "Pending authorization", k: "auth" },
  { t: "Transaction reversal", k: "rev" },
  { t: "Journal query" },
  { g: "Vault operations" },
  { t: "Till / vault position", k: "till" },
  { t: "Buy cash from central bank (9009)" },
  { g: "Branch maintenance" },
  { t: "Till–user linkage" },
  { t: "Branch batch (EOTI / EOD)", k: "eod" },
];

export const STEPS = [
  { ph: "1 · Start of day", t: "Teller signs on", fid: "Sign on", actor: "Teller (OPS_USER1)", screen: "FLEXCUBE branch sign-on" },
  { ph: "1 · Start of day", t: "Dashboard — till still closed", fid: "Teller dashboard", actor: "Teller", screen: "Teller dashboard" },
  { ph: "1 · Start of day", t: "Attempt a deposit before opening the till", fid: "1401", actor: "Teller", screen: "Cash deposit — blocked" },
  { ph: "1 · Start of day", t: "Buy opening cash from the vault", fid: "9007", actor: "Teller", screen: "Buy cash from vault" },
  { ph: "1 · Start of day", t: "Retention-limit override", fid: "9007", actor: "Teller → supervisor", screen: "Buy cash from vault — override" },
  { ph: "1 · Start of day", t: "Vault teller authorizes — till is open", fid: "9007", actor: "Vault teller / supervisor (SUPV_02)", screen: "Buy cash from vault — authorized" },
  { ph: "2 · Cash deposit (1401)", t: "Launch cash deposit", fid: "1401", actor: "Teller", screen: "Cash deposit — empty" },
  { ph: "2 · Cash deposit (1401)", t: "Account number fetches customer context", fid: "1401", actor: "Teller", screen: "Cash deposit — account fetched" },
  { ph: "2 · Cash deposit (1401)", t: "Enter currency and amount", fid: "1401", actor: "Teller", screen: "Cash deposit — amount keyed" },
  { ph: "2 · Cash deposit (1401)", t: "Denomination breakdown", fid: "1401", actor: "Teller", screen: "Cash deposit — denomination tab" },
  { ph: "2 · Cash deposit (1401)", t: "Charges from ARC maintenance", fid: "1401", actor: "Teller", screen: "Cash deposit — charge tab" },
  { ph: "2 · Cash deposit (1401)", t: "Narrative, MIS and UDFs", fid: "1401", actor: "Teller", screen: "Cash deposit — MIS / UDF tab" },
  { ph: "2 · Cash deposit (1401)", t: "Save — teller limit breached", fid: "1401", actor: "Teller", screen: "Cash deposit — override on save" },
  { ph: "2 · Cash deposit (1401)", t: "Saved unauthorized with a reference number", fid: "1401", actor: "Teller", screen: "Cash deposit — saved" },
  { ph: "3 · Authorization", t: "Supervisor opens the pending queue", fid: "Pending authorization", actor: "Supervisor (SUPV_02)", screen: "Pending authorization" },
  { ph: "3 · Authorization", t: "Review the transaction in authorize mode", fid: "1401", actor: "Supervisor", screen: "Cash deposit — authorize mode" },
  { ph: "3 · Authorization", t: "Authorized — accounting posted", fid: "1401", actor: "Supervisor", screen: "Cash deposit — authorized" },
  { ph: "4 · Cash withdrawal (1001)", t: "Launch cash withdrawal", fid: "1001", actor: "Teller", screen: "Cash withdrawal — account fetched" },
  { ph: "4 · Cash withdrawal (1001)", t: "Insufficient funds — hard stop", fid: "1001", actor: "Teller", screen: "Cash withdrawal — insufficient balance" },
  { ph: "4 · Cash withdrawal (1001)", t: "Amend to a payable amount", fid: "1001", actor: "Teller", screen: "Cash withdrawal — amount corrected" },
  { ph: "4 · Cash withdrawal (1001)", t: "Signature verification", fid: "1001", actor: "Teller", screen: "Cash withdrawal — verification tab" },
  { ph: "4 · Cash withdrawal (1001)", t: "Denomination payout vs till stock", fid: "1001", actor: "Teller", screen: "Cash withdrawal — denomination tab" },
  { ph: "4 · Cash withdrawal (1001)", t: "Save — auto-authorized and paid", fid: "1001", actor: "Teller", screen: "Cash withdrawal — completed" },
  { ph: "4 · Cash withdrawal (1001)", t: "Same-day reversal path", fid: "Reversal", actor: "Teller → supervisor", screen: "Transaction reversal" },
  { ph: "5 · Close of day", t: "Till position vs physical count", fid: "Till position", actor: "Teller", screen: "Till position and balancing" },
  { ph: "5 · Close of day", t: "Cash above retention must go to the vault", fid: "Till position", actor: "Teller", screen: "Till position — close blocked" },
  { ph: "5 · Close of day", t: "Transfer excess cash to vault", fid: "9008", actor: "Teller", screen: "Transfer cash to vault" },
  { ph: "5 · Close of day", t: "Till balanced and closed", fid: "Till position", actor: "Teller", screen: "Till position — closed" },
  { ph: "5 · Close of day", t: "EOTI blocked by an unauthorized record", fid: "Branch batch", actor: "Branch manager (BRMGR_01)", screen: "Branch batch — EOTI blocked" },
  { ph: "5 · Close of day", t: "EOTI marked, EOD runs", fid: "Branch batch", actor: "Branch manager → system", screen: "Branch batch — EOTI complete" },
] as const;

export interface FunctionDef {
  id: string;
  label: string;
  step: number;
  treeKey?: string;
}

export const FUNCTIONS: FunctionDef[] = [
  { id: "Sign on", label: "Sign on", step: 0 },
  { id: "Teller dashboard", label: "Teller dashboard", step: 1 },
  { id: "1401", label: "Cash deposit", step: 6, treeKey: "dep" },
  { id: "1001", label: "Cash withdrawal", step: 17, treeKey: "wdl" },
  { id: "9007", label: "Buy cash from vault", step: 3, treeKey: "vin" },
  { id: "9008", label: "Transfer cash to vault", step: 26, treeKey: "vout" },
  { id: "Pending authorization", label: "Pending authorization", step: 14, treeKey: "auth" },
  { id: "Reversal", label: "Transaction reversal", step: 23, treeKey: "rev" },
  { id: "Till position", label: "Till position", step: 24, treeKey: "till" },
  { id: "Branch batch", label: "Branch batch", step: 28, treeKey: "eod" },
];

export const FN_TO_STEP: Record<string, number> = Object.fromEntries(
  FUNCTIONS.map((f) => [f.id, f.step])
);

export const FN_LABELS: Record<string, string> = Object.fromEntries(
  FUNCTIONS.map((f) => [f.id, f.label])
);

export const STEP_TO_FN: Record<number, string> = Object.fromEntries(
  STEPS.map((s, i) => [i, s.fid])
) as Record<number, string>;

export const TREE_KEY_TO_FN: Record<string, string> = Object.fromEntries(
  FUNCTIONS.filter((f) => f.treeKey).map((f) => [f.treeKey, f.id])
);

export interface MenuItem {
  label: string;
  items: { label: string; fnId?: string; placeholder?: string }[];
}

export const MENU: MenuItem[] = [
  {
    label: "Interactions",
    items: [
      { label: "New Deposit", fnId: "1401" },
      { label: "New Withdrawal", fnId: "1001" },
      { label: "Buy Cash from Vault", fnId: "9007" },
      { label: "Transfer Cash to Vault", fnId: "9008" },
      { label: "Till Position", fnId: "Till position" },
    ],
  },
  {
    label: "Customer",
    items: [
      { label: "Customer search", placeholder: "Customer search would open the customer maintenance screen." },
      { label: "Account summary", placeholder: "Account summary would display the selected customer accounts." },
    ],
  },
  {
    label: "Workflow",
    items: [
      { label: "Pending authorization", fnId: "Pending authorization" },
      { label: "Transaction reversal", fnId: "Reversal" },
      { label: "Limit override", placeholder: "Limit override would route to the supervisor queue." },
    ],
  },
  {
    label: "Batch",
    items: [
      { label: "Branch batch", fnId: "Branch batch" },
      { label: "End of day", placeholder: "End of day would run the EOD batch processes." },
    ],
  },
  {
    label: "Preferences",
    items: [
      { label: "User settings", placeholder: "Preferences would open the user settings panel." },
    ],
  },
  {
    label: "Sign off",
    items: [
      { label: "Sign off", placeholder: "Sign off would end the session and return to the login screen." },
    ],
  },
];

export const FAST_PATH_CODES = FUNCTIONS.map((f) => ({ code: f.id, label: f.label }));

export interface LovOption {
  value: string;
  label: string;
}

export const LOV_DATA: Record<string, LovOption[]> = {
  account: Object.values(CUSTOMERS).map((c) => ({ value: c.acc, label: `${c.acc} — ${c.name}` })),
  currency: [
    { value: "SGD", label: "SGD — Singapore Dollar" },
    { value: "USD", label: "USD — US Dollar" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" },
  ],
  vault: [{ value: ENV.vault, label: `${ENV.vault} — Main vault` }],
  till: [{ value: ENV.till, label: `${ENV.till} — Teller 1` }],
  branch: [{ value: ENV.branch, label: `${ENV.branch} — ${ENV.branchName}` }],
  functionId: [
    { value: "1401", label: "1401 — Cash deposit" },
    { value: "1001", label: "1001 — Cash withdrawal" },
    { value: "9007", label: "9007 — Buy cash from vault" },
    { value: "9008", label: "9008 — Transfer cash to vault" },
    { value: "1006", label: "1006 — Account transfer" },
  ],
  ref: [
    { value: "000CHWL262300012", label: "000CHWL262300012 — Cash withdrawal" },
    { value: "000CHDP262300001", label: "000CHDP262300001 — Cash deposit" },
    { value: "000CHAT262300004", label: "000CHAT262300004 — Account transfer" },
  ],
  maker: [
    { value: "ALL", label: "ALL — All makers" },
    { value: ENV.teller, label: `${ENV.teller} — Teller` },
    { value: ENV.supervisor, label: `${ENV.supervisor} — Supervisor` },
    { value: "BRMGR_01", label: "BRMGR_01 — Branch manager" },
  ],
  misGroup: [
    { value: "RETAIL", label: "RETAIL — Retail banking" },
    { value: "CORPORATE", label: "CORPORATE — Corporate banking" },
    { value: "WEALTH", label: "WEALTH — Wealth management" },
  ],
  udfSource: [
    { value: "BRANCH", label: "BRANCH — Branch counter" },
    { value: "COUNTER", label: "COUNTER — Teller counter" },
    { value: "ONLINE", label: "ONLINE — Internet banking" },
    { value: "ATM", label: "ATM — Self service" },
  ],
};
