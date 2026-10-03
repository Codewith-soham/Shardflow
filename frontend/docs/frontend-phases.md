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

Status: [ ]

* [ ] Read `prd.md`
* [ ] Read `architecture.md`
* [ ] Read `database-design.md`
* [ ] Read `api.md`
* [ ] Read `error-contract.md`
* [ ] Read `rules.md`
* [ ] Read `memory.md`
* [ ] Read `frontend.md`

### Acceptance Criteria

* [ ] Frontend understands authentication flow
* [ ] Frontend understands project model
* [ ] Frontend understands shard model
* [ ] Frontend understands routing model
* [ ] Frontend understands API key behavior
* [ ] Frontend understands health states
* [ ] Frontend understands activity events
* [ ] Frontend understands integration requirements

---

## Task F0.2 — Identify Frontend API Dependencies

Status: [ ]

* [ ] List required control-plane endpoints
* [ ] Map endpoints to frontend features
* [ ] Identify required request payloads
* [ ] Identify response structures
* [ ] Identify error codes
* [ ] Identify authentication requirements
* [ ] Identify project-scoped resources
* [ ] Identify unsupported operations

### Acceptance Criteria

* [ ] No frontend feature assumes an undocumented endpoint
* [ ] Missing contracts are documented
* [ ] Unsupported behavior is explicitly excluded

---

## Task F0.3 — Freeze Frontend Scope

Status: [ ]

* [ ] Confirm V1 feature list
* [ ] Confirm dashboard routes
* [ ] Confirm authentication routes
* [ ] Confirm design direction
* [ ] Confirm responsive requirement
* [ ] Confirm dark-only requirement
* [ ] Confirm no GitHub login
* [ ] Confirm no fake production metrics

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

Status: [ ]

* [ ] Initialize React application
* [ ] Configure Vite
* [ ] Configure TypeScript
* [ ] Configure Tailwind CSS
* [ ] Configure project scripts
* [ ] Verify development server
* [ ] Verify production build

### Acceptance Criteria

* [ ] Application starts successfully
* [ ] TypeScript works
* [ ] Tailwind works
* [ ] Production build succeeds

---

## Task F1.2 — Create Frontend Folder Structure

Status: [ ]

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

* [ ] Create directories
* [ ] Remove unnecessary starter files
* [ ] Establish naming conventions

---

## Task F1.3 — Configure Environment Variables

Status: [ ]

* [ ] Configure frontend environment variables
* [ ] Configure backend API URL
* [ ] Configure Supabase URL
* [ ] Configure Supabase public key
* [ ] Create environment example file
* [ ] Verify secrets are not committed

### Acceptance Criteria

* [ ] Frontend reads configuration correctly
* [ ] No secret/service-role key exists in frontend
* [ ] `.env` is ignored

---

## Task F1.4 — Configure Application Providers

Status: [ ]

* [ ] Configure router
* [ ] Configure TanStack Query
* [ ] Configure Supabase client
* [ ] Configure global application providers
* [ ] Verify application boot

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

Status: [ ]

Implement:

* [ ] Background colors
* [ ] Surface colors
* [ ] Border colors
* [ ] Text colors
* [ ] Accent colors
* [ ] Health colors
* [ ] Spacing scale
* [ ] Border radius
* [ ] Shadows
* [ ] Typography

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

Status: [ ]

* [ ] Configure primary UI font
* [ ] Configure technical/monospace font
* [ ] Define heading hierarchy
* [ ] Define body text
* [ ] Define labels
* [ ] Define metadata
* [ ] Define code text

---

## Task F2.3 — Build Base UI Components

Status: [ ]

* [ ] Button
* [ ] Input
* [ ] Select
* [ ] Textarea
* [ ] Checkbox
* [ ] Badge
* [ ] Card
* [ ] Dialog
* [ ] Tooltip
* [ ] Dropdown
* [ ] Tabs
* [ ] Table
* [ ] Skeleton
* [ ] Alert

---

## Task F2.4 — Build Infrastructure Components

Status: [ ]

* [ ] StatusBadge
* [ ] HealthBadge
* [ ] MetricCard
* [ ] ConnectionStatus
* [ ] ShardCard
* [ ] HealthIndicator
* [ ] TenantMappingRow
* [ ] ApiKeyRow
* [ ] ActivityItem

---

## Task F2.5 — Build Feedback Components

Status: [ ]

* [ ] Loading state
* [ ] Empty state
* [ ] Error state
* [ ] Success feedback
* [ ] Confirmation dialog
* [ ] Toast/notification system

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

Status: [ ]

* [ ] ShardFlow branding
* [ ] Navigation
* [ ] Documentation link
* [ ] Sign in
* [ ] Get started CTA
* [ ] Responsive navigation

---

## Task F3.2 — Build Hero

Status: [ ]

* [ ] Hero headline
* [ ] Supporting copy
* [ ] Primary CTA
* [ ] Secondary CTA
* [ ] Infrastructure visualization
* [ ] Application → ShardFlow → database flow
* [ ] Responsive layout

---

## Task F3.3 — Build Infrastructure Visualization

Status: [ ]

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

* [ ] Database nodes
* [ ] Routing paths
* [ ] Health indicators
* [ ] Subtle data flow
* [ ] Responsive behavior
* [ ] No fake metrics

---

## Task F3.4 — Build Problem Section

Status: [ ]

Explain:

* [ ] Database scaling complexity
* [ ] Shard management complexity
* [ ] Application-level routing complexity
* [ ] Operational visibility

---

## Task F3.5 — Build How It Works Section

Status: [ ]

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

Status: [ ]

Show examples:

```text
tenant_001 → shard_01
tenant_002 → shard_02
tenant_003 → shard_01
```

Do not imply automatic rebalancing or unsupported load balancing.

---

## Task F3.7 — Build Shard Management Section

Status: [ ]

* [ ] Shard cards
* [ ] Admin status
* [ ] Health status
* [ ] Database type
* [ ] Connection representation

---

## Task F3.8 — Build Health Section

Status: [ ]

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

Status: [ ]

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

Status: [ ]

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

Status: [ ]

* [ ] Final CTA
* [ ] Documentation
* [ ] Product navigation
* [ ] Authentication links
* [ ] Footer information

### Gate

* [ ] Entire landing page works
* [ ] Mobile responsive
* [ ] No placeholder content
* [ ] No fake metrics
* [ ] Visual hierarchy is consistent

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

Status: [ ]

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

Status: [ ]

* [ ] Sidebar
* [ ] Topbar
* [ ] Main content area
* [ ] Responsive layout
* [ ] Mobile navigation

---

## Task F4.3 — Build Sidebar Navigation

Status: [ ]

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

Status: [ ]

* [ ] Project switcher
* [ ] Notifications
* [ ] User menu
* [ ] Breadcrumb/page context where required

---

## Task F4.5 — Build Protected Route Foundation

Status: [ ]

* [ ] Detect authenticated session
* [ ] Protect `/app/*`
* [ ] Redirect unauthenticated users
* [ ] Handle session loading
* [ ] Handle expired session

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

Status: [ ]

* [ ] Email input
* [ ] Password input
* [ ] Sign-in action
* [ ] Loading state
* [ ] Error state
* [ ] Success redirect

---

## Task F5.2 — Build Sign Up

Status: [ ]

* [ ] Registration form
* [ ] Validation
* [ ] Supabase registration
* [ ] Error handling
* [ ] Success state

---

## Task F5.3 — Build Forgot Password

Status: [ ]

* [ ] Email input
* [ ] Reset request
* [ ] Success state
* [ ] Error state

---

## Task F5.4 — Build Reset Password

Status: [ ]

* [ ] Password input
* [ ] Confirmation input
* [ ] Password update
* [ ] Success state
* [ ] Error state

---

## Task F5.5 — Complete Authentication Flow

Status: [ ]

* [ ] Session persistence
* [ ] Route protection
* [ ] Logout
* [ ] Auth loading state
* [ ] Expired session handling

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

Status: [ ]

* [ ] Fetch projects
* [ ] Display projects
* [ ] Loading state
* [ ] Empty state
* [ ] Error state

---

## Task F6.2 — Create Project

Status: [ ]

* [ ] Create project dialog/page
* [ ] Form validation
* [ ] API integration
* [ ] Success handling
* [ ] Error handling

---

## Task F6.3 — Project Selection

Status: [ ]

* [ ] Project switcher
* [ ] Persist selected project
* [ ] Update project context
* [ ] Reload project-specific data

---

## Task F6.4 — Project Details

Status: [ ]

* [ ] Project information
* [ ] Project identifier
* [ ] Relevant metadata
* [ ] Loading/error states

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

Status: [ ]

* [ ] Fetch shards
* [ ] Shard table/cards
* [ ] Admin status
* [ ] Health status
* [ ] Database type
* [ ] Loading state
* [ ] Empty state
* [ ] Error state

---

## Task F7.2 — Add Shard

Status: [ ]

* [ ] Add shard form
* [ ] Shard name
* [ ] Database type
* [ ] Connection configuration
* [ ] Validation
* [ ] Secure handling
* [ ] Success/error feedback

Never expose credentials in logs or normal UI responses.

---

## Task F7.3 — Shard Details

Status: [ ]

* [ ] Shard identity
* [ ] Admin status
* [ ] Health status
* [ ] Connection state
* [ ] Relevant metadata
* [ ] Activity

---

## Task F7.4 — Shard Administration

Status: [ ]

* [ ] Enable/disable where supported
* [ ] Confirmation dialogs
* [ ] Error handling
* [ ] Permission handling

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

* [ ] F0 — Contract Verification
* [ ] F1 — Frontend Foundation
* [ ] F2 — Design System

## Public Experience

* [ ] F3 — Landing Page

## Product Experience

* [ ] F4 — Application Shell
* [ ] F5 — Authentication
* [ ] F6 — Projects
* [ ] F7 — Shards
* [ ] F8 — Routing
* [ ] F9 — API Keys
* [ ] F10 — Health
* [ ] F11 — Activity
* [ ] F12 — Integration
* [ ] F13 — Settings

## Finalization

* [ ] F14 — Integration & Polish
* [ ] F15 — Production Readiness

---

# 8. Final Frontend Completion Checklist

The frontend is considered complete only when:

* [ ] All F0–F15 phases completed
* [ ] All required tasks completed
* [ ] All acceptance criteria satisfied
* [ ] Backend API integration verified
* [ ] Supabase authentication verified
* [ ] Project isolation verified through backend behavior
* [ ] Shard management verified
* [ ] Routing verified
* [ ] API key lifecycle verified
* [ ] Health monitoring UI verified
* [ ] Activity UI verified
* [ ] Integration documentation verified
* [ ] Responsive behavior verified
* [ ] Accessibility reviewed
* [ ] Security reviewed
* [ ] Production build succeeds
* [ ] No fake production data remains
* [ ] No unsupported V1 functionality is represented
* [ ] No critical console errors remain

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
