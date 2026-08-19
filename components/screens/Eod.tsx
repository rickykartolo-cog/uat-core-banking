"use client";

import { useEffect } from "react";
import { ENV } from "@/lib/config";
import { SessionState, Action } from "@/lib/state";
import { FCShell, Win, Section, Field, ActionBar, MsgBar } from "@/components/ui";

export function Eod({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  // Branch manager context for EOD phase.
  useEffect(() => {
    if (state.currentUser !== "BRMGR_01") {
      dispatch({ type: "APPLY", partial: { currentUser: "BRMGR_01" } });
    }
  }, [dispatch, state.currentUser]);

  // Advance to the completed EOTI step once Mark EOTI succeeds.
  useEffect(() => {
    if (state.currentStep === 28 && state.eotiMarked) {
      dispatch({ type: "NEXT" });
    }
  }, [dispatch, state.currentStep, state.eotiMarked]);

  const tillsOpen = state.tillOpen ? 1 : 0;
  const unauth = state.transactions.filter((t) => t.status === "unauthorized").length;
  const canEoti = tillsOpen === 0 && unauth === 0;
  const stage = state.eotiMarked ? "EOTI — End of transaction input" : "TI — Transaction input";

  return (
    <FCShell state={state} dispatch={dispatch} current="eod">
      <Win
        title="Branch batch — end of transaction input"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={[
              { label: "Refresh", primary: true },
              { label: "Mark EOTI", dim: !canEoti, onClick: () => dispatch({ type: "MARK_EOTI" }) },
              { label: "Release", dim: true },
              { label: "Exit" },
            ]}
          />
        }
      >
        <Section title="Branch batch status">
          <div className="grid3">
            <Field label="Branch" value={ENV.branch} readOnly />
            <Field label="Branch date" value={ENV.date} readOnly />
            <Field label="Current stage" value={stage} readOnly />
            <Field label="Next stage" value="EOTI — End of transaction input" readOnly />
            <Field label="Tills open" value={String(tillsOpen)} readOnly />
            <Field label="Unauthorized records" value={String(unauth)} readOnly />
          </div>
        </Section>

        <Section title="Pre-EOTI checks">
          <table className="g">
            <thead>
              <tr>
                <th style={{ width: 34 }}></th>
                <th>Check</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>&#10003;</td>
                <td>All tills balanced and closed</td>
                <td>
                  {tillsOpen > 0
                    ? `Failed — ${tillsOpen} till(s) open`
                    : "Passed"}
                </td>
              </tr>
              <tr>
                <td>&#10003;</td>
                <td>No unauthorized transactions in branch</td>
                <td>
                  {unauth > 0 ? `Failed — ${unauth} record(s)` : "Passed"}
                </td>
              </tr>
              <tr>
                <td>&#10003;</td>
                <td>Cash position tallies with vault</td>
                <td>Passed</td>
              </tr>
              <tr>
                <td>&#10003;</td>
                <td>Clearing batches marked complete</td>
                <td>Passed</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
