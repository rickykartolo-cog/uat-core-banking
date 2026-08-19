"use client";

import { ENV } from "@/lib/config";
import {
  SessionState,
  Action,
  fmt,
  DENOM_LADDER,
  countedSignature,
  tillSummary,
} from "@/lib/state";
import { FCShell, Win, Section, Field, ActionBar, MsgBar, Dialog } from "@/components/ui";

export function Till({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  const tillDenoms = state.tillDenoms;
  const summary = tillSummary(state);
  // Counted units are only meaningful for the till position they were keyed against:
  // any till-affecting posting resets the column so no phantom difference appears.
  const counted =
    state.flags.countedSig === countedSignature(tillDenoms)
      ? ((state.flags.counted as Record<string, string>) ?? {})
      : {};

  const rows = DENOM_LADDER.map((d) => {
    const sysUnits = tillDenoms[d.code] ?? 0;
    const sysAmt = sysUnits * d.value;
    const cntUnitsStr = counted[d.code];
    const cntUnits = cntUnitsStr !== undefined ? parseInt(cntUnitsStr || "0", 10) : sysUnits;
    const cntAmt = cntUnits * d.value;
    const diff = cntAmt - sysAmt;
    return { ...d, sysUnits, sysAmt, cntUnits, cntAmt, diff };
  });

  const totalSystem = rows.reduce((sum, r) => sum + r.sysAmt, 0);
  const totalCounted = rows.reduce((sum, r) => sum + r.cntAmt, 0);
  const totalDiff = totalCounted - totalSystem;

  const closeTill = () => {
    if (totalDiff !== 0) {
      dispatch({
        type: "APPLY",
        partial: {
          dialog: {
            kind: "err",
            title: "Error",
            code: "ST-TILL-205",
            text: `Till has a cash difference of ${ENV.ccy} ${fmt(Math.abs(totalDiff))}. Differences must be zero before closing the till.`,
            buttons: [{ label: "Ok", primary: true }],
          },
        },
      });
      return;
    }

    if (state.tillBalance > ENV.retention) {
      dispatch({
        type: "APPLY",
        partial: {
          dialog: {
            kind: "err",
            title: "Error",
            code: "ST-CASH-207",
            text: `Till cash position ${ENV.ccy} ${fmt(
              state.tillBalance
            )} exceeds the retention limit of ${ENV.ccy} ${fmt(
              ENV.retention
            )}. Transfer the excess ${ENV.ccy} ${fmt(
              state.tillBalance - ENV.retention
            )} to the vault using function 9008 before closing the till.`,
            buttons: [{ label: "Ok", primary: true }],
          },
        },
      });
      return;
    }

    dispatch({
      type: "APPLY",
      partial: {
        tillOpen: false,
        message: {
          kind: "ok",
          text: `Till ${ENV.till} closed. Closing cash ${ENV.ccy} ${fmt(
            state.tillBalance
          )}, differences ${ENV.ccy} 0.00. Teller totals report generated.`,
        },
      },
    });
  };

  const updateCounted = (code: string, value: string) => {
    dispatch({ type: "UPDATE_COUNTED", code, units: value });
  };

  const closeDialog = () => dispatch({ type: "CLOSE_DIALOG" });

  return (
    <FCShell
      state={state}
      dispatch={dispatch}
      current="till"
      dialog={state.dialog ? <Dialog spec={state.dialog} onButton={closeDialog} /> : undefined}
    >
      <Win
        title="Till position and balancing"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={[
              { label: "Refresh", primary: true },
              { label: "Confirm count" },
              { label: "Close till", onClick: closeTill },
              { label: "Print teller totals" },
              { label: "Exit" },
            ]}
          />
        }
      >
        <Section title="Till summary">
          <div className="grid3">
            <Field label="Till id" value={ENV.till} readOnly />
            <Field label="Till user" value={ENV.teller} readOnly />
            <Field label="Status" value={state.tillOpen ? "Open" : "Closed"} readOnly />
            <Field label="Opening cash" value={fmt(summary.opening)} readOnly number />
            <Field label="Cash received (deposits)" value={fmt(summary.received)} readOnly number />
            <Field label="Cash paid (withdrawals)" value={fmt(summary.paid)} readOnly number />
            <Field label="Transferred to vault" value={fmt(summary.transferred)} readOnly number />
            <Field label="System cash position" value={fmt(summary.position)} readOnly number />
            <Field label="Retention limit" value={fmt(ENV.retention)} readOnly number />
          </div>
        </Section>

        <Section title="Denomination-wise position — system vs physical count">
          <table className="g">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Denomination</th>
                <th>System units</th>
                <th>System amount</th>
                <th>Counted units</th>
                <th>Counted amount</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <td className="num">{fmt(r.value)}</td>
                  <td className="num ro">{r.sysUnits}</td>
                  <td className="num ro">{fmt(r.sysAmt)}</td>
                  <td className="num inp">
                    <input
                      type="text"
                      value={counted[r.code] ?? r.sysUnits}
                      onChange={(e) => updateCounted(r.code, e.target.value)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        textAlign: "right",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                      }}
                    />
                  </td>
                  <td className="num ro">{fmt(r.cntAmt)}</td>
                  <td className="num ro">{fmt(r.diff)}</td>
                </tr>
              ))}
              <tr className="tot">
                <td>Total</td>
                <td></td>
                <td className="num">{fmt(totalSystem)}</td>
                <td></td>
                <td className="num">{fmt(totalCounted)}</td>
                <td className="num">{fmt(totalDiff)}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
