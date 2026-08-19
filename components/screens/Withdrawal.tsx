"use client";

import { useEffect } from "react";
import { ENV, CUSTOMERS } from "@/lib/config";
import {
  SessionState,
  Action,
  DEFAULT_DENOMS,
  fmt,
  parseAmount,
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
  WithdrawalFlags,
  Checkbox,
} from "@/components/ui";

function denomTotal(denoms: { value: number; units: number }[]): number {
  return denoms.reduce((sum, d) => sum + d.value * d.units, 0);
}

export function Withdrawal({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  const tx = state.tx;
  const account = tx.account ?? CUSTOMERS["000987654321"].acc;
  const customer = tx.customer ?? state.customers[account] ?? CUSTOMERS["000987654321"];

  // Keep the charge at 1.00 and derive the account amount for withdrawals.
  useEffect(() => {
    const amountStr = tx.amount ?? "";
    const amount = parseAmount(amountStr);
    const charge = 1;
    const desiredAcc = amountStr ? fmt(amount + charge) : "";
    if (tx.charge !== charge || tx.accAmount !== desiredAcc || tx.fnId !== "1001") {
      dispatch({
        type: "APPLY",
        partial: {
          tx: { ...tx, fnId: "1001", charge, accAmount: desiredAcc },
        },
      });
    }
  }, [dispatch, tx]);

  const tab = tx.tab || "Denomination";

  const amountStr = tx.amount ?? "";
  const denoms = tx.denominations ?? DEFAULT_DENOMS["1001"];
  const total = denomTotal(denoms);
  const ref = tx.ref ?? "";

  const setAmount = (v: string) => dispatch({ type: "SET_AMOUNT", amount: v });

  const setDenom = (code: string, units: string) =>
    dispatch({ type: "SET_DENOM", code, units });

  const setTab = (t: string) =>
    dispatch({ type: "APPLY", partial: { tx: { ...tx, tab: t } } });

  const toggleSig = () =>
    dispatch({
      type: "APPLY",
      partial: { tx: { ...tx, sigOk: !tx.sigOk } },
    });

  const save = () => dispatch({ type: "SAVE_WITHDRAWAL" });

  const handleDialog = () => dispatch({ type: "CLOSE_DIALOG" });

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
          <td>CHWL_CHG1</td>
          <td>Counter withdrawal charge</td>
          <td>SGD</td>
          <td className="num">{fmt(1.0)}</td>
          <td>
            <Checkbox label="" />
          </td>
          <td>{customer.acc}</td>
        </tr>
        <tr className="tot">
          <td colSpan={3}>Total charges</td>
          <td className="num">{fmt(1.0)}</td>
          <td colSpan={2}></td>
        </tr>
      </tbody>
    </table>
  );

  const verifyTab = (
    <div className="grid2">
      <Field label="Cheque number" value="" />
      <Field label="Signature verified" value="" />
      <div className="f">
        <label>Verification</label>
        <div className="val ro" onClick={toggleSig} style={{ cursor: "pointer" }}>
          <Checkbox label="Signature viewed and matched" on={tx.sigOk} />
        </div>
      </div>
      <Field label="Passbook updated" value="N" />
    </div>
  );

  const tabBody =
    tab === "Charge" ? (
      chargeTab
    ) : tab === "Cheque / verification" ? (
      verifyTab
    ) : (
      <>
        <DenomTable
          rows={denoms}
          totalLabel={{ l: "Total denomination amount", v: fmt(total) }}
          onChange={setDenom}
        />
        <div style={{ marginTop: 6, color: "#555" }}>
          Till {ENV.till} available cash by denomination is validated before the payout is allowed.
        </div>
      </>
    );

  return (
    <FCShell
      state={state}
      dispatch={dispatch}
      current="wdl"
      dialog={state.dialog ? <Dialog spec={state.dialog} onButton={handleDialog} /> : undefined}
    >
      <Win
        fid="1001"
        title="Cash withdrawal"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={[
              { label: "New", primary: true },
              { label: "Enter query" },
              { label: "Save", onClick: save },
              { label: "Hold" },
              { label: "Clear" },
              { label: "Print advice", dim: !ref },
              { label: "Reverse", dim: true },
            ]}
          />
        }
      >
        <Section title="Account details">
          <div className="grid2">
            <Field label="Transaction reference" value={ref} readOnly />
            <Field label="Transaction date" value={ENV.date} readOnly />
            <Field
              label="Account number"
              value={customer.acc}
              required
              lov
              onLov={() => openLov("account", "Select account")}
            />
            <Field label="Account branch" value={customer.br} readOnly />
            <Field label="Account description" value={customer.name} readOnly />
            <Field label="Account class" value={customer.cls} readOnly />
            <Field label="Ledger balance" value={fmt(customer.bal)} readOnly number />
            <Field label="Available balance" value={fmt(customer.avail)} readOnly number />
            <Field label="Minimum balance" value={fmt(customer.min ?? 0)} readOnly number />
            <Field label="Uncollected funds" value="0.00" readOnly number />
          </div>
          <WithdrawalFlags
            flags={{
              noDebit: customer.noDebit,
              dormant: customer.dormant,
              lien: false,
              od: false,
            }}
          />
        </Section>

        <Section title="Transaction details">
          <div className="grid2">
            <Field
              label="Transaction currency"
              value={tx.ccy ?? ENV.ccy}
              required
              lov
              onLov={() => openLov("currency", "Select currency")}
            />
            <Field
              label="Transaction amount"
              value={amountStr}
              required
              number
              focus={state.currentStep === 17 || state.currentStep === 18}
              onChange={setAmount}
            />
            <Field label="Exchange rate" value="1.0000" readOnly number />
            <Field label="Account amount" value={tx.accAmount ?? ""} readOnly number />
            <Field label="Value date" value={ENV.date} readOnly />
            <Field label="Narrative" value={tx.narrative || "CASH WITHDRAWAL — COUNTER"} />
          </div>
        </Section>

        <div style={{ marginTop: 8 }}>
          <Tabs
            tabs={["Denomination", "Charge", "Cheque / verification"]}
            active={tab}
            onSelect={setTab}
          />
          <div className="tabwrap">{tabBody}</div>
        </div>

        <Audit
          maker={ENV.teller}
          mkTime={`${ENV.date} 11:36:40`}
          checker={ref ? "Auto" : undefined}
          ckTime={ref ? `${ENV.date} 11:37:02` : undefined}
          authorized={!!ref}
          recStat={ref ? "Complete" : "Not entered"}
        />

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
