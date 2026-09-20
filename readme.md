# ShardFlow

> **A database infrastructure layer for applications that need simple, tenant-aware access to multiple MongoDB databases.**

ShardFlow sits between your application and your MongoDB infrastructure.

Instead of making your application directly manage multiple database connections, shard selection, connection pools, and database routing, ShardFlow provides a controlled API layer that handles these responsibilities for you.

```text
Your Application
       │
       ▼
   ShardFlow
       │
       ├── Authentication
       ├── Tenant Resolution
       ├── Shard Routing
       ├── Connection Management
       ├── Query Validation
       └── Health Monitoring
       │
       ▼
 MongoDB Shards
 ┌────────┬────────┬────────┐
 │ Shard 1│ Shard 2│ Shard 3│
 └────────┴────────┴────────┘
```

---

## Why ShardFlow?

As applications grow, database infrastructure can become increasingly difficult to manage.

Applications may eventually need to deal with:

* multiple MongoDB databases;
* tenant-to-database routing;
* connection pooling;
* database health;
* shard availability;
* database credentials;
* infrastructure-level monitoring;
* controlled database access.

Without an infrastructure layer, much of this logic ends up inside the application itself.

**ShardFlow aims to move this responsibility into a dedicated infrastructure layer.**

The application communicates with ShardFlow through a structured API, while ShardFlow handles the infrastructure-level database routing and connection management.

---

## What ShardFlow Does

At a high level, ShardFlow provides:

* 🔐 **Authentication** — Supabase-based user authentication for the Control Plane.
* 🔑 **API Keys** — secure application authentication for the Data Plane.
* 🗂️ **Project Management** — organize database infrastructure by project.
* 🗄️ **Shard Management** — register and manage MongoDB database shards.
* 🧭 **Tenant-Aware Routing** — map tenants to their designated MongoDB shard.
* 🔌 **Connection Management** — manage connections to customer MongoDB databases.
* 🩺 **Health Monitoring** — monitor shard availability and health.
* 🛡️ **Controlled Database Operations** — expose a defined set of MongoDB operations rather than arbitrary database commands.

---

# Architecture

ShardFlow is divided into two major planes.

```text
                    ShardFlow
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    Control Plane              Data Plane
          │                         │
          │                         │
          ▼                         ▼
   Infrastructure              Application
    Management                   Requests
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
                MongoDB Shards
```

### Control Plane

The Control Plane manages ShardFlow infrastructure.

It is responsible for things such as:

* users;
* projects;
* API keys;
* MongoDB shards;
* tenant mappings;
* routing configuration;
* shard health.

### Data Plane

The Data Plane is the application-facing API.

Applications send database requests to ShardFlow rather than directly managing the shard infrastructure.

The Data Plane:

```text
Request
   ↓
API Key Authentication
   ↓
Project Resolution
   ↓
Tenant Resolution
   ↓
Tenant → Shard Mapping
   ↓
Connection Manager
   ↓
MongoDB
   ↓
Controlled Response
```

---

# Tenant-Based Routing

ShardFlow V1 uses tenant-based routing.

The fundamental relationship is:

```text
Tenant
  │
  ▼
Tenant → Shard Mapping
  │
  ▼
MongoDB Shard
```

For example:

```text
tenant_001 → shard_1
tenant_002 → shard_1
tenant_003 → shard_2
tenant_004 → shard_3
```

The application does **not** directly choose a shard.

ShardFlow determines the destination based on the authenticated project and tenant mapping.

This creates a clear infrastructure boundary between the application and the underlying databases.

---

# Data Plane

ShardFlow V1 exposes a structured Data Plane API.

Example request:

```http
POST /api/v1/data
X-API-Key: <your-api-key>
```

```json
{
  "tenantId": "tenant_001",
  "operation": "find",
  "collection": "users",
  "filter": {
    "status": "active"
  },
  "options": {
    "limit": 20
  }
}
```

The request is validated and routed to the MongoDB shard associated with `tenant_001`.

### Supported Operations

V1 currently defines:

```text
find
find-one
insert-one
update-one
delete-one
```

ShardFlow intentionally does not expose arbitrary MongoDB command execution.

---

# Controlled MongoDB Access

One of the core principles of ShardFlow is that the Data Plane should **not become a raw MongoDB tunnel**.

MongoDB operators and options are explicitly allowlisted.

For example, supported filter operators include:

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

Supported update operators include:

```text
$set
$unset
$inc
$min
$max
$mul
```

This provides a controlled API boundary between applications and the database infrastructure.

---

# Technology Stack

ShardFlow V1 is being built with:

| Layer              | Technology           |
| ------------------ | -------------------- |
| Backend            | Node.js              |
| API                | Express.js           |
| Metadata Database  | MongoDB              |
| Customer Databases | MongoDB              |
| Authentication     | Supabase Auth        |
| Email              | Brevo                |
| API Format         | REST / JSON          |
| Frontend           | Planned              |
| Language           | JavaScript / Node.js |

The exact implementation may evolve as the project develops.

---

# Project Structure

```text
shardflow/
│
├── backend/
│   └── ...
│
├── frontend/
│   └── ...
│
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── error-contract.md
│   ├── error-codes.md
│   ├── rules.md
│   ├── memory.md
│   └── task.md
│
└── README.md
```

The `docs/` directory contains the engineering documentation used to guide the development of ShardFlow.

---

# V1 Scope

The initial version focuses on establishing the core infrastructure workflow:

```text
User
 ↓
Create Project
 ↓
Generate API Key
 ↓
Register MongoDB Shard
 ↓
Create Tenant → Shard Mapping
 ↓
Application Sends Request
 ↓
ShardFlow Authenticates
 ↓
ShardFlow Resolves Tenant
 ↓
ShardFlow Resolves Shard
 ↓
ShardFlow Connects to MongoDB
 ↓
Execute Permitted Operation
 ↓
Return Response
```

The goal of V1 is to prove this infrastructure loop reliably before expanding the platform.

---

# Currently Out of Scope

ShardFlow V1 intentionally does not attempt to solve everything.

The following are currently outside the V1 scope:

* arbitrary MongoDB commands;
* arbitrary aggregation pipelines;
* cross-shard queries;
* cross-shard transactions;
* automatic shard migration;
* automatic data rebalancing;
* client-controlled shard selection;
* arbitrary MongoDB operators;
* arbitrary MongoDB options;
* multi-region routing;
* MongoDB administration;
* Kubernetes-based orchestration.

These may be considered in future versions once the V1 foundation is stable.

---

# Development Status

🚧 **ShardFlow is currently under active development.**

The project is in the transition from architecture and API design into implementation.

Current focus:

```text
Documentation
     ✓
Architecture
     ✓
Database Design
     ✓
API Contract
     ✓
Error Contract
     ✓
     │
     ▼
Backend Foundation
     ↓
Control Plane
     ↓
Data Plane
     ↓
End-to-End V1
```

The repository is currently more useful as an engineering project and development workspace than as a production-ready service.

---

# Documentation

The `docs/` directory contains the project's engineering documentation.

Important documents include:

* **PRD** — product requirements and V1 scope.
* **Architecture** — system architecture and boundaries.
* **Database** — metadata and database design.
* **API** — public API contract.
* **Error Contract** — standard error response behavior.
* **Error Codes** — canonical error-code registry.
* **Rules** — engineering and implementation rules.
* **Memory** — persistent project decisions and context for future development.
* **Task** — implementation progress and current work.

If you are contributing to the project, read the relevant documentation before modifying architectural behavior.

---

# Design Philosophy

ShardFlow follows a few core principles.

### 1. Infrastructure should stay out of application code

Applications should not need to know how ShardFlow internally manages database connections and shard routing.

### 2. Routing should be deterministic

A tenant should resolve to its configured shard rather than being randomly or implicitly routed.

### 3. Database access should be controlled

The Data Plane exposes a defined API rather than unrestricted MongoDB access.

### 4. Security boundaries should be explicit

Authentication, authorization, project isolation, tenant isolation, and secret handling are treated as separate concerns.

### 5. V1 should remain focused

The first version is intended to prove the core infrastructure model before introducing advanced distributed-system features.

---

# Roadmap

The high-level development direction is:

```text
Phase 1
Project Foundation
      ↓
Phase 2
Control Plane
      ↓
Phase 3
Shard & Connection Management
      ↓
Phase 4
Tenant Routing
      ↓
Phase 5
Data Plane
      ↓
Phase 6
Health & Observability
      ↓
Phase 7
End-to-End V1
      ↓
Future
Scaling & Advanced Infrastructure
```

The detailed implementation plan is maintained in `docs/task.md`.

---

# Open Source

ShardFlow is being developed as an open-source project.

The goal is to explore how database infrastructure can be abstracted into a dedicated developer-facing platform while keeping the underlying architecture understandable and extensible.

---

# Contributing

Contributions are welcome once the initial V1 architecture stabilizes.

Before contributing:

1. Read the project documentation.
2. Understand the current V1 architecture.
3. Check `docs/task.md` for active work.
4. Avoid introducing features outside the current scope without discussion.
5. Update relevant documentation when changing an architectural decision.

---

# License

License information will be added as the project is prepared for public release.

---

## ShardFlow

**Build the infrastructure layer between your application and your databases.**

```text
Application
     ↓
  ShardFlow
     ↓
MongoDB Infrastructure
```
