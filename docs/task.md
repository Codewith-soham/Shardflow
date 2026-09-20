# ShardFlow V1 — API Contract

**Document:** API Specification
**Product:** ShardFlow
**Version:** V1.0
**Status:** Active / Implementation Contract
**Last Updated:** 2026-09-21

---

# 1. Purpose

This document defines the public HTTP API contract for ShardFlow V1.

It defines:

* API boundaries;
* authentication requirements;
* endpoint structure;
* request formats;
* response formats;
* supported Data Plane operations;
* permitted MongoDB operators/options;
* validation rules;
* resource ownership;
* versioning;
* API conventions.

This document is the source of truth for public API behavior.

---

# 2. API Architecture

ShardFlow exposes two logical API surfaces.

```text
                    ShardFlow API
                         |
              +----------+----------+
              |                     |
              v                     v
        Control Plane          Data Plane
              |                     |
        User/Admin APIs       Application APIs
              |                     |
        Supabase Auth          API Key
              |                     |
              v                     v
       ShardFlow Metadata      Customer MongoDB
```

---

# 3. Base URL

All V1 APIs are versioned under:

```text
/api/v1
```

Control Plane:

```text
/api/v1/...
```

Data Plane:

```text
/api/v1/data/...
```

The exact production host is environment-specific.

---

# 4. HTTP Conventions

ShardFlow uses standard HTTP methods:

| Method   | Purpose                                       |
| -------- | --------------------------------------------- |
| `GET`    | Retrieve resource(s)                          |
| `POST`   | Create resource / execute supported operation |
| `PATCH`  | Partially update resource                     |
| `DELETE` | Remove/revoke/disable resource where defined  |

JSON is the default request and response format.

Requests containing JSON must use:

```http
Content-Type: application/json
```

---

# 5. Authentication Model

ShardFlow has two authentication mechanisms.

## 5.1 Control Plane Authentication

Control Plane requests use:

```text
Supabase Auth
```

The backend validates the authenticated Supabase identity.

Conceptually:

```text
Client
  ↓
Supabase Auth
  ↓
Access Token
  ↓
ShardFlow API
  ↓
Authenticated User
```

---

## 5.2 Data Plane Authentication

Data Plane requests use a ShardFlow API key.

Header:

```http
X-API-Key: <api-key>
```

The API key identifies the ShardFlow project.

The API key does not directly identify a tenant.

Tenant identity is supplied separately according to the Data Plane request contract.

---

# 6. Authorization Model

Authentication and authorization are separate.

For Control Plane:

```text
Supabase User
    ↓
Project Ownership / Access
    ↓
Resource Access
```

For Data Plane:

```text
API Key
    ↓
Project
    ↓
Tenant
    ↓
Tenant → Shard Mapping
```

A valid credential does not grant unrestricted access.

---

# 7. Standard Success Response

Successful Control Plane responses use:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

`data` contains the endpoint-specific response.

---

# 8. Standard Error Response

Errors use the centralized ShardFlow error contract:

```json
{
  "success": false,
  "message": "Request failed",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

The complete error registry is defined in:

```text
error-contract.md
```

---

# 9. Resource Ownership

All project-owned resources are scoped to a project.

Examples:

```text
Project
API Key
Shard
Routing Configuration
Tenant Mapping
```

A resource ID must not be treated as sufficient authorization.

The server must verify:

```text
authenticated identity
        ↓
project ownership/access
        ↓
resource belongs to project
```

---

# 10. Control Plane API

The Control Plane manages ShardFlow infrastructure.

Initial V1 resources:

```text
users
projects
api-keys
shards
routing
tenant mappings
health
```

---

# 11. Authentication Endpoints

Authentication itself is handled by Supabase.

ShardFlow does not expose custom password login endpoints in V1.

The backend provides authenticated-user functionality where required.

## Get Current User

```http
GET /api/v1/me
```

### Authentication

```text
Supabase Auth required
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "supabaseUserId": "supabase_user_id",
    "email": "user@example.com"
  },
  "message": "User retrieved successfully"
}
```

---

# 12. Project APIs

## Create Project

```http
POST /api/v1/projects
```

### Authentication

Supabase Auth required.

### Request

```json
{
  "name": "My Application",
  "description": "Application database infrastructure"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "project_id",
    "name": "My Application",
    "description": "Application database infrastructure",
    "status": "ACTIVE"
  },
  "message": "Project created successfully"
}
```

---

## List Projects

```http
GET /api/v1/projects
```

### Authentication

Supabase Auth required.

### Response

```json
{
  "success": true,
  "data": {
    "projects": []
  },
  "message": "Projects retrieved successfully"
}
```

---

## Get Project

```http
GET /api/v1/projects/:projectId
```

### Authentication

Supabase Auth required.

### Authorization

The authenticated user must have access to the project.

---

## Update Project

```http
PATCH /api/v1/projects/:projectId
```

### Request

```json
{
  "name": "Updated Application",
  "description": "Updated description"
}
```

Only explicitly supported fields may be updated.

---

## Disable Project

```http
DELETE /api/v1/projects/:projectId
```

For V1 this represents project deactivation rather than necessarily physically deleting all associated infrastructure metadata.

---

# 13. API Key APIs

## Create API Key

```http
POST /api/v1/projects/:projectId/api-keys
```

### Authentication

Supabase Auth required.

### Request

```json
{
  "name": "Production Application",
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

`expiresAt` may be optional depending on the final implementation.

### Response

The raw API key is returned only during creation.

```json
{
  "success": true,
  "data": {
    "id": "api_key_id",
    "name": "Production Application",
    "key": "sf_live_xxxxxxxxxxxxxxxxx",
    "expiresAt": "2027-01-01T00:00:00.000Z"
  },
  "message": "API key created successfully"
}
```

The raw key must not be returned by later list/detail endpoints.

---

## List API Keys

```http
GET /api/v1/projects/:projectId/api-keys
```

### Response

```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "id": "api_key_id",
        "name": "Production Application",
        "status": "ACTIVE",
        "expiresAt": null,
        "lastUsedAt": null,
        "createdAt": "2026-09-21T00:00:00.000Z"
      }
    ]
  },
  "message": "API keys retrieved successfully"
}
```

Never return:

```text
raw key
key hash
```

---

## Revoke API Key

```http
DELETE /api/v1/projects/:projectId/api-keys/:apiKeyId
```

A revoked key must immediately become invalid for Data Plane authentication.

---

# 14. Shard APIs

A shard represents a customer MongoDB database connection managed by ShardFlow.

---

## Register Shard

```http
POST /api/v1/projects/:projectId/shards
```

### Authentication

Supabase Auth required.

### Request

The exact credential representation depends on the finalized secret-storage implementation.

Conceptually:

```json
{
  "name": "Shard 1",
  "connectionUri": "mongodb+srv://..."
}
```

Sensitive credentials must not be returned in normal API responses.

### Response

```json
{
  "success": true,
  "data": {
    "id": "shard_id",
    "name": "Shard 1",
    "status": "ACTIVE",
    "healthStatus": "UNKNOWN"
  },
  "message": "Shard registered successfully"
}
```

---

## List Shards

```http
GET /api/v1/projects/:projectId/shards
```

### Response

```json
{
  "success": true,
  "data": {
    "shards": [
      {
        "id": "shard_id",
        "name": "Shard 1",
        "status": "ACTIVE",
        "healthStatus": "HEALTHY",
        "lastHealthCheckAt": "2026-09-21T00:00:00.000Z"
      }
    ]
  },
  "message": "Shards retrieved successfully"
}
```

---

## Get Shard

```http
GET /api/v1/projects/:projectId/shards/:shardId
```

Connection credentials must never be returned.

---

## Update Shard

```http
PATCH /api/v1/projects/:projectId/shards/:shardId
```

Supported fields must be explicitly defined by the implementation.

Example:

```json
{
  "name": "Primary Shard"
}
```

---

## Disable Shard

```http
DELETE /api/v1/projects/:projectId/shards/:shardId
```

Disabling a shard does not automatically migrate customer data.

If active tenant mappings depend on the shard, the API must enforce the routing rules defined by the implementation.

---

# 15. Routing APIs

V1 uses tenant-based routing.

Core relationship:

```text
tenantId → shardId
```

---

# 16. Get Routing Configuration

```http
GET /api/v1/projects/:projectId/routing
```

### Response

```json
{
  "success": true,
  "data": {
    "strategy": "TENANT_BASED"
  },
  "message": "Routing configuration retrieved successfully"
}
```

---

# 17. Configure Routing

```http
PATCH /api/v1/projects/:projectId/routing
```

### Request

```json
{
  "strategy": "TENANT_BASED"
}
```

For V1, no arbitrary routing strategy should be accepted.

---

# 18. Tenant Mapping APIs

## Create Tenant Mapping

```http
POST /api/v1/projects/:projectId/tenant-mappings
```

### Request

```json
{
  "tenantId": "tenant_001",
  "shardId": "shard_id"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "mapping_id",
    "tenantId": "tenant_001",
    "shardId": "shard_id",
    "status": "ACTIVE"
  },
  "message": "Tenant mapping created successfully"
}
```

---

## List Tenant Mappings

```http
GET /api/v1/projects/:projectId/tenant-mappings
```

---

## Get Tenant Mapping

```http
GET /api/v1/projects/:projectId/tenant-mappings/:mappingId
```

---

## Update Tenant Mapping

```http
PATCH /api/v1/projects/:projectId/tenant-mappings/:mappingId
```

### Request

```json
{
  "shardId": "new_shard_id"
}
```

Changing a mapping does not automatically migrate existing customer data.

---

## Delete Tenant Mapping

```http
DELETE /api/v1/projects/:projectId/tenant-mappings/:mappingId
```

After deletion, requests for that tenant must not silently route to an arbitrary shard.

---

# 19. Health APIs

## Get Project Shard Health

```http
GET /api/v1/projects/:projectId/health
```

### Response

```json
{
  "success": true,
  "data": {
    "shards": [
      {
        "shardId": "shard_id",
        "status": "ACTIVE",
        "healthStatus": "HEALTHY",
        "lastHealthCheckAt": "2026-09-21T00:00:00.000Z"
      }
    ]
  },
  "message": "Shard health retrieved successfully"
}
```

Health monitoring itself is performed by the backend rather than manually triggered by normal application requests.

---

# 20. Data Plane

The Data Plane is the application-facing portion of ShardFlow.

Its responsibility is:

```text
Authenticate
   ↓
Validate
   ↓
Resolve Project
   ↓
Resolve Tenant
   ↓
Resolve Shard
   ↓
Acquire Connection
   ↓
Execute Supported Operation
   ↓
Return Response
```

---

# 21. Data Plane Authentication

Every Data Plane request requires:

```http
X-API-Key: <api-key>
```

A missing, invalid, revoked, or expired API key must be rejected.

---

# 22. Tenant Identification

The Data Plane requires a tenant identifier.

The canonical request representation uses:

```json
{
  "tenantId": "tenant_001"
}
```

The tenant ID must be resolved against the authenticated project.

The client must not directly select an arbitrary `shardId`.

---

# 23. Data Plane Endpoint

V1 uses a single structured Data Plane endpoint for supported database operations:

```http
POST /api/v1/data
```

This endpoint does **not** represent arbitrary MongoDB command execution.

The operation is explicitly specified in the request.

---

# 24. Data Plane Request Structure

General structure:

```json
{
  "tenantId": "tenant_001",
  "operation": "find",
  "collection": "users",
  "filter": {},
  "options": {}
}
```

The fields required depend on the operation.

---

# 25. Supported Operations

V1 supports:

```text
find
find-one
insert-one
update-one
delete-one
```

No other operation is valid unless this document is updated.

---

# 26. `find`

### Request

```json
{
  "tenantId": "tenant_001",
  "operation": "find",
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

### Conceptual Execution

```text
tenant_001
    ↓
tenant mapping
    ↓
shard_1
    ↓
users.find(...)
```

---

# 27. `find-one`

### Request

```json
{
  "tenantId": "tenant_001",
  "operation": "find-one",
  "collection": "users",
  "filter": {
    "_id": "..."
  }
}
```

The operation returns either the matching document or a null/not-found representation defined by the implementation.

---

# 28. `insert-one`

### Request

```json
{
  "tenantId": "tenant_001",
  "operation": "insert-one",
  "collection": "users",
  "document": {
    "name": "Soham",
    "status": "active"
  }
}
```

The document is inserted only into the shard resolved for the tenant.

---

# 29. `update-one`

### Request

```json
{
  "tenantId": "tenant_001",
  "operation": "update-one",
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

Only permitted update operators may be used.

---

# 30. `delete-one`

### Request

```json
{
  "tenantId": "tenant_001",
  "operation": "delete-one",
  "collection": "users",
  "filter": {
    "_id": "..."
  }
}
```

---

# 31. Operator Policy

ShardFlow does not accept arbitrary MongoDB operators.

Operators are explicitly permitted.

This creates a controlled boundary:

```text
Client Operator
      ↓
Allowlist Validation
      ↓
Allowed?
   /       \
 NO         YES
 ↓           ↓
Reject     Execute
```

---

# 32. V1 Filter Operators

The initial permitted filter operators are:

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

These operators may be used only where semantically valid for the operation.

---

# 33. V1 Logical Operators

The initial permitted logical operators are:

```text
$and
$or
$not
```

`$nor` is not part of the initial V1 operator set.

---

# 34. V1 Array Operators

The initial permitted array operator is:

```text
$elemMatch
```

Additional array operators require an explicit API contract update.

---

# 35. V1 Update Operators

The initial permitted update operators are:

```text
$set
$unset
$inc
$min
$max
$mul
```

Only explicitly supported operators may be passed to `update-one`.

---

# 36. Prohibited / Unsupported Operators

The following are not permitted in the V1 Data Plane:

```text
$where
$function
$accumulator
$expr
$regex
$regexMatch
```

unless explicitly added later to the API contract.

The goal is to avoid arbitrary server-side execution and uncontrolled query complexity.

---

# 37. Options Policy

Options are also allowlisted.

Clients must not be able to pass arbitrary MongoDB driver options.

Initial supported options may include:

```text
limit
skip
sort
projection
```

Only options explicitly implemented and documented may be accepted.

---

# 38. `find` Options

Initial supported options:

```json
{
  "limit": 20,
  "skip": 0,
  "sort": {
    "createdAt": -1
  },
  "projection": {
    "password": 0
  }
}
```

The backend must validate the structure and values.

---

# 39. Pagination Rules

Pagination must be bounded.

The server must define a maximum allowed `limit`.

Clients must not be able to request an unbounded number of documents.

Example conceptual rule:

```text
limit > maximum
        ↓
validation error
```

The exact numeric maximum is an implementation configuration decision.

---

# 40. Collection Validation

The `collection` field is treated as an identifier.

It must not be used to inject MongoDB commands or database names.

Invalid collection identifiers must be rejected before database execution.

---

# 41. Client-Controlled Shard Selection

The Data Plane does **not** accept:

```json
{
  "shardId": "shard_2"
}
```

as a routing override.

The shard is determined by:

```text
API Key
   ↓
Project
   ↓
Tenant ID
   ↓
Tenant-Shard Mapping
```

This prevents clients from bypassing routing isolation.

---

# 42. Data Plane Success Response

A successful Data Plane response follows the standard success structure:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

The exact `data` shape depends on the operation.

---

# 43. `find` Response

Conceptually:

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "...",
        "name": "Soham"
      }
    ]
  },
  "message": "Documents retrieved successfully"
}
```

---

# 44. `find-one` Response

```json
{
  "success": true,
  "data": {
    "document": {
      "_id": "...",
      "name": "Soham"
    }
  },
  "message": "Document retrieved successfully"
}
```

---

# 45. `insert-one` Response

```json
{
  "success": true,
  "data": {
    "insertedId": "..."
  },
  "message": "Document inserted successfully"
}
```

---

# 46. `update-one` Response

```json
{
  "success": true,
  "data": {
    "matchedCount": 1,
    "modifiedCount": 1
  },
  "message": "Document updated successfully"
}
```

---

# 47. `delete-one` Response

```json
{
  "success": true,
  "data": {
    "deletedCount": 1
  },
  "message": "Document deleted successfully"
}
```

---

# 48. Request Validation Order

Data Plane requests should follow this validation sequence:

```text
1. Parse request
       ↓
2. Authenticate API key
       ↓
3. Resolve project
       ↓
4. Validate tenantId
       ↓
5. Validate operation
       ↓
6. Validate collection
       ↓
7. Validate operation-specific fields
       ↓
8. Validate operators
       ↓
9. Validate options
       ↓
10. Resolve tenant → shard
       ↓
11. Acquire connection
       ↓
12. Execute operation
```

Invalid requests should fail as early as practical.

---

# 49. Routing Failure

If the tenant has no active mapping:

```text
tenant
   ↓
no mapping
   ↓
request rejected
```

The system must not randomly select another shard.

---

# 50. Shard Failure

If the mapped shard is unavailable:

```text
tenant
   ↓
mapped shard
   ↓
connection failure
   ↓
controlled error
```

V1 does not automatically move the tenant to another shard.

Automatic failover requires a separate data-migration and consistency design.

---

# 51. API Rate Limiting

Rate limiting applies to public API surfaces.

The exact limits are deployment/configuration concerns and may differ between:

```text
Control Plane
Data Plane
```

Rate-limit responses must use the centralized error contract.

---

# 52. Request Size Limits

Requests must have bounded body sizes.

Large documents or requests must be rejected according to configured limits.

The exact limits are implementation configuration.

---

# 53. API Versioning

V1 uses:

```text
/api/v1
```

Breaking API changes should result in either:

* a deliberate contract migration; or
* a new API version.

Do not silently change the V1 contract.

---

# 54. Idempotency

V1 does not introduce a general-purpose idempotency-key system unless explicitly required.

Operations that can produce duplicate writes must be treated accordingly by clients.

Any future idempotency mechanism must be explicitly defined in the API contract.

---

# 55. Security Requirements

The API must enforce:

```text
authentication
authorization
project isolation
tenant isolation
operator allowlisting
option allowlisting
collection validation
request-size limits
rate limiting
secret protection
error sanitization
```

---

# 56. Data Exposure Rules

The API must never expose:

```text
MongoDB connection credentials
API key hashes
internal secrets
Supabase service secrets
Brevo API credentials
internal stack traces
```

---

# 57. Internal vs Public Errors

Internal errors must be mapped to stable ShardFlow error codes.

For example:

```text
MongoDB driver error
        ↓
Internal error handling
        ↓
ShardFlow error code
        ↓
HTTP response
```

Clients should not depend on raw MongoDB error messages.

---

# 58. API Contract Change Rules

Any change to:

* endpoint;
* request field;
* response field;
* operation;
* operator;
* option;
* authentication;
* status code;
* error behavior

must update this document.

Significant architectural changes must also update:

```text
memory.md
```

and:

```text
task.md
```

when relevant.

---

# 59. V1 API Surface Summary

```text
CONTROL PLANE

GET    /api/v1/me

POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId
DELETE /api/v1/projects/:projectId

POST   /api/v1/projects/:projectId/api-keys
GET    /api/v1/projects/:projectId/api-keys
DELETE /api/v1/projects/:projectId/api-keys/:apiKeyId

POST   /api/v1/projects/:projectId/shards
GET    /api/v1/projects/:projectId/shards
GET    /api/v1/projects/:projectId/shards/:shardId
PATCH  /api/v1/projects/:projectId/shards/:shardId
DELETE /api/v1/projects/:projectId/shards/:shardId

GET    /api/v1/projects/:projectId/routing
PATCH  /api/v1/projects/:projectId/routing

POST   /api/v1/projects/:projectId/tenant-mappings
GET    /api/v1/projects/:projectId/tenant-mappings
GET    /api/v1/projects/:projectId/tenant-mappings/:mappingId
PATCH  /api/v1/projects/:projectId/tenant-mappings/:mappingId
DELETE /api/v1/projects/:projectId/tenant-mappings/:mappingId

GET    /api/v1/projects/:projectId/health


DATA PLANE

POST   /api/v1/data
```

---

# 60. V1 Explicitly Unsupported

The following are not part of this API contract:

```text
arbitrary MongoDB commands
arbitrary aggregation pipelines
cross-shard queries
cross-shard transactions
automatic shard migration
automatic rebalancing
client-controlled shard selection
arbitrary MongoDB operators
arbitrary MongoDB options
database administration commands
MongoDB user administration
multi-region routing
```

---

# 61. Source of Truth

For public API behavior:

```text
api.md
```

is authoritative.

For error behavior:

```text
error-contract.md
```

is authoritative.

For data models:

```text
database.md
```

is authoritative.

For architectural boundaries:

```text
architecture.md
```

is authoritative.

For historical decisions:

```text
memory.md
```

is authoritative.

For implementation progress:

```text
task.md
```

is authoritative.

---

# 62. Final API Principle

The ShardFlow API should expose a **controlled database abstraction**, not a raw MongoDB tunnel.

The intended model is:

```text
Application
     ↓
Structured ShardFlow API
     ↓
Authentication
     ↓
Validation
     ↓
Tenant Resolution
     ↓
Shard Resolution
     ↓
Connection Management
     ↓
Permitted MongoDB Operation
     ↓
Controlled Response
```

This boundary is one of the core architectural principles of ShardFlow V1.
