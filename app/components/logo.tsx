import React from "react";
import { Check } from "./icons";

export function Logo({ size = 20 }: { size?: number }) {
  const box = Math.round(size * 1.4);
  const radius = Math.round(size * 0.32);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "Manrope, system-ui, sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "var(--ink)",
        fontSize: size,
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: box,
          height: box,
          borderRadius: radius,
          background: "var(--ink)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={Math.round(size * 0.68)} stroke={2.5} style={{ color: "var(--paper)" }} />
      </span>
      GoCheck
    </div>
  );
}

export function StepCrumbs({ step = 1 }: { step?: number }) {
  const steps = ["Upload", "Audit", "Review"];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 14px",
        background: "var(--container-low)",
        border: "1px solid var(--hairline)",
        borderRadius: 999,
      }}
    >
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <React.Fragment key={s}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: active ? "var(--ink)" : "var(--ink-mute)",
                letterSpacing: "-0.005em",
              }}
            >
              <span
                style={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 10,
                  color: active || done ? "var(--accent-ink)" : "var(--ink-mute)",
                }}
              >
                {done ? "✓" : `0${n}`}
              </span>
              {s}
            </span>
            {i < steps.length - 1 && (
              <span style={{ color: "var(--ink-mute)", fontSize: 10 }}>·</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
