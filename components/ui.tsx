"use client";

import { ENV, TREE_ITEMS } from "@/lib/config";
import { DialogSpec, MessageSpec, Denom, fmt } from "@/lib/state";

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
}) {
  const cls = "val" + (readOnly ? " ro" : "") + (number ? " num" : "") + (focus ? " focus" : "");
  return (
    <div className="f">
      <label>
        {label}
        {required ? <span className="req">*</span> : null}
      </label>
      {readOnly || !onChange ? (
        <div className={cls}>{value}{lov ? <span className="lov">&#9660;</span> : null}</div>
      ) : (
        <div className={cls}>
          <input
            type={number ? "text" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontFamily: "inherit", fontSize: "inherit" }}
          />
          {lov ? <span className="lov">&#9660;</span> : null}
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

export function FCTree({ current }: { current?: string }) {
  const fastPath = current === "dep" ? "1401" : current === "wdl" ? "1001" : current === "vin" ? "9007" : current === "vout" ? "9008" : "";
  return (
    <div className="fc-tree">
      <div className="fc-fastpath">
        <label>Fast path</label>
        <div className="val focus">{fastPath}</div>
      </div>
      <ul>
        {TREE_ITEMS.map((item, idx) =>
          "g" in item ? (
            <li key={idx} className="grp">
              {item.g}
            </li>
          ) : (
            <li key={idx} className={"sub" + (item.k === current ? " cur" : "")}>
              {item.t}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export function FCShell({
  user,
  till,
  current,
  dialog,
  children,
}: {
  user: string;
  till: string;
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
          Branch {ENV.branch} &nbsp;|&nbsp; {ENV.date} &nbsp;|&nbsp; User {user} &nbsp;|&nbsp; Till {till}
        </span>
      </div>
      <div className="fc-menubar">
        <span>Interactions</span>
        <span>Customer</span>
        <span>Workflow</span>
        <span>Batch</span>
        <span>Preferences</span>
        <span style={{ marginLeft: "auto" }}>Sign off</span>
      </div>
      <div className="fc-body">
        <FCTree current={current} />
        <div className={"fc-work" + (dialog ? " hasdlg" : "")}>
          {children}
          {dialog}
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
}: {
  fid?: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="win">
      <div className="win-title">
        <span>{title}</span>
        {fid ? <span className="fid">[{fid}]</span> : null}
        <span className="btns">
          <i>_</i>
          <i>&#9633;</i>
          <i>&#10005;</i>
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
