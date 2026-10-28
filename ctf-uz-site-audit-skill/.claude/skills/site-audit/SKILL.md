---
name: site-audit
description: Read-only, end-to-end audit of the CTF-UZ Node.js/Express cybersecurity training and CTF platform, including static HTML pages, API routes, authentication/session handling, challenges, learning paths, battles, certificates, and admin areas. Requires explicit approval before fixes.
---

# CTF-UZ Site Audit

## Project-specific context

This repository is `ctf-uz`, described in `package.json` as CTF.UZ, a national CTF/cybersecurity learning platform. The inspected project manifest indicates:
- Node.js (>=18), Express (`server.js` entry point), static frontend under `public/`
- MongoDB/Mongoose and Redis-related dependencies
- Authentication/session-related dependencies and middleware
- API route modules under `routes/`
- Existing Jest/Supertest tests: `tests/auth.test.js`, `tests/api.test.js`
- NPM scripts include `start`, `dev`, and `test`; there is also a challenge-seeding script. Read the current `package.json` before relying on this inventory.

Likely page areas in `public/` include login/register/reset-password, dashboard/profile, challenges/arena/leaderboard, learning/lessons, battles, events, careers/jobs, certificates/Cyber ID, and admin pages. These are inventory leads, not proof that every page is reachable or currently enabled.

Route modules observed include authentication, users, challenges, learning, battles, teams, writeups, events, jobs, applications, certificates, notifications, admin, and related modules. Discover actual mount paths from `server.js` and each router; do not guess endpoint URLs.

## Non-negotiable safety rules

- Begin in **read-only audit mode**. Do not edit application files, install packages, run database seed/reset/clear scripts, migrate schemas, or alter stored data.
- Do not run project scripts merely because their names look helpful. This repository contains maintenance/patch/seed/clear/reset/backup scripts. Inspect scripts before any execution; do not execute scripts named or behaving like `clear`, `reset`, `nuke`, `seed`, `restore`, `patch`, or database backup/restore without explicit, specific approval and a disposable test environment.
- Preserve all existing user changes and backups. Check `git status`; never reset, clean, checkout over, or stash work.
- Never read out or copy secret values from `.env`, credentials, tokens, cookies, session storage, database URLs, private keys, or backups. Do not include them in terminal output, screenshots, traces, or reports. `.env` is sensitive; inspect only variable *names* if necessary, never values.
- Do not run seed scripts or tests that may mutate a shared database until their side effects are understood. Read `tests/auth.test.js`, `tests/api.test.js`, test setup, and `package.json` scripts first.
- Use only a local disposable database or explicitly approved staging instance. Do not point tests at production MongoDB/Redis. Never guess credentials.
- For admin/protected pages, use only a dedicated test account explicitly authorized by the owner. Do not bypass login, MFA, authorization checks, rate limits, CAPTCHA, or access other users' private data.
- CTF challenge submission can change scores, progress, unlocks, or records. Do not submit flags or trigger score/progress mutations against production. Use a disposable staging/test account and synthetic challenge data, or stop before final submission.
- Do not finalize consequential operations: deleting accounts/challenges, publishing events, sending notifications/email, issuing/revoking certificates, changing roles, uploading user files, or modifying billing/external integrations. Inspect the UI and stop before final confirmation unless explicitly approved in a safe test environment.
- Only test systems the user owns or is authorized to assess. Keep crawling same-origin, low-rate, and bounded. No load/stress testing or destructive security testing.

## Phase 0 — Establish a safe baseline

1. Confirm the current working directory is the `ctf-uz` repository root.
2. Inspect `git status --short`, `package.json`, `.gitignore`, `server.js`, middleware, route mount points, test setup, and relevant README/docs if present.
3. Do not print `.env` contents. Confirm `.env` is ignored without revealing its values. If secrets appear committed, report only file/path and secret category; do not repeat the secret.
4. Determine the target origin. Prefer local development or staging with disposable data. If target ownership/authorization or target environment is unclear, ask before browser crawling.
5. Determine if Playwright or another browser automation tool is already installed. The initial manifest lists Jest/Supertest, but do not assume Playwright exists. Ask before installing dependencies or browser binaries.
6. Record the audit date, current branch/commit when available, target origin, tool versions, scope limits, and whether database/test data is disposable.
7. Set defaults: same-origin only; crawl depth 8; up to 300 unique URLs; low concurrency; no load testing. Respect access controls and site policies.

## Phase 1 — Build a verified route inventory

### Static frontend
- Enumerate HTML pages under `public/`, including nested files, and identify links/forms/scripts from the source.
- Include login, registration, password reset, profile, dashboard, challenge/arena, learning/lesson, battle, event, job/career, certificate, and admin areas where present.
- Follow actual links and redirects. Distinguish pages that are direct static files from pages that require a session or client-side API data.
- Check navigation, header/footer links, page titles, headings, empty states, and assets. Identify references to missing local files.
- Do not infer that `admin*.html` is protected just because of its filename; verify server behavior and route guards.

### Express/API
- Read `server.js` to identify static hosting, API prefixes, middleware order, session setup, CORS/security headers, error handlers, and router mounts.
- Read route modules and middleware to map endpoints and access requirements. Do not invoke guessed endpoints.
- Build a table of route/method, intended role/session requirement, source file, and whether safely exercised.
- For every protected route, verify only with an authorized test account and harmless read-only request. Do not probe other users' object IDs or enumerate records.

### Crawl accounting
Every URL/route must be marked `discovered`, `visited`, `blocked`, `failed`, or `excluded`. Deduplicate fragments and obvious tracking parameters, but preserve meaningful query parameters. Record why routes could not be checked. Never claim complete coverage without logs.

## Phase 2 — Test browser behavior safely

Use existing Playwright conventions if present. If Playwright is absent, continue source/API checks and ask before adding it. Prefer stable accessible selectors (`getByRole`, `getByLabel`, `getByTestId`) and explicit assertions.

Check:
- Main navigation, logo, footer, breadcrumbs, dropdowns, tabs, accordions, search/filter/pagination.
- Login/logout, registration validation, password-reset UI, session redirects, role-aware navigation, and protected-route behavior, only with a dedicated test account.
- Profile and dashboard rendering, learning-path/lesson navigation, challenge details, leaderboard, battle UI, events, jobs/applications, certificates/Cyber ID, and admin UI where applicable.
- Forms for required fields, labels, validation, server errors, success states in a disposable environment, duplicate-submit prevention, and keyboard accessibility.
- Dialog focus, Escape behavior, visible focus, tab order, responsive layout at ~360, 390, 768, 1024, and 1440 CSS px.
- Console exceptions, failed same-origin network requests, HTTP 4xx/5xx, broken internal links, blank pages, and redirect loops.

Do not submit real challenge flags, create production content, send real emails/notifications, issue certificates, change roles, or perform irreversible actions. Stop before the final step of any high-impact flow unless the user explicitly approves a controlled staging test.

## Phase 3 — Technical checks

Run safe checks only after reviewing side effects:
- Existing `npm test` may be run only after confirming tests use a disposable/test database and do not mutate shared services. If not confirmed, inspect tests and report the test run as blocked.
- Do not run `npm run seed:challenges` during an audit.
- Run static syntax/lint/type checks only if the corresponding scripts exist and are non-mutating. Do not invent script names.
- Check server error handling, authorization middleware, session cookie flags, rate limiting, input validation, output encoding, upload restrictions, and secret/config handling by source review and safe non-invasive runtime checks.
- Check HTML metadata, headings, form labels, image alt text, keyboard navigation, contrast if tooling exists, and responsive layouts.
- Use Lighthouse/axe/Playwright only if available or after approval to install. Automated accessibility scans do not prove WCAG compliance.
- Performance findings must be measured. No production load/stress testing.
- For security findings, distinguish code-level concern from confirmed runtime vulnerability. Do not exploit, exfiltrate, or escalate privileges.

## Phase 4 — Evidence and severity

Each finding must include:
- ID such as `CTF-UI-001`, `CTF-AUTH-001`, `CTF-API-001`, `CTF-A11Y-001`
- Severity: Critical / High / Medium / Low / Info
- Confidence: Confirmed / Likely / Needs verification
- Route and role/session state, file + line number where applicable
- Reproduction steps, expected vs actual result, impact
- Sanitized evidence (status, console excerpt, screenshot path, or code reference)
- Recommended fix and regression test

Severity:
- Critical: confirmed severe exposure or system-wide outage; stop and notify immediately.
- High: key journey blocked, serious authorization concern safely evidenced, or major integrity risk.
- Medium: important feature broken or substantial accessibility/usability issue.
- Low: minor defect or edge case.
- Info: improvement suggestion or unconfirmed observation.

Never include passwords, tokens, cookies, full session state, private user data, or secret values in the report.

## Phase 5 — Report

Create `reports/ctf-uz-site-audit-YYYY-MM-DD.md` only if it will not overwrite an existing report. If the name exists, add a time suffix. Do not modify the existing `audit-report.md`, `audit-report.json`, backups, or generated user artifacts without approval.

Include:
1. Executive summary
2. Target environment, authorization, timestamp, commit, tools, limits
3. Route coverage counts: discovered, visited, blocked, failed, excluded
4. Static page inventory and Express/API route inventory
5. Findings with severity, confidence, reproduction, evidence, and fix
6. Authentication/session and role-based access observations
7. CTF challenge/score/progress safety limitations
8. Accessibility, responsive, SEO, performance, and reliability observations
9. Commands/tests run and outcomes, including skipped/blocked tests
10. Proposed fixes grouped into small batches with files and regression tests
11. Statement whether application files/data were unchanged

Provide a concise terminal summary. Separate confirmed findings from hypotheses and untested areas.

## Phase 6 — Explicit approval before fixes

After presenting the report and proposed plan, stop and ask the user which finding IDs to fix. Audit permission is not permission to modify code.

After explicit approval:
1. Re-check `git status` and preserve unrelated edits.
2. Modify only the approved scope; do not run destructive helper scripts.
3. Add regression tests that use isolated fixtures/test databases.
4. Run focused tests only after confirming they cannot touch production/shared data.
5. Re-test the affected browser journey and inspect the diff.
6. Report changed files, tests, remaining risks, and anything not verified.
7. Ask separately before deploying, migrating, reseeding, or changing production data.

## If browser tools or credentials are unavailable

Continue the source-code and safe test-configuration audit. Mark browser checks as `Blocked`/`Not run`, not passed. State precisely what is needed to complete them. Never fabricate screenshots, HTTP statuses, route coverage, or test outcomes.

## Invocation

From the `ctf-uz` repository root, run `/site-audit`.

Useful user follow-ups:
- `audit only; no changes`
- `audit local URL http://localhost:PORT`
- `audit with my authorized test account already logged in`
- `show me the report and proposed fixes, then wait`
- `apply approved fixes: CTF-UI-001, CTF-AUTH-002`
