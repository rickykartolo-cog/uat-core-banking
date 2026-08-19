"use client";

import { ENV, CUSTOMERS } from "@/lib/config";
import { SessionState, Action, fmt, isTillBlocked } from "@/lib/state";
import {
  FCShell,
  Win,
  Section,
  Field,
  ActionBar,
  MsgBar,
  Dialog,
} from "@/components/ui";

export function Reversal({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  const tx = state.tx;
  const ref = tx.ref ?? "000CHWL262300012";
  const reason = tx.reversalReason ?? "WRONG DENOMINATION PAID OUT";

  const targetTx = state.transactions.find((t) => t.ref === ref);

  const requestReverse = () => {
    dispatch({
      type: "APPLY",
      partial: {
        dialog: {
          kind: "warn",
          title: "Confirm reversal",
          code: "ST-REVR-004",
          text: `Reversal of ${ref} will post contra entries for ${ENV.ccy} ${fmt(
            (targetTx?.amount ?? 0) + (targetTx?.charge ?? 0)
          )} and restore till denominations. Supervisor authorization is required. Proceed?`,
          buttons: [
            { label: "Ok", primary: true, action: "CONFIRM_REVERSE" },
            { label: "Cancel" },
          ],
        },
      },
    });
  };

  const handleDialog = (action?: string) => {
    if (action === "CONFIRM_REVERSE") {
      dispatch({ type: "REVERSE_TX", ref });
      if (!targetTx || isTillBlocked(state, targetTx.fnId)) return;
    }
    dispatch({ type: "CLOSE_DIALOG" });
  };

  const openLov = (field: string, title: string) =>
    dispatch({ type: "OPEN_LOV", field, title });

  return (
    <FCShell
      state={state}
      dispatch={dispatch}
      current="rev"
      dialog={state.dialog ? <Dialog spec={state.dialog} onButton={handleDialog} /> : undefined}
    >
      <Win
        title="Transaction reversal"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={[
              { label: "Fetch", primary: true },
              { label: "Reverse", onClick: requestReverse },
              { label: "View accounting" },
              { label: "Exit" },
            ]}
          />
        }
      >
        <Section title="Query">
          <div className="grid3">
            <Field label="Branch" value={ENV.branch} readOnly />
            <Field
              label="Transaction reference"
              value={ref}
              required
              lov
              focus
              onLov={() => openLov("ref", "Select transaction reference")}
            />
            <Field label="Transaction date" value={ENV.date} readOnly />
          </div>
        </Section>

        <Section title="Transaction summary">
          <table className="g">
            <thead>
              <tr>
                <th>Fn id</th>
                <th>Product</th>
                <th>Account</th>
                <th style={{ width: 110 }}>Amount</th>
                <th>Maker</th>
                <th>Checker</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="sel">
                <td>{targetTx?.fnId ?? "1001"}</td>
                <td>{targetTx?.product ?? "CHWL"}</td>
                <td>{targetTx?.account ?? CUSTOMERS["000987654321"].acc}</td>
                <td className="num">{fmt(targetTx?.amount ?? 8000)}</td>
                <td>{targetTx?.maker ?? ENV.teller}</td>
                <td>{targetTx?.checker ?? "Auto"}</td>
                <td>{targetTx?.status ?? "Authorized"}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 7 }}>
            <Field
              label="Reversal reason"
              value={reason}
              required
            />
          </div>
        </Section>

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
