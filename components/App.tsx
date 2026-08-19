"use client";

import { useEffect, useReducer } from "react";
import { initialState, reducer } from "@/lib/state";
import { Screen } from "@/components/screens";

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        dispatch({ type: "PREV" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        dispatch({ type: "NEXT" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return <Screen state={state} dispatch={dispatch} />;
}
