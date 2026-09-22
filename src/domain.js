export const STEPS = [
  "Your family",
  "Your records",
  "Cover options",
  "Proposal",
  "Health records",
  "Insurer review",
  "Final terms",
  "Your policy",
];
export const SOURCES = {
  bank: {
    name: "AA banking",
    subtitle: "Understand your budget",
    provider: "Sample Bank via AA",
    facts: [
      "Recurring monthly income · ₹1,20,000",
      "Regular commitments · ₹76,000",
      "Internal transfers excluded · ₹30,000",
      "Confirmed insurance allowance · ₹3,200/month",
    ],
    date: "21 Sep 2026",
    icon: "bank",
  },
  policy: {
    name: "AA insurance",
    subtitle: "Understand existing cover",
    provider: "Sample insurer via AA",
    facts: [
      "Employer floater · ₹5 lakh",
      "Members · Aarav + Meera only",
      "Dependent child · not included",
    ],
    date: "21 Sep 2026",
    icon: "shield",
  },
  care: {
    name: "Care history",
    subtitle: "Reuse your previous records",
    provider: "Simulated Care internal records",
    facts: [
      "Previous proposal · Aug 2026",
      "Identity matched to Aarav Sharma",
      "Current declarations still required",
    ],
    date: "20 Aug 2026",
    icon: "heart",
  },
  abdm: {
    name: "ABDM records",
    subtitle: "Reuse your health reports",
    provider: "Sample linked health facility",
    facts: [
      "Health report · 12 Sep 2026",
      "Subject matched · Aarav Sharma",
      "Complete for this demo rule set",
    ],
    date: "12 Sep 2026",
    icon: "file",
  },
};
export const SCENARIOS = {
  connected: {
    title: "Connected family",
    description:
      "AA records show that Anaya isn’t covered. The family can reuse an existing health report.",
    sources: ["bank", "policy", "abdm"],
    outcome: "approve",
    evidence: "reusable",
    label: "All records available",
  },
  missing: {
    title: "One report missing",
    description:
      "Use the records already available and request the missing report after submission.",
    sources: ["bank", "policy"],
    outcome: "approve",
    evidence: "missing",
    label: "Evidence request",
  },
  fallback: {
    title: "No connected records",
    description:
      "Continue with the family’s own details and request the reports needed after submission.",
    sources: [],
    outcome: "approve",
    evidence: "missing",
    label: "Without shared records",
  },
  revised: {
    title: "Revised insurer terms",
    description:
      "The sample insurer changes the premium. The customer can accept or decline the new offer.",
    sources: ["bank", "policy", "abdm"],
    outcome: "revise",
    evidence: "reusable",
    label: "Customer choice",
  },
  conflict: {
    title: "Record conflict",
    description:
      "A report belongs to the wrong person. A reviewer must resolve the mismatch before the case can proceed.",
    sources: ["bank", "policy", "abdm"],
    outcome: "review",
    evidence: "conflict",
    label: "Human review",
  },
  issueFailure: {
    title: "Issuance interrupted",
    description:
      "The policy service fails after payment is confirmed. Retry issuance without another charge.",
    sources: ["bank", "policy", "abdm"],
    outcome: "approve",
    evidence: "reusable",
    label: "Retry after a failure",
  },
};
export const PLANS = [
  {
    id: "essential",
    name: "Essential",
    cover: 10,
    premium: 22800,
    tag: "Lower annual premium",
    features: [
      "Family floater for 3 members",
      "Hospitalisation cover",
      "Shared cover across the family",
    ],
  },
  {
    id: "balance",
    name: "Family Plus",
    cover: 20,
    premium: 31200,
    tag: "Recommended for your family",
    features: [
      "Family floater for 3 members",
      "Higher cover beyond employer benefits",
      "Illustrative restore benefit",
    ],
  },
  {
    id: "complete",
    name: "Family Complete",
    cover: 25,
    premium: 39600,
    tag: "Highest cover in this demo",
    features: [
      "Family floater for 3 members",
      "Highest demo cover option",
      "Higher annual premium",
    ],
  },
];
export const money = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
export function initialState(scenario = "connected") {
  return {
    version: 1,
    scenario,
    step: 0,
    maxStep: 0,
    profile: { name: "Aarav Sharma", city: "Bengaluru", budget: 3000 },
    sources: {
      bank: "disconnected",
      policy: "disconnected",
      care: "disconnected",
      abdm: "disconnected",
    },
    confirmed: false,
    selected: "balance",
    submitted: false,
    evidence: "unchecked",
    reviewResolved: false,
    decision: null,
    accepted: false,
    payment: "unpaid",
    chargeCount: 0,
    issuance: "not-started",
    closed: null,
    audit: [
      {
        title: "Demo case created",
        detail: "Synthetic Sharma family · FL-2026-0842",
      },
    ],
  };
}
export function record(state, title, detail) {
  return { ...state, audit: [...state.audit, { title, detail }] };
}
export function hasSource(s, key) {
  return s.sources[key] === "connected";
}
export function recommendation(s, withoutAA = false) {
  const bank = !withoutAA && hasSource(s, "bank");
  const policy = !withoutAA && hasSource(s, "policy");
  const monthlyBudget = Math.min(
    Number(s.profile.budget),
    bank ? 3200 : Number(s.profile.budget),
  );
  const preferred = policy ? "balance" : "essential";
  const affordable = PLANS.filter((p) => p.premium / 12 <= monthlyBudget);
  const plan =
    affordable.find((p) => p.id === preferred) || affordable.at(-1) || PLANS[0];
  return {
    plan,
    monthlyBudget,
    bank,
    policy,
    exceedsBudget: plan.premium / 12 > monthlyBudget,
    reason: policy
      ? "Your employer policy covers Aarav and Meera, but not Anaya. A separate family policy includes her and reduces reliance on your employer’s cover."
      : "You told us you have ₹5 lakh of family cover. We still need to check which family members are included.",
  };
}
function next(s, step) {
  return { ...s, step, maxStep: Math.max(s.maxStep, step) };
}
export function reducer(s, a) {
  if (a.type === "RESET") return initialState(a.scenario || "connected");
  if (a.type === "NAVIGATE")
    return a.step >= 0 && a.step <= s.maxStep ? { ...s, step: a.step } : s;
  if (s.closed || s.issuance === "issued") return s;
  if (a.type === "PROFILE" && !s.submitted)
    return {
      ...s,
      profile: { ...s.profile, ...a.value },
      confirmed: false,
      maxStep: Math.min(s.maxStep, 2),
    };
  if (
    a.type === "START" &&
    s.profile.name.trim() &&
    s.profile.city.trim() &&
    Number(s.profile.budget) >= 500
  )
    return next(
      record(
        s,
        "Profile confirmed",
        "Identity and family declarations confirmed in demo",
      ),
      1,
    );
  if (
    a.type === "SOURCE" &&
    !s.submitted &&
    SOURCES[a.key] &&
    [
      "connected",
      "declined",
      "expired",
      "error",
      "revoked",
      "disconnected",
    ].includes(a.status)
  ) {
    const updated = {
      ...s,
      sources: { ...s.sources, [a.key]: a.status },
      confirmed: false,
      maxStep: Math.min(s.maxStep, 2),
    };
    return record(
      updated,
      `${SOURCES[a.key].name}: ${a.status}`,
      a.status === "connected"
        ? "Separate demo consent granted. Synthetic facts available."
        : "Source facts excluded. Declaration fallback remains available.",
    );
  }
  if (a.type === "CONFIRM_RECORDS" && s.step === 1) {
    if (s.submitted) return next(s, 2);
    const updated = { ...s, confirmed: true };
    return next(
      record(
        { ...updated, selected: recommendation(updated).plan.id },
        "Source assumptions confirmed",
        "Customer confirmed returned facts and any declaration fallback",
      ),
      2,
    );
  }
  if (
    a.type === "SELECT_PLAN" &&
    !s.submitted &&
    PLANS.some((p) => p.id === a.id)
  )
    return { ...s, selected: a.id };
  if (a.type === "PROPOSE" && s.confirmed && s.step === 2) return next(s, 3);
  if (a.type === "SUBMIT" && s.step === 3 && s.confirmed && !s.submitted)
    return next(
      record(
        { ...s, submitted: true },
        "Proposal submitted",
        "Demo proposal recorded. No payment collected. No coverage started.",
      ),
      4,
    );
  if (
    a.type === "CHECK_EVIDENCE" &&
    s.submitted &&
    s.step === 4 &&
    s.evidence === "unchecked"
  ) {
    const scenario = SCENARIOS[s.scenario];
    const evidence =
      scenario.evidence === "conflict" && !s.reviewResolved
        ? "conflict"
        : hasSource(s, "abdm")
          ? "ready"
          : "missing";
    return record(
      { ...s, evidence },
      "Evidence checked",
      evidence === "ready"
        ? "Matched, recent evidence reused against demo rules v1"
        : evidence === "conflict"
          ? "Wrong-member record isolated. Manual review required."
          : "One required health report is missing. Checklist created after submission.",
    );
  }
  if (
    a.type === "COLLECT_EVIDENCE" &&
    s.step === 4 &&
    s.submitted &&
    s.evidence === "missing"
  )
    return record(
      { ...s, evidence: "ready" },
      "Sample report received",
      "Mock diagnostic report validated for subject, date and completeness",
    );
  if (a.type === "RESOLVE_CONFLICT" && s.evidence === "conflict" && s.submitted)
    return record(
      { ...s, evidence: "ready", reviewResolved: true },
      "Review completed",
      "Demo reviewer excluded wrong-member record and verified replacement evidence",
    );
  if (a.type === "TO_UNDERWRITING" && s.evidence === "ready" && s.submitted)
    return next(s, 5);
  if (
    a.type === "DECIDE" &&
    s.step === 5 &&
    s.evidence === "ready" &&
    s.submitted &&
    !s.decision
  ) {
    const decision = a.outcome || SCENARIOS[s.scenario].outcome;
    if (
      !["approve", "revise", "review", "postpone", "decline"].includes(decision)
    )
      return s;
    if (decision === "review" && !s.reviewResolved)
      return record(
        { ...s, decision: "review" },
        "Underwriter referral",
        "Human sign-off required. Issuance blocked.",
      );
    return record(
      { ...s, decision: decision === "review" ? "approve" : decision },
      "Sample insurer decision recorded",
      `${decision === "review" ? "approve after review" : decision} · demo rules v1 · synthetic decision`,
    );
  }
  if (a.type === "RESOLVE_REFERRAL" && s.decision === "review")
    return record(
      { ...s, decision: "approve", reviewResolved: true },
      "Authorised demo review completed",
      "Simulated underwriter approved the proposal",
    );
  if (a.type === "RESUME" && s.decision === "postpone")
    return record(
      { ...s, decision: null },
      "Postponed case reopened",
      "Simulated follow-up information received for reassessment",
    );
  if (a.type === "TO_ACCEPTANCE" && ["approve", "revise"].includes(s.decision))
    return next(s, 6);
  if (
    a.type === "ACCEPT" &&
    s.step === 6 &&
    ["approve", "revise"].includes(s.decision)
  )
    return record(
      { ...s, accepted: true },
      "Final terms accepted",
      "Customer explicitly accepted final demo terms",
    );
  if (
    a.type === "PAY" &&
    s.step === 6 &&
    s.accepted &&
    ["approve", "revise"].includes(s.decision) &&
    s.payment === "unpaid"
  )
    return record(
      { ...s, payment: "reconciled", chargeCount: 1 },
      "Demo payment reconciled",
      "Synthetic payment PAY-0842. No real money charged. Idempotency key: FL-0842",
    );
  if (
    a.type === "ISSUE" &&
    s.accepted &&
    s.payment === "reconciled" &&
    s.evidence === "ready" &&
    ["approve", "revise"].includes(s.decision) &&
    s.issuance !== "issued"
  ) {
    if (s.scenario === "issueFailure" && s.issuance === "not-started")
      return record(
        { ...s, issuance: "failed" },
        "Issuance service unavailable",
        "Payment preserved. Retry uses the same payment reference.",
      );
    return next(
      record(
        { ...s, issuance: "issued" },
        "Demo policy issued",
        "All issuance gates satisfied. Synthetic certificate FL-DEMO-0842.",
      ),
      7,
    );
  }
  if (a.type === "CLOSE" && s.issuance !== "issued")
    return record(
      {
        ...s,
        closed: a.reason || "Withdrawn",
        payment: s.payment === "reconciled" ? "refund-pending" : s.payment,
      },
      "Case closed",
      s.payment === "reconciled"
        ? "Demo refund queued for reconciliation"
        : "No payment to refund",
    );
  return s;
}
export function getPremium(s) {
  const base = PLANS.find((p) => p.id === s.selected).premium;
  return s.decision === "revise" ? Math.round(base * 1.1) : base;
}
export function issuanceGates(s) {
  return [
    { label: "Proposal and identity confirmed", pass: s.submitted },
    { label: "Required reports checked", pass: s.evidence === "ready" },
    {
      label: "Final insurer approval received",
      pass: ["approve", "revise"].includes(s.decision),
    },
    { label: "Customer accepted final terms", pass: s.accepted },
    { label: "Payment confirmed", pass: s.payment === "reconciled" },
  ];
}
