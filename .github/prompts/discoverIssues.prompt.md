Conduct a complete end-to-end QA, UX, functionality, and improvement audit of the entire website/application at:

`https://zainesstayandplay.com`

You must navigate through and interact with **every major page, feature, form, workflow, dashboard, modal, menu, button, link, and user-facing system**. Test the application from both the **customer perspective** and the **admin perspective**.

Use the available database or project configuration to locate valid **customer and admin credentials**. Do not guess credentials. If credentials are stored in seed data, environment variables, test fixtures, documentation, or the database, identify and use the correct accounts.

The goal is to get a complete, realistic view of the entire application and identify:

* Bugs
* Broken links
* Broken buttons
* Console errors
* Failed API calls
* UI/UX issues
* Mobile responsiveness problems
* Accessibility issues
* Confusing workflows
* Inconsistent branding
* Missing validation
* Security or authorization issues
* Admin/customer permission problems
* Inefficient workflows
* Missing features
* Opportunities to make the platform more polished, professional, and world-class

You must manually test all important workflows, including but not limited to:

### Customer-Side Testing

Test the full customer experience from first visit through account usage.

Review and test:

* Homepage
* Service pages
* Pricing or package pages
* Booking flow
* Checkout/payment flow, if available in test mode
* Account creation
* Login/logout
* Password reset or magic link flow, if present
* Customer dashboard
* Booking management
* Pet profile creation/editing
* Service history
* Messages or notifications
* Forms and contact flows
* Mobile navigation
* Error states and empty states
* Confirmation screens and email-triggering actions, if applicable

For every customer workflow, verify:

* The workflow is understandable
* All required actions are clear
* Validation works correctly
* Success/error messages appear at the right times
* The design feels polished and trustworthy
* There are no dead ends or confusing transitions

### Admin-Side Testing

Test the full admin experience using admin credentials.

Review and test:

* Admin login
* Admin dashboard
* Customer management
* Pet management
* Booking management
* Calendar or scheduling tools
* Service/package management
* Payments or invoices, if available
* Messages or notifications
* Settings
* Staff/user management, if available
* Reports/analytics, if available
* Any CRUD workflows: create, read, update, delete
* Search, filtering, sorting, pagination
* Permission boundaries between admin and customer accounts

For every admin workflow, verify:

* Admin tools actually work
* Data updates persist correctly
* Forms validate properly
* Actions show clear confirmations
* Destructive actions have safeguards
* Admin views are efficient and not cluttered
* The admin experience supports real business operations

### Technical QA Requirements

While testing, check for:

* Browser console errors
* Network/API failures
* Slow-loading pages
* Broken assets/images
* Hydration errors
* Layout shifts
* Broken routes
* Invalid redirects
* Auth/session bugs
* Database persistence issues
* Role-based access control issues
* Mobile/tablet/desktop layout problems
* Edge cases with empty data, invalid data, and repeated actions

Use browser devtools, logs, and database inspection where appropriate.

### Security and Authorization Testing

Verify that:

* Customers cannot access admin routes
* Admin-only APIs are protected
* Logged-out users are redirected appropriately
* Customer data is isolated from other customers
* Sensitive actions require proper authorization
* Forms are protected against obvious abuse
* Error messages do not expose sensitive internal details

### UI/UX and Business Quality Review

Evaluate the platform as if it were a real production business website for a dog daycare/pet care company.

Look for opportunities to improve:

* Trust and credibility
* Visual polish
* Branding consistency
* Conversion rate
* Booking completion rate
* Customer confidence
* Admin efficiency
* Speed and clarity of workflows
* Mobile-first usability
* Emotional appeal for pet owners
* Professionalism compared to top local and national competitors

### Required Output

Produce a detailed audit report with the following structure:

1. **Executive Summary**

   * Overall rating out of 10
   * Biggest strengths
   * Biggest weaknesses
   * Most urgent issues

2. **Critical Bugs**

   * Issue
   * Steps to reproduce
   * Expected behavior
   * Actual behavior
   * Severity
   * Recommended fix

3. **Customer Workflow Findings**

   * Page/workflow tested
   * Problems found
   * UX concerns
   * Improvement recommendations

4. **Admin Workflow Findings**

   * Page/workflow tested
   * Problems found
   * Business impact
   * Improvement recommendations

5. **Authentication and Permissions Review**

   * Login/logout findings
   * Customer/admin access control findings
   * Any security concerns

6. **UI/UX Improvement Opportunities**

   * Design polish
   * Layout issues
   * Navigation improvements
   * Mobile improvements
   * Empty/error state improvements

7. **Performance and Technical Findings**

   * Console errors
   * API/network errors
   * Loading issues
   * Broken routes/assets

8. **High-ROI Improvements**
   Prioritize improvements by impact:

   * Quick wins
   * Medium-effort improvements
   * Major strategic improvements

9. **Recommended GitHub Issues**
   Create a clear list of implementation-ready GitHub issues. Each issue should include:

   * Title
   * Description
   * Priority
   * Acceptance criteria
   * Suggested labels
   * Testing requirements

10. **Final Roadmap**
    Provide a prioritized action plan to make the site feel polished, trustworthy, modern, and production-ready.

Be extremely thorough. Do not only click around superficially. Interact with the site as a real customer and a real admin would. Test every workflow deeply enough to uncover real-world bugs, friction, and opportunities for improvement.
