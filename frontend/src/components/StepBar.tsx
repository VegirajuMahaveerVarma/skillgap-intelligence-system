/**
 * StepBar.tsx — Horizontal step progress indicator.
 * current: 0=Profile, 1=Skills, 2=Analysis, 3=Dashboard
 */
import React from "react";

const STEPS = ["Profile", "Skills", "Analysis", "Dashboard"];

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <div className="steps">
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <div className={`step ${i < current ? "done" : i === current ? "active" : ""}`}>
          <div className="step-circle">
            {i < current ? "✓" : i + 1}
          </div>
          {label}
        </div>
        {i < STEPS.length - 1 && <div className="step-line" />}
      </React.Fragment>
    ))}
  </div>
);

export default StepBar;
