import { describe, it, expect } from "@jest/globals";
import { DefinitionOfDoneGate } from "../definition-of-done-gate";

describe("DefinitionOfDoneGate", () => {
  it("passes when all required fields are satisfied", () => {
    const result = DefinitionOfDoneGate.evaluate({
      testsUpdated: true,
      lintPassed: true,
      typecheckPassed: true,
      docsUpdated: true,
      prIncludesHowToTest: true,
      prIncludesRiskNotes: true,
      acceptanceCriteriaSatisfied: true,
      businessIntentTagsPresentInAcceptanceCriteria: true,
      businessIntentTagsPresentInSlicePlan: true,
      prIncludesBusinessIntentSummary: true,
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails with multiple unmet requirements", () => {
    const result = DefinitionOfDoneGate.evaluate({
      testsUpdated: false,
      lintPassed: true,
      typecheckPassed: false,
      docsUpdated: false,
      prIncludesHowToTest: false,
      prIncludesRiskNotes: false,
      acceptanceCriteriaSatisfied: false,
      businessIntentTagsPresentInAcceptanceCriteria: false,
      businessIntentTagsPresentInSlicePlan: false,
      prIncludesBusinessIntentSummary: false,
      securityReviewRequired: true,
      securityReviewComplete: false,
    });

    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThanOrEqual(6);
  });

  it("fails when business intent traceability is missing", () => {
    const result = DefinitionOfDoneGate.evaluate({
      testsUpdated: true,
      lintPassed: true,
      typecheckPassed: true,
      docsUpdated: true,
      prIncludesHowToTest: true,
      prIncludesRiskNotes: true,
      acceptanceCriteriaSatisfied: true,
      businessIntentTagsPresentInAcceptanceCriteria: false,
      businessIntentTagsPresentInSlicePlan: false,
      prIncludesBusinessIntentSummary: false,
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain(
      "Acceptance criteria are missing business intent tags (BRAND|TRUST|SAFETY|PRICING|BOOKING)",
    );
    expect(result.failures).toContain(
      "Slice plan is missing business intent tags (BRAND|TRUST|SAFETY|PRICING|BOOKING)",
    );
    expect(result.failures).toContain(
      "PR description is missing business intent summary and covered tags",
    );
  });
});
