"use client";

import { useEffect, useRef, useState } from "react";
import {
  ENV,
  TREE_ITEMS,
  MENU,
  FAST_PATH_CODES,
  LOV_DATA,
  TREE_KEY_TO_FN,
} from "@/lib/config";
import { DialogSpec, MessageSpec, Denom, fmt, SessionState, Action } from "@/lib/state";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sec">
      <div className="hd">{title}</div>
      <div className="bd">{children}</div>
    </div>
  );
}

export function Field({
  label,
  value,
  readOnly,
  number,
  lov,
  required,
  focus,
  onChange,
  onBlur,
  onLov,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  number?: boolean;
  lov?: boolean;
  required?: boolean;
  focus?: boolean;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  onLov?: () => void;
}) {
  const cls = "val" + (readOnly ? " ro" : "") + (number ? " num" : "") + (focus ? " focus" : "");
  const lovBtn = lov ? (
    <span
      className="lov"
      onClick={onLov}
      style={{ cursor: onLov ? "pointer" : "default" }}
    >
      &#9660;
    </span>
  ) : null;
  return (
    <div className="f">
      <label>
        {label}
        {required ? <span className="req">*</span> : null}
      </label>
      {readOnly || !onChange ? (
        <div className={cls}>
          {value}
          {lovBtn}
        </div>
      ) : (
        <div className={cls}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontFamily: "inherit", fontSize: "inherit" }}
          />
          {lovBtn}
        </div>
      )}
    </div>
  );
}

export function Checkbox({ label, on }: { label: string; on?: boolean }) {
  return (
    <span className="chk">
      <i className={on ? "on" : ""}></i>
      {label}
    </span>
  );
}

export function Tabs({ tabs, active, onSelect }: { tabs: string[]; active: string; onSelect?: (t: string) => void }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <div key={t} className={"t" + (t === active ? " on" : "")} onClick={() => onSelect?.(t)}>
          {t}
        </div>
      ))}
    </div>
  );
}

export function Audit({
  maker,
  mkTime,
  checker,
  ckTime,
  authorized,
  recStat,
  mod,
}: {
  maker?: string;
  mkTime?: string;
  checker?: string;
  ckTime?: string;
  authorized?: boolean;
  recStat?: string;
  mod?: string;
}) {
  return (
    <div className="audit">
      <span><b>Input by</b> {maker || ENV.teller}</span>
      <span><b>Date time</b> {mkTime || ENV.date + " 09:02:11"}</span>
      <span><b>Authorized by</b> {checker || "—"}</span>
      <span><b>Date time</b> {ckTime || "—"}</span>
      <span><b>Mod no</b> {mod || "1"}</span>
      <span className={"stat " + (authorized ? "auth" : "unauth")}>{authorized ? "Authorized" : "Unauthorized"}</span>
      <span className="stat open">{recStat || "Complete"}</span>
    </div>
  );
}

export function MsgBar({ kind, text }: MessageSpec) {
  return <div className={"msgbar " + kind}>{text}</div>;
}

export function ActionBar({ buttons }: { buttons: { label: string; primary?: boolean; dim?: boolean; onClick?: () => void }[] }) {
  return (
    <div className="win-actions">
      {buttons.map((b) => (
        <button key={b.label} className={"btn" + (b.primary ? " pri" : "") + (b.dim ? " dim" : "")} onClick={b.onClick}>
          {b.label}
        </button>
      ))}
    </div>
  );
}

export function Dialog({ spec, onButton }: { spec: DialogSpec; onButton: (action?: string) => void }) {
  const icon = spec.kind === "err" ? "✕" : spec.kind === "warn" ? "!" : "i";
  return (
    <div className="dlg">
      <div className="t">
        <span>{spec.title}</span>
        <span className="x" onClick={() => onButton()}>
          &#10005;
        </span>
      </div>
      <div className="b">
        <div className={"ic " + spec.kind}>{icon}</div>
        <div>
          <div className="code">{spec.code}</div>
          <div style={{ marginTop: 5, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: spec.text }} />
        </div>
      </div>
      <div className="f2">
        {spec.buttons.map((b) => (
          <button key={b.label} className={"btn" + (b.primary ? " pri" : "")} onClick={() => onButton(b.action)}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DenomTable({
  rows,
  totalLabel,
  onChange,
}: {
  rows: Denom[];
  totalLabel: { l: string; v: string };
  onChange?: (code: string, units: string) => void;
}) {
  const total = rows.reduce((sum, r) => sum + r.value * r.units, 0);
  return (
    <table className="g">
      <thead>
        <tr>
          <th>Denomination code</th>
          <th style={{ width: 90 }}>Value</th>
          <th style={{ width: 90 }}>Units</th>
          <th style={{ width: 120 }}>Total amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.code}>
            <td>{r.code}</td>
            <td className="num">{fmt(r.value)}</td>
            <td className="num inp">
              {onChange ? (
                <input
                  type="text"
                  value={r.units || ""}
                  onChange={(e) => onChange(r.code, e.target.value)}
                  style={{ width: "100%", border: "none", background: "transparent", textAlign: "right", fontFamily: "inherit", fontSize: "inherit" }}
                />
              ) : (
                r.units || ""
              )}
            </td>
            <td className="num ro">{fmt(r.value * r.units)}</td>
          </tr>
        ))}
        <tr className="tot">
          <td colSpan={3}>{totalLabel.l}</td>
          <td className="num">{fmt(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function LovDialog({ state, dispatch }: { state: SessionState; dispatch: React.Dispatch<Action> }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lov = state.lov;

  useEffect(() => {
    inputRef.current?.focus();
  }, [lov?.field]);

  if (!lov) return null;

  const options = LOV_DATA[lov.field] ?? [];
  const q = query.toLowerCase();
  const filtered = options.filter(
    (o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)
  );

  const select = (value: string) => {
    if (lov.field === "account") {
      const customer = state.customers[value];
      dispatch({
        type: "APPLY",
        partial: {
          tx: {
            ...state.tx,
            account: value,
            customer,
            fetched: !!customer,
            ccy: customer?.ccy || ENV.ccy,
            rate: "1.0000",
          },
        },
      });
    } else {
      const txKey = lov.field === "currency" ? "ccy" : lov.field;
      dispatch({
        type: "APPLY",
        partial: {
          tx: { ...state.tx, [txKey]: value },
        },
      });
    }
    dispatch({ type: "CLOSE_LOV" });
  };

  return (
    <div className="lov-dlg">
      <div className="t">
        <span>{lov.title || `Select ${lov.field}`}</span>
        <span className="x" onClick={() => dispatch({ type: "CLOSE_LOV" })}>
          &#10005;
        </span>
      </div>
      <div className="b">
        <input
          ref={inputRef}
          className="val"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search..."
        />
        <ul className="lov-list">
          {filtered.map((o) => (
            <li key={o.value} onClick={() => select(o.value)}>
              {o.label}
            </li>
          ))}
          {filtered.length === 0 && <li className="empty">No matches found.</li>}
        </ul>
      </div>
      <div className="f2">
        <button className="btn" onClick={() => dispatch({ type: "CLOSE_LOV" })}>
          Close
        </button>
      </div>
    </div>
  );
}

export function FCTree({ current, dispatch }: { current?: string; dispatch: React.Dispatch<Action> }) {
  const [input, setInput] = useState(() =>
    current && TREE_KEY_TO_FN[current] ? TREE_KEY_TO_FN[current] : ""
  );
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const matches = open
    ? FAST_PATH_CODES.filter(
        (c) =>
          c.code.startsWith(input || "") ||
          c.label.toLowerCase().includes((input || "").toLowerCase())
      )
    : [];

  const launchCode = (code: string) => {
    setInput(code);
    setOpen(false);
    dispatch({ type: "LAUNCH_FUNCTION", fnId: code });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const match = matches[highlight] || matches[0];
      if (match) launchCode(match.code);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleTreeClick = (item: { t?: string; k?: string }) => {
    if (item.k && TREE_KEY_TO_FN[item.k]) {
      dispatch({ type: "LAUNCH_FUNCTION", fnId: TREE_KEY_TO_FN[item.k] });
    } else if (item.t) {
      dispatch({ type: "PLACEHOLDER", message: `${item.t} is not available in this prototype.` });
    }
  };

  return (
    <div className="fc-tree">
      <div className="fc-fastpath">
        <label>Fast path</label>
        <div className="val focus" onClick={() => setOpen(true)}>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontFamily: "inherit", fontSize: "inherit" }}
          />
          {open && matches.length > 0 && (
            <ul className="autocomplete">
              {matches.map((m, i) => (
                <li
                  key={m.code}
                  className={i === highlight ? "hi" : undefined}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    launchCode(m.code);
                  }}
                >
                  <b>{m.code}</b> — {m.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ul>
        {TREE_ITEMS.map((item, idx) =>
          "g" in item ? (
            <li key={idx} className="grp">
              {item.g}
            </li>
          ) : (
            <li
              key={idx}
              className={"sub" + (item.k === current ? " cur" : "")}
              onClick={() => handleTreeClick(item)}
            >
              {item.t}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function MenuBar({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="fc-menubar" ref={ref}>
      {MENU.map((m, i) => (
        <div
          key={m.label}
          className={"menu" + (open === i ? " open" : "")}
          style={i === MENU.length - 1 ? { marginLeft: "auto" } : undefined}
        >
          <span className="mi" onClick={() => setOpen(open === i ? null : i)}>
            {m.label}
          </span>
          {open === i && (
            <div className="dropdown">
              {m.items.map((item) => (
                <div
                  key={item.label}
                  className="di"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(null);
                    if (item.fnId) dispatch({ type: "LAUNCH_FUNCTION", fnId: item.fnId });
                    else if (item.placeholder) dispatch({ type: "PLACEHOLDER", message: item.placeholder });
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function FCShell({
  state,
  dispatch,
  current,
  dialog,
  children,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  current?: string;
  dialog?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fc">
      <div className="fc-titlebar">
        <span className="brand">
          ORACLE<span> FLEXCUBE Universal Banking</span>
        </span>
        <span className="env">
          Branch {ENV.branch} &nbsp;|&nbsp; {ENV.date} &nbsp;|&nbsp; User {state.currentUser} &nbsp;|&nbsp; Till {ENV.till}
        </span>
      </div>
      <MenuBar dispatch={dispatch} />
      <div className="fc-body">
        <FCTree key={current} current={current} dispatch={dispatch} />
        <div className={"fc-work" + (dialog || state.lov ? " hasdlg" : "")}>
          {children}
          {dialog}
          {state.lov && <LovDialog state={state} dispatch={dispatch} />}
        </div>
      </div>
    </div>
  );
}

export function Win({
  fid,
  title,
  actions,
  children,
  dispatch,
}: {
  fid?: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="win">
      <div className="win-title">
        <span>{title}</span>
        {fid ? <span className="fid">[{fid}]</span> : null}
        <span className="btns">
          <i onClick={() => dispatch({ type: "PLACEHOLDER", message: "Window minimized (placeholder)." })} title="Minimize">_</i>
          <i onClick={() => dispatch({ type: "PLACEHOLDER", message: "Window maximized (placeholder)." })} title="Maximize">&#9633;</i>
          <i onClick={() => dispatch({ type: "PLACEHOLDER", message: "Window closed (placeholder)." })} title="Close">&#10005;</i>
        </span>
      </div>
      {actions}
      <div style={{ padding: 8 }}>{children}</div>
    </div>
  );
}

export function CustomerFlags({ flags }: { flags: { noDebit?: boolean; noCredit?: boolean; dormant?: boolean; frozen?: boolean } }) {
  return (
    <div style={{ marginTop: 6, display: "flex", gap: 18 }}>
      <Checkbox label="No debit" on={flags.noDebit} />
      <Checkbox label="No credit" on={flags.noCredit} />
      <Checkbox label="Dormant" on={flags.dormant} />
      <Checkbox label="Frozen" on={flags.frozen} />
    </div>
  );
}

export function WithdrawalFlags({ flags }: { flags: { noDebit?: boolean; dormant?: boolean; lien?: boolean; od?: boolean } }) {
  return (
    <div style={{ marginTop: 6, display: "flex", gap: 18 }}>
      <Checkbox label="No debit" on={flags.noDebit} />
      <Checkbox label="Dormant" on={flags.dormant} />
      <Checkbox label="Lien marked" on={flags.lien} />
      <Checkbox label="OD allowed" on={flags.od} />
    </div>
  );
}
