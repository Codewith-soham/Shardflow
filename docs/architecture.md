# ShardFlow V1 — System Architecture

**Document:** System Architecture  
**Product:** ShardFlow  
**Version:** V1.0  
**Status:** Draft for implementation  
**Related Documents:** `research.md`, `prd.md`

---

## 1. Purpose

This document defines the technical architecture of ShardFlow V1.

The PRD defines **what ShardFlow must do**.

This document defines **how ShardFlow V1 will do it**.

The architecture is intentionally limited to the V1 product scope:

- MongoDB only
- Multi-tenant applications
- Tenant-aware routing
- Customer-owned MongoDB shards
- Centralized shard management
- Connection management
- Health monitoring
- API/SDK-based application integration
- Single backend deployment initially
- Logical separation between control plane and data plane

---

# 2. Architectural Goals

The V1 architecture must provide:

1. Correct and deterministic tenant-to-shard routing.
2. Reusable MongoDB connections.
3. Isolation between individual shards.
4. Centralized shard configuration.
5. Health monitoring and failure detection.
6. Secure handling of credentials and API keys.
7. Clear separation between control-plane and data-plane responsibilities.
8. Low operational complexity.
9. Testability.
10. A foundation that can scale horizontally later without requiring a complete rewrite.

---

# 3. Architecture Principles

## 3.1 Correctness Before Optimization

The most important property of ShardFlow is routing correctness.

The system must never route a tenant to the wrong shard simply to improve utilization.

```text
Correct shard
    >
Lower latency
    >
Higher utilization
```

Correct data access takes priority.

---

## 3.2 Customer Data Remains Customer-Owned

ShardFlow does not become the customer's application database.

ShardFlow stores:

```text
Users
Projects
API keys
Shard configuration
Routing metadata
Health events
Audit events
```

Customer databases store:

```text
Application data
```

---

## 3.3 Control Plane and Data Plane Separation

The control plane manages configuration.

The data plane handles application traffic.

```text
Control Plane
    |
    +-- configuration
    +-- metadata
    +-- administration
    +-- health

Data Plane
    |
    +-- authentication
    +-- routing
    +-- connections
    +-- database operations
```

They may run inside the same backend deployment in V1, but their responsibilities must remain logically separated.

---

## 3.4 Avoid Premature Distribution

V1 will not begin as multiple microservices.

Instead:

```text
One Backend
|
+-- Control Plane
|
+-- Data Plane
|
+-- Health Monitoring
|
+-- Shared Infrastructure
```

This keeps local development, testing, deployment, and debugging manageable.

The architecture should still maintain boundaries so components can be separated later if required.

---

# 4. High-Level Architecture

```text
                         +----------------------+
                         |      Developer       |
                         |      Dashboard       |
                         +----------+-----------+
                                    |
                                    | HTTPS
                                    v
                         +----------------------+
                         |   ShardFlow Backend  |
                         |                      |
                         |  +----------------+  |
                         |  | Control Plane   |  |
                         |  +-------+--------+  |
                         |          |           |
                         |  +-------v--------+  |
                         |  | Metadata DB     |  |
                         |  +----------------+  |
                         |                      |
                         |  +----------------+  |
Application ------------>|  | Data Plane      |  |
   HTTPS/API             |  +-------+--------+  |
                         |          |           |
                         |  +-------v--------+  |
                         |  | Routing Engine  |  |
                         |  +-------+--------+  |
                         |          |           |
                         |  +-------v--------+  |
                         |  | Connection      |  |
                         |  | Manager         |  |
                         |  +---+----+----+--+  |
                         +------|----|----|------+
                                |    |    |
                                v    v    v
                              +---+ +---+ +---+
                              |DB1| |DB2| |DB3|
                              +---+ +---+ +---+
```

---

# 5. Major Components

ShardFlow V1 consists of the following logical components:

```text
1. Dashboard
2. API Server
3. Control Plane
4. Data Plane
5. Routing Engine
6. Shard Registry
7. Connection Manager
8. Health Monitor
9. Metadata Database
10. Notification System
11. Observability Layer
```

---

# 6. Dashboard

The dashboard is the administrative interface for project administrators.

Technology:

```text
React
Vite
TypeScript
Tailwind CSS
TanStack Query
```

The dashboard does not communicate directly with customer MongoDB shards.

It communicates with the ShardFlow control-plane API.

```text
Dashboard
    |
    | HTTPS
    v
Control Plane API
```

---

# 7. API Server

The API server is the HTTP entry point for ShardFlow.

Technology:

```text
Node.js
TypeScript
Fastify
```

Responsibilities:

- Receive HTTP requests.
- Authenticate requests.
- Validate input.
- Route requests to the appropriate application service.
- Serialize responses.
- Handle errors.
- Attach request IDs.
- Produce structured logs.

The API server should not contain business logic directly.

---

# 8. Control Plane

The control plane is responsible for configuration and administration.

### Responsibilities

```text
Authentication
Project management
API key management
Shard registration
Shard configuration
Routing configuration
Tenant mappings
Health information
Audit events
Notifications
```

### Control-plane flow

```text
Dashboard
    |
    v
Fastify API
    |
    v
Controller
    |
    v
Service
    |
    v
Repository
    |
    v
Metadata MongoDB
```

The control plane should follow a clean:

```text
Route
  ->
Controller
  ->
Service
  ->
Repository
```

architecture.

---

# 9. Data Plane

The data plane is the most important runtime component of ShardFlow.

It handles application database requests.

### Responsibilities

```text
Authenticate API key
Validate request
Extract tenantId
Resolve tenant
Resolve shard
Check shard state
Acquire connection
Execute operation
Return result
Log request
Record metrics
```

### Data-plane flow

```text
Application
    |
    v
Data Plane API
    |
    v
Authentication
    |
    v
Request Validation
    |
    v
Routing Engine
    |
    v
Shard Registry
    |
    v
Connection Manager
    |
    v
MongoDB
```

---

# 10. Routing Engine

The routing engine determines which shard should handle a request.

This is the core intelligence of ShardFlow V1.

## Input

The routing engine receives:

```text
projectId
tenantId
```

## Output

It returns:

```text
shardId
```

Example:

```text
project = ecommerce
tenantId = tenant_003

tenant_003
     |
     v
TenantShardMapping
     |
     v
shard_2
```

---

# 11. Routing Algorithm

V1 uses a direct tenant-to-shard mapping.

Conceptually:

```text
function resolveShard(projectId, tenantId):

    mapping =
        findMapping(projectId, tenantId)

    if mapping does not exist:
        return TENANT_NOT_FOUND

    shard =
        findShard(projectId, mapping.shardId)

    if shard does not exist:
        return SHARD_NOT_FOUND

    if shard is disabled:
        return SHARD_UNAVAILABLE

    return shard
```

The actual implementation should not embed database access directly into the routing algorithm.

Instead:

```text
Routing Engine
     |
     +--> Mapping Repository
     |
     +--> Shard Registry
```

---

# 12. Routing Correctness

The routing engine must guarantee:

```text
One tenant
    ->
One configured shard
```

at any point in time.

Example:

```text
tenant_A -> shard_1
tenant_B -> shard_2
tenant_C -> shard_3
```

A request for `tenant_B` must never accidentally execute against `shard_1`.

Routing tests should therefore be one of the most heavily tested parts of the system.

---

# 13. Shard Registry

The shard registry represents the currently configured shard topology.

It is responsible for answering:

```text
What shards exist?
Which project owns this shard?
Is this shard enabled?
What is its current health?
What connection configuration belongs to it?
```

Conceptually:

```text
Shard Registry
      |
      +-- shard_1
      +-- shard_2
      +-- shard_3
```

The registry should abstract the underlying metadata storage from the rest of the data plane.

---

# 14. Shard Lifecycle

A shard should move through explicit states.

### Configuration state

```text
ACTIVE
DISABLED
```

### Health state

```text
UNKNOWN
HEALTHY
DEGRADED
UNHEALTHY
```

These are separate concepts.

For example:

```text
configuration = ACTIVE
health = UNHEALTHY
```

means:

> The administrator has enabled the shard, but the shard is currently unhealthy.

---

# 15. Connection Manager

The connection manager owns MongoDB connections to customer shards.

This is separate from the routing engine.

Routing answers:

> Which shard?

Connection management answers:

> How do we connect to that shard?

---

## 15.1 Connection Pooling

ShardFlow must not create a new MongoDB connection for every request.

Instead:

```text
Shard 1
   |
   v
Connection Pool
   |
   +-- connection
   +-- connection
   +-- connection
```

Repeated requests reuse the pool.

---

## 15.2 Connection Manager Responsibilities

```text
getConnection(shardId)
createConnection(shardId)
reuseConnection(shardId)
detectConnectionFailure(shardId)
closeConnection(shardId)
invalidateConnection(shardId)
```

---

## 15.3 Connection Lifecycle

```text
Request
   |
   v
Resolve shard
   |
   v
Connection Manager
   |
   +---- pool exists? ----+
   |                      |
  yes                     no
   |                      |
   v                      v
reuse pool          create pool
   |                      |
   +----------+-----------+
              |
              v
       Execute operation
```

---

# 16. Connection Isolation

Each shard should have an independent connection pool.

```text
Shard 1 -> Pool 1
Shard 2 -> Pool 2
Shard 3 -> Pool 3
```

A failure in one pool should not automatically destroy connections to other shards.

This prevents a single customer database failure from becoming a global data-plane failure.

---

# 17. Health Monitor

The health monitor periodically checks registered shards.

Conceptually:

```text
Health Monitor
     |
     +--> Shard 1
     +--> Shard 2
     +--> Shard 3
```

Each check should determine whether the database is reachable and responsive.

---

# 18. Health Check

A basic health check should:

1. Acquire or use a valid connection.
2. Execute a lightweight MongoDB operation.
3. Measure latency.
4. Record the result.
5. Update shard health state.

Example:

```text
Health Check
     |
     v
MongoDB Ping
     |
     +---- success ----> HEALTHY
     |
     +---- failure ----> UNHEALTHY
```

The exact thresholds and retry policy should be configurable later.

---

# 19. Health State Transitions

```text
              +----------+
              | UNKNOWN  |
              +----+-----+
                   |
             successful check
                   |
                   v
              +----------+
       +----->| HEALTHY  |<-----+
       |      +----+-----+      |
       |           |            |
       |      failed checks     |
       |           |            |
       |           v            |
       |      +----------+      |
       |      |UNHEALTHY |------+
       |      +----------+ recovery
       |
       +------------------------+
```

A more detailed implementation can introduce `DEGRADED` later.

V1 should keep the state machine simple unless real operational requirements justify additional states.

---

# 20. Health Failure Handling

When a shard becomes unhealthy:

```text
Health Monitor
      |
      v
Shard unhealthy
      |
      +--> Update shard state
      |
      +--> Create HealthEvent
      |
      +--> Notify administrator
      |
      +--> Data plane checks shard state
```

The system must not blindly redirect requests to another shard.

---

# 21. Why There Is No Automatic Failover in V1

Suppose:

```text
tenant_A -> shard_1
```

and shard 1 fails.

Routing tenant A to shard 2 would be unsafe if tenant A's data does not exist on shard 2.

Therefore:

```text
Shard failure
    !=
Safe data failover
```

Automatic failover requires a known replication or data-placement strategy.

That is outside V1.

---

# 22. Metadata Database

ShardFlow maintains its own MongoDB database for control-plane metadata.

Example:

```text
ShardFlow Metadata DB
|
+-- users
+-- projects
+-- apiKeys
+-- shards
+-- routingConfigs
+-- tenantShardMappings
+-- healthEvents
+-- auditLogs
```

This database is not part of the customer's shard topology.

---

# 23. Metadata vs Customer Data

This distinction must remain strict.

```text
             ShardFlow
                 |
        +--------+--------+
        |                 |
        v                 v
 Metadata DB        Customer Shards
        |                 |
 configuration       application data
 routing             users/orders/etc.
 health
```

ShardFlow metadata must never accidentally be routed through the customer data plane.

---

# 24. Request Lifecycle

The complete request lifecycle is:

```text
1. Application sends request
             |
             v
2. Fastify receives request
             |
             v
3. API key authentication
             |
             v
4. Request validation
             |
             v
5. Extract project + tenant
             |
             v
6. Routing Engine
             |
             v
7. Resolve tenant -> shard
             |
             v
8. Check shard status
             |
             v
9. Connection Manager
             |
             v
10. Acquire shard connection
             |
             v
11. Execute MongoDB operation
             |
             v
12. Serialize response
             |
             v
13. Record logs/metrics
             |
             v
14. Return response
```

---

# 25. Request Sequence

```text
Application       ShardFlow        Metadata DB       MongoDB Shard
    |                 |                 |                 |
    |--- request ---->|                 |                 |
    |                 |                 |                 |
    |                 |-- auth -------->|                 |
    |                 |<-- valid -------|                 |
    |                 |                 |                 |
    |                 |-- mapping ----->|                 |
    |                 |<-- shardId -----|                 |
    |                 |                 |                 |
    |                 |------------------------------- -->|
    |                 |                 |     operation    |
    |                 |<------------------------------- ---|
    |<-- response ----|                 |                 |
```

---

# 26. Control Plane Sequence

Example: registering a shard.

```text
Admin
  |
  v
Dashboard
  |
  v
Fastify API
  |
  v
Controller
  |
  v
Shard Service
  |
  v
Shard Repository
  |
  v
Metadata DB
```

After persistence, the shard registry/connection layer can recognize the new shard.

---

# 27. Shard Registration Lifecycle

```text
Administrator
      |
      v
Submit MongoDB connection
      |
      v
Validate input
      |
      v
Store encrypted/secured secret
      |
      v
Create shard record
      |
      v
Perform initial health check
      |
      +------ success ------> HEALTHY
      |
      +------ failure ------> UNHEALTHY
```

A shard should not be presented as healthy simply because its configuration was saved.

---

# 28. API Key Security Boundary

The API key authenticates the application to a project.

```text
Application
     |
     | API Key
     v
ShardFlow
     |
     v
Project
```

The key must not grant access to another project.

Conceptually:

```text
API Key -> Project ID -> Authorization
```

---

# 29. Credential Security

ShardFlow stores customer database connection information.

Therefore connection credentials are highly sensitive.

The architecture should use:

```text
Application
     |
     v
Secret input
     |
     v
Secure storage
     |
     v
Connection Manager
```

Credentials should:

- Never be logged.
- Never be returned through normal APIs.
- Never be exposed in dashboard responses.
- Be encrypted/protected at rest.
- Be decrypted only when required by the connection layer.

V1 can begin with an application-managed encryption key, with a more advanced secret-management system considered later.

---

# 30. Observability Architecture

Every important request should have a request ID.

Example:

```text
requestId = req_123
```

Logs should contain fields such as:

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

Sensitive fields must be redacted.

---

# 31. Error Flow

```text
Component
    |
    v
Known Error?
   /  yes  no
  |    |
  v    v
Map   Internal Error
Code
  |
  v
Structured API Response
```

The system should distinguish between:

```text
Client errors
Infrastructure errors
Database errors
Internal errors
```

The detailed error-code contract belongs in `docs/error-codes.md`.

---

# 32. Data Plane Error Examples

### Unknown tenant

```text
TENANT_NOT_FOUND
```

### Unknown shard

```text
SHARD_NOT_FOUND
```

### Unhealthy shard

```text
SHARD_UNAVAILABLE
```

### Database connection failure

```text
DATABASE_CONNECTION_FAILED
```

### Database operation failure

```text
DATABASE_OPERATION_FAILED
```

The exact codes should be finalized before API implementation.

---

# 33. Caching Strategy

V1 should use limited in-process caching only where it improves routing performance without creating correctness problems.

Potential cached information:

```text
tenantId -> shardId
shardId -> shard configuration
```

However, the source of truth remains the metadata database.

The architecture must account for stale routing metadata.

For V1, configuration changes should invalidate/update relevant in-memory state.

A distributed cache such as Redis is intentionally excluded from V1.

---

# 34. Routing Cache Model

Conceptually:

```text
             Metadata DB
                  |
                  v
            Routing Cache
                  |
                  v
            Routing Engine
```

Example:

```text
tenant_001 -> shard_1
tenant_002 -> shard_2
```

If the mapping changes:

```text
tenant_001 -> shard_3
```

the cache must not continue indefinitely returning:

```text
tenant_001 -> shard_1
```

Therefore cache invalidation/update is part of the routing design.

---

# 35. Horizontal Scaling Consideration

V1 can run as one backend instance:

```text
Application
     |
     v
ShardFlow
```

Future deployment:

```text
                 Load Balancer
                      |
             +--------+--------+
             |        |        |
             v        v        v
          SF-1     SF-2     SF-3
             |        |        |
             +--------+--------+
                      |
                Customer DBs
```

For this to work reliably, routing metadata must have a shared source of truth.

The metadata database provides that source of truth.

In-memory state must therefore be treated as cache, not authoritative configuration.

---

# 36. Deployment Architecture — V1

The initial deployment can be:

```text
             Internet
                |
                v
          Reverse Proxy
                |
                v
        ShardFlow Backend
          /                    /                     v               v
 Metadata MongoDB   Customer MongoDBs
```

The frontend can be deployed separately:

```text
Browser
  |
  +----> Dashboard
  |
  +----> ShardFlow API
```

The exact cloud provider is intentionally not part of the architecture.

---

# 37. Local Development Architecture

Local development should be reproducible with Docker Compose.

Conceptually:

```text
docker-compose
|
+-- shardflow-backend
|
+-- shardflow-metadata-db
|
+-- mongo-shard-1
|
+-- mongo-shard-2
|
+-- mongo-shard-3
```

This allows the complete routing workflow to be tested locally.

Example:

```text
tenant_A -> shard_1
tenant_B -> shard_2
tenant_C -> shard_3
```

The developer should be able to stop one shard and observe health/failure behavior.

---

# 38. Testing Architecture

Testing should occur at multiple levels.

## Unit Tests

Test:

```text
Routing Engine
Validation
State transitions
API key utilities
Error mapping
```

## Integration Tests

Test:

```text
MongoDB repositories
Connection Manager
Health checks
Shard registration
Tenant mapping
```

## End-to-End Tests

Test:

```text
Application
    |
    v
ShardFlow
    |
    v
MongoDB Shards
```

including:

- correct routing
- invalid API key
- unknown tenant
- shard failure
- shard recovery

---

# 39. Test Scenario

A core integration scenario should use:

```text
3 MongoDB shards

Shard 1
Shard 2
Shard 3
```

Mappings:

```text
tenant_001 -> shard_1
tenant_002 -> shard_1
tenant_003 -> shard_2
tenant_004 -> shard_3
```

Requests:

```text
tenant_001 -> Shard 1
tenant_003 -> Shard 2
tenant_004 -> Shard 3
```

Then:

```text
Stop Shard 2
```

Expected:

```text
Health Monitor
      |
      v
Shard 2 = UNHEALTHY
```

Requests for `tenant_003` must not silently execute against another shard.

---

# 40. Backend Logical Architecture

The backend should follow these boundaries:

```text
backend/src/
|
+-- auth/
|
+-- control-plane/
|    |
|    +-- controllers/
|    +-- services/
|    +-- repositories/
|    +-- routes/
|    +-- schemas/
|
+-- data-plane/
|    |
|    +-- controllers/
|    +-- services/
|    +-- router/
|    +-- connection-manager/
|    +-- shard-registry/
|    +-- middleware/
|    +-- schemas/
|
+-- health/
|    |
|    +-- services/
|    +-- workers/
|    +-- checks/
|
+-- database/
|
+-- observability/
|
+-- errors/
|
+-- config/
|
+-- utils/
|
+-- app.ts
+-- server.ts
```

---

# 41. Dependency Direction

Dependencies should flow toward lower-level infrastructure.

Conceptually:

```text
Routes
  |
  v
Controllers
  |
  v
Services
  |
  v
Domain / Core Logic
  |
  +----> Repositories
  |
  +----> Infrastructure
```

The routing engine should not depend on HTTP-specific objects.

For example, avoid designing routing around:

```text
request
response
FastifyRequest
```

Instead, routing should operate on domain inputs:

```text
projectId
tenantId
```

This makes it easier to test and reuse.

---

# 42. Control Plane vs Data Plane Dependency

The data plane may read configuration produced by the control plane.

```text
Control Plane
      |
      v
Metadata DB
      |
      v
Data Plane
```

But the data plane should not depend on dashboard-specific code.

This maintains a clean boundary.

---

# 43. Configuration Flow

```text
Admin
 |
 v
Dashboard
 |
 v
Control Plane
 |
 v
Metadata DB
 |
 v
Shard Registry
 |
 v
Routing Engine / Connection Manager
```

Configuration becomes runtime state.

---

# 44. Runtime State vs Source of Truth

The architecture must distinguish:

### Source of truth

```text
Metadata MongoDB
```

### Runtime state

```text
In-memory shard registry
Connection pools
Routing cache
Health state cache
```

Runtime state may be recreated.

The metadata database contains the durable configuration.

---

# 45. Startup Lifecycle

When ShardFlow starts:

```text
1. Load environment configuration
2. Initialize logger
3. Connect to metadata database
4. Load active shard configuration
5. Initialize shard registry
6. Initialize routing cache
7. Initialize health monitor
8. Start HTTP server
9. Begin background health checks
```

The exact initialization order can be refined during implementation.

---

# 46. Shutdown Lifecycle

On graceful shutdown:

```text
1. Stop accepting new requests
2. Stop health-monitor workers
3. Finish in-flight operations where possible
4. Close customer shard connections
5. Close metadata database connection
6. Flush required logs
7. Exit process
```

This prevents connection leaks and incomplete operations during deployments.

---

# 47. Background Workers

V1 requires limited background processing.

Primary worker:

```text
Health Monitor Worker
```

Responsibilities:

```text
Load active shards
    |
    v
Perform health checks
    |
    v
Update health state
    |
    v
Record events
    |
    v
Trigger notifications
```

A heavyweight job queue is not required for V1.

---

# 48. Notification Flow

```text
Health Monitor
      |
      v
Health State Change
      |
      v
Health Event
      |
      v
Notification Service
      |
      v
Administrator
```

The notification implementation can initially be simple.

The architecture should keep the notification service behind an interface so additional channels can be added later.

---

# 49. Performance Considerations

The main performance-sensitive path is:

```text
Request
  ->
Authentication
  ->
Routing
  ->
Connection lookup
  ->
MongoDB operation
```

The following should remain out of the hot path where possible:

- Repeated metadata queries
- Creating database connections
- Expensive configuration processing
- Dashboard-specific logic
- Long-running health checks

This is why the architecture uses:

```text
Routing cache
Connection pools
Shard registry
```

---

# 50. Scaling Constraints

The first major scaling bottlenecks are expected to be:

1. Number of active shard connections.
2. Number of requests per backend instance.
3. Routing metadata lookup frequency.
4. Health-check workload.
5. Metadata database throughput.

V1 should measure these before introducing Redis, Kafka, Kubernetes, or microservices.

---

# 51. Security Boundaries

There are three major trust boundaries.

## Boundary 1 — Dashboard

```text
User
  |
  v
Control Plane
```

Requires user authentication and authorization.

## Boundary 2 — Application

```text
Application
  |
  v
Data Plane
```

Requires project-scoped API key authentication.

## Boundary 3 — Customer Database

```text
ShardFlow
  |
  v
Customer MongoDB
```

Requires securely stored database credentials.

---

# 52. Architectural Failure Principles

The following principles are mandatory.

### Principle 1

One shard failing must not crash the whole backend.

### Principle 2

An unavailable shard must not cause unsafe cross-shard routing.

### Principle 3

A stale cache must not silently cause incorrect tenant routing.

### Principle 4

Customer credentials must never appear in logs or normal API responses.

### Principle 5

Metadata database failure must be treated differently from customer-shard failure.

---

# 53. Metadata Database Failure

If the ShardFlow metadata database becomes unavailable:

```text
Control Plane
    |
    v
Metadata DB
    X
```

Administrative configuration operations may fail.

The data plane may continue operating using already-loaded runtime configuration for a limited period, depending on the implementation.

However, V1 must not pretend that configuration changes were successfully persisted when the metadata database is unavailable.

This behavior should be explicitly tested.

---

# 54. Customer Shard Failure

If one customer shard fails:

```text
Shard 1 -> HEALTHY
Shard 2 -> UNHEALTHY
Shard 3 -> HEALTHY
```

ShardFlow should continue serving tenants mapped to:

```text
Shard 1
Shard 3
```

while requests requiring Shard 2 should receive a controlled failure.

---

# 55. Why V1 Does Not Use Redis

Redis could be useful for:

- Shared routing cache
- Distributed state
- Rate limiting
- Coordination

But V1 does not require it.

Adding Redis would introduce:

```text
another service
another failure mode
another deployment dependency
another data-consistency problem
```

V1 should first prove that MongoDB + in-process state is sufficient.

---

# 56. Why V1 Does Not Use Kafka

Kafka is unnecessary for the initial workload.

V1 background processing consists mainly of:

```text
health checks
health events
notifications
```

A simple background worker is sufficient.

---

# 57. Why V1 Does Not Use Microservices

Separating:

```text
routing-service
connection-service
health-service
auth-service
```

into independent services would introduce network calls and operational complexity before there is a demonstrated need.

The logical boundaries remain, but deployment remains simple:

```text
One Backend
```

---

# 58. Future Evolution

The architecture should allow future evolution toward:

```text
                    Load Balancer
                         |
              +----------+----------+
              |          |          |
              v          v          v
            Data       Data       Data
           Plane      Plane      Plane
              \          |          /
               \         |         /
                +--------+--------+
                         |
                  Shared Metadata
```

Possible future components:

```text
Redis
Message Broker
Dedicated Control Plane
Dedicated Data Plane
Secret Manager
Kubernetes
Multi-region routing
Replication-aware failover
Automatic migration
```

These are future architectural possibilities, not V1 requirements.

---

# 59. Architectural Decisions

## ADR-001 — MongoDB Only

V1 supports MongoDB exclusively.

**Reason:** Narrowing the scope allows the routing and connection architecture to be validated without implementing multiple database abstractions.

---

## ADR-002 — Tenant-Based Routing

V1 maps:

```text
tenantId -> shardId
```

**Reason:** A tenant's data must have a deterministic location.

---

## ADR-003 — API/SDK Data Plane

V1 uses an application-facing API/SDK instead of MongoDB wire-protocol compatibility.

**Reason:** Implementing a wire-protocol proxy significantly increases complexity and is unnecessary to validate the core routing thesis.

---

## ADR-004 — Native MongoDB Driver

ShardFlow uses the official MongoDB Node.js driver.

**Reason:** The data plane requires explicit control over connections, pools, health checks, and database operations.

---

## ADR-005 — Single Backend Deployment

Control plane and data plane run in one backend deployment initially.

**Reason:** Avoid premature distributed-system complexity while preserving logical boundaries.

---

## ADR-006 — No Automatic Failover

V1 does not automatically move tenant traffic to another shard when a shard fails.

**Reason:** A failed shard's data may not exist on another shard. Incorrect failover can cause incorrect reads or writes.

---

## ADR-007 — Metadata Database as Source of Truth

The ShardFlow metadata database is the authoritative source for configuration.

**Reason:** Multiple future data-plane instances must be able to obtain consistent configuration.

---

# 60. V1 Architecture Summary

The final V1 architecture is:

```text
                         +-------------------+
                         |     Dashboard     |
                         +---------+---------+
                                   |
                                   | HTTPS
                                   v
+----------------------------------------------------------------+
|                       ShardFlow Backend                        |
|                                                                |
|  +--------------------+       +-----------------------------+  |
|  |   Control Plane    |       |          Data Plane          |  |
|  |                    |       |                             |  |
|  | Auth               |       | API Authentication          |  |
|  | Projects           |       | Request Validation           |  |
|  | API Keys           |       | Routing Engine               |  |
|  | Shards             |       | Shard Registry               |  |
|  | Routing Config     |       | Connection Manager           |  |
|  | Health             |       | Operation Execution          |  |
|  +---------+----------+       +--------------+--------------+  |
|            |                                 |                 |
|            |                                 |                 |
|            +---------------+-----------------+                 |
|                            |                                   |
|                            v                                   |
|                     +-------------+                            |
|                     | Metadata DB |                            |
|                     +-------------+                            |
|                                                                |
|  +----------------------------------------------------------+  |
|  | Health Monitor | Observability | Notifications            |  |
|  +----------------------------------------------------------+  |
+----------------------------------------------------------------+
                              |
                 +------------+------------+
                 |            |            |
                 v            v            v
              MongoDB      MongoDB      MongoDB
              Shard 1      Shard 2      Shard 3
```

---

# 61. Final Request Flow

The most important V1 flow is:

```text
Application
     |
     | API Key + tenantId + operation
     v
Fastify
     |
     v
Authenticate
     |
     v
Validate
     |
     v
Routing Engine
     |
     | tenantId -> shardId
     v
Shard Registry
     |
     v
Connection Manager
     |
     v
MongoDB Shard
     |
     v
Result
     |
     v
Application
```

The architecture is successful when this flow is:

- Correct
- Deterministic
- Secure
- Observable
- Testable
- Reliable under individual shard failure

---

# 62. Boundary of This Document

This document defines the V1 system architecture.

It does not yet define:

- Exact MongoDB indexes
- Exact API request/response schemas
- Exact error-code catalog
- Exact authentication implementation
- Exact encryption implementation
- Exact health-check thresholds
- Exact deployment provider
- Production scaling limits

Those details belong in:

```text
docs/database.md
docs/api.md
docs/error-codes.md
```

and implementation-specific engineering decisions.

---

# 63. Implementation Order

The recommended implementation dependency is:

```text
Architecture
    |
    v
Database Design
    |
    v
API Contract
    |
    v
Error Codes
    |
    v
Backend Foundation
    |
    v
Control Plane
    |
    v
Shard Registry
    |
    v
Routing Engine
    |
    v
Connection Manager
    |
    v
Data Plane
    |
    v
Health Monitor
    |
    v
Dashboard
    |
    v
End-to-End Testing
```

The critical path is:

```text
Shard Registry
      +
Tenant Mapping
      |
      v
Routing Engine
      |
      v
Connection Manager
      |
      v
Data Plane
```

That is the technical core of ShardFlow V1.
