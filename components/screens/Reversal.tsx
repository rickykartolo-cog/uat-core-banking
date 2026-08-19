"use client";

import { ENV } from "@/lib/config";
import { SessionState, Action, escapeHtml, fmt, isReversible, txDate } from "@/lib/state";
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
  const sameDayTransactions = state.transactions.filter((record) => txDate(record) === ENV.date);
  const eligibleTransactions = sameDayTransactions.filter(
    (record) => isReversible(record, state.customers)
  );
  const ref = tx.ref ?? eligibleTransactions[eligibleTransactions.length - 1]?.ref ?? "";
  const normalizedRef = ref.trim();
  const reason = tx.reversalReason ?? "WRONG DENOMINATION PAID OUT";

  const targetTx = state.transactions.find((t) => t.ref === normalizedRef);

  const setRef = (value: string) =>
    dispatch({ type: "APPLY", partial: { tx: { ...tx, ref: value } } });

  const fetch = () => {
    const fetchedRef = normalizedRef;
    if (!fetchedRef) {
      dispatch({
        type: "APPLY",
        partial: {
          dialog: {
            kind: "err",
            title: "Error",
            code: "ST-REVR-001",
            text: "Transaction reference is required.",
            buttons: [{ label: "Ok", primary: true }],
          },
          message: null,
        },
      });
      return;
    }
    const fetchedTx = state.transactions.find((record) => record.ref === fetchedRef);
    if (!fetchedTx) {
      dispatch({
        type: "APPLY",
        partial: {
          dialog: {
            kind: "err",
            title: "Error",
            code: "ST-REVR-001",
            text: `Transaction ${escapeHtml(fetchedRef)} not found.`,
            buttons: [{ label: "Ok", primary: true }],
          },
          message: null,
        },
      });
      return;
    }
    dispatch({
      type: "APPLY",
      partial: { tx: { ...tx, ref: fetchedRef }, dialog: null, message: null },
    });
  };

  const showRefusal = () => {
    dispatch({ type: "REVERSE_TX", ref: normalizedRef });
  };

  const requestReverse = () => {
    if (!isReversible(targetTx, state.customers)) {
      showRefusal();
      return;
    }
    dispatch({
      type: "APPLY",
      partial: {
        dialog: {
          kind: "warn",
          title: "Confirm reversal",
          code: "ST-REVR-004",
          text: `Reversal of ${escapeHtml(normalizedRef)} will post contra entries for ${ENV.ccy} ${fmt(
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
      dispatch({ type: "REVERSE_TX", ref: normalizedRef });
      return;
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
              { label: "Fetch", primary: true, onClick: fetch },
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
              onChange={setRef}
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
              {sameDayTransactions.map((record) => (
                <tr
                  key={record.ref}
                  className={record.ref === ref ? "sel" : undefined}
                  onClick={() => setRef(record.ref)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{record.fnId}</td>
                  <td>{record.product}</td>
                  <td>{record.account}</td>
                  <td className="num">{fmt(record.amount)}</td>
                  <td>{record.maker}</td>
                  <td>{record.checker}</td>
                  <td>{record.status === "reversed" ? "Reversed" : record.authorized ? "Authorized" : "Unauthorized"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 7 }}>
            <Field
              label="Reversal reason"
              value={reason}
              required
              onChange={(value) =>
                dispatch({ type: "APPLY", partial: { tx: { ...tx, reversalReason: value } } })
              }
            />
          </div>
        </Section>

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
