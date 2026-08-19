"use client";

import { useEffect, useReducer } from "react";
import { STEPS } from "@/lib/config";
import { initialState, reducer } from "@/lib/state";
import { Screen } from "@/components/screens";

function StepRail({
  currentStep,
  onSelect,
}: {
  currentStep: number;
  onSelect: (step: number) => void;
}) {
  const items = STEPS.reduce<{ phase?: string; nodes: React.ReactNode[] }>(
    (acc, s, i) => {
      if (s.ph !== acc.phase) {
        acc.phase = s.ph;
        acc.nodes.push(
          <div key={`ph-${i}`} className="phase">
            {s.ph}
          </div>
        );
      }
      acc.nodes.push(
        <div
          key={i}
          className={"step" + (i === currentStep ? " active" : "")}
          onClick={() => onSelect(i)}
        >
          <span className="n">{i + 1}</span>
          <span>
            {s.t}
            <br />
            <span className="fid">{s.fid}</span>
          </span>
        </div>
      );
      return acc;
    },
    { nodes: [] }
  ).nodes;

  return <div className="rail">{items}</div>;
}

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

  const step = STEPS[state.currentStep];

  return (
    <>
      <div className="proto-bar">
        <h1>FLEXCUBE — fund &amp; transact</h1>
        <span className="sub">teller cash deposit &amp; withdrawal journey</span>
        <span className="pill">{step.ph}</span>
        <span className="spacer" />
        <span className="sub">
          {state.currentStep + 1} / {STEPS.length}
        </span>
        <button
          className="navbtn"
          disabled={state.currentStep === 0}
          onClick={() => dispatch({ type: "PREV" })}
        >
          &larr; Prev
        </button>
        <button
          className="navbtn"
          disabled={state.currentStep === STEPS.length - 1}
          onClick={() => dispatch({ type: "NEXT" })}
        >
          Next &rarr;
        </button>
      </div>

      <div className="layout">
        <StepRail currentStep={state.currentStep} onSelect={(i) => dispatch({ type: "GO", step: i })} />
        <div className="stage">
          <div className="stage-head">
            <h2>
              {state.currentStep + 1}. {step.t}
            </h2>
            <div className="meta">
              <b>Actor</b> {step.actor} &nbsp;&middot;&nbsp; <b>Screen</b> {step.screen}{" "}
              &nbsp;&middot;&nbsp; <b>Function id</b> {step.fid}
            </div>
          </div>
          <Screen state={state} dispatch={dispatch} />
        </div>
      </div>
    </>
  );
}
