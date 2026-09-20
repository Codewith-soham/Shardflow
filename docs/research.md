# ShardFlow — Product Research & V1 Discovery

> Research and product-discovery document for ShardFlow.  
> Status: Draft / V1 Discovery  
> Last updated: 2026-09-20

---

## 1. Executive Summary

ShardFlow is envisioned as a database infrastructure layer that sits between an application and multiple database shards.

The original idea was to build a service that could accept database requests, determine which database has capacity, route requests to that database, and maintain an ID-to-database mapping for future reads.

Research shows that database routing, sharding, connection management, failover, and distributed databases are already mature problem areas with existing solutions such as MongoDB Atlas, Vitess, Citus, CockroachDB, ProxySQL, and PgBouncer.

Therefore, ShardFlow should **not** be positioned simply as "another database sharding system" or "a database proxy."

The current product thesis is:

> **ShardFlow is a database infrastructure layer for multi-tenant applications that need to operate across multiple MongoDB shards. It provides a centralized control plane for managing shards and a data plane for routing application requests, managing database connections, and monitoring shard health. Application data remains in the customer's databases while ShardFlow manages the infrastructure required to interact with those databases.**

The strongest V1 direction identified during research is:

- MongoDB only
- Multi-tenant SaaS as the primary workload
- Tenant-aware routing
- Customer-owned / externally hosted databases
- Centralized shard management
- Connection management
- Health monitoring
- Basic failure detection
- Dashboard/control plane
- Avoid distributed transactions, automatic data migration, cross-shard joins, and automatic rebalancing in V1

---

# 2. Original Problem / Idea

The initial ShardFlow concept was motivated by the idea of managing multiple MongoDB Atlas databases or database nodes.

Conceptually:

```text
Client Application
        |
        v
    ShardFlow
        |
   +----+----+----+
   |    |    |    |
  DB1  DB2  DB3  ...
```

The initial responsibilities considered for ShardFlow included:

- Accepting database requests
- Selecting a database/shard
- Managing multiple database connections
- Checking database capacity
- Maintaining an ID -> database mapping
- Reading data from the correct database
- Monitoring database health
- Detecting failures
- Providing failover capabilities
- Providing a dashboard for project administrators
- Allowing developers to register database connection strings
- Providing an API key for application integration

The product was initially thought of partly as a way to abstract database management and avoid application developers having to directly manage multiple database connections.

---

# 3. Important Product Correction: Capacity Is Not Enough

A major conclusion from the research is that ShardFlow cannot simply choose whichever database currently has the most free capacity.

For example:

```text
DB1 = 70% capacity
DB2 = 40% capacity
DB3 = 20% capacity
```

It is not necessarily correct to send the next request to DB3.

If:

```text
User 123 -> DB1
```

then:

```text
GET User 123
```

must continue to reach DB1 unless the data has been replicated or migrated elsewhere.

Therefore:

> **ShardFlow needs a deterministic data-placement and routing strategy, not just capacity-based load balancing.**

This is one of the most important architectural conclusions from the research.

---

# 4. Target Customer

The initial target customer should be narrow.

### Proposed ICP

> **Small engineering teams building multi-tenant SaaS applications that are beginning to outgrow a single MongoDB database and need to distribute tenants across multiple database instances.**

Potential characteristics:

- SaaS application
- Multiple tenants/customers
- MongoDB-based backend
- Growing traffic or data
- Multiple database instances
- Small-to-medium engineering team
- Team does not want database topology and routing logic spread throughout application code

ShardFlow is not intended initially for:

- Every developer
- Every database workload
- Large enterprises
- Arbitrary database engines
- Massive-scale distributed transactions

---

# 5. Core User Problem

The problem is not simply:

> "My database is getting large."

Existing database technologies already address scaling.

The more specific problem is:

> **"I have multiple database instances, but managing database topology, routing, connections, and failures inside my application is becoming infrastructure work."**

Without an infrastructure layer, an application may need:

```text
Application
|
+-- DB_CONNECTION_1
+-- DB_CONNECTION_2
+-- DB_CONNECTION_3
|
+-- Shard mapping
+-- Routing logic
+-- Connection management
+-- Health checks
+-- Retry logic
+-- Failure handling
```

This infrastructure can leak into application/business logic.

---

# 6. Existing Approaches / Alternatives

A developer currently has several options.

## 6.1 Build it themselves

The team can implement:

- Shard registry
- Routing logic
- Connection pools
- Health checks
- Failover logic
- Data placement
- Monitoring

### Advantage

Maximum control.

### Problem

High engineering and operational complexity.

---

## 6.2 Use database-native sharding

Examples:

- MongoDB sharding
- Vitess for MySQL
- Citus for PostgreSQL

### Advantage

Mature database-specific solutions.

### Problem

The team adopts the database's distributed architecture and operational model.

---

## 6.3 Use a distributed database

Example:

- CockroachDB

The database itself handles distribution and replication.

### Advantage

The developer does not directly manage individual shards.

### Problem

The team adopts a different database technology instead of keeping independently hosted databases.

---

## 6.4 Use database proxies / infrastructure components

Examples:

- ProxySQL
- PgBouncer

These can provide connection management, routing, pooling, and related infrastructure functionality.

### Problem

They solve parts of the infrastructure problem but are not necessarily designed around the full ShardFlow control-plane experience.

---

# 7. Competitive Landscape

ShardFlow overlaps with multiple categories rather than one direct competitor category.

| Technology | Primary Purpose | Sharding | Routing | Connection Management | Health / Operations | BYO Databases |
|---|---|---:|---:|---:|---:|---:|
| MongoDB Atlas | Managed MongoDB | Yes | Yes | Yes | Yes | Limited |
| Vitess | MySQL scaling | Yes | Yes | Yes | Yes | Yes / self-managed |
| Citus | Distributed PostgreSQL | Yes | Yes | Yes | Yes | Yes / self-managed |
| CockroachDB | Distributed SQL database | Automatic | Yes | Yes | Yes | No |
| ProxySQL | MySQL proxy | Partial | Yes | Yes | Yes | Yes |
| PgBouncer | PostgreSQL connection pooling | No | Limited | Yes | Limited | Yes |
| **ShardFlow V1** | DB infrastructure/control layer | Yes* | Yes | Yes | Yes | **Yes** |

\* ShardFlow V1 should use explicit tenant-aware routing rather than attempting fully automatic sharding.

---

# 8. Competitor Analysis

## 8.1 MongoDB Atlas

MongoDB already supports sharded clusters and query routing through `mongos`.

Conceptually:

```text
Application
     |
     v
  mongos
     |
 +---+---+---+
 |   |   |   |
DB1 DB2 DB3 ...
```

MongoDB can route queries based on shard-key information and supports sharded cluster management through Atlas.

### Implication for ShardFlow

ShardFlow should **not** position itself as:

> "MongoDB sharding made easier."

MongoDB already provides this functionality.

---

## 8.2 Vitess

Vitess is an important architectural reference.

Conceptually:

```text
Application
     |
     v
  VTGate
     |
 +---+---+---+
 |   |   |   |
DB1 DB2 DB3
```

Vitess provides query routing, shard management, connection management, and other distributed database infrastructure.

### Implication

Vitess validates the idea that a routing/data-plane layer between an application and database shards is technically useful.

However, ShardFlow should not simply become "Vitess for MongoDB."

---

## 8.3 Citus

Citus distributes PostgreSQL workloads across multiple nodes and has strong support for multi-tenant SaaS patterns.

Example:

```text
Tenant A -> Worker 1
Tenant B -> Worker 1
Tenant C -> Worker 2
Tenant D -> Worker 3
```

### Implication

Tenant-aware routing is a legitimate distributed-database use case.

This strengthens the decision to investigate multi-tenant SaaS as ShardFlow's V1 workload.

---

## 8.4 CockroachDB

CockroachDB takes a different approach: instead of making the developer manage individual shards, it provides a distributed database that automatically handles data distribution and replication.

### Implication

CockroachDB is an alternative to the entire problem ShardFlow addresses.

ShardFlow's distinction must therefore be:

> Keep your existing databases and infrastructure; ShardFlow provides the management/routing layer around them.

---

## 8.5 ProxySQL

ProxySQL is an important adjacent competitor because it already provides database proxying, connection management, routing, and failover-related functionality for MySQL.

### Implication

"Database proxy" alone is not a sufficiently differentiated product definition.

---

## 8.6 PgBouncer

PgBouncer primarily solves PostgreSQL connection pooling.

### Implication

Connection management is an established infrastructure problem and should be considered one component of ShardFlow rather than the product's entire value proposition.

---

# 9. Potential Differentiation

The most promising differentiation identified is:

> **Bring your own databases.**

Instead of asking the customer to move to a new database platform:

```text
"Move your database to ShardFlow."
```

ShardFlow should aim toward:

```text
"Keep your databases where they are.
Let ShardFlow manage how your application interacts with them."
```

For example:

```text
Application
     |
     v
 ShardFlow
     |
 +---+---+---+
 |   |   |   |
DB1 DB2 DB3
```

The customer owns and operates the underlying database infrastructure.

ShardFlow manages:

- Routing
- Shard metadata
- Connection management
- Health
- Configuration
- Monitoring
- Application-facing abstraction

---

# 10. Control Plane vs Data Plane

This distinction should be fundamental to ShardFlow's architecture.

## 10.1 Control Plane

The control plane is the management side.

```text
ShardFlow Dashboard

Project
|
+-- API Keys
+-- Shards
|   +-- DB 1
|   +-- DB 2
|   +-- DB 3
|
+-- Routing Configuration
+-- Health
+-- Metrics
+-- Alerts
```

Responsibilities:

- User management
- Project management
- API key management
- Shard registration
- Shard configuration
- Routing configuration
- Health state
- Notifications
- Metadata

---

## 10.2 Data Plane

The data plane handles application traffic.

```text
Application
     |
     v
ShardFlow
     |
     +-- Authenticate
     +-- Extract routing information
     +-- Resolve shard
     +-- Acquire connection
     +-- Execute operation
     +-- Return result
```

The data plane is the technically difficult portion of the system.

---

# 11. V1 Product Thesis

The current V1 thesis is:

> **ShardFlow is a database infrastructure layer for multi-tenant applications that need to operate across multiple MongoDB shards. It provides a centralized control plane for managing shards and a data plane for routing application requests, managing database connections, and monitoring shard health. Application data remains in the customer's databases while ShardFlow manages the infrastructure required to interact with those databases.**

Short version:

> **One database interface. Multiple shards. Zero topology management in your application.**

This is a working thesis and should be validated further before being treated as final product positioning.

---

# 12. V1 Use Case

Use a concrete example:

```text
SaaS application
1,000 tenants
3 MongoDB shards
```

Example placement:

```text
Tenant A -> Shard 1
Tenant B -> Shard 1
Tenant C -> Shard 2
Tenant D -> Shard 3
```

A request contains:

```text
tenantId = tenant_C
```

ShardFlow resolves:

```text
tenant_C -> Shard 2
```

and routes the request there.

The application does not need to maintain the full shard topology.

---

# 13. Proposed V1 User Journey

## Step 1 — Create account

```text
Developer
   |
   v
Create ShardFlow account
```

## Step 2 — Create project

Example:

```text
my-saas
```

## Step 3 — Generate API key

Example:

```text
SHARDFLOW_API_KEY=...
```

## Step 4 — Register shards

```text
Shard 1
MongoDB connection string

Shard 2
MongoDB connection string

Shard 3
MongoDB connection string
```

## Step 5 — Configure routing

Example:

```text
Routing key = tenantId
```

## Step 6 — Maintain shard map

```text
tenant_A -> shard_1
tenant_B -> shard_1
tenant_C -> shard_2
tenant_D -> shard_3
```

## Step 7 — Application sends requests

```text
Application
     |
     v
ShardFlow
     |
     v
Correct shard
```

## Step 8 — Monitoring

Dashboard displays:

```text
Shard 1    HEALTHY     34ms
Shard 2    HEALTHY     42ms
Shard 3    DEGRADED   190ms
```

## Step 9 — Failure detection

If Shard 2 becomes unavailable:

```text
Health check
     |
     v
Shard 2 DOWN
     |
     +-- Mark unhealthy
     +-- Stop new traffic where appropriate
     +-- Notify administrator
```

Important:

> Failure detection does not automatically mean data can be moved to another shard.

If the data only exists on Shard 2, blindly rerouting requests to Shard 3 would be incorrect.

---

# 14. Recommended V1 Routing Strategy

Do not begin with completely automatic data distribution.

Start with:

> **Explicit tenant-aware routing.**

Example:

```text
Routing key = tenantId
```

ShardFlow maintains:

```text
tenant_A -> shard_1
tenant_B -> shard_1
tenant_C -> shard_2
tenant_D -> shard_3
```

A request:

```text
tenantId = tenant_C
```

becomes:

```text
Request
   |
   v
ShardFlow
   |
   v
Tenant -> Shard lookup
   |
   v
Shard 2
```

This is deterministic and much easier to reason about.

---

# 15. V1 Features

| Feature | V1 |
|---|---:|
| User authentication | Yes |
| Projects | Yes |
| API keys | Yes |
| Register shards | Yes |
| Remove/manage shards | Yes |
| Health checks | Yes |
| Request routing | Yes |
| Connection pooling/management | Yes |
| Tenant-based routing | Yes |
| Basic metrics | Yes |
| Notifications | Yes |
| Failure detection | Yes |
| Automatic data migration | No |
| Distributed transactions | No |
| Cross-shard joins | No |
| Automatic rebalancing | No |
| Multiple database engines | No |
| SQL parsing | No |
| Full database protocol compatibility | Not initially |

---

# 16. Explicitly Out of Scope for V1

## Automatic data migration

Do not initially move data between shards automatically.

Example:

```text
Shard 1 -> Shard 2
```

Data movement introduces significant consistency and failure-handling complexity.

---

## Distributed transactions

Avoid transactions spanning:

```text
Shard 1
+
Shard 2
+
Shard 3
```

in V1.

---

## Cross-shard joins

Avoid operations such as:

```text
Shard 1 JOIN Shard 2
```

---

## Automatic rebalancing

Do not initially attempt to automatically transform:

```text
Shard 1 = 80%
Shard 2 = 20%
```

into:

```text
Shard 1 = 50%
Shard 2 = 50%
```

because rebalancing requires data movement and consistency mechanisms.

---

## Multiple database engines

V1 should focus on:

> **MongoDB only.**

Potential future engines:

```text
PostgreSQL
MySQL
...
```

but not in the initial implementation.

---

# 17. Technical Feasibility

A V1 implementation is technically feasible using a familiar backend stack:

```text
Node.js
Express
MongoDB
Mongoose
Docker
Redis (potentially later)
```

A high-level architecture:

```text
                         +------------------+
                         |    Dashboard     |
                         |                  |
                         | Projects         |
                         | API Keys         |
                         | Shards           |
                         | Routing          |
                         | Health           |
                         +--------+---------+
                                  |
                                  | Control API
                                  v
                    +-------------------------+
                    |       ShardFlow         |
                    |                         |
                    |      CONTROL PLANE      |
                    |                         |
                    | Project Service         |
                    | Shard Registry          |
                    | Routing Configuration   |
                    | API Key Service         |
                    | Health Monitoring       |
                    +------------+------------+
                                 |
                                 v
                         +---------------+
                         | ShardFlow DB  |
                         |   Metadata    |
                         +---------------+


Application
     |
     | Data request
     v
+---------------------------+
|     ShardFlow Data Plane  |
|                           |
| Authentication            |
| Routing                   |
| Connection Manager        |
| Health                    |
+-------------+-------------+
              |
        +-----+-----+-----+
        v           v     v
     MongoDB     MongoDB MongoDB
     Shard 1     Shard 2 Shard 3
```

---

# 18. Major Technical Challenges

## 18.1 Correct shard routing

The system must always route a request to the shard containing the required data.

This is the core correctness problem.

---

## 18.2 Data consistency

If data exists only on one shard, another shard cannot simply serve it when the first shard goes down.

---

## 18.3 Connection management

ShardFlow will need to maintain efficient reusable connections to multiple databases.

---

## 18.4 Failure detection

ShardFlow needs health checks and clear shard states such as:

```text
HEALTHY
DEGRADED
UNHEALTHY
UNKNOWN
```

---

## 18.5 Failover

Failover is only safe when an appropriate replica/standby contains the required data.

V1 should distinguish:

> **failure detection**

from:

> **automatic data failover.**

---

## 18.6 Security

Customers may provide database connection strings containing credentials.

Therefore ShardFlow will eventually need:

- Encryption at rest
- TLS
- Access controls
- Secure secret handling
- API key security
- Credential rotation
- Audit logging
- Network security

Raw database credentials should not be casually stored in plain text.

---

## 18.7 Performance

ShardFlow introduces an additional network and processing layer:

```text
Application
    |
    v
ShardFlow
    |
    v
Database
```

Therefore the system must minimize:

- Routing latency
- Connection overhead
- Serialization overhead
- Unnecessary network hops

---

# 19. Important Architectural Question: Application Interface

There are two possible approaches.

## Option A — SDK / API

```text
Application
     |
     v
ShardFlow SDK/API
     |
     v
ShardFlow
     |
     v
MongoDB
```

### Advantages

- Easier V1
- Easier to develop
- Easier to debug
- Clear request model

### Disadvantage

Developers have to use the ShardFlow API/SDK rather than their existing database driver directly.

---

## Option B — Database-compatible proxy

```text
Application
     |
     v
MongoDB Driver
     |
     v
ShardFlow
     |
     v
MongoDB shards
```

The application would believe it is communicating with MongoDB.

This provides a much stronger developer experience, but implementing a database-compatible proxy is significantly more difficult.

### Proposed path

```text
V1-A
Simple ShardFlow API/SDK
        |
        v
Prove routing
        |
        v
Prove connection management
        |
        v
Prove health monitoring
        |
        v
V1-B / Future
Database-protocol-compatible proxy
```

---

# 20. V1 Success Criteria

V1 should not be considered successful merely because the dashboard works.

## Functional correctness

```text
Application
    |
    v
ShardFlow
    |
    v
Correct shard
```

must work reliably.

## Routing correctness

Given:

```text
tenantId = tenant_123
```

ShardFlow must consistently resolve the correct shard.

## Connection management

ShardFlow should reuse database connections instead of creating a new connection for every request.

## Health monitoring

ShardFlow should detect an unhealthy shard within a defined interval.

## Topology abstraction

The application should not need to directly manage:

```text
DB_1_URL
DB_2_URL
DB_3_URL
```

for normal routing.

## Observability

The administrator should be able to answer:

> Where is my application's traffic going?

through the dashboard.

---

# 21. Potential ShardFlow Positioning

Current working positioning:

> **Keep your databases where they are. ShardFlow manages how your application interacts with them.**

Alternative technical description:

> **A database infrastructure layer for routing, connection management, shard configuration, and health monitoring across customer-managed database shards.**

Potential short product line:

> **One database interface. Multiple shards. Zero topology management in your application.**

These are working statements, not final marketing copy.

---

# 22. What ShardFlow Is Not

ShardFlow is not intended to be:

- A replacement for MongoDB
- A new database engine
- Another MongoDB Atlas
- A generic load balancer
- A simple connection pool
- A database hosting provider
- A distributed transaction engine
- An automatic data migration system
- A replacement for every database-specific sharding technology

The product should remain focused on the infrastructure layer between the application and customer-owned database shards.

---

# 23. Core Architectural Principle

The most important principle identified so far is:

> **Separate application data from ShardFlow metadata.**

Application data remains in customer databases.

ShardFlow stores only infrastructure metadata such as:

```text
Users
Projects
API keys
Shards
Shard health
Routing configuration
Tenant -> shard mappings
Operational metrics
```

Conceptually:

```text
Customer Data
      |
      v
Customer MongoDB shards


Infrastructure Metadata
      |
      v
ShardFlow metadata database
```

ShardFlow should not become the primary storage location for customer application data.

---

# 24. Product Risks

| Risk | Severity |
|---|---|
| Incorrect shard routing | High |
| Data consistency | High |
| Connection management | Medium |
| Shard failure handling | High |
| Data migration | High |
| Cross-shard queries | High |
| Database credential security | High |
| Proxy performance | High |
| Observability | Medium |
| Dashboard complexity | Low |

A key conclusion is:

> **The dashboard is not the technically difficult part. The data plane is.**

Engineering effort should therefore prioritize routing correctness, connection handling, failure behavior, and consistency.

---

# 25. Research Conclusions

The research produced several major conclusions.

### Conclusion 1

Database sharding is already a mature problem.

Existing technologies include:

- MongoDB
- Vitess
- Citus
- CockroachDB
- ProxySQL
- PgBouncer

Therefore ShardFlow must have a narrower problem definition.

### Conclusion 2

Capacity-based routing alone is not sufficient.

Data placement and deterministic routing are fundamental.

### Conclusion 3

Multi-tenant SaaS is a promising initial workload.

Tenant IDs provide a natural routing key:

```text
tenantId -> shard
```

### Conclusion 4

"Database proxy" is not enough differentiation.

The product needs a control-plane experience around shard management, routing configuration, health, and observability.

### Conclusion 5

"Bring your own database" is a promising direction.

The customer keeps their databases while ShardFlow provides the application-facing infrastructure layer.

### Conclusion 6

MongoDB should be the only database supported in V1.

This keeps the engineering scope manageable and allows the project to focus on distributed-system concepts.

### Conclusion 7

Automatic migration, distributed transactions, cross-shard joins, and automatic rebalancing should remain outside V1.

---

# 26. Proposed V1 Scope

```text
                    SHARDFLOW V1

                 +----------------+
                 |   Dashboard    |
                 +-------+--------+
                         |
                         v
                 +---------------+
                 | Control Plane |
                 +-------+-------+
                         |
              +----------+----------+
              |                     |
              v                     v
        Shard Registry        Health Monitor
              |
              v
         Routing Config


Application
     |
     v
+----------------+
|  Data Plane    |
|                |
| Authentication |
| Routing        |
| Connections    |
| Health         |
+-------+--------+
        |
   +----+----+----+
   v    v    v
  DB1  DB2  DB3

MongoDB only
Tenant-aware routing
Customer-owned databases
```

---

# 27. Next Product Discovery Step

Before implementation, validate one concrete scenario:

> **A SaaS application with 3 MongoDB shards and 1,000 tenants.**

Walk through:

```text
1. Tenant creation
2. Tenant -> shard assignment
3. Application request
4. Routing decision
5. Database connection
6. Query execution
7. Response
8. Health monitoring
9. Shard failure
10. Recovery / failover behavior
11. Dashboard state
12. Metadata stored by ShardFlow
```

If this scenario can be designed correctly, it becomes the foundation for:

- V1 architecture document
- Database design
- API specification
- Routing algorithm
- Control-plane services
- Data-plane services
- Error handling
- Testing strategy
- Implementation roadmap

---

# 28. Current Working Definition

> **ShardFlow is a database infrastructure layer that provides a centralized control plane and application-facing data plane for multi-tenant applications operating across multiple MongoDB shards. It manages shard configuration, tenant-aware routing, database connections, health monitoring, and infrastructure metadata while leaving application data in customer-owned databases.**

This is the current V1 product definition and should be treated as a hypothesis to validate during implementation rather than a final market claim.
