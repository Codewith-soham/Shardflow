# ShardFlow V1 — Development Phases

## 1. Purpose

This document defines the implementation roadmap for ShardFlow V1.

It divides development into phases, tasks, and subtasks so that the system can be built incrementally and reviewed at every stage.

This document is an execution roadmap. It does not replace the PRD, architecture document, database design, API specification, or other technical documentation.

---

# 2. Development Workflow

Every phase follows this workflow:

```text
Phase
  ↓
Task
  ↓
Subtask
  ↓
Discussion
  ↓
Requirements finalized
  ↓
Implementation prompt
  ↓
Implementation
  ↓
Testing
  ↓
Code review
  ↓
Documentation update
  ↓
Git commit
  ↓
Next subtask
```

No phase should be considered complete until its required tasks and acceptance criteria are satisfied.

---

# 3. AI-Assisted Development Workflow

AI tools are used as implementation and development assistants, not as the source of architectural decisions.

Architecture and requirements are finalized before implementation prompts are created.

### Primary responsibilities

**Project planning and technical decisions**

* Human + technical discussion
* Architecture decisions
* Requirements
* Scope control
* Review

**Implementation**

* Antigravity
* OpenCode
* Cursor

The specific tool used can change depending on the task.

### AI implementation rules

AI-generated changes must:

* follow the existing architecture
* follow documented API and error rules
* avoid unrelated changes
* avoid introducing unnecessary dependencies
* include appropriate tests
* explain assumptions when necessary
* be reviewed before being accepted

---

# 4. Phase Status

Status values:

* `PLANNED`
* `IN PROGRESS`
* `BLOCKED`
* `COMPLETED`

---

# 5. Phase 0 — Project Foundation

**Status:** `COMPLETED`

### Objective

Establish the backend development foundation and project conventions before implementing business functionality.

### Tasks

* [x] 0.1 Backend project initialization
* [x] 0.2 TypeScript configuration
* [x] 0.3 Fastify application foundation
* [x] 0.4 Environment/configuration management
* [x] 0.5 Control-plane MongoDB connection
* [x] 0.6 Error infrastructure
* [x] 0.7 Validation infrastructure
* [x] 0.8 Logging foundation
* [x] 0.9 Testing foundation
* [x] 0.10 Development scripts and tooling

### Exit Criteria

* Backend starts successfully.
* Environment configuration works.
* Control-plane database connection works.
* Base error handling is established.
* Testing infrastructure works.
* Project structure follows the documented architecture.
* No business-domain functionality is implemented prematurely.

---

# 6. Phase 1 — Control Plane Foundation

**Status:** `COMPLETED`

### Objective

Implement the core control-plane data models and persistence layer.

### Tasks

* [x] 1.1 User model
* [x] 1.2 User repository
* [x] 1.3 Project model
* [x] 1.4 Project repository
* [x] 1.5 API key model
* [x] 1.6 API key repository
* [x] 1.7 Repository testing

### Exit Criteria

* Core control-plane entities exist.
* Database schemas match `database-design.md`.
* Repository layer follows the defined architecture.
* Persistence tests pass.

---

# 7. Phase 2 — Authentication & Project Management

**Status:** `COMPLETED`

### Objective

Allow users to authenticate, create projects, and manage project API credentials.

### Tasks

* [x] 2.1 Supabase authentication integration
* [x] 2.2 Authentication middleware
* [x] 2.3 User synchronization
* [x] 2.4 Current-user endpoint
* [x] 2.5 Project creation
* [x] 2.6 Project retrieval
* [x] 2.7 Project management
* [x] 2.8 API key generation
* [x] 2.9 API key management
* [x] 2.10 Authentication and project tests

### Exit Criteria

A user can:

```text
Authenticate
    ↓
Create project
    ↓
Manage project
    ↓
Generate API key
```

The API key can authenticate requests to the appropriate project.

---

# 8. Phase 3 — Shard Management

**Status:** `COMPLETED`

### Objective

Allow project administrators to register and manage database shards.

### Tasks

* [x] 3.1 Shard model (status/health enums, AES-256-GCM credential encryption, Zod schemas)
* [x] 3.2 Shard repository (CRUD, health update, active-shard query)
* [x] 3.3 Connection manager (per-shard MongoDB connection pooling, lazy creation, isolated failure domains)
* [x] 3.4 Shard registration (`POST /api/v1/projects/:projectId/shards`)
* [x] 3.5 Shard retrieval (`GET /api/v1/projects/:projectId/shards`, `GET .../shards/:shardId`)
* [x] 3.6 Shard update (`PATCH /api/v1/projects/:projectId/shards/:shardId`)
* [x] 3.7 Shard lifecycle management (`DELETE /api/v1/projects/:projectId/shards/:shardId`)
* [x] 3.8 Initial connection validation (ping on registration — marks HEALTHY or UNHEALTHY)
* [x] 3.9 Shard management tests (14 tests — auth, CRUD, credential security, health simulation)

### Exit Criteria

A project can:

```text
Register shard
    ↓
Validate connection
    ↓
Store shard configuration
    ↓
Manage shard lifecycle
```

Shard credentials must be handled securely.

---

# 9. Phase 4 — Data Plane Core

**Status:** `COMPLETED`

### Objective

Implement the core request-processing path used by customer applications.

### Tasks

* [x] 4.1 Data-plane API foundation
* [x] 4.2 API-key authentication
* [x] 4.3 Project resolution
* [x] 4.4 Request validation
* [x] 4.5 Operation representation
* [x] 4.6 Database operation abstraction
* [x] 4.7 Database executor
* [x] 4.8 Response handling
* [x] 4.9 Data-plane tests

### Exit Criteria

A valid client request can:

```text
Client
  ↓
Data Plane
  ↓
Authenticate
  ↓
Validate
  ↓
Resolve project
  ↓
Execute operation
  ↓
Return response
```

Routing intelligence will be added in the following phase.

---

# 10. Phase 5 — Routing & Metadata

**Status:** `COMPLETED`

### Objective

Implement ShardFlow's core data-routing mechanism.

### Tasks

* [x] 5.1 Routing abstraction
* [x] 5.2 Shard selection
* [x] 5.3 Metadata model
* [x] 5.4 Metadata repository
* [x] 5.5 Write routing
* [x] 5.6 Read routing
* [x] 5.7 Metadata consistency handling
* [x] 5.8 Routing edge cases
* [x] 5.9 Routing tests

### Exit Criteria

ShardFlow can determine where data should be written and subsequently locate that data for reads according to the V1 routing strategy.

---

# 11. Phase 6 — Health Monitoring & Failure Handling

**Status:** `COMPLETED`

### Objective

Monitor registered shards and handle basic shard availability failures.

### Tasks

* [x] 6.1 Health-check abstraction
* [x] 6.2 Shard health checker
* [x] 6.3 Health state management
* [x] 6.4 Failure detection
* [x] 6.5 Recovery detection
* [x] 6.6 Routing interaction with unhealthy shards
* [x] 6.7 Notification mechanism
* [x] 6.8 Health monitoring tests

### Exit Criteria

ShardFlow can:

```text
Monitor shard
    ↓
Detect failure
    ↓
Update health state
    ↓
Prevent inappropriate routing
    ↓
Detect recovery
    ↓
Restore normal operation
```

Only V1-supported failure handling should be implemented.

---

# 12. Phase 7 — Frontend Dashboard

**Status:** `PLANNED`

### Objective

Build the administrative dashboard for managing ShardFlow projects and infrastructure.

### Tasks

* [ ] 7.1 Frontend foundation
* [ ] 7.2 Supabase authentication
* [ ] 7.3 Application shell
* [ ] 7.4 Dashboard overview
* [ ] 7.5 Project management
* [ ] 7.6 API key management
* [ ] 7.7 Shard management
* [ ] 7.8 Shard health view
* [ ] 7.9 Error and loading states
* [ ] 7.10 Frontend integration testing

### Exit Criteria

An administrator can use the dashboard to:

```text
Authenticate
    ↓
Manage project
    ↓
Manage API keys
    ↓
Register/manage shards
    ↓
View shard health
```

The frontend must consume the implemented backend APIs rather than using duplicated business logic.

---

# 13. Phase 8 — Integration, Security & Testing

**Status:** `PLANNED`

### Objective

Validate the complete V1 system and harden it before deployment.

### Tasks

* [ ] 8.1 End-to-end API testing
* [ ] 8.2 Control-plane integration testing
* [ ] 8.3 Data-plane integration testing
* [ ] 8.4 Routing tests
* [ ] 8.5 Failure scenario testing
* [ ] 8.6 Authentication security review
* [ ] 8.7 API-key security review
* [ ] 8.8 Database credential security review
* [ ] 8.9 Request validation review
* [ ] 8.10 Rate limiting review
* [ ] 8.11 Logging and sensitive-data review
* [ ] 8.12 Error contract verification
* [ ] 8.13 Performance baseline

### Exit Criteria

The V1 system behaves correctly under expected success and failure scenarios and satisfies the documented security and API contracts.

---

# 14. Phase 9 — Deployment & V1 Release

**Status:** `PLANNED`

### Objective

Deploy ShardFlow and validate the production environment.

### Tasks

* [ ] 9.1 Production environment configuration
* [ ] 9.2 Control-plane database configuration
* [ ] 9.3 Supabase production configuration
* [ ] 9.4 Backend deployment
* [ ] 9.5 Frontend deployment
* [ ] 9.6 Production environment variables
* [ ] 9.7 Production smoke tests
* [ ] 9.8 Monitoring verification
* [ ] 9.9 Documentation verification
* [ ] 9.10 V1 release

### Exit Criteria

ShardFlow V1 is deployed, accessible, and validated through production smoke tests.

---

# 15. Documentation Synchronization

Implementation must remain synchronized with the project documentation.

Relevant documentation should be updated when an implementation decision changes or clarifies the documented system.

Primary documents:

```text
docs/
├── prd.md
├── architecture.md
├── database-design.md
├── api.md
├── api-rules.md
├── error-codes.md
├── research.md
└── phases.md
```

New engineering decisions should be documented when they materially affect the architecture or implementation.

---

# 16. Phase Completion Rule

A phase is complete only when:

* all required tasks are complete
* acceptance criteria are satisfied
* relevant tests pass
* implementation has been reviewed
* required documentation is updated
* changes are committed to Git
* no known blocking issue remains

A phase should not be marked complete merely because the code compiles.

---

# 17. Current Progress

## Completed Planning

* [x] Product research
* [x] PRD
* [x] Architecture planning
* [x] Database design
* [x] API specification
* [x] API rules
* [x] Error codes
* [x] Development phases

## Completed Phases
* [x] Phase 0 — Project Foundation
* [x] Phase 1 — Control Plane Foundation
* [x] Phase 2 — Authentication & Project Management
* [x] Phase 3 — Shard Management
* [x] Phase 4 — Data Plane Core
* [x] Phase 5 — Routing & Metadata

## Current Phase

**Phase 6 — Health Monitoring & Failure Handling**

**Current Task:** 6.1 Health-check abstraction

**Status:** `PLANNED`
