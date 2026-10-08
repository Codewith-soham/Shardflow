# ShardFlow V1 — Frontend Implementation Task Planner

> **Purpose:** This document is the execution checklist for building the ShardFlow frontend.
>
> The frontend must be implemented **phase by phase, task by task, subtask by subtask**.
>
> Do not jump between phases.
>
> Each task must be completed, reviewed, validated, and committed before moving to the next task.

---

# 1. Frontend Execution Rules

## 1.1 Development Order

The implementation order is:

```text
Phase
  ↓
Task
  ↓
Subtask
  ↓
Implementation
  ↓
Validation
  ↓
Review
  ↓
Commit
  ↓
Next Task
```

Never start multiple unrelated tasks at the same time.

---

## 1.2 Task Status

Use these statuses:

```text
[ ] Not Started
[-] In Progress
[x] Completed
[!] Blocked
```

Example:

```text
### Task F1.2 — Configure Application Providers

Status: [ ]

- [ ] Create provider structure
- [ ] Configure React Query
- [ ] Configure Supabase client
- [ ] Configure router provider
- [ ] Verify application boot
```

---

## 1.3 AI Coding Rule

When using Antigravity, Cursor, OpenCode, or another coding assistant:

```text
ONE TASK
    ↓
ONE PROMPT
    ↓
IMPLEMENT
    ↓
REVIEW
    ↓
VALIDATE
    ↓
COMMIT
```

Do not give an AI agent the entire frontend roadmap at once.

The current task is the only implementation scope.

---

# 2. Source of Truth

Frontend implementation must follow these documents:

```text
docs/
├── prd.md
├── architecture.md
├── database-design.md
├── api.md
├── error-contract.md
├── error-codes.md
├── rules.md
├── memory.md
├── task.md
├── phases.md
├── frontend.md
└── frontend-phases.md
```

Priority:

```text
PRD
 ↓
Architecture
 ↓
Database Design
 ↓
API Contract
 ↓
Error Contract
 ↓
Rules
 ↓
Frontend Specification
 ↓
Frontend Task Planner
```

If a frontend requirement conflicts with an existing backend contract:

**STOP and verify the contract before implementation.**

Do not invent API behavior.

---

# 3. Global Frontend Definition of Done

Every frontend task must satisfy:

* [ ] Scope implemented exactly as defined
* [ ] No unrelated files changed
* [ ] No fake backend data added unless explicitly required for design-only work
* [ ] Loading state handled
* [ ] Empty state handled where applicable
* [ ] Error state handled where applicable
* [ ] Responsive behavior checked
* [ ] Accessibility considered
* [ ] TypeScript errors resolved
* [ ] Lint passes
* [ ] Build passes
* [ ] Browser behavior verified
* [ ] No unnecessary dependencies added
* [ ] No duplicated components introduced
* [ ] No secrets exposed
* [ ] Changes reviewed
* [ ] Git commit created

---

# PHASE F0 — FRONTEND CONTRACT VERIFICATION

## Goal

Verify that the frontend can be implemented from the existing project documentation without inventing missing backend behavior.

## Dependencies

```text
PRD
Architecture
Database Design
API
Error Contract
Rules
Memory
Frontend Specification
```

---

## Task F0.1 — Review Frontend Contracts

Status: [x]

* [x] Read `prd.md`
* [x] Read `architecture.md`
* [x] Read `database-design.md`
* [x] Read `api.md`
* [x] Read `error-contract.md`
* [x] Read `rules.md`
* [x] Read `memory.md`
* [x] Read `frontend.md`

### Acceptance Criteria

* [x] Frontend understands authentication flow
* [x] Frontend understands project model
* [x] Frontend understands shard model
* [x] Frontend understands routing model
* [x] Frontend understands API key behavior
* [x] Frontend understands health states
* [x] Frontend understands activity events
* [x] Frontend understands integration requirements

---

## Task F0.2 — Identify Frontend API Dependencies

Status: [x]

* [x] List required control-plane endpoints
* [x] Map endpoints to frontend features
* [x] Identify required request payloads
* [x] Identify response structures
* [x] Identify error codes
* [x] Identify authentication requirements
* [x] Identify project-scoped resources
* [x] Identify unsupported operations

### Acceptance Criteria

* [x] No frontend feature assumes an undocumented endpoint
* [x] Missing contracts are documented
* [x] Unsupported behavior is explicitly excluded

---

## Task F0.3 — Freeze Frontend Scope

Status: [x]

* [x] Confirm V1 feature list
* [x] Confirm dashboard routes
* [x] Confirm authentication routes
* [x] Confirm design direction
* [x] Confirm responsive requirement
* [x] Confirm dark-only requirement
* [x] Confirm no GitHub login
* [x] Confirm no fake production metrics

### Gate

Do not start F1 until all F0 tasks are complete.

---

# PHASE F1 — FRONTEND FOUNDATION

## Goal

Create the frontend application foundation.

## Dependencies

```text
F0
```

---

## Task F1.1 — Initialize Frontend Application

Status: [x]

* [x] Initialize React application
* [x] Configure Vite
* [x] Configure TypeScript
* [x] Configure Tailwind CSS
* [x] Configure project scripts
* [x] Verify development server
* [x] Verify production build

### Acceptance Criteria

* [x] Application starts successfully
* [x] TypeScript works
* [x] Tailwind works
* [x] Production build succeeds

---

## Task F1.2 — Create Frontend Folder Structure

Status: [x]

Create:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   └── feedback/
├── features/
│   ├── auth/
│   ├── projects/
│   ├── shards/
│   ├── routing/
│   ├── api-keys/
│   ├── health/
│   ├── activity/
│   ├── integration/
│   └── settings/
├── lib/
│   ├── api/
│   ├── supabase/
│   └── utils/
├── hooks/
├── types/
├── styles/
└── main.tsx
```

* [x] Create directories
* [x] Remove unnecessary starter files
* [x] Establish naming conventions

---

## Task F1.3 — Configure Environment Variables

Status: [x]

* [x] Configure frontend environment variables
* [x] Configure backend API URL
* [x] Configure Supabase URL
* [x] Configure Supabase public key
* [x] Create environment example file
* [x] Verify secrets are not committed

### Acceptance Criteria

* [x] Frontend reads configuration correctly
* [x] No secret/service-role key exists in frontend
* [x] `.env` is ignored

---

## Task F1.4 — Configure Application Providers

Status: [x]

* [x] Configure router
* [x] Configure TanStack Query
* [x] Configure Supabase client
* [x] Configure global application providers
* [x] Verify application boot

---

# PHASE F2 — DESIGN SYSTEM

## Goal

Create the visual foundation before building pages.

## Dependencies

```text
F1
```

---

## Task F2.1 — Implement Design Tokens

Status: [x]

Implement:

* [x] Background colors (`#09090B`, `#111113`, `#18181B`, `#1E1E22`)
* [x] Surface colors
* [x] Border colors (`#27272A`, `#3F3F46`)
* [x] Text colors (`#F4F4F5`, `#A1A1AA`, `#71717A`)
* [x] Accent colors (`#38BDF8`)
* [x] Health colors (`#34D399`, `#FBBF24`, `#F87171`, `#71717A`)
* [x] Spacing scale
* [x] Border radius
* [x] Shadows & Glows
* [x] Typography

Primary visual direction:

```text
Dark
Technical
Minimal
Infrastructure-focused
Professional
```

---

## Task F2.2 — Configure Typography

Status: [x]

* [x] Configure primary UI font (Inter)
* [x] Configure technical/monospace font (JetBrains Mono)
* [x] Define heading hierarchy
* [x] Define body text
* [x] Define labels
* [x] Define metadata
* [x] Define code text

---

## Task F2.3 — Build Base UI Components

Status: [x]

* [x] Button (`Button.tsx`)
* [x] Input (`Input.tsx`)
* [x] Select (`Select.tsx`)
* [x] Textarea (`Textarea.tsx`)
* [x] Checkbox (`Checkbox.tsx`)
* [x] Badge (`Badge.tsx`)
* [x] Card (`Card.tsx`)
* [x] Dialog (`Dialog.tsx`)
* [x] Tooltip (`Tooltip.tsx`)
* [x] Dropdown (`Dropdown.tsx`)
* [x] Tabs (`Tabs.tsx`)
* [x] Table (`Table.tsx`)
* [x] Skeleton (`Skeleton.tsx`)
* [x] Alert (`Alert.tsx`)

---

## Task F2.4 — Build Infrastructure Components

Status: [x]

* [x] StatusBadge (`StatusBadge.tsx`)
* [x] HealthBadge (`HealthBadge.tsx`)
* [x] MetricCard (`MetricCard.tsx`)
* [x] ConnectionStatus (`ConnectionStatus.tsx`)
* [x] ShardCard (`ShardCard.tsx`)
* [x] HealthIndicator (`HealthIndicator.tsx`)
* [x] TenantMappingRow (`TenantMappingRow.tsx`)
* [x] ApiKeyRow (`ApiKeyRow.tsx`)
* [x] ActivityItem (`ActivityItem.tsx`)

---

## Task F2.5 — Build Feedback Components

Status: [x]

* [x] Loading state (`LoadingState.tsx`)
* [x] Empty state (`EmptyState.tsx`)
* [x] Error state (`ErrorState.tsx`)
* [x] Success feedback
* [x] Confirmation dialog (`ConfirmationDialog.tsx`)
* [x] Toast/notification system (`Toast.tsx`)

### Gate

Do not build feature pages until the design system is stable enough to reuse.

---

# PHASE F3 — MARKETING LANDING PAGE

## Goal

Build the public ShardFlow landing experience.

## Dependencies

```text
F2
```

---

## Task F3.1 — Build Navbar

Status: [x]

* [x] ShardFlow branding
* [x] Navigation
* [x] Documentation link
* [x] Sign in
* [x] Get started CTA
* [x] Responsive navigation drawer

---

## Task F3.2 — Build Hero

Status: [x]

* [x] Hero headline
* [x] Supporting copy
* [x] Primary CTA
* [x] Secondary CTA
* [x] Infrastructure visualization integration
* [x] Application → ShardFlow → database flow
* [x] Responsive layout

---

## Task F3.3 — Build Infrastructure Visualization

Status: [x]

Visual concept:

```text
Application
     │
     ▼
┌──────────────┐
│  ShardFlow   │
│   Routing    │
│ Connections   │
│    Health    │
└──────┬───────┘
       │
 ┌─────┼─────┐
 ▼     ▼     ▼
DB01  DB02  DB03
```

* [x] Database nodes
* [x] Routing paths
* [x] Health indicators
* [x] Subtle data flow (interactive request routing preview)
* [x] Responsive behavior
* [x] No fake metrics

---

## Task F3.4 — Build Problem Section

Status: [x]

Explain:

* [x] Database scaling complexity
* [x] Shard management complexity
* [x] Application-level routing complexity
* [x] Operational visibility

---

## Task F3.5 — Build How It Works Section

Status: [x]

Show:

```text
Application
    ↓
ShardFlow API
    ↓
Tenant Resolution
    ↓
Shard Mapping
    ↓
MongoDB Shard
```

---

## Task F3.6 — Build Routing Section

Status: [x]

Show examples:

```text
tenant_001 → shard_01
tenant_002 → shard_02
tenant_003 → shard_01
```

Do not imply automatic rebalancing or unsupported load balancing.

---

## Task F3.7 — Build Shard Management Section

Status: [x]

* [x] Shard cards
* [x] Admin status
* [x] Health status
* [x] Database type
* [x] Connection representation

---

## Task F3.8 — Build Health Section

Status: [x]

Show:

```text
UNKNOWN
HEALTHY
DEGRADED
UNHEALTHY
```

Explain health monitoring without implying V1 automatic failover.

---

## Task F3.9 — Build Developer Integration Section

Status: [x]

Show:

```text
Application
     ↓
ShardFlow API
     ↓
X-API-Key
     ↓
tenantId
     ↓
MongoDB shard
```

---

## Task F3.10 — Build Architecture Section

Status: [x]

Show:

```text
Dashboard
    ↓
Control Plane
    ↓
Metadata Database
    ↓
Shard Registry
    ↓
Customer MongoDB Shards
```

Clearly distinguish control plane and data plane.

---

## Task F3.11 — Build CTA and Footer

Status: [x]

* [x] Final CTA
* [x] Documentation
* [x] Product navigation
* [x] Authentication links
* [x] Footer information

### Gate

* [x] Entire landing page works
* [x] Mobile responsive
* [x] No placeholder content
* [x] No fake metrics
* [x] Visual hierarchy is consistent

---

# PHASE F4 — APPLICATION SHELL

## Goal

Build the dashboard shell before feature implementation.

## Dependencies

```text
F2
F3
```

---

## Task F4.1 — Configure Application Routes

Status: [x]

```text
/app
/app/overview
/app/projects
/app/shards
/app/shards/:shardId
/app/routing
/app/api-keys
/app/health
/app/activity
/app/integration
/app/settings
```

---

## Task F4.2 — Build Dashboard Layout

Status: [x]

* [x] Sidebar
* [x] Topbar
* [x] Main content area
* [x] Responsive layout
* [x] Mobile navigation

---

## Task F4.3 — Build Sidebar Navigation

Status: [x]

```text
Overview
Projects

DATABASE
  Shards
  Routing

SECURITY
  API Keys

MONITORING
  Health
  Activity

DEVELOPER
  Integration

Settings
```

---

## Task F4.4 — Build Topbar

Status: [x]

* [x] Project switcher
* [x] Notifications
* [x] User menu
* [x] Breadcrumb/page context where required

---

## Task F4.5 — Build Protected Route Foundation

Status: [x]

* [x] Detect authenticated session
* [x] Protect `/app/*`
* [x] Redirect unauthenticated users
* [x] Handle session loading
* [x] Handle expired session

---

# PHASE F5 — AUTHENTICATION

## Goal

Integrate Supabase Auth into the frontend.

## Dependencies

```text
F4
```

---

## Task F5.1 — Build Sign In

Status: [x]

* [x] Email input
* [x] Password input
* [x] Sign-in action
* [x] Loading state
* [x] Error state
* [x] Success redirect

---

## Task F5.2 — Build Sign Up

Status: [x]

* [x] Registration form
* [x] Validation
* [x] Supabase registration
* [x] Error handling
* [x] Success state

---

## Task F5.3 — Build Forgot Password

Status: [x]

* [x] Email input
* [x] Reset request
* [x] Success state
* [x] Error state

---

## Task F5.4 — Build Reset Password

Status: [x]

* [x] Password input
* [x] Confirmation input
* [x] Password update
* [x] Success state
* [x] Error state

---

## Task F5.5 — Complete Authentication Flow

Status: [x]

* [x] Session persistence
* [x] Route protection
* [x] Logout
* [x] Auth loading state
* [x] Expired session handling

### Rule

Do not add GitHub OAuth unless the project authentication contract is explicitly changed.

---

# PHASE F6 — PROJECTS

## Goal

Implement project management.

## Dependencies

```text
F5
```

---

## Task F6.1 — Project List

Status: [x]

* [x] Fetch projects
* [x] Display projects
* [x] Loading state
* [x] Empty state
* [x] Error state

---

## Task F6.2 — Create Project

Status: [x]

* [x] Create project dialog/page
* [x] Form validation
* [x] API integration
* [x] Success handling
* [x] Error handling

---

## Task F6.3 — Project Selection

Status: [x]

* [x] Project switcher
* [x] Persist selected project
* [x] Update project context
* [x] Reload project-specific data

---

## Task F6.4 — Project Details

Status: [x]

* [x] Project information
* [x] Project identifier
* [x] Relevant metadata
* [x] Loading/error states

---

# PHASE F7 — SHARDS

## Goal

Implement shard management.

## Dependencies

```text
F6
```

---

## Task F7.1 — Shard List

Status: [x]

* [x] Fetch shards
* [x] Shard table/cards
* [x] Admin status
* [x] Health status
* [x] Database type
* [x] Loading state
* [x] Empty state
* [x] Error state

---

## Task F7.2 — Add Shard

Status: [x]

* [x] Add shard form
* [x] Shard name
* [x] Database type
* [x] Connection configuration
* [x] Validation
* [x] Secure handling
* [x] Success/error feedback

Never expose credentials in logs or normal UI responses.

---

## Task F7.3 — Shard Details

Status: [x]

* [x] Shard identity
* [x] Admin status
* [x] Health status
* [x] Connection state
* [x] Relevant metadata
* [x] Activity

---

## Task F7.4 — Shard Administration

Status: [x]

* [x] Enable/disable where supported
* [x] Confirmation dialogs
* [x] Error handling
* [x] Permission handling

---

# PHASE F8 — ROUTING

## Goal

Implement tenant-to-shard routing management.

## Dependencies

```text
F7
```

---

## Task F8.1 — Routing Overview

Status: [ ]

* [ ] Routing configuration
* [ ] Current mappings
* [ ] Project context
* [ ] Loading state
* [ ] Empty state
* [ ] Error state

---

## Task F8.2 — Tenant Mapping Table

Status: [ ]

Example:

```text
Tenant ID     Shard
tenant_001    shard_01
tenant_002    shard_02
tenant_003    shard_01
```

* [ ] Tenant ID
* [ ] Shard
* [ ] Mapping status
* [ ] Relevant metadata

---

## Task F8.3 — Create Mapping

Status: [ ]

* [ ] Tenant ID input
* [ ] Shard selection
* [ ] Validation
* [ ] API integration
* [ ] Success/error handling

---

## Task F8.4 — Update Mapping

Status: [ ]

* [ ] Select mapping
* [ ] Change shard
* [ ] Confirmation
* [ ] API integration
* [ ] Error handling

---

## Task F8.5 — Delete Mapping

Status: [ ]

* [ ] Confirmation
* [ ] API integration
* [ ] Success state
* [ ] Error state

### Rule

Do not build automatic rebalancing, migration, or unsupported routing behavior.

---

# PHASE F9 — API KEYS

## Goal

Implement project API key management.

## Dependencies

```text
F6
```

---

## Task F9.1 — API Key List

Status: [ ]

* [ ] Key name
* [ ] Status
* [ ] Created date
* [ ] Expiration
* [ ] Last used information if supported
* [ ] Masked representation

---

## Task F9.2 — Create API Key

Status: [ ]

* [ ] Create form
* [ ] Optional expiration
* [ ] API request
* [ ] Success state
* [ ] One-time raw key display if contract permits
* [ ] Copy action
* [ ] Warning that raw key cannot be retrieved again

---

## Task F9.3 — Revoke API Key

Status: [ ]

* [ ] Revoke action
* [ ] Confirmation
* [ ] API request
* [ ] Success/error state

---

# PHASE F10 — HEALTH

## Goal

Implement shard health visibility.

## Dependencies

```text
F7
```

---

## Task F10.1 — Health Overview

Status: [ ]

* [ ] Health summary
* [ ] Shard health cards
* [ ] Status indicators
* [ ] Last check information

---

## Task F10.2 — Health Status

Status: [ ]

Support:

```text
UNKNOWN
HEALTHY
DEGRADED
UNHEALTHY
```

---

## Task F10.3 — Health Events

Status: [ ]

* [ ] Health state changes
* [ ] Timestamp
* [ ] Shard
* [ ] Event information
* [ ] Error state

---

## Task F10.4 — Health Filtering and Refresh

Status: [ ]

* [ ] Filter by status
* [ ] Filter by shard
* [ ] Manual refresh
* [ ] Loading state
* [ ] Error state

### Rule

Frontend must not imply automatic failover when V1 does not provide it.

---

# PHASE F11 — ACTIVITY

## Goal

Build the infrastructure activity view.

## Dependencies

```text
F6
F7
F8
F9
F10
```

---

## Task F11.1 — Activity Feed

Status: [ ]

* [ ] Fetch activity
* [ ] Activity items
* [ ] Timestamp
* [ ] Event type
* [ ] Related resource

---

## Task F11.2 — Activity Filtering

Status: [ ]

* [ ] Event type
* [ ] Resource
* [ ] Time-related filtering if supported
* [ ] Search if supported

---

## Task F11.3 — Activity Details

Status: [ ]

* [ ] Event details
* [ ] Entity identifiers
* [ ] Error information where applicable
* [ ] Request ID where appropriate

Do not expose sensitive credentials or secrets.

---

# PHASE F12 — DEVELOPER INTEGRATION

## Goal

Give developers everything required to integrate their application with ShardFlow.

## Dependencies

```text
F8
F9
```

---

## Task F12.1 — Integration Overview

Status: [ ]

Show:

```text
Endpoint
API Key
Tenant ID
Request format
```

---

## Task F12.2 — Environment Configuration

Status: [ ]

Example representation:

```text
SHARDFLOW_API_URL=...
SHARDFLOW_API_KEY=...
```

* [ ] Copy actions
* [ ] Mask sensitive values
* [ ] Clear explanation

---

## Task F12.3 — Request Example

Status: [ ]

* [ ] Request example
* [ ] API endpoint
* [ ] Headers
* [ ] Tenant ID
* [ ] Supported operation representation

Only document operations supported by the actual API contract.

---

## Task F12.4 — Integration Guidance

Status: [ ]

Explain:

```text
Application
    ↓
ShardFlow API
    ↓
Authentication
    ↓
Tenant Resolution
    ↓
Shard Mapping
    ↓
MongoDB
```

---

# PHASE F13 — SETTINGS

## Goal

Implement supported project and user settings.

## Dependencies

```text
F5
F6
```

---

## Task F13.1 — User Settings

Status: [ ]

* [ ] User information
* [ ] Supported profile configuration
* [ ] Loading state
* [ ] Error state

---

## Task F13.2 — Project Settings

Status: [ ]

* [ ] Project information
* [ ] Supported configuration
* [ ] Project context

---

## Task F13.3 — Notification Settings

Status: [ ]

Only implement settings supported by the backend.

* [ ] Notification configuration
* [ ] Health notification preferences if supported
* [ ] Save/update flow

---

## Task F13.4 — Security Settings

Status: [ ]

* [ ] Session/security information where supported
* [ ] Logout
* [ ] Relevant security controls

---

## Task F13.5 — Danger Zone

Status: [ ]

Only if supported by backend:

* [ ] Destructive action
* [ ] Confirmation
* [ ] Strong confirmation where required
* [ ] Error handling

---

# PHASE F14 — INTEGRATION & POLISH

## Goal

Make the frontend feel like one coherent infrastructure product.

## Dependencies

```text
F3
F4
F5
F6
F7
F8
F9
F10
F11
F12
F13
```

---

## Task F14.1 — Visual Consistency Review

Status: [ ]

Check:

* [ ] Typography
* [ ] Colors
* [ ] Spacing
* [ ] Borders
* [ ] Radius
* [ ] Buttons
* [ ] Inputs
* [ ] Tables
* [ ] Cards
* [ ] Status badges
* [ ] Dialogs

---

## Task F14.2 — Responsive Review

Status: [ ]

Check:

* [ ] Desktop
* [ ] Laptop
* [ ] Tablet
* [ ] Mobile
* [ ] Sidebar behavior
* [ ] Tables
* [ ] Forms
* [ ] Dashboard cards
* [ ] Landing page

---

## Task F14.3 — Loading / Empty / Error Review

Status: [ ]

Every data-driven page must have intentional:

```text
Loading
   ↓
Success
   ↓
Empty
   ↓
Error
```

where applicable.

---

## Task F14.4 — Remove Placeholder Implementation

Status: [ ]

* [ ] Remove fake metrics
* [ ] Remove mock production data
* [ ] Remove unused components
* [ ] Remove unused imports
* [ ] Remove duplicate components
* [ ] Remove temporary debugging
* [ ] Remove unnecessary dependencies

---

## Task F14.5 — Animation Review

Status: [ ]

* [ ] Remove unnecessary animation
* [ ] Keep meaningful transitions
* [ ] Ensure motion does not distract
* [ ] Check reduced-motion behavior where appropriate

---

## Task F14.6 — Accessibility Review

Status: [ ]

* [ ] Keyboard navigation
* [ ] Focus states
* [ ] Form labels
* [ ] Button semantics
* [ ] Contrast
* [ ] Error messaging
* [ ] Dialog accessibility

---

# PHASE F15 — PRODUCTION READINESS

## Goal

Verify the frontend is ready to connect to the deployed backend.

## Dependencies

```text
F14
```

---

## Task F15.1 — Production Build

Status: [ ]

* [ ] Production build
* [ ] Build warnings reviewed
* [ ] TypeScript errors resolved
* [ ] Lint passes

---

## Task F15.2 — Environment Verification

Status: [ ]

* [ ] Production API URL
* [ ] Supabase URL
* [ ] Supabase public key
* [ ] Environment variables verified
* [ ] No secrets exposed

---

## Task F15.3 — Authentication Verification

Status: [ ]

Test:

* [ ] Sign up
* [ ] Sign in
* [ ] Logout
* [ ] Forgot password
* [ ] Reset password
* [ ] Protected route
* [ ] Expired session
* [ ] Unauthorized access

---

## Task F15.4 — API Failure Verification

Status: [ ]

Test:

* [ ] Backend unavailable
* [ ] Network failure
* [ ] Unauthorized response
* [ ] Validation error
* [ ] Server error
* [ ] Empty response
* [ ] Timeout where applicable

---

## Task F15.5 — Security Review

Status: [ ]

Verify:

* [ ] No customer DB credentials exposed
* [ ] No API key hashes exposed
* [ ] No Supabase service-role key exposed
* [ ] No environment secrets exposed
* [ ] Sensitive values masked
* [ ] Destructive actions protected
* [ ] Project access enforced by backend

---

## Task F15.6 — Browser Verification

Status: [ ]

Test all major routes:

* [ ] Landing
* [ ] Sign in
* [ ] Sign up
* [ ] Forgot password
* [ ] Reset password
* [ ] Overview
* [ ] Projects
* [ ] Shards
* [ ] Shard details
* [ ] Routing
* [ ] API Keys
* [ ] Health
* [ ] Activity
* [ ] Integration
* [ ] Settings

---

## Task F15.7 — Final Frontend Review

Status: [ ]

* [ ] No console errors
* [ ] No broken routes
* [ ] No broken links
* [ ] No placeholder content
* [ ] No fake metrics
* [ ] No unsupported features represented
* [ ] Responsive
* [ ] Accessible
* [ ] Consistent
* [ ] Production build successful

---

# 4. Phase Dependency Map

```text
F0 Contract Verification
        │
        ▼
F1 Foundation
        │
        ▼
F2 Design System
        │
        ├──────────────► F3 Landing
        │
        ▼
F4 Application Shell
        │
        ▼
F5 Authentication
        │
        ▼
F6 Projects
        │
        ├──────────────► F9 API Keys
        │
        └──────────────► F13 Settings
        │
        ▼
F7 Shards
        │
        ├──────────────► F10 Health
        │
        └──────────────► F8 Routing
                            │
                            ▼
                           F12 Integration

F8 + F9 + F10 + F7
        │
        ▼
F11 Activity

All feature phases
        │
        ▼
F14 Integration & Polish
        │
        ▼
F15 Production Readiness
```

---

# 5. Task Execution Template

Every actual implementation task should use this structure:

````text
## Task FX.X — Task Name

Status: [ ]

### Goal

What this task accomplishes.

### Dependencies

- Previous task
- Required API
- Required component

### Files Allowed to Change

- file/path
- file/path

### Subtasks

- [ ] Subtask 1
- [ ] Subtask 2
- [ ] Subtask 3

### Must Implement

- Requirement 1
- Requirement 2
- Requirement 3

### Must NOT Implement

- Unrelated feature
- Future functionality
- Unsupported backend behavior

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Validation

- [ ] TypeScript
- [ ] Lint
- [ ] Build
- [ ] Browser verification

### Commit

```text
feat(frontend): <task description>
````

````

---

# 6. AI Implementation Workflow

For every task:

### Step 1 — Select One Task

Example:

```text
F2.3 — Build Base UI Components
````

### Step 2 — Read Relevant Documentation

Only read the documents required for that task.

### Step 3 — Create Task Prompt

The prompt must contain:

```text
Current Phase
Current Task
Goal
Relevant Documentation
Allowed Files
Required Behavior
Design Constraints
Acceptance Criteria
Do Not Implement
Validation Requirements
```

### Step 4 — Implement

AI modifies only the allowed scope.

### Step 5 — Review

Check:

```text
Architecture
Code quality
Design consistency
API assumptions
Security
Scope
```

### Step 6 — Validate

Run:

```text
TypeScript
Lint
Build
Browser verification
Tests where applicable
```

### Step 7 — Commit

Use a small commit:

```text
feat(frontend): implement dashboard shell
```

### Step 8 — Mark Task Complete

Change:

```text
Status: [ ]
```

to:

```text
Status: [x]
```

Only then continue.

---

# 7. Frontend Progress Tracker

## Foundation

* [x] F0 — Contract Verification
* [x] F1 — Frontend Foundation
* [x] F2 — Design System

## Public Experience

* [x] F3 — Landing Page

## Product Experience

* [x] F4 — Application Shell
* [x] F5 — Authentication
* [x] F6 — Projects
* [x] F7 — Shards
* [x] F8 — Routing
* [x] F9 — API Keys
* [x] F10 — Health
* [x] F11 — Activity
* [x] F12 — Integration
* [x] F13 — Settings

## Finalization

* [x] F14 — Integration & Polish
* [x] F15 — Production Readiness

---

# 8. Final Frontend Completion Checklist

The frontend is considered complete only when:

* [x] All F0–F15 phases completed
* [x] All required tasks completed
* [x] All acceptance criteria satisfied
* [x] Backend API integration verified
* [x] Supabase authentication verified
* [x] Project isolation verified through backend behavior
* [x] Shard management verified
* [x] Routing verified
* [x] API key lifecycle verified
* [x] Health monitoring UI verified
* [x] Activity UI verified
* [x] Integration documentation verified
* [x] Responsive behavior verified
* [x] Accessibility reviewed
* [x] Security reviewed
* [x] Production build succeeds
* [x] No fake production data remains
* [x] No unsupported V1 functionality is represented
* [x] No critical console errors remain

---

# 9. Core Rule

> **Do not build the frontend as one large task.**

Build it as:

```text
PHASE
  ↓
TASK
  ↓
SUBTASK
  ↓
PROMPT
  ↓
IMPLEMENTATION
  ↓
REVIEW
  ↓
VALIDATION
  ↓
COMMIT
  ↓
NEXT TASK
```

The frontend should evolve incrementally from the existing ShardFlow contracts rather than being generated as one large application.
