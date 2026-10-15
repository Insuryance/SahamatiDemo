import React, { useEffect, useReducer, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCheck,
  ShieldCheck,
  Shield,
  HeartPulse,
  Heart,
  Landmark,
  FileText,
  Fingerprint,
  Users,
  Activity,
  LayoutDashboard,
  Layers3,
  BookOpen,
  Bell,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Link2,
  LockKeyhole,
  CircleCheck,
  CircleDashed,
  RefreshCw,
  Play,
  Sparkles,
  Download,
  CircleHelp,
  AlertTriangle,
  Clock3,
  Zap,
  Settings2,
  CreditCard,
  CheckCircle2,
  Menu,
  Search,
  ExternalLink,
  Leaf,
  Workflow,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  STEPS,
  SOURCES,
  SCENARIOS,
  PLANS,
  money,
  initialState,
  reducer,
  recommendation,
  hasSource,
  getPremium,
  issuanceGates,
} from "./domain.js";
const ICONS = {
  bank: Landmark,
  shield: ShieldCheck,
  heart: HeartPulse,
  file: FileText,
};
const STORAGE = "finlead-health-competition-v1";
function readState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE));
    return s?.version === 1 &&
      SCENARIOS[s.scenario] &&
      s.sources &&
      s.profile &&
      Array.isArray(s.audit) &&
      s.step >= 0 &&
      s.step <= 7 &&
      PLANS.some((p) => p.id === s.selected)
      ? s
      : initialState();
  } catch {
    return initialState();
  }
}
function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
function Badge({ children, tone = "green" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function IconBox({ icon: Icon, tone = "", small = false }) {
  return (
    <div className={`icon-box ${tone} ${small ? "small" : ""}`}>
      <Icon size={small ? 17 : 21} strokeWidth={1.7} />
    </div>
  );
}
function CheckRow({ children, pass = true }) {
  return (
    <div className={`check-row ${pass ? "" : "pending"}`}>
      {pass ? <CircleCheck size={17} /> : <CircleDashed size={17} />}
      <span>{children}</span>
    </div>
  );
}
function Panel({ title, subtitle, right, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
function Modal({ title, eyebrow, children, close, wide = false }) {
  const container = React.useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current?.querySelector("button")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const els = [
          ...container.current.querySelectorAll(
            "button,input,select,a,textarea",
          ),
        ].filter((x) => !x.disabled);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        ref={container}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [s, dispatch] = useReducer(reducer, undefined, readState);
  const [view, setView] = useState("journey");
  const [modal, setModal] = useState(null);
  const [consentKeys, setConsentKeys] = useState([]);
  const [guide, setGuide] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [compare, setCompare] = useState(true);
  const [outcome, setOutcome] = useState("scenario");
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(s));
    } catch {}
  }, [s]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  const scenario = SCENARIOS[s.scenario];
  const connectedCount = Object.values(s.sources).filter(
    (x) => x === "connected",
  ).length;
  const recommended = recommendation(s);
  const plan = PLANS.find((p) => p.id === s.selected);
  const go = (step) => {
    dispatch({ type: "NAVIGATE", step });
    setView("journey");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const act = (action) => {
    dispatch(action);
    if (
      [
        "START",
        "CONFIRM_RECORDS",
        "PROPOSE",
        "SUBMIT",
        "TO_UNDERWRITING",
        "TO_ACCEPTANCE",
        "ISSUE",
      ].includes(action.type)
    )
      window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = (key = s.scenario) => {
    dispatch({ type: "RESET", scenario: key });
    setOutcome("scenario");
    setView("journey");
    setModal(null);
    setGuide(false);
    setToast("The demo has been reset");
  };
  const openConsent = (keys) => {
    setConsentKeys(keys);
    setModal("consent");
  };
  const download = (name, text, type = "text/plain") => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportCase = () =>
    download(
      "finlead-demo-case.json",
      JSON.stringify(
        {
          disclosure:
            "Fictional competition demo. No real insurer decision, connected API, payment or cover.",
          ...s,
        },
        null,
        2,
      ),
      "application/json",
    );
  const navigate = (name) => {
    setView(name);
    setMenu(false);
  };
  const stageTitles = [
    [
      "Tell us about your family",
      "We’ll use these details to compare cover for your family.",
    ],
    [
      "Choose which records to share",
      "Sharing records is optional. You can continue using the details you provide.",
    ],
    [
      "Compare your cover options",
      "See why each plan might suit your family and how it fits your budget.",
    ],
    [
      "Review your proposal",
      "Check your details before submitting. Any new medical reports will be requested after submission.",
    ],
    [
      "Check your health records",
      "We’ll check existing reports first and ask only for anything that’s missing.",
    ],
    [
      "Review the insurer’s decision",
      "The insurer decides whether to accept the proposal and on what terms. This decision is simulated.",
    ],
    [
      "Review and accept your offer",
      "Check the final price and terms before accepting the offer and confirming payment.",
    ],
    [
      "Your demo policy is ready",
      "You’ve completed the demo. You can now download the sample certificate.",
    ],
  ];
  return (
    <div className="app-shell">
      {menu && <div className="mobile-scrim" onClick={() => setMenu(false)} />}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("journey");
          }}
        >
          <div className="brand-symbol">
            f<span />
          </div>
          <span>
            finlead<span className="brand-dot">.</span>
            <small>HEALTH COVER, EXPLAINED</small>
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="nav-list">
          {[
            ["journey", HeartPulse, "Health journey"],
            ["records", FileText, "Records & permissions"],
            ["operations", LayoutDashboard, "Operations"],
            ["architecture", Layers3, "How it works"],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "journey" && <span className="nav-dot" />}
              {id === "operations" && (
                <span className="nav-count">
                  {s.evidence === "conflict" ||
                  s.decision === "review" ||
                  s.issuance === "failed"
                    ? 1
                    : 0}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-journey">
          <div className="workspace-label">
            YOUR PROGRESS{" "}
            <span>
              {s.issuance === "issued"
                ? "100"
                : Math.round((s.maxStep / 8) * 100)}
              %
            </span>
          </div>
          <div className="mini-progress">
            <span
              style={{
                width: `${s.issuance === "issued" ? 100 : (s.maxStep / 8) * 100}%`,
              }}
            />
          </div>
          {STEPS.map((label, i) => (
            <button
              key={label}
              className={`side-step ${s.step === i && view === "journey" ? "current" : ""} ${s.maxStep > i || s.issuance === "issued" ? "complete" : ""}`}
              disabled={i > s.maxStep}
              onClick={() => go(i)}
            >
              <span>
                {s.maxStep > i || s.issuance === "issued" ? (
                  <Check size={12} />
                ) : (
                  i + 1
                )}
              </span>
              {label}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="demo-box">
            <span className="little-star">
              <Sparkles size={18} />
            </span>
            <strong>Presenting the demo?</strong>
            <p>Follow the three-minute guide to show how the journey works.</p>
            <button onClick={() => setModal("guide")}>
              Open demo guide <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="profile-switch" onClick={() => setModal("about")}>
            <div className="avatar navy">AS</div>
            <span>
              <strong>{s.profile.name}</strong>
              <small>Personal workspace</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {view === "journey"
                ? "Health journey"
                : view === "records"
                  ? "Records & permissions"
                  : view === "operations"
                    ? "Operations"
                    : "How it works"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-badge">
              <span />
              Competition demo
            </span>
            <button
              className="icon-button"
              onClick={() => setModal("activity")}
              aria-label="View activity"
            >
              <Bell size={18} />
              {s.audit.length > 1 && <i className="notification-dot" />}
            </button>
            <div className="topbar-divider" />
            <div className="avatar">AS</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                FINLEAD HEALTH JOURNEY <span className="tiny-dot" /> CASE
                FL-2026-0842
              </div>
              <h1>
                {view === "journey"
                  ? s.step === 0
                    ? "Your family’s health cover"
                    : STEPS[s.step]
                  : view === "records"
                    ? "Your records and permissions"
                    : view === "operations"
                      ? "Case status and review tasks"
                      : "How the demo works"}
              </h1>
              <p>
                {view === "journey"
                  ? "Check your existing cover and see what your family needs next."
                  : view === "records"
                    ? "See where each record came from, what you agreed to share and what’s missing."
                    : view === "operations"
                      ? "Review the case history, outstanding tasks and checks needed before a policy can be issued."
                      : "See how records, customer choices and insurer decisions fit together."}
              </p>
            </div>
            <div className="heading-actions">
              <Button variant="secondary" onClick={() => setModal("scenarios")}>
                <Settings2 size={16} />
                Demo scenarios
              </Button>
              <Button variant="dark" onClick={() => setModal("guide")}>
                <Play size={14} fill="currentColor" />
                Demo guide
              </Button>
            </div>
          </div>
          {view === "journey" && (
            <>
              {s.closed ? (
                <div className="closure panel">
                  <IconBox icon={FileText} />
                  <h2>{s.closed}</h2>
                  <p>
                    This demo case is closed.{" "}
                    {s.payment === "refund-pending"
                      ? "The simulated refund is waiting to be confirmed."
                      : "No payment was collected."}
                  </p>
                  <Button onClick={() => reset()}>
                    Start a new case <ArrowRight size={16} />
                  </Button>
                </div>
              ) : (
                <>
                  {s.step === 0 && (
                    <section className="hero">
                      <div className="hero-copy">
                        <div className="hero-kicker">
                          <span />
                          START WITH YOUR EXISTING COVER
                        </div>
                        <h2>
                          Choose health cover
                          <br />
                          with your whole family in mind.
                        </h2>
                        <p>
                          Check who your current policy covers and compare your
                          options.
                          <br className="desktop-break" /> You’ll see the costs
                          and what needs to happen before cover starts.
                        </p>
                        <div className="hero-points">
                          <span>
                            <ShieldCheck size={16} />
                            You choose what to share
                          </span>
                          <span>
                            <Heart size={16} />
                            Your family’s needs come first
                          </span>
                        </div>
                      </div>
                      <div className="hero-art" aria-hidden="true">
                        <div className="orbit orbit-one" />
                        <div className="orbit orbit-two" />
                        <div className="art-glow" />
                        <div className="art-shield">
                          <ShieldCheck size={77} strokeWidth={1} />
                        </div>
                        <div className="floating-pill pill-one">
                          <div className="floating-icon">
                            <HeartPulse size={19} />
                          </div>
                          <span>
                            Your family
                            <strong>2 adults, 1 child</strong>
                          </span>
                        </div>
                        <div className="floating-pill pill-two">
                          <CircleCheck size={20} />
                          <span>See what happens next</span>
                        </div>
                        <span className="spark spark-one">+</span>
                        <span className="spark spark-two">+</span>
                      </div>
                    </section>
                  )}
                  <div className="journey-strip">
                    {[
                      ["01", "Understand", "Your family & records"],
                      ["02", "Choose", "Compare cover options"],
                      ["03", "Review", "Reports & insurer review"],
                      ["04", "Protect", "Final terms & policy"],
                    ].map(([num, title, sub], i) => {
                      const group =
                        s.step < 2 ? 0 : s.step < 4 ? 1 : s.step < 6 ? 2 : 3;
                      return (
                        <div
                          key={num}
                          className={`journey-phase ${group === i ? "active" : ""} ${group > i ? "done" : ""}`}
                        >
                          <span className="phase-number">
                            {group > i ? <Check size={16} /> : num}
                          </span>
                          <div>
                            <strong>{title}</strong>
                            <small>{sub}</small>
                          </div>
                          {i < 3 && <ChevronRight size={15} />}
                        </div>
                      );
                    })}
                  </div>
                  {guide && (
                    <div className="guided-banner">
                      <Play size={17} />
                      <div>
                        <strong>
                          Presenter mode ·{" "}
                          {s.step < 2
                            ? "0:00–0:35 · The family"
                            : s.step < 4
                              ? "0:35–1:20 · What AA records reveal"
                              : s.step < 6
                                ? "1:20–2:10 · Evidence & decision"
                                : "2:10–3:00 · Final checks & policy"}
                        </strong>
                        <span>
                          {
                            [
                              "Confirm the family’s details, then connect the suggested sample records.",
                              "Use “Connect sample records”, then point out that the employer policy excludes the child.",
                              "Compare what the family told us with the AA records. Explain why the recommendation changes.",
                              "Submit the proposal. No new medical evidence was requested before this point.",
                              "Check the existing health report. Reuse it if it meets the requirements, or show the missing-report request.",
                              "Run the simulated insurer review and show the reason for its decision.",
                              "Accept the final terms, confirm the sample payment and issue the demo policy.",
                              "Show the completed checks, then try the “No connected records” scenario.",
                            ][s.step]
                          }
                        </span>
                      </div>
                      <button
                        className="icon-button"
                        aria-label="Close presenter mode"
                        onClick={() => setGuide(false)}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  )}
                  <div className="section-intro">
                    <div>
                      <h2>{stageTitles[s.step][0]}</h2>
                      <p>{stageTitles[s.step][1]}</p>
                    </div>
                    <span className="step-caption">
                      STEP {String(s.step + 1).padStart(2, "0")} OF 08
                    </span>
                  </div>
                  {s.step === 0 && (
                    <Profile s={s} dispatch={dispatch} act={act} />
                  )}
                  {s.step === 1 && (
                    <div className="content-grid records-layout">
                      <div>
                        <div className="source-grid">
                          {Object.entries(SOURCES).map(([key, source]) => {
                            const Icon = ICONS[source.icon];
                            const status = s.sources[key];
                            return (
                              <section className="source-card" key={key}>
                                <div className="source-head">
                                  <IconBox
                                    icon={Icon}
                                    tone={
                                      key === "abdm"
                                        ? "lilac"
                                        : key === "bank"
                                          ? "blue"
                                          : ""
                                    }
                                  />
                                  <Badge
                                    tone={
                                      status === "connected"
                                        ? "green"
                                        : status === "disconnected"
                                          ? "gray"
                                          : "amber"
                                    }
                                  >
                                    {status === "disconnected"
                                      ? "Optional"
                                      : status === "error"
                                        ? "Unavailable"
                                        : status.charAt(0).toUpperCase() +
                                          status.slice(1)}
                                  </Badge>
                                </div>
                                <h3>{source.name}</h3>
                                <p>{source.subtitle}</p>
                                {status === "connected" ? (
                                  <>
                                    <div className="source-facts">
                                      {source.facts.map((x) => (
                                        <div key={x}>
                                          <Check size={13} />
                                          {x}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="source-card-footer">
                                      <span>
                                        <LockKeyhole size={12} />
                                        Permission recorded
                                      </span>
                                      <button
                                        className="text-button muted"
                                        disabled={s.submitted}
                                        onClick={() =>
                                          dispatch({
                                            type: "SOURCE",
                                            key,
                                            status: "revoked",
                                          })
                                        }
                                      >
                                        Stop sharing
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="source-detail">
                                      {status === "disconnected"
                                        ? key === "abdm"
                                          ? "Share linked health reports with separate permission. An ABHA ID alone does not give access to records."
                                          : key === "care"
                                            ? "If you have dealt with Insurance A before, choose whether to share your previous policy or medical records."
                                            : key === "bank"
                                              ? "Check regular income and expenses to understand your budget. Banking data is never used to assess your health."
                                              : "Check which family members and benefits are actually covered."
                                        : status === "error"
                                          ? "This sample connection didn’t respond. Try again or continue with the details you provide."
                                          : "We aren’t using records from this source. You can continue with the details you provide."}
                                    </p>
                                    <div className="source-card-footer">
                                      <button
                                        className="text-button"
                                        disabled={s.submitted}
                                        onClick={() => openConsent([key])}
                                      >
                                        {status === "error"
                                          ? "Retry connection"
                                          : "Connect records"}{" "}
                                        <ArrowUpRight size={14} />
                                      </button>
                                      <select
                                        aria-label={`${source.name} fallback state`}
                                        value={status}
                                        disabled={s.submitted}
                                        onChange={(e) =>
                                          dispatch({
                                            type: "SOURCE",
                                            key,
                                            status: e.target.value,
                                          })
                                        }
                                      >
                                        <option value="disconnected">
                                          Try a missing-data case
                                        </option>
                                        <option value="declined">
                                          Declined
                                        </option>
                                        <option value="expired">Expired</option>
                                        <option value="error">
                                          Unavailable
                                        </option>
                                        <option value="revoked">Revoked</option>
                                      </select>
                                    </div>
                                  </>
                                )}
                              </section>
                            );
                          })}
                        </div>
                        <div className="notice">
                          <ShieldCheck size={18} />
                          <p>
                            <strong>We still need to check each record.</strong>{" "}
                            We check who it belongs to, its date and whether it
                            contains the information needed.
                          </p>
                        </div>
                      </div>
                      <div className="right-column">
                        <Panel
                          title="What your records help us check"
                          subtitle="Existing records can save you from entering the same details again."
                        >
                          <div className="connection-count">
                            <strong>
                              {connectedCount}
                              <small>/ 4</small>
                            </strong>
                            <span>sources connected</span>
                          </div>
                          <div className="divider" />
                          <CheckRow pass={hasSource(s, "bank")}>
                            Budget checked against income and expenses
                          </CheckRow>
                          <CheckRow pass={hasSource(s, "policy")}>
                            Who your current policy covers
                          </CheckRow>
                          <CheckRow
                            pass={hasSource(s, "abdm") || hasSource(s, "care")}
                          >
                            Previous health reports available
                          </CheckRow>
                          <div className="soft-note">
                            Bank records help check your budget. Policy records
                            show your cover. Health reports support the
                            insurer’s review.
                          </div>
                          {!s.submitted && scenario.sources.length > 0 && (
                            <Button
                              variant="secondary"
                              className="full"
                              onClick={() => openConsent(scenario.sources)}
                            >
                              <Link2 size={16} />
                              Connect sample records
                            </Button>
                          )}
                        </Panel>
                        <div className="tip-card">
                          <Leaf size={21} />
                          <div>
                            <strong>You can continue without records</strong>
                            <p>
                              We’ll use the details you provide and ask for any
                              required reports after you submit.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="action-footer">
                        <span>
                          <LockKeyhole size={14} />
                          Sample records only. No real accounts are connected.
                        </span>
                        <Button
                          onClick={() => act({ type: "CONFIRM_RECORDS" })}
                        >
                          Confirm details & see options <ArrowRight size={17} />
                        </Button>
                      </div>
                    </div>
                  )}
                  {s.step === 2 && (
                    <>
                      <div className="comparison-heading">
                        <div>
                          <span className="mini-label">
                            WHAT THE RECORDS SHOW
                          </span>
                          <h3>What changes when we check the AA records?</h3>
                        </div>
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={compare}
                            onChange={(e) => setCompare(e.target.checked)}
                          />
                          <span className="switch" />
                          Show the family’s starting details
                        </label>
                      </div>
                      <div
                        className={`comparison-grid ${compare ? "" : "single"}`}
                      >
                        {compare && (
                          <div className="comparison-card before">
                            <div className="comparison-label">
                              <CircleDashed size={17} />
                              What the family told us
                            </div>
                            <h3>
                              {money(
                                recommendation(s, true).plan.cover * 100000,
                              )}{" "}
                              <span>suggested cover</span>
                            </h3>
                            <p>
                              “We have ₹5 lakh of family cover through work.”
                            </p>
                            <div className="comparison-fact">
                              <Users size={17} />
                              <span>
                                We haven’t confirmed which family members are
                                covered
                              </span>
                            </div>
                            <div className="comparison-fact">
                              <Landmark size={17} />
                              <span>
                                Monthly budget · {money(s.profile.budget)}{" "}
                                declared
                              </span>
                            </div>
                            <div className="comparison-bottom">
                              These details still need to be checked
                            </div>
                          </div>
                        )}
                        <div className="comparison-card after">
                          <div className="comparison-label">
                            <Sparkles size={17} />
                            {hasSource(s, "policy") || hasSource(s, "bank")
                              ? "What the AA records show"
                              : "Using the details you provided"}
                            <Badge>
                              {hasSource(s, "policy")
                                ? "Gap identified"
                                : "Fallback active"}
                            </Badge>
                          </div>
                          <h3>
                            {money(recommended.plan.cover * 100000)}{" "}
                            <span>suggested cover</span>
                          </h3>
                          <p>{recommended.reason}</p>
                          <div className="comparison-fact">
                            <Users size={17} />
                            <span>
                              {hasSource(s, "policy")
                                ? "Anaya is not included in the employer floater"
                                : "The proposed plan includes all three family members"}
                            </span>
                          </div>
                          <div className="comparison-fact">
                            <Landmark size={17} />
                            <span>
                              {hasSource(s, "bank")
                                ? `Cash-flow facts support up to ${money(recommended.monthlyBudget)}/month`
                                : `Using your declared ${money(s.profile.budget)}/month budget`}
                            </span>
                          </div>
                          <div className="comparison-bottom">
                            {hasSource(s, "policy")
                              ? "Source: AA sample policy · member schedule · 21 Sep 2026"
                              : "Source: customer declarations · subject to confirmation"}
                          </div>
                        </div>
                      </div>
                      <div className="assessment-row">
                        <div>
                          <span>01</span>
                          <div>
                            <strong>Protection need</strong>
                            <p>Separate family cover for all three members.</p>
                          </div>
                        </div>
                        <div>
                          <span>02</span>
                          <div>
                            <strong>Budget fit</strong>
                            <p>
                              {money(recommended.monthlyBudget)}/month available
                              for cover.
                            </p>
                          </div>
                        </div>
                        <div>
                          <span>03</span>
                          <div>
                            <strong>Product suitability</strong>
                            <p>Compare benefits and final insurer terms.</p>
                          </div>
                        </div>
                      </div>
                      <div className="plans-grid">
                        {PLANS.map((p) => (
                          <button
                            key={p.id}
                            className={`plan-card ${s.selected === p.id ? "selected" : ""}`}
                            onClick={() =>
                              dispatch({ type: "SELECT_PLAN", id: p.id })
                            }
                            disabled={s.submitted}
                          >
                            <div className="plan-top">
                              <span>
                                {p.id === recommended.plan.id ? (
                                  <>
                                    <Sparkles size={13} />
                                    RECOMMENDED
                                  </>
                                ) : (
                                  "ILLUSTRATIVE PLAN"
                                )}
                              </span>
                              {s.selected === p.id ? (
                                <CircleCheck size={19} />
                              ) : (
                                <CircleDashed size={19} />
                              )}
                            </div>
                            <h3>{p.name}</h3>
                            <div className="plan-cover">
                              ₹{p.cover} lakh <span>family cover</span>
                            </div>
                            <p className="plan-tag">{p.tag}</p>
                            <div className="divider" />
                            {p.features.map((f) => (
                              <CheckRow key={f}>{f}</CheckRow>
                            ))}
                            <div className="plan-price">
                              <strong>
                                {money(p.premium / 12)}
                                <small>/month</small>
                              </strong>
                              <span>{money(p.premium)} billed annually</span>
                            </div>
                            {p.premium / 12 > recommended.monthlyBudget && (
                              <div className="budget-warning">
                                Above your stated monthly budget
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="notice">
                        <CircleHelp size={18} />
                        <p>
                          These are fictional plan names, benefits and all-in
                          prices for the demo. Illustrative terms: 30-day
                          initial waiting period, 36-month pre-existing
                          condition waiting period, cosmetic procedures
                          excluded. Final terms require an insurer quote.
                          Preliminary eligibility is based on declarations only.
                        </p>
                      </div>
                      <div className="action-footer">
                        <button
                          className="text-button muted"
                          onClick={() => go(1)}
                        >
                          <ArrowLeft size={15} />
                          Review your records
                        </button>
                        <Button onClick={() => act({ type: "PROPOSE" })}>
                          Continue with {plan.name}
                          <ArrowRight size={17} />
                        </Button>
                      </div>
                    </>
                  )}
                  {s.step === 3 && <Proposal s={s} plan={plan} act={act} />}
                  {s.step === 4 && <Evidence s={s} act={act} />}
                  {s.step === 5 && (
                    <div className="content-grid">
                      <Panel
                        title="Insurer review"
                        subtitle="Simulated decision service · Demo rules v1"
                        right={<Badge tone="lilac">Insurer-owned</Badge>}
                      >
                        <div className="assessment-checks">
                          <CheckRow>
                            Proposal and health details confirmed
                          </CheckRow>
                          <CheckRow>
                            Health reports checked for the selected plan
                          </CheckRow>
                          <CheckRow>
                            Records and the rules used are saved in the case
                            history
                          </CheckRow>
                          <CheckRow
                            pass={s.reviewResolved || s.scenario !== "conflict"}
                          >
                            Outstanding issues resolved by the assigned reviewer
                          </CheckRow>
                        </div>
                        {!s.decision ? (
                          <>
                            <div className="soft-note">
                              Finlead tracks the case and requests missing
                              information. The insurer’s approved rules and
                              authorised reviewers decide the outcome.
                            </div>
                            <label className="field-label">
                              Choose a demo outcome
                              <select
                                value={outcome}
                                onChange={(e) => setOutcome(e.target.value)}
                              >
                                <option value="scenario">
                                  Use scenario outcome ({scenario.outcome})
                                </option>
                                <option value="approve">Approve</option>
                                <option value="revise">Revise premium</option>
                                <option value="review">
                                  Refer to underwriter
                                </option>
                                <option value="postpone">Postpone</option>
                                <option value="decline">Decline</option>
                              </select>
                            </label>
                            <Button
                              className="full"
                              onClick={() =>
                                act({
                                  type: "DECIDE",
                                  outcome:
                                    outcome === "scenario"
                                      ? undefined
                                      : outcome,
                                })
                              }
                            >
                              Run sample insurer decision <Zap size={16} />
                            </Button>
                          </>
                        ) : (
                          <div
                            className={`decision-result ${["decline", "postpone", "review"].includes(s.decision) ? "amber-result" : ""}`}
                          >
                            <IconBox
                              icon={
                                ["approve", "revise"].includes(s.decision)
                                  ? ShieldCheck
                                  : Clock3
                              }
                            />
                            <h2>
                              {
                                {
                                  approve: "Approved in this demo",
                                  revise: "The insurer has changed the offer",
                                  review: "An underwriter will review this",
                                  postpone: "More information is needed",
                                  decline: "Proposal declined in this demo",
                                }[s.decision]
                              }
                            </h2>
                            <p>
                              {
                                {
                                  approve:
                                    "This proposal meets the demo rules. You still need to accept the final terms and confirm the sample payment.",
                                  revise:
                                    "The sample insurer increased the premium by 10%. Review the new price and decide whether to accept it.",
                                  review:
                                    "Priya S. from the sample underwriting team needs to review this case. The target response time is one working day.",
                                  postpone:
                                    "The sample insurer needs updated reports in 30 days. The operations team has a reminder to follow up.",
                                  decline:
                                    "The proposal falls outside the fictional acceptance rules. No real eligibility assessment has been made. No payment was collected.",
                                }[s.decision]
                              }
                            </p>
                            {s.decision === "review" && (
                              <Button
                                onClick={() =>
                                  act({ type: "RESOLVE_REFERRAL" })
                                }
                              >
                                Simulate authorised reviewer approval
                              </Button>
                            )}
                            {s.decision === "postpone" && (
                              <div className="button-row">
                                <Button onClick={() => act({ type: "RESUME" })}>
                                  Simulate follow-up & reopen
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    act({
                                      type: "CLOSE",
                                      reason: "Postponed case closed",
                                    })
                                  }
                                >
                                  Close case
                                </Button>
                              </div>
                            )}
                            {s.decision === "decline" && (
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  act({
                                    type: "CLOSE",
                                    reason: "Declined case closed",
                                  })
                                }
                              >
                                Acknowledge & close
                              </Button>
                            )}
                          </div>
                        )}
                      </Panel>
                      <div className="right-column">
                        <Panel title="Decision trace">
                          <Audit entries={s.audit.slice(-4)} />
                        </Panel>
                        <div className="tip-card">
                          <Eye size={21} />
                          <div>
                            <strong>See how the decision was made</strong>
                            <p>
                              The case history includes the records, rules and
                              reviewer decisions used.
                            </p>
                          </div>
                        </div>
                      </div>
                      {["approve", "revise"].includes(s.decision) && (
                        <div className="action-footer">
                          <span>
                            <Shield size={15} />
                            Approval alone does not start coverage.
                          </span>
                          <Button
                            onClick={() => act({ type: "TO_ACCEPTANCE" })}
                          >
                            Review final terms <ArrowRight size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {s.step === 6 && <Acceptance s={s} plan={plan} act={act} />}
                  {s.step === 7 && (
                    <div className="content-grid">
                      <section className="policy-certificate">
                        <div className="certificate-top">
                          <span className="brand-text">finlead.</span>
                          <Badge>DEMO CERTIFICATE</Badge>
                        </div>
                        <div className="certificate-icon">
                          <ShieldCheck size={40} strokeWidth={1.5} />
                        </div>
                        <h2>
                          Your demo policy
                          <br />
                          is ready to download.
                        </h2>
                        <p>
                          You’ve completed every step in the sample journey.
                        </p>
                        <div className="certificate-details">
                          <div>
                            <small>DEMO POLICY NUMBER</small>
                            <strong>FL-DEMO-0842</strong>
                          </div>
                          <div>
                            <small>FAMILY COVER</small>
                            <strong>₹{plan.cover} lakh</strong>
                          </div>
                          <div>
                            <small>POLICYHOLDER</small>
                            <strong>{s.profile.name}</strong>
                          </div>
                          <div>
                            <small>ANNUAL PREMIUM</small>
                            <strong>{money(getPremium(s))}</strong>
                          </div>
                          <div>
                            <small>ILLUSTRATIVE PERIOD</small>
                            <strong>23 Sep 2026 – 22 Sep 2027</strong>
                          </div>
                          <div>
                            <small>MEMBERS</small>
                            <strong>Aarav, Meera & Anaya</strong>
                          </div>
                        </div>
                        <div className="certificate-disclaimer">
                          FICTIONAL DEMO · NOT AN INSURANCE POLICY · NO ACTUAL
                          COVERAGE
                        </div>
                        <Button
                          variant="dark"
                          onClick={() =>
                            download(
                              "finlead-demo-certificate.txt",
                              `FINLEAD — FICTIONAL DEMO CERTIFICATE\nNOT AN INSURANCE POLICY. NO ACTUAL COVERAGE.\n\nReference: FL-DEMO-0842\nPolicyholder: ${s.profile.name}\nMembers: Aarav, Meera, Anaya\nSample plan: ${plan.name}\nIllustrative family cover: INR ${plan.cover * 100000}\nIllustrative annual premium: INR ${getPremium(s)}\nIllustrative period: 23 Sep 2026 – 22 Sep 2027\n\nAll five issuance gates passed in simulation. No money charged.\nIllustrative terms: 30-day initial waiting period; 36-month pre-existing condition waiting period; cosmetic procedures excluded.\nReal cover requires an insurer-issued policy and its actual terms.`,
                            )
                          }
                        >
                          <Download size={16} />
                          Download demo certificate
                        </Button>
                      </section>
                      <div className="right-column">
                        <Panel
                          title="All required checks passed"
                          right={
                            <CheckCheck size={21} className="green-text" />
                          }
                        >
                          {issuanceGates(s).map((g) => (
                            <CheckRow key={g.label} pass={g.pass}>
                              {g.label}
                            </CheckRow>
                          ))}
                          <CheckRow>Demo policy issued</CheckRow>
                        </Panel>
                        <Panel title="What happens next">
                          <p className="body-copy">
                            In a real journey, the insurer would provide the
                            policy document, actual cover start date, waiting
                            periods and any remaining obligations.
                          </p>
                          <Button
                            variant="secondary"
                            className="full"
                            onClick={exportCase}
                          >
                            <Download size={16} />
                            Download case history
                          </Button>
                        </Panel>
                        <Button
                          variant="quiet"
                          onClick={() => setModal("scenarios")}
                        >
                          <RefreshCw size={16} />
                          Try another scenario
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {view === "records" && (
            <>
              <div className="metrics-row">
                <Metric
                  label="Connected sources"
                  value={`${connectedCount} / 4`}
                  detail="You choose permission for each source"
                  icon={Link2}
                />
                <Metric
                  label="Evidence status"
                  value={
                    s.evidence === "ready"
                      ? "Validated"
                      : s.evidence === "unchecked"
                        ? "Not checked"
                        : "Needs action"
                  }
                  detail="New requests only after submission"
                  icon={FileText}
                />
                <Metric
                  label="Source trail"
                  value={s.audit.length}
                  detail="Events recorded in this demo"
                  icon={Fingerprint}
                />
              </div>
              <Panel
                title="Records and sharing permissions"
                subtitle="All records are samples. Records you stop sharing, or that aren’t available, are not used."
              >
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Purpose</th>
                        <th>Record date</th>
                        <th>Consent</th>
                        <th>Fact usage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SOURCES).map(([key, source]) => (
                        <tr key={key}>
                          <td>
                            <strong>{source.name}</strong>
                            <small>{source.provider}</small>
                          </td>
                          <td>{source.subtitle}</td>
                          <td>{hasSource(s, key) ? source.date : "—"}</td>
                          <td>
                            <Badge tone={hasSource(s, key) ? "green" : "gray"}>
                              {s.sources[key]}
                            </Badge>
                          </td>
                          <td>
                            {hasSource(s, key)
                              ? key === "abdm" &&
                                s.scenario === "conflict" &&
                                !s.reviewResolved
                                ? "Not used: belongs to a different person"
                                : "Available for the agreed use"
                              : "Not used · your details used instead"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="register-note">
                  <LockKeyhole size={17} />
                  <p>
                    Permission applies to this demo case until you stop sharing
                    or reset it. If you stop sharing, we exclude those records
                    and ask you to confirm your details again. Once submitted,
                    restart the demo to change permissions. No external records
                    are stored.
                  </p>
                </div>
              </Panel>
              <Panel
                title="Health evidence"
                subtitle="We check whose report it is, where it came from, its date and whether it meets the requirements."
                className="spaced-panel"
              >
                <div className="evidence-register-item">
                  <IconBox icon={FileText} tone="lilac" />
                  <div>
                    <strong>
                      {s.evidence === "ready"
                        ? "Validated sample health report"
                        : "Required health reports"}
                    </strong>
                    <p>
                      {!s.submitted
                        ? "We’ll check what reports are needed after you submit the proposal. No new report has been requested yet."
                        : s.evidence === "ready"
                          ? "Subject: Aarav Sharma · 12 Sep 2026 · Demo rules v1 · Complete for selected product"
                          : "Open the health records step to see what’s still needed."}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setView("journey");
                      if (s.maxStep >= 4) go(4);
                    }}
                  >
                    View journey <ArrowRight size={15} />
                  </Button>
                </div>
              </Panel>
            </>
          )}
          {view === "operations" && (
            <>
              <div className="metrics-row">
                <Metric
                  label="Case status"
                  value={
                    s.closed
                      ? "Closed"
                      : s.issuance === "issued"
                        ? "Issued"
                        : STEPS[s.maxStep]
                  }
                  detail="One sample case in this session"
                  icon={Workflow}
                />
                <Metric
                  label="Manual reviews"
                  value={
                    s.reviewResolved
                      ? "1 resolved"
                      : s.evidence === "conflict" || s.decision === "review"
                        ? "1 pending"
                        : "0"
                  }
                  detail="A named reviewer handles each issue"
                  icon={Users}
                />
                <Metric
                  label="Payment attempts"
                  value={s.chargeCount}
                  detail="Retry without a second sample charge"
                  icon={CreditCard}
                />
              </div>
              <div className="content-grid">
                <Panel
                  title="Case activity"
                  subtitle="See what happened and the reason for each step."
                  right={
                    <Button variant="quiet" onClick={exportCase}>
                      <Download size={15} />
                      Export
                    </Button>
                  }
                >
                  <Audit entries={[...s.audit].reverse()} />
                </Panel>
                <div className="right-column">
                  <Panel
                    title="Checks before issuing a policy"
                    subtitle="Every check must pass before a policy is issued."
                  >
                    {issuanceGates(s).map((g) => (
                      <CheckRow key={g.label} pass={g.pass}>
                        {g.label}
                      </CheckRow>
                    ))}
                  </Panel>
                  <Panel title="Exception queue">
                    {s.evidence === "conflict" ||
                    s.decision === "review" ||
                    s.issuance === "failed" ? (
                      <div className="exception">
                        <Badge tone="amber">Action required</Badge>
                        <h4>
                          {s.issuance === "failed"
                            ? "Issuance service unavailable"
                            : s.evidence === "conflict"
                              ? "Member identity mismatch"
                              : "Underwriter referral"}
                        </h4>
                        <p>
                          Owner:{" "}
                          {s.issuance === "failed"
                            ? "Policy operations"
                            : "Priya S. · Underwriting"}
                          <br />
                          Target:{" "}
                          {s.issuance === "failed"
                            ? "Retry on recovery"
                            : "1 working day"}
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            go(
                              s.issuance === "failed"
                                ? 6
                                : s.evidence === "conflict"
                                  ? 4
                                  : 5,
                            )
                          }
                        >
                          Open case action <ArrowRight size={15} />
                        </Button>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <CircleCheck size={29} />
                        <strong>No issues waiting for review</strong>
                        <p>Anything that needs a reviewer will appear here.</p>
                      </div>
                    )}
                  </Panel>
                  <div className="soft-note">
                    This prototype has no measured pilot results. A real pilot
                    would compare completion times, repeated requests and manual
                    reviews with a baseline group.
                  </div>
                </div>
              </div>
            </>
          )}
          {view === "architecture" && <Architecture />}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} />
              You decide what to share.
            </span>
            <span>
              Prototype · All data, quotes, decisions and payments are
              simulated.
            </span>
            <button onClick={() => setModal("about")}>
              About this demo <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
      {modal === "consent" && (
        <Modal
          title="Choose which records to share"
          eyebrow="YOUR PERMISSION MATTERS"
          close={() => setModal(null)}
        >
          <p className="modal-description">
            Let Finlead use these sample records for this case. The purpose of
            each source is listed below. No real account will be connected.
          </p>
          <div className="consent-list">
            {Object.entries(SOURCES).map(([key, source]) => (
              <label
                key={key}
                className={`consent-option ${consentKeys.includes(key) ? "checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={consentKeys.includes(key)}
                  onChange={(e) =>
                    setConsentKeys(
                      e.target.checked
                        ? [...consentKeys, key]
                        : consentKeys.filter((k) => k !== key),
                    )
                  }
                />
                <IconBox icon={ICONS[source.icon]} small />
                <span>
                  <strong>{source.name}</strong>
                  <small>{source.subtitle}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="consent-terms">
            <LockKeyhole size={17} />
            <p>
              Permission is for this demo case only. Use Stop sharing on a
              source card before submission to exclude its records. Banking data
              is never used to assess medical risk.
            </p>
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Not now
            </Button>
            <Button
              disabled={!consentKeys.length}
              onClick={() => {
                consentKeys.forEach((key) =>
                  dispatch({ type: "SOURCE", key, status: "connected" }),
                );
                setModal(null);
                setToast(
                  `${consentKeys.length} sample sources connected with consent`,
                );
              }}
            >
              Allow selected records <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {modal === "scenarios" && (
        <Modal
          title="Choose a demo scenario"
          eyebrow="DEMO SCENARIOS"
          wide
          close={() => setModal(null)}
        >
          <p className="modal-description">
            Each scenario starts a new sample case and clears your current
            progress.
          </p>
          <div className="scenario-grid">
            {Object.entries(SCENARIOS).map(([key, sc]) => (
              <button
                key={key}
                className={`scenario-card ${s.scenario === key ? "selected" : ""}`}
                onClick={() => reset(key)}
              >
                <div>
                  <Badge tone={key === "connected" ? "green" : "gray"}>
                    {sc.label}
                  </Badge>
                  <ArrowUpRight size={18} />
                </div>
                <h3>{sc.title}</h3>
                <p>{sc.description}</p>
                <span>
                  Load scenario <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <Button variant="quiet" onClick={() => reset()}>
              <RotateCcw size={15} />
              Reset current scenario
            </Button>
          </div>
        </Modal>
      )}
      {modal === "guide" && (
        <Modal
          title="Your three-minute demo guide"
          eyebrow="THE COMPETITION WALKTHROUGH"
          wide
          close={() => setModal(null)}
        >
          <div className="guide-chapters">
            {[
              [
                "0:00–0:35",
                "Meet the Sharma family",
                "Three family members. ₹3,000 monthly budget. A declared ₹5 lakh employer floater.",
              ],
              [
                "0:35–1:20",
                "Show what AA records reveal",
                "Connect sample records. The employer floater covers only the adults. Compare the changed cover recommendation.",
              ],
              [
                "1:20–2:10",
                "Submit and check existing reports",
                "Submit the proposal, check evidence, then run the sample insurer decision. Switch scenarios to show a targeted medical request.",
              ],
              [
                "2:10–3:00",
                "Complete the final checks",
                "Accept the final terms, confirm a sample payment and issue the demo policy. Open Operations to show the checks and case history.",
              ],
            ].map(([time, title, desc], i) => (
              <div key={time} className="guide-chapter">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <small>{time}</small>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="notice">
            <Eye size={18} />
            <p>
              <strong>Be clear about what’s simulated.</strong> The screens and
              workflow work. AA, ABDM, Insurer services, plan terms and insurer
              decisions use fixed sample data. There are no real integrations or
              measured pilot results.
            </p>
          </div>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setModal(null);
                setGuide(true);
                setView("journey");
              }}
            >
              Guide current case
            </Button>
            <Button
              onClick={() => {
                reset("connected");
                setGuide(true);
              }}
            >
              <Play size={15} />
              Start a fresh walkthrough
            </Button>
          </div>
        </Modal>
      )}
      {modal === "activity" && (
        <Modal
          title="Recent case activity"
          eyebrow="RECENT ACTIVITY"
          close={() => setModal(null)}
        >
          <Audit entries={[...s.audit].reverse().slice(0, 8)} />
        </Modal>
      )}
      {modal === "about" && (
        <Modal
          title="About this health cover demo"
          eyebrow="ABOUT THIS PROTOTYPE"
          close={() => setModal(null)}
        >
          <p className="modal-description">
            Built from the Finlead Autonomous Health Journey brief for a
            competition demonstration.
          </p>
          <div className="about-items">
            <CheckRow>
              Eight steps, from family details to a demo policy
            </CheckRow>
            <CheckRow>
              A comparison that shows how optional AA records change the
              recommendation
            </CheckRow>
            <CheckRow>
              Sample cases for missing reports, reviewer decisions and issuance
              retry
            </CheckRow>
            <CheckRow>
              Progress saved in your browser, with permissions and case history
              you can download
            </CheckRow>
          </div>
          <div className="soft-note">
            Everything is synthetic. There are no real integrations,
            insurer-approved products, medical decisions or financial
            transactions. The case is saved in this browser only and can be
            cleared by resetting.
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => reset()}>
              Clear & reset demo
            </Button>
            <Button onClick={() => setModal(null)}>Got it</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Profile({ s, dispatch, act }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="content-grid">
      <Panel
        title="Who needs cover?"
        subtitle="This sample case includes two adults and one child."
        right={
          <Badge tone="gray">
            <Users size={12} />3 members
          </Badge>
        }
      >
        <div className="family-row">
          {[
            ["AS", "Aarav", "You · 34 years", "mint"],
            ["MS", "Meera", "Spouse · 32 years", "peach"],
            ["AS", "Anaya", "Daughter · 6 years", "lilac"],
          ].map(([letters, name, detail, color]) => (
            <div className="family-member" key={name}>
              <div className={`family-avatar ${color}`}>
                {letters}
                <span>
                  <Check size={9} />
                </span>
              </div>
              <strong>{name}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </div>
        <div className="divider" />
        <div className="form-grid">
          <label className="field-label">
            Your full name
            <input
              value={s.profile.name}
              readOnly
              aria-label="Your full name (sample family)"
              maxLength={70}
              onChange={(e) =>
                dispatch({ type: "PROFILE", value: { name: e.target.value } })
              }
            />
          </label>
          <label className="field-label">
            Where you live
            <select
              value={s.profile.city}
              disabled={s.submitted}
              onChange={(e) =>
                dispatch({ type: "PROFILE", value: { city: e.target.value } })
              }
            >
              <option>Bengaluru</option>
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Pune</option>
              <option>Hyderabad</option>
            </select>
          </label>
        </div>
        <div className="budget-field">
          <div>
            <label htmlFor="budget">How much can you spend each month?</label>
            <p>We’ll also show the full amount you would pay each year.</p>
          </div>
          <div className="money-input">
            <span>₹</span>
            <input
              id="budget"
              type="number"
              min="500"
              max="20000"
              step="100"
              value={s.profile.budget}
              disabled={s.submitted}
              onChange={(e) =>
                dispatch({ type: "PROFILE", value: { budget: e.target.value } })
              }
            />
            <span>/ mo</span>
          </div>
        </div>
        <div className="declaration-box">
          <div>
            <FileText size={17} />
            <strong>What you’ve told us so far</strong>
            <Badge tone="gray">Sample family</Badge>
          </div>
          <p>
            ₹5 lakh of employer cover · No declared ongoing conditions · No
            personal family policy. These assumptions will be confirmed against
            available records.
          </p>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            I confirm the sample family details and health declarations for this
            demo.
          </span>
        </label>
        <div className="panel-action">
          <span>
            <Fingerprint size={15} />
            Identity verified in simulation
          </span>
          <Button
            disabled={
              !confirmed ||
              !s.profile.name.trim() ||
              Number(s.profile.budget) < 500
            }
            onClick={() => act({ type: "START" })}
          >
            Continue to records <ArrowRight size={17} />
          </Button>
        </div>
      </Panel>
      <div className="right-column">
        <Panel
          title="Your cover so far"
          subtitle="Based on the details you provided."
        >
          <div className="snapshot-cover">
            <div className="cover-ring">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            <span>
              DECLARED EXISTING COVER<strong>₹5 lakh</strong>
              <small>Employer family floater</small>
            </span>
          </div>
          <div className="snapshot-line">
            <span>Family members</span>
            <strong>2 adults, 1 child</strong>
          </div>
          <div className="snapshot-line">
            <span>Monthly budget</span>
            <strong>{money(s.profile.budget)}</strong>
          </div>
          <div className="snapshot-line">
            <span>Independent cover</span>
            <Badge tone="amber">Not yet</Badge>
          </div>
          <div className="snapshot-note">
            <CircleHelp size={16} />
            <p>
              Your employer’s policy may not cover every family member. We can
              check the member list in your policy records.
            </p>
          </div>
        </Panel>
        <div className="tip-card">
          <Leaf size={22} />
          <div>
            <strong>Avoid entering the same details twice</strong>
            <p>
              If you choose to share existing records, we can use them to fill
              in details we’d otherwise need to ask you for.
            </p>
          </div>
        </div>
        <div className="mini-trust">
          <LockKeyhole size={15} />
          <span>You choose which records to share.</span>
        </div>
      </div>
    </div>
  );
}
function Proposal({ s, plan, act }) {
  const [agree, setAgree] = useState(false);
  return (
    <div className="content-grid">
      <Panel
        title="Your proposal summary"
        subtitle="Check that these details are correct before you submit."
      >
        <div className="proposal-summary">
          <IconBox icon={ShieldCheck} />
          <div>
            <h3>{plan.name}</h3>
            <p>Illustrative family floater · 3 members</p>
          </div>
          <strong>₹{plan.cover} lakh</strong>
        </div>
        <div className="summary-lines">
          <div>
            <span>Proposer</span>
            <strong>{s.profile.name}</strong>
          </div>
          <div>
            <span>Insured members</span>
            <strong>Aarav, Meera & Anaya</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{s.profile.city}</strong>
          </div>
          <div>
            <span>Connected records</span>
            <strong>
              {Object.values(s.sources).filter((x) => x === "connected").length}{" "}
              sources with consent
            </strong>
          </div>
          <div>
            <span>Current health declaration</span>
            <strong>No ongoing conditions declared</strong>
          </div>
          <div>
            <span>Illustrative annual premium</span>
            <strong>{money(plan.premium)}</strong>
          </div>
        </div>
        <div className="soft-note">
          Sample terms: 30-day initial waiting period, 36-month pre-existing
          condition waiting period and cosmetic procedures excluded. Actual
          benefits, exclusions and eligibility require an insurer-approved
          product and quote.
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I confirm these demo declarations and understand that submission is
            subject to insurer assessment. Payment does not mean coverage.
          </span>
        </label>
        <div className="panel-action">
          <span>
            <LockKeyhole size={14} />
            No real purchase or payment
          </span>
          <Button
            disabled={!agree || s.submitted}
            onClick={() => act({ type: "SUBMIT" })}
          >
            Submit sample proposal <ArrowRight size={16} />
          </Button>
        </div>
      </Panel>
      <div className="right-column">
        <Panel title="What comes next">
          <div className="next-step">
            <span>1</span>
            <div>
              <strong>Check existing evidence</strong>
              <p>Check whether existing reports meet the requirements.</p>
            </div>
          </div>
          <div className="next-step">
            <span>2</span>
            <div>
              <strong>Request only what’s missing</strong>
              <p>See any missing reports in one checklist after submission.</p>
            </div>
          </div>
          <div className="next-step">
            <span>3</span>
            <div>
              <strong>Get the final insurer decision</strong>
              <p>Review and accept any revised terms.</p>
            </div>
          </div>
        </Panel>
        <div className="tip-card">
          <CircleHelp size={22} />
          <div>
            <strong>Review the offer before you commit</strong>
            <p>
              You must accept the final terms before payment can be confirmed
              and the policy issued.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
function Evidence({ s, act }) {
  return (
    <div className="content-grid">
      <Panel
        title="Your health report checklist"
        subtitle="Reports needed for the sample plan you selected."
        right={
          <Badge tone={s.evidence === "ready" ? "green" : "gray"}>
            {s.evidence === "ready"
              ? "Complete"
              : s.evidence === "unchecked"
                ? "Ready to check"
                : "Action needed"}
          </Badge>
        }
      >
        <div className="evidence-row">
          <IconBox icon={Fingerprint} />
          <div>
            <strong>Identity and family details</strong>
            <p>Sample identity and proposal declarations</p>
          </div>
          <Badge>Verified</Badge>
        </div>
        <div className="evidence-row">
          <IconBox icon={FileText} tone="lilac" />
          <div>
            <strong>Current health report</strong>
            <p>
              {s.evidence === "ready"
                ? "Matched subject · Recent date · Complete"
                : s.evidence === "conflict"
                  ? "Returned record belongs to a different member"
                  : s.evidence === "missing"
                    ? "One sample health report required"
                    : "Check existing records before collecting anything new"}
            </p>
          </div>
          <Badge
            tone={
              s.evidence === "ready"
                ? "green"
                : s.evidence === "unchecked"
                  ? "gray"
                  : "amber"
            }
          >
            {s.evidence === "ready"
              ? "Validated"
              : s.evidence === "unchecked"
                ? "Pending"
                : "Review"}
          </Badge>
        </div>
        {s.evidence === "unchecked" && (
          <div className="evidence-action">
            <div className="evidence-illustration">
              <FileText size={35} strokeWidth={1.3} />
              <Search size={22} />
            </div>
            <h3>Check your existing reports first</h3>
            <p>
              We’ll check the person, date and sharing permission, then see
              whether the report meets the sample plan’s requirements.
            </p>
            <Button onClick={() => act({ type: "CHECK_EVIDENCE" })}>
              Check available reports <ArrowRight size={16} />
            </Button>
          </div>
        )}
        {s.evidence === "missing" && (
          <div className="evidence-action amber-result">
            <Clock3 size={31} />
            <h3>We need one more report</h3>
            <p>
              A current health report is missing. This request was created after
              you submitted the proposal. The diagnostic coordination team is
              responsible, with a target of 2 working days.
            </p>
            <Button onClick={() => act({ type: "COLLECT_EVIDENCE" })}>
              Simulate report completion <Check size={16} />
            </Button>
            <small>
              This uses a built-in sample report. No upload or real test is
              required.
            </small>
          </div>
        )}
        {s.evidence === "conflict" && (
          <div className="evidence-action amber-result">
            <AlertTriangle size={31} />
            <h3>This record needs a reviewer</h3>
            <p>
              This record belongs to a different person, so it won’t be used in
              the insurer’s decision. Priya S., the demo reviewer, will resolve
              the mismatch.
            </p>
            <Button onClick={() => act({ type: "RESOLVE_CONFLICT" })}>
              Simulate reviewer resolving mismatch <Check size={16} />
            </Button>
            <small>
              Exclude the incorrect record and validate a replacement.
            </small>
          </div>
        )}
        {s.evidence === "ready" && (
          <div className="evidence-action success-result">
            <CircleCheck size={38} />
            <h3>
              {hasSource(s, "abdm") && !s.reviewResolved
                ? "We can use your existing report"
                : "Your reports are ready for review"}
            </h3>
            <p>
              {hasSource(s, "abdm") && !s.reviewResolved
                ? "The sample health report meets the demo requirements. You don’t need to provide another report."
                : "The required sample reports have been checked. The insurer can now review the proposal."}
            </p>
            <Button onClick={() => act({ type: "TO_UNDERWRITING" })}>
              Continue to insurer review <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </Panel>
      <div className="right-column">
        <Panel title="What do we check in a report?">
          <CheckRow>It belongs to the right person</CheckRow>
          <CheckRow>You’ve allowed it to be used for this purpose</CheckRow>
          <CheckRow>It is recent enough for the plan’s requirements</CheckRow>
          <CheckRow>It contains the information the insurer needs</CheckRow>
          <CheckRow>
            We know where it came from and which version was used
          </CheckRow>
        </Panel>
        <div className="tip-card">
          <ShieldCheck size={22} />
          <div>
            <strong>Bank records only help check your budget</strong>
            <p>
              Bank transactions are never used to diagnose a condition or
              replace medical reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
function Acceptance({ s, plan, act }) {
  const [checked, setChecked] = useState(s.accepted);
  return (
    <div className="content-grid">
      <Panel
        title="Your final offer"
        subtitle="The sample insurer’s final price and terms."
        right={
          <Badge tone={s.decision === "revise" ? "amber" : "green"}>
            {s.decision === "revise" ? "Revised offer" : "Approved offer"}
          </Badge>
        }
      >
        <div className="final-offer">
          <IconBox icon={ShieldCheck} />
          <h3>{plan.name}</h3>
          <strong>₹{plan.cover} lakh</strong>
          <p>Family floater · Aarav, Meera & Anaya</p>
        </div>
        <div className="premium-line">
          <span>Final annual premium (demo)</span>
          <div>
            {s.decision === "revise" && <del>{money(plan.premium)}</del>}
            <strong>{money(getPremium(s))}</strong>
          </div>
        </div>
        {s.decision === "revise" && (
          <div className="soft-note">
            The sample insurer increased the premium by 10%. The cover stays the
            same. You can accept the new price or decline the offer.
          </div>
        )}
        <div className="terms-list">
          <span>
            Initial waiting period <strong>30 days (illustrative)</strong>
          </span>
          <span>
            Pre-existing condition waiting{" "}
            <strong>36 months (illustrative)</strong>
          </span>
          <span>
            Example exclusion <strong>Cosmetic procedures</strong>
          </span>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            disabled={s.accepted}
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>
            I accept the final demo premium and terms above, including any
            changes from the initial quote.
          </span>
        </label>
        <div className="acceptance-actions">
          <Button
            disabled={!checked || s.accepted}
            onClick={() => act({ type: "ACCEPT" })}
          >
            {s.accepted ? (
              <>
                <Check size={16} />
                Terms accepted
              </>
            ) : (
              "Accept final terms"
            )}
          </Button>
          <button
            className="text-button muted"
            disabled={s.payment === "reconciled"}
            onClick={() =>
              act({
                type: "CLOSE",
                reason:
                  s.decision === "revise"
                    ? "Revised terms declined"
                    : "Proposal withdrawn",
              })
            }
          >
            Decline & close
          </button>
        </div>
        <div className="payment-section">
          <div>
            <IconBox icon={CreditCard} small />
            <span>
              <strong>Payment confirmation</strong>
              <small>
                {s.payment === "reconciled"
                  ? "PAY-0842 · Matched to this proposal"
                  : "Complete after accepting the final offer"}
              </small>
            </span>
          </div>
          <Button
            variant="secondary"
            disabled={!s.accepted || s.payment === "reconciled"}
            onClick={() => act({ type: "PAY" })}
          >
            {s.payment === "reconciled" ? (
              <>
                <Check size={15} />
                Confirmed
              </>
            ) : (
              "Simulate payment"
            )}
          </Button>
        </div>
        <p className="micro-copy">
          No real money is charged. The same reference is reused on retry.
        </p>
      </Panel>
      <div className="right-column">
        <Panel title="Ready to issue?" subtitle="All five checks must pass.">
          {issuanceGates(s).map((g) => (
            <CheckRow key={g.label} pass={g.pass}>
              {g.label}
            </CheckRow>
          ))}
          {s.issuance === "failed" && (
            <div className="failure-notice">
              <AlertTriangle size={19} />
              <div>
                <strong>Issuance interrupted</strong>
                <p>
                  The sample service couldn’t issue the policy. Your payment is
                  already confirmed, so retrying won’t create another charge.
                </p>
              </div>
            </div>
          )}
          <Button
            className="full issue-button"
            disabled={!issuanceGates(s).every((g) => g.pass)}
            onClick={() => act({ type: "ISSUE" })}
          >
            {s.issuance === "failed" ? (
              <>
                <RefreshCw size={16} />
                Retry issuance safely
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Issue demo policy
              </>
            )}
          </Button>
        </Panel>
        <div className="tip-card">
          <LockKeyhole size={21} />
          <div>
            <strong>Payment isn’t coverage.</strong>
            <p>
              Coverage begins only as specified in the insurer-issued policy.
              This demo creates no actual coverage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
function Metric({ label, value, detail, icon }) {
  return (
    <section className="metric">
      <div>
        <span>{label}</span>
        <IconBox icon={icon} small />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}
function Audit({ entries }) {
  return (
    <div className="audit-list">
      {entries.map((e, i) => (
        <div className="audit-event" key={`${i}-${e.title}`}>
          <span className="audit-dot" />
          <div>
            <strong>{e.title}</strong>
            <p>{e.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
function Architecture() {
  return (
    <>
      <div className="architecture-hero">
        <div>
          <Badge tone="lilac">WORKING PROTOTYPE</Badge>
          <h2>
            Finlead manages the steps.
            <br />
            The insurer makes the decision.
          </h2>
          <p>
            Finlead tracks permissions and moves the case through each step.
            Financial records help check the budget. Medical reports support the
            insurer’s assessment.
          </p>
        </div>
        <Workflow size={99} strokeWidth={1} />
      </div>
      <div className="architecture-flow">
        {[
          [
            HeartPulse,
            "Customer experience",
            "Forms ask for the details still needed. Customers choose what to share, compare plans and follow their case.",
          ],
          [
            Workflow,
            "Managing the case",
            "Save progress, check permissions and send missing reports or review tasks to the right person. Each step waits for its required checks.",
          ],
          [
            ShieldCheck,
            "Insurer decision services",
            "Quotes, underwriting, payment and policy issuance. All simulated here.",
          ],
        ].map(([Icon, title, desc], i) => (
          <React.Fragment key={title}>
            <div>
              <IconBox icon={Icon} />
              <small>0{i + 1}</small>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
            {i < 2 && <ArrowRight size={24} />}
          </React.Fragment>
        ))}
      </div>
      <div className="architecture-detail-grid">
        <Panel
          title="Where the records come from"
          subtitle="Each source answers a different question."
        >
          {Object.values(SOURCES).map((src) => (
            <div className="architecture-source" key={src.name}>
              <IconBox icon={ICONS[src.icon]} small />
              <div>
                <strong>{src.name}</strong>
                <p>{src.subtitle}</p>
              </div>
              <Badge tone="gray">Mock</Badge>
            </div>
          ))}
        </Panel>
        <Panel title="What you can try in this demo">
          <CheckRow>A recommendation can change with AA facts</CheckRow>
          <CheckRow>
            The journey continues when records aren’t available
          </CheckRow>
          <CheckRow>Medical requests follow purchase submission</CheckRow>
          <CheckRow>
            A named reviewer handles issues that need a person
          </CheckRow>
          <CheckRow>
            A policy is issued only after every required check
          </CheckRow>
          <div className="soft-note">
            Before a real pilot, this needs approved data access, insurer
            product and rule connections, testing against actual decisions and a
            baseline group for comparison. None of those results are claimed
            here.
          </div>
        </Panel>
      </div>
    </>
  );
}
export default App;
