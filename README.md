# Receipt Tracker Frontend

Next.js frontend with BoardUI components, TanStack Query and a shared Axios transport. See [integration and backend setup](INTEGRATION.md) for the complete API contract and configuration requirements.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`; start the Node backend on port 5000. The same-origin `/api` rewrite forwards to the backend. Set server-side `API_UPSTREAM_URL` in `.env.local` to change it. Provider credentials, email credentials and JWT secrets belong on the backend only.

## Application

- `/`: Login, registration, verification, password recovery and Google sign-in.
- `/dashboard`: Authenticated overview with account, role and session data.
- `/dashboard/scan`: Permission-gated Gemini/Paddle receipt scanner with vendor/date/total review.
- `/dashboard/account`: Profile, avatar URL, password/email changes and session management.
- `/dashboard/team`: Permission-gated role management, role assignment and account status.

Receipt confirmation saves the Cloudinary image, shared category and reviewed expense rows. Browse records at `/scans` and `/scans/:id`, monthly budgets at `/reports`, category charts under each month, and Supervisor approvals at `/reports/review`. All amounts are naira; expenses use their scan date. The dashboard does not display invented metrics.

## Composition

`api/tracker.ts` and `api/receipts.ts` define API factories with injected transports. `api/composition.ts` and `features/scan/composition.ts` assemble concrete dependencies. The auth provider manages current-user state; dashboard navigation honors permissions and explicit denies. The backend enforces authorization on every protected endpoint.

Authentication uses HttpOnly cookies with one shared refresh request per tab. No credentials or tokens are stored in local storage. Protected reads and scans retry once after a successful session refresh; provider errors never trigger a fallback to another OCR engine. The HTTP timeout is 35 seconds, above the backend's 25-second OCR deadline. Scanning sends raw image bytes to one endpoint and receives both OCR and extracted fields.

## Checks

`npm run lint` checks ESLint. `npm run build` builds production output in `.next-production`; `npm start` serves it. No test files were added for this integration. Real Google login and email delivery require valid backend credentials.

# tracker-frontend
