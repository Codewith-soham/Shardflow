# ShardFlow V1 — Project Memory

**Document:** Project Memory
**Product:** ShardFlow
**Version:** V1.0
**Status:** Living Document
**Purpose:** Persistent context and decision memory for humans and AI agents
**Last Updated:** 2026-09-21

---

# 1. How to Use This Document

This file is the persistent memory of the ShardFlow project.

It exists so that a future developer or AI agent can understand:

* what ShardFlow is;
* why it exists;
* what has already been decided;
* what technologies have been selected;
* what architectural boundaries exist;
* what decisions must not be changed casually;
* what alternatives were considered;
* what remains undecided;
* what direction V1 is currently taking.

This is a **living document**.

When an important project decision is made, update this file.

Do not use this file as the primary task tracker.

Use:

```text
task.md → implementation progress
memory.md → decisions and context
```

---

# 2. Project Identity

## Name

```text
ShardFlow
```

## Core Idea

ShardFlow is a database infrastructure layer that sits between an application and multiple MongoDB databases.

The application communicates with ShardFlow rather than directly managing multiple MongoDB connections.

Conceptually:

```text
Application
     |
     v
  ShardFlow
     |
     +----------+----------+
     |          |          |
     v          v          v
 MongoDB     MongoDB     MongoDB
 Shard 1     Shard 2     Shard 3
```

ShardFlow is responsible for:

* database routing;
* shard management;
* connection management;
* supported database operations;
* shard health monitoring;
* infrastructure metadata;
* tenant-to-shard mapping.

---

# 3. Product Vision

The long-term vision is to make database infrastructure easier for application developers.

Instead of every application having to manually manage:

```text
multiple database connections
shard selection
connection pooling
health checks
routing metadata
database failure handling
```

ShardFlow provides a controlled infrastructure layer.

The V1 implementation is intentionally much smaller than the long-term vision.

---

# 4. Problem Being Solved

The project started from the idea that managing multiple MongoDB databases can become complicated when an application needs to distribute data across them.

Without an infrastructure layer, an application may need to handle:

```text
Which database should receive this request?
Is the database available?
How should connections be reused?
Where is a tenant's data?
What happens when a shard becomes unhealthy?
How should database credentials be managed?
```

ShardFlow centralizes these concerns.

---

# 5. Core Product Model

The current product model is:

```text
User
  ↓
Project
  ↓
API Key
  ↓
Application
  ↓
ShardFlow Data Plane
  ↓
Tenant
  ↓
Tenant → Shard Mapping
  ↓
MongoDB Shard
```

The dashboard/control plane manages infrastructure.

The data plane handles application database requests.

---

# 6. User Model

A ShardFlow user:

1. signs up/logs in;
2. creates a project;
3. generates an API key;
4. registers MongoDB shards;
5. configures routing;
6. integrates ShardFlow into an application.

The user is the administrative owner of their ShardFlow project.

---

# 7. Authentication Decision

## Decision

ShardFlow will use:

```text
Supabase Auth
```

for user authentication.

Supabase is responsible for:

* authentication;
* user credentials;
* authentication sessions;
* identity management.

ShardFlow stores a corresponding user record containing the Supabase identity reference.

---

## Important Boundary

ShardFlow does **not** implement its own password authentication system in V1.

Do not introduce:

```text
passwordHash
custom login credentials
custom refresh-token authentication
```

unless this decision is explicitly revisited.

---

# 8. Application Authentication Decision

The application/data plane will use ShardFlow API keys.

Conceptually:

```text
Application
    |
    | X-API-Key
    v
ShardFlow
```

The API key identifies the ShardFlow project.

API keys are:

* project-scoped;
* hashed before storage;
* revocable;
* optionally expirable.

---

# 9. Email Provider Decision

## Decision

ShardFlow will use:

```text
Brevo
```

for transactional email.

Initial expected use case:

```text
Shard health notification
```

The notification architecture should keep the provider behind a notification/email abstraction.

Conceptually:

```text
Health Service
      ↓
Notification Service
      ↓
Email Provider
      ↓
Brevo
```

This keeps Brevo replaceable in the future.

---

# 10. Database Decision

## Metadata Database

ShardFlow uses MongoDB for its own metadata.

This database stores:

```text
users
projects
apiKeys
shards
routingConfigs
tenantShardMappings
healthEvents
auditLogs
```

---

## Customer Databases

Customer application data remains in the customer's MongoDB shards.

ShardFlow does not copy customer application data into its metadata database.

This separation is fundamental.

```text
ShardFlow MongoDB
    =
Infrastructure Metadata


Customer MongoDB Shards
    =
Application Data
```

---

# 11. Data Ownership Decision

ShardFlow manages infrastructure metadata.

The customer owns application data.

ShardFlow should not become the source of truth for customer application records.

For example:

```text
Customer users
Customer orders
Customer products
Customer messages
```

remain inside the customer's MongoDB databases.

---

# 12. Routing Decision

## V1 Strategy

V1 uses:

```text
Tenant-based routing
```

The routing relationship is:

```text
tenantId → shardId
```

The metadata representation is:

```text
TenantShardMapping
```

Example:

```text
tenant_001 → shard_1
tenant_002 → shard_1
tenant_003 → shard_2
tenant_004 → shard_3
```

---

# 13. Why Tenant-Based Routing

Tenant-based routing provides a simple deterministic model for V1.

The request does not need to search multiple databases.

Instead:

```text
tenantId
   ↓
mapping
   ↓
shard
   ↓
connection
   ↓
operation
```

This gives ShardFlow a clear routing responsibility without requiring complex automatic sharding algorithms in V1.

---

# 14. Routing Invariant

A tenant must have at most one active mapping within a project.

Therefore:

```text
projectId + tenantId
```

must be unique.

A tenant cannot simultaneously resolve to:

```text
tenant_123 → shard_1
tenant_123 → shard_2
```

unless a future migration/versioning system explicitly introduces that capability.

---

# 15. Control Plane / Data Plane Decision

ShardFlow is divided conceptually into:

```text
Control Plane
Data Plane
```

## Control Plane

Responsible for infrastructure management:

```text
authentication
projects
API keys
shards
routing configuration
tenant mappings
health management
audit
```

## Data Plane

Responsible for application database traffic:

```text
API-key authentication
request validation
tenant resolution
routing
connection acquisition
MongoDB operation execution
response handling
```

This separation must remain clear.

---

# 16. Data Plane Philosophy

The data plane should not expose arbitrary MongoDB execution.

The client should use explicit ShardFlow operations.

Current V1 operation direction:

```text
find
find-one
insert-one
update-one
delete-one
```

The exact request/response contract is defined in:

```text
api.md
```

---

# 17. Operator Decision

MongoDB operators/options will be explicitly controlled by the ShardFlow API.

The API will define which operators are permitted.

The system must not blindly forward arbitrary MongoDB operators supplied by clients.

Flow:

```text
Client Request
      ↓
Operation Validation
      ↓
Operator Validation
      ↓
Routing
      ↓
MongoDB Execution
```

This is an intentional security and abstraction boundary.

---

# 18. Database Representation Decision

The V1 data-plane representation follows the previously selected **Option A** approach.

The exact public representation and permitted operators are governed by:

```text
api.md
```

The important architectural principle is:

```text
Client Request
    ↓
Structured ShardFlow Operation
    ↓
Validation
    ↓
MongoDB Driver
```

not:

```text
Client Request
    ↓
Raw MongoDB Command
```

---

# 19. Connection Management Decision

ShardFlow should reuse MongoDB connections.

It must not establish a new MongoDB connection for every request.

Expected model:

```text
Request
   ↓
Resolve Shard
   ↓
Connection Manager
   ↓
Existing Connection Pool
   ↓
Execute
```

The connection manager is responsible for connection lifecycle and reuse.

---

# 20. Shard Health Decision

Each registered shard has both:

```text
Administrative Status
Health Status
```

Administrative status:

```text
ACTIVE
DISABLED
```

Health status:

```text
UNKNOWN
HEALTHY
DEGRADED
UNHEALTHY
```

These are intentionally separate concepts.

A shard may be:

```text
status = ACTIVE
healthStatus = UNHEALTHY
```

meaning the shard is configured and enabled but currently unhealthy.

---

# 21. Health Monitoring Decision

Shard health should be monitored independently from normal application traffic.

Conceptually:

```text
Health Monitor
      ↓
Shard
      ↓
Health State
      ↓
Notification
```

Important health transitions can create health events.

---

# 22. Email Notification Decision

When a shard becomes unhealthy or recovers, ShardFlow may notify the project administrator.

V1 email infrastructure:

```text
Brevo
```

The exact notification triggers and frequency are part of implementation and should not be expanded without updating the relevant documentation.

---

# 23. Secret Management Decision

Customer MongoDB connection credentials are sensitive.

They should not be casually stored as plaintext in normal application documents.

The intended model is:

```text
Shard
 |
 +-- connectionSecretReference
              |
              v
        Secret Storage
              |
              v
       MongoDB Connection
```

The exact secret-management implementation remains an implementation/infrastructure decision unless explicitly finalized elsewhere.

---

# 24. API Key Security Decision

Raw API keys are never stored.

Expected flow:

```text
Generate Raw Key
      ↓
Show Raw Key During Creation
      ↓
Hash Key
      ↓
Store Hash
```

Future authentication:

```text
Incoming API Key
      ↓
Hash
      ↓
Lookup
      ↓
Validate State
      ↓
Authorize Project
```

---

# 25. Cross-Project Isolation Decision

Every project-owned resource must be scoped to its project.

A resource ID alone is insufficient for authorization.

Example:

```text
project_A
    |
    +-- shard_A
```

A user/application associated with:

```text
project_B
```

must not be able to access `shard_A`.

---

# 26. Cross-Tenant Isolation Decision

Tenant identity is a routing boundary.

A request for:

```text
tenant_A
```

must resolve according to:

```text
tenant_A → assigned shard
```

The system must not allow the caller to arbitrarily select another tenant's shard.

---

# 27. No Automatic Data Migration in V1

Changing a mapping:

```text
tenant_A → shard_1
```

to:

```text
tenant_A → shard_2
```

does not automatically move data.

Automatic migration is a separate future capability.

This distinction is important because changing routing metadata is not equivalent to moving application data.

---

# 28. No Cross-Shard Transactions in V1

V1 does not support distributed transactions across customer shards.

The system must not pretend that operations spanning:

```text
shard_1
+
shard_2
```

are atomic.

---

# 29. No Automatic Rebalancing in V1

V1 does not automatically redistribute tenants between shards based on:

```text
storage
traffic
load
capacity
health
```

Routing remains explicitly configured.

Automatic rebalancing is future scope.

---

# 30. No Redis Requirement in V1

Redis is not currently part of the required V1 architecture.

Do not introduce Redis simply because:

```text
"distributed systems usually use Redis"
```

If caching becomes necessary, the decision must be explicit and documented.

---

# 31. No Kubernetes Requirement in V1

Kubernetes is not required for the initial implementation.

Deployment complexity should remain appropriate to the V1 system.

---

# 32. Architecture Philosophy

ShardFlow is intended to eventually become infrastructure software.

However, V1 must first prioritize:

```text
correctness
security
understandability
deterministic routing
clear boundaries
testability
```

over premature distributed-system complexity.

---

# 33. API Philosophy

The API should be:

```text
explicit
predictable
validated
documented
versioned
```

The API should not expose internal implementation details unnecessarily.

---

# 34. Error Contract Decision

All errors use a consistent structure.

Conceptually:

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

The authoritative error definitions are in:

```text
error-contract.md
```

---

# 35. Documentation Structure

The project documentation is intentionally separated.

```text
docs/
├── prd.md
├── architecture.md
├── database.md
├── api.md
├── error-contract.md
├── rules.md
├── memory.md
└── task.md
```

Each file has a specific responsibility.

---

# 36. Document Responsibilities

## prd.md

Defines:

```text
what ShardFlow must do
```

---

## architecture.md

Defines:

```text
how the system is structured
```

---

## database.md

Defines:

```text
how ShardFlow metadata is stored
```

---

## api.md

Defines:

```text
what external APIs expose
```

---

## error-contract.md

Defines:

```text
how failures are represented
```

---

## rules.md

Defines:

```text
engineering constraints
```

---

## memory.md

Defines:

```text
why important decisions were made
```

---

## task.md

Defines:

```text
what is currently being built
```

---

# 37. Current Technology Decisions

Current known technology direction:

```text
Backend
Node.js / TypeScript

API Framework
Fastify

Primary Metadata Database
MongoDB

Customer Databases
MongoDB

Authentication
Supabase Auth

Email
Brevo
```

Other infrastructure choices should be treated as undecided unless explicitly recorded.

---

# 38. Project Structure Decision

The repository currently has:

```text
docs/
frontend/
backend/
```

The frontend and backend are intentionally separated.

Documentation is maintained separately from implementation.

---

# 39. Frontend Decision

The frontend is part of the overall V1 product but should not block backend/data-plane development.

The frontend will primarily serve the control-plane/dashboard experience.

Expected dashboard capabilities include:

```text
authentication
project management
API key management
shard management
routing management
health visibility
notifications/status
```

The exact implementation order is tracked in `task.md`.

---

# 40. Backend Priority

The backend is the foundation of the system.

The implementation should establish:

```text
control-plane foundations
        ↓
data-plane foundations
        ↓
routing
        ↓
connection management
        ↓
MongoDB operations
        ↓
health monitoring
        ↓
frontend integration
```

The exact execution order can change as implementation reveals dependencies, but major changes should be recorded.

---

# 41. AI Continuation Protocol

Any new AI agent joining the project should read these files before making significant changes:

```text
1. memory.md
2. prd.md
3. architecture.md
4. database.md
5. api.md
6. error-contract.md
7. rules.md
8. task.md
```

Then determine:

```text
What is already decided?
What is currently being built?
What is explicitly out of scope?
What remains undecided?
```

The AI should not restart architectural discussions that have already been resolved unless there is a concrete reason to revisit them.

---

# 42. Decision Change Protocol

If an existing decision needs to change:

```text
Current Decision
      ↓
Problem / New Requirement
      ↓
Alternatives
      ↓
Evaluation
      ↓
New Decision
      ↓
Update memory.md
      ↓
Update affected documents
      ↓
Update implementation
```

Never silently replace an established decision.

---

# 43. Important "Do Not Assume" Rules

A future AI must not assume that ShardFlow automatically supports:

```text
automatic failover
automatic migration
automatic rebalancing
cross-shard transactions
arbitrary MongoDB commands
arbitrary MongoDB operators
Redis
Kubernetes
multi-region deployment
distributed transactions
```

These require explicit decisions.

---

# 44. Important "Do Not Break" Boundaries

The following boundaries are fundamental to V1:

```text
Supabase
    → authentication

ShardFlow MongoDB
    → infrastructure metadata

Customer MongoDB
    → customer application data

API Key
    → data-plane authentication

Tenant ID
    → routing identity

Tenant-Shard Mapping
    → deterministic routing

Connection Manager
    → MongoDB connection lifecycle

Brevo
    → transactional email
```

---

# 45. Current Open Decisions

The following items may require explicit decisions during implementation:

```text
1. Exact secret-storage implementation.
2. Exact health-check interval.
3. Health event retention period.
4. Exact frontend technology/configuration.
5. Exact deployment architecture.
6. Exact rate-limiting configuration.
7. Exact API request/response details where not yet finalized.
8. Exact notification trigger policy.
9. Exact connection-pool configuration.
10. Exact data-plane authentication header naming if changed from the current contract.
```

When any of these are finalized, update this document.

---

# 46. Current Known Decisions Summary

| Area                     | Decision                                |
| ------------------------ | --------------------------------------- |
| Product                  | ShardFlow database infrastructure layer |
| Metadata DB              | MongoDB                                 |
| Customer DB              | MongoDB                                 |
| Authentication           | Supabase Auth                           |
| Email                    | Brevo                                   |
| Data-plane auth          | API keys                                |
| Routing                  | Tenant-based                            |
| Routing mapping          | `tenantId → shardId`                    |
| V1 representation        | Option A                                |
| Operations               | Explicit supported MongoDB operations   |
| Operators                | Explicitly permitted                    |
| Connection management    | Reusable connection pools               |
| Cross-shard transactions | Not supported                           |
| Automatic migration      | Not supported                           |
| Automatic rebalancing    | Not supported                           |
| Redis                    | Not required                            |
| Kubernetes               | Not required                            |
| Customer data            | Remains in customer MongoDB             |
| ShardFlow DB             | Infrastructure metadata only            |
| Project isolation        | Required                                |
| Tenant isolation         | Required                                |
| Error format             | Centralized contract                    |
| Documentation            | Separate focused `.md` files            |

---

# 47. Historical Decision Log

## Decision 001 — ShardFlow is not a database replacement

**Decision:** ShardFlow acts as an infrastructure/routing layer rather than replacing MongoDB.

**Reason:** The purpose is to simplify management and routing across multiple databases while allowing MongoDB to remain the actual data store.

---

## Decision 002 — MongoDB remains the primary database technology

**Decision:** MongoDB is used for both ShardFlow metadata and customer shards.

**Reason:** ShardFlow's core problem is specifically centered around MongoDB database routing and management.

---

## Decision 003 — Supabase Auth

**Decision:** Supabase handles user authentication.

**Reason:** Avoid building and maintaining custom authentication infrastructure for V1.

---

## Decision 004 — Brevo for email

**Decision:** Brevo handles transactional email.

**Reason:** Keep email delivery externalized and avoid building an email delivery system.

---

## Decision 005 — Tenant-based routing

**Decision:** V1 routes tenants deterministically through a tenant-to-shard mapping.

**Reason:** It provides a clear and understandable routing model for the first version.

---

## Decision 006 — Explicit database operations

**Decision:** ShardFlow exposes defined MongoDB operations rather than arbitrary database commands.

**Reason:** Security, predictability, validation, and abstraction.

---

## Decision 007 — Separate metadata and customer data

**Decision:** ShardFlow's database stores infrastructure metadata; customer databases store application data.

**Reason:** Clear ownership and data-boundary separation.

---

## Decision 008 — V1 avoids premature distributed-system complexity

**Decision:** Redis, Kubernetes, automatic rebalancing, automatic migration, and cross-shard transactions are not required for V1.

**Reason:** V1 should establish a correct and understandable foundation first.

---

# 48. How This File Must Evolve

Update `memory.md` whenever a meaningful decision is finalized.

Examples:

```text
Technology selected
Architecture changed
API behavior finalized
Database model changed
Security decision made
Major scope decision made
Alternative rejected
Important implementation constraint discovered
```

Do not update it for every small code change.

The goal is to preserve **project intelligence**, not every development event.

---

# 49. Memory Maintenance Rule

When updating this file:

1. Keep old important decisions.
2. Mark superseded decisions clearly.
3. Record the new decision.
4. Explain why the decision changed.
5. Update affected documentation.
6. Avoid rewriting unrelated sections.

Example:

```text
Previous:
Redis required for routing cache.

Status:
SUPERSEDED.

New:
Redis is not required for V1.

Reason:
Routing correctness can be implemented directly with MongoDB metadata and connection management at the current scale.
```

---

# 50. Current Project State

At the time of this document version:

```text
Product definition
        ↓
Documented

Architecture
        ↓
Defined for V1

Database design
        ↓
Defined

API direction
        ↓
Defined

Error contract
        ↓
Defined / being finalized

Engineering rules
        ↓
Defined

Implementation
        ↓
Next phase
```

The project should now move from **planning/documentation** toward **incremental implementation**.

---

# 51. Final Context for Future AI

If you are an AI continuing ShardFlow, remember:

ShardFlow is not being built as a generic CRUD API.

It is being built as an infrastructure layer between applications and multiple MongoDB databases.

The core V1 problem is:

```text
Application
     ↓
ShardFlow
     ↓
Determine correct tenant
     ↓
Determine correct shard
     ↓
Manage connection
     ↓
Validate operation
     ↓
Execute against customer MongoDB
     ↓
Return controlled response
```

The control plane manages the infrastructure required to make this possible.

The system must remain:

```text
deterministic
secure
explicit
observable
maintainable
```

Do not introduce complexity merely because it may be useful at scale.

Build the smallest correct version first.

---

# 52. Memory Status

**This document is continuously maintained.**

Any significant architectural, API, database, security, technology, or scope decision made after this version should be added to the appropriate section of `memory.md`.
