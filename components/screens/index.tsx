"use client";

import { SessionState, Action } from "@/lib/state";
import { Login } from "./Login";
import { Home } from "./Home";
import { DepositBlocked } from "./DepositBlocked";
import { VaultIn } from "./VaultIn";
import { Deposit } from "./Deposit";
import { AuthQueue } from "./AuthQueue";
import { Withdrawal } from "./Withdrawal";
import { Reversal } from "./Reversal";
import { Till } from "./Till";
import { VaultOut } from "./VaultOut";
import { Eod } from "./Eod";

export { Login, Home, DepositBlocked, VaultIn, Deposit, AuthQueue, Withdrawal, Reversal, Till, VaultOut, Eod };

export function Screen({
  state,
  dispatch,
}: {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
}) {
  switch (state.currentStep) {
    case 0:
      return <Login state={state} dispatch={dispatch} />;
    case 1:
      return <Home state={state} dispatch={dispatch} />;
    case 2:
      return <DepositBlocked state={state} dispatch={dispatch} />;
    case 3:
    case 4:
    case 5:
      return <VaultIn state={state} dispatch={dispatch} />;
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
      return <Deposit state={state} dispatch={dispatch} />;
    case 14:
      return <AuthQueue state={state} dispatch={dispatch} />;
    case 15:
    case 16:
      return <Deposit state={state} dispatch={dispatch} />;
    case 17:
    case 18:
    case 19:
    case 20:
    case 21:
    case 22:
      return <Withdrawal state={state} dispatch={dispatch} />;
    case 23:
      return <Reversal state={state} dispatch={dispatch} />;
    case 24:
    case 25:
    case 27:
      return <Till state={state} dispatch={dispatch} />;
    case 26:
      return <VaultOut state={state} dispatch={dispatch} />;
    case 28:
    case 29:
      return <Eod state={state} dispatch={dispatch} />;
    default:
      return <Home state={state} dispatch={dispatch} />;
  }
}
