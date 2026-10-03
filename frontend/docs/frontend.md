# ShardFlow V1 — Frontend Specification

**Document:** Frontend Architecture & System Specification  
**Product:** ShardFlow  
**Version:** V1.0  
**Status:** Frozen Implementation Contract  
**Last Updated:** 2026-10-03  

---

# 1. Purpose & Scope

This document defines the complete frontend architecture, route hierarchy, feature structure, security boundaries, and API interaction model for ShardFlow V1.

The ShardFlow frontend is a technical, infrastructure-focused dashboard and public marketing experience. It is designed for project administrators and backend developers managing multi-tenant MongoDB shard topologies.

---

# 2. Tech Stack & Architecture

```text
React (v18+)
Vite
TypeScript
Tailwind CSS
TanStack Query (React Query)
Supabase Auth JS Client (@supabase/supabase-js)
React Router (v6+)
```

### Architectural Principles

1. **Control Plane Client:** The dashboard application communicates **exclusively** with ShardFlow's Control Plane API (`/api/v1/*`) and Supabase Auth. It does **not** connect directly to customer MongoDB databases or invoke Data Plane REST operations (`POST /api/v1/data`) for normal dashboard features.
2. **Dark-Only Technical Aesthetic:** Dark background (`#090D16` / `#0D111C`), high contrast monospace metadata, technical status indicators, minimal infrastructure visualizers.
3. **No Fake Metrics:** The dashboard presents real state returned by the Control Plane API. It must not generate fake hardware usage charts (CPU/RAM/Disk) or fake traffic graphs.
4. **Deterministic Routing:** All project-scoped views depend on an active `projectId` context.

---

# 3. Route Structure

### Public & Marketing Routes
* `/` — Public marketing landing page (Hero, Infrastructure Diagram, Routing Explanation, Health System overview, Developer Integration sample, Footer).
* `/sign-in` — Supabase Auth sign-in screen (email/password).
* `/sign-up` — Account registration screen.
* `/forgot-password` — Password reset request screen.
* `/reset-password` — Password reset form (accessed via email link callback).

### Application Dashboard Routes (`/app/*`)
* `/app` — Redirects automatically to `/app/overview`.
* `/app/overview` — Dashboard summary metrics (Total Shards, Active Mappings, Health Status, API Keys overview).
* `/app/projects` — Project listing, project details, and project creation modal.
* `/app/shards` — Shard registry table, status badges, health badges, add shard modal.
* `/app/shards/:shardId` — Shard detail page, metadata editing, health history.
* `/app/routing` — Routing configuration overview, tenant-to-shard mapping table (`tenantId -> shardId`), create mapping modal.
* `/app/api-keys` — Project API key list, one-time raw key reveal modal, key revocation.
* `/app/health` — Shard health grid, last health check timestamps, health events log, manual health refresh action.
* `/app/activity` — System event log (read-only health transition history and audit events).
* `/app/integration` — Developer integration documentation, `X-API-Key` usage, curl/Node.js code snippets, allowlisted operator cheat sheet.
* `/app/settings` — Supported project settings, user profile summary (`GET /api/v1/me`), danger zone (project deactivation).

---

# 4. Authentication Model

* **Provider:** Supabase Auth (`@supabase/supabase-js`).
* **Credentials Storage:** Passwords and session secrets are managed entirely by Supabase. ShardFlow backend stores only the `supabaseUserId` reference in the `users` metadata collection.
* **Control Plane Authorization:** Authenticated requests to `/api/v1/*` send the Supabase access token in the `Authorization: Bearer <token>` HTTP header.
* **Protected Routes Guard:** The application shell (`/app/*`) validates session state before rendering. Unauthenticated sessions are redirected to `/sign-in`.

---

# 5. Security & Data Protection Rules

1. **Connection String Secrecy:** MongoDB connection URIs submitted during shard registration are encrypted (AES-256-GCM) by the backend. Connection URIs are **never** returned in `GET` responses or displayed in frontend UI components.
2. **API Key Hash Protection:** Stored key hashes (`keyHash`) are never exposed to the frontend.
3. **One-Time Raw API Key Display:** The raw API key string (`sf_live_...`) is returned **only once** in the `POST /api/v1/projects/:projectId/api-keys` response. The frontend displays this key in an explicit copy modal with a mandatory warning that the raw key cannot be retrieved again after closing.
4. **Environment Variables:** Only public configuration variables (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are present in frontend client builds.

---

# 6. Data Ownership & System Boundaries

```text
+-----------------------+           +--------------------------+
|  Supabase Auth        |           |  ShardFlow Metadata DB   |
|  - User Identity      |           |  - Projects              |
|  - Password/Sessions  |           |  - Shards Metadata       |
+-----------+-----------+           |  - Tenant Mappings       |
            |                       |  - Key Hashes            |
            v                       +------------+-------------+
+-----------------------+                        |
|  ShardFlow Frontend   |                        |
|  (React/Vite App)     |<-----------------------+
+-----------------------+   Control Plane API (/api/v1/*)
```

Customer MongoDB databases store customer application data and are accessed **only** by the backend Data Plane (`POST /api/v1/data`) when invoked by customer workloads using an API key (`X-API-Key`).

---

# 7. V1 Explicit Scope Limitations

The following capabilities are explicitly **out of scope** for V1:
* Automatic failover when a shard is `UNHEALTHY`.
* Automatic shard rebalancing or data migration.
* Distributed cross-shard transactions or queries.
* Non-MongoDB database engines.
* Third-party social logins (GitHub OAuth).
* Multi-user RBAC or team member invitations per project.
* Custom routing strategies beyond `tenantId`.
