# ShardFlow V1 — Database Design

**Document:** Database Design
**Product:** ShardFlow
**Version:** V1.0
**Status:** Draft for implementation
**Last Updated:** 2026-09-21

---

# 1. Database Overview

ShardFlow uses MongoDB for its own infrastructure metadata.

The database managed directly by ShardFlow is **not** the storage location for customer application data.

The architecture has two database boundaries:

```text
                         SHARDFLOW
                             |
                +------------+------------+
                |                         |
                v                         v
        ShardFlow Metadata          Customer Databases
             MongoDB                  MongoDB Shards
                |                         |
                v                         v
        Infrastructure Data        Application Data
```

---

# 2. Database Ownership Boundary

## 2.1 ShardFlow Metadata Database

ShardFlow owns and manages this database.

It contains:

```text
Users
Projects
API Keys
Shards
Routing Configurations
Tenant-Shard Mappings
Health Events
Audit Logs
```

This database contains infrastructure metadata.

---

## 2.2 Customer MongoDB Shards

Customer databases contain application data.

Examples:

```text
users
orders
products
messages
subscriptions
payments
```

ShardFlow does not own the application's schema.

ShardFlow only executes validated operations against customer databases through the data plane.

---

# 3. Database Technology

V1 uses:

```text
Database Engine: MongoDB
Driver: Official MongoDB Node.js Driver
```

MongoDB is used for:

1. ShardFlow's metadata database.
2. Customer-owned application shards.

The two uses must remain logically separated.

---

# 4. Metadata Database Structure

The V1 metadata database contains the following core collections:

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

Conceptually:

```text
users
  |
  +---- projects
            |
            +---- apiKeys
            |
            +---- shards
            |
            +---- routingConfigs
            |
            +---- tenantShardMappings
            |
            +---- healthEvents
            |
            +---- auditLogs
```

MongoDB references should be used where relationships are required rather than embedding large, frequently changing datasets into unrelated documents.

---

# 5. Users Collection

Collection:

```text
users
```

The ShardFlow user represents an authenticated platform user.

Authentication itself is handled by Supabase Auth.

ShardFlow stores the platform-level user record required for authorization and ownership.

---

## 5.1 User Schema

```text
User
├── _id
├── supabaseUserId
├── email
├── name
├── status
├── createdAt
└── updatedAt
```

### Fields

| Field            | Type     | Required | Description                   |
| ---------------- | -------- | -------: | ----------------------------- |
| `_id`            | ObjectId |      Yes | Internal MongoDB identifier   |
| `supabaseUserId` | String   |      Yes | Supabase Auth user identifier |
| `email`          | String   |      Yes | User email                    |
| `name`           | String   |       No | Display name                  |
| `status`         | String   |      Yes | Platform user status          |
| `createdAt`      | Date     |      Yes | Creation timestamp            |
| `updatedAt`      | Date     |      Yes | Last update timestamp         |

---

## 5.2 User Status

Initial statuses:

```text
ACTIVE
DISABLED
```

A disabled user must not be allowed to access protected ShardFlow resources.

---

## 5.3 Authentication Boundary

ShardFlow must not store:

```text
password
passwordHash
refreshToken
sessionSecret
```

Supabase Auth owns authentication credentials and authentication sessions.

ShardFlow stores only the identity reference required by the application.

---

## 5.4 User Indexes

Required:

```text
unique index:
supabaseUserId
```

Recommended:

```text
index:
email
```

The `supabaseUserId` must uniquely identify a ShardFlow user.

---

# 6. Projects Collection

Collection:

```text
projects
```

A project represents an isolated ShardFlow environment.

A project owns:

```text
API Keys
Shards
Routing Configuration
Tenant-Shard Mappings
Health Events
Audit Events
```

---

## 6.1 Project Schema

```text
Project
├── _id
├── ownerId
├── name
├── description
├── status
├── createdAt
└── updatedAt
```

---

## 6.2 Fields

| Field         | Type     | Required | Description                  |
| ------------- | -------- | -------: | ---------------------------- |
| `_id`         | ObjectId |      Yes | Project identifier           |
| `ownerId`     | ObjectId |      Yes | Reference to `users._id`     |
| `name`        | String   |      Yes | Project name                 |
| `description` | String   |       No | Optional project description |
| `status`      | String   |      Yes | Project state                |
| `createdAt`   | Date     |      Yes | Creation timestamp           |
| `updatedAt`   | Date     |      Yes | Last update timestamp        |

---

## 6.3 Project Status

Initial values:

```text
ACTIVE
DISABLED
```

---

## 6.4 Project Indexes

Required:

```text
index:
ownerId
```

Recommended:

```text
compound index:
ownerId + name
```

The exact uniqueness constraint for project names should be finalized during implementation based on whether names are unique globally or only within an owner.

---

# 7. API Keys Collection

Collection:

```text
apiKeys
```

API keys authenticate application requests to the ShardFlow data plane.

---

## 7.1 API Key Schema

```text
ApiKey
├── _id
├── projectId
├── name
├── keyHash
├── lastUsedAt
├── expiresAt
├── revokedAt
├── createdAt
└── updatedAt
```

---

## 7.2 Fields

| Field        | Type     | Required | Description                |
| ------------ | -------- | -------: | -------------------------- |
| `_id`        | ObjectId |      Yes | API key identifier         |
| `projectId`  | ObjectId |      Yes | Owning project             |
| `name`       | String   |      Yes | Human-readable key name    |
| `keyHash`    | String   |      Yes | Secure hash of raw API key |
| `lastUsedAt` | Date     |       No | Last successful use        |
| `expiresAt`  | Date     |       No | Optional expiration        |
| `revokedAt`  | Date     |       No | Revocation timestamp       |
| `createdAt`  | Date     |      Yes | Creation timestamp         |
| `updatedAt`  | Date     |      Yes | Last update timestamp      |

---

## 7.3 API Key Security

The raw API key must never be stored.

Example:

```text
Raw API Key
    |
    v
Hash Function
    |
    v
keyHash
```

The raw key should only be returned during intentional creation.

After creation, the client must use the raw key directly; ShardFlow should not be able to reconstruct it from the stored hash.

---

## 7.4 API Key State

An API key is active when:

```text
revokedAt == null
```

and:

```text
expiresAt == null
OR
expiresAt > currentTime
```

A revoked or expired key must not authenticate data-plane requests.

---

## 7.5 API Key Indexes

Required:

```text
index:
projectId
```

Required for lookup:

```text
index:
keyHash
```

Recommended:

```text
compound index:
projectId + revokedAt
```

---

# 8. Shards Collection

Collection:

```text
shards
```

A shard represents a customer-owned MongoDB database that ShardFlow can connect to.

---

## 8.1 Shard Schema

```text
Shard
├── _id
├── projectId
├── name
├── connectionSecretReference
├── status
├── healthStatus
├── lastHealthCheckAt
├── lastSuccessfulHealthCheckAt
├── createdAt
└── updatedAt
```

---

## 8.2 Fields

| Field                         | Type          | Required | Description                                   |
| ----------------------------- | ------------- | -------: | --------------------------------------------- |
| `_id`                         | ObjectId      |      Yes | Shard identifier                              |
| `projectId`                   | ObjectId      |      Yes | Owning project                                |
| `name`                        | String        |      Yes | Human-readable shard name                     |
| `connectionSecretReference`   | String/Object |      Yes | Reference to protected connection credentials |
| `status`                      | String        |      Yes | Administrative state                          |
| `healthStatus`                | String        |      Yes | Current health state                          |
| `lastHealthCheckAt`           | Date          |       No | Last health-check attempt                     |
| `lastSuccessfulHealthCheckAt` | Date          |       No | Last successful check                         |
| `createdAt`                   | Date          |      Yes | Creation timestamp                            |
| `updatedAt`                   | Date          |      Yes | Last update timestamp                         |

---

# 9. Connection Secret Handling

Shard connection information is sensitive.

A shard document should not contain an exposed plaintext MongoDB connection string unless the selected secret-management implementation explicitly provides secure encryption at rest.

The preferred model is:

```text
Shard
 |
 +-- connectionSecretReference
          |
          v
     Secret Storage
          |
          v
 MongoDB Connection URI
```

The exact secret-storage implementation is an infrastructure decision and should be isolated behind a secret-management abstraction.

---

# 10. Shard Status

Administrative status:

```text
ACTIVE
DISABLED
```

A disabled shard must not receive new data-plane requests.

---

# 11. Shard Health Status

Operational health:

```text
UNKNOWN
HEALTHY
DEGRADED
UNHEALTHY
```

These represent health rather than administrative status.

Therefore:

```text
status != healthStatus
```

Example:

```text
status: ACTIVE
healthStatus: UNHEALTHY
```

This means the shard is configured and enabled but currently unavailable or unhealthy.

---

# 12. Shard Indexes

Required:

```text
index:
projectId
```

Recommended:

```text
compound index:
projectId + status
```

Shard names should be unique within a project if that is maintained as the V1 naming rule.

---

# 13. Routing Configurations Collection

Collection:

```text
routingConfigs
```

A routing configuration defines how ShardFlow determines the shard for a request.

---

## 13.1 Routing Configuration Schema

```text
RoutingConfig
├── _id
├── projectId
├── strategy
├── routingKey
├── createdAt
└── updatedAt
```

---

## 13.2 Fields

| Field        | Type     | Required | Description                    |
| ------------ | -------- | -------: | ------------------------------ |
| `_id`        | ObjectId |      Yes | Configuration identifier       |
| `projectId`  | ObjectId |      Yes | Owning project                 |
| `strategy`   | String   |      Yes | Routing strategy               |
| `routingKey` | String   |      Yes | Request field used for routing |
| `createdAt`  | Date     |      Yes | Creation timestamp             |
| `updatedAt`  | Date     |      Yes | Last update timestamp          |

---

# 14. V1 Routing Strategy

V1 supports:

```text
strategy = tenant
routingKey = tenantId
```

The routing flow is:

```text
tenantId
    |
    v
tenantShardMappings
    |
    v
shardId
```

---

## 14.1 Routing Configuration Example

```json
{
  "projectId": "...",
  "strategy": "tenant",
  "routingKey": "tenantId"
}
```

---

## 14.2 Routing Config Constraint

V1 should maintain one active routing configuration per project.

Recommended index:

```text
unique:
projectId
```

---

# 15. Tenant-Shard Mappings Collection

Collection:

```text
tenantShardMappings
```

This collection is one of the most important pieces of ShardFlow's routing system.

It establishes:

```text
tenantId -> shardId
```

---

## 15.1 Schema

```text
TenantShardMapping
├── _id
├── projectId
├── tenantId
├── shardId
├── createdAt
└── updatedAt
```

---

## 15.2 Fields

| Field       | Type     | Required | Description                |
| ----------- | -------- | -------: | -------------------------- |
| `_id`       | ObjectId |      Yes | Mapping identifier         |
| `projectId` | ObjectId |      Yes | Owning project             |
| `tenantId`  | String   |      Yes | Customer tenant identifier |
| `shardId`   | ObjectId |      Yes | Target shard               |
| `createdAt` | Date     |      Yes | Creation timestamp         |
| `updatedAt` | Date     |      Yes | Last update timestamp      |

---

# 16. Tenant Mapping Invariant

For a project:

> A tenant must have at most one active shard mapping.

Example:

```text
project_1
tenant_123 -> shard_1
```

The following must not exist simultaneously:

```text
tenant_123 -> shard_1
tenant_123 -> shard_2
```

unless V1 later introduces an explicit migration/versioning model.

---

# 17. Tenant Mapping Index

Required:

```text
unique compound index:
projectId + tenantId
```

This provides deterministic routing.

---

# 18. Shard Reference Validation

When creating or updating a tenant mapping, the target shard must:

1. Exist.
2. Belong to the same project.
3. Be eligible to receive mappings.

The application must not be able to create:

```text
project_A
   |
tenant_1 -> shard belonging to project_B
```

---

# 19. Health Events Collection

Collection:

```text
healthEvents
```

Health events record significant shard health transitions and checks.

---

## 19.1 Schema

```text
HealthEvent
├── _id
├── projectId
├── shardId
├── status
├── latency
├── error
├── createdAt
```

---

## 19.2 Fields

| Field       | Type          | Required | Description                   |
| ----------- | ------------- | -------: | ----------------------------- |
| `_id`       | ObjectId      |      Yes | Event identifier              |
| `projectId` | ObjectId      |      Yes | Owning project                |
| `shardId`   | ObjectId      |      Yes | Related shard                 |
| `status`    | String        |      Yes | Health result                 |
| `latency`   | Number        |       No | Health-check latency          |
| `error`     | Object/Object |       No | Sanitized failure information |
| `createdAt` | Date          |      Yes | Event timestamp               |

---

# 20. Health Event Design

Health events should record meaningful operational events rather than creating unbounded noisy records for every successful check unless that behavior is intentionally required.

Important events include:

```text
SHARD_HEALTHY
SHARD_DEGRADED
SHARD_UNHEALTHY
SHARD_RECOVERED
```

The exact event-generation frequency is an implementation decision.

---

# 21. Health Event Retention

Health events can grow continuously.

V1 should define a retention policy before production deployment.

Possible future approach:

```text
Recent health events
        |
        v
MongoDB
        |
        v
TTL / archival policy
```

The exact retention period should be configured rather than hard-coded into application logic.

---

# 22. Audit Logs Collection

Collection:

```text
auditLogs
```

Audit logs record important administrative actions.

---

## 22.1 Schema

```text
AuditLog
├── _id
├── projectId
├── actorId
├── action
├── resourceType
├── resourceId
├── metadata
└── createdAt
```

---

## 22.2 Fields

| Field          | Type            | Required | Description                      |
| -------------- | --------------- | -------: | -------------------------------- |
| `_id`          | ObjectId        |      Yes | Audit event identifier           |
| `projectId`    | ObjectId        |      Yes | Related project                  |
| `actorId`      | ObjectId        |      Yes | User who performed the action    |
| `action`       | String          |      Yes | Action identifier                |
| `resourceType` | String          |      Yes | Resource type                    |
| `resourceId`   | ObjectId/String |       No | Related resource                 |
| `metadata`     | Object/Object   |       No | Sanitized contextual information |
| `createdAt`    | Date            |      Yes | Event timestamp                  |

---

# 23. Audit Actions

Initial actions include:

```text
PROJECT_CREATED

API_KEY_CREATED
API_KEY_REVOKED

SHARD_CREATED
SHARD_UPDATED
SHARD_DISABLED
SHARD_DELETED

ROUTING_CONFIG_UPDATED

TENANT_MAPPING_CREATED
TENANT_MAPPING_UPDATED
TENANT_MAPPING_DELETED
```

Sensitive credentials must never be included in audit metadata.

---

# 24. Audit Log Indexes

Required:

```text
index:
projectId
```

Recommended:

```text
compound index:
projectId + createdAt
```

---

# 25. Relationships

The main relationships are:

```text
User
 |
 +----< Project
           |
           +----< ApiKey
           |
           +----< Shard
           |
           +------ RoutingConfig
           |
           +----< TenantShardMapping
           |
           +----< HealthEvent
           |
           +----< AuditLog
```

`<` represents one-to-many.

---

# 26. Ownership Model

## User → Project

One user can own multiple projects.

```text
User 1 ---- N Projects
```

---

## Project → API Keys

A project can have multiple API keys.

```text
Project 1 ---- N API Keys
```

---

## Project → Shards

A project can register multiple shards.

```text
Project 1 ---- N Shards
```

---

## Project → Tenant Mappings

A project can contain many tenant mappings.

```text
Project 1 ---- N TenantShardMappings
```

---

## Project → Health Events

A project can have many health events.

```text
Project 1 ---- N HealthEvents
```

---

## Project → Audit Logs

A project can have many audit records.

```text
Project 1 ---- N AuditLogs
```

---

# 27. Referential Integrity

MongoDB does not automatically enforce relational foreign keys.

Therefore application-level validation must enforce:

```text
project.ownerId -> users._id

apiKey.projectId -> projects._id

shard.projectId -> projects._id

routingConfig.projectId -> projects._id

tenantShardMapping.projectId -> projects._id

tenantShardMapping.shardId -> shards._id

healthEvent.projectId -> projects._id

healthEvent.shardId -> shards._id

auditLog.projectId -> projects._id

auditLog.actorId -> users._id
```

---

# 28. Cross-Project Isolation

All project-owned resources must be scoped by `projectId`.

For example:

```text
GET shard_123
```

must not simply query:

```text
shards.findOne({
  _id: shardId
})
```

without validating project ownership.

The effective lookup should be conceptually:

```text
shards.findOne({
  _id: shardId,
  projectId: currentProjectId
})
```

This principle applies throughout the control plane.

---

# 29. Data Plane Metadata Lookup

A typical data-plane routing lookup is:

```text
API Key
   |
   v
ApiKey
   |
   v
Project
   |
   v
TenantShardMapping
   |
   v
Shard
   |
   v
Connection Secret
```

Conceptually:

```text
keyHash
   |
   v
projectId
   |
   v
tenantId + projectId
   |
   v
shardId
   |
   v
connection
```

---

# 30. Database Operation Metadata

Customer application data does not need a corresponding ShardFlow document.

For example, if a customer sends:

```text
find users where status = active
```

ShardFlow does not copy those users into its own database.

Instead:

```text
Request
   |
   v
Resolve tenant
   |
   v
Resolve shard
   |
   v
Execute against customer MongoDB
```

The customer database remains the source of truth.

---

# 31. Customer Database Schema Ownership

ShardFlow must not assume a universal customer schema.

The customer may have:

```text
users
orders
products
```

or:

```text
accounts
transactions
events
```

ShardFlow's responsibility is to route and execute supported operations, not define application collections.

---

# 32. MongoDB Driver Boundary

Customer database access must happen through the official MongoDB driver.

The execution layer receives validated data such as:

```text
collection
filter
document
update
options
```

and converts it into the corresponding MongoDB driver call.

Arbitrary JavaScript or MongoDB commands must never be passed through the public API.

---

# 33. Metadata Database vs Customer Database

This distinction must remain explicit in code.

```text
MetadataRepository
        |
        v
ShardFlow MongoDB


CustomerDatabaseExecutor
        |
        v
Customer MongoDB
```

A control-plane repository must never accidentally execute against a customer shard.

Similarly, data-plane operations must not accidentally write application data into the metadata database.

---

# 34. Transactions

V1 does not require distributed transactions.

Cross-shard transactions are explicitly unsupported.

A transaction involving:

```text
Shard 1
+
Shard 2
```

must not be exposed through the V1 public API.

---

# 35. Data Migration

V1 does not automatically move customer data between shards.

Changing:

```text
tenant_123 -> shard_1
```

to:

```text
tenant_123 -> shard_2
```

does not automatically move the underlying data.

Any future migration system must separately define:

* data-copy process;
* consistency guarantees;
* cutover;
* rollback;
* verification;
* mapping transition.

---

# 36. Deletion Rules

Deletion must respect dependencies.

For example, a shard with active tenant mappings should not be silently deleted.

Conceptually:

```text
Shard
 |
 +-- active tenant mappings?
       |
       +-- YES -> reject deletion
       |
       +-- NO -> deletion allowed
```

The exact deletion behavior should be represented through explicit application errors.

---

# 37. Soft Delete vs Hard Delete

V1 should use explicit status fields where operational history matters.

Examples:

```text
Project
status = DISABLED

Shard
status = DISABLED

API Key
revokedAt = timestamp
```

Audit records should remain available after administrative resources are disabled or revoked.

Hard deletion should be used cautiously for resources that participate in audit or historical records.

---

# 38. Timestamps

Core collections should use:

```text
createdAt
updatedAt
```

Event collections such as:

```text
healthEvents
auditLogs
```

primarily require:

```text
createdAt
```

All timestamps should be stored in UTC.

---

# 39. Identifier Strategy

MongoDB `ObjectId` is the default internal identifier for ShardFlow resources.

Examples:

```text
User._id
Project._id
ApiKey._id
Shard._id
RoutingConfig._id
TenantShardMapping._id
HealthEvent._id
AuditLog._id
```

Customer-provided tenant identifiers remain strings:

```text
tenantId: "tenant_123"
```

---

# 40. Sensitive Data Rules

The following must never appear in normal API responses:

```text
MongoDB connection strings
MongoDB passwords
database credentials
Brevo credentials
Supabase service credentials
API key hashes
internal secret references where disclosure is unsafe
```

API responses should return only the metadata required by the client.

---

# 41. Database Index Strategy

Initial important indexes:

```text
users
  unique(supabaseUserId)
  index(email)

projects
  index(ownerId)

apiKeys
  index(projectId)
  index(keyHash)

shards
  index(projectId)

routingConfigs
  unique(projectId)

tenantShardMappings
  unique(projectId, tenantId)

healthEvents
  index(projectId)
  index(shardId)
  index(createdAt)

auditLogs
  index(projectId)
  index(createdAt)
```

Indexes should be validated against actual query patterns during implementation.

Do not add indexes simply because a field exists.

---

# 42. Query Patterns

Important metadata queries include:

### User lookup

```text
supabaseUserId -> User
```

### Project lookup

```text
ownerId -> Projects
```

### API key lookup

```text
keyHash -> ApiKey
```

### Shard lookup

```text
projectId -> Shards
```

### Routing lookup

```text
projectId + tenantId -> TenantShardMapping
```

### Health lookup

```text
projectId + shardId -> HealthEvents
```

### Audit lookup

```text
projectId + createdAt -> AuditLogs
```

---

# 43. Routing Lookup Performance

The most performance-sensitive metadata lookup is:

```text
projectId + tenantId
```

Therefore:

```text
unique(projectId, tenantId)
```

must be indexed.

This allows the data plane to resolve:

```text
tenantId -> shardId
```

efficiently.

---

# 44. API Key Lookup Performance

API-key authentication is part of every data-plane request.

Therefore the API-key lookup must be indexed:

```text
keyHash
```

The lookup should return the minimum required metadata for authorization and routing.

---

# 45. Connection Metadata

The metadata database stores references/configuration for customer connections.

The actual connection should be managed by the connection manager.

Conceptually:

```text
Shard Document
     |
     v
Secret Reference
     |
     v
Secret Resolution
     |
     v
Connection Manager
     |
     v
MongoDB Pool
```

The metadata database must not be used as a connection pool.

---

# 46. Concurrency Considerations

Operations that modify routing metadata must consider concurrent updates.

Examples:

```text
tenant_123 -> shard_1
```

being changed while another request attempts:

```text
tenant_123 -> shard_2
```

V1 should ensure that the unique mapping constraint prevents duplicate active mappings.

Where atomicity is required, MongoDB atomic update operations should be used.

---

# 47. Metadata Consistency Requirements

The following must remain consistent:

```text
Project
  |
  +-- Shards
  |
  +-- Routing Config
  |
  +-- Tenant Mappings
```

A tenant mapping must never reference a shard belonging to another project.

A routing configuration must never reference an unsupported strategy.

An API key must never authenticate against a different project.

---

# 48. Database Backup Considerations

The ShardFlow metadata database contains infrastructure configuration and routing metadata.

Backups should protect against loss of:

```text
Projects
API Keys metadata
Shard configuration
Routing configuration
Tenant mappings
Audit records
Health history
```

Customer application databases remain responsible for their own data backups unless a future ShardFlow feature explicitly provides backup services.

---

# 49. Database Failure Scenarios

## Metadata Database Unavailable

Potential effects:

* control-plane operations fail;
* new configuration changes fail;
* routing metadata may become unavailable;
* API-key lookup may fail depending on caching strategy.

V1 should prioritize correctness over continuing with unknown routing state.

---

## Customer Shard Unavailable

Effects:

* requests routed to that shard may fail;
* shard health becomes unhealthy;
* administrator is notified;
* other healthy shards remain operational.

---

# 50. V1 Database Invariants

The following invariants must always hold:

1. Every ShardFlow user maps to one valid Supabase identity.
2. ShardFlow does not store user passwords.
3. Every project has a valid owner.
4. Every API key belongs to exactly one project.
5. API keys are not stored in plaintext.
6. Every shard belongs to exactly one project.
7. Every routing configuration belongs to exactly one project.
8. A project has at most one active V1 routing configuration.
9. Every tenant mapping belongs to exactly one project.
10. Every tenant mapping references a shard belonging to the same project.
11. A project cannot have duplicate active mappings for the same tenant.
12. Health events reference valid project/shard relationships.
13. Audit events reference the appropriate project/resource context.
14. Customer application data is not stored in the metadata database.
15. Customer connection credentials are never exposed through normal API responses.
16. Cross-project resource access is rejected.
17. Routing metadata must resolve a tenant deterministically.
18. Database operation execution happens only against the resolved customer shard.
19. Unsupported MongoDB operations/operators are rejected before execution.
20. Metadata database failures must not cause unsafe cross-shard routing.

---

# 51. Example Metadata State

A simple V1 project could look like:

```text
Project
  |
  +-- projectId: P1
  |
  +-- API Keys
  |     |
  |     +-- key_1
  |
  +-- Shards
  |     |
  |     +-- shard_1
  |     +-- shard_2
  |     +-- shard_3
  |
  +-- Routing
  |     |
  |     +-- strategy: tenant
  |     +-- routingKey: tenantId
  |
  +-- Tenant Mappings
  |     |
  |     +-- tenant_001 -> shard_1
  |     +-- tenant_002 -> shard_1
  |     +-- tenant_003 -> shard_2
  |     +-- tenant_004 -> shard_3
```

A request for:

```text
tenant_003
```

resolves to:

```text
P1
 |
 +-- tenant_003
        |
        v
     shard_2
```

---

# 52. Related Documents

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
└── engineering-decisions/
```

Responsibilities:

```text
PRD
 -> Product requirements

Architecture
 -> System structure and boundaries

Database
 -> Metadata schema and persistence rules

API
 -> External API contract

Error Contract
 -> Error representation

Rules
 -> Engineering constraints

Memory
 -> Decision/context history

Task
 -> Implementation progress
```

---

# 53. Final Database Principle

ShardFlow's metadata database exists to answer:

> **How should ShardFlow operate its infrastructure?**

Customer MongoDB shards answer:

> **Where is the customer's application data?**

The separation is fundamental:

```text
              ShardFlow Metadata
                     |
          "How do we route?"
                     |
                     v
              Routing Metadata
                     |
                     v
              Customer Shard
                     |
          "What is the data?"
                     |
                     v
          Customer Application Data
```

ShardFlow manages the infrastructure metadata.

The customer remains the owner of application data.
