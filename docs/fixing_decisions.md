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

---

## D3 — Tenant Context Propagation & Fail-Closed Database Execution

### What was happening

A high-severity cross-tenant exposure risk existed in the Data Plane pipeline:
1. **Context Drop**: Tenant identity was used only in `RoutingEngine.resolveShard` to select the database shard. Once the shard was resolved, the query was forwarded to `DatabaseExecutor.execute(shard, request)` without carrying any tenant context.
2. **Missing Invariant**: Neither `DatabaseExecutor` nor individual operation executors (`find`, `find-one`, `insert-one`, `update-one`, `delete-one`) received, validated, or verified tenant context at the database call boundary.
3. **Fail-Open Risk**: If a request lacked a tenant identifier or experienced context loss, operations could run blindly against the target shard.
4. **Data Leakage in Observability**: Driver errors (e.g. duplicate key errors E11000) echoed raw Mongo error messages containing unredacted customer document data.

### What was fixed

- **`TenantContext` Model (`data-request.model.ts`)**: Introduced a typed `TenantContext` interface carrying `tenantId` and `projectId`.
- **Authentication & Middleware (`data-plane-auth.middleware.ts`)**: `DataPlaneContext` now incorporates `tenantContext`. Resolves tenant identity from `X-Tenant-Id` header and/or request body, enforcing consistency and rejecting format violations with `INVALID_TENANT_ID` (400) or mismatches with `TENANT_ACCESS_DENIED` (403).
- **Controller (`data-plane.controller.ts`)**: Rejects unresolvable tenant requests with `TENANT_RESOLUTION_FAILED` (400), constructs explicit `tenantContext`, and passes it with contextual logging to `DataPlaneService`.
- **Service Layer (`data-plane.service.ts`)**: Explicitly accepts and validates `TenantContext`. Verifies project and tenant match the authenticated scope, and propagates `resolvedTenantContext` into `DatabaseExecutor.execute`.
- **Database Executor (`database-executor.ts`)**:
  - Requires `TenantContext` and fails closed with `TENANT_ACCESS_DENIED` (403) if missing, empty, or mismatched with the request payload.
  - Every operation (`executeFind`, `executeFindOne`, `executeInsertOne`, `executeUpdateOne`, `executeDeleteOne`) enforces context availability at the point of the database driver call.
  - Structured logging emits strictly tenant and project identifiers (`tenantId`, `projectId`, `shardId`, `operation`, `collection`) without query or document contents.
  - Error messages and logs are sanitized so duplicate key errors or driver timeouts never leak customer document data.
- **Tests**:
  - Unit tests in `database-executor.test.ts` (11 tests) verifying fail-closed invariant, context availability across all operations, safe logging without data contents, and sanitized error messages.
  - Integration tests in `data-plane.routes.test.ts` verifying end-to-end context preservation from HTTP request to driver execution, `X-Tenant-Id` header resolution, and fail-closed rejections.

### Verification

- `npx vitest run src/data-plane` — 34/34 passing.
- `npm test` — all 27 test files passing (337/337 tests).
- `npm run typecheck` — 0 TypeScript errors.
