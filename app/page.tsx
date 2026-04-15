import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-surface font-body text-on-surface">
      {/* Nav */}
      <header className="bg-slate-50/80 glass-nav shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black tracking-tighter font-headline bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent">
            GoCheck
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-primary font-bold border-b-2 border-primary pb-1 text-sm font-headline">Home</span>
            <span className="text-on-surface-variant font-medium text-sm cursor-pointer hover:text-primary transition-colors">Guidelines</span>
          </nav>
        </div>
        <Link
          href="/upload"
          className="premium-gradient text-white px-6 py-2.5 rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Start Audit
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-8 pt-20 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <span className="font-headline text-primary font-extrabold tracking-widest text-xs uppercase mb-4 block">
                DLSU Student Auditor AI
              </span>
              <h1 className="font-headline text-6xl lg:text-7xl font-black tracking-tighter text-primary leading-[0.95] mb-6">
                End the <br />
                <span className="text-on-tertiary-container">Correction Loop.</span>
              </h1>
              <p className="font-body text-lg text-on-surface-variant max-w-lg mb-10 leading-relaxed">
                Submit your pre-activity documents — AFORM, PPR, invitations, venue tickets, and more — and know exactly what needs fixing before you walk into APS.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/upload"
                  className="premium-gradient text-white px-8 py-4 rounded-xl font-headline font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">upload</span>
                  Start Audit
                </Link>
                <button className="border border-outline-variant text-primary px-8 py-4 rounded-xl font-headline font-bold hover:bg-surface-container transition-all">
                  View Guidelines
                </button>
              </div>
            </div>

            {/* Bento Visual */}
            <div className="relative grid grid-cols-6 grid-rows-6 gap-4 h-[500px]">
              <div className="col-span-4 row-span-4 bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">description</span>
                  </div>
                  <span className="bg-tertiary-container/10 text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold font-label">
                    Active Analysis
                  </span>
                </div>
                <div>
                  <div className="h-2 w-full bg-surface-container rounded-full mb-2 overflow-hidden">
                    <div className="h-full bg-on-tertiary-container w-2/3 rounded-full" />
                  </div>
                  <p className="text-sm font-bold text-primary font-headline">
                    Reviewing: A-Form signatory fields — Section 5
                  </p>
                </div>
              </div>
              <div className="col-span-2 row-span-3 bg-secondary-container rounded-xl p-4 flex flex-col items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined text-4xl mb-2">warning</span>
                <span className="text-3xl font-black font-headline">12</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Fixes Needed</span>
              </div>
              <div className="col-span-2 row-span-3 bg-primary rounded-xl p-6 flex flex-col justify-end">
                <span className="text-white font-headline font-black text-4xl">88%</span>
                <span className="text-primary-fixed text-xs font-bold">Compliance Score</span>
              </div>
              <div className="col-span-4 row-span-2 bg-surface-container-high rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-tertiary">verified_user</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface leading-tight">CSO Guideline v2024</p>
                  <p className="text-[10px] text-on-surface-variant">Validated Real-time</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/30 blur-[120px] rounded-full -z-10" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-tertiary-fixed/20 blur-[120px] rounded-full -z-10" />
        </section>

        {/* Process Section */}
        <section className="bg-surface-container-low py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center">
              <h2 className="font-headline text-4xl font-black text-primary tracking-tight mb-4">
                Precision Workflow
              </h2>
              <div className="w-20 h-1 bg-on-tertiary-container mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  n: "01",
                  title: "Upload Documents",
                  body: "Drag and drop your AFORM, PPR, or other pre-activity files. Supports 13 document types at once.",
                },
                {
                  n: "02",
                  title: "AI Audit",
                  body: "Dedicated skill agents cross-reference each document against current CSO and SLIFE event policies automatically.",
                },
                {
                  n: "03",
                  title: "Get Correction Checklist",
                  body: "Download a detailed summary of required changes, ready to fix before official submission.",
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="bg-surface-container-lowest p-10 rounded-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="text-6xl font-black font-headline text-surface-container mb-6 group-hover:text-primary-fixed transition-colors">
                    {step.n}
                  </div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-3">{step.title}</h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Asymmetrical Info Section */}
        <section className="py-24 px-8 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="bg-surface-container-lowest p-8 rounded-xl space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-surface-container">
                <span className="material-symbols-outlined text-secondary">menu_book</span>
                <span className="font-headline font-bold text-primary text-sm">CSO Checking Rules — What Gets Flagged</span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Signatory Requirements",
                    detail: "A-Form needs Org President + Faculty Moderator + VP/Dean sign-off depending on activity classification",
                  },
                  {
                    label: "Date & Time Completeness",
                    detail: "Activity must have exact start AND end time; must be submitted at least 2 weeks before the event date",
                  },
                  {
                    label: "Budget Food Cap (30%)",
                    detail: "Food/meals cannot exceed 30% of total project budget; all expense lines must have corresponding projected income",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 bg-surface-container-low rounded-lg cursor-default"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-body font-semibold text-sm text-primary">{item.label}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2">
            <h2 className="font-headline text-5xl font-black text-primary leading-tight mb-6 tracking-tighter">
              Built for the Archer.
              <br />
              Audit with Authority.
            </h2>
            <p className="font-body text-lg text-on-surface-variant mb-8 leading-relaxed">
              Designed specifically for De La Salle University student organizations. Our AI
              checks against actual approved PPRs and the latest policy updates from the Council
              of Student Organizations.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-3xl font-black font-headline text-primary">13</p>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Document Types</p>
              </div>
              <div>
                <p className="text-3xl font-black font-headline text-primary">100%</p>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">AI-Powered</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Canvas */}
        <section className="px-8 pb-24">
          <div className="max-w-7xl mx-auto premium-gradient rounded-3xl p-12 lg:p-20 relative overflow-hidden text-center">
            <div className="relative z-10">
              <h2 className="font-headline text-5xl font-black text-white mb-6">
                Ready to skip the revision loop?
              </h2>
              <p className="text-primary-fixed/80 max-w-xl mx-auto mb-10 text-lg">
                Get your CSO documents right the first time — before submission.
              </p>
              <Link
                href="/upload"
                className="bg-white text-primary px-10 py-5 rounded-xl font-headline font-black text-lg shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  rocket_launch
                </span>
                Launch Auditor
              </Link>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px] -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-tertiary-fixed rounded-full blur-[100px] -ml-48 -mb-48" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest py-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <span className="text-2xl font-black tracking-tighter text-primary mb-4 block font-headline">GoCheck</span>
            <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
              An independent AI document auditor for DLSU student leadership and administrative excellence.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-headline font-bold text-primary mb-4 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><Link href="/upload" className="hover:text-primary transition-colors">New Check</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-headline font-bold text-primary mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>CSO Manual</li>
                <li>SLIFE Guidelines</li>
              </ul>
            </div>
            <div>
              <h4 className="font-headline font-bold text-primary mb-4 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>
                  <a
                    href="mailto:suaelljay@gmail.com"
                    className="hover:text-primary transition-colors"
                  >
                    Ell Jay Sua
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:suaelljay@gmail.com"
                    className="hover:text-primary transition-colors text-xs"
                  >
                    suaelljay@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-outline-variant/20 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant">
            © 2024 GoCheck Document Auditor. Not affiliated with DLSU CSO official administration.
          </p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">language</span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
