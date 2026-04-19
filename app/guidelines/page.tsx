"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/app/components/logo";
import { ArrowRight } from "@/app/components/icons";

// ─── Design tokens / atoms ────────────────────────────────────────────────────

function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: 500, fontSize: 12,
      color: "var(--ink-mute)",
      letterSpacing: "-0.005em",
      display: "inline-flex", alignItems: "center", gap: 8,
      ...style,
    }}>{children}</span>
  );
}

function Pill({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "warn"; children: React.ReactNode }) {
  const palette = {
    neutral: { bg: "var(--container)", fg: "var(--ink-mute)" },
    accent:  { bg: "var(--accent-soft)", fg: "var(--accent-ink)" },
    warn:    { bg: "var(--amber-soft)", fg: "var(--amber-ink)" },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 10px", borderRadius: 999,
      background: palette.bg, color: palette.fg,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: 600, fontSize: 11.5,
      letterSpacing: "-0.005em",
    }}>{children}</span>
  );
}

function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {eyebrow && <Eyebrow style={{ marginBottom: 10 }}>{eyebrow}</Eyebrow>}
      <h1 style={{
        fontFamily: "Manrope, system-ui, sans-serif",
        fontWeight: 700, fontSize: 40,
        letterSpacing: "-0.035em",
        margin: 0, color: "var(--ink)", lineHeight: 1.05,
      }}>{title}</h1>
      {children && (
        <p style={{ color: "var(--ink-mute)", fontSize: 15.5, marginTop: 14, maxWidth: 620, lineHeight: 1.55 }}>
          {children}
        </p>
      )}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "Manrope, system-ui, sans-serif",
      fontWeight: 600, fontSize: 22,
      letterSpacing: "-0.02em",
      margin: "44px 0 18px", color: "var(--ink)",
    }}>{children}</h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: "Manrope, system-ui, sans-serif",
      fontWeight: 600, fontSize: 15,
      letterSpacing: "-0.01em",
      margin: "28px 0 10px", color: "var(--ink)",
    }}>{children}</h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "var(--ink)", fontSize: 15, lineHeight: 1.65, maxWidth: 720 }}>
      {children}
    </div>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: "8px 0", padding: 0, listStyle: "none", color: "var(--ink)", fontSize: 14.5, lineHeight: 1.65 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: "flex", gap: 12, padding: "6px 0" }}>
          <span style={{ flexShrink: 0, width: 4, height: 4, borderRadius: "50%", background: "var(--ink)", marginTop: 10 }} />
          <span style={{ maxWidth: 680 }}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ tone = "info", title, children }: { tone?: "info" | "warn" | "good"; title?: string; children: React.ReactNode }) {
  const palette = {
    info: { bg: "var(--container-low)", fg: "var(--ink)", line: "var(--hairline-strong)" },
    warn: { bg: "var(--amber-soft)", fg: "var(--amber-ink)", line: "var(--amber-ink)" },
    good: { bg: "var(--accent-soft)", fg: "var(--accent-ink)", line: "var(--accent-ink)" },
  }[tone];
  return (
    <div style={{
      background: palette.bg,
      borderLeft: `2px solid ${palette.line}`,
      padding: "14px 18px",
      borderRadius: "0 10px 10px 0",
      margin: "16px 0", maxWidth: 720,
    }}>
      {title && (
        <div style={{
          fontFamily: "Manrope, system-ui, sans-serif",
          fontWeight: 700, fontSize: 13,
          color: palette.fg, letterSpacing: "-0.005em", marginBottom: 6,
        }}>{title}</div>
      )}
      <div style={{ color: "var(--ink)", fontSize: 14.5, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Rules({ rules }: { rules: { good?: string; bad?: string; remark?: string }[] }) {
  return (
    <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden", maxWidth: 900, margin: "16px 0" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        background: "var(--container-low)",
        borderBottom: "1px solid var(--hairline)",
        padding: "10px 16px",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11, fontWeight: 600, color: "var(--ink-mute)",
        letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        <div>Correct</div>
        <div>Pend trigger</div>
        <div>Remark sent to org</div>
      </div>
      {rules.map((r, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
          padding: "16px", fontSize: 14, lineHeight: 1.55, gap: 16,
          background: "var(--paper)",
        }}>
          <div style={{ color: "var(--ink)" }}>
            {r.good
              ? <span style={{ color: "var(--accent-ink)" }}>{r.good}</span>
              : <span style={{ color: "var(--ink-mute)" }}>—</span>}
          </div>
          <div style={{ color: "var(--ink)" }}>{r.bad || <span style={{ color: "var(--ink-mute)" }}>—</span>}</div>
          <div style={{
            color: "var(--ink)",
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 12.5,
            background: "var(--container-low)",
            padding: "8px 10px", borderRadius: 6, alignSelf: "start",
          }}>{r.remark || <span style={{ color: "var(--ink-mute)" }}>—</span>}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Section bodies ───────────────────────────────────────────────────────────

function SecDates() {
  const rows = [
    { date: "Sep 22, 2025", type: "Full Incentive",          scope: "Termlong / Yearlong" },
    { date: "Sep 25, 2025", type: "Half Incentive",          scope: "Termlong / Yearlong" },
    { date: "Oct 3, 2025",  type: "Early Approved",          scope: "Termlong / Yearlong" },
    { date: "Oct 8, 2025",  type: "Late Approved (cutoff)",  scope: "Termlong / Yearlong" },
    { date: "Nov 21, 2025", type: "Post-acts deadline",      scope: "TL/YL non-academic" },
    { date: "Nov 28, 2025", type: "Post-acts deadline",      scope: "Activities held Oct 24 – Nov 23, 2025" },
    { date: "Dec 5, 2025",  type: "Post-acts deadline",      scope: "TL/YL academic" },
    { date: "Dec 12, 2025", type: "Post-acts deadline",      scope: "Activities held during Activity Ban" },
  ];
  return (
    <div>
      <SectionTitle eyebrow="Term 1 · 51st CSO" title="Dates to remember">
        The calendar GoCheck uses when computing incentive status and flagging late submissions. All cut-offs are <strong>8:00 PM</strong>; a submission at 8:01 PM is counted the following day.
      </SectionTitle>
      <div style={{ border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", maxWidth: 820 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "180px 1fr auto",
            padding: "18px 22px",
            borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
            alignItems: "baseline", gap: 20,
          }}>
            <div style={{ fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em", color: "var(--ink)" }}>{r.date}</div>
            <div style={{ fontSize: 14.5, color: "var(--ink)" }}>{r.type}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>{r.scope}</div>
          </div>
        ))}
      </div>
      <Callout tone="info" title="Cut-off rule">8:00 PM daily. Submissions at 8:01 PM or later are logged to the next day for status-counting purposes.</Callout>
    </div>
  );
}

function SecReminders() {
  return (
    <div>
      <SectionTitle eyebrow="Always read me first" title="General reminders">
        The pre-flight checks GoCheck runs before even opening the A-Form.
      </SectionTitle>
      <List items={[
        <span><strong>EPL gate.</strong> Organizations cannot submit pre-activity documents without an Early Processing Letter <em>or</em> a clearance on the Ops Tracker. <span style={{ color: "var(--amber-ink)" }}>No EPL = No Status.</span></span>,
        <span><strong>ARNs must be correct.</strong> A missing or wrong Activity Reference Number gets a No Status and is not checked.</span>,
        <span><strong>File order.</strong> EPL → full email thread → A-Form → PPR → other documents.</span>,
        <span><strong>Rush checks capped at 5 per term</strong> per organization.</span>,
        <span><strong>Cut-off:</strong> 8:00 PM. Submissions at 8:01 PM count as the next day.</span>,
        <span><strong>Resubmissions after a No Status</strong> are treated as <em>initial</em> submissions, not pended ones.</span>,
        <span><strong>Logged term:</strong> Yearlong stays Yearlong. Termlong and single/multiple-date activities are logged under Term 1.</span>,
      ]} />
    </div>
  );
}

function SecStatuses() {
  return (
    <div>
      <SectionTitle eyebrow="Incentive ladder" title="Statuses &amp; incentives">
        How GoCheck attributes a final status once the activity is approved. A No Status cannot be converted — the organisation has to resubmit as a fresh initial.
      </SectionTitle>
      <H2>Termlong / Yearlong</H2>
      <Rules rules={[
        { good: "Approved ≤ Sep 22 · max 2 pends",  bad: "3+ pends",                     remark: "Auto-drop to next lower tier" },
        { good: "Approved ≤ Sep 25 · max 2 pends",  bad: "Missed Full Incentive window",  remark: "Half Incentive" },
        { good: "Approved ≤ Oct 3",                 bad: "Unlimited pends allowed",       remark: "Early Approved" },
        { good: "Approved ≤ Oct 8",                 bad: "Initial after 8PM Oct 8",       remark: "No Status" },
      ]} />
      <H2>Single / multiple-date activities</H2>
      <Rules rules={[
        { good: "Approved ≥ 8 working days before · 0 pend",  bad: "1 pend same window",  remark: "Half Incentive" },
        { good: "Approved ≥ 8 working days before · full",    bad: "—",                   remark: "Full Incentive" },
        { good: "Approved ≥ 5 working days before · 0 pend",  bad: "—",                   remark: "Half Incentive" },
        { good: "Approved ≥ 4 working days before",           bad: "—",                   remark: "Early Approved" },
        { good: "—",                                          bad: "Approved < 3 working days before", remark: "Late Approved" },
      ]} />
      <Callout tone="info" title="Working-day counting">Saturdays, Sundays and holidays are excluded. Only applies to single / multiple-date activities.</Callout>
      <H2>Uncounted pend</H2>
      <Prose>A pend is <em>uncounted</em> when an APS officer pends for a reason different from the original pend. The final status falls back to the <strong>last counted pend</strong>.</Prose>
      <Callout tone="info" title="Worked example">Activity on Sep 16 · pended Sep 4 · APS finds a new issue Sep 6 (uncounted) · resubmitted and approved Sep 9 → <strong>Half Incentive</strong> (7 working days before).</Callout>
    </div>
  );
}

function SecFormat() {
  return (
    <div>
      <SectionTitle eyebrow="House style" title="Format for remarks">
        GoCheck mirrors the remark format used by APS officers so organisations see language they already recognise.
      </SectionTitle>
      <List items={[
        <span>Lead with the <strong>missing or wrong field</strong>, not the fix. <em>e.g.</em> "Missing contact number of Project Head."</span>,
        <span>Specify location when ambiguous: A-Form, PPR Section IV, 1st CPD, etc.</span>,
        <span>Mark <strong>Major Pend</strong> in brackets when the rule has a firm hard-stop (e.g. F2F after 9 PM, online after 10 PM).</span>,
        <span>For recurring issues, use the canonical phrases: <em>"Missing signatures of the signatories"</em>, <em>"Activity Nature and Activity Type is inconsistent in the A-Form/PPR"</em>.</span>,
      ]} />
    </div>
  );
}

function SecEPL() {
  return (
    <div>
      <SectionTitle eyebrow="Pre-acts · first page" title="Early Processing Letter">
        Required when the organisation is not yet cleared in the Ops Tracker. Without an EPL or clearance, no pre-acts can be submitted.
      </SectionTitle>
      <Rules rules={[
        { good: "EPL and full email thread attached as page 1, before the A-Form", bad: "Missing EPL / clearance", remark: "NO STATUS. Do not check." },
        { good: "Email thread shows Sir James Laxa's \"Approved\" reply", bad: "Email thread missing the approval", remark: "Missing EPL or email thread" },
        { good: "Activity Nature & Type match A-Form and PPR", bad: "Inconsistent between EPL and A-Form/PPR", remark: "EPL Activity Nature and Type is inconsistent in the A-Form/PPR" },
        { good: "All signatories present: TO James Laxa · THRU Julianne Y. So · FROM Org President", bad: "Incomplete signatories", remark: "Missing signatures of the signatories / incomplete signatory in the EPL" },
      ]} />
      <Callout tone="warn" title="Hard stop">No EPL and not cleared in Ops Tracker = No Status. GoCheck refuses to proceed past the document check.</Callout>
    </div>
  );
}

function SecBA() {
  return (
    <div>
      <SectionTitle eyebrow="Pre-acts · FA signature rule" title="Blanket of Approval">
        The Faculty Adviser's signature on the A-Form and PPR Section IX is only required when the activity falls <em>outside</em> the Blanket.
      </SectionTitle>
      <H2>FA signature is required when…</H2>
      <List items={[
        "The activity title is not included in the Blanket of Approval.",
        <span>The A-Form date is <strong>more than ±7 days</strong> from the date on the BA.</span>,
        <span>The <strong>duration</strong> changed — e.g. BA lists Termlong but A-Form is single-day, or vice versa.</span>,
      ]} />
      <Rules rules={[
        { good: "Title matches BA (exact or close enough)", bad: "Title is substantively different", remark: "Missing FA signature. Activity is not included in the blanket of approval." },
        { good: "A-Form date within ±7 days of BA date", bad: "A-Form date more than ±7 days away", remark: "Missing FA signature. Activity date is not within ±7 days from the one indicated in the blanket of approval." },
        { good: "Duration on A-Form matches BA", bad: "Duration changed (TL→single, single→multi)", remark: "Missing FA signature. Duration in the BA is different from the A-Form." },
      ]} />
    </div>
  );
}

function SecAForm() {
  const [tab, setTab] = useState<"fields" | "date">("fields");
  return (
    <div>
      <SectionTitle eyebrow="Pre-acts · core form" title="A-Form">
        Eleven fields. Each one is a potential pend. These are the rules GoCheck applies field-by-field.
      </SectionTitle>
      <div style={{
        display: "inline-flex", gap: 4,
        background: "var(--container-low)",
        padding: 4, borderRadius: 10, marginBottom: 8,
      }}>
        {([["fields", "Field-by-field"], ["date", "Date / time / venue by type"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: tab === k ? "var(--paper)" : "transparent",
            border: "none", padding: "7px 14px", borderRadius: 7,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13, fontWeight: 600,
            color: tab === k ? "var(--ink)" : "var(--ink-mute)",
            cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: tab === k ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {tab === "fields" && (
        <>
          <H3>1. Requesting organization</H3>
          <Rules rules={[
            { good: "Full name spelled out (e.g. \"Council of Student Organizations\")", bad: "Acronym only (e.g. \"CSO\")", remark: "Kindly put the complete name of your organization in the A-Form." },
          ]} />
          <H3>2. Title of activity</H3>
          <Prose>Must be consistent across EPL, A-Form, PPR and BA. If the BA title and A-Form title diverge significantly, FA signature kicks in.</Prose>
          <H3>3. Nature of activity</H3>
          <Rules rules={[
            { good: "Tick under \"CSO and Special Groups\"", bad: "Tick under \"USG\"", remark: "Please tick the box under \"CSO and Special Groups\"." },
          ]} />
          <H3>4. Type of activity</H3>
          <Rules rules={[
            { good: "Tick under \"Through CSO and DAAM\"", bad: "\"Through SLIFE\" ticked instead", remark: "Process thru SLIFE or message VC to clarify. (NO STATUS for APS)" },
          ]} />
          <H3>6. Time of activity <span style={{ color: "var(--amber-ink)", fontWeight: 600, fontSize: 12 }}>· Major pend</span></H3>
          <Rules rules={[
            { good: "F2F ends by 9:00 PM · Online ends by 10:00 PM", bad: "F2F ending 9:01 PM+ / Online 10:01 PM+", remark: "[Major Pend] Onsite events until 9:00 PM only / online until 10:00 PM only." },
            { good: "Async or TL/YL → Time = N/A", bad: "—", remark: "—" },
          ]} />
          <H3>7. Venue</H3>
          <Rules rules={[
            { good: "Link clearly readable and consistent throughout pre-acts", bad: "Text not readable", remark: "Please put \"See PPR\" in the venue portion." },
          ]} />
          <H3>8. ENP / ENMP</H3>
          <List items={["ENP ≥ ENMP", "Neither ENMP nor ENP can be 0", "N/A for async and TL/YL"]} />
          <H3>9. Online activity · 9b. Activity in GOSM</H3>
          <Rules rules={[
            { good: "F2F → \"No\" · Online sync / async / streaming → \"Yes\"", bad: "F2F ticked \"Yes\"", remark: "Please check NO in Online Activity." },
            { good: "Activity in GOSM = Yes", bad: "Checked No", remark: "Attach SAS, justification, and FA signature (EVCD approval required)." },
          ]} />
          <H3>10. Reach of activity</H3>
          <Rules rules={[
            { good: "Exactly one box ticked", bad: "Multiple boxes ticked", remark: "Please only check ONE box in Reach of Activity." },
            { good: "—", bad: "No box ticked", remark: "Missing check in Reach of Activity." },
          ]} />
          <H3>11. Signatories</H3>
          <List items={[
            "Submitted by and Organization President: name, signature, date & time required.",
            "Faculty Adviser: name always required. Date & time optional. Signature only required if activity falls outside the BA.",
          ]} />
        </>
      )}

      {tab === "date" && (
        <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden", maxWidth: 960, marginTop: 16 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr 1fr",
            background: "var(--container-low)",
            padding: "12px 16px",
            fontSize: 11, fontWeight: 600, color: "var(--ink-mute)",
            textTransform: "uppercase", letterSpacing: "0.04em",
            borderBottom: "1px solid var(--hairline)",
          }}>
            <div>Field</div><div>Single date</div><div>Multiple date</div><div>Async</div><div>Termlong / Yearlong</div>
          </div>
          {[
            ["5. Date",           "Exact date",             "Exact date",              "Exact date",        "Termlong / Yearlong"],
            ["6. Time",           "Exact time",             "Exact time",              "N/A",               "N/A"],
            ["7. Venue (F2F)",    "Exact venue",            "Exact venue",             "N/A for physical",  "Optional"],
            ["7. Venue (online)", "Full link + ID + PW",    "Full link + ID + PW",     "URL required",      "Optional"],
            ["8. ENP / ENMP",     "ENP ≥ ENMP, neither 0",  "ENP ≥ ENMP, neither 0",  "N/A",               "N/A"],
            ["9. Online Activity","F2F: No · Online: Yes",  "Per segment",             "Yes",               "Yes if online"],
          ].map((row, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr 1fr",
              padding: "14px 16px",
              borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
              fontSize: 13.5, gap: 16, alignItems: "start",
              background: "var(--paper)",
            }}>
              <div style={{ fontWeight: 600, color: "var(--ink)" }}>{row[0]}</div>
              {row.slice(1).map((c, j) => <div key={j} style={{ color: "var(--ink)" }}>{c}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecPPR() {
  return (
    <div>
      <SectionTitle eyebrow="Pre-acts · nine sections" title="Project Proposal Form (PPR)">
        The PPR carries the bulk of pend volume. Sections I–IX each have their own rules; GoCheck checks them independently and rolls up results.
      </SectionTitle>
      <H2>I · Activity Details</H2>
      <List items={[
        "Title, Nature, Type, Date, ENMP/ENP must match the A-Form exactly.",
        "# Project Heads = # Contact Numbers = # DLSU Emails.",
        "Contact numbers are 11 digits.",
        "Online venue → Meeting ID and password required.",
        "Awareness Campaign → pub posting links required.",
        "Pre-registration forms required for seminar/workshop, webinar, donation drive, case competition. Attach screenshot of the form alongside the link.",
        "TL/YL: venue optional (can be N/A).",
      ]} />
      <H2>II · Brief Context</H2>
      <Rules rules={[
        { good: "Exactly 3 paragraphs, answering the guide questions", bad: "Fewer or more than 3", remark: "There must be only 3 paragraphs." },
      ]} />
      <H2>III · Objectives</H2>
      <Rules rules={[
        { good: "≥ 3 objectives, complete sentences", bad: "< 3 objectives", remark: "Objectives should be at least 3." },
        { good: "—", bad: "Not in sentence form", remark: "Objectives must be in complete sentences." },
      ]} />
      <H2>IV · Comprehensive Program Design (CPD)</H2>
      <H3>1st CPD — required order</H3>
      <List items={[
        "Preparation of Pre-acts",
        "Submission of Pre-acts",
        "Activity Proper",
        "ORGRES Member Feedback (if applicable)",
        "Preparation of Post-acts",
        "Submission of Post-acts",
      ]} />
      <Callout tone="info" title="CSO ORGRES timing">Day after the activity (1 day) <strong>or</strong> the activity day and day after (2 days). E.g. activity Sep 21 → ORGRES Sep 22 or Sep 21–22.</Callout>
      <Callout tone="warn" title="Don't overlap">Preparation and Submission of Post-acts must come <strong>after</strong> Activity Proper — never the same date or earlier.</Callout>
      <H3>2nd CPD — Activity Proper</H3>
      <List items={[
        "F2F requires Preparation, Registration (outside activity proper), and Clean Up.",
        "Online requires only Registration (outside activity proper).",
        "Time must be continuous (e.g. 10:00–10:05 AM, 10:05–10:10 AM).",
        "Always include AM/PM.",
        "Follow \"Icebreaker: Name\" / \"Speaker: Name\" format.",
        "CSO ORGRES Evaluation in 2nd CPD only if the evaluated event is F2F; at least 5 mins before the end.",
        "Ingress and Registration are separate rows.",
        "Multiple-dated activities: include a CPD for each date.",
      ]} />
      <Callout tone="warn">Online activities that include CSO ORGRES in the 2nd CPD will be pended.</Callout>
      <H2>V · Breakdown of Expenses</H2>
      <List items={[
        "All projected expenses listed — including X-deals. Use ₱0.00 or N/A for non-monetary X-deals.",
        "Venue fee required when: venue is Large, or usage is more than 2 hours for Medium venues. Must match VRT.",
        "No expenses: replace the table with the standard statement.",
        "All values formatted with PHP and .00.",
        "Total ≤ ₱20,000 to stay with APS. ₱20,001 and above goes through SLIFE.",
        "Total ≤ declared activity budget in the GOSM.",
      ]} />
      <H2>VI · Allocation of Expenses</H2>
      <List items={[
        "Total equals Section V exactly.",
        "Participants' Fee and Others → always N/A when processed under APS.",
        "Unused cells → N/A.",
      ]} />
      <H2>VII · Projected Income</H2>
      <Callout tone="warn">Any projected income → processed through SLIFE, not APS.</Callout>
      <Prose>If there is no projected income, replace the table with: <em>"THE ACTIVITY IS NOT A FUNDRAISING/SELLING ACTIVITY; THUS, IT WILL NOT INCUR INCOME OR LOSS."</em></Prose>
      <H2>VIII · Summary of Funds</H2>
      <List items={[
        "Operational Fund → always N/A.",
        "Depository Fund (as of) — Term 1: September 11, 2025.",
        "Participants' Fee / Donation / Sponsorship consistent with Section VII, or N/A.",
        "Total Projected Expenses matches Section V.",
        "All fields labeled Php and ending in .00 — otherwise N/A.",
        "Only VP Finance, a recognised OIC, or the President can sign for VP Finance.",
      ]} />
      <H2>IX · Provisions for Profit and Loss</H2>
      <List items={[
        "Two different positions, with the right-hand signatory higher ranking.",
        "\"Project Head\" as Position is not allowed.",
        "When signing for someone else, indicate their name & position beside the signature.",
        "FA signature may not be needed if activity is in the BA, but always include the FA's name.",
      ]} />
    </div>
  );
}

function SecSpeakers() {
  return (
    <div>
      <SectionTitle eyebrow="Other documents" title="Speakers, tutors, performers">
        Credentials template + letter of invitation are required for anyone external invited to the activity. Distinction level determines whether it routes to APS or SLIFE.
      </SectionTitle>
      <H2>Distinction ladder</H2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, maxWidth: 960, margin: "16px 0" }}>
        {[
          { tag: "VIP", route: "SLIFE" as const, who: "Elected officials · executives of public companies · ambassadors · international expats · people who ran for national posts · local & international celebrities (actors, singers, models)." },
          { tag: "Distinguished", route: "SLIFE" as const, who: "Non-elected officials · executives of public companies · local professional / international artists · people who ran for local posts · took masters." },
          { tag: "Non-distinguished", route: "APS" as const, who: "DLSU alumni · students · DLSU employees & professors · local student artists · experts in their fields · internet personalities / influencers." },
        ].map((c, i) => (
          <div key={i} style={{ border: "1px solid var(--hairline)", borderRadius: 12, padding: "18px 18px 16px", background: "var(--paper)" }}>
            <div style={{ fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "-0.005em", color: "var(--ink)", marginBottom: 6 }}>{c.tag}</div>
            <div style={{ marginBottom: 10 }}><Pill tone={c.route === "APS" ? "accent" : "warn"}>Process thru {c.route}</Pill></div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink)" }}>{c.who}</div>
          </div>
        ))}
      </div>
      <Callout tone="info">Higher distinction takes precedence. A DLSU professor with a masters degree alone still processes through APS — but if they also hold a VIP or Distinguished credential, it routes to SLIFE.</Callout>
      <H2>Credentials document</H2>
      <List items={[
        "Template always required for any speaker, tutor, performer, judge, etc.",
        "Picture is not required when the speaker is a current DLSU student.",
      ]} />
      <H2>Letter of invitation</H2>
      <List items={[
        "Block format — everything flush left.",
        "Include date, time, venue, contact details.",
        "Signatories complete — including Sir James Laxa.",
        "Sir James's signature is not needed if the speaker is a current member of the organisation.",
        "One signatory from the organisation is sufficient on the org side.",
        "Applies to all speakers, tutors, judges, performers.",
        "If the speaker changes, re-sign the letter with Sir James only — no need to resubmit pre-acts.",
        "# of speakers = # of letters.",
      ]} />
      <Rules rules={[
        { good: "Block format, complete signatories", bad: "Not block format", remark: "Letter should be in block format." },
        { good: "—", bad: "Missing letter of invitation", remark: "Missing letter of invitation." },
        { good: "—", bad: "# of speakers ≠ # of letters", remark: "Missing letter of invitation of [speaker name]." },
        { good: "—", bad: "Non-student speaker, no Sir James sig", remark: "[Major Pend] Letter of invitation to speaker — missing signature of Sir James." },
      ]} />
    </div>
  );
}

function SecVenue() {
  return (
    <div>
      <SectionTitle eyebrow="Other documents" title="Venue Reservation Ticket (VRT)">
        Only attached when the venue rules demand it. GoCheck skips the VRT check for small and medium venues under two hours.
      </SectionTitle>
      <H2>VRT required when</H2>
      <List items={[
        "Event time is more than 2 hours.",
        "The venue is classified Large.",
        "A venue fee is declared in Section V of the PPR (must match VRT).",
        "Benches at SJ, Velasco or Miguel are reserved.",
      ]} />
      <Callout tone="info">Pending status on the VRT is accepted. Small / medium venues under two hours do not need a VRT at all.</Callout>
      <Rules rules={[
        { good: "—", bad: "Event >2h, large venue, or venue fee declared — no VRT attached", remark: "Missing VRT." },
      ]} />
    </div>
  );
}

function SecMechanics() {
  return (
    <div>
      <SectionTitle eyebrow="Other documents" title="Contest, recruitment, election mechanics">
        A family of similarly-structured documents. The core signature rule — Project Head + Organization President — is shared across all three.
      </SectionTitle>
      <H2>General contest mechanics</H2>
      <List items={[
        "Activity details consistent with A-Form and PPR.",
        "Section VI (prize details) matches Section V of the PPR.",
        "Prize details include price per quantity.",
        "Affiliation position is not \"Project Head\".",
        "X-deal prizes → note under the Section VI table.",
        "Required whenever games have monetary or X-deal prizes. Optional for games without prizes.",
      ]} />
      <H2>Academic contest mechanics</H2>
      <Prose>Identical to general contest mechanics plus: Department Chair signature or acknowledgement email, and a List of Questions attached right after.</Prose>
      <Callout tone="info" title="Email endorsement">When requesting endorsement by email, CC <code>patricia_solis@dlsu.edu.ph</code> and <code>regina_docallos@dlsu.edu.ph</code>.</Callout>
      <H2>Recruitment / audition mechanics</H2>
      <List items={[
        "Sections I–V always filled.",
        "Section VI optional based on activity.",
        "List of Questions required for any recruitment (sync or async via gforms). Place immediately after the mechanics.",
      ]} />
      <H2>Election mechanics</H2>
      <List items={[
        "Sections I–V always filled.",
        "Section VI can be omitted when no Miting de Avance is held.",
      ]} />
    </div>
  );
}

function SecMiscDocs() {
  return (
    <div>
      <SectionTitle eyebrow="Other documents" title="Meeting, FGD, training, pre-reg">
        Smaller, activity-specific documents. Most of the checks come down to consistency with the A-Form and PPR.
      </SectionTitle>
      <H2>Meeting Agenda</H2>
      <List items={["Activity details consistent with A-Form and PPR.", "Required for meetings.", "Complete signatories."]} />
      <H2>Focus Group Discussion / Survey mechanics</H2>
      <Prose>Applicable to data-gathering activities only. Attach FGD mechanics + agenda, or Survey mechanics.</Prose>
      <H2>Credentials of Tutors</H2>
      <Prose>Required for academic-assistance events.</Prose>
      <H2>Training Program Mechanics</H2>
      <Prose>Include all tentative plans for the program.</Prose>
      <H2>Pre-registration Forms with Data Privacy</H2>
      <List items={[
        "Required alongside pre-acts when the activity type requires pre-registration:",
        "Case competitions",
        "Seminar / workshop",
        "Webinars",
        "Donation drives",
      ]} />
      <H2>Sample pub</H2>
      <Prose>Required for activities of type <strong>Awareness Campaign</strong>.</Prose>
    </div>
  );
}

function SecPostacts() {
  return (
    <div>
      <SectionTitle eyebrow="After the event" title="Post-acts deadline">
        Generally one month after the last day of the activity — with exceptions for activities held during Activity Ban.
      </SectionTitle>
      <H2>Rule of thumb</H2>
      <Prose>Post-acts deadline = one month after the last day of the activity.</Prose>
      <List items={[
        "Activity Sep 25, 2025 → Post-acts Oct 25, 2025",
        "Activity Feb 14, 2026 → Post-acts Mar 14, 2026",
      ]} />
      <Callout tone="info" title="Applies to">All single and multiple dates, except activities held during Activity Ban — those have their own fixed deadline.</Callout>
      <H2>Fixed post-acts deadlines (Term 1)</H2>
      <div style={{ border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", maxWidth: 820 }}>
        {[
          ["Nov 21, 2025", "TL / YL non-academic activities"],
          ["Nov 28, 2025", "Activities held Oct 24 – Nov 23, 2025"],
          ["Dec 5, 2025",  "TL / YL academic activities"],
          ["Dec 12, 2025", "Activities held during the Activity Ban"],
        ].map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "180px 1fr",
            padding: "16px 22px",
            borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
            alignItems: "baseline", gap: 20,
          }}>
            <div style={{ fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{r[0]}</div>
            <div style={{ fontSize: 14.5, color: "var(--ink)" }}>{r[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section registry ─────────────────────────────────────────────────────────

const GL_SECTIONS = [
  { id: "dates",     label: "Dates to remember",           group: "Overview" },
  { id: "reminders", label: "General reminders",           group: "Overview" },
  { id: "statuses",  label: "Statuses & incentives",       group: "Overview" },
  { id: "format",    label: "Format for remarks",          group: "Overview" },
  { id: "epl",       label: "Early Processing Letter",     group: "Pre-acts flow" },
  { id: "ba",        label: "Blanket of Approval",         group: "Pre-acts flow" },
  { id: "aform",     label: "A-Form",                      group: "Pre-acts flow" },
  { id: "ppr",       label: "Project Proposal (PPR)",      group: "Pre-acts flow" },
  { id: "speakers",  label: "Speakers & invitations",      group: "Other documents" },
  { id: "venue",     label: "Venue Reservation Ticket",    group: "Other documents" },
  { id: "mechanics", label: "Contest / recruitment / election", group: "Other documents" },
  { id: "misc-docs", label: "Meeting, FGD, training, prereg",   group: "Other documents" },
  { id: "postacts",  label: "Post-acts deadline",          group: "After the event" },
] as const;

type SectionId = typeof GL_SECTIONS[number]["id"];

const BODIES: Record<SectionId, React.FC> = {
  dates:      SecDates,
  reminders:  SecReminders,
  statuses:   SecStatuses,
  format:     SecFormat,
  epl:        SecEPL,
  ba:         SecBA,
  aform:      SecAForm,
  ppr:        SecPPR,
  speakers:   SecSpeakers,
  venue:      SecVenue,
  mechanics:  SecMechanics,
  "misc-docs": SecMiscDocs,
  postacts:   SecPostacts,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidelinesPage() {
  const [active, setActive] = useState<SectionId>("dates");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("gocheck.gl") as SectionId | null;
    if (saved && BODIES[saved]) setActive(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("gocheck.gl", active);
  }, [active]);

  const filtered = query
    ? GL_SECTIONS.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
    : GL_SECTIONS;

  const groups = Array.from(new Set(filtered.map((s) => s.group)));
  const Body = BODIES[active];

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink)" }}>
      {/* Nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(250,250,248,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--hairline)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "18px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <Link href="/" style={{
                fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 14,
                color: "var(--ink-mute)", textDecoration: "none",
                padding: "6px 0", letterSpacing: "-0.005em",
                borderBottom: "1.5px solid transparent",
              }}>Overview</Link>
              <span style={{
                fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 14,
                color: "var(--ink)", padding: "6px 0",
                letterSpacing: "-0.005em",
                borderBottom: "1.5px solid var(--ink)",
              }}>Guidelines</span>
            </nav>
          </div>
          <Link href="/upload" style={{
            background: "var(--ink)", color: "var(--paper)", border: "none",
            padding: "10px 18px", borderRadius: 999,
            fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 13,
            textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            letterSpacing: "-0.005em",
          }}>
            New audit <ArrowRight size={14} stroke={2.2} />
          </Link>
        </div>
      </header>

      {/* Body */}
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "48px 36px 120px",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 56,
        alignItems: "start",
      }}>
        {/* Left rail */}
        <aside style={{ position: "sticky", top: 96 }}>
          <Eyebrow style={{ marginBottom: 16 }}>Guidelines · 51st CSO Term 1</Eyebrow>
          <div style={{ marginBottom: 20 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--hairline-strong)",
                background: "var(--paper)",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 13, color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>
          {groups.map((g) => (
            <div key={g} style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 11, fontWeight: 600, color: "var(--ink-mute)",
                textTransform: "uppercase", letterSpacing: "0.06em",
                marginBottom: 8, paddingLeft: 2,
              }}>{g}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {filtered.filter((s) => s.group === g).map((s) => {
                  const isActive = s.id === active;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      style={{
                        background: isActive ? "var(--container)" : "transparent",
                        border: "none", textAlign: "left",
                        padding: "8px 12px", borderRadius: 8,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 13.5,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "var(--ink)" : "var(--ink-mute)",
                        cursor: "pointer", letterSpacing: "-0.005em",
                      }}
                    >{s.label}</button>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 28, padding: "14px 16px",
            background: "var(--container-low)", borderRadius: 10,
            fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-mute)",
          }}>
            Sources: <span style={{ color: "var(--ink)" }}>Term 1 APS Process Orientation Workshop</span> and <span style={{ color: "var(--ink)" }}>51st Checking Guide</span>.
          </div>
        </aside>

        {/* Main content */}
        <main key={active} className="gc-screen-enter">
          <Body />
        </main>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--hairline)", padding: "40px 36px", background: "var(--paper)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Logo size={18} />
            <span style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif" }}>
              An independent tool. Not affiliated with CSO.
            </span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            <Link href="/guidelines" style={{ fontSize: 13, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none" }}>Guidelines</Link>
            <a href="mailto:suaelljay@gmail.com" style={{ fontSize: 13, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
