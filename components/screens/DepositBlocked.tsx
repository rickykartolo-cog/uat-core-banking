"use client";

import { useEffect, useRef } from "react";
import { ENV } from "@/lib/config";
import { SessionState, Action } from "@/lib/state";
import { FCShell, Win, Section, Field, ActionBar, Dialog, CustomerFlags } from "@/components/ui";

export function DepositBlocked({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!state.dialog) {
      dispatch({
        type: "APPLY",
        partial: {
          dialog: {
            kind: "err",
            title: "Error",
            code: "ST-TILL-002",
            text: `Till <b>${ENV.till}</b> is not open for user ${ENV.teller} for branch date ${ENV.date}. Buy cash from the vault to open the till.`,
            buttons: [{ label: "Ok", primary: true }],
          },
        },
      });
    }
  }, [dispatch, state.dialog]);

  const close = () => dispatch({ type: "CLOSE_DIALOG" });

  return (
    <FCShell user={state.currentUser} till={ENV.till} current="dep" dialog={state.dialog ? <Dialog spec={state.dialog} onButton={close} /> : undefined}>
      <Win
        fid="1401"
        title="Cash deposit"
        actions={
          <ActionBar
            buttons={[
              { label: "New", primary: true },
              { label: "Enter query" },
              { label: "Save" },
              { label: "Hold" },
              { label: "Clear" },
              { label: "Reverse", dim: true },
            ]}
          />
        }
      >
        <Section title="Account details">
          <div className="grid2">
            <Field label="External reference" value="" />
            <Field label="Transaction reference" value="" readOnly />
            <Field label="Account number" value="" required lov focus />
            <Field label="Account branch" value="" readOnly />
            <Field label="Account description" value="" readOnly />
            <Field label="Account class" value="" readOnly />
            <Field label="Account currency" value="" readOnly />
            <Field label="Available balance" value="" readOnly number />
          </div>
          <CustomerFlags flags={{}} />
        </Section>

        <Section title="Transaction details">
          <div className="grid2">
            <Field label="Transaction currency" value="" required lov />
            <Field label="Transaction amount" value="" required number />
            <Field label="Exchange rate" value="" readOnly number />
            <Field label="Account amount" value="" readOnly number />
            <Field label="Value date" value={ENV.date} readOnly />
            <Field label="Narrative" value="" />
          </div>
        </Section>
      </Win>
    </FCShell>
  );
}
