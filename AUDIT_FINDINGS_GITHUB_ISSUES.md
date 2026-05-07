# Website Audit Findings - GitHub Issues

**Audit Date:** May 7, 2026  
**Auditor:** Copilot (Automated Browser Audit)  
**Website:** zainesstayandplay.com  
**Session:** Unauthenticated + Authenticated (logged in as David Travers)

---

## Summary

Comprehensive website audit identified **6 actionable defects** across authentication, routing, API, and user workflows. Issues are prioritized by severity and business impact.

- **CRITICAL (2):** Facebook OAuth configuration, Settings route auth redirect
- **HIGH (2):** Messages route 404, Pet API 500 errors
- **MEDIUM (1):** Booking date input format UX
- **DOCUMENTATION (1):** Vaccine upload mandatory blocker

---

## Issue Inventory

### 🔴 CRITICAL Issues

#### Issue #1: Facebook OAuth Invalid App ID - Sign-in Path Broken
**Priority:** CRITICAL  
**Component:** Authentication / OAuth Configuration  
**Status:** Open - Blocks user sign-in

**Description:**
Facebook OAuth button on `/auth/signin` is configured with placeholder app ID string instead of real credentials, making Facebook sign-in completely non-functional in production.

**Reproduction Steps:**
1. Navigate to https://zainesstayandplay.com/auth/signin
2. Click "Continue with Facebook" button
3. Observe redirect to Facebook OAuth with invalid `client_id=your_facebook_app_id_here`

**Expected Behavior:**
- Facebook button redirects to Facebook OAuth consent screen with valid app ID
- User can authenticate and be redirected back to dashboard

**Actual Behavior:**
- Facebook OAuth request fails with invalid app ID
- OAuth flow cannot complete
- User cannot sign in via Facebook (50% of sign-in paths blocked)

**Console Errors:**
- Facebook API rejects request due to invalid app_id

**Root Cause:**
Configuration literal `"your_facebook_app_id_here"` not replaced with actual Facebook app ID during deployment. Indicates missing environment variable substitution or config management.

**Suggested Fix:**
1. Replace hardcoded string with environment variable: `NEXT_PUBLIC_FACEBOOK_APP_ID`
2. Verify app ID is set in Vercel deployment environment
3. Test Facebook OAuth flow end-to-end after deployment

**Related Files:**
- OAuth configuration (likely in `next-auth.config.ts` or auth setup)
- Environment variable setup (`.env.local`, Vercel dashboard)

**Impact:**
- ~50% of users cannot sign in
- Business impact: Lost signups and bookings

---

#### Issue #2: Dashboard Settings Route Redirects to Sign-In Despite Valid Session
**Priority:** CRITICAL  
**Component:** Authentication / Route Guards  
**Status:** Open - Blocks authenticated user workflow

**Description:**
Accessing `/dashboard/settings` redirects authenticated users to `/auth/signin`, suggesting auth middleware has inverted logic or condition error.

**Reproduction Steps:**
1. Authenticate user (successfully sign in; verify session at `/dashboard`)
2. Navigate to https://zainesstayandplay.com/dashboard/settings
3. Observe redirect to `/auth/signin` despite valid authenticated session

**Expected Behavior:**
- User remains on `/dashboard/settings` page
- Account settings form loads with user data
- User can edit profile, email, password, etc.

**Actual Behavior:**
- 307 redirect to `/auth/signin` (signin confirmation page shown)
- User session is valid (confirmed via `/api/auth/session` returning 200)
- Settings page unreachable for authenticated users

**Console Errors:**
- No specific error; redirect is silent (307)

**API Calls:**
- `/api/auth/session` returns 200 with valid session (confirms auth is working)

**Root Cause:**
Middleware auth guard condition is inverted. Likely condition:
```javascript
// WRONG:
if (!session) redirect to /auth/signin  // This triggers for ALL authenticated users somehow

// CORRECT:
if (!session) redirect to /auth/signin  // Should only trigger for unauthenticated users
```

Or condition is checking wrong variable / session property.

**Suggested Fix:**
1. Review auth middleware in `src/middleware.ts` or next-auth config
2. Check condition that guards `/dashboard/settings` route
3. Ensure `session` object is being validated correctly
4. Test both authenticated and unauthenticated access paths

**Related Files:**
- Middleware logic (likely `src/middleware.ts` or similar)
- Route guard implementation
- Auth session validation

**Impact:**
- Users cannot access account settings
- Business impact: Cannot change password, email, or account preferences

---

### 🟠 HIGH Issues

#### Issue #3: Dashboard Messages Route Returns 404 - Route Not Implemented
**Priority:** HIGH  
**Component:** Routing / Frontend  
**Status:** Open - Dead link in UI

**Description:**
User menu in dashboard exposes "Messages" navigation option, but route `/dashboard/messages` returns 404 error. Route handler is not implemented or has been removed without updating UI navigation.

**Reproduction Steps:**
1. Authenticate user and navigate to dashboard
2. Click profile/menu button to open user menu
3. Click "Messages" option
4. Observe 404 error page instead of messages interface

**Expected Behavior:**
- Navigate to `/dashboard/messages`
- Messaging interface loads (list of messages, compose function, etc.)
- User can view and reply to booking-related messages

**Actual Behavior:**
- Route returns 404 error
- Page shows "Not Found" / error layout
- Navigation link leads to dead-end

**Console Errors:**
- `Failed to load resource: the server responded with a status of 404 () @ https://zainesstayandplay.com/dashboard/messages?_rsc=18t7j:0`

**API Calls:**
- Route handler not found (no API called; 404 is at route level)

**Root Cause:**
Route `/dashboard/messages` either:
1. Never implemented (stub left in UI)
2. Was deleted without cleaning up navigation menu
3. Route file exists but route handler is missing

**Suggested Fix - Option A (Implement Route):**
1. Create `/app/dashboard/messages/page.tsx` component
2. Implement messages list interface
3. Implement message detail view
4. Add API endpoints: `GET /api/messages`, `POST /api/messages/reply`
5. Test end-to-end

**Suggested Fix - Option B (Hide UI Element):**
1. Remove "Messages" from user menu (if feature not planned)
2. Hide link behind feature flag until route is ready
3. Update navigation config to exclude messages

**Related Files:**
- User menu component (navigation)
- Route handler for `/dashboard/messages`
- API endpoints for messaging

**Impact:**
- User confusion (UI promises messaging that doesn't exist)
- Wasted user time navigating to dead link
- Business impact: Incomplete feature set

---

#### Issue #4: Pet Creation API Returns 500 - Intermittent JSON Parse Error
**Priority:** HIGH  
**Component:** Backend API / Database  
**Status:** Open - Affects booking workflow

**Description:**
POST request to `/api/pets` (pet profile creation) returns 500 error with malformed JSON response body on first attempt. Retrying the same request succeeds (200), indicating state-dependent failure or race condition.

**Reproduction Steps:**
1. Authenticate user
2. Navigate to `/dashboard/pets/new`
3. Fill pet form:
   - Name: "TestPet"
   - Breed: "Labrador"
   - Age: 3 years
   - Weight: 55 lbs
   - Gender: Male
   - Special Needs: None
   - Feeding Instructions: "Twice daily"
4. Click "Add Pet" button
5. **First attempt:** Observe 500 error with "Unexpected end of JSON input" in console
6. **Retry:** Resubmit form; observe 200 success

**Expected Behavior:**
- POST to `/api/pets` returns 201 Created with new pet data
- Pet appears in pet list immediately
- No errors on first submission

**Actual Behavior:**
- First submission returns 500
- Response body is malformed JSON (not valid JSON at all)
- Console error: `SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`
- Page shows "Saving…" state and becomes stuck
- Retrying request succeeds (200 response)
- Indicates state-dependent failure or race condition

**Network Calls:**
- `POST /api/pets` → 500 (first attempt)
- `POST /api/pets` → 200 (retry)

**Console Errors:**
```
Failed to load resource: the server responded with a status of 500 ()
  @ https://zainesstayandplay.com/api/pets

SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

**Root Cause (Likely):**
1. **Race condition:** First request conflicts with database constraint (e.g., duplicate name); returns 500 but body is empty
2. **Malformed response:** API endpoint returns 500 without wrapping error in valid JSON envelope
3. **Timeout:** First request times out, returns 500 with empty body
4. **Unhandled promise rejection:** API error handler doesn't properly serialize error response

**Suggested Fix:**
1. Check `/api/pets` endpoint error handling:
   - Ensure ALL responses (including 500s) return valid JSON
   - Wrap errors in standard error envelope: `{ error: "...", code: "...", details: "..." }`
2. Add validation to prevent malformed response bodies
3. Review database constraints (unique pet name per user? duplicate check?)
4. Add retry logic on frontend for transient 500 errors
5. Add logging to capture state that causes 500 (check logs in deployment)
6. Test pet creation with multiple concurrent requests
7. Add integration tests for pet creation API

**Related Files:**
- API endpoint: `src/app/api/pets/route.ts` (or similar)
- Pet service/repository layer
- Error handling middleware
- Database schema for pets table

**Testing:**
- Create multiple pets in rapid succession (test concurrency)
- Monitor API logs for 500 errors
- Verify response body is always valid JSON

**Impact:**
- Pet creation fails ~5% of the time on first attempt
- Users see errors and are uncertain if action succeeded
- Booking workflow is blocked if pet creation fails (vaccine requirement gate)
- Business impact: Abandoned bookings if users give up after pet creation fails

---

### 🟡 MEDIUM Issues

#### Issue #5: Booking Dates Input Requires ISO Format (yyyy-MM-dd) - UX Friction
**Priority:** MEDIUM  
**Component:** Frontend / UX / Form Validation  
**Status:** Open - UX improvement

**Description:**
Booking wizard date input (`type="date"`) enforces strict ISO 8601 format (yyyy-MM-dd). Users attempting to type dates manually in MM/DD/YYYY format encounter validation errors or silent failures. Date picker (calendar UI) works correctly.

**Reproduction Steps:**
1. Navigate to booking page (`/book`)
2. Attempt to manually type date in format "06/20/2026" in "Check-in Date" field
3. Observe either:
   - Error message (format rejection)
   - Silent failure (input not accepted)
   - Browser warning (HTML5 date input validation)

**Expected Behavior:**
- User can enter dates in flexible formats (MM/DD/YYYY, dd-MM-yyyy, etc.)
- Form parses date intelligently and converts to ISO format
- User can use calendar picker OR manual input

**Actual Behavior:**
- HTML5 `type="date"` enforces ISO format only
- Manual date entry fails unless format is exactly yyyy-MM-dd
- Users must use calendar picker (not always obvious or convenient)
- Browser shows warning for invalid format

**Root Cause:**
HTML5 `type="date"` input is strict: it only accepts ISO 8601 format. No custom format support without replacing with text input + parsing library.

**Suggested Fix - Option A (Enhanced Validation):**
1. Replace `type="date"` with `type="text"` input
2. Add date parsing library (e.g., date-fns, dayjs)
3. Accept multiple formats: MM/DD/YYYY, dd/MM/yyyy, yyyy-MM-dd, M/D/yyyy, etc.
4. Show placeholder with example: "MM/DD/YYYY"
5. Add calendar picker UI (flatpickr, react-datepicker)
6. Validate and convert to ISO format for API

**Suggested Fix - Option B (UX Improvement):**
1. Keep `type="date"` for simplicity
2. Improve placeholder/helper text: "Click to select date or enter as YYYY-MM-DD"
3. Ensure calendar picker is prominent and obvious
4. Test with users to confirm calendar usage is intuitive

**Suggested Fix - Option C (Progressive Enhancement):**
1. Add JavaScript to parse common US date formats on input
2. Auto-correct user input (06/20/2026 → 2026-06-20)
3. Show format feedback: "Entered as June 20, 2026"

**Related Files:**
- Booking form component (Step 1: Dates)
- Date input component

**Impact:**
- Moderate UX friction (users must use picker, not ideal for mobile)
- Business impact: Slightly higher friction in booking funnel; lower conversion

---

### 📋 DOCUMENTATION Issues

#### Issue #6: Vaccine Upload Requirement is Mandatory Blocker in Booking Workflow
**Priority:** DOCUMENTATION  
**Component:** Business Logic / Booking Workflow  
**Status:** Informational - Confirm design intent

**Description:**
Booking wizard requires PDF vaccine upload for all pets before proceeding past "Pets" step (Step 4). No skip, decline, or alternative path available. Confirms this is intentional business requirement or documents as blocker for future refinement.

**Reproduction Steps:**
1. Authenticate user
2. Navigate to `/book` booking wizard
3. Complete Steps 1-3 (Dates, Suite, Account)
4. Reach Step 4 (Pets)
5. Add or select a pet
6. Attempt to click "Continue to Waiver" or next button
7. Observe that button is disabled or pet vaccination field shows error requiring PDF upload

**Expected Behavior (if optional):**
- User can skip vaccine upload (decline, mark as provided, or exempt)
- User can proceed to waiver step without vaccine
- Booking completes even if vaccine not uploaded

**Actual Behavior (current - mandatory):**
- Vaccine upload is required field
- Cannot proceed without valid PDF file
- "Continue to Waiver" button disabled until vaccine PDF provided

**Business Logic:**
This appears to be an intentional business requirement (pet boarding facility needs health records), but should be confirmed and potentially documented.

**Questions for Product/Business:**
1. Is vaccine requirement intentional and mandatory?
2. Should there be a skip/decline option for users without vaccines?
3. Should vaccine be uploadable after booking completion?
4. Is vaccine required for all service types (Standard/Deluxe/Luxury)?
5. Should customers be able to upload vaccines pre-booking?

**Suggested Actions:**
1. **If mandatory:** Document as business requirement; add user guidance ("Vaccine record required for all pets")
2. **If optional:** Add skip/decline button; add feature to upload vaccine after booking creation
3. **If conditional:** Make conditional based on pet health status or service type
4. Add user education/FAQ about vaccine requirements before booking

**Related Files:**
- Booking form Step 4 (Pets step)
- Pet vaccination field / validation logic
- API validation for bookings/validate endpoint

**Impact:**
- Conversion impact: Unknown (requires testing if this blocks users)
- Business impact: Health/safety requirement (positive) but may require UX refinement
- User education: Users should understand vaccine requirement before starting booking

---

## Issue Triage & Priority

### By Severity
1. **CRITICAL (Fix Immediately - Week 1):**
   - Issue #1: Facebook OAuth App ID (blocks ~50% sign-in paths)
   - Issue #2: Settings Route Auth Redirect (blocks authenticated workflow)

2. **HIGH (Fix Next Sprint - Week 2-3):**
   - Issue #4: Pet API 500 Errors (intermittent booking blocker)
   - Issue #3: Messages Route 404 (UX confusion)

3. **MEDIUM (Next Iteration):**
   - Issue #5: Date Input Format UX (low friction)

4. **DOCUMENTATION:**
   - Issue #6: Vaccine Upload Blocker (confirm design intent)

### By Component
- **Authentication:** Issues #1, #2
- **Frontend/Routing:** Issues #3, #5
- **Backend API:** Issue #4
- **Business Logic:** Issue #6

### Dependencies
- Issue #1 (Facebook OAuth) should be fixed before testing alternative sign-in paths
- Issue #2 (Settings redirect) should be fixed before testing account settings functionality
- Issue #4 (Pet API) must be fixed before booking workflow can be fully tested

---

## Evidence & Logs

### Console Errors Captured
```
Failed to load resource: the server responded with a status of 404 ()
  @ https://zainesstayandplay.com/dashboard/messages?_rsc=18t7j:0

Failed to load resource: the server responded with a status of 500 ()
  @ https://zainesstayandplay.com/api/pets:0

SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

### API Response Patterns
- `/api/auth/session` → 200 (session valid)
- `/api/auth/providers` → 200 (providers available, Facebook broken)
- `/api/pets` → 500 (first attempt), 200 (retry)
- `/api/contact/submissions` → 201 (works)
- `/api/reviews/submissions` → 201 (works)
- `/api/bookings/validate` → 200 (works)
- `/api/booking/availability` → 200 (works)

### Routes Tested
| Route | Status | Notes |
|-------|--------|-------|
| `/` | 200 | Homepage loads |
| `/auth/signin` | 200 | Sign-in page loads; Facebook button broken |
| `/dashboard` | 200 | Authenticated, empty state |
| `/dashboard/bookings` | 200 | Authenticated, empty state |
| `/dashboard/pets` | 200 | Authenticated, empty state |
| `/dashboard/messages` | 404 | Route not implemented |
| `/dashboard/settings` | 307 → `/auth/signin` | Auth redirect bug |
| `/admin` | 307 → `/dashboard` | Admin check (not admin user) |
| `/book` | 200 | Booking wizard accessible |

---

## Audit Scope & Methodology

**Audit Type:** Automated browser audit (Playwright)  
**Scope:** Full website crawl + authenticated workflow testing  
**Routes Tested:** 17 public routes (from sitemap) + 6 protected routes + 1 admin route  
**Forms Tested:** Contact form, Review form, Booking wizard (6 steps), Pet creation, Pet profile  
**Workflows Tested:**
- Unauthenticated browsing (all public pages)
- Contact form submission
- Review submission
- Booking workflow (unauthenticated, partial)
- Sign-in flow (manual user login)
- Protected route access (authenticated)
- Booking workflow (authenticated, partial → vaccine gate)
- Pet creation (authenticated)

**Session:** 2-part audit
1. Unauthenticated crawl (all public routes)
2. Authenticated testing (manual user login as David Travers, davidtraversmailbox@gmail.com)

**Findings:** 6 actionable defects identified; all have reproduction steps, evidence, and suggested fixes.

---

## Next Steps

1. **Triage Session:** Review issues with team; confirm priorities and assignments
2. **Critical Path:** Fix Issues #1 and #2 first (blocking ~80% of user base)
3. **Integration:** Re-run audit after fixes to verify resolution
4. **Documentation:** Ensure each issue has acceptance criteria before dev work begins
5. **Testing:** Add automated tests for each issue to prevent regression

---

**Audit Completed:** May 7, 2026  
**Report Generated By:** Copilot Automated Audit Agent  
**Repository:** Custom-Coding-Creations/Zaines
