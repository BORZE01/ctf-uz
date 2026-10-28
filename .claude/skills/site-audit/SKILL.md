---
name: site-audit
description: Audit an authorized website and its repository end-to-end, including public and authenticated pages, navigation, UI behavior, accessibility, responsiveness, performance signals, and errors. Start with a read-only audit; make fixes only after the user explicitly approves a written plan.
---

# Site Audit Skill

## Mission and operating contract

Perform a thorough, evidence-based audit of the current project and its running website. Inspect the source code and the browser-visible product. Cover public routes and authenticated routes that can be accessed using an account and credentials supplied by the project owner. Produce a prioritized report with reproducible evidence.

**Default mode is READ-ONLY.** Do not edit application files, install packages, change configuration, run migrations, alter data, submit real orders, send messages, upload files, delete records, change permissions, or trigger other consequential actions during the audit. Do not run destructive tests. Do not attempt to bypass authentication, access controls, CAPTCHA, rate limits, or authorization boundaries.

Only after presenting findings, proposed changes, affected files, risks, and tests, ask the user to approve the specific fixes. A general request to “audit” is not approval to modify code. After approval, implement only the approved scope and verify it.

## Phase 0 — Establish scope and safety

1. Identify the repository root and inspect `README`, package/build scripts, framework, test setup, environment example files, route definitions, middleware, auth provider, and existing conventions.
2. Check `git status` before any work. Preserve all pre-existing user changes. Never reset, checkout over, stash, or overwrite user work.
3. Determine the intended site URL and environment from project configuration or ask the user if unclear. Prefer local/staging/test environments. Do not probe a production site unless the user explicitly confirms they own or are authorized to test it.
4. Identify available browser automation (existing Playwright, browser MCP, Chrome DevTools, or other configured tool). Do not assume a browser tool exists. If none exists, explain the limitation and offer a setup path.
5. Never print, copy into reports, or expose secret values from `.env`, browser storage, cookies, authorization headers, tokens, or password managers. You may report that a required variable is missing by its variable name only.
6. For authenticated pages, use only a user-provided test account or a documented local test login. Do not ask the user to paste passwords or session tokens into chat. Prefer environment variables or an interactive login performed locally by the user.
7. Establish explicit limits: host allowlist, crawl depth, maximum pages, request rate, and whether external links may be followed. Default: same-origin only, crawl depth 8, max 300 unique routes/URLs, low concurrency, and no load/stress testing. Respect `robots.txt` and site policies where applicable; robots rules are not authorization.
8. Record the audit timestamp, commit/branch if available, target origin, tool/browser versions, and limits in the report.

If target URL, authorization, or test-account access is unclear, stop before crawling protected or external systems and ask one concise clarifying question.

## Phase 1 — Build an inventory before testing

Inspect both code and the running site.

### Source inventory
- Identify routes from router files, filesystem routes, server handlers, sitemap generation, navigation components, footer components, and redirects.
- Identify role-based route guards and authorization policies.
- Identify interactive controls: links, buttons, forms, dialogs, tabs, accordions, menus, search, filters, pagination, uploads, downloads, and multi-step flows.
- Identify key user journeys from README, product copy, tests, and UI.
- Inspect existing tests and run only safe, non-destructive checks already defined by the project (for example lint, typecheck, unit tests). Avoid commands that deploy, migrate, seed shared databases, or mutate external systems.
- Search for likely issues such as missing error boundaries, unhandled promises, broken route links, missing labels, unsafe assumptions around authorization, and dead code. Treat findings as hypotheses until validated.

### Browser inventory
- Start from the homepage and same-origin sitemap if present.
- Collect same-origin links from rendered pages, including menus, footer, breadcrumbs, cards, and pagination.
- Open each discovered page and record final URL, HTTP/navigation result, page title, main heading, visible content state, and console/page errors.
- Detect redirect loops, unexpected login redirects, 404/500 pages, blank screens, duplicate canonical paths, query-string variations, and pages that are unreachable from navigation but exist in source.
- Deduplicate URLs by normalizing fragments and obvious tracking parameters. Do not discard meaningful query parameters (search, filters, pagination, locale, resource identifiers).
- Use a queue-based crawl and record every URL as `discovered`, `visited`, `blocked`, `excluded`, or `failed`. Explain exclusions and blocked routes rather than claiming complete coverage.
- Do not follow external domains unless specifically approved. Record external links and optionally validate their URL format without crawling them.

### Completeness statement
Never claim “every page was checked” unless the route inventory and crawl logs support that claim. Report the number of discovered, visited, blocked, failed, and excluded routes, plus coverage gaps and reasons.

## Phase 2 — Exercise the UI safely

For each relevant page, test visible and expected interactions. Prefer Playwright if already available or approved for setup.

### Safe interaction rules
- Use test data and test accounts only.
- Do not finalize real purchases, send real emails/SMS, publish content, change billing, invite users, alter production records, or perform irreversible actions.
- For high-impact actions (delete, pay, send, publish, submit to an external party), inspect the confirmation UI and stop before final confirmation unless the user explicitly approves a controlled test in a safe environment.
- Do not brute-force logins, enumerate users, bypass MFA/CAPTCHA, or test access to other users' data.
- Verify authorization using only accounts/roles the owner has explicitly provided, with harmless read-only checks. Never access another person's account or data.
- Avoid submitting forms with invented real personal information. Use clearly synthetic values in a local/staging environment.
- Keep request rates low; no stress/load testing.

### Interaction checklist
- Header/footer navigation, logo, breadcrumbs, mobile menu, dropdowns, tabs, accordions, pagination, filters, search and clear/reset.
- Forms: labels, required fields, validation messages, keyboard navigation, error state, success state in test environment, duplicate-submit prevention, and server-side validation evidence where safe.
- Dialogs: open/close, Escape, focus handling, click outside if expected, and focus restoration.
- Links: correct target, broken internal links, unexpected external target, `target=_blank` safety, and meaningful accessible names.
- Authentication: login, logout, expired/unauthenticated state, protected-route redirect, role-specific navigation, and session timeout behavior when test setup supports it.
- Empty/loading/error states, network failures that can be simulated safely, and retry behavior.
- Downloads/uploads only with harmless test files and only in safe environments.
- Responsive layouts at representative widths (approximately 360, 390, 768, 1024, and 1440 CSS pixels); note horizontal overflow, clipped content, inaccessible controls, and layout shifts.
- Keyboard-only operation and visible focus.
- Browser console errors, uncaught exceptions, failed same-origin requests, and relevant HTTP status codes.

For each action, record the expected result, actual result, evidence, and whether the test was blocked or skipped. Do not infer success merely because a button click did not throw an exception.

## Phase 3 — Technical checks

Run only checks supported by the project and safe for the target environment.

### Reliability
- Broken internal links and missing routes.
- Client-side exceptions, hydration warnings, failed API requests, and server error responses.
- Loading, empty, error, retry, and offline/degraded states where testable.
- Duplicate form submissions and obvious navigation dead ends.

### Accessibility (automated + manual sampling)
- Semantic headings and landmarks.
- Accessible names for buttons and inputs, label association, image alternative text, and form error announcements.
- Keyboard reachability, focus visibility, focus order, dialog focus behavior, and skip navigation where appropriate.
- Color contrast using available tooling; distinguish automated estimates from verified results.
- Use axe-core/Playwright or existing accessibility tooling if installed. Do not claim WCAG compliance based only on automated checks.

### Performance signals
- Capture navigation timing and resource failures where available.
- Note unusually large assets, excessive request counts, long tasks, layout shifts, and missing caching hints only when measured.
- Use Lighthouse or project-defined performance tools if available. Avoid production load tests. State device/network profile and tool versions for any score.
- Treat field metrics (real-user Core Web Vitals) as unavailable unless a real data source is configured.

### SEO and metadata
- Page title, meta description, canonical URL, robots directives, sitemap, robots.txt, heading structure, language, Open Graph basics, and obvious duplicate/missing metadata.
- Validate structured data only when present and with available tooling.
- Do not label a page “not indexed” merely because it has a robots directive; explain what was observed.

### Security hygiene (non-invasive)
- Inspect source/config for accidental client-side secret exposure, unsafe debug endpoints, missing obvious auth guards, overly permissive CORS/CSP indications, insecure cookie settings when visible, and unsafe rendering patterns.
- Do not exploit vulnerabilities, exfiltrate data, run destructive payloads, scan unrelated hosts, or attempt privilege escalation.
- Distinguish a code-level concern from a confirmed runtime vulnerability. Provide a safe reproduction only for authorized, non-destructive cases.

## Phase 4 — Evidence and severity

Every finding must include:
- ID (e.g. `UI-001`, `A11Y-002`, `SEC-001`)
- Severity: `Critical`, `High`, `Medium`, `Low`, or `Info`
- Confidence: `Confirmed`, `Likely`, or `Needs verification`
- Title and concise impact
- Exact route/component/file and line number if available
- Reproduction steps
- Expected vs actual behavior
- Evidence: sanitized console message, status code, screenshot path if available, or code reference
- Recommended fix
- Test that would verify the fix

Severity guidance:
- **Critical:** confirmed severe exposure or system-wide outage; stop testing and notify the user immediately.
- **High:** core journey blocked, serious access-control issue with safe evidence, or broad data-integrity risk.
- **Medium:** important feature broken or significant usability/accessibility issue.
- **Low:** minor visual/content defect or edge case.
- **Info:** improvement or observation without a demonstrated defect.

Do not inflate severity. Do not include secrets, personal data, tokens, or raw authenticated storage in evidence. Redact sensitive values and use synthetic IDs.

## Phase 5 — Deliver the audit report

Write a Markdown report to `reports/site-audit-YYYY-MM-DD.md` only if creating that report is safe and does not overwrite an existing file. If the folder/file exists, choose a new timestamped filename. The report itself is allowed as an audit artifact; application code remains untouched.

Report structure:
1. Executive summary
2. Scope, authorization assumptions, target environment, date, versions, limits
3. Coverage metrics: discovered/visited/blocked/failed/excluded routes
4. Route inventory table: URL/path, auth state/role, result, interactions exercised
5. Findings grouped by severity, with all required evidence fields
6. Accessibility, responsive, SEO, performance, and security-hygiene observations
7. Tests/commands run and their outcomes
8. Skipped checks and why
9. Recommended fix plan, grouped into small batches with affected files and regression tests
10. Explicit statement: no application changes made during audit (if true)

Also provide a concise terminal summary with the highest-priority findings and report path. Clearly separate confirmed issues from hypotheses and untested areas.

## Phase 6 — Approval gate and remediation

After the report, present the proposed fix plan and ask the user to approve a specific batch. Do not start editing before explicit approval.

After approval:
1. Re-check `git status` and preserve unrelated changes.
2. Implement only the approved fixes; avoid broad refactors.
3. Add or update regression tests.
4. Run focused tests, then relevant lint/typecheck/build tests if safe.
5. Re-run the affected browser journeys and relevant route checks.
6. Review the diff for unintended changes and secrets.
7. Report changed files, tests, residual risks, and anything not verified.
8. Ask before any deployment, migration, production data change, or irreversible operation.

## Browser automation guidance

If Playwright is already installed, use the repository's existing conventions first. Otherwise, before installing anything, explain the proposed dependency and ask approval. Do not globally install packages.

For a JavaScript/TypeScript project, an approved local setup commonly uses:
- `npm install -D @playwright/test`
- `npx playwright install chromium`
- `npx playwright test`

Check the package manager and lockfile first; use the existing package manager. Installing a browser may download binaries. Do not modify package files without approval.

For login state, prefer an interactive local login or a dedicated test account. Keep storage state under `playwright/.auth/`, add that directory to `.gitignore`, and never commit storage-state files. Never put credentials in source code or reports. Do not print the contents of the auth state file.

When using Playwright, prefer isolated browser contexts and use stable selectors (`getByRole`, `getByLabel`, `getByTestId`) over brittle CSS selectors. Use explicit assertions and sensible timeouts. Keep screenshots/traces sanitized; do not capture sensitive user data.

## If tools are missing

If no browser, network access, credentials, or test environment is available:
- Continue with the source-code audit and existing safe test suite.
- Mark browser-only checks as `Blocked` or `Not run`, not passed.
- Give the user exact prerequisites needed to finish the blocked checks.
- Never fabricate browser results, HTTP statuses, screenshots, coverage, or test outcomes.

## Suggested invocation

Run `/site-audit` from the repository root. The user may add:
- `audit only`
- `audit http://localhost:3000`
- `audit with test account already logged in`
- `after reporting, propose fixes but do not apply them`
- `apply approved fixes: [specific finding IDs]`
