"use client";

import { useEffect } from "react";
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

  const selectedRef = pending[0]?.ref;

  const authorize = () => {
    dispatch({ type: "GO", step: 15 });
  };

  const reject = () => {
    if (selectedRef) {
      dispatch({ type: "REJECT_TX", ref: selectedRef });
    }
  };

  return (
    <FCShell user={state.currentUser} till={ENV.till} current="auth">
      <Win
        title="Pending authorization"
        actions={
          <ActionBar
            buttons={[
              { label: "Fetch", primary: true },
              { label: "Authorize", onClick: authorize },
              { label: "Reject", onClick: reject },
              { label: "View", onClick: authorize },
              { label: "Exit" },
            ]}
          />
        }
      >
        <Section title="Selection criteria">
          <div className="grid3">
            <Field label="Branch" value={ENV.branch} readOnly />
            <Field label="Function id" value="1401" lov />
            <Field label="Maker" value="ALL" lov />
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
              {queueRows.map((row, idx) => (
                <tr key={row.ref} className={idx === 0 ? "sel" : undefined}>
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
