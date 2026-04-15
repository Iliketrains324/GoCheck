import Link from "next/link";
import {
  CheckCircle,
  FileText,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const DOC_TYPES = [
  "Activity Approval Form (A-Form)",
  "Project Proposal Form (PPR)",
  "Letter of Invitation",
  "Credentials of Speakers",
  "Venue Reservation Ticket",
  "Meeting Agenda",
  "Recruitment Mechanics",
  "Election Mechanics",
  "Contest Mechanics",
  "+ more",
];

const FEATURES = [
  {
    icon: Zap,
    title: "AI-Powered Checking",
    desc: "Each document is analyzed by a dedicated AI agent trained on CSO checking guidelines.",
  },
  {
    icon: ShieldCheck,
    title: "Cross-Document Coherence",
    desc: "Detects inconsistencies between your AFORM, PPR, and supporting documents.",
  },
  {
    icon: AlertTriangle,
    title: "Major vs Minor Issues",
    desc: "Issues are classified by severity so you know what will cause a pend vs what's advisory.",
  },
  {
    icon: CheckCircle,
    title: "Downloadable Checklist",
    desc: "Get a formatted corrections checklist you can share with your org.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dlsu-green-muted">
      {/* Header */}
      <header className="bg-dlsu-green text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-dlsu-green font-black text-lg">G</span>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">GoCheck</h1>
              <p className="text-green-200 text-xs">CSO Document Checker · DLSU Manila</p>
            </div>
          </div>
          <Link href="/upload" className="btn-secondary text-sm py-2 px-4">
            Start Checking →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-dlsu-green text-white pb-24 pt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-dlsu-gold rounded-full animate-pulse" />
            Powered by AI · Built for DLSU Manila Organizations
          </div>
          <h2 className="text-5xl font-black mb-6 leading-tight">
            Stop Getting Pended.
            <br />
            <span className="text-dlsu-gold">Check Before You Submit.</span>
          </h2>
          <p className="text-green-100 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload your CSO pre-activity documents and get an instant corrections checklist —
            before you submit to APS.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-dlsu-gold text-dlsu-green-dark
                       font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-300
                       active:scale-95 transition-all shadow-xl"
          >
            Check My Documents
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Supported documents */}
      <section className="max-w-6xl mx-auto px-4 -mt-12">
        <div className="card p-6">
          <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Supported Documents
          </p>
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map((d) => (
              <span
                key={d}
                className="px-3 py-1.5 bg-dlsu-green-muted text-dlsu-green text-sm
                           font-medium rounded-lg border border-green-200"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-10">
          How GoCheck Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 flex gap-4">
              <div className="w-12 h-12 bg-dlsu-green-muted rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="text-dlsu-green" size={22} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-dlsu-green text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-10">Three Steps to Fewer Pends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload", desc: "Upload your PDF documents and tag each one with its document type." },
              { step: "02", title: "Check", desc: "Our AI agents review each document against official CSO checking guidelines." },
              { step: "03", title: "Fix", desc: "Download your corrections checklist and apply the fixes before submitting." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="text-dlsu-gold text-5xl font-black mb-3">{step}</div>
                <h4 className="font-bold text-xl mb-2">{title}</h4>
                <p className="text-green-200 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-dlsu-gold text-dlsu-green-dark
                         font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-300 transition-all"
            >
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dlsu-green-dark text-green-300 py-8 text-center text-sm">
        <div className="max-w-4xl mx-auto px-4">
          <p className="font-semibold text-white mb-1">GoCheck</p>
          <p>An unofficial tool for DLSU Manila student organizations. Not affiliated with CSO or APS.</p>
          <p className="mt-2 text-green-400">Built with 💚 for Lasallians</p>
        </div>
      </footer>
    </div>
  );
}
