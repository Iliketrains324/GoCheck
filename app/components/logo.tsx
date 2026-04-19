import React from "react";

export function Logo({ size = 20 }: { size?: number }) {
  const box = Math.round(size * 1.15);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        fontFamily: "Manrope, system-ui, sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.025em",
        color: "var(--ink)",
        fontSize: size,
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: box,
          height: box,
          borderRadius: Math.round(box * 0.28),
          background: "transparent",
          color: "var(--accent)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={Math.round(box * 0.95)}
          height={Math.round(box * 0.95)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="gc-draw"
        >
          <path d="M4 13.2 9.2 18.4 20 6.6" />
        </svg>
      </span>
      Go<span style={{ color: "var(--accent-ink)" }}>Check</span>
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
