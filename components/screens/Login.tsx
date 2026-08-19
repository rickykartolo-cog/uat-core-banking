"use client";

import { ENV } from "@/lib/config";
import { Action, SessionState } from "@/lib/state";
import { FCShell, Field, ActionBar } from "@/components/ui";

export function Login({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <FCShell state={state} dispatch={dispatch}>
      <div style={{ padding: "30px 0", display: "flex", justifyContent: "center" }}>
        <div className="win" style={{ width: 340 }}>
          <div className="win-title">
            <span>Sign on</span>
            <span className="btns">
              <i onClick={() => dispatch({ type: "PLACEHOLDER", message: "Window closed (placeholder)." })}>&#10005;</i>
            </span>
          </div>
          <div style={{ padding: "14px 16px", background: "#eff3f8" }}>
            <Field label="User identification" value="OPS_USER1" required focus />
            <div style={{ height: 5 }} />
            <Field label="Password" value="•••••••••" required />
            <div style={{ height: 5 }} />
            <Field label="Branch code" value={ENV.branch} readOnly />
            <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <ActionBar
                buttons={[
                  {
                    label: "Sign on",
                    primary: true,
                    onClick: () => {
                      dispatch({ type: "LOGIN", user: "OPS_USER1" });
                      dispatch({ type: "GO", step: 1 });
                    },
                  },
                  { label: "Clear" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </FCShell>
  );
}
