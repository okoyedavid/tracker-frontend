# Backend integration

Run the Node backend on port 5000 and this Next.js frontend on port 3000. Set `API_UPSTREAM_URL` if the backend is elsewhere. Requests always use the same-origin `/api` rewrite with HttpOnly cookies; no JWT or provider secret is stored in local storage. The obsolete `NEXT_PUBLIC_LOGIN_PATH` setting is no longer needed.

The backend must use `CLIENT_URL=http://localhost:3000`. For Google login, configure a Web Application OAuth client and register `http://localhost:3000/api/auth/google/callback` exactly as the redirect URI. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`, `RESEND_API_KEY` and `EMAIL_FROM` on the backend. Google login and email flows return a visible configuration error until those credentials are set. Run the backend migrations before signing in.

## Pages

- `/`: Login, signup, email verification/resend, password reset and Google login. Signup creates a Worker; verification does not automatically log in.
- `/dashboard`: Protected overview using the authenticated user's role/email and actual active session count. It does not fabricate receipt history, spending or approval statistics.
- `/dashboard/scan`: Existing Gemini/Paddle scanner, protected by `receipts:scan`; one image request returns OCR and vendor/date/total review fields.
- `/dashboard/account`: Profile, HTTPS avatar URL, email verification, password/email changes, session list/revocation and user ID copy.
- `/dashboard/team`: Permission-gated role CRUD, role assignment and account activation/deactivation. System roles are read-only. User targeting currently uses UUIDs because the backend has no directory endpoint.

API service factories take an injected transport; concrete dependencies are bound in `api/composition.ts`. TanStack Query caches user, session and role reads. A shared Axios interceptor serializes cookie refresh within the tab and retries eligible expired-session requests once, including the OCR adapter's custom status handling. Password validation errors are not automatically retried. Queries for protected screens render only after authentication; the backend remains the authorization authority.

Logging out clears the query cache. Receipt confirmation uploads the image and persists the reviewed scan and expenses. Account forms and administration show backend failures as toasts; authentication forms show errors inline. Permission checks honor explicit denies.

Saved scans, scoped reads, audited Supervisor overrides and monthly budget reporting are implemented.

Validation: TypeScript, ESLint and production build; no test files are added by this change. Real Google/email delivery requires configured external credentials.

## Supervisor-created accounts

POST `/api/users` accepts `{name, email, password, deliveryEmail?}`. A system Supervisor with `user:create` chooses the password; the account starts as an active Worker without signup/verification. Only its bcrypt hash is stored. Delivery is optional and never falls back to the login address. With a deliveryEmail, details are emailed only there. Without one, no email configuration is required and the form stays open on an Account ready screen showing the email and chosen password with a Copy email and password button. The password is held only in component memory for this handoff, never returned by the backend or persisted in browser storage. Click Done to close. Dummy login emails are supported.

The response includes `deliveryMethod: "manual" | "email"` and nullable deliveryEmail. Password changes remain optional.

## Users directory and navigation

`GET /api/admin/users` is guarded by `users:view`. It supports page/limit, search (name/email/role), status and roleId filters, and returns data plus pagination. Only public directory fields are selected; password hashes, Google subjects and recovery addresses are excluded.

The workspace uses the installed BoardUI sidebar with real account/profile dropdowns, a mobile drawer and a light/dark control. `/dashboard/users` provides the directory and Add user flow. Role assignment needs `roles:assign` plus access to role options; account status changes need `users:manage`. Read-only viewers see no mutation controls. Account creation requires a system Supervisor with `user:create`. `/dashboard/team` now focuses on role definitions, and user IDs no longer need to be pasted to manage an account.

The displayed Verification column reflects emailVerifiedAt. Receipt approval is handled separately in the Supervisor review queue. Multiple users can hold the Supervisor role.

## Scanning, saved records and naira

`/dashboard/scan` reads images through `POST /api/ocr?model=gemini|paddle`. Review vendor, scan date, total, an existing category and expense titles/costs. Inline category creation, tax/discount/currency controls and per-expense date inputs are removed. Categories are managed in `/dashboard/categories`. All amounts are naira (₦); the server defaults NGN and enforces it in storage. Expenses inherit the scan date on the server. Extracted adjustments are used automatically for reconciliation.

Confirmation sends multipart image and payload to `POST /api/scans`. Keep the original response unchanged and send its signed reviewToken at payload top level; send corrected OCR separately. Confidence below 60% or unavailable is unread. Pending scans remain saved and visible but do not contribute to spending until approved. Missing/non-positive extracted totals require Supervisor review after entering a positive value. Never substitute zero for a missing total.

`/scans` lists saved records newest first, with thumbnails, dates, category, total, creator and status. `/scans/:id` shows the original image, saved fields, expense rows, OCR/transcript and approval audit, plus a link to its report month. GET `/api/scans?page=1` returns `{data,total,page,pageSize}`. Workers need expenses:view_own and see their own scans; expenses:view permits all scans. Original and reviewed OCR are retained separately. Confirmations expose a View saved scan button and invalidate saved-scan/report caches.

## Categories

Workers and Supervisors select from all categories. Only system Supervisors with categories:create/update/delete manage them. Used categories cannot be deleted; the backend returns 409. Shared category queries refresh after mutations.

## Month reports and reviews

`/reports` lists month, budget, approved spending, approval limit and View. Supervisors with budgets:manage add a month or an inclusive range of up to 120 months. Bulk creation skips existing months. GET/POST `/api/reports/months` and GET/PATCH `/api/reports/months/:id` use `{startMonth,endMonth?,budget,approvalLimit}` for creation and `{month?,budget?,approvalLimit?}` for updates. Budget may be null; amounts are decimal strings. All figures are naira; there are no currency controls or parameters in the frontend. Updates retain the ID/creator and record the updater; duplicate months return 409.

`/reports/:id` shows the month, budget, spending, approval limit and Recharts usage donut. `/reports/categories` selects a month; `/reports/:id/categories` compares every category's spending with the entire monthly budget. Green is ON TRACK ≤80%, amber WATCH >80–100%, red OVER BUDGET >100%. Exact backend verdicts control colors before display rounding. A missing budget shows no fabricated percentage. Reports classify approved scans by scan date, not save timestamp.

`/reports/review` is restricted to system Supervisors with expenses:approve. GET `/api/scans/pending` and PATCH `/api/scans/:id/override` support audited overrides with positive decimal-string total and a 5–1000 character reason. An individual expense above that month's limit (default 500.00) triggers NEEDS APPROVAL over the budget verdict. Lowering a limit also surfaces unapproved-over-limit scans. Overrides refresh saved scans, month totals and the review queue. `/dashboard/reports` redirects to `/reports`.

Apply migrations through 008. It normalizes existing scans to NGN without changing amounts or original snapshots, aligns expense dates and makes report months unique by month. Historical raw OCR metadata remains preserved for audit.


## Automatic report months (migration 009)

Saving a scan creates its report month if missing, including for a pending scan. The new month has no budget and uses the default approval limit. Existing settings are retained. Each saved expense exposes `month: YYYY-MM`, generated in PostgreSQL from the inherited scan date. Report summaries include `expenseSubtotal`; categories also include `expenseSubtotal` and `expenseCount`. These are approved expense-row aggregates. Budget usage and charts continue to use approved invoice totals, as selected for this application. Month details show both values, and scan details show the expense month.
