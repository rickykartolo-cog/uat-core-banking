"use client";

import { ENV } from "@/lib/config";
import { SessionState, Action, fmt } from "@/lib/state";
import { FCShell, Win, Section, Field } from "@/components/ui";

export function Home({ state, dispatch }: { state: SessionState; dispatch: React.Dispatch<Action> }) {
  const stage = "TI — Transaction input";
  const pending = state.transactions.filter((t) => t.status === "unauthorized");

  return (
    <FCShell state={state} dispatch={dispatch}>
      <Win title="Teller dashboard" dispatch={dispatch}>
        <Section title="Branch status">
          <div className="grid3">
            <Field label="Branch code" value={ENV.branch} readOnly />
            <Field label="Branch date" value={ENV.date} readOnly />
            <Field label="Batch stage" value={stage} readOnly />
          </div>
        </Section>

        <Section title={`Till status — ${ENV.till}`}>
          <div className="grid3">
            <Field label="Till id" value={ENV.till} readOnly />
            <Field label="Till user" value={ENV.teller} readOnly />
            <Field label="Status" value={state.tillOpen ? "Open" : "Closed"} readOnly />
            <Field label="Till currency" value={ENV.ccy} readOnly />
            <Field label="Cash balance" value={fmt(state.tillBalance)} readOnly number />
            <Field label="Retention limit" value={fmt(ENV.retention)} readOnly number />
          </div>
        </Section>

        <Section title="My pending items">
          <table className="g">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reference</th>
                <th>Account</th>
                <th style={{ width: 120 }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "#666" }}>
                    No records to display.
                  </td>
                </tr>
              ) : (
                pending.map((t) => (
                  <tr key={t.ref}>
                    <td>{t.fnId}</td>
                    <td>{t.ref}</td>
                    <td>{t.account}</td>
                    <td className="num">{fmt(t.amount)}</td>
                    <td>{t.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Section>
      </Win>
    </FCShell>
  );
}
