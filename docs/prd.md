# ShardFlow V1 — Product Requirements Document

**Document:** Product Requirements Document
**Product:** ShardFlow
**Version:** V1.0
**Status:** Draft for implementation
**Last Updated:** 2026-09-21

---

# 1. Product Overview

ShardFlow is a database infrastructure layer for multi-tenant applications that operate across multiple MongoDB databases (shards).

ShardFlow provides:

* a centralized control plane for managing database shards;
* an application-facing data plane for routing requests to the correct shard;
* centralized database connection management;
* tenant-aware request routing;
* shard health monitoring;
* operational notifications.

The customer's application data remains in the customer's MongoDB databases.

ShardFlow stores and manages the infrastructure metadata required to route and operate against those databases.

### Core concept

```text
Application
     |
     v
  ShardFlow
     |
  +--+--+--+
  |  |  |  |
 DB1 DB2 DB3
```

The application should not need to directly manage the complete shard topology or individual connections to every customer-owned database.

---

# 2. Problem Statement

As a multi-tenant SaaS application grows, a single database may eventually become insufficient for its workload, capacity, or operational requirements.

The engineering team may introduce multiple database instances:

```text
DB 1
DB 2
DB 3
```

This creates additional infrastructure responsibilities inside the application:

* Maintaining multiple database connections
* Determining where tenant data is stored
* Routing requests to the correct database
* Maintaining tenant-to-shard mappings
* Monitoring database health
* Detecting shard failures
* Managing database configuration
* Handling operational metadata

If these responsibilities are implemented directly in the application, database infrastructure concerns become coupled with application/business logic.

ShardFlow provides a dedicated infrastructure layer for these responsibilities.

---

# 3. Product Vision

> **Keep your databases where they are. Let ShardFlow manage how your application interacts with them.**

ShardFlow should make operating a multi-shard MongoDB architecture easier without requiring the application to own the entire shard-management infrastructure.

---

# 4. Product Thesis

> **ShardFlow is a database infrastructure layer for multi-tenant applications that need to operate across multiple MongoDB shards. It provides a centralized control plane for managing shards and a data plane for authenticated, tenant-aware request routing, connection management, controlled database operations, and shard health monitoring. Application data remains in the customer's databases while ShardFlow manages the infrastructure required to interact with those databases.**

This thesis is the foundation of V1 and should be validated through implementation and testing.

---

# 5. Target Users

## 5.1 Primary Target User

Small engineering teams and backend developers building multi-tenant SaaS applications using MongoDB.

Typical characteristics:

* SaaS application
* Multiple tenants/customers
* MongoDB backend
* Growing data or traffic
* Multiple MongoDB databases
* Small or medium engineering team
* Need for centralized shard management

---

## 5.2 Project Administrator

Responsible for:

* Creating projects
* Managing API keys
* Registering database shards
* Configuring routing
* Monitoring shard health
* Receiving operational notifications

---

## 5.3 Application Developer

Responsible for:

* Integrating ShardFlow
* Providing tenant/routing context
* Sending database operations through the ShardFlow data plane
* Handling ShardFlow API responses and errors

The application developer should not need to hard-code or independently manage every shard connection.

---

# 6. Target Use Case

The primary V1 use case is a multi-tenant SaaS application with multiple MongoDB shards.

Example:

```text
SaaS Application
1,000 tenants
3 MongoDB shards
```

Example tenant placement:

```text
tenant_001 -> shard_1
tenant_002 -> shard_1
tenant_003 -> shard_2
tenant_004 -> shard_3
```

A request containing:

```text
tenantId = tenant_003
```

should be resolved to:

```text
tenant_003 -> shard_2
```

and routed to that shard.

---

# 7. Goals

## 7.1 Primary Goals

ShardFlow V1 must:

1. Allow users to create ShardFlow projects.
2. Allow project administrators to generate API keys.
3. Allow administrators to register multiple MongoDB shards.
4. Allow administrators to configure tenant-aware routing.
5. Maintain tenant-to-shard mappings.
6. Authenticate application requests.
7. Route requests to the correct MongoDB shard.
8. Manage reusable database connections.
9. Monitor shard health.
10. Detect unhealthy shards.
11. Display shard status through a dashboard.
12. Notify administrators about important shard health events.
13. Provide a controlled application-facing MongoDB API.
14. Prevent unsupported or unsafe MongoDB operations from reaching customer databases.

---

## 7.2 Engineering Goals

V1 should also demonstrate:

* Deterministic shard routing
* Connection-pool management
* Health monitoring
* Failure detection
* Clear control-plane/data-plane separation
* Secure handling of database credentials
* Secure API-key handling
* Structured observability
* Testable distributed-system boundaries
* Controlled MongoDB operation validation

---

# 8. Non-Goals

The following are explicitly outside the scope of V1.

## 8.1 Multiple Database Engines

V1 supports:

> MongoDB only.

PostgreSQL, MySQL, Redis, and other databases are future considerations.

---

## 8.2 Automatic Data Migration

V1 will not automatically move data between shards.

Example:

```text
shard_1 -> shard_2
```

is out of scope.

---

## 8.3 Automatic Rebalancing

V1 will not automatically redistribute tenants or data based on capacity.

For example:

```text
shard_1 = 80%
shard_2 = 20%
```

will not automatically become:

```text
shard_1 = 50%
shard_2 = 50%
```

---

## 8.4 Distributed Transactions

Transactions spanning multiple shards are out of scope.

---

## 8.5 Cross-Shard Joins

V1 will not provide operations that require joining data across multiple shards.

---

## 8.6 Database Wire-Protocol Compatibility

V1 will not attempt to behave as a transparent MongoDB-compatible wire-protocol proxy.

A future version may investigate this.

---

## 8.7 Database Hosting

ShardFlow will not host customer databases.

Customers continue to own and operate their MongoDB infrastructure.

---

## 8.8 Kubernetes / Microservices

V1 will not require Kubernetes or a microservice architecture.

The initial backend can be deployed as one application with clear logical separation between control-plane and data-plane components.

---

## 8.9 Full MongoDB API Compatibility

V1 will not attempt to expose every MongoDB operation, operator, or database command.

Only explicitly supported operations and operators defined by the V1 API contract are allowed.

---

## 8.10 Cross-Tenant Operations

A data-plane request cannot operate across multiple tenants.

Each request is scoped to one `tenantId`.

---

# 9. Product Architecture

ShardFlow consists of two logical components:

```text
                  ShardFlow
                      |
           +----------+----------+
           |                     |
           v                     v
     Control Plane          Data Plane
           |                     |
           v                     v
    Metadata Database     Customer Shards
```

---

## 9.1 Control Plane

The control plane manages ShardFlow configuration and infrastructure metadata.

Responsibilities:

* User authentication
* Project management
* API key management
* Shard registration
* Shard configuration
* Routing configuration
* Tenant-shard mappings
* Health status
* Operational events
* Notifications
* Dashboard APIs

The control plane does not store customer application data.

### Authentication provider

V1 uses **Supabase Auth** for user authentication.

Supabase is responsible for:

* user identity;
* authentication;
* authentication sessions/tokens;
* credential handling.

ShardFlow MongoDB stores the ShardFlow-specific user record and references the user's Supabase identity.

ShardFlow must not store user passwords.

---

## 9.2 Data Plane

The data plane handles application database traffic.

Responsibilities:

1. Authenticate the application request using a ShardFlow API key.
2. Validate the request.
3. Extract the tenant/routing key.
4. Resolve the tenant to a shard.
5. Verify shard availability.
6. Validate the requested database operation.
7. Validate permitted MongoDB operators/options.
8. Acquire a reusable database connection.
9. Execute the requested operation.
10. Return the normalized result.
11. Record relevant operational metrics/logs.

Conceptually:

```text
Application
     |
     | API Key
     | tenantId
     v
Authenticate
     |
     v
Validate Request
     |
     v
Extract tenantId
     |
     v
Resolve tenant -> shard
     |
     v
Validate Operation
     |
     v
Validate Operators / Options
     |
     v
Get Connection
     |
     v
Execute Operation
     |
     v
Return Response
```

---

# 10. Core Routing Model

## 10.1 Routing Strategy

V1 uses:

> **Deterministic tenant-aware routing.**

The primary routing key is:

```text
tenantId
```

Example:

```text
tenant_A -> shard_1
tenant_B -> shard_1
tenant_C -> shard_2
tenant_D -> shard_3
```

---

## 10.2 Why Not Capacity-Based Routing?

ShardFlow must not simply route a request to the shard with the most available capacity.

Example:

```text
shard_1 = 70%
shard_2 = 40%
shard_3 = 20%
```

The lowest-utilization shard is not necessarily the correct shard for a tenant's data.

Data placement must determine routing.

Therefore:

> **Routing correctness takes priority over capacity-based distribution.**

---

# 11. User Journey

## Step 1 — Create Account

A developer creates a ShardFlow account using the authentication system.

```text
Developer
    |
    v
Supabase Auth
    |
    v
ShardFlow User
```

---

## Step 2 — Create Project

Example:

```text
Project: my-saas
```

---

## Step 3 — Generate API Key

The administrator generates an API key for application integration.

```text
SHARDFLOW_API_KEY=...
```

The raw key is shown only during intentional creation.

---

## Step 4 — Register Shards

Example:

```text
Shard 1
MongoDB connection

Shard 2
MongoDB connection

Shard 3
MongoDB connection
```

Shard credentials are stored securely and are never returned through normal API responses.

---

## Step 5 — Configure Routing

Example:

```text
Routing Strategy: tenant
Routing Key: tenantId
```

---

## Step 6 — Create Tenant Mappings

Example:

```text
tenant_001 -> shard_1
tenant_002 -> shard_1
tenant_003 -> shard_2
```

---

## Step 7 — Integrate Application

The application uses the ShardFlow data-plane API and API key.

Example:

```text
X-API-Key: <shardflow-api-key>
```

---

## Step 8 — Send Database Requests

Example:

```text
Application
    |
    | tenantId = tenant_003
    v
ShardFlow
    |
    v
shard_2
```

---

## Step 9 — Monitor

The administrator views:

```text
Shard 1    HEALTHY
Shard 2    HEALTHY
Shard 3    DEGRADED
```

---

## Step 10 — Failure

If a shard becomes unavailable:

```text
Health Check
     |
     v
Shard unhealthy
     |
     +--> Update status
     +--> Record event
     +--> Notify administrator
     +--> Prevent unsafe routing
```

---

# 12. Functional Requirements

## FR-01 — User Authentication

The system must allow users to authenticate with ShardFlow using Supabase Auth.

ShardFlow must:

* verify Supabase authentication tokens;
* resolve the authenticated Supabase user;
* associate the identity with a ShardFlow user record;
* enforce authorization against ShardFlow resources.

ShardFlow must not store user passwords.

---

## FR-02 — Project Management

A user must be able to:

* Create a project
* View their projects
* View project details
* Manage project configuration

A project represents one application/infrastructure environment.

---

## FR-03 — API Key Management

A project administrator must be able to:

* Generate an API key
* View API key metadata
* Revoke an API key
* Create a replacement key

API keys must not be stored in plaintext.

The system should store a secure hash of the key and display the raw key only when it is initially generated.

API keys are project-scoped.

---

## FR-04 — Shard Registration

A project administrator must be able to register a MongoDB shard.

Minimum shard metadata:

```text
id
projectId
name
connection information/reference
status
health status
createdAt
updatedAt
```

Database credentials must be handled securely.

---

## FR-05 — Shard Management

Administrators must be able to:

* View registered shards
* Add shards
* Disable shards
* View shard health
* Remove shards when doing so does not violate routing/data integrity constraints

A shard with active tenant mappings should not be silently deleted.

---

## FR-06 — Routing Configuration

Administrators must be able to configure the project's routing strategy.

V1 supports:

```text
strategy = tenant
routingKey = tenantId
```

---

## FR-07 — Tenant-Shard Mapping

ShardFlow must maintain a mapping between a tenant and its assigned shard.

Example:

```text
tenantId      shardId
---------------------
tenant_001    shard_1
tenant_002    shard_1
tenant_003    shard_2
```

The system must ensure that a tenant has a deterministic shard assignment.

---

## FR-08 — Data Plane Authentication

Every application request to the data plane must authenticate using a valid ShardFlow API key.

Requests with:

* Missing API keys
* Invalid API keys
* Revoked API keys
* Unauthorized project access

must be rejected.

---

## FR-09 — Request Validation

The data plane must validate:

* API key
* Project context
* Tenant/routing key
* Collection
* Operation structure
* Required parameters
* MongoDB operators
* MongoDB options
* Request limits

Malformed or unsupported requests must not reach customer databases.

---

## FR-10 — Request Routing

For a valid request, ShardFlow must:

1. Authenticate the request.
2. Extract the routing key.
3. Resolve the tenant-to-shard mapping.
4. Verify that the shard is available.
5. Validate the requested operation.
6. Acquire a database connection.
7. Execute the requested operation.
8. Return the result.

---

# 13. V1 Data Plane Operations

ShardFlow V1 exposes explicit MongoDB-style operation endpoints.

Supported operations:

```text
find
find-one
insert-one
update-one
delete-one
```

The API representation is:

```text
POST /api/v1/data/find
POST /api/v1/data/find-one
POST /api/v1/data/insert-one
POST /api/v1/data/update-one
POST /api/v1/data/delete-one
```

This is an application-facing API and is not a MongoDB wire-protocol proxy.

---

## FR-11 — Find

The `find` operation must allow an application to retrieve multiple documents from a collection.

Example:

```json
{
  "tenantId": "tenant_123",
  "collection": "users",
  "filter": {
    "status": "active"
  },
  "options": {
    "limit": 20,
    "skip": 0
  }
}
```

---

## FR-12 — Find One

The `find-one` operation must return at most one document.

Example:

```json
{
  "tenantId": "tenant_123",
  "collection": "users",
  "filter": {
    "email": "user@example.com"
  }
}
```

If no document exists, the result must be `null`.

---

## FR-13 — Insert One

The `insert-one` operation must insert a single document.

Example:

```json
{
  "tenantId": "tenant_123",
  "collection": "users",
  "document": {
    "name": "User",
    "status": "active"
  }
}
```

---

## FR-14 — Update One

The `update-one` operation must update a single matching document.

Example:

```json
{
  "tenantId": "tenant_123",
  "collection": "users",
  "filter": {
    "_id": "..."
  },
  "update": {
    "$set": {
      "status": "inactive"
    }
  }
}
```

---

## FR-15 — Delete One

The `delete-one` operation must delete a single matching document.

Example:

```json
{
  "tenantId": "tenant_123",
  "collection": "users",
  "filter": {
    "_id": "..."
  }
}
```

---

# 14. MongoDB Operator Requirements

ShardFlow V1 must use an explicit allowlist for MongoDB operators.

Arbitrary MongoDB operators must not be passed directly from the application to MongoDB.

## 14.1 Allowed Query Operators

V1 supports:

```text
$eq
$ne
$gt
$gte
$lt
$lte
$in
$nin
$exists
```

Logical operators:

```text
$and
$or
$nor
$not
```

---

## 14.2 Disallowed Query Operators

The following are outside the V1 public API contract:

```text
$where
$function
$accumulator
$expr
$regex
$text
$near
$nearSphere
$geoNear
```

Unsupported operators must be rejected before database execution.

---

## 14.3 Allowed Update Operators

V1 supports:

```text
$set
$unset
$inc
$min
$max
$rename
```

Unsupported update operators must be rejected.

---

## 14.4 Query Options

V1 supports controlled query options including:

```text
limit
skip
sort
projection
```

where implemented according to the API contract.

The server must enforce maximum values for resource-intensive options.

---

## 14.5 Query Validation

ShardFlow must validate:

* operator names;
* operator value types;
* nesting depth;
* array sizes;
* filter size;
* update size;
* request size;
* result limits.

Invalid requests must be rejected before reaching MongoDB.

---

# 15. FR-16 — Connection Management

ShardFlow must maintain reusable MongoDB connections/pools for registered shards.

The system must avoid creating a new MongoDB connection for every application request.

The connection manager should:

* Create connections when required
* Reuse existing connections
* Detect connection failures
* Clean up unused connections
* Expose connection health to the data plane

---

# 16. FR-17 — Health Monitoring

ShardFlow must periodically perform health checks against registered shards.

Initial health states:

```text
HEALTHY
DEGRADED
UNHEALTHY
UNKNOWN
```

Health information should include:

```text
status
latency
lastCheckedAt
lastSuccessfulCheckAt
error information
```

---

# 17. FR-18 — Failure Detection

When a shard fails health checks, ShardFlow must:

1. Update the shard's health state.
2. Record a health event.
3. Update the dashboard.
4. Notify the project administrator.
5. Prevent unsafe new routing to the unavailable shard where applicable.

### Important limitation

Failure detection does not automatically mean failover is possible.

If tenant data exists only on the failed shard, ShardFlow must not blindly route that tenant to another shard.

---

# 18. FR-19 — Shard Recovery

When a previously unhealthy shard becomes available again, ShardFlow must:

1. Detect successful health checks.
2. Update the shard status.
3. Record a recovery event.
4. Update the dashboard.
5. Allow routing again according to configured routing rules.

---

# 19. FR-20 — Dashboard

The dashboard must provide a project-level overview.

### Project overview

Display:

* Project name
* Number of shards
* Healthy shards
* Unhealthy shards
* API key status
* Routing strategy

### Shard overview

Display:

* Shard name
* Status
* Health status
* Latency
* Last health check
* Last failure/recovery event

### Routing overview

Display:

* Routing strategy
* Routing key
* Tenant mappings

---

# 20. FR-21 — Notifications

V1 must support operational notifications for:

* Shard became unhealthy
* Shard recovered

V1 uses **Brevo** as the email delivery provider.

Brevo is an infrastructure dependency for email delivery, not an authentication provider.

The application should interact with an internal email service abstraction rather than coupling business logic directly to Brevo.

Conceptually:

```text
ShardFlow
    |
    v
Email Service
    |
    v
Brevo
    |
    v
Administrator Email
```

Email-provider credentials must never be exposed to clients or written to logs.

---

# 21. FR-22 — Audit Events

Important administrative operations should be recorded.

Examples:

* Project created
* API key generated
* API key revoked
* Shard added
* Shard disabled
* Routing configuration changed
* Tenant routing changed

---

# 22. Data Requirements

ShardFlow's metadata database should contain infrastructure metadata only.

Core entities:

```text
User
Project
ApiKey
Shard
RoutingConfig
TenantShardMapping
HealthEvent
AuditLog
```

## User

```text
id
supabaseUserId
email
name
status
createdAt
updatedAt
```

Authentication credentials/passwords are managed by Supabase Auth and are not stored by ShardFlow.

---

## Project

```text
id
ownerId
name
description
createdAt
updatedAt
```

---

## ApiKey

```text
id
projectId
keyHash
name
lastUsedAt
expiresAt
revokedAt
createdAt
```

---

## Shard

```text
id
projectId
name
connectionSecretReference
status
healthStatus
lastHealthCheckAt
lastSuccessfulHealthCheckAt
createdAt
updatedAt
```

---

## RoutingConfig

```text
id
projectId
strategy
routingKey
createdAt
updatedAt
```

Example:

```text
strategy = tenant
routingKey = tenantId
```

---

## TenantShardMapping

```text
id
projectId
tenantId
shardId
createdAt
updatedAt
```

---

## HealthEvent

```text
id
projectId
shardId
status
latency
error
createdAt
```

---

## AuditLog

```text
id
projectId
actorId
action
resourceType
resourceId
metadata
createdAt
```

---

# 23. Data Ownership Boundary

This boundary is critical.

## ShardFlow-owned data

```text
Users
Projects
API keys
Shard configuration
Routing configuration
Tenant-to-shard mappings
Health events
Audit events
Operational metadata
```

## Customer-owned data

```text
Application users
Orders
Products
Messages
Payments
Other application collections
```

ShardFlow should not become the primary database for customer application data.

---

# 24. Data Plane Request Model

V1 exposes an application-facing API rather than implementing MongoDB wire-protocol compatibility.

Conceptually:

```text
Application
     |
     | API Key
     | tenantId
     | operation
     v
ShardFlow Data Plane
     |
     v
Tenant Resolution
     |
     v
Shard Resolution
     |
     v
MongoDB Shard
```

The V1 operation model is explicitly defined.

Supported operations:

```text
find
find-one
insert-one
update-one
delete-one
```

The exact HTTP request/response contract is defined in:

```text
docs/api.md
```

---

# 25. Error Handling Requirements

The API must return structured errors.

At minimum, errors should distinguish:

```text
Authentication failure
Authorization failure
Invalid request
Unsupported operation
Unsupported MongoDB operator
Tenant not found
Routing not found
Shard not found
Shard unhealthy
Database connection failure
Database operation failure
Rate limit exceeded
Internal server error
```

Detailed error codes are defined separately in:

```text
docs/error-contract.md
```

Internal database credentials, connection strings, and sensitive infrastructure details must never be returned to clients.

---

# 26. Security Requirements

Because ShardFlow handles customer database connection information, security is a core requirement.

V1 must:

* Hash API keys before storage.
* Encrypt sensitive database credentials/secrets at rest.
* Use TLS for production traffic.
* Never log database credentials.
* Never return database credentials through APIs.
* Authenticate dashboard users through Supabase Auth.
* Verify Supabase access tokens.
* Authorize users against project ownership/access.
* Scope API keys to projects.
* Support API key revocation.
* Validate all external input.
* Validate MongoDB operators and options.
* Prevent unsupported database operations.
* Protect administrative endpoints.
* Record security-relevant administrative actions.
* Redact secrets from logs.

Future versions should consider:

* Secret rotation
* Key expiration policies
* Role-based access control
* IP allowlists
* Private networking
* Customer-managed secrets

---

# 27. Observability Requirements

ShardFlow must provide structured logging and operational metrics.

Important fields include:

```text
requestId
projectId
shardId
tenantId
operation
status
latency
errorCode
timestamp
```

Sensitive information must not be logged.

The system should allow developers to understand:

> Which shard handled this request and how long did it take?

without exposing secrets.

---

# 28. Non-Functional Requirements

## NFR-01 — Reliability

A failure in one customer shard must not crash the entire ShardFlow backend.

Shard state should be isolated.

---

## NFR-02 — Performance

The routing layer should add minimal overhead.

Connections must be reused through pooling.

Data-plane validation should reject invalid requests before database execution.

---

## NFR-03 — Scalability

The architecture should allow the data plane to scale horizontally in future.

The V1 implementation does not need automatic horizontal scaling.

---

## NFR-04 — Maintainability

The codebase must maintain clear logical boundaries:

```text
Control Plane
Data Plane
Routing
Connection Management
Health Monitoring
Authentication
Metadata Database
Email Service
```

---

## NFR-05 — Testability

Core routing, operator validation, database operations, and failure-handling behavior must be testable without requiring the production environment.

Integration tests should use real MongoDB instances where appropriate.

---

# 29. Technology Constraints

V1 technology decisions:

| Area                   | Technology                      |
| ---------------------- | ------------------------------- |
| Backend language       | TypeScript                      |
| Runtime                | Node.js                         |
| HTTP framework         | Fastify                         |
| Metadata database      | MongoDB                         |
| Customer database      | MongoDB                         |
| MongoDB access         | Official MongoDB Node.js Driver |
| Validation             | Zod                             |
| Logging                | Pino                            |
| Testing                | Vitest                          |
| Integration DB testing | Testcontainers                  |
| Authentication         | Supabase Auth                   |
| Email delivery         | Brevo                           |
| Frontend               | React                           |
| Frontend build         | Vite                            |
| Frontend language      | TypeScript                      |
| Styling                | Tailwind CSS                    |
| API state              | TanStack Query                  |
| Containers             | Docker                          |
| Local orchestration    | Docker Compose                  |
| CI                     | GitHub Actions                  |
| Cache                  | None in V1                      |
| Message broker         | None in V1                      |
| Kubernetes             | None in V1                      |

---

# 30. Repository Structure

The V1 repository uses the existing top-level structure:

```text
shardflow/
|
+-- docs/
|
+-- frontend/
|
+-- backend/
|
+-- README.md
+-- roadmap.md
+-- .gitignore
```

The backend should logically separate the control plane and data plane.

Example:

```text
backend/
└── src/
    ├── config/
    ├── auth/
    ├── control-plane/
    ├── data-plane/
    ├── health/
    ├── database/
    ├── email/
    ├── errors/
    ├── observability/
    ├── utils/
    ├── app.ts
    └── server.ts
```

V1 should not introduce microservices simply for architectural appearance.

The control plane and data plane may run within the same backend deployment while remaining logically separated.

---

# 31. API Surface

The exact API contract is defined separately in:

```text
docs/api.md
```

Initial control-plane areas:

```text
/api/v1/auth
/api/v1/projects
/api/v1/projects/:projectId/api-keys
/api/v1/projects/:projectId/shards
/api/v1/projects/:projectId/routes
/api/v1/projects/:projectId/health
```

The application-facing data-plane API uses:

```text
/api/v1/data
```

Initial operations:

```text
POST /api/v1/data/find
POST /api/v1/data/find-one
POST /api/v1/data/insert-one
POST /api/v1/data/update-one
POST /api/v1/data/delete-one
```

---

# 32. Failure and Recovery Model

V1 distinguishes between:

### Failure detection

```text
Shard unavailable
        |
        v
Mark UNHEALTHY
        |
        v
Notify administrator
```

and:

### Data failover

```text
Shard unavailable
        |
        v
Move/read data from another shard
```

Automatic data failover is not guaranteed by V1.

A shard can only safely serve data from another location if the required data is actually available there.

This distinction is a core correctness requirement.

---

# 33. Security and Data Safety Principle

ShardFlow must never make routing decisions that can knowingly cause data corruption or incorrect reads.

In particular:

> **Never route a tenant to a different shard merely because its original shard is unavailable unless the required data is known to exist on the destination shard.**

---

# 34. V1 Success Criteria

V1 is considered technically successful when a test application can complete the following workflow:

```text
1. Create a ShardFlow account through Supabase Auth.
2. Create a project.
3. Generate an API key.
4. Register three MongoDB shards.
5. Configure tenantId as the routing key.
6. Create tenant-to-shard mappings.
7. Send an authenticated application request.
8. ShardFlow validates the request.
9. ShardFlow resolves the tenant.
10. ShardFlow selects the correct shard.
11. ShardFlow validates the requested operation.
12. ShardFlow validates permitted operators/options.
13. ShardFlow reuses the database connection.
14. The database operation succeeds.
15. Shard health is visible in the dashboard.
16. A failed shard is detected.
17. The failed state is recorded.
18. The administrator is notified through the configured email system.
19. Recovery is detected when the shard becomes healthy again.
```

The most important success criterion is:

> **Correct and deterministic request routing.**

A dashboard without correct routing does not satisfy the core product requirement.

---

# 35. V1 Acceptance Criteria

## AC-01 — Authentication

**Given** a valid Supabase-authenticated user
**When** the user accesses ShardFlow
**Then** ShardFlow verifies the Supabase identity and resolves the corresponding ShardFlow user.

---

## AC-02 — Project

**Given** an authenticated user
**When** they create a project
**Then** the project is persisted and associated with that user.

---

## AC-03 — API Key

**Given** a project administrator
**When** they generate an API key
**Then** the raw key is shown once and only a secure representation is persisted.

---

## AC-04 — Shard

**Given** a valid MongoDB connection
**When** an administrator registers a shard
**Then** the shard is associated with the project and its health can be checked.

---

## AC-05 — Routing

**Given** a valid tenant-to-shard mapping
**When** an authenticated request contains that tenant ID
**Then** the request is routed to the mapped shard.

---

## AC-06 — Unknown Tenant

**Given** a tenant without a mapping
**When** a request is received
**Then** ShardFlow rejects the request with a structured error.

---

## AC-07 — Invalid API Key

**Given** an invalid or revoked API key
**When** a data-plane request is received
**Then** the request is rejected before database access.

---

## AC-08 — Supported Operation

**Given** a valid API key and tenant mapping
**When** an application sends a supported operation
**Then** ShardFlow validates and executes the operation against the mapped shard.

---

## AC-09 — Unsupported Operation

**Given** a valid API key
**When** an application requests an unsupported database operation
**Then** ShardFlow rejects the request before database execution.

---

## AC-10 — Unsupported Operator

**Given** a valid data-plane request
**When** the request contains an unsupported MongoDB operator
**Then** ShardFlow rejects the request before database execution.

---

## AC-11 — Unhealthy Shard

**Given** a shard fails health checks
**When** the failure threshold is reached
**Then** the shard is marked unhealthy and the event is recorded.

---

## AC-12 — Recovery

**Given** an unhealthy shard becomes reachable
**When** health checks succeed
**Then** the shard is marked healthy and a recovery event is recorded.

---

## AC-13 — Connection Reuse

**Given** repeated requests to the same shard
**When** requests are processed
**Then** ShardFlow reuses the existing connection pool rather than opening a new connection per request.

---

## AC-14 — Secret Protection

**Given** a shard connection credential
**When** logs or API responses are generated
**Then** the credential must not be exposed.

---

## AC-15 — Email Notification

**Given** a shard becomes unhealthy
**When** the notification condition is met
**Then** ShardFlow sends an operational notification through the configured email service.

---

# 36. V1 Risks

| Risk                               | Impact     | Mitigation                                           |
| ---------------------------------- | ---------- | ---------------------------------------------------- |
| Incorrect routing                  | Critical   | Deterministic tenant mappings + extensive tests      |
| Data inconsistency                 | Critical   | No unsafe automatic failover                         |
| Shard failure                      | High       | Health monitoring + explicit shard states            |
| Connection exhaustion              | High       | Connection pooling + limits                          |
| Credential exposure                | Critical   | Secret protection + redaction                        |
| Data-plane latency                 | High       | Connection reuse + lightweight routing               |
| Unsupported/unsafe query operators | High       | Explicit operator allowlist + validation             |
| Cross-shard requirements           | High       | Explicitly exclude from V1                           |
| Scope expansion                    | High       | Maintain strict V1 boundaries                        |
| Premature microservices            | Medium     | Single deployment with logical separation            |
| Complex proxy implementation       | High       | API/SDK first                                        |
| Authentication-provider dependency | Medium     | Keep authentication behind a clear auth boundary     |
| Email-provider dependency          | Low/Medium | Keep email delivery behind an internal email service |

---

# 37. Product Metrics

V1 should focus on technical/product validation rather than vanity metrics.

Useful measurements include:

### Routing

* Routing success rate
* Unknown tenant rate
* Routing latency

### Database

* Per-shard request count
* Per-shard latency
* Connection pool utilization
* Connection failures

### Data Plane

* Operation success rate
* Operation failure rate
* Validation rejection rate
* Unsupported operator rejection rate

### Health

* Health-check success rate
* Time to detect failure
* Time to detect recovery
* Number of unhealthy events

### Reliability

* Data-plane error rate
* Request success rate
* Shard-specific failure rate

---

# 38. Development Phases

## Phase 1 — Foundation

* Repository setup
* TypeScript setup
* Fastify setup
* Environment configuration
* Logging
* Error handling
* MongoDB metadata connection
* Supabase configuration
* Brevo configuration
* Testing setup

---

## Phase 2 — Control Plane

* Supabase authentication integration
* User synchronization/reference
* Projects
* API keys
* Shard registration
* Shard management

---

## Phase 3 — Routing

* Routing configuration
* Tenant-shard mappings
* Routing engine
* Shard resolution

---

## Phase 4 — Data Plane

* API-key authentication
* Request validation
* Operation validation
* MongoDB operator validation
* Connection manager
* Database operation execution
* Structured responses
* Error handling

Initial operations:

```text
find
find-one
insert-one
update-one
delete-one
```

---

## Phase 5 — Health

* Health checks
* Shard states
* Health events
* Failure detection
* Recovery detection
* Email notifications through Brevo

---

## Phase 6 — Dashboard

* Project overview
* Shard management
* Health monitoring
* Routing configuration
* API key management

---

## Phase 7 — Integration Testing

Test the complete scenario:

```text
Application
    |
    v
ShardFlow
    |
    +--> Shard 1
    +--> Shard 2
    +--> Shard 3
```

including:

* authenticated requests;
* tenant routing;
* supported CRUD operations;
* invalid operators;
* invalid API keys;
* shard failure;
* recovery;
* notification delivery.

---

# 39. Future Considerations

The following may be considered after V1 validation:

* MongoDB wire-protocol-compatible proxy
* SDK improvements
* Automatic shard assignment
* Automatic data migration
* Rebalancing
* Replication-aware failover
* PostgreSQL support
* MySQL support
* Redis integration
* Advanced observability
* Role-based access control
* Secret rotation
* Private networking
* Multi-region deployment
* Horizontal data-plane scaling
* Distributed coordination
* Additional MongoDB operations/operators
* Advanced query capabilities
* Idempotency support for selected write operations

These are not V1 requirements.

---

# 40. Key Product Decisions

The following decisions are considered foundational for V1.

### Decision 1 — MongoDB Only

V1 focuses exclusively on MongoDB.

---

### Decision 2 — Tenant-Aware Routing

The routing model is:

```text
tenantId -> shard
```

---

### Decision 3 — Customer-Owned Databases

ShardFlow does not host customer application databases.

---

### Decision 4 — Separate Control Plane and Data Plane

They are logically separate even if deployed together initially.

---

### Decision 5 — API/SDK First

V1 uses an application-facing API/SDK rather than a transparent MongoDB wire-protocol proxy.

---

### Decision 6 — No Automatic Data Movement

V1 does not automatically migrate or rebalance application data.

---

### Decision 7 — No Unsafe Failover

An unhealthy shard cannot simply be replaced with another shard unless the required data exists there.

---

### Decision 8 — Single Backend Deployment Initially

V1 avoids premature microservice architecture.

---

### Decision 9 — Supabase Authentication

V1 uses Supabase Auth for user authentication.

ShardFlow verifies Supabase authentication tokens and stores the corresponding ShardFlow user reference.

ShardFlow does not store user passwords.

---

### Decision 10 — Brevo Email Delivery

V1 uses Brevo as the email delivery provider.

Email delivery is accessed through an internal email-service abstraction.

---

### Decision 11 — Explicit Data Plane Operations

V1 exposes explicit MongoDB-style data-plane operations:

```text
find
find-one
insert-one
update-one
delete-one
```

ShardFlow does not expose arbitrary MongoDB commands.

---

### Decision 12 — MongoDB Operator Allowlist

V1 uses an explicit allowlist for MongoDB query and update operators.

Unsupported operators are rejected before database execution.

---

### Decision 13 — No Cross-Tenant or Cross-Shard Operations

A data-plane request operates against one tenant and resolves to one shard.

Cross-tenant and cross-shard operations are outside V1.

---

# 41. Final V1 Definition

ShardFlow V1 is:

> **A MongoDB-focused database infrastructure layer for multi-tenant SaaS applications. It provides a control plane for managing customer-owned database shards and a data plane for authenticated, tenant-aware request routing, controlled MongoDB operations, connection management, and shard health monitoring.**

The core flow is:

```text
                         ShardFlow
                             |
              +--------------+--------------+
              |                             |
         Control Plane                 Data Plane
              |                             |
              v                             v
       Metadata Database              API Key
                                            |
                                            v
                                      Tenant Routing
                                            |
                                            v
                                   Operation Validation
                                            |
                                            v
                                     Connection Manager
                                            |
                              +-------------+-------------+
                              |             |             |
                              v             v             v
                           Shard 1       Shard 2       Shard 3
```

The V1 product succeeds when it can reliably prove:

> **A multi-tenant application can use multiple customer-owned MongoDB shards without having to manage the shard topology and connection infrastructure directly inside the application.**

---

# 42. Related Documentation

The following documents should be maintained alongside this PRD:

```text
docs/
├── research.md
├── prd.md
├── architecture.md
├── database.md
├── api.md
├── error-contract.md
├── rules.md
├── memory.md
├── task.md
├── engineering-decisions/
└── features/
```

Document dependency:

```text
research.md
     |
     v
prd.md
     |
     v
architecture.md
     |
     v
database.md
     |
     v
api.md
     |
     v
error-contract.md
     |
     v
implementation
```

The PRD defines **what ShardFlow V1 must do**.

The architecture document defines **how V1 will do it**.

The database document defines **how ShardFlow metadata is persisted**.

The API document defines **how clients interact with ShardFlow**.

The error contract defines **how failures are represented**.

The rules document defines **how the project must be engineered**.

The memory document records **important decisions and context for future development and AI agents**.

The task document tracks **current implementation progress**.
