"use client";

import { ENV } from "@/lib/config";
import {
  SessionState,
  Action,
  Transaction,
  DEFAULT_DENOMS,
  fmt,
  parseAmount,
  makeRef,
} from "@/lib/state";
import {
  FCShell,
  Win,
  Section,
  Field,
  Tabs,
  DenomTable,
  Audit,
  ActionBar,
  MsgBar,
  Dialog,
  CustomerFlags,
  Checkbox,
} from "@/components/ui";

function denomTotal(denoms: { value: number; units: number }[]): number {
  return denoms.reduce((sum, d) => sum + d.value * d.units, 0);
}

export function Deposit({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  const tx = state.tx;
  const isAuth = tx.mode === "authorize" || state.currentStep === 15 || state.currentStep === 16;
  const account = tx.account ?? "";
  const customer = tx.customer;
  const fetched = !!customer;
  const amountStr = tx.amount ?? "";
  const amount = parseAmount(amountStr);
  const denoms = tx.denominations ?? (fetched ? DEFAULT_DENOMS["1401"] : DEFAULT_DENOMS["1401"].map((d) => ({ ...d, units: 0 })));
  const total = denomTotal(denoms);
  const ref = tx.ref ?? "";

  const existingTx = state.transactions.find((t) => t.ref === ref);
  const authorized = existingTx ? existingTx.authorized : false;
  const checker = existingTx ? existingTx.checker : tx.checker;

  const tab = tx.tab || "Denomination";

  const setTab = (t: string) =>
    dispatch({ type: "APPLY", partial: { tx: { ...tx, tab: t } } });

  const setAccount = (v: string) =>
    dispatch({ type: "APPLY", partial: { tx: { ...tx, account: v } } });

  const fetchAccount = () => {
    if (account.trim()) dispatch({ type: "FETCH_ACCOUNT", acc: account.trim() });
  };

  const setAmount = (v: string) => dispatch({ type: "SET_AMOUNT", amount: v });

  const setDenom = (code: string, units: string) =>
    dispatch({ type: "SET_DENOM", code, units });

  const setNarrative = (v: string) =>
    dispatch({ type: "APPLY", partial: { tx: { ...tx, narrative: v } } });

  const save = () => dispatch({ type: "SAVE_DEPOSIT" });

  const parkUnauthorized = () => {
    const charge = tx.charge ?? 2.18;
    const newRef = ref || makeRef("CHDP", state.nextSerial);
    const cust = customer ?? state.customers[account];

    const newTx: Transaction = {
      ref: newRef,
      fnId: "1401",
      product: "CHDP",
      account: cust?.acc ?? account,
      amount,
      charge,
      ccy: ENV.ccy,
      maker: state.currentUser,
      checker: "",
      authorized: false,
      status: "unauthorized",
      denominations: denoms,
      mod: 1,
    };

    dispatch({
      type: "APPLY",
      partial: {
        dialog: null,
        currentStep: 13,
        transactions: [...state.transactions, newTx],
        tx: { ...tx, ref: newRef, amount: amountStr, charge },
        nextSerial: state.nextSerial + 1,
        message: {
          kind: "warn",
          text: `Transaction ${newRef} saved. Status: unauthorized — pending supervisor authorization. Customer balance not yet updated.`,
        },
      },
    });
  };

  // Authorization acts on the reference loaded on this screen and stays on the record so the
  // checker can see the posted figures and the maker-checker audit trail.
  const authorize = () => {
    if (ref) dispatch({ type: "AUTHORIZE_TX", ref });
  };

  const reject = () => {
    if (ref) dispatch({ type: "REJECT_TX", ref });
  };

  const handleDialog = (action?: string) => {
    if (action === "CONFIRM_LIMIT_BREACH") {
      parkUnauthorized();
    } else {
      dispatch({ type: "CLOSE_DIALOG" });
    }
  };

  const openLov = (field: string, title: string) =>
    dispatch({ type: "OPEN_LOV", field, title });

  const chargeTab = (
    <table className="g">
      <thead>
        <tr>
          <th>Charge component</th>
          <th>Description</th>
          <th style={{ width: 70 }}>Ccy</th>
          <th style={{ width: 100 }}>Amount</th>
          <th style={{ width: 70 }}>Waiver</th>
          <th>Debit account</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CHDP_CHG1</td>
          <td>Cash handling charge</td>
          <td>SGD</td>
          <td className="num">{fmt(2.0)}</td>
          <td>
            <Checkbox label="" />
          </td>
          <td>{customer?.acc ?? ""}</td>
        </tr>
        <tr>
          <td>CHDP_TAX1</td>
          <td>GST on charge</td>
          <td>SGD</td>
          <td className="num">{fmt(0.18)}</td>
          <td>
            <Checkbox label="" />
          </td>
          <td>{customer?.acc ?? ""}</td>
        </tr>
        <tr className="tot">
          <td colSpan={3}>Total charges</td>
          <td className="num">{fmt(2.18)}</td>
          <td colSpan={2}></td>
        </tr>
      </tbody>
    </table>
  );

  const misTab = (
    <div className="grid2">
      <Field label="Narrative" value={tx.narrative || "CASH DEPOSIT — COUNTER"} onChange={setNarrative} />
      <Field label="Instrument code" value="" />
      <Field
        label="MIS group"
        value={tx.misGroup ?? "RETAIL"}
        lov
        onLov={() => openLov("misGroup", "Select MIS group")}
      />
      <Field label="Cost centre" value="BR000-TELLER" readOnly />
      <Field
        label="UDF — source"
        value={tx.udfSource ?? "BRANCH"}
        lov
        onLov={() => openLov("udfSource", "Select UDF source")}
      />
      <Field label="UDF — purpose" value="SALARY PROCEEDS" />
    </div>
  );

  const tabBody =
    tab === "Charge" ? (
      <>
        {chargeTab}
        <div style={{ marginTop: 6, color: "#555" }}>
          Charge components, slabs and debit/credit GLs are picked up from ARC maintenance for product CHDP.
        </div>
      </>
    ) : tab === "MIS / UDF" ? (
      misTab
    ) : (
      <DenomTable
        rows={denoms}
        totalLabel={{ l: "Total denomination amount", v: fmt(total) }}
        onChange={isAuth ? undefined : setDenom}
      />
    );

  return (
    <FCShell
      state={state}
      dispatch={dispatch}
      current={isAuth ? "auth" : "dep"}
      dialog={state.dialog ? <Dialog spec={state.dialog} onButton={handleDialog} /> : undefined}
    >
      <Win
        fid="1401"
        title="Cash deposit"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={
              isAuth
                ? [
                    { label: "Authorize", primary: true, onClick: authorize },
                    { label: "Reject", onClick: reject },
                    {
                      label: "View accounting",
                      onClick: () =>
                        dispatch({
                          type: "PLACEHOLDER",
                          message: "View accounting would display the accounting entries for this transaction.",
                        }),
                    },
                    {
                      label: "Print",
                      onClick: () =>
                        dispatch({
                          type: "PLACEHOLDER",
                          message: "Print would send the transaction to the default printer.",
                        }),
                    },
                    {
                      label: "Exit",
                      onClick: () =>
                        dispatch({ type: "LAUNCH_FUNCTION", fnId: "Pending authorization" }),
                    },
                  ]
                : [
                    {
                      label: "New",
                      primary: true,
                      onClick: () => dispatch({ type: "LAUNCH_FUNCTION", fnId: "1401" }),
                    },
                    {
                      label: "Enter query",
                      onClick: () =>
                        dispatch({
                          type: "PLACEHOLDER",
                          message: "Enter query would open the transaction lookup screen.",
                        }),
                    },
                    { label: "Save", onClick: save },
                    {
                      label: "Hold",
                      onClick: () =>
                        dispatch({
                          type: "PLACEHOLDER",
                          message: "Hold would park the transaction for later completion.",
                        }),
                    },
                    {
                      label: "Clear",
                      onClick: () => dispatch({ type: "LAUNCH_FUNCTION", fnId: "1401" }),
                    },
                    {
                      label: "Print advice",
                      dim: !ref,
                      onClick: ref
                        ? () =>
                            dispatch({
                              type: "PLACEHOLDER",
                              message: `Print advice would generate the customer advice for ${ref}.`,
                            })
                        : undefined,
                    },
                    {
                      label: "Reverse",
                      dim: existingTx?.status !== "complete",
                      onClick:
                        existingTx?.status === "complete"
                          ? () => dispatch({ type: "REVERSE_TX", ref })
                          : undefined,
                    },
                  ]
            }
          />
        }
      >
        <Section title="Account details">
          <div className="grid2">
            <Field label="External reference" value={tx.externalRef ?? ""} />
            <Field label="Transaction reference" value={ref} readOnly />
            <Field
              label="Account number"
              value={account}
              required
              lov
              focus={state.currentStep === 6}
              onChange={isAuth ? undefined : setAccount}
              onBlur={isAuth ? undefined : fetchAccount}
              onLov={() => openLov("account", "Select account")}
            />
            <Field label="Account branch" value={customer?.br ?? ""} readOnly />
            <Field label="Account description" value={customer?.name ?? ""} readOnly />
            <Field label="Account class" value={customer?.cls ?? ""} readOnly />
            <Field label="Account currency" value={customer?.ccy ?? ""} readOnly />
            <Field
              label="Available balance"
              value={customer ? fmt(customer.avail) : ""}
              readOnly
              number
            />
          </div>
          <CustomerFlags
            flags={{
              noDebit: customer?.noDebit,
              noCredit: customer?.noCredit,
              dormant: customer?.dormant,
              frozen: customer?.frozen,
            }}
          />
        </Section>

        <Section title="Transaction details">
          <div className="grid2">
            <Field
              label="Transaction currency"
              value={tx.ccy ?? (fetched ? ENV.ccy : "")}
              required
              lov
              onLov={() => openLov("currency", "Select currency")}
            />
            <Field
              label="Transaction amount"
              value={amountStr}
              required
              number
              focus={state.currentStep === 8}
              onChange={isAuth || !fetched ? undefined : setAmount}
            />
            <Field label="Exchange rate" value={fetched ? "1.0000" : ""} readOnly number />
            <Field label="Account amount" value={tx.accAmount ?? ""} readOnly number />
            <Field label="Value date" value={ENV.date} readOnly />
            <Field label="Narrative" value={tx.narrative || "CASH DEPOSIT — COUNTER"} onChange={setNarrative} />
          </div>
        </Section>

        <div style={{ marginTop: 8 }}>
          <Tabs
            tabs={["Denomination", "Charge", "MIS / UDF"]}
            active={tab}
            onSelect={isAuth ? undefined : setTab}
          />
          <div className="tabwrap">{tabBody}</div>
        </div>

        <Audit
          maker={existingTx?.maker || ENV.teller}
          mkTime={`${ENV.date} 09:14:22`}
          checker={checker}
          ckTime={authorized ? `${ENV.date} 09:21:07` : undefined}
          authorized={authorized}
          recStat={existingTx?.status ? existingTx.status : ref ? "Complete" : "Not entered"}
        />

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
