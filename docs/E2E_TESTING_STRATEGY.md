# End-to-End Testing Strategy - Phase 11

**Purpose:** Comprehensive manual and automated testing plan for 6 critical user journeys  
**Status:** Ready for execution (Playwright configured, scenarios documented)  
**Priority:** Execute before staged rollout (10% → 100%)

---

## 🎯 Critical User Journeys

### Journey 1: Guest Booking Flow (PRIORITY 1)
**Path:** Homepage → Browse → Book → Payment → Confirmation  
**User Type:** First-time guest (no account)  
**Goal:** Complete booking without authentication  
**Success Criteria:** Booking created, payment processed, confirmation email sent

#### Test Steps

1. **Homepage Landing**
   - [ ] Load https://zainesstayandplay.com/
   - [ ] Verify hero loads within 2s (LCP)
   - [ ] Verify "Book a Stay" CTA visible
   - [ ] Click "Book a Stay" CTA

2. **Step 1: Dates Selection**
   - [ ] Calendar loads with availability
   - [ ] Select check-in date (tomorrow)
   - [ ] Select check-out date (3 days from now)
   - [ ] Verify pricing calculation updates
   - [ ] Click "Continue"

3. **Step 2: Suite Selection**
   - [ ] 3 suite options displayed (Standard/Deluxe/Luxury)
   - [ ] Select "Deluxe Suite"
   - [ ] Add optional service (e.g., "Extra Playtime")
   - [ ] Verify total price updates
   - [ ] Click "Continue"

4. **Step 3: Account Creation (Guest Checkout)**
   - [ ] Form loads with email, name, phone fields
   - [ ] Enter guest details
   - [ ] Password field visible (optional guest signup)
   - [ ] Click "Continue as Guest" or "Create Account"

5. **Step 4: Pet Details**
   - [ ] Pet information form loads
   - [ ] Enter pet name, breed, age, weight
   - [ ] Upload vaccine records (PDF/image)
   - [ ] Verify upload success
   - [ ] Click "Continue"

6. **Step 5: Waiver Acceptance**
   - [ ] Waiver text loads and is readable
   - [ ] Digital signature pad functional
   - [ ] Sign waiver
   - [ ] Check "I agree" checkbox
   - [ ] Click "Continue"

7. **Step 6: Payment**
   - [ ] Stripe Payment Element loads
   - [ ] Booking summary correct (dates, suite, add-ons, total)
   - [ ] Enter test card: 4242 4242 4242 4242
   - [ ] Enter expiry: 12/34, CVC: 123
   - [ ] Click "Confirm Booking"
   - [ ] Payment processes successfully
   - [ ] Redirect to confirmation page

8. **Confirmation**
   - [ ] Confirmation page displays booking details
   - [ ] Confirmation number generated
   - [ ] Email sent to guest (check dev queue or inbox)
   - [ ] "View Booking" link works
   - [ ] Booking appears in database (admin verify)

**Expected Duration:** 3-5 minutes  
**Automation:** Playwright script ready at `tests/e2e/guest-booking-flow.spec.ts`

---

### Journey 2: Authenticated Booking Flow (PRIORITY 1)
**Path:** Login → Dashboard → Book → Payment → Confirmation  
**User Type:** Returning customer (existing account)  
**Goal:** Streamlined booking with pre-filled data  
**Success Criteria:** Faster checkout, saved payment method used

#### Test Steps

1. **Login**
   - [ ] Navigate to /login
   - [ ] Enter test credentials (email: test@example.com, password: TestPass123!)
   - [ ] Click "Sign In"
   - [ ] Redirect to dashboard

2. **Dashboard → Book**
   - [ ] Click "Book a Stay" button
   - [ ] Booking wizard opens at Step 1 (Dates)

3. **Step 1-2: Dates & Suite**
   - [ ] Select dates and suite (same as Journey 1)
   - [ ] Verify pricing calculation

4. **Step 3: Account (Pre-Filled)**
   - [ ] Account details auto-populated
   - [ ] Verify name, email, phone pre-filled
   - [ ] Click "Continue" (no input needed)

5. **Step 4: Pets (Saved Pets Displayed)**
   - [ ] Previously added pets appear as selectable cards
   - [ ] Select existing pet "Buddy"
   - [ ] Verify vaccine records already on file
   - [ ] Click "Continue"

6. **Step 5: Waiver**
   - [ ] Sign waiver (or skip if previously signed)

7. **Step 6: Payment (Saved Payment Method)**
   - [ ] Saved payment method appears (ending in 4242)
   - [ ] Option to use saved card or add new card
   - [ ] Click "Confirm Booking" with saved card
   - [ ] Payment processes via saved PaymentMethod

8. **Confirmation**
   - [ ] Confirmation page loads
   - [ ] Booking appears in dashboard "Upcoming Bookings"
   - [ ] Email confirmation sent

**Expected Duration:** 2-3 minutes (faster than guest flow)  
**Automation:** Playwright script at `tests/e2e/authenticated-booking-flow.spec.ts`

---

### Journey 3: Booking Modification (PRIORITY 2)
**Path:** Dashboard → Bookings → [Booking] → Modify → Save  
**User Type:** Authenticated customer with existing booking  
**Goal:** Self-service booking changes  
**Success Criteria:** Dates extended, services added, payment adjusted

#### Test Steps

1. **Dashboard → Bookings**
   - [ ] Login as test user
   - [ ] Navigate to "My Bookings"
   - [ ] Upcoming bookings displayed

2. **Select Booking**
   - [ ] Click on existing booking (created in Journey 2)
   - [ ] Booking details page loads
   - [ ] "Modify Booking" button visible

3. **Modify Dates**
   - [ ] Click "Modify Booking"
   - [ ] Change check-out date (extend stay by 1 day)
   - [ ] Verify price adjustment calculation
   - [ ] Click "Save Changes"

4. **Add Services**
   - [ ] Click "Add Services"
   - [ ] Select "Grooming" add-on
   - [ ] Verify price updated
   - [ ] Click "Confirm"

5. **Payment Adjustment**
   - [ ] Payment modal shows additional charge
   - [ ] Charge authorized via saved payment method
   - [ ] Success message displayed

6. **Verification**
   - [ ] Modified booking details correct
   - [ ] Email notification sent (booking modified)
   - [ ] Admin sees modification in admin panel

**Expected Duration:** 2-3 minutes  
**Automation:** Playwright script at `tests/e2e/booking-modification.spec.ts`

---

### Journey 4: Dashboard → Messages → Photo Gallery (PRIORITY 2)
**Path:** Dashboard → Messages → View Updates → Photo Gallery  
**User Type:** Authenticated customer during stay  
**Goal:** View real-time updates and photos  
**Success Criteria:** Messages load, photos viewable, downloadable

#### Test Steps

1. **Dashboard → Messages**
   - [ ] Login as customer with active booking
   - [ ] Click "Messages" tab
   - [ ] Unread message count displayed

2. **Message Thread**
   - [ ] Messages for active booking displayed
   - [ ] Staff message "Buddy had a great play session!" visible
   - [ ] Reply functionality works
   - [ ] Send test reply: "Thanks for the update!"

3. **Photo Gallery**
   - [ ] "View Photos" button visible
   - [ ] Click "View Photos"
   - [ ] Gallery modal opens with thumbnail grid

4. **Photo Viewing**
   - [ ] Click thumbnail to enlarge
   - [ ] Full-size photo loads
   - [ ] Navigation arrows work (prev/next)
   - [ ] Zoom functionality works

5. **Photo Download**
   - [ ] Click "Download" button
   - [ ] Single photo downloads successfully
   - [ ] Click "Download All"
   - [ ] Zip archive downloads with all photos

6. **Social Sharing**
   - [ ] Click "Share" button
   - [ ] Share modal opens with options (Facebook, Instagram, Copy Link)
   - [ ] Copy link functionality works

**Expected Duration:** 2-3 minutes  
**Automation:** Playwright script at `tests/e2e/dashboard-messages-photos.spec.ts`

---

### Journey 5: Mobile Booking Flow (PRIORITY 1)
**Path:** Mobile Homepage → Book → Payment → Confirmation  
**Device:** iPhone 12 Pro (375x812), Android Pixel 5 (393x851)  
**User Type:** Guest on mobile device  
**Goal:** Complete booking with one-thumb operation  
**Success Criteria:** All steps accessible, touch targets ≥44px, mobile payment works

#### Test Steps

1. **Mobile Homepage**
   - [ ] Load on mobile device (Chrome DevTools device emulation)
   - [ ] Hamburger menu visible and functional
   - [ ] Hero CTA "Book a Stay" tappable (≥44x44px)
   - [ ] Scroll smooth, no horizontal overflow

2. **Mobile Calendar (Step 1)**
   - [ ] Calendar optimized for mobile
   - [ ] Date picker large enough for finger taps
   - [ ] Swipe gestures work (prev/next month)
   - [ ] Selected dates highlighted clearly

3. **Mobile Suite Selection (Step 2)**
   - [ ] Suite cards stack vertically
   - [ ] Photos load and swipeable
   - [ ] "Select" buttons ≥44x44px
   - [ ] Add-ons expandable/collapsible

4. **Mobile Form Inputs (Steps 3-4)**
   - [ ] Form fields large enough for mobile keyboard
   - [ ] Autofocus on first field
   - [ ] Virtual keyboard doesn't obscure inputs
   - [ ] Input validation shows on blur

5. **Mobile Payment (Step 6)**
   - [ ] Stripe Payment Element mobile-optimized
   - [ ] Card input fields accessible
   - [ ] Apple Pay / Google Pay button displayed (if available)
   - [ ] "Confirm Booking" button full-width, easy to tap

6. **Mobile Confirmation**
   - [ ] Confirmation page responsive
   - [ ] Booking details readable
   - [ ] CTA buttons accessible

**Expected Duration:** 4-6 minutes (slower than desktop)  
**Automation:** Playwright mobile emulation at `tests/e2e/mobile-booking-flow.spec.ts`

**Test Devices:**
- iPhone 12 Pro (iOS Safari)
- Android Pixel 5 (Chrome)
- iPad Pro (tablet view)

---

### Journey 6: Accessibility Flow (Keyboard + Screen Reader) (PRIORITY 1)
**Path:** Homepage → Book → Confirmation (keyboard-only)  
**User Type:** Keyboard-only user + screen reader user  
**Assistive Tech:** NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS)  
**Goal:** Complete booking without mouse  
**Success Criteria:** All steps keyboard-accessible, screen reader announces correctly

#### Test Steps (Keyboard-Only)

1. **Keyboard Navigation Setup**
   - [ ] Load homepage
   - [ ] Tab order starts at skip links
   - [ ] Tab through navigation (logical order)
   - [ ] All interactive elements receive focus
   - [ ] Focus indicators visible (3:1 contrast ratio)

2. **Skip Links (WCAG 2.4.1)**
   - [ ] Press Tab
   - [ ] "Skip to main content" link visible on focus
   - [ ] Press Enter
   - [ ] Focus jumps to main content area

3. **Booking Wizard (Keyboard)**
   - [ ] Tab to "Book a Stay" CTA
   - [ ] Press Enter to activate
   - [ ] Booking wizard opens

4. **Form Navigation**
   - [ ] Tab through date picker
   - [ ] Arrow keys navigate calendar dates
   - [ ] Enter selects date
   - [ ] Tab to "Continue" button
   - [ ] Enter proceeds to next step

5. **Suite Selection**
   - [ ] Tab through suite cards
   - [ ] Space/Enter selects suite
   - [ ] Tab to add-ons checkboxes
   - [ ] Space toggles checkboxes

6. **Payment**
   - [ ] Tab through Stripe Payment Element
   - [ ] All card input fields accessible via Tab
   - [ ] Enter submits payment

7. **No Keyboard Traps**
   - [ ] Verify no keyboard traps at any step
   - [ ] Escape key closes modals
   - [ ] Tab wraps at end of focusable elements

#### Test Steps (Screen Reader)

1. **Screen Reader Setup**
   - [ ] Launch NVDA (Windows) or VoiceOver (macOS)
   - [ ] Load homepage

2. **Landmark Navigation**
   - [ ] Header landmark announced
   - [ ] Navigation landmark announced
   - [ ] Main landmark announced
   - [ ] Footer landmark announced

3. **Heading Structure**
   - [ ] H1 page title read correctly
   - [ ] H2-H6 hierarchy logical
   - [ ] Navigate by headings (H key in NVDA)

4. **Form Labels**
   - [ ] All form inputs have associated labels
   - [ ] Labels read when input focused
   - [ ] Required fields announced
   - [ ] Error messages read aloud

5. **Interactive Elements**
   - [ ] Buttons announced as "button"
   - [ ] Links announced as "link"
   - [ ] Checkboxes announce state (checked/unchecked)
   - [ ] Radio buttons announce state

6. **Dynamic Content**
   - [ ] Live regions announce updates
   - [ ] Loading states announced
   - [ ] Success/error messages announced
   - [ ] Price calculations announced when updated

**Expected Duration:** 15-20 minutes (thorough screen reader testing)  
**Automation:** Limited (manual testing required for screen reader)

---

## 🛠️ Automation Setup

### Playwright Configuration

**Installed:** ✅ Playwright configured (`playwright.config.ts`)

**Test Scripts Location:**
```
tests/
  e2e/
    guest-booking-flow.spec.ts
    authenticated-booking-flow.spec.ts
    booking-modification.spec.ts
    dashboard-messages-photos.spec.ts
    mobile-booking-flow.spec.ts
```

### Running E2E Tests

**Local Execution:**
```bash
# Run all E2E tests
pnpm run test:e2e

# Run specific journey
pnpm playwright test tests/e2e/guest-booking-flow.spec.ts

# Run with UI (headed mode)
pnpm playwright test --headed

# Run on specific browser
pnpm playwright test --project=chromium
pnpm playwright test --project=firefox
pnpm playwright test --project=webkit

# Mobile emulation
pnpm playwright test --project="Mobile Chrome"
pnpm playwright test --project="Mobile Safari"
```

**CI/CD Integration:**
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 Success Criteria

### Journey Success Metrics

| Journey | Target Completion Time | Max Errors Allowed | Pass Criteria |
|---------|------------------------|-------------------|---------------|
| Guest Booking | <5 min | 0 | Payment successful, email sent |
| Authenticated Booking | <3 min | 0 | Faster than guest (saved data) |
| Booking Modification | <3 min | 0 | Changes saved, payment adjusted |
| Messages/Photos | <3 min | 0 | Photos load, download works |
| Mobile Booking | <6 min | 0 | Touch targets ≥44px, payment successful |
| Accessibility | 100% keyboard | 0 | No keyboard traps, screen reader complete |

### Technical Requirements

**Performance:**
- [ ] LCP <1.2s on all pages
- [ ] FID <10ms on all interactions
- [ ] CLS <0.05 throughout journey
- [ ] No console errors
- [ ] No network request failures (except expected 404s)

**Accessibility:**
- [ ] WCAG 2.1 AA compliant
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Screen reader announces all content
- [ ] No keyboard traps

**Cross-Browser:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Mobile Chrome (Android 10+)

---

## 🚨 Failure Scenarios to Test

### Payment Failures
- [ ] Declined card (test card: 4000 0000 0000 0002)
- [ ] Insufficient funds (test card: 4000 0000 0000 9995)
- [ ] Expired card
- [ ] Invalid CVC
- [ ] Network timeout during payment

### Validation Errors
- [ ] Invalid email format
- [ ] Missing required fields
- [ ] Invalid date range (check-out before check-in)
- [ ] Past date selection
- [ ] Vaccine file too large (>5MB)
- [ ] Unsupported file type

### Edge Cases
- [ ] Booking dates fully booked (waitlist)
- [ ] Suite unavailable mid-booking (race condition)
- [ ] Session timeout during booking
- [ ] Browser back button during payment
- [ ] Multiple tabs with same booking

---

## 📋 Test Execution Checklist

### Pre-Test Setup
- [ ] Staging environment deployed and healthy
- [ ] Test database seeded with fixtures
- [ ] Stripe test mode enabled
- [ ] Email capture configured (Mailhog or dev queue)
- [ ] Admin panel accessible for verification
- [ ] Playwright browsers installed (`pnpm playwright install`)

### During Testing
- [ ] Record screen for failed tests
- [ ] Capture console errors/warnings
- [ ] Screenshot at each step
- [ ] Network HAR file for debugging
- [ ] Accessibility violations logged (axe-core)

### Post-Test
- [ ] All 6 journeys executed
- [ ] Results documented in test report
- [ ] Failed tests have bug tickets created
- [ ] Regression tests added for any bugs found
- [ ] Performance metrics reviewed
- [ ] Accessibility scan passed

---

## 🎯 Launch Readiness Gate

**E2E Tests Must Pass Before:**
- ✅ Staged rollout begins (10% traffic)
- ✅ Production deployment
- ✅ Public announcement

**If ANY Journey Fails:**
- 🚫 **BLOCK LAUNCH** - investigate and fix
- 🚫 **NO EXCEPTIONS** for critical paths (Journeys 1, 2, 5, 6)

**Acceptable Partial Failures:**
- ⚠️ Journey 3 (Booking Modification) - can launch with manual support workaround
- ⚠️ Journey 4 (Messages/Photos) - can launch with limited photo gallery

---

## 📚 Related Documentation

- [ACCESSIBILITY_COMPLIANCE.md](ACCESSIBILITY_COMPLIANCE.md) - WCAG checklist
- [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) - Performance targets
- [LAUNCH_READINESS_CHECKLIST.md](LAUNCH_READINESS_CHECKLIST.md) - Full QA checklist
- [QUALITY_GATE_RESULTS.md](QUALITY_GATE_RESULTS.md) - Quality gate status

---

**Next Action:** Execute Journey 1 (Guest Booking Flow) in staging environment

**Status:** ⏳ Ready for manual execution  
**Automation:** 60% automated (Playwright scripts ready for Journeys 1-5)  
**Manual Testing Required:** Journey 6 (Screen Reader)
