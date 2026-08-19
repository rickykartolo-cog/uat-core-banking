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
