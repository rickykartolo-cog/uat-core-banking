"use client";

import { useEffect } from "react";
import { ENV } from "@/lib/config";
import { SessionState, Action, DEFAULT_DENOMS, fmt } from "@/lib/state";
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
} from "@/components/ui";

export function VaultOut({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  const tx = state.tx;
  const amountStr = tx.amount ?? "117000.00";
  const denoms = tx.denominations ?? DEFAULT_DENOMS["9008"];
  const total = denoms.reduce((sum, d) => sum + d.value * d.units, 0);
  const ref = tx.ref ?? "000CHTV262300031";

  useEffect(() => {
    if (state.currentStep === 26 && !state.dialog && state.message?.kind === "ok") {
      dispatch({ type: "NEXT" });
    }
  }, [dispatch, state.currentStep, state.dialog, state.message]);

  const setAmount = (v: string) => dispatch({ type: "SET_AMOUNT", amount: v });
  const setDenom = (code: string, units: string) =>
    dispatch({ type: "SET_DENOM", code, units });
  const save = () => dispatch({ type: "TRANSFER_TO_VAULT" });
  const closeDialog = () => dispatch({ type: "CLOSE_DIALOG" });

  const openLov = (field: string, title: string) =>
    dispatch({ type: "OPEN_LOV", field, title });

  return (
    <FCShell
      state={state}
      dispatch={dispatch}
      current="vout"
      dialog={state.dialog ? <Dialog spec={state.dialog} onButton={closeDialog} /> : undefined}
    >
      <Win
        fid="9008"
        title="Transfer cash to vault"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={[
              { label: "New", primary: true },
              { label: "Enter query" },
              { label: "Save", onClick: save },
              { label: "Clear" },
              { label: "Exit" },
            ]}
          />
        }
      >
        <Section title="Transaction details">
          <div className="grid2">
            <Field label="Reference number" value={ref} readOnly />
            <Field label="Transaction date" value={ENV.date} readOnly />
            <Field label="From till" value={ENV.till} readOnly />
            <Field
              label="To vault"
              value={tx.vault ?? ENV.vault}
              required
              lov
              onLov={() => openLov("vault", "Select vault")}
            />
            <Field
              label="Transaction currency"
              value={tx.ccy ?? ENV.ccy}
              required
              lov
              onLov={() => openLov("currency", "Select currency")}
            />
            <Field
              label="Total amount"
              value={amountStr}
              required
              number
              focus
              onChange={setAmount}
            />
          </div>
        </Section>

        <div style={{ marginTop: 8 }}>
          <Tabs tabs={["Denomination", "MIS", "UDF"]} active="Denomination" />
          <div className="tabwrap">
            <DenomTable
              rows={denoms}
              totalLabel={{ l: "Total", v: fmt(total) }}
              onChange={setDenom}
            />
          </div>
        </div>

        <Audit
          maker={ENV.teller}
          mkTime={`${ENV.date} 17:41:09`}
          checker={tx.checker}
          authorized={state.tillBalance === ENV.retention}
        />

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
