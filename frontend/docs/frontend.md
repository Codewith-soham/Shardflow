# ShardFlow V1 — Frontend Specification

**Document:** Frontend Specification
**Product:** ShardFlow
**Version:** V1.0
**Status:** Implementation Specification
**Related Documents:** `prd.md`, `architecture.md`, `database-design.md`, `api.md`, `error-contract.md`, `rules.md`, `memory.md`, `frontend-phases.md`

---

# 1. Purpose

This document defines the complete frontend experience for ShardFlow V1.

It defines:

* visual identity;
* design language;
* information architecture;
* landing page;
* authentication experience;
* dashboard;
* navigation;
* reusable components;
* frontend architecture;
* state management;
* API integration;
* loading/error/empty states;
* responsive behavior;
* accessibility;
* security;
* frontend quality requirements.

This document defines **what the frontend should be**.

The implementation order is defined separately in:

```text
frontend-phases.md
```

---

# 2. Frontend Product Goal

ShardFlow is infrastructure software.

The frontend must therefore feel like a:

```text
Developer Infrastructure Platform
```

and not like a generic SaaS dashboard.

The experience should communicate:

```text
Database infrastructure
Routing
Sharding
Health
Observability
Developer tooling
```

The frontend should feel technically credible, structured, precise, and production-oriented.

---

# 3. Product Experience Model

The frontend contains two major experiences:

```text
ShardFlow Frontend
│
├── Marketing Site
│   ├── Landing
│   └── Documentation entry
│
└── Product Application
    ├── Authentication
    └── Dashboard
        ├── Overview
        ├── Projects
        ├── Shards
        ├── Routing
        ├── API Keys
        ├── Health
        ├── Activity
        ├── Integration
        └── Settings
```

The marketing site introduces the product.

Authentication provides access to the platform.

The dashboard is the actual infrastructure management workspace.

---

# 4. Design Direction

## 4.1 Primary Inspiration

The frontend should take inspiration from the product experience of:

```text
CodeSandbox
Linear
Vercel
Modern developer infrastructure platforms
```

This does NOT mean copying their UI.

The goal is to combine:

```text
CodeSandbox
    +
Developer Workspace
    +
Infrastructure Dashboard
    +
ShardFlow identity
```

The result must feel like an original ShardFlow product.

---

# 5. Core Visual Identity

## 5.1 Theme

ShardFlow is:

```text
Dark mode only
```

No light-mode implementation is required for V1.

---

## 5.2 Base Colors

Use a near-black neutral foundation.

```text
Background:
#09090B

Primary Surface:
#111113

Secondary Surface:
#18181B

Elevated Surface:
#1E1E22

Border:
#27272A

Strong Border:
#3F3F46

Primary Text:
#F4F4F5

Secondary Text:
#A1A1AA

Muted Text:
#71717A
```

---

# 6. Accent System

The primary ShardFlow accent should be:

```text
Electric Blue / Indigo
```

Suggested direction:

```text
Primary Accent:
#38BDF8

Accent Hover:
#0EA5E9
```

The accent should be used selectively.

It should not dominate the entire interface.

---

# 7. Infrastructure Status Colors

Neon green is reserved primarily for healthy infrastructure and operational states.

```text
Healthy:
#34D399

Warning:
#FBBF24

Error:
#F87171

Unknown:
#71717A

Information:
#38BDF8
```

Example:

```text
● HEALTHY
● DEGRADED
● UNHEALTHY
● UNKNOWN
```

Neon green should communicate:

```text
"the infrastructure is healthy"
```

rather than becoming the entire brand identity.

---

# 8. Visual Balance

Approximate visual distribution:

```text
80%  Neutral dark surfaces
15%  Typography / borders / structure
5%   Accent / status / interaction
```

Avoid turning every component into an illuminated neon object.

The interface should feel restrained and technical.

---

# 9. Typography

Primary font:

```text
Inter
```

or a comparable modern system/Geist-style sans-serif.

Technical values should use:

```text
JetBrains Mono
```

or a comparable monospace font.

Use monospace for:

```text
API keys
tenant IDs
shard IDs
project IDs
database identifiers
endpoints
code snippets
technical metadata
```

Do not use monospace for normal body text.

---

# 10. Typography Hierarchy

Marketing:

```text
Hero:
Large / bold

Section heading:
Large / semibold

Body:
Readable / medium

Supporting text:
Muted
```

Dashboard:

```text
Page title:
Compact / semibold

Section title:
Medium / semibold

Body:
Regular

Metadata:
Small / muted

Technical values:
Monospace
```

Dashboard typography must remain compact.

Do not use oversized SaaS-style dashboard headings.

---

# 11. Spacing

Use a consistent spacing system.

Preferred scale:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Do not introduce arbitrary spacing values without reason.

---

# 12. Border Radius

Preferred range:

```text
6px
8px
10px
12px
```

Avoid excessive rounded UI.

ShardFlow should not look like a collection of giant floating pills.

---

# 13. Surfaces

Use layered surfaces:

```text
Page Background
    ↓
Primary Surface
    ↓
Secondary Surface
    ↓
Elevated Surface
```

Cards should have:

```text
subtle border
small radius
controlled elevation
```

Avoid heavy shadows.

---

# 14. Visual Effects

Allowed:

```text
subtle glow
subtle gradients
grid backgrounds
network lines
connection paths
small data-packet animations
hover transitions
status pulses
```

Avoid:

```text
excessive glassmorphism
large gradients
random floating shapes
constant animations
neon everywhere
decorative 3D objects without meaning
```

Every visual effect should reinforce the infrastructure concept.

---

# 15. Anti-Vibe-Coded Rules

The frontend must NOT look automatically generated.

Do not use:

* excessive gradients;
* excessive glassmorphism;
* giant rounded cards;
* random animations;
* oversized dashboard headings;
* fake statistics;
* decorative charts without meaning;
* unnecessary icons;
* inconsistent spacing;
* inconsistent component styling;
* excessive empty space;
* meaningless glowing elements;
* generic SaaS illustrations unrelated to databases.

Every visual element should have a product reason.

---

# 16. Product Visual Language

ShardFlow should visually communicate:

```text
Application
      ↓
ShardFlow
      ↓
Routing
      ↓
Shard
      ↓
MongoDB
```

The main visual language is:

```text
nodes
connections
routing paths
database clusters
health states
data flow
infrastructure topology
```

---

# 17. Hero Visual

The generated ShardFlow infrastructure visual is the primary visual reference for the landing page.

The visual concept is:

```text
Application
      │
      ▼
┌──────────────┐
│   ShardFlow  │
│              │
│   Routing    │
│ Connections  │
│    Health    │
└──────┬───────┘
       │
 ┌─────┼─────┐
 ▼     ▼     ▼
DB 01 DB 02 DB 03
 ●     ●     ●
```

The actual landing implementation should create a product-integrated version of this visual rather than simply placing an unrelated image.

The visual may contain:

```text
subtle grid
network paths
database nodes
connection indicators
small status signals
data flow
```

The visual must remain readable.

---

# 18. Landing Page

Route:

```text
/
```

The landing page should feel like the public-facing introduction to a serious infrastructure product.

---

# 19. Landing Page Structure

```text
Navbar
   ↓
Hero
   ↓
Infrastructure Visual
   ↓
Problem
   ↓
How ShardFlow Works
   ↓
Routing
   ↓
Shard Management
   ↓
Health Monitoring
   ↓
Developer Integration
   ↓
Architecture
   ↓
Final CTA
   ↓
Footer
```

---

# 20. Landing Navbar

Navigation:

```text
ShardFlow

Product
How It Works
Docs

Sign In
Get Started
```

The navbar should remain minimal.

Primary CTA:

```text
Get Started
```

Secondary action:

```text
Sign In
```

---

# 21. Hero Section

The hero should immediately communicate what ShardFlow does.

Suggested direction:

```text
Manage distributed MongoDB
infrastructure without managing
the complexity yourself.
```

Supporting copy:

```text
ShardFlow sits between your application and
your MongoDB shards, handling routing,
connections, and infrastructure visibility.
```

Primary CTA:

```text
Get Started
```

Secondary CTA:

```text
View Documentation
```

The exact marketing copy can be refined during implementation, but it must remain consistent with the PRD.

---

# 22. Hero Layout

Desktop:

```text
┌──────────────────────────────────────────────────────────┐
│ Navbar                                                   │
├───────────────────────────┬──────────────────────────────┤
│                           │                              │
│ Headline                  │                              │
│ Supporting copy           │  ShardFlow Infrastructure   │
│                           │       Visualization          │
│ [Get Started]             │                              │
│ [Documentation]           │ Application → ShardFlow     │
│                           │ → DB1 / DB2 / DB3            │
│                           │                              │
└───────────────────────────┴──────────────────────────────┘
```

The infrastructure visual should occupy substantial space without overpowering the headline.

---

# 23. Problem Section

Explain the problem without using generic SaaS language.

Concept:

```text
Your application should not need to manage:

multiple database connections
shard selection
routing metadata
health checks
connection pools
```

Visual:

```text
Application
    │
    ├── DB connection 1
    ├── DB connection 2
    ├── DB connection 3
    ├── routing logic
    ├── health checks
    └── failure handling
```

Then transition into:

```text
ShardFlow centralizes these concerns.
```

---

# 24. How ShardFlow Works

Visual flow:

```text
Application
     ↓
ShardFlow
     ↓
Tenant
     ↓
Tenant → Shard Mapping
     ↓
MongoDB Shard
```

This section must communicate the V1 routing model accurately.

---

# 25. Routing Section

Show deterministic tenant routing.

Example:

```text
tenant_001 ───────→ shard_01
tenant_002 ───────→ shard_01
tenant_003 ───────→ shard_02
tenant_004 ───────→ shard_03
```

The visual should emphasize:

```text
tenantId
    ↓
mapping
    ↓
shard
```

Do not imply automatic load balancing or automatic rebalancing in V1.

---

# 26. Shard Management Section

Show infrastructure nodes.

Example:

```text
┌──────────────────────┐
│ shard-01             │
│ ● HEALTHY            │
│ MongoDB              │
│ Active               │
└──────────────────────┘

┌──────────────────────┐
│ shard-02             │
│ ● HEALTHY            │
│ MongoDB              │
│ Active               │
└──────────────────────┘

┌──────────────────────┐
│ shard-03             │
│ ● DEGRADED           │
│ MongoDB              │
│ Active               │
└──────────────────────┘
```

Do not invent production statistics.

If metrics are displayed, clearly label them as illustrative/demo UI or use actual backend data.

---

# 27. Health Monitoring Section

Show:

```text
Shard
   ↓
Health Check
   ↓
Health State
   ↓
Health Event
   ↓
Notification
```

Health states:

```text
UNKNOWN
HEALTHY
DEGRADED
UNHEALTHY
```

The visual should communicate monitoring rather than automatic failover.

---

# 28. Developer Integration Section

Show how an application integrates with ShardFlow.

Concept:

```text
Your Application
      ↓
ShardFlow API
      ↓
X-API-Key
      ↓
tenantId
      ↓
MongoDB Shard
```

Example code-style visual:

```text
SHARDFLOW_API_KEY=...
SHARDFLOW_URL=...
```

Do not display real secrets.

---

# 29. Architecture Section

Show the complete system:

```text
Developer
    ↓
Dashboard
    ↓
Control Plane
    ↓
Metadata MongoDB
    ↓
Shard Registry
    ↓
Routing / Connection Manager
    ↓
Customer MongoDB Shards
```

Also communicate:

```text
Control Plane
    =
configuration + administration

Data Plane
    =
application database traffic
```

This matches the existing architecture.

---

# 30. Final CTA

Final landing CTA should be simple.

Example:

```text
Build your application.
Let ShardFlow handle the infrastructure.

[ Get Started ]
```

Do not introduce pricing claims in V1 unless separately defined.

---

# 31. Footer

Footer sections:

```text
ShardFlow

Product
How It Works
Dashboard
Docs

Developers
API
Integration
GitHub

Company
About
Contact
```

Only include links that actually exist.

---

# 32. Authentication

Authentication is handled through:

```text
Supabase Auth
```

ShardFlow does not implement its own password authentication system in V1.

Do NOT introduce:

```text
custom passwordHash
custom refresh-token authentication
custom authentication infrastructure
```

unless the authentication architecture is explicitly changed.

---

# 33. Authentication Pages

Routes:

```text
/sign-in
/sign-up
/forgot-password
/reset-password
```

The exact route names may be adjusted during implementation, but the experience should remain clear.

---

# 34. Sign In Design

The Sign In page must visually belong to the ShardFlow product.

It must NOT look like a generic authentication template.

Desktop layout:

```text
┌──────────────────────────────┬──────────────────────────────┐
│                              │                              │
│        ShardFlow             │       Welcome back           │
│                              │                              │
│   Application                │   Access your workspace      │
│       │                      │                              │
│       ▼                      │   Email                      │
│   ShardFlow                  │   [____________________]     │
│       │                      │                              │
│   ┌───┼───┐                  │   Password                   │
│   ▼   ▼   ▼                  │   [____________________]     │
│  DB1 DB2 DB3                 │                              │
│  ●   ●   ●                   │   [       Sign in →      ]   │
│                              │                              │
│   infrastructure visual      │   Don't have an account?     │
│                              │   Sign up                    │
└──────────────────────────────┴──────────────────────────────┘
```

No GitHub login button is part of the current product decision.

---

# 35. Dashboard

The dashboard is the authenticated infrastructure workspace.

Route:

```text
/app
```

or equivalent authenticated application route.

The dashboard must feel substantially denser than the landing page.

---

# 36. Dashboard Navigation

Primary navigation:

```text
Overview
Projects
```

Infrastructure:

```text
Shards
Routing
```

Security:

```text
API Keys
```

Monitoring:

```text
Health
Activity
```

Developer:

```text
Integration
```

System:

```text
Settings
```

Suggested sidebar:

```text
ShardFlow
────────────────────

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

────────────────────
Settings
User
```

---

# 37. Project Switcher

The dashboard should support a project context.

Example:

```text
┌──────────────────────┐
│ My Application   ▼   │
└──────────────────────┘
```

All project-scoped pages must clearly communicate the current project.

---

# 38. Dashboard Topbar

Topbar elements:

```text
Project Switcher
Search / command access
Health summary
Notifications
User menu
```

Keep the topbar compact.

---

# 39. Overview Page

The Overview page should provide infrastructure status at a glance.

Possible sections:

```text
Project
    ↓
Infrastructure Summary
    ↓
Shard Status
    ↓
Routing Summary
    ↓
Recent Activity
```

Example metrics:

```text
Active Shards
Healthy Shards
Configured Tenants
Recent Health Events
```

Only show values returned by the backend.

Do not invent fake production metrics.

---

# 40. Shards Page

Route:

```text
/app/shards
```

Purpose:

```text
Register
View
Manage
Enable/disable
Inspect
```

customer MongoDB shards.

Each shard should expose:

```text
Shard name
Shard ID
Status
Health
Created date
Last health check
```

Credentials must never be displayed in normal UI responses.

---

# 41. Shard Detail

Show:

```text
Shard Identity
Administrative Status
Health Status
Connection State
Last Health Check
Recent Health Events
Configuration Metadata
```

Separate:

```text
Administrative Status
```

from:

```text
Health Status
```

Example:

```text
Status:
ACTIVE

Health:
● HEALTHY
```

---

# 42. Routing Page

Route:

```text
/app/routing
```

Purpose:

```text
View routing configuration
View tenant → shard mappings
Create mapping
Update mapping
Remove mapping
```

Visual:

```text
Tenant ID             Shard

tenant_001    ─────→  shard_01
tenant_002    ─────→  shard_01
tenant_003    ─────→  shard_02
```

The frontend must not imply that users can arbitrarily choose a shard during application requests.

---

# 43. API Keys Page

Route:

```text
/app/api-keys
```

Display:

```text
Key name
Created
Expiration
Status
Last used
```

Raw API keys should only be displayed at creation time if the backend contract permits it.

Never expose stored hashed keys.

---

# 44. Health Page

Route:

```text
/app/health
```

Display:

```text
Shard health
Health state
Last check
Health events
Current issues
```

Visual language:

```text
● HEALTHY
● DEGRADED
● UNHEALTHY
● UNKNOWN
```

Health information should be easy to scan.

---

# 45. Activity Page

Route:

```text
/app/activity
```

Display relevant audit/infrastructure events.

Example:

```text
10:42
Shard registered
shard-03

10:37
Routing mapping updated
tenant_004 → shard_03

10:21
Health state changed
shard-02 → UNHEALTHY
```

Use monospace selectively for identifiers.

---

# 46. Integration Page

Route:

```text
/app/integration
```

Purpose:

Help developers connect an application to ShardFlow.

Sections:

```text
API endpoint
API key
Environment variables
Request format
Tenant ID
Example operation
```

Example:

```text
SHARDFLOW_API_KEY=your_key
SHARDFLOW_URL=https://...
```

Secrets should be masked by default.

---

# 47. Settings Page

Route:

```text
/app/settings
```

Possible sections:

```text
Project settings
User profile
Notifications
Security
```

Only expose settings supported by the backend.

---

# 48. Reusable Component System

Create reusable components before building large feature pages.

Core components:

```text
Button
Input
Select
Textarea
Dialog
Dropdown
Tooltip
Tabs
Badge
Table
Pagination
Skeleton
Spinner
Alert
Toast
Card
Separator
CodeBlock
```

Layout components:

```text
DashboardLayout
Sidebar
Topbar
PageHeader
ProjectSwitcher
UserMenu
NotificationMenu
```

Infrastructure components:

```text
StatusBadge
HealthBadge
HealthIndicator
ShardCard
ShardStatus
ShardNode
ConnectionStatus
TenantMappingRow
ApiKeyRow
HealthEvent
ActivityItem
```

Feedback:

```text
EmptyState
ErrorState
LoadingState
ConfirmationDialog
SuccessMessage
```

---

# 49. Frontend Feature Structure

Recommended structure:

```text
frontend/
└── src/
    ├── app/
    │   ├── router/
    │   ├── providers/
    │   └── config/
    │
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── navigation/
    │   └── feedback/
    │
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
    │
    ├── lib/
    │   ├── api/
    │   ├── supabase/
    │   └── utils/
    │
    ├── hooks/
    ├── types/
    ├── styles/
    │
    └── main.tsx
```

---

# 50. Frontend Architecture

The frontend request flow should follow:

```text
Page
  ↓
Feature Hook
  ↓
Feature API
  ↓
HTTP Client
  ↓
ShardFlow Backend
```

Example:

```text
Shards Page
    ↓
useShards()
    ↓
shardsApi.getShards()
    ↓
apiClient
    ↓
Control Plane API
```

Do not place business logic directly inside page components.

---

# 51. Server State

Use:

```text
TanStack Query
```

for server state.

Examples:

```text
projects
shards
routing mappings
health events
activity
API keys
```

---

# 52. Local UI State

Use React state for local UI concerns.

Examples:

```text
dialog open/close
selected tab
form input
sidebar state
temporary filters
```

Do not duplicate server state unnecessarily in local state.

---

# 53. API Client

Create a centralized HTTP client.

Responsibilities:

```text
base URL
headers
authentication
request IDs where required
response parsing
error normalization
```

Feature modules should not create independent HTTP clients.

---

# 54. Error Handling

The frontend must understand the centralized backend error contract:

```json
{
  "success": false,
  "message": "Human-readable message",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed message"
  }
}
```

The UI should map known error codes to appropriate user-facing behavior.

Never display raw stack traces.

---

# 55. Loading States

Every data-driven page must define a loading state.

Examples:

```text
Skeleton table
Skeleton cards
Loading indicator
Disabled submit button
```

Do not leave empty blank pages during network requests.

---

# 56. Empty States

Every data-driven page must define an intentional empty state.

Example:

```text
No shards registered

Connect your first MongoDB shard
to start routing application traffic.

[ Add Shard ]
```

Empty states should explain:

```text
what is missing
why it matters
what action to take
```

---

# 57. Error States

Example:

```text
Unable to load shards

We couldn't retrieve the shard configuration.

[ Try Again ]
```

Errors must be actionable where possible.

---

# 58. Responsive Design

Desktop is the primary dashboard target.

Supported:

```text
Desktop
Laptop
Tablet
Mobile
```

On mobile:

```text
sidebar → drawer
tables → responsive cards / horizontal scroll
multi-column layouts → stacked layouts
```

Do not simply shrink desktop UI.

---

# 59. Accessibility

Required:

```text
keyboard navigation
visible focus states
semantic HTML
accessible labels
sufficient contrast
ARIA where appropriate
screen-reader friendly controls
```

Interactive elements must be usable without a mouse.

---

# 60. Security Rules

Never expose:

```text
customer database credentials
API key hashes
internal secrets
Supabase service-role credentials
environment secrets
```

Do not store sensitive credentials in frontend source code.

Only public frontend-safe environment variables may be exposed.

---

# 61. Dashboard Security Boundary

The dashboard communicates with:

```text
ShardFlow Control Plane API
```

It does NOT communicate directly with:

```text
Customer MongoDB shards
```

Architecture:

```text
Dashboard
    |
    | HTTPS
    v
Control Plane
    |
    v
Metadata DB
```

This matches the system architecture.

---

# 62. Landing Page Visual Assets

The frontend should use custom ShardFlow visuals rather than generic stock imagery.

Required visual concepts:

```text
1. Infrastructure Hero
2. Tenant Routing
3. Shard Management
4. Health Monitoring
5. Developer Integration
6. Architecture
```

All visuals must share:

```text
dark background
blue/indigo accents
neon-green health indicators
thin technical lines
database nodes
subtle grid
```

---

# 63. Motion

Motion should communicate system behavior.

Good examples:

```text
data packet traveling through routing path
node health pulse
connection establishment
subtle hover state
dashboard refresh
```

Avoid:

```text
large page transitions
constant bouncing
random floating elements
excessive parallax
```

Motion must respect reduced-motion preferences.

---

# 64. Dashboard Density

The dashboard should prioritize information density.

A good dashboard should allow a developer to understand:

```text
What projects exist?
What shards exist?
Which shards are healthy?
Where are tenants routed?
What changed recently?
What needs attention?
```

without excessive scrolling.

---

# 65. Data Integrity in UI

Never fabricate:

```text
uptime
latency
requests per second
capacity
traffic
health percentages
```

unless the backend provides those values.

If a visual requires illustrative data for the public landing page, it must be clearly treated as conceptual rather than real production data.

---

# 66. Frontend Routing

Recommended route structure:

```text
/
├── /docs
├── /sign-in
├── /sign-up
├── /forgot-password
│
└── /app
    ├── /overview
    ├── /projects
    ├── /shards
    ├── /shards/:shardId
    ├── /routing
    ├── /api-keys
    ├── /health
    ├── /activity
    ├── /integration
    └── /settings
```

Protected routes must require authenticated user state.

---

# 67. Project Isolation

The frontend must always respect project boundaries.

Project-scoped resources should be requested using the active project context.

Never display data belonging to another project.

---

# 68. Frontend Quality Gate

Before a frontend phase is considered complete:

```text
[ ] Design matches ShardFlow system
[ ] No generic SaaS styling
[ ] No fake metrics
[ ] Responsive behavior works
[ ] Loading state exists
[ ] Empty state exists
[ ] Error state exists
[ ] API errors are handled
[ ] Accessibility checked
[ ] No secrets exposed
[ ] Components are reusable
[ ] No unnecessary duplication
[ ] No console errors
[ ] No broken routes
```

---

# 69. Definition of Done

The frontend V1 is complete when:

```text
Landing page works
Authentication works
Project context works
Dashboard shell works
Projects work
Shard management works
Routing works
API key management works
Health visibility works
Activity works
Integration page works
Settings works
Responsive behavior works
Error handling works
Loading states work
Empty states work
Security requirements are satisfied
```

---

# 70. Final Frontend Principle

ShardFlow should feel like:

```text
Infrastructure software
built for developers
by developers.
```

The visual design should communicate:

```text
precision
reliability
technical depth
clarity
control
```

not:

```text
generic SaaS
AI-generated dashboard
marketing-heavy startup template
```

The frontend must make the underlying ShardFlow architecture visually understandable.

---

# 71. Source of Truth

Frontend implementation must respect:

```text
prd.md
architecture.md
database-design.md
api.md
error-contract.md
rules.md
memory.md
frontend.md
frontend-phases.md
```

If a frontend requirement conflicts with the backend architecture or finalized product decision, the implementation must stop and the conflict must be resolved before coding.
