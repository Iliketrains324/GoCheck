"use client";

import Link from "next/link";
import { Check, Alert, ArrowRight } from "@/app/components/icons";
import { Logo } from "@/app/components/logo";
import { useRevealObserver, useCountUp } from "@/app/components/animations";

function HeroArtifact() {
  const rows = [
    { doc: "AFORM — Section 5 · Signatories",    status: "ok",   note: "All required signatories present" },
    { doc: "PPR — Budget ledger",                 status: "warn", note: "Food line exceeds 30% cap" },
    { doc: "Letter of Invitation — Venue",        status: "ok",   note: "" },
    { doc: "Venue Reservation — Room GK302",      status: "warn", note: "Date mismatch with AFORM" },
    { doc: "Cross-document coherence",            status: "scan", note: "Checking date consistency…" },
  ] as const;

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--hairline)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(15,46,28,0.02), 0 30px 60px -30px rgba(15,46,28,0.18)",
      }}
    >
      {/* top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid var(--hairline)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 0 3px var(--accent-soft)",
            }}
          />
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>Live audit</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ink-mute)", display: "inline-block" }} />
          <span style={{ color: "var(--ink-mute)" }}>Job #A4F21E</span>
        </div>
        <span style={{ color: "var(--ink-mute)", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11 }}>
          04/20/26 · 14:22
        </span>
      </div>

      {/* rows */}
      <div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr auto",
              gap: 16,
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: i < rows.length - 1 ? "1px solid var(--hairline)" : "none",
            }}
          >
            <span style={{ display: "inline-flex" }}>
              {r.status === "ok" && <Check size={16} stroke={2.2} style={{ color: "var(--accent)" }} />}
              {r.status === "warn" && <Alert size={16} stroke={2} style={{ color: "var(--amber-ink)" }} />}
              {r.status === "scan" && (
                <span
                  style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "1.5px solid var(--ink-mute)",
                    borderTopColor: "transparent",
                    display: "inline-block",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 500, fontSize: 13.5, color: "var(--ink)",
                  letterSpacing: "-0.005em",
                  marginBottom: r.note ? 2 : 0,
                }}
              >
                {r.doc}
              </div>
              {r.note && (
                <div
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 12.5,
                    color: r.status === "warn" ? "var(--amber-ink)" : "var(--ink-mute)",
                  }}
                >
                  {r.note}
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 11, color: "var(--ink-mute)",
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}
            >
              {r.status === "ok" ? "pass" : r.status === "warn" ? "fix" : "scan"}
            </span>
          </div>
        ))}
      </div>

      {/* footer */}
      <div
        style={{
          padding: "14px 20px",
          background: "var(--container-low)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif" }}>
          2 fixes · 2 passes · 1 running
        </span>
        <span
          style={{
            fontFamily: "Manrope, system-ui, sans-serif",
            fontWeight: 700, fontSize: 18, color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          87<span style={{ color: "var(--ink-mute)", fontWeight: 500, fontSize: 14 }}> / 100</span>
        </span>
      </div>
    </div>
  );
}

const CHECKS = [
  {
    name: "Signatory completeness",
    desc: "A-Form needs the Org President, Faculty Moderator, and VP or Dean sign-off depending on activity classification.",
  },
  {
    name: "Date and time integrity",
    desc: "Activity must have exact start and end time. Submission must land at least two weeks before the event date.",
  },
  {
    name: "Budget 30% food cap",
    desc: "Food and meals lines are capped at 30% of total budget. Every expense needs a matching projected income line.",
  },
  {
    name: "Cross-document coherence",
    desc: "Dates, venue, attendees, and titles must match across the Activity Form, Project Proposal Form, invitations, and tickets.",
  },
];

function StatCount({ value, suffix = "" }: { value: string; suffix?: string }) {
  const numeric = parseInt(value.replace(/\D/g, ""), 10);
  const prefix = value.replace(/[\d~]+.*/, "");
  const hasTilde = value.startsWith("~");
  const count = useCountUp(numeric, 1200);
  return (
    <span>
      {hasTilde ? "~" : prefix}
      {count}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  useRevealObserver();
  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      {/* Nav */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "rgba(250,250,248,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div
          style={{
            maxWidth: 1200, margin: "0 auto",
            padding: "18px 36px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {(["Overview"] as const).map((label) => (
                <Link
                  key={label}
                  href="/"
                  style={{
                    background: "transparent",
                    padding: "6px 0",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--ink)",
                    textDecoration: "none",
                    borderBottom: "1.5px solid var(--ink)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/guidelines"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: "var(--ink-mute)",
                  textDecoration: "none",
                  letterSpacing: "-0.005em",
                  borderBottom: "1.5px solid transparent",
                  padding: "6px 0",
                }}
              >
                Guidelines
              </Link>
            </nav>
          </div>
          <Link
            href="/upload"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              border: "none",
              padding: "10px 18px",
              borderRadius: 999,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              letterSpacing: "-0.005em",
            }}
          >
            New audit <ArrowRight size={14} stroke={2.2} />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section style={{ padding: "80px 36px 100px", maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)",
              gap: 72,
              alignItems: "center",
            }}
          >
            <div data-reveal>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "var(--ink-mute)",
                  marginBottom: 20,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                For DLSU student organizations
              </span>
              <h1
                style={{
                  fontFamily: "Manrope, system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(44px, 5.4vw, 72px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.035em",
                  color: "var(--ink)",
                  margin: 0,
                  marginBottom: 22,
                }}
              >
                Catch every pre-act mistake
                <br />
                <span style={{ color: "var(--ink-mute)" }}>before CSO does.</span>
              </h1>
              <p
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: "var(--ink-mute)",
                  maxWidth: 480,
                  margin: "0 0 36px",
                }}
              >
                Upload your Activity Form, Project Proposal Form, invitation letters, and venue tickets.
                GoCheck audits each against current CSO and SLIFE policy and flags exactly what to fix —
                before you submit.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Link
                  href="/upload"
                  style={{
                    background: "var(--ink)",
                    color: "var(--paper)",
                    padding: "16px 26px",
                    borderRadius: 999,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    letterSpacing: "-0.005em",
                  }}
                >
                  Start an audit <ArrowRight size={15} stroke={2.2} />
                </Link>
                <Link
                  href="/guidelines"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--ink)",
                    padding: "16px 0",
                    letterSpacing: "-0.005em",
                    textDecoration: "none",
                  }}
                >
                  Read what gets checked
                </Link>
              </div>
            </div>

            <div data-reveal data-reveal-delay="3">
              <HeroArtifact />
            </div>
          </div>
        </section>

        {/* Process */}
        <section style={{ borderTop: "1px solid var(--hairline)", padding: "80px 36px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ marginBottom: 48 }}>
              <span
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 500, fontSize: 12, color: "var(--ink-mute)",
                  display: "block", marginBottom: 14,
                }}
              >
                How it works
              </span>
              <h2
                style={{
                  fontFamily: "Manrope, system-ui, sans-serif",
                  fontWeight: 700, fontSize: 34,
                  lineHeight: 1.1, letterSpacing: "-0.025em",
                  margin: 0, color: "var(--ink)",
                }}
              >
                Three steps,
                <br />
                usually under a minute.
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                background: "var(--hairline)",
                border: "1px solid var(--hairline)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {[
                { n: "01", t: "Upload",  d: "Drop in PDFs for any of the 13 pre-activity document types. Tag each with its type." },
                { n: "02", t: "Audit",   d: "Dedicated agents read each document visually and against the live CSO and SLIFE rule set." },
                { n: "03", t: "Fix",     d: "A concrete, printable checklist of exactly what to change — no guessing at reviewer comments." },
              ].map((s) => (
                <div key={s.n} style={{ background: "var(--paper)", padding: "36px 32px" }}>
                  <div
                    style={{
                      fontFamily: "ui-monospace, Menlo, monospace",
                      fontSize: 11, color: "var(--ink-mute)",
                      marginBottom: 20, letterSpacing: "0.04em",
                    }}
                  >
                    {s.n}
                  </div>
                  <h3
                    style={{
                      fontFamily: "Manrope, system-ui, sans-serif",
                      fontWeight: 600, fontSize: 22,
                      letterSpacing: "-0.02em", color: "var(--ink)",
                      margin: 0, marginBottom: 10,
                    }}
                  >
                    {s.t}
                  </h3>
                  <p
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 14, lineHeight: 1.55,
                      color: "var(--ink-mute)", margin: 0,
                    }}
                  >
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What gets flagged */}
        <section
          style={{
            borderTop: "1px solid var(--hairline)",
            padding: "80px 36px",
            background: "var(--container-low)",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 380px) minmax(0, 1fr)", gap: 80 }}>
              <div data-reveal>
                <span
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 500, fontSize: 12, color: "var(--ink-mute)",
                    display: "block", marginBottom: 14,
                  }}
                >
                  What gets flagged
                </span>
                <h2
                  style={{
                    fontFamily: "Manrope, system-ui, sans-serif",
                    fontWeight: 700, fontSize: 34,
                    lineHeight: 1.1, letterSpacing: "-0.025em",
                    margin: "0 0 20px", color: "var(--ink)",
                  }}
                >
                  Built from the actual CSO rulebook.
                </h2>
                <p
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 15, lineHeight: 1.6,
                    color: "var(--ink-mute)", margin: 0,
                  }}
                >
                  Each agent checks a specific slice of CSO and SLIFE policy — not a generic
                  prompt. Rules are updated against the latest guideline version so your audit
                  matches what the reviewer sees.
                </p>
                <div style={{ marginTop: 36, display: "flex", gap: 36 }}>
                  {[
                    { v: "13",  l: "Document types" },
                    { v: "~40", l: "Median audit time", suffix: "s" },
                  ].map((stat) => (
                    <div key={stat.l}>
                      <div
                        style={{
                          fontFamily: "Manrope, system-ui, sans-serif",
                          fontWeight: 700, fontSize: 32,
                          letterSpacing: "-0.03em", color: "var(--ink)",
                        }}
                      >
                        <StatCount value={stat.v} suffix={stat.suffix} />
                      </div>
                      <div
                        style={{
                          fontSize: 12, color: "var(--ink-mute)",
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        {stat.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div data-reveal data-reveal-delay="2">
                <div style={{ background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: 12 }}>
                  {CHECKS.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "22px 28px",
                        borderBottom: i < CHECKS.length - 1 ? "1px solid var(--hairline)" : "none",
                        display: "grid",
                        gridTemplateColumns: "32px 1fr",
                        gap: 18,
                        alignItems: "start",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "ui-monospace, Menlo, monospace",
                          fontSize: 11, color: "var(--ink-mute)",
                          marginTop: 4, letterSpacing: "0.04em",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontWeight: 600, fontSize: 15,
                            color: "var(--ink)", marginBottom: 4,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontSize: 13.5, lineHeight: 1.55,
                            color: "var(--ink-mute)",
                          }}
                        >
                          {c.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "100px 36px", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2
              style={{
                fontFamily: "Manrope, system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "clamp(34px, 3.6vw, 48px)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: 0,
                color: "var(--ink)",
              }}
            >
              Submit once. Not three times.
            </h2>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 16,
                color: "var(--ink-mute)",
                margin: "18px 0 32px",
              }}
            >
              Free for DLSU student orgs. No account needed.
            </p>
            <Link
              href="/upload"
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "16px 26px",
                borderRadius: 999,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              Start an audit <ArrowRight size={15} stroke={2.2} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--hairline)", padding: "40px 36px", background: "var(--paper)" }}>
        <div
          style={{
            maxWidth: 1200, margin: "0 auto",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Logo size={18} />
            <span
              style={{
                fontSize: 12, color: "var(--ink-mute)",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              An independent tool. Not affiliated with CSO.
            </span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            <Link href="/guidelines" style={{ fontSize: 13, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none" }}>Guidelines</Link>
            {["Privacy"].map((x) => (
              <span
                key={x}
                style={{
                  fontSize: 13, color: "var(--ink-mute)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  cursor: "default",
                }}
              >
                {x}
              </span>
            ))}
            <a
              href="mailto:suaelljay@gmail.com"
              style={{
                fontSize: 13, color: "var(--ink-mute)",
                fontFamily: "Inter, system-ui, sans-serif",
                textDecoration: "none",
              }}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
