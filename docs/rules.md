# ShardFlow — Engineering Rules

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-09-21

---

## 1. Purpose

This document defines the engineering rules that must be followed while building ShardFlow.

These rules exist to keep the project:

- understandable;
- maintainable;
- consistent;
- secure;
- testable;
- aligned with the V1 architecture.

These rules apply to both humans and AI agents working on the project.

---

## 2. Core Principle

The primary goal of V1 is to prove:

> An application can delegate MongoDB shard connectivity and routing to ShardFlow while ShardFlow manages the complexity of multiple databases behind a single application-facing interface.

Every implementation decision should support this goal.

If a feature does not contribute to the V1 objective, it should be questioned before implementation.

---

## 3. V1 Scope Rule

Do not implement future architecture prematurely.

The following are currently outside V1:

```text
Redis
Kafka
Kubernetes
Microservices
Multiple database engines
MongoDB wire-protocol proxy
Automatic shard rebalancing
Automatic data migration
Cross-shard transactions
Multi-region infrastructure
Advanced distributed consensus
```

These technologies/features may be introduced later if a concrete requirement justifies them.

---

## 4. Architecture Rules

### Rule 4.1 — Control Plane and Data Plane Must Remain Conceptually Separate

The control plane is responsible for:

- Users
- Projects
- API Keys
- Shard Configuration
- Routing Metadata
- Health Metadata

The data plane is responsible for:

- Request Authentication
- Tenant Resolution
- Shard Resolution
- Connection Management
- Database Operations
- Response Handling

The two responsibilities must not become mixed arbitrarily.

### Rule 4.2 — V1 Does Not Require Microservices

- The control plane and data plane may exist inside the same backend deployment.
- Logical separation is required.
- Physical service separation is not required for V1.

### Rule 4.3 — Avoid Premature Abstraction

Do not create abstractions only because they might be useful in the future.
Create abstractions when:

- there is a real repeated responsibility;
- there is a clear boundary;
- testing benefits from the abstraction;
- the abstraction represents an actual domain concept.

---

## 5. Backend Architecture Rules

### Rule 5.1 — TypeScript

Backend code must use TypeScript.
Avoid introducing JavaScript files into the backend unless there is a specific technical reason.

### Rule 5.2 — Clear Layer Boundaries

Backend code should maintain clear boundaries between:

```text
Routes / HTTP
      |
      v
Controllers / Request Handling
      |
      v
Services / Business Logic
      |
      v
Repositories / Data Access
      |
      v
Database
```

The exact folder structure may evolve, but responsibilities must remain separated.

### Rule 5.3 — Business Logic Must Not Live in Routes

Routes should primarily define:

- HTTP method;
- path;
- validation;
- authentication requirements;
- handler/controller mapping.

Business logic belongs in services.

### Rule 5.4 — Database Access Must Be Centralized

Application code should not create arbitrary MongoDB queries throughout the project.
Database access should go through clearly defined data-access/repository modules.

---

## 6. Data Plane Rules

### Rule 6.1 — Explicit Routing

V1 routing is based on:

```text
tenantId -> shardId
```

Routing decisions must be deterministic and explainable.

### Rule 6.2 — No Direct Application-to-Shard Management

The application's responsibility should not be to manage multiple ShardFlow shard connections.
Conceptually:

```text
Application
     |
     v
 ShardFlow
     |
     +----> Shard A
     +----> Shard B
     +----> Shard C
```

### Rule 6.3 — Reuse Connections

Never create a new MongoDB connection for every request.
Connections must be managed and reused.

### Rule 6.4 — Shard Failures Must Be Explicit

The data plane must distinguish between:

- invalid routing;
- authentication failure;
- shard unavailable;
- connection failure;
- database operation failure;
- invalid client request.

Do not collapse every failure into a generic error.

---

## 7. Database Rules

### Rule 7.1 — MongoDB Native Driver

Use the MongoDB native driver.
Do not introduce Mongoose or another ODM unless the architecture is explicitly changed and the decision is documented.

### Rule 7.2 — Control-Plane Data vs Customer Data

Never treat the ShardFlow control-plane database as the customer's primary database.

**Control plane:**
- Users
- Projects
- API Keys
- Shard Metadata
- Routing Metadata
- Health Metadata

**Customer shards:**
- Customer Application Data

### Rule 7.3 — Sensitive Database Credentials

MongoDB connection strings are sensitive.
They must never be:

- logged;
- exposed to the frontend;
- returned in ordinary API responses;
- committed to Git;
- included in error messages.

### Rule 7.4 — Minimal Schema

Do not create collections or fields without a concrete reason.
Every new persistent entity should answer:

- Why does it exist?
- Which feature requires it?
- What queries will use it?
- What indexes are required?
- What is its lifecycle?

---

## 8. Authentication and Security Rules

### Rule 8.1 — Password Security

Passwords must never be stored in plaintext.
Use a strong password hashing algorithm.

### Rule 8.2 — API Key Security

Raw API keys should not be permanently stored.
Store a secure hash.
The raw key should normally be displayed only during creation.

### Rule 8.3 — Secrets

Secrets must come from environment/configuration management.
Never hard-code:

- passwords
- API keys
- database credentials
- JWT secrets
- encryption keys

### Rule 8.4 — Logging

Logs must never contain:

- passwords;
- raw API keys;
- MongoDB connection strings;
- authentication tokens;
- sensitive customer data.

---

## 9. API Rules

### Rule 9.1 — Consistent API Structure

All APIs should follow a consistent response structure.
The exact response contract will be defined in `api.md`.

### Rule 9.2 — Validate Input

External input must be validated before reaching business logic.
Use Zod for request validation where appropriate.

### Rule 9.3 — HTTP Semantics

Use appropriate HTTP status codes.
Do not return 200 OK for every situation.

### Rule 9.4 — Errors Must Be Standardized

Errors should use stable machine-readable error codes.
Human-readable messages may change.
Error codes should not change casually because clients may depend on them.

---

## 10. Frontend Rules

### Rule 10.1 — Frontend Consumes APIs

The frontend should not contain backend business logic.
The dashboard consumes documented backend APIs.

### Rule 10.2 — Do Not Expose Secrets

The frontend must never receive:

- MongoDB connection strings;
- database passwords;
- internal credentials;
- raw stored API keys except during an intentional one-time creation response.

### Rule 10.3 — Backend First

The frontend should not drive the architecture.
Define backend contracts and core data-plane behavior first.
Frontend implementation should consume stable enough contracts.

---

## 11. Testing Rules

Every meaningful business capability should have tests.
At minimum, test:

- Authentication
- Project authorization
- API key validation
- Shard registration
- Routing
- Shard selection
- Connection management
- Health checks
- Failure handling

---

## 12. Failure Testing

Failure scenarios are especially important because ShardFlow is infrastructure software.
Testing should include:

- Shard unavailable
- Connection timeout
- Invalid connection string
- Invalid API key
- Unknown tenant
- Missing routing metadata
- Inactive shard
- Database operation failure

A feature is not considered complete if only the happy path works.

---

## 13. Documentation Rules

Documentation must reflect the actual implementation.
If implementation changes an architectural decision:

- Update `memory.md`.
- Update the relevant architecture/database/API document.
- Update `task.md`.

Do not allow documentation and implementation to silently diverge.

---

## 14. Memory Rules

`memory.md` is the project's persistent engineering context.
Update it when:

- an architectural decision is made;
- a major technology decision changes;
- a V1 assumption is changed;
- a major implementation direction changes;
- a previously accepted decision is reversed;
- a significant constraint is discovered.

Do not use `memory.md` as a daily todo list.
That belongs in `task.md`.

---

## 15. Task Rules

`task.md` is the current execution tracker.
When starting work:
- `[ ]` -> `[-]`

When completed and tested:
- `[-]` -> `[x]`

When blocked:
- `[ ]` -> `[~]`

A task should not be marked complete merely because code was written.

---

## 16. AI Development Rules

Any AI working on ShardFlow must first understand:

- `memory.md`
- `prd.md`
- `architecture.md`
- `database.md`
- `rules.md`
- `task.md`

Before changing architecture, the AI must check whether an existing decision already addresses the problem.

The AI must not:

- invent requirements;
- silently change V1 scope;
- introduce unnecessary technologies;
- rewrite architecture without justification;
- duplicate existing functionality;
- ignore existing conventions;
- expose secrets;
- mark untested work as complete.

---

## 17. Change Decision Rule

When a new requirement conflicts with an existing decision:

```text
Existing Decision
       |
       v
New Requirement
       |
       v
Conflict?
   /       \
 No         Yes
 |           |
Implement    Review decision
             |
             v
       Update memory.md
             |
             v
       Update architecture
             |
             v
          Implement
```

Never silently override an accepted architectural decision.

---

## 18. Simplicity Rule

Prefer the simplest architecture that correctly solves the V1 problem.
Do not add:

- Redis
- queues
- microservices
- caches
- workers
- service meshes
- Kubernetes

unless a concrete requirement demonstrates the need.
Complexity must be justified.

---

## 19. Learning Rule

ShardFlow is also being built as a backend/system-design learning project.
Before implementing a major component, understand:

- What problem it solves.
- Why it is needed.
- How it works internally.
- What alternatives exist.
- Why the chosen approach is appropriate for V1.

AI-generated implementation should not replace understanding.

---

## 20. Definition of Done

A feature is considered done when:

- the implementation exists;
- the implementation follows the architecture;
- input validation exists where required;
- errors are handled;
- relevant tests exist;
- security implications have been considered;
- documentation is updated if necessary;
- `task.md` is updated;
- `memory.md` is updated if a meaningful decision was made.

---

## 21. Final Engineering Principle

Build the smallest system that proves the core idea, understand every major component, and add complexity only when the system gives us a concrete reason to do so.