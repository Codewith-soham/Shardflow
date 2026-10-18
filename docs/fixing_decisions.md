# Fixing Decisions

## D1 — Authentication bypass via `demo_` bearer tokens

### What was happening

Authentication could be bypassed entirely, at two layers:

1. **Backend (`backend/src/auth/auth.service.ts`)** — `authenticateAndSyncUser` had a branch:
   if the bearer token started with `demo_`, it skipped Supabase verification and built a
   user from the token itself (`demo_<id>_<base64 email>`). Anyone could send
   `Authorization: Bearer demo_x_<base64 of any email>` to any control-plane route and be
   authenticated; a database user with that email was created just-in-time. No secret or
   signature was involved, so identities (including an existing user's email) were forgeable.
2. **Frontend** — the sign-in and sign-up pages called `setDemoUser(email)` on *any*
   Supabase error (wrong password, network failure, unconfirmed session), logging the user in
   as a "demo user" stored in `localStorage` (`shardflow_demo_user`). `lib/api/client.ts` then
   turned that into a `demo_…` bearer token, which the backend accepted.

### What was fixed

- **`auth.service.ts`**: removed the `demo_` branch. Every token now goes through
  `verifySupabaseToken`, and a missing email is rejected. A `demo_…` token fails as
  `INVALID_AUTH_TOKEN` (401) like any other invalid token.
- **`lib/api/client.ts`**: `getAuthToken` only returns a real Supabase session access token;
  the demo-token fabrication was removed.
- **`SignInPage.tsx` / `SignUpPage.tsx`**: Supabase errors (and network failures) are now shown
  to the user instead of silently creating a demo session. Sign-up with no immediate session
  (email confirmation required) redirects to `/sign-in` rather than logging in.
- **`AuthProvider.tsx`**: removed `setDemoUser`, the `DemoUser` type, and all `localStorage`
  demo-user reads/writes. `user`/`session` now come only from Supabase, and
  `onAuthStateChange` also clears them on sign-out/expiry.
- **Test**: added a regression test in `backend/src/auth/auth.test.ts` asserting a forged
  `demo_` token is rejected with 401, is passed to Supabase verification, and never creates a user.

### Verification

- `vitest run src/auth` — 12/12 pass (including the new test).
- `tsc --noEmit` clean in backend and frontend.

### Decisions / trade-offs

- **Removed rather than gated behind a flag.** A `NODE_ENV`/env-flag demo mode would still be
  one misconfiguration away from production exposure. If an offline demo is wanted later, use
  a real Supabase test project or a separate, explicitly non-deployable dev build.
- **Fail closed in the UI.** Showing the Supabase error is a behavior change: local dev now
  requires working Supabase credentials in the frontend env.
- **Out of scope / still open:** `ResetPasswordPage` and `ForgotPasswordPage` still
  `console.warn` and "bypass for local demonstration" when Supabase is not configured. These
  don't grant access, but they report success falsely and should be revisited. Existing
  `demo-*` users already created in the control-plane database were not purged; review and
  delete them if the database was ever exposed.

---

## D2 — Forgot / reset password: real lifecycle (replaces the "bypass" stubs)

### What was wrong
`ForgotPasswordPage` and `ResetPasswordPage` called Supabase directly and, when Supabase was
unconfigured or unreachable, showed "success" anyway. Nothing on the backend owned the flow, and
the recovery link would have been auto-consumed by the Supabase client as a normal app session.

### Lifecycle now
1. **Request** — `POST /api/v1/auth/forgot-password {email}` (public). Validated, rate-limited
   (5 / 15 min per IP), calls Supabase `resetPasswordForEmail` with `PASSWORD_RESET_REDIRECT_URL`.
   Always returns **202** with a generic message, so unknown emails can't be enumerated. Provider
   429 -> 429, provider outage -> 503 `EMAIL_PROVIDER_UNAVAILABLE`.
2. **Email link** — Supabase emails a single-use link to `/reset-password#access_token=…&type=recovery`.
3. **Landing** — `ResetPasswordPage` reads the token from the hash once, strips it from the URL, and
   shows an "invalid / expired link" state (with a link to request a new one) if it is missing,
   malformed, or carries a Supabase error. The token is never turned into an app session
   (`detectSessionInUrl: false` in `lib/supabase/client.ts`).
4. **Complete** — `POST /api/v1/auth/reset-password {accessToken, password}` (public, rate-limited
   10 / 15 min). The token is verified with Supabase, the password length is enforced (6–72), the
   password is changed through the admin API, then all of the user's sessions are revoked
   (best effort). Expired/invalid token -> 401; no `SUPABASE_SERVICE_ROLE_KEY` -> 503.
5. **Sign in** — user returns to `/sign-in` with the new password.

### Code
- Backend: `auth/password-reset.service.ts`, `password-reset.routes.ts`, `rate-limiter.ts`; wired in
  `app.ts`; `PASSWORD_RESET_REDIRECT_URL` added to config and `.env.example`;
  tests in `auth/password-reset.test.ts` (174/174 backend tests pass).
- Frontend: both pages call the backend via `apiClient`; the fake-success bypass is gone.

### Decisions / trade-offs
- **Backend-owned flow** so throttling, anti-enumeration and error mapping live in one place.
- **Admin API for the password change** requires `SUPABASE_SERVICE_ROLE_KEY` on the backend; without it
  the reset endpoint fails closed (503) rather than degrading.
- **`detectSessionInUrl: false`** also stops email-confirmation links from auto-signing the user in;
  they now sign in manually after confirming.
- **Recovery token is not checked for `amr=recovery`**: any valid Supabase access token can set a new
  password via this endpoint. Acceptable for V1 (the holder is already authenticated as that user);
  tighten if stricter "recent reauth" semantics are needed.
- **Rate limiter is in-memory per process**; use a shared store if the backend scales out.
- **Setup required:** add the frontend `/reset-password` URL to Supabase's redirect allow-list.
