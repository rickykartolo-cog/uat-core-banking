"use client";

import { useEffect, useState } from "react";
import { ENV } from "@/lib/config";
import { SessionState, Action, fmt } from "@/lib/state";
import { FCShell, Win, Section, Field, ActionBar, MsgBar } from "@/components/ui";

export function AuthQueue({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  // Supervisor context for the auth phase.
  useEffect(() => {
    if (state.currentUser !== ENV.supervisor) {
      dispatch({ type: "APPLY", partial: { currentUser: ENV.supervisor } });
    }
  }, [dispatch, state.currentUser]);

  const pending = state.transactions.filter((t) => t.status === "unauthorized");
  // Add a static account-to-account transfer row to match the source prototype queue.
  const queueRows = [
    ...pending,
    {
      ref: "000CHAT262300004",
      fnId: "1006",
      account: "000445566778",
      amount: 3200,
      ccy: ENV.ccy,
      maker: "OPS_USER3",
      reason: "Auto — random check",
    },
  ];

  const [picked, setPicked] = useState<string | null>(null);
  // The selected row is always identified by its own reference.
  const selectedRef =
    picked && queueRows.some((r) => r.ref === picked) ? picked : pending[0]?.ref;

  const authorize = () => {
    if (selectedRef) {
      dispatch({ type: "AUTHORIZE_TX", ref: selectedRef });
    }
  };

  const view = () => {
    if (selectedRef) {
      dispatch({ type: "OPEN_AUTHORIZE", ref: selectedRef });
    }
  };

  const reject = () => {
    if (selectedRef) {
      dispatch({ type: "REJECT_TX", ref: selectedRef });
    }
  };

  const openLov = (field: string, title: string) =>
    dispatch({ type: "OPEN_LOV", field, title });

  return (
    <FCShell state={state} dispatch={dispatch} current="auth">
      <Win
        title="Pending authorization"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={[
              { label: "Fetch", primary: true },
              { label: "Authorize", onClick: authorize },
              { label: "Reject", onClick: reject },
              { label: "View", onClick: view },
              { label: "Exit" },
            ]}
          />
        }
      >
        <Section title="Selection criteria">
          <div className="grid3">
            <Field label="Branch" value={ENV.branch} readOnly />
            <Field
              label="Function id"
              value={state.tx.functionId ?? "1401"}
              lov
              onLov={() => openLov("functionId", "Select function id")}
            />
            <Field
              label="Maker"
              value={state.tx.maker ?? "ALL"}
              lov
              onLov={() => openLov("maker", "Select maker")}
            />
          </div>
        </Section>

        <Section title="Records pending authorization">
          <table className="g">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Fn id</th>
                <th>Reference</th>
                <th>Account</th>
                <th style={{ width: 110 }}>Amount</th>
                <th style={{ width: 50 }}>Ccy</th>
                <th>Maker</th>
                <th>Override / reason</th>
              </tr>
            </thead>
            <tbody>
              {queueRows.map((row) => (
                <tr
                  key={row.ref}
                  className={row.ref === selectedRef ? "sel" : undefined}
                  onClick={() => setPicked(row.ref)}
                >
                  <td>{row.fnId}</td>
                  <td>{row.ref}</td>
                  <td>{row.account}</td>
                  <td className="num">{fmt(row.amount as number)}</td>
                  <td>{row.ccy}</td>
                  <td>{row.maker}</td>
                  <td>{"reason" in row ? row.reason : "Limit breach — teller txn limit"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
