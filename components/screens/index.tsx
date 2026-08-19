"use client";

import { SessionState, Action } from "@/lib/state";
import { Login } from "./Login";
import { Home } from "./Home";
import { VaultIn } from "./VaultIn";
import { Deposit } from "./Deposit";
import { AuthQueue } from "./AuthQueue";
import { Withdrawal } from "./Withdrawal";
import { Reversal } from "./Reversal";
import { Till } from "./Till";
import { VaultOut } from "./VaultOut";
import { Eod } from "./Eod";

export { Login, Home, VaultIn, Deposit, AuthQueue, Withdrawal, Reversal, Till, VaultOut, Eod };

export function Screen({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  switch (state.viewFnId) {
    case "Sign on":
      return <Login state={state} dispatch={dispatch} />;
    case "Teller dashboard":
      return <Home state={state} dispatch={dispatch} />;
    case "1401":
      return <Deposit state={state} dispatch={dispatch} />;
    case "1001":
      return <Withdrawal state={state} dispatch={dispatch} />;
    case "9007":
      return <VaultIn state={state} dispatch={dispatch} />;
    case "9008":
      return <VaultOut state={state} dispatch={dispatch} />;
    case "Pending authorization":
      return <AuthQueue state={state} dispatch={dispatch} />;
    case "Reversal":
      return <Reversal state={state} dispatch={dispatch} />;
    case "Till position":
      return <Till state={state} dispatch={dispatch} />;
    case "Branch batch":
      return <Eod state={state} dispatch={dispatch} />;
    default:
      return <Login state={state} dispatch={dispatch} />;
  }
}
