# HANDOFF FROM: product-owner

## DISPATCH CHAIN
[user] → [product-owner] → [00-chief-of-staff]

## DISPATCH DEPTH
2/10

## Business Context (Canonical Alignment)
This handoff is grounded in `.github/.system-state/model/business_owner_profile.zaine.yaml`.
Brand and conversion intent require:
- clear pricing before confirmation
- no hidden fees
- no surprise add-ons
- premium-but-fair positioning
- trust-first conversion funnel to booking

## Verification Summary (Interactive Walkthrough Completed)
Validated by direct browser interaction on local app (`/`, `/suites`, `/pricing`, `/book`, `/about`, `/contact`, `/reviews`, `/faq`, `/policies`, `/auth/signin`).

### Confirmed Working
- Primary navigation and core pages resolve.
- Contact submission succeeds and returns confirmation ID.
- Reviews submission succeeds and returns moderation review ID.
- Booking step 1 can be completed when fields are selected through UI controls.

### High-Impact Gaps Identified
1. **Pricing trust drift (P0)**
   - Pricing page includes upsell/add-on framing (e.g., "Add-On Services", spa/birthday packages) while key pages promise no surprise add-ons.
   - This conflicts with business profile intent and risks conversion trust.
2. **Authenticity/trust drift on About page (P1)**
   - Generic/fabricated team personas conflict with owner-led local brand narrative.
3. **Sign-in validation UX gap (P2)**
   - Invalid email submission path lacks clear user-visible error feedback in the tested flow.

## NEXT BIGGEST THING (MANDATORY IMPLEMENTATION)
## Epic: Pricing Integrity & Trust Consistency (P0)

### User Story
As a safety-first dog parent evaluating boarding, I want pricing and policy messaging to be consistent and explicit across all funnel pages so that I can trust the quote and confidently book.

### Acceptance Criteria (Given/When/Then)
1. **Cross-page pricing consistency**  
   **Given** I view Home, Pricing, Book, Contact, Reviews, FAQ, and Policies  
   **When** pricing language is shown  
   **Then** all pages use one approved pricing model without conflicting statements.  
   **Traceability:** PRICING, TRUST, BOOKING

2. **No surprise add-ons policy enforcement**  
   **Given** I am on the pricing and booking experiences  
   **When** optional services are displayed  
   **Then** they must either be removed or explicitly presented in a policy-compliant way that does not violate “no surprise add-ons/no hidden fees.”  
   **Traceability:** PRICING, TRUST

3. **Price-before-confirmation clarity**  
   **Given** I complete booking step inputs  
   **When** I proceed toward confirmation  
   **Then** the total pricing model and any taxes are clearly shown before confirmation with no ambiguous wording.  
   **Traceability:** PRICING, BOOKING, TRUST

4. **Business-profile copy conformance**  
   **Given** the business profile defines premium-fair, transparency-first positioning  
   **When** pricing content is audited  
   **Then** all pricing copy conforms to that positioning and avoids contradictory upsell framing.  
   **Traceability:** BRAND, PRICING, TRUST

5. **Regression protection**  
   **Given** pricing language and booking quote logic are updated  
   **When** CI runs  
   **Then** automated tests must verify pricing copy and API response consistency for key booking paths.  
   **Traceability:** PRICING, BOOKING, TRUST

### Definition of Done (Feature-Level)
- All ACs above pass in QA evidence.
- Content and behavior are consistent across all required funnel pages.
- Tests added/updated for pricing consistency and booking quote clarity.
- Documentation updated in:
  - `.github/.developer/ARCHITECTURE.md` (if contract/model-impacting)
  - `.github/.developer/TODO.md`
  - `.customer/CHANGELOG.md` (customer-visible language changes)
- Evidence artifact added under `docs/audit_logs/` with route-by-route validation.

## Priority & Rationale
- **Priority:** P0 (highest)
- **Reason:** This is the strongest trust and conversion risk; it directly impacts launch readiness and purchasing confidence.

## Scope Boundary
### In Scope
- Pricing copy/policy normalization across funnel pages.
- Booking quote semantics and pre-confirmation clarity.
- Tests + evidence for consistency.

### Out of Scope (for this slice)
- Net-new pricing calculator redesign.
- New promotions/discount programs.
- Non-pricing visual redesign.

## Dependencies
- Business owner final selection of tax display model (if still unresolved in model).
- Solution architect confirmation of any contract/schema impacts.

## Explicit Product Owner Demands
1. Chief of Staff must route and ensure **full implementation** of this P0 epic first.
2. After implementation, team must submit a formal **approval request** to Quality Director (and required stakeholders) with evidence package.
3. In the same approval package, team must include a **proposed next biggest thing** (next prioritized backlog item) with acceptance criteria and effort estimate.

## Candidate “Next Biggest Thing” After P0 (Pre-request)
**P1: Brand Authenticity & Trust Narrative Alignment**
- Remove generic/fabricated team personas from About page.
- Align brand story to owner-led, small-capacity, Syracuse-local narrative from business profile.
- Ensure trust claims are evidence-backed and non-generic.
- Traceability: BRAND, TRUST, SAFETY

## Your Task (Chief of Staff)
Design and execute a cross-agent delivery plan that:
1. Implements the P0 epic above end-to-end,
2. Produces test and audit evidence,
3. Submits approval request,
4. Returns next-biggest-thing proposal for immediate follow-on execution.
