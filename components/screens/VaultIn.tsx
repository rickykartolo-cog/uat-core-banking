"use client";

import { ENV } from "@/lib/config";
import {
  SessionState,
  Action,
  DEFAULT_DENOMS,
  fmt,
  parseAmount,
  makeRef,
} from "@/lib/state";
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

function denomTotal(denoms: { value: number; units: number }[]): number {
  return denoms.reduce((sum, d) => sum + d.value * d.units, 0);
}

export function VaultIn({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  const tx = state.tx;
  const amountStr = tx.amount ?? "150000.00";
  const amount = parseAmount(amountStr);
  const denoms = tx.denominations ?? DEFAULT_DENOMS["9007"];
  const total = denomTotal(denoms);
  const ref = tx.ref || makeRef("CHVT", state.nextSerial);
  const isAuthorized = state.tillOpen && state.tillBalance === amount;

  const setAmount = (v: string) => dispatch({ type: "SET_AMOUNT", amount: v });
  const setDenom = (code: string, units: string) =>
    dispatch({ type: "SET_DENOM", code, units });

  const save = () => {
    if (total !== amount) {
      dispatch({
        type: "APPLY",
        partial: {
          dialog: {
            kind: "err",
            title: "Error",
            code: "ST-DENM-001",
            text: `Denomination total ${ENV.ccy} ${fmt(total)} does not match transaction amount ${ENV.ccy} ${fmt(amount)}.`,
            buttons: [{ label: "Ok", primary: true }],
          },
        },
      });
      return;
    }

    if (amount > ENV.retention) {
      dispatch({
        type: "APPLY",
        partial: {
          dialog: {
            kind: "warn",
            title: "Override",
            code: "ST-CASH-118",
            text: `Requested amount exceeds till retention limit of ${ENV.ccy} ${fmt(ENV.retention)}. Transaction requires supervisor authorization. Continue?`,
            buttons: [
              { label: "Ok", primary: true, action: "CONFIRM_VAULT_OVERRIDE" },
              { label: "Cancel" },
            ],
          },
        },
      });
      return;
    }

    openTill(false);
  };

  // `viaOverride` records who actually authorized: within the retention limit the
  // transaction is auto-authorized, matching the "Auto" checker used elsewhere.
  const openTill = (viaOverride: boolean) => {
    const tillDenoms: Record<string, number> = {};
    for (const d of denoms) {
      tillDenoms[d.code] = (tillDenoms[d.code] ?? 0) + d.units;
    }

    dispatch({
      type: "APPLY",
      partial: {
        dialog: null,
        tillOpen: true,
        tillBalance: amount,
        tillDenoms,
        vaultBalance: state.vaultBalance - amount,
        // Stay on the authorized 9007 record so the checker and till-opened message remain visible.
        currentStep: 5,
        viewFnId: "9007",
        tx: {
          ...state.tx,
          ref,
          amount: amountStr,
          denominations: structuredClone(denoms),
          checker: viaOverride ? ENV.supervisor : "Auto",
        },
        message: {
          kind: "ok",
          text: `Transaction ${ref} authorized. Till ${ENV.till} opened with ${ENV.ccy} ${fmt(amount)}.`,
        },
      },
    });
  };

  const handleDialog = (action?: string) => {
    if (action === "CONFIRM_VAULT_OVERRIDE") {
      openTill(true);
    } else {
      dispatch({ type: "CLOSE_DIALOG" });
    }
  };

  const openLov = (field: string, title: string) =>
    dispatch({ type: "OPEN_LOV", field, title });

  return (
    <FCShell
      state={state}
      dispatch={dispatch}
      current="vin"
      dialog={state.dialog ? <Dialog spec={state.dialog} onButton={handleDialog} /> : undefined}
    >
      <Win
        fid="9007"
        title="Buy cash from vault"
        dispatch={dispatch}
        actions={
          <ActionBar
            buttons={[
              { label: "New", primary: true },
              { label: "Enter query" },
              { label: "Save", dim: isAuthorized, onClick: isAuthorized ? undefined : save },
              { label: "Hold" },
              { label: "Clear" },
              { label: "Reverse", dim: true },
            ]}
          />
        }
      >
        <Section title="Transaction details">
          <div className="grid2">
            <Field label="Reference number" value={ref} readOnly />
            <Field label="Transaction date" value={ENV.date} readOnly />
            <Field
              label="From vault"
              value={tx.vault ?? ENV.vault}
              required
              lov
              onLov={() => openLov("vault", "Select vault")}
            />
            <Field label="To till" value={ENV.till} readOnly />
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
              focus={state.currentStep === 3}
              onChange={isAuthorized ? undefined : setAmount}
            />
          </div>
        </Section>

        <div style={{ marginTop: 8 }}>
          <Tabs tabs={["Denomination", "Charge", "MIS", "UDF"]} active="Denomination" />
          <div className="tabwrap">
            <DenomTable
              rows={denoms}
              totalLabel={{ l: "Total", v: fmt(total) }}
              onChange={isAuthorized ? undefined : setDenom}
            />
          </div>
        </div>

        <Audit
          maker={ENV.teller}
          mkTime={`${ENV.date} 08:52:04`}
          checker={tx.checker}
          ckTime={isAuthorized ? `${ENV.date} 08:55:31` : undefined}
          authorized={isAuthorized}
          recStat="Complete"
        />

        {state.message && <MsgBar kind={state.message.kind} text={state.message.text} />}
      </Win>
    </FCShell>
  );
}
