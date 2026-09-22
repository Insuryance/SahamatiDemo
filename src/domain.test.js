import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  reducer,
  recommendation,
  issuanceGates,
  getPremium,
  SCENARIOS,
} from "./domain.js";
const run = (s, ...actions) =>
  actions.reduce(
    (x, a) => reducer(x, typeof a === "string" ? { type: a } : a),
    s,
  );
function proposal(scenario = "connected") {
  let s = run(initialState(scenario), "START");
  for (const key of SCENARIOS[scenario].sources)
    s = reducer(s, { type: "SOURCE", key, status: "connected" });
  return run(s, "CONFIRM_RECORDS", "PROPOSE", "SUBMIT");
}
function assessed(scenario = "connected", outcome) {
  let s = run(proposal(scenario), "CHECK_EVIDENCE");
  if (s.evidence === "missing") s = run(s, "COLLECT_EVIDENCE");
  if (s.evidence === "conflict") s = run(s, "RESOLVE_CONFLICT");
  return run(s, "TO_UNDERWRITING", { type: "DECIDE", outcome });
}
test("new evidence and issuance are blocked before purchase submission", () => {
  const s = initialState();
  for (const type of [
    "CHECK_EVIDENCE",
    "COLLECT_EVIDENCE",
    "TO_UNDERWRITING",
    "DECIDE",
    "ACCEPT",
    "PAY",
    "ISSUE",
  ])
    assert.deepEqual(run(s, type), s);
});
test("AA policy facts change the selected cover from 10 to 20 lakh", () => {
  const s = run(initialState(), "START", {
    type: "SOURCE",
    key: "policy",
    status: "connected",
  });
  assert.equal(recommendation(s, true).plan.cover, 10);
  assert.equal(recommendation(s).plan.cover, 20);
});
test("banking never substitutes for clinical evidence", () => {
  let s = proposal("missing");
  s = run(s, "CHECK_EVIDENCE");
  assert.equal(s.evidence, "missing");
  assert.equal(run(s, "TO_UNDERWRITING").step, 4);
});
test("declined, expired, failed, revoked and disconnected sources use fallback", () => {
  for (const status of [
    "declined",
    "expired",
    "error",
    "revoked",
    "disconnected",
  ]) {
    const s = run(initialState(), "START", {
      type: "SOURCE",
      key: "policy",
      status,
    });
    assert.equal(recommendation(s).policy, false);
    assert.equal(recommendation(s).plan.cover, 10);
  }
});
test("source changes invalidate confirmation and inaccessible progress", () => {
  let s = run(
    initialState(),
    "START",
    { type: "SOURCE", key: "policy", status: "connected" },
    "CONFIRM_RECORDS",
    "PROPOSE",
    { type: "NAVIGATE", step: 1 },
    { type: "SOURCE", key: "policy", status: "revoked" },
  );
  assert.equal(s.confirmed, false);
  assert.equal(s.maxStep, 2);
  assert.equal(run(s, { type: "NAVIGATE", step: 3 }).step, 1);
});
test("fully connected journey requires every issuance gate", () => {
  let s = run(assessed(), "TO_ACCEPTANCE");
  assert.equal(run(s, "ISSUE").issuance, "not-started");
  assert.equal(run(s, "PAY").payment, "unpaid");
  s = run(s, "ACCEPT");
  assert.equal(run(s, "ISSUE").issuance, "not-started");
  s = run(s, "PAY");
  assert.ok(issuanceGates(s).every((g) => g.pass));
  s = run(s, "ISSUE");
  assert.equal(s.issuance, "issued");
  assert.equal(s.step, 7);
});
test("every scenario can reach issuance through its intended path", () => {
  for (const scenario of Object.keys(SCENARIOS)) {
    let s = run(assessed(scenario), "TO_ACCEPTANCE", "ACCEPT", "PAY", "ISSUE");
    if (scenario === "issueFailure") {
      assert.equal(s.issuance, "failed");
      s = run(s, "ISSUE");
    }
    assert.equal(s.issuance, "issued", scenario);
    assert.equal(s.chargeCount, 1, scenario);
  }
});
test("revised terms require explicit acceptance and reflect the final price", () => {
  let s = run(assessed("revised"), "TO_ACCEPTANCE");
  assert.equal(getPremium(s), 34320);
  assert.equal(run(s, "PAY").payment, "unpaid");
  s = run(s, "ACCEPT", "PAY", "ISSUE");
  assert.equal(s.issuance, "issued");
});
test("issuance retry preserves the reconciled payment without duplicate charges", () => {
  let s = run(
    assessed("issueFailure"),
    "TO_ACCEPTANCE",
    "ACCEPT",
    "PAY",
    "PAY",
    "ISSUE",
  );
  assert.equal(s.issuance, "failed");
  assert.equal(s.payment, "reconciled");
  s = run(s, "PAY", "ISSUE", "ISSUE");
  assert.equal(s.issuance, "issued");
  assert.equal(s.chargeCount, 1);
});
test("conflicting evidence cannot advance without a reviewer", () => {
  let s = run(proposal("conflict"), "CHECK_EVIDENCE");
  assert.equal(s.evidence, "conflict");
  assert.equal(run(s, "TO_UNDERWRITING").step, 4);
  s = run(s, "RESOLVE_CONFLICT", "TO_UNDERWRITING", "DECIDE");
  assert.equal(s.decision, "approve");
  assert.equal(s.reviewResolved, true);
});
test("manual referral blocks acceptance until authorised review", () => {
  let s = assessed("connected", "review");
  assert.equal(run(s, "TO_ACCEPTANCE").step, 5);
  s = run(s, "RESOLVE_REFERRAL", "TO_ACCEPTANCE");
  assert.equal(s.step, 6);
});
test("postponed and declined cases cannot be paid or issued", () => {
  for (const decision of ["postpone", "decline"]) {
    let s = assessed("connected", decision);
    s = run(s, "TO_ACCEPTANCE", "ACCEPT", "PAY", "ISSUE");
    assert.equal(s.payment, "unpaid");
    assert.equal(s.issuance, "not-started");
    assert.equal(run(s, { type: "CLOSE", reason: decision }).closed, decision);
  }
});
test("reopening a postponed case allows a new assessment", () => {
  let s = run(assessed("connected", "postpone"), "RESUME", {
    type: "DECIDE",
    outcome: "approve",
  });
  assert.equal(s.decision, "approve");
});
test("withdrawal after a simulated payment queues refund and blocks further action", () => {
  let s = run(assessed(), "TO_ACCEPTANCE", "ACCEPT", "PAY", {
    type: "CLOSE",
    reason: "Withdrawn",
  });
  assert.equal(s.payment, "refund-pending");
  assert.equal(run(s, "ISSUE").issuance, "not-started");
});
test("completed evidence and issued policies remain stable when navigating back", () => {
  let s = run(assessed("fallback"), "TO_ACCEPTANCE", "ACCEPT", "PAY", "ISSUE");
  s = run(s, { type: "NAVIGATE", step: 4 }, "CHECK_EVIDENCE");
  assert.equal(s.evidence, "ready");
  assert.equal(s.issuance, "issued");
});
test("submitted proposal selection cannot change by reconfirming records", () => {
  let s = run(
    initialState(),
    "START",
    "CONFIRM_RECORDS",
    { type: "SELECT_PLAN", id: "complete" },
    "PROPOSE",
    "SUBMIT",
    { type: "NAVIGATE", step: 1 },
    "CONFIRM_RECORDS",
  );
  assert.equal(s.selected, "complete");
  assert.equal(s.submitted, true);
});
test("budget fit stays separate and flags a budget too low for all options", () => {
  let s = run(initialState(), { type: "PROFILE", value: { budget: 500 } });
  assert.equal(recommendation(s).exceedsBudget, true);
  assert.equal(recommendation(s).monthlyBudget, 500);
});
