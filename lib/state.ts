import { ENV, CUSTOMERS, Customer, FN_TO_STEP, STEP_TO_FN } from "./config";

export interface Denom {
  code: string;
  value: number;
  units: number;
}

export interface Transaction {
  ref: string;
  date?: string;
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
  misGroup?: string;
  udfSource?: string;
  udfPurpose?: string;
  instrumentCode?: string;
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
  udfPurpose?: string;
  instrumentCode?: string;
  vault?: string;
  till?: string;
  branch?: string;
  mode?: "authorize";
}

export interface SessionState {
  currentStep: number;
  viewFnId: string;
  currentUser: string;
  signedOnUser: string;
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
  eotiMarked: boolean;
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

const TILL_REQUIRED_FNS = ["1401", "1001", "9008"];

export function requiresOpenTill(fnId: string | undefined): boolean {
  return !!fnId && TILL_REQUIRED_FNS.includes(fnId);
}

export function isTillBlocked(state: SessionState, fnId: string | undefined): boolean {
  return requiresOpenTill(fnId) && !state.tillOpen;
}

export function tillClosedDialog(state: SessionState): DialogSpec {
  return {
    kind: "err",
    title: "Error",
    code: "ST-TILL-002",
    text: `Till <b>${ENV.till}</b> is not open for user ${state.currentUser} for branch date ${ENV.date}. Buy cash from the vault to open the till.`,
    buttons: [{ label: "Ok", primary: true }],
  };
}

export function resolveDenominations(state: SessionState, fnId = state.tx.fnId): Denom[] {
  if (state.tx.denominations) return state.tx.denominations;
  const template = DEFAULT_DENOMS[fnId ?? ""] ?? [];
  return template.map((d) => ({
    ...d,
    units: fnId === "1401" && !state.tx.customer ? 0 : d.units,
  }));
}

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

export function txDate(tx: Pick<Transaction, "date">): string {
  return tx.date ?? ENV.date;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isReversible(
  tx: Transaction | undefined,
  customers: Record<string, Customer>
): boolean {
  return (
    !!tx &&
    !!customers[tx.account] &&
    tx.authorized &&
    tx.status !== "unauthorized" &&
    tx.status !== "reversed" &&
    txDate(tx) === ENV.date
  );
}

export function initialState(): SessionState {
  return stepSnapshot({
    currentStep: 0,
    viewFnId: "",
    currentUser: ENV.teller,
    signedOnUser: ENV.teller,
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
    eotiMarked: false,
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
  | { type: "OPEN_AUTHORIZE"; ref: string }
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

// Teller-facing functions: the signed-on user acts as maker on these screens.
const MAKER_FUNCTIONS = new Set(["1401", "1001", "9007", "9008"]);

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "APPLY": {
      const next = { ...state, ...action.partial };
      if (action.partial.tillOpen === true || action.partial.transactions !== undefined) {
        next.eotiMarked = false;
      }
      return next;
    }

    case "GO":
      return stepSnapshot({ ...state, currentStep: action.step });

    case "NEXT":
      return stepSnapshot({ ...state, currentStep: Math.min(state.currentStep + 1, 29) });

    case "PREV":
      return stepSnapshot({ ...state, currentStep: Math.max(state.currentStep - 1, 0) });

    case "LOGIN":
      return { ...state, currentUser: action.user, signedOnUser: action.user, loggedIn: true };

    case "OPEN_TILL":
      return { ...state, tillOpen: true, eotiMarked: false };

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
      const denoms = resolveDenominations(state, state.tx.fnId ?? state.viewFnId);
      const updated = denoms.map((d) =>
        d.code === action.code ? { ...d, units: parseInt(action.units || "0", 10) || 0 } : d
      );
      return { ...state, tx: { ...state.tx, denominations: updated } };
    }

    case "SAVE_DEPOSIT":
      return saveDeposit(state);

    case "OPEN_AUTHORIZE":
      return openAuthorize(state, action.ref);

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
      const next = stepSnapshot({ ...state, currentStep: step });
      return isTillBlocked(next, action.fnId)
        ? { ...next, dialog: tillClosedDialog(next) }
        : next;
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
  const snapshot: Partial<SessionState> = {
    dialog: null,
    message: null,
    currentUser: state.signedOnUser,
  };
  const tx: CurrentTx = {};

  if (step === 0) {
    snapshot.loggedIn = false;
    snapshot.eotiMarked = false;
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

  // Steps 14-16 are the authorization phase; step 17 launches the withdrawal, which the
  // teller keys, so the supervisor context must not extend into it.
  if (step >= 14 && step <= 16) {
    snapshot.currentUser = ENV.supervisor;
  } else if (step !== 28 && step !== 29) {
    snapshot.currentUser = ENV.teller;
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

  if (step === 24) {
    tx.fnId = "Reversal";
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
    if (state.eotiMarked) {
      snapshot.message = state.message;
    }
  }

  const viewFnId = STEP_TO_FN[step] ?? state.viewFnId;
  // Any route onto a teller function restores the teller context unless the step is one
  // of the checker/branch-manager phases above, so maker and checker stay distinct.
  if (snapshot.currentUser === undefined && MAKER_FUNCTIONS.has(viewFnId)) {
    snapshot.currentUser = ENV.teller;
  }
  return { ...state, ...snapshot, tx, viewFnId };
}

function denomTotal(denoms: Denom[] | undefined): number {
  return (denoms ?? []).reduce((sum, d) => sum + d.value * d.units, 0);
}

function denomMismatchDialog(total: number, amount: number): DialogSpec {
  return {
    kind: "err",
    title: "Error",
    code: "ST-DENM-001",
    text: `Denomination total ${ENV.ccy} ${fmt(total)} does not match transaction amount ${ENV.ccy} ${fmt(amount)}.`,
    buttons: [{ label: "Ok", primary: true }],
  };
}

export const DEPOSIT_UDF_DEFAULTS = {
  misGroup: "RETAIL",
  udfSource: "BRANCH",
  udfPurpose: "SALARY PROCEEDS",
};

function saveDeposit(state: SessionState): SessionState {
  const amount = parseAmount(state.tx.amount || "0");
  const denoms = resolveDenominations(state, "1401");
  if (isTillBlocked(state, "1401")) {
    return { ...state, dialog: tillClosedDialog(state) };
  }

  const total = denomTotal(denoms);
  if (Math.round(total * 100) !== Math.round(amount * 100)) {
    return { ...state, dialog: denomMismatchDialog(total, amount) };
  }

  const udfSource = (state.tx.udfSource ?? DEPOSIT_UDF_DEFAULTS.udfSource).trim();
  if (!udfSource) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-UDF-001",
        text: `Mandatory user defined field 'UDF — source' (source of funds) has no value. Enter a value before saving — this UDF feeds the CTR extract at EOD.`,
        buttons: [{ label: "Ok", primary: true }],
      },
    };
  }
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
  const denoms = resolveDenominations(state, "1401");
  const charge = state.tx.charge ?? 2.18;
  const ref = state.tx.ref || makeRef("CHDP", state.nextSerial);
  const customer = state.tx.customer!;
  const newAvail = customer.avail + amount - charge;
  const newCustomers = { ...state.customers };

  const tx: Transaction = {
    ref,
    date: ENV.date,
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
    denominations: denoms,
    mod: 1,
    misGroup: state.tx.misGroup ?? DEPOSIT_UDF_DEFAULTS.misGroup,
    udfSource: (state.tx.udfSource ?? DEPOSIT_UDF_DEFAULTS.udfSource).trim(),
    udfPurpose: state.tx.udfPurpose ?? DEPOSIT_UDF_DEFAULTS.udfPurpose,
    instrumentCode: state.tx.instrumentCode,
  };

  if (!unauthorized) {
    newCustomers[customer.acc] = { ...customer, bal: newAvail, avail: newAvail };
  }

  return {
    ...state,
    tx: { ...state.tx, ref, misGroup: tx.misGroup, udfSource: tx.udfSource, udfPurpose: tx.udfPurpose, instrumentCode: tx.instrumentCode },
    transactions: [...state.transactions, tx],
    customers: newCustomers,
    tillBalance: unauthorized ? state.tillBalance : state.tillBalance + amount,
    tillDenoms: unauthorized ? state.tillDenoms : updateTillDenoms(state.tillDenoms, denoms, "add"),
    nextSerial: state.nextSerial + 1,
    eotiMarked: false,
    dialog: null,
    message: unauthorized
      ? { kind: "warn", text: `Transaction ${ref} saved. Status: unauthorized — pending supervisor authorization. Customer balance not yet updated.` }
      : { kind: "ok", text: `Transaction ${ref} authorized. Account balance updated to ${ENV.ccy} ${fmt(newAvail)}. Till cash position: ${ENV.ccy} ${fmt(state.tillBalance + amount)}.` },
  };
}

// Opens a queued record in authorize mode on its own function screen. The record is
// resolved by its own reference so the checker always sees the row they selected.
function openAuthorize(state: SessionState, ref: string): SessionState {
  const record = state.transactions.find((t) => t.ref === ref);
  if (!record) {
    return {
      ...state,
      message: { kind: "err", text: `Transaction ${ref} is not available for authorization.` },
    };
  }
  return {
    ...state,
    viewFnId: record.fnId,
    dialog: null,
    message: null,
    tx: {
      mode: "authorize",
      fnId: record.fnId,
      product: record.product,
      account: record.account,
      customer: state.customers[record.account],
      amount: fmt(record.amount),
      accAmount: fmt(record.amount),
      charge: record.charge,
      ccy: record.ccy,
      rate: "1.0000",
      denominations: structuredClone(record.denominations),
      ref: record.ref,
      tab: "Denomination",
      fetched: true,
      maker: record.maker,
      checker: record.checker,
      authorized: record.authorized,
    },
  };
}

function authorizeTx(state: SessionState, ref: string): SessionState {
  const txIndex = state.transactions.findIndex((t) => t.ref === ref);
  if (txIndex < 0) {
    return {
      ...state,
      message: { kind: "err", text: `Transaction ${ref} is not available for authorization.` },
    };
  }
  const tx = state.transactions[txIndex];
  if (isTillBlocked(state, tx.fnId)) {
    return { ...state, dialog: tillClosedDialog(state) };
  }
  if (tx.authorized || tx.status !== "unauthorized") {
    return {
      ...state,
      message: {
        kind: "err",
        text: `Transaction ${ref} is already authorized. Accounting entries have already been posted and cannot be posted again.`,
      },
    };
  }
  if (tx.maker === state.currentUser) {
    return {
      ...state,
      message: {
        kind: "err",
        text: `Maker and checker cannot be the same user. Transaction ${ref} was input by ${tx.maker} and must be authorized by another user.`,
      },
    };
  }
  const customer = state.customers[tx.account];
  const newAvail = customer.avail + tx.amount - tx.charge;
  const newCustomers = { ...state.customers, [tx.account]: { ...customer, bal: newAvail, avail: newAvail } };
  const newTransactions = [...state.transactions];
  newTransactions[txIndex] = { ...tx, checker: state.currentUser, authorized: true, status: "complete" };

  return {
    ...state,
    transactions: newTransactions,
    customers: newCustomers,
    tx: {
      ...state.tx,
      ref,
      customer: newCustomers[tx.account],
      checker: state.currentUser,
      authorized: true,
    },
    tillBalance: state.tillBalance + tx.amount,
    tillDenoms: updateTillDenoms(state.tillDenoms, tx.denominations, "add"),
    message: { kind: "ok", text: `Transaction ${ref} authorized. Account balance updated to ${ENV.ccy} ${fmt(newAvail)}. Till cash position: ${ENV.ccy} ${fmt(state.tillBalance + tx.amount)}.` },
  };
}

function rejectTx(state: SessionState, ref: string): SessionState {
  const txIndex = state.transactions.findIndex((t) => t.ref === ref);
  if (txIndex < 0) {
    return {
      ...state,
      message: { kind: "err", text: `Transaction ${ref} is not available for authorization.` },
    };
  }
  const target = state.transactions[txIndex];
  if (target.authorized || target.status !== "unauthorized") {
    return {
      ...state,
      message: {
        kind: "err",
        text: `Transaction ${ref} is already authorized and cannot be rejected. Use transaction reversal instead.`,
      },
    };
  }
  const newTransactions = [...state.transactions];
  newTransactions.splice(txIndex, 1);
  return {
    ...state,
    transactions: newTransactions,
    viewFnId: "Pending authorization",
    tx: {},
    message: { kind: "warn", text: `Transaction ${ref} rejected and removed from queue.` },
  };
}

function saveWithdrawal(state: SessionState): SessionState {
  if (isTillBlocked(state, "1001")) {
    return { ...state, dialog: tillClosedDialog(state) };
  }
  if (state.tx.ref && state.transactions.some((t) => t.ref === state.tx.ref && t.status !== "reversed")) {
    return {
      ...state,
      message: { kind: "info", text: `Transaction ${state.tx.ref} is already saved and authorized.` },
    };
  }
  const amount = parseAmount(state.tx.amount || "0");
  const denoms = resolveDenominations(state, "1001");
  const account = state.tx.account ?? state.tx.customer?.acc;
  const customer = (account ? state.customers[account] : undefined) ?? state.tx.customer!;
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

  if (!state.tx.sigOk) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-SIGN-001",
        text: "Signature verification is mandatory before saving a cash withdrawal above the branch threshold.",
        buttons: [{ label: "Ok", primary: true }],
      },
    };
  }

  const totalDenom = denomTotal(denoms);
  if (Math.round(totalDenom * 100) !== Math.round(amount * 100)) {
    return { ...state, dialog: denomMismatchDialog(totalDenom, amount) };
  }

  for (const d of denoms) {
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

  const ref =
    state.tx.ref && !state.transactions.some((t) => t.ref === state.tx.ref)
      ? state.tx.ref
      : makeRef("CHWL", state.nextSerial);
  const newBal = customer.bal - required;
  const newAvail = customer.avail - required;

  const tx: Transaction = {
    ref,
    date: ENV.date,
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
    denominations: denoms,
    mod: 1,
  };

  const newCustomers = { ...state.customers, [customer.acc]: { ...customer, bal: newBal, avail: newAvail } };

  return {
    ...state,
    tx: { ...state.tx, ref, customer: newCustomers[customer.acc] },
    transactions: [...state.transactions, tx],
    customers: newCustomers,
    tillBalance: state.tillBalance - amount,
    tillDenoms: updateTillDenoms(state.tillDenoms, denoms, "remove"),
    nextSerial: state.nextSerial + 1,
    eotiMarked: false,
    message: { kind: "ok", text: `Transaction ${ref} saved and auto-authorized. Cash paid ${ENV.ccy} ${fmt(amount)}. Account balance ${ENV.ccy} ${fmt(newBal)}. Till cash position ${ENV.ccy} ${fmt(state.tillBalance - amount)}.` },
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
        text: `Transaction ${escapeHtml(ref)} not found.`,
        buttons: [{ label: "Ok", primary: true }],
      },
      message: null,
    };
  }
  const tx = state.transactions[txIndex];
  if (isTillBlocked(state, tx.fnId)) {
    return { ...state, dialog: tillClosedDialog(state) };
  }
  if (!tx.authorized || tx.status === "unauthorized") {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-REVR-002",
        text: `Transaction ${escapeHtml(ref)} is unauthorized and cannot be reversed.`,
        buttons: [{ label: "Ok", primary: true }],
      },
      message: null,
    };
  }
  if (tx.status === "reversed") {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-REVR-003",
        text: `Transaction ${escapeHtml(ref)} has already been reversed.`,
        buttons: [{ label: "Ok", primary: true }],
      },
      message: null,
    };
  }
  if (txDate(tx) !== ENV.date) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-REVR-005",
        text: `Transaction ${escapeHtml(ref)} is dated ${txDate(tx)} and cannot be reversed on business date ${ENV.date}.`,
        buttons: [{ label: "Ok", primary: true }],
      },
      message: null,
    };
  }
  if (!state.customers[tx.account]) {
    return {
      ...state,
      dialog: {
        kind: "err",
        title: "Error",
        code: "ST-REVR-006",
        text: `Transaction ${escapeHtml(ref)} is not a customer account transaction and cannot be reversed from this screen.`,
        buttons: [{ label: "Ok", primary: true }],
      },
      message: null,
    };
  }
  if (tx.fnId !== "1001") {
    for (const denomination of tx.denominations) {
      const available = state.tillDenoms[denomination.code] ?? 0;
      if (available < denomination.units) {
        return {
          ...state,
          dialog: {
            kind: "err",
            title: "Error",
            code: "ST-TILL-042",
            text: `Till does not hold enough ${denomination.code} notes. Available ${available}, requested ${denomination.units}.`,
            buttons: [{ label: "Ok", primary: true }],
          },
          message: null,
        };
      }
    }
  }
  const customer = state.customers[tx.account];
  const delta = tx.fnId === "1001" ? tx.amount + tx.charge : -tx.amount + tx.charge;
  const newBal = customer.bal + delta;
  const newAvail = customer.avail + delta;
  const newCustomers = { ...state.customers, [tx.account]: { ...customer, bal: newBal, avail: newAvail } };
  const newTransactions = [...state.transactions];
  newTransactions[txIndex] = { ...tx, status: "reversed" };

  const tillChange = tx.fnId === "1001" ? tx.amount : -tx.amount;
  return {
    ...state,
    tx: { ...state.tx, ref },
    transactions: newTransactions,
    customers: newCustomers,
    tillBalance: state.tillBalance + tillChange,
    tillDenoms: updateTillDenoms(state.tillDenoms, tx.denominations, tx.fnId === "1001" ? "add" : "remove"),
    dialog: null,
    eotiMarked: false,
    message: {
      kind: "ok",
      text: `Transaction ${ref} reversed. Contra entries posted. Account balance restored to ${ENV.ccy} ${fmt(newAvail)}. Till cash position restored to ${ENV.ccy} ${fmt(state.tillBalance + tillChange)}.`,
    },
  };
}

function transferToVault(state: SessionState): SessionState {
  if (isTillBlocked(state, "9008")) {
    return { ...state, dialog: tillClosedDialog(state) };
  }
  const amount = parseAmount(state.tx.amount || "0");
  const denoms = resolveDenominations(state, "9008");
  const total = denomTotal(denoms);
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

  if (Math.round(total * 100) !== Math.round(amount * 100)) {
    return { ...state, dialog: denomMismatchDialog(total, amount) };
  }

  for (const d of denoms) {
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
    date: ENV.date,
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
    denominations: denoms,
    mod: 1,
  };

  return {
    ...state,
    tx: { ...state.tx, ref, checker: ENV.supervisor, authorized: true },
    transactions: [...state.transactions, tx],
    tillBalance: state.tillBalance - amount,
    tillDenoms: updateTillDenoms(state.tillDenoms, denoms, "remove"),
    vaultBalance: state.vaultBalance + amount,
    nextSerial: state.nextSerial + 1,
    eotiMarked: false,
    message: { kind: "ok", text: `Transfer ${ref} authorized. Excess cash ${ENV.ccy} ${fmt(amount)} moved to vault.` },
  };
}

function markEoti(state: SessionState): SessionState {
  const openTills = state.tillOpen ? 1 : 0;
  const unauth = state.transactions.filter((t) => t.status === "unauthorized").length;
  if (openTills > 0 || unauth > 0) {
    const blockers: string[] = [];
    if (openTills > 0) {
      blockers.push(`${openTills} till${openTills === 1 ? "" : "s"} still open (${ENV.till})`);
    }
    if (unauth > 0) {
      blockers.push(`${unauth} unauthorized record${unauth === 1 ? "" : "s"} exist${unauth === 1 ? "s" : ""} in branch ${ENV.branch}`);
    }
    return {
      ...state,
      message: {
        kind: "err",
        text: `Cannot mark EOTI. ${blockers.join(" and ")}. Resolve all exceptions before proceeding.`,
      },
    };
  }
  return {
    ...state,
    eotiMarked: true,
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
