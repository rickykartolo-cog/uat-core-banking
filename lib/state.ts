import { ENV, CUSTOMERS, Customer, FN_TO_STEP, STEP_TO_FN } from "./config";

export interface Denom {
  code: string;
  value: number;
  units: number;
}

export interface Transaction {
  ref: string;
  fnId: string;
  product: string;
  account: string;
  amount: number;
  charge: number;
  ccy: string;
  maker: string;
  checker: string;
  authorized: boolean;
  status: "complete" | "unauthorized" | "reversed";
  denominations: Denom[];
  mod: number;
}

export interface DialogSpec {
  kind: "warn" | "err" | "info";
  title: string;
  code: string;
  text: string;
  buttons: { label: string; primary?: boolean; action?: string }[];
}

export interface MessageSpec {
  kind: "ok" | "warn" | "err" | "info";
  text: string;
}

export interface CurrentTx {
  fnId?: string;
  product?: string;
  account?: string;
  customer?: Customer;
  amount?: string;
  accAmount?: string;
  charge?: number;
  ccy?: string;
  rate?: string;
  narrative?: string;
  denominations?: Denom[];
  ref?: string;
  tab?: string;
  fetched?: boolean;
  sigOk?: boolean;
  externalRef?: string;
  reversalReason?: string;
  checker?: string;
  authorized?: boolean;
  maker?: string;
  functionId?: string;
  misGroup?: string;
  udfSource?: string;
  vault?: string;
  till?: string;
  branch?: string;
}

export interface SessionState {
  currentStep: number;
  viewFnId: string;
  currentUser: string;
  loggedIn: boolean;
  tillOpen: boolean;
  tillBalance: number;
  tillDenoms: Record<string, number>;
  vaultBalance: number;
  customers: Record<string, Customer>;
  transactions: Transaction[];
  tx: CurrentTx;
  dialog: DialogSpec | null;
  message: MessageSpec | null;
  lov: { field: string; title: string } | null;
  flags: Record<string, unknown>;
  nextSerial: number;
}

export const DEFAULT_DENOMS: Record<string, Denom[]> = {
  "9007": [
    { code: "1000", value: 1000, units: 50 },
    { code: "100", value: 100, units: 800 },
    { code: "50", value: 50, units: 300 },
    { code: "10", value: 10, units: 400 },
    { code: "5", value: 5, units: 200 },
  ],
  "1401": [
    { code: "100", value: 100, units: 200 },
    { code: "50", value: 50, units: 100 },
    { code: "10", value: 10, units: 0 },
    { code: "5", value: 5, units: 0 },
  ],
  "1001": [
    { code: "100", value: 100, units: 0 },
    { code: "50", value: 50, units: 0 },
    { code: "10", value: 10, units: 0 },
  ],
  "9008": [
    { code: "1000", value: 1000, units: 50 },
    { code: "100", value: 100, units: 600 },
    { code: "50", value: 50, units: 140 },
  ],
};

export const DENOM_LADDER: { code: string; value: number }[] = [
  { code: "1000", value: 1000 },
  { code: "100", value: 100 },
  { code: "50", value: 50 },
  { code: "10", value: 10 },
  { code: "5", value: 5 },
];

export interface TillSummary {
  opening: number;
  received: number;
  paid: number;
  transferred: number;
  position: number;
}

export function tillSummary(state: SessionState): TillSummary {
  const posted = state.transactions.filter((t) => t.status === "complete");
  const received = posted.filter((t) => t.fnId === "1401").reduce((s, t) => s + t.amount, 0);
  const paid = posted.filter((t) => t.fnId === "1001").reduce((s, t) => s + t.amount, 0);
  const transferred = posted.filter((t) => t.fnId === "9008").reduce((s, t) => s + t.amount, 0);
  const position = state.tillBalance;
  return { opening: position - received + paid + transferred, received, paid, transferred, position };
}

export function tillExcess(state: SessionState): number {
  return Math.max(0, state.tillBalance - ENV.retention);
}

// Largest-first breakdown of `amount` using only the units the till actually holds.
export function proposeVaultDenoms(
  tillDenoms: Record<string, number>,
  amount: number
): Denom[] {
  let left = amount;
  const rows: Denom[] = [];
  for (const d of DENOM_LADDER) {
    const held = tillDenoms[d.code] ?? 0;
    const units = Math.min(held, Math.floor(left / d.value));
    left -= units * d.value;
    if (held > 0 || units > 0) rows.push({ code: d.code, value: d.value, units });
  }
  return rows;
}

export function countedSignature(tillDenoms: Record<string, number>): string {
  return DENOM_LADDER.map((d) => `${d.code}:${tillDenoms[d.code] ?? 0}`).join("|");
}

export function makeRef(product: string, serial: number): string {
  const julian = "26230";
  return `${ENV.branch}${product}${julian}${String(serial).padStart(4, "0")}`;
}

export function fmt(n: number | undefined): string {
  if (n === undefined || isNaN(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseAmount(s: string): number {
  const cleaned = s.replace(/,/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function initialState(): SessionState {
  return stepSnapshot({
    currentStep: 0,
    viewFnId: "",
    currentUser: ENV.teller,
    loggedIn: false,
    tillOpen: false,
    tillBalance: 0,
    tillDenoms: {},
    vaultBalance: 500000,
    customers: { ...CUSTOMERS },
    transactions: [],
    tx: {},
    dialog: null,
    message: null,
    lov: null,
    flags: {},
    nextSerial: 1,
  });
}

export type Action =
  | { type: "APPLY"; partial: Partial<SessionState> }
  | { type: "GO"; step: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "LOGIN"; user: string }
  | { type: "OPEN_TILL" }
  | { type: "CLOSE_TILL" }
  | { type: "FETCH_ACCOUNT"; acc: string }
  | { type: "SET_AMOUNT"; amount: string }
  | { type: "SET_DENOM"; code: string; units: string }
  | { type: "SAVE_DEPOSIT" }
  | { type: "AUTHORIZE_TX"; ref: string }
  | { type: "REJECT_TX"; ref: string }
  | { type: "SAVE_WITHDRAWAL" }
  | { type: "REVERSE_TX"; ref: string }
  | { type: "TRANSFER_TO_VAULT" }
  | { type: "UPDATE_COUNTED"; code: string; units: string }
  | { type: "MARK_EOTI" }
  | { type: "CLOSE_DIALOG" }
  | { type: "CLEAR_MSG" }
  | { type: "LAUNCH_FUNCTION"; fnId: string }
  | { type: "PLACEHOLDER"; message: string }
  | { type: "OPEN_LOV"; field: string; title: string }
  | { type: "CLOSE_LOV" };

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "APPLY":
      return { ...state, ...action.partial };

    case "GO":
      return stepSnapshot({ ...state, currentStep: action.step });

    case "NEXT":
      return stepSnapshot({ ...state, currentStep: Math.min(state.currentStep + 1, 29) });

    case "PREV":
      return stepSnapshot({ ...state, currentStep: Math.max(state.currentStep - 1, 0) });

    case "LOGIN":
      return { ...state, currentUser: action.user, loggedIn: true };

    case "OPEN_TILL":
      return { ...state, tillOpen: true };

    case "CLOSE_TILL":
      return { ...state, tillOpen: false };

    case "FETCH_ACCOUNT": {
      const customer = state.customers[action.acc];
      return {
        ...state,
        tx: {
          ...state.tx,
          account: action.acc,
          customer,
          fetched: !!customer,
          ccy: customer?.ccy || ENV.ccy,
          rate: "1.0000",
        },
      };
    }

    case "SET_AMOUNT": {
      const amt = parseAmount(action.amount);
      const charge = state.tx.charge ?? 0;
      const accAmt = amt + charge;
      return {
        ...state,
        tx: {
          ...state.tx,
          amount: action.amount,
          accAmount: fmt(accAmt),
        },
      };
    }

    case "SET_DENOM": {
      const denoms = state.tx.denominations ?? [];
      const updated = denoms.map((d) =>
        d.code === action.code ? { ...d, units: parseInt(action.units || "0", 10) || 0 } : d
      );
      return { ...state, tx: { ...state.tx, denominations: updated } };
    }

    case "SAVE_DEPOSIT":
      return saveDeposit(state);

    case "AUTHORIZE_TX":
      return authorizeTx(state, action.ref);

    case "REJECT_TX":
      return rejectTx(state, action.ref);

    case "SAVE_WITHDRAWAL":
      return saveWithdrawal(state);

    case "REVERSE_TX":
      return reverseTx(state, action.ref);

    case "TRANSFER_TO_VAULT":
      return transferToVault(state);

    case "UPDATE_COUNTED": {
      const sig = countedSignature(state.tillDenoms);
      const stale = state.flags.countedSig !== sig;
      const counted = stale ? {} : ((state.flags.counted as Record<string, string>) ?? {});
      return {
        ...state,
        flags: {
          ...state.flags,
          counted: { ...counted, [action.code]: action.units },
          countedSig: sig,
        },
      };
    }

    case "MARK_EOTI":
      return markEoti(state);

    case "CLOSE_DIALOG":
      return { ...state, dialog: null };

    case "CLEAR_MSG":
      return { ...state, message: null };

    case "LAUNCH_FUNCTION": {
      const step = FN_TO_STEP[action.fnId] ?? 0;
      return stepSnapshot({ ...state, currentStep: step });
    }

    case "PLACEHOLDER":
      return { ...state, message: { kind: "info", text: action.message }, dialog: null };

    case "OPEN_LOV":
      return { ...state, lov: { field: action.field, title: action.title }, dialog: null, message: null };

    case "CLOSE_LOV":
      return { ...state, lov: null };

    default:
      return state;
  }
}

function stepSnapshot(state: SessionState): SessionState {
  const step = state.currentStep;
  const snapshot: Partial<SessionState> = { dialog: null, message: null };
  const tx: CurrentTx = {};

  if (step === 0) {
    snapshot.loggedIn = false;
  }

  if (step >= 3 && step <= 5) {
    tx.fnId = "9007";
    tx.product = "CHVT";
    tx.ccy = ENV.ccy;
    tx.amount = "150000.00";
    tx.denominations = structuredClone(DEFAULT_DENOMS["9007"]);
    tx.narrative = "BUY CASH FROM VAULT";
    tx.ref = makeRef("CHVT", 1);
  }

  if ((step >= 6 && step <= 14) || step === 15 || step === 16) {
    tx.fnId = "1401";
    tx.product = "CHDP";
    tx.ccy = ENV.ccy;
    tx.rate = "1.0000";
    tx.narrative = "CASH DEPOSIT — COUNTER";
    tx.tab = step === 10 ? "Charge" : step === 11 ? "MIS / UDF" : "Denomination";
    if (step === 7 || step === 8 || step === 9) {
      tx.denominations = structuredClone(DEFAULT_DENOMS["1401"].map((d) => ({ ...d, units: 0 })));
    } else if (step >= 10) {
      tx.denominations = structuredClone(DEFAULT_DENOMS["1401"]);
    }
    if (step >= 8) {
      tx.account = CUSTOMERS["000123456789"].acc;
      tx.customer = state.customers["000123456789"];
      tx.fetched = true;
    }
    if (step >= 9) {
      tx.amount = "25000.00";
      tx.accAmount = "25000.00";
    }
    if (step >= 13) {
      tx.ref = makeRef("CHDP", 1);
    }
  }

  if (step >= 14 && step <= 17) {
    snapshot.currentUser = ENV.supervisor;
  }

  if (step >= 17 && step <= 23) {
    tx.account = CUSTOMERS["000987654321"].acc;
    tx.customer = state.customers["000987654321"];
    tx.fetched = true;
    tx.ccy = ENV.ccy;
    tx.rate = "1.0000";
    tx.narrative = "CASH WITHDRAWAL — COUNTER";
  }

  if (step >= 17 && step <= 23) {
    tx.fnId = "1001";
    tx.product = "CHWL";
    tx.tab = step === 19 ? "Charge" : step === 20 ? "Cheque / verification" : "Denomination";
    if (step === 18) {
      tx.amount = "8500.00";
      tx.accAmount = "8501.00";
      tx.charge = 1;
      tx.denominations = structuredClone(DEFAULT_DENOMS["1001"]);
    } else if (step >= 19 && step <= 20) {
      tx.amount = "8000.00";
      tx.accAmount = "8001.00";
      tx.charge = 1;
      tx.denominations = structuredClone(DEFAULT_DENOMS["1001"]);
    } else if (step >= 21) {
      tx.amount = "8000.00";
      tx.accAmount = "8001.00";
      tx.charge = 1;
      tx.denominations = [
        { code: "100", value: 100, units: 70 },
        { code: "50", value: 50, units: 20 },
        { code: "10", value: 10, units: 0 },
      ];
    }
  }

  if (step === 23) {
    tx.ref = makeRef("CHWL", 2);
  }

  if (step === 24) {
    tx.fnId = "Reversal";
    tx.ref = makeRef("CHWL", 2);
    tx.reversalReason = "WRONG DENOMINATION PAID OUT";
  }

  if (step === 26) {
    const excess = tillExcess(state);
    tx.fnId = "9008";
    tx.product = "CHTV";
    tx.ccy = ENV.ccy;
    tx.amount = fmt(excess).replace(/,/g, "");
    tx.denominations = proposeVaultDenoms(state.tillDenoms, excess);
  }

  if (step === 28) {
    snapshot.currentUser = "BRMGR_01";
  }

  if (step === 29) {
    snapshot.currentUser = "BRMGR_01";
  }

  const viewFnId = STEP_TO_FN[step] ?? state.viewFnId;
  return { ...state, ...snapshot, tx, viewFnId };
}

function denomTotal(denoms: Denom[] | undefined): number {
  return (denoms ?? []).reduce((sum, d) => sum + d.value * d.units, 0);
}

function saveDeposit(state: SessionState): SessionState {
  const amount = parseAmount(state.tx.amount || "0");
  if (amount > ENV.tellerLimit) {
    return {
      ...state,
      dialog: {
        kind: "warn",
        title: "Override",
        code: "ST-LIMT-011",
        text: `Transaction amount ${ENV.ccy} ${fmt(amount)} exceeds the transaction limit of ${ENV.ccy} ${fmt(ENV.tellerLimit)} for user ${state.currentUser}. The transaction will be saved unauthorized and routed for supervisor authorization.`,
        buttons: [{ label: "Ok", primary: true, action: "CONFIRM_LIMIT_BREACH" }, { label: "Cancel" }],
      },
    };
  }
  return finalizeDeposit(state, false);
}

function finalizeDeposit(state: SessionState, unauthorized: boolean): SessionState {
  const amount = parseAmount(state.tx.amount || "0");
  const charge = state.tx.charge ?? 2.18;
  const ref = state.tx.ref || makeRef("CHDP", state.nextSerial);
  const customer = state.tx.customer!;
  const newAvail = customer.avail + amount - charge;
  const newCustomers = { ...state.customers };

  const tx: Transaction = {
    ref,
    fnId: "1401",
    product: "CHDP",
    account: customer.acc,
    amount,
    charge,
    ccy: ENV.ccy,
    maker: state.currentUser,
    checker: unauthorized ? "" : "Auto",
    authorized: !unauthorized,
    status: unauthorized ? "unauthorized" : "complete",
    denominations: state.tx.denominations ?? [],
    mod: 1,
  };

  if (!unauthorized) {
    newCustomers[customer.acc] = { ...customer, bal: newAvail, avail: newAvail };
  }

  return {
    ...state,
    tx: { ...state.tx, ref },
    transactions: [...state.transactions, tx],
    customers: newCustomers,
    tillBalance: unauthorized ? state.tillBalance : state.tillBalance + amount,
    tillDenoms: unauthorized ? state.tillDenoms : updateTillDenoms(state.tillDenoms, state.tx.denominations ?? [], "add"),
    nextSerial: state.nextSerial + 1,
    dialog: null,
    message: unauthorized
      ? { kind: "warn", text: `Transaction ${ref} saved. Status: unauthorized — pending supervisor authorization. Customer balance not yet updated.` }
      : { kind: "ok", text: `Transaction ${ref} authorized. Account balance updated to ${ENV.ccy} ${fmt(newAvail)}. Till cash position: ${ENV.ccy} ${fmt(state.tillBalance + amount)}.` },
  };
}

function authorizeTx(state: SessionState, ref: string): SessionState {
  const txIndex = state.transactions.findIndex((t) => t.ref === ref);
  if (txIndex < 0) return state;
  const tx = state.transactions[txIndex];
  const customer = state.customers[tx.account];
  const newAvail = customer.avail + tx.amount - tx.charge;
  const newCustomers = { ...state.customers, [tx.account]: { ...customer, bal: newAvail, avail: newAvail } };
  const newTransactions = [...state.transactions];
  newTransactions[txIndex] = { ...tx, checker: state.currentUser, authorized: true, status: "complete" };

  return {
    ...state,
    transactions: newTransactions,
    customers: newCustomers,
    tillBalance: state.tillBalance + tx.amount,
    tillDenoms: updateTillDenoms(state.tillDenoms, tx.denominations, "add"),
    message: { kind: "ok", text: `Transaction ${ref} authorized. Account balance updated to ${ENV.ccy} ${fmt(newAvail)}. Till cash position: ${ENV.ccy} ${fmt(state.tillBalance + tx.amount)}.` },
  };
}

function rejectTx(state: SessionState, ref: string): SessionState {
  const txIndex = state.transactions.findIndex((t) => t.ref === ref);
  if (txIndex < 0) return state;
  const newTransactions = [...state.transactions];
  newTransactions.splice(txIndex, 1);
  return { ...state, transactions: newTransactions, message: { kind: "warn", text: `Transaction ${ref} rejected and removed from queue.` } };
}

function saveWithdrawal(state: SessionState): SessionState {
  const amount = parseAmount(state.tx.amount || "0");
  const customer = state.tx.customer!;
  const charge = state.tx.charge ?? 1.0;
  const required = amount + charge;
  if (required > customer.avail) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-ACC-041",
        text: `Insufficient available balance in account ${customer.acc}. Available ${ENV.ccy} ${fmt(customer.avail)}, required ${ENV.ccy} ${fmt(required)} (including charges ${ENV.ccy} ${fmt(charge)}). Withdrawal not allowed without OD / force-debit authorization.`,
        buttons: [{ label: "Ok", primary: true }],
      },
    };
  }

  const totalDenom = denomTotal(state.tx.denominations);
  if (totalDenom !== amount) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-DENM-001",
        text: `Denomination total ${ENV.ccy} ${fmt(totalDenom)} does not match transaction amount ${ENV.ccy} ${fmt(amount)}.`,
        buttons: [{ label: "Ok", primary: true }],
      },
    };
  }

  for (const d of state.tx.denominations ?? []) {
    if ((state.tillDenoms[d.code] ?? 0) < d.units) {
      return {
        ...state,
        dialog: {
          kind: "err",
          title: "Error",
          code: "ST-TILL-042",
          text: `Till does not hold enough ${d.code} notes. Available ${state.tillDenoms[d.code] ?? 0}, requested ${d.units}.`,
          buttons: [{ label: "Ok", primary: true }],
        },
      };
    }
  }

  const ref = state.tx.ref || makeRef("CHWL", state.nextSerial);
  const newAvail = customer.avail - required;

  const tx: Transaction = {
    ref,
    fnId: "1001",
    product: "CHWL",
    account: customer.acc,
    amount,
    charge,
    ccy: ENV.ccy,
    maker: state.currentUser,
    checker: "Auto",
    authorized: true,
    status: "complete",
    denominations: state.tx.denominations ?? [],
    mod: 1,
  };

  const newCustomers = { ...state.customers, [customer.acc]: { ...customer, bal: newAvail, avail: newAvail } };

  return {
    ...state,
    tx: { ...state.tx, ref },
    transactions: [...state.transactions, tx],
    customers: newCustomers,
    tillBalance: state.tillBalance - amount,
    tillDenoms: updateTillDenoms(state.tillDenoms, state.tx.denominations ?? [], "remove"),
    nextSerial: state.nextSerial + 1,
    message: { kind: "ok", text: `Transaction ${ref} saved and auto-authorized. Cash paid ${ENV.ccy} ${fmt(amount)}. Account balance ${ENV.ccy} ${fmt(newAvail)}. Till cash position ${ENV.ccy} ${fmt(state.tillBalance - amount)}.` },
  };
}

function reverseTx(state: SessionState, ref: string): SessionState {
  const txIndex = state.transactions.findIndex((t) => t.ref === ref);
  if (txIndex < 0) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-REVR-001",
        text: `Transaction ${ref} not found.`,
        buttons: [{ label: "Ok", primary: true }],
      },
    };
  }
  const tx = state.transactions[txIndex];
  const customer = state.customers[tx.account];
  const newAvail = tx.fnId === "1001" ? customer.avail + tx.amount + tx.charge : customer.avail - tx.amount + tx.charge;
  const newCustomers = { ...state.customers, [tx.account]: { ...customer, bal: newAvail, avail: newAvail } };
  const newTransactions = [...state.transactions];
  newTransactions[txIndex] = { ...tx, status: "reversed" };

  const tillChange = tx.fnId === "1001" ? tx.amount : -tx.amount;
  return {
    ...state,
    transactions: newTransactions,
    customers: newCustomers,
    tillBalance: state.tillBalance + tillChange,
    tillDenoms: updateTillDenoms(state.tillDenoms, tx.denominations, tx.fnId === "1001" ? "add" : "remove"),
    message: { kind: "ok", text: `Transaction ${ref} reversed. Contra entries posted and till denominations restored.` },
  };
}

function transferToVault(state: SessionState): SessionState {
  const amount = parseAmount(state.tx.amount || "0");
  const total = denomTotal(state.tx.denominations);
  if (amount <= 0) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-CASH-208",
        text: "Transfer amount must be greater than zero.",
        buttons: [{ label: "Ok", primary: true }],
      },
    };
  }

  if (total !== amount) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-DENM-001",
        text: `Denomination total ${ENV.ccy} ${fmt(total)} does not match transaction amount ${ENV.ccy} ${fmt(amount)}.`,
        buttons: [{ label: "Ok", primary: true }],
      },
    };
  }

  for (const d of state.tx.denominations ?? []) {
    if ((state.tillDenoms[d.code] ?? 0) < d.units) {
      return {
        ...state,
        dialog: {
          kind: "err",
          title: "Error",
          code: "ST-TILL-042",
          text: `Till does not hold enough ${d.code} notes.`,
          buttons: [{ label: "Ok", primary: true }],
        },
      };
    }
  }

  const ref = makeRef("CHTV", state.nextSerial);
  const tx: Transaction = {
    ref,
    fnId: "9008",
    product: "CHTV",
    account: ENV.vault,
    amount,
    charge: 0,
    ccy: ENV.ccy,
    maker: state.currentUser,
    checker: ENV.supervisor,
    authorized: true,
    status: "complete",
    denominations: state.tx.denominations ?? [],
    mod: 1,
  };

  return {
    ...state,
    tx: { ...state.tx, ref, checker: ENV.supervisor, authorized: true },
    transactions: [...state.transactions, tx],
    tillBalance: state.tillBalance - amount,
    tillDenoms: updateTillDenoms(state.tillDenoms, state.tx.denominations ?? [], "remove"),
    vaultBalance: state.vaultBalance + amount,
    nextSerial: state.nextSerial + 1,
    message: { kind: "ok", text: `Transfer ${ref} authorized. Excess cash ${ENV.ccy} ${fmt(amount)} moved to vault.` },
  };
}

function markEoti(state: SessionState): SessionState {
  const openTills = state.tillOpen ? 1 : 0;
  const unauth = state.transactions.filter((t) => t.status === "unauthorized").length;
  if (openTills > 0 || unauth > 0) {
    return {
      ...state,
      message: {
        kind: "err",
        text: `Cannot mark EOTI. ${openTills} till still open (${ENV.till}) and ${unauth} unauthorized records exist in branch ${ENV.branch}. Resolve all exceptions before proceeding.`,
      },
    };
  }
  return {
    ...state,
    message: { kind: "ok", text: `Branch ${ENV.branch} marked EOTI at 18:12. Online transaction input is now closed. EOD batch queued: interest accrual, GL proofing, statements, CTR extract, teller totals archive.` },
  };
}

function updateTillDenoms(
  existing: Record<string, number>,
  denoms: Denom[],
  op: "add" | "remove"
): Record<string, number> {
  const next = { ...existing };
  for (const d of denoms) {
    next[d.code] = (next[d.code] ?? 0) + (op === "add" ? d.units : -d.units);
    if (next[d.code] < 0) next[d.code] = 0;
  }
  return next;
}
