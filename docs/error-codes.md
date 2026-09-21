# ShardFlow V1 — Error Codes

**Document:** Error Code Registry
**Product:** ShardFlow
**Version:** V1.0
**Status:** Active
**Last Updated:** 2026-09-21

---

# 1. Purpose

This document defines the canonical error codes used by ShardFlow V1.

It provides a stable machine-readable error identifier for:

* Control Plane errors;
* Data Plane errors;
* authentication failures;
* authorization failures;
* validation failures;
* project/resource errors;
* routing errors;
* shard/connection errors;
* database operation errors;
* system errors.

Clients should use the `error.code` field for programmatic error handling rather than relying on human-readable messages.

---

# 2. Error Response Contract

All API errors follow the structure defined in `error-contract.md`.

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

The error code is stable.

The human-readable message may change without constituting an API contract change.

---

# 3. Error Code Naming Convention

Error codes use uppercase `SCREAMING_SNAKE_CASE`.

Example:

```text
INVALID_API_KEY
PROJECT_NOT_FOUND
TENANT_MAPPING_NOT_FOUND
SHARD_UNAVAILABLE
```

General structure:

```text
<RESOURCE>_<CONDITION>
```

or:

```text
<CONTEXT>_<RESOURCE>_<CONDITION>
```

Examples:

```text
INVALID_API_KEY
PROJECT_ACCESS_DENIED
DATA_OPERATION_NOT_SUPPORTED
SHARD_CONNECTION_FAILED
```

---

# 4. HTTP Status Categories

ShardFlow uses standard HTTP status semantics.

| Status | Meaning                                                |
| -----: | ------------------------------------------------------ |
|  `400` | Invalid request                                        |
|  `401` | Authentication required/failed                         |
|  `403` | Authenticated but not authorized                       |
|  `404` | Resource not found                                     |
|  `409` | Resource/state conflict                                |
|  `422` | Request is structurally valid but semantically invalid |
|  `429` | Rate limit exceeded                                    |
|  `500` | Internal server error                                  |
|  `502` | Upstream/customer database failure                     |
|  `503` | Service/resource temporarily unavailable               |
|  `504` | Upstream/customer database timeout                     |

The exact mapping for individual errors is defined below.

---

# 5. Authentication Errors

## `AUTHENTICATION_REQUIRED`

**HTTP:** `401`

The request requires authentication but no valid authentication credentials were supplied.

Typical cases:

* Missing Supabase authentication;
* Missing Data Plane API key.

---

## `INVALID_AUTH_TOKEN`

**HTTP:** `401`

The supplied authentication token is invalid.

Applies primarily to Control Plane authentication.

---

## `AUTH_TOKEN_EXPIRED`

**HTTP:** `401`

The supplied authentication token has expired.

---

## `INVALID_API_KEY`

**HTTP:** `401`

The supplied ShardFlow API key is invalid.

Possible causes:

* malformed key;
* unknown key;
* key hash does not match.

---

## `API_KEY_REVOKED`

**HTTP:** `401`

The API key was previously valid but has been revoked.

---

## `API_KEY_EXPIRED`

**HTTP:** `401`

The API key has passed its configured expiration time.

---

# 6. Authorization Errors

## `ACCESS_DENIED`

**HTTP:** `403`

The authenticated identity does not have permission to perform the requested action.

---

## `PROJECT_ACCESS_DENIED`

**HTTP:** `403`

The authenticated user does not have access to the requested project.

---

## `RESOURCE_ACCESS_DENIED`

**HTTP:** `403`

The authenticated principal does not have access to the requested resource.

---

## `TENANT_ACCESS_DENIED`

**HTTP:** `403`

The request attempts to access a tenant outside the authenticated project's permitted scope.

---

# 7. Request Validation Errors

## `INVALID_REQUEST`

**HTTP:** `400`

The request body or general request structure is invalid.

---

## `MISSING_REQUIRED_FIELD`

**HTTP:** `400`

A required request field is missing.

---

## `INVALID_FIELD`

**HTTP:** `400`

A request field has an invalid value or structure.

---

## `INVALID_FIELD_TYPE`

**HTTP:** `400`

A field has the wrong data type.

Example:

```json
{
  "limit": "twenty"
}
```

when an integer is required.

---

## `INVALID_FIELD_FORMAT`

**HTTP:** `400`

A field does not conform to the required format.

Examples:

* invalid date;
* invalid identifier;
* invalid API key configuration.

---

## `INVALID_ID`

**HTTP:** `400`

A supplied resource identifier is malformed.

---

## `INVALID_PROJECT_ID`

**HTTP:** `400`

The supplied project identifier is invalid.

---

## `INVALID_SHARD_ID`

**HTTP:** `400`

The supplied shard identifier is invalid.

---

## `INVALID_TENANT_ID`

**HTTP:** `400`

The supplied tenant identifier is invalid.

---

# 8. Project Errors

## `PROJECT_NOT_FOUND`

**HTTP:** `404`

The requested project does not exist or is not available to the caller.

---

## `PROJECT_ALREADY_EXISTS`

**HTTP:** `409`

A project cannot be created because it conflicts with an existing project/resource constraint.

---

## `PROJECT_DISABLED`

**HTTP:** `409`

The requested project is disabled and cannot perform the requested operation.

---

# 9. API Key Errors

## `API_KEY_NOT_FOUND`

**HTTP:** `404`

The requested API key does not exist.

---

## `API_KEY_ALREADY_REVOKED`

**HTTP:** `409`

The requested API key has already been revoked.

---

## `API_KEY_CREATION_FAILED`

**HTTP:** `500`

ShardFlow failed to create the API key.

The internal cause must not be exposed to the client.

---

# 10. Shard Errors

## `SHARD_NOT_FOUND`

**HTTP:** `404`

The requested shard does not exist.

---

## `SHARD_ALREADY_EXISTS`

**HTTP:** `409`

A shard cannot be created because it conflicts with an existing shard/resource constraint.

---

## `SHARD_DISABLED`

**HTTP:** `409`

The requested shard is disabled.

---

## `SHARD_UNAVAILABLE`

**HTTP:** `503`

The requested shard is currently unavailable.

---

## `SHARD_CONNECTION_FAILED`

**HTTP:** `502`

ShardFlow could not establish a connection to the customer's MongoDB shard.

---

## `SHARD_CONNECTION_TIMEOUT`

**HTTP:** `504`

The connection attempt to the customer's MongoDB shard timed out.

---

## `SHARD_HEALTH_CHECK_FAILED`

**HTTP:** `503`

A shard health check failed.

This error is primarily relevant to health-management operations and should not expose raw driver details.

---

## `SHARD_CREDENTIALS_INVALID`

**HTTP:** `502`

The configured credentials for the customer MongoDB shard could not authenticate.

---

# 11. Routing Errors

## `ROUTING_CONFIGURATION_NOT_FOUND`

**HTTP:** `404`

No routing configuration exists for the requested project.

---

## `ROUTING_CONFIGURATION_INVALID`

**HTTP:** `422`

The routing configuration is structurally present but invalid.

---

## `UNSUPPORTED_ROUTING_STRATEGY`

**HTTP:** `422`

The requested routing strategy is not supported by V1.

---

# 12. Tenant Mapping Errors

## `TENANT_MAPPING_NOT_FOUND`

**HTTP:** `404`

No tenant mapping exists for the requested mapping resource.

---

## `TENANT_NOT_MAPPED`

**HTTP:** `404`

The supplied tenant does not have an active shard mapping.

Data Plane requests must not fall back to an arbitrary shard.

---

## `TENANT_MAPPING_ALREADY_EXISTS`

**HTTP:** `409`

An active mapping already exists for the tenant within the project.

V1 expects one active tenant-to-shard mapping.

---

## `INVALID_TENANT_MAPPING`

**HTTP:** `422`

The requested tenant-to-shard relationship is invalid.

---

## `MAPPED_SHARD_UNAVAILABLE`

**HTTP:** `503`

The tenant has a mapping, but the mapped shard is unavailable.

V1 does not automatically reroute the tenant to another shard.

---

# 13. Data Plane Errors

## `DATA_OPERATION_REQUIRED`

**HTTP:** `400`

No database operation was supplied.

---

## `DATA_OPERATION_NOT_SUPPORTED`

**HTTP:** `422`

The requested database operation is not supported by ShardFlow V1.

Supported operations:

```text
find
find-one
insert-one
update-one
delete-one
```

---

## `INVALID_DATA_OPERATION`

**HTTP:** `422`

The operation is recognized but its request structure is invalid.

---

## `COLLECTION_REQUIRED`

**HTTP:** `400`

The database operation requires a collection name but none was provided.

---

## `INVALID_COLLECTION`

**HTTP:** `422`

The supplied collection identifier is invalid.

---

## `DOCUMENT_REQUIRED`

**HTTP:** `400`

The requested operation requires a document but none was provided.

---

## `INVALID_DOCUMENT`

**HTTP:** `422`

The supplied document is invalid for the requested operation.

---

## `FILTER_REQUIRED`

**HTTP:** `400`

The requested operation requires a filter but none was provided.

---

## `INVALID_FILTER`

**HTTP:** `422`

The supplied MongoDB filter is invalid.

---

## `INVALID_UPDATE`

**HTTP:** `422`

The supplied update document is invalid.

---

# 14. MongoDB Operator Errors

## `UNSUPPORTED_OPERATOR`

**HTTP:** `422`

The request contains a MongoDB operator that is not permitted by the ShardFlow V1 allowlist.

---

## `INVALID_OPERATOR`

**HTTP:** `422`

The supplied operator is malformed or used in an invalid structure.

---

## `OPERATOR_NOT_ALLOWED`

**HTTP:** `422`

The operator exists in MongoDB but is intentionally not exposed through the ShardFlow V1 API.

---

# 15. MongoDB Option Errors

## `UNSUPPORTED_OPTION`

**HTTP:** `422`

The request contains a MongoDB option that is not supported by the ShardFlow V1 API.

---

## `INVALID_OPTION`

**HTTP:** `422`

The supplied option has an invalid structure or value.

---

## `INVALID_LIMIT`

**HTTP:** `422`

The requested result limit is invalid.

Examples:

* negative limit;
* zero where prohibited;
* limit exceeds the configured maximum.

---

## `INVALID_SKIP`

**HTTP:** `422`

The requested skip value is invalid.

---

## `INVALID_SORT`

**HTTP:** `422`

The supplied sort configuration is invalid.

---

## `INVALID_PROJECTION`

**HTTP:** `422`

The supplied projection configuration is invalid.

---

# 16. Data Plane Routing Errors

## `PROJECT_RESOLUTION_FAILED`

**HTTP:** `401`

ShardFlow could not resolve the project associated with the supplied API key.

---

## `TENANT_RESOLUTION_FAILED`

**HTTP:** `404`

ShardFlow could not resolve the supplied tenant to an active mapping.

---

## `SHARD_RESOLUTION_FAILED`

**HTTP:** `503`

ShardFlow could not resolve a usable shard for the request.

---

## `CLIENT_SHARD_SELECTION_NOT_ALLOWED`

**HTTP:** `403`

The client attempted to directly select a shard.

V1 requires ShardFlow to determine the shard from:

```text
API Key
→ Project
→ Tenant
→ Tenant Mapping
→ Shard
```

---

# 17. Database Operation Errors

## `DATABASE_OPERATION_FAILED`

**HTTP:** `502`

The requested database operation could not be completed on the customer shard.

---

## `DATABASE_OPERATION_TIMEOUT`

**HTTP:** `504`

The database operation exceeded the configured timeout.

---

## `DATABASE_DUPLICATE_KEY`

**HTTP:** `409`

The database operation violated a unique-key constraint.

---

## `DATABASE_DOCUMENT_NOT_FOUND`

**HTTP:** `404`

The requested document could not be found when the operation requires an existing document.

---

## `DATABASE_QUERY_INVALID`

**HTTP:** `422`

The request reached database validation but the resulting query was invalid.

---

# 18. Connection Manager Errors

## `CONNECTION_POOL_UNAVAILABLE`

**HTTP:** `503`

ShardFlow could not acquire a usable database connection from the connection manager.

---

## `CONNECTION_ACQUISITION_TIMEOUT`

**HTTP:** `504`

ShardFlow could not acquire a database connection within the configured timeout.

---

## `CONNECTION_MANAGER_ERROR`

**HTTP:** `503`

The connection manager encountered an internal availability problem.

Internal connection details must not be exposed.

---

# 19. Rate Limiting Errors

## `RATE_LIMIT_EXCEEDED`

**HTTP:** `429`

The client exceeded the configured request rate.

The response may include:

```http
Retry-After: <seconds>
```

when available.

---

# 20. Request Size Errors

## `REQUEST_TOO_LARGE`

**HTTP:** `413`

The request body exceeds the configured maximum size.

---

## `DOCUMENT_TOO_LARGE`

**HTTP:** `413`

A MongoDB document exceeds the configured ShardFlow Data Plane limit.

---

# 21. Resource State Errors

## `RESOURCE_DISABLED`

**HTTP:** `409`

The requested resource exists but is currently disabled.

---

## `RESOURCE_STATE_CONFLICT`

**HTTP:** `409`

The requested operation conflicts with the current resource state.

---

# 22. Idempotency / Conflict Errors

V1 does not expose a general idempotency-key mechanism.

If an endpoint encounters a resource-state conflict, it should use the appropriate resource conflict error rather than inventing endpoint-specific codes.

Primary code:

```text
RESOURCE_STATE_CONFLICT
```

---

# 23. Internal Errors

## `INTERNAL_ERROR`

**HTTP:** `500`

An unexpected internal error occurred.

The client must not receive:

* stack traces;
* database connection strings;
* internal file paths;
* driver internals;
* secret values.

---

## `SERVICE_UNAVAILABLE`

**HTTP:** `503`

ShardFlow cannot currently process the request because a required internal service is unavailable.

---

# 24. External Service Errors

## `AUTH_PROVIDER_UNAVAILABLE`

**HTTP:** `503`

The Supabase authentication dependency is unavailable or could not be reached when required.

---

## `EMAIL_PROVIDER_UNAVAILABLE`

**HTTP:** `503`

The Brevo email provider is unavailable when an email operation is required.

Email-provider failures must not expose Brevo credentials or internal provider details.

---

# 25. Error Code Summary

| Code                                 | HTTP | Category         |
| ------------------------------------ | ---: | ---------------- |
| `AUTHENTICATION_REQUIRED`            |  401 | Authentication   |
| `INVALID_AUTH_TOKEN`                 |  401 | Authentication   |
| `AUTH_TOKEN_EXPIRED`                 |  401 | Authentication   |
| `INVALID_API_KEY`                    |  401 | Authentication   |
| `API_KEY_REVOKED`                    |  401 | Authentication   |
| `API_KEY_EXPIRED`                    |  401 | Authentication   |
| `ACCESS_DENIED`                      |  403 | Authorization    |
| `PROJECT_ACCESS_DENIED`              |  403 | Authorization    |
| `RESOURCE_ACCESS_DENIED`             |  403 | Authorization    |
| `TENANT_ACCESS_DENIED`               |  403 | Authorization    |
| `INVALID_REQUEST`                    |  400 | Validation       |
| `MISSING_REQUIRED_FIELD`             |  400 | Validation       |
| `INVALID_FIELD`                      |  400 | Validation       |
| `INVALID_FIELD_TYPE`                 |  400 | Validation       |
| `INVALID_FIELD_FORMAT`               |  400 | Validation       |
| `INVALID_ID`                         |  400 | Validation       |
| `PROJECT_NOT_FOUND`                  |  404 | Project          |
| `PROJECT_ALREADY_EXISTS`             |  409 | Project          |
| `PROJECT_DISABLED`                   |  409 | Project          |
| `API_KEY_NOT_FOUND`                  |  404 | API Key          |
| `API_KEY_ALREADY_REVOKED`            |  409 | API Key          |
| `API_KEY_CREATION_FAILED`            |  500 | API Key          |
| `SHARD_NOT_FOUND`                    |  404 | Shard            |
| `SHARD_ALREADY_EXISTS`               |  409 | Shard            |
| `SHARD_DISABLED`                     |  409 | Shard            |
| `SHARD_UNAVAILABLE`                  |  503 | Shard            |
| `SHARD_CONNECTION_FAILED`            |  502 | Shard            |
| `SHARD_CONNECTION_TIMEOUT`           |  504 | Shard            |
| `SHARD_HEALTH_CHECK_FAILED`          |  503 | Shard            |
| `SHARD_CREDENTIALS_INVALID`          |  502 | Shard            |
| `ROUTING_CONFIGURATION_NOT_FOUND`    |  404 | Routing          |
| `ROUTING_CONFIGURATION_INVALID`      |  422 | Routing          |
| `UNSUPPORTED_ROUTING_STRATEGY`       |  422 | Routing          |
| `TENANT_MAPPING_NOT_FOUND`           |  404 | Tenant Mapping   |
| `TENANT_NOT_MAPPED`                  |  404 | Tenant Mapping   |
| `TENANT_MAPPING_ALREADY_EXISTS`      |  409 | Tenant Mapping   |
| `INVALID_TENANT_MAPPING`             |  422 | Tenant Mapping   |
| `MAPPED_SHARD_UNAVAILABLE`           |  503 | Tenant Mapping   |
| `DATA_OPERATION_REQUIRED`            |  400 | Data Plane       |
| `DATA_OPERATION_NOT_SUPPORTED`       |  422 | Data Plane       |
| `INVALID_DATA_OPERATION`             |  422 | Data Plane       |
| `COLLECTION_REQUIRED`                |  400 | Data Plane       |
| `INVALID_COLLECTION`                 |  422 | Data Plane       |
| `DOCUMENT_REQUIRED`                  |  400 | Data Plane       |
| `INVALID_DOCUMENT`                   |  422 | Data Plane       |
| `FILTER_REQUIRED`                    |  400 | Data Plane       |
| `INVALID_FILTER`                     |  422 | Data Plane       |
| `INVALID_UPDATE`                     |  422 | Data Plane       |
| `UNSUPPORTED_OPERATOR`               |  422 | MongoDB          |
| `INVALID_OPERATOR`                   |  422 | MongoDB          |
| `OPERATOR_NOT_ALLOWED`               |  422 | MongoDB          |
| `UNSUPPORTED_OPTION`                 |  422 | MongoDB          |
| `INVALID_OPTION`                     |  422 | MongoDB          |
| `INVALID_LIMIT`                      |  422 | MongoDB          |
| `INVALID_SKIP`                       |  422 | MongoDB          |
| `INVALID_SORT`                       |  422 | MongoDB          |
| `INVALID_PROJECTION`                 |  422 | MongoDB          |
| `PROJECT_RESOLUTION_FAILED`          |  401 | Data Plane       |
| `TENANT_RESOLUTION_FAILED`           |  404 | Data Plane       |
| `SHARD_RESOLUTION_FAILED`            |  503 | Data Plane       |
| `CLIENT_SHARD_SELECTION_NOT_ALLOWED` |  403 | Data Plane       |
| `DATABASE_OPERATION_FAILED`          |  502 | Database         |
| `DATABASE_OPERATION_TIMEOUT`         |  504 | Database         |
| `DATABASE_DUPLICATE_KEY`             |  409 | Database         |
| `DATABASE_DOCUMENT_NOT_FOUND`        |  404 | Database         |
| `DATABASE_QUERY_INVALID`             |  422 | Database         |
| `CONNECTION_POOL_UNAVAILABLE`        |  503 | Connection       |
| `CONNECTION_ACQUISITION_TIMEOUT`     |  504 | Connection       |
| `CONNECTION_MANAGER_ERROR`           |  503 | Connection       |
| `RATE_LIMIT_EXCEEDED`                |  429 | Rate Limit       |
| `REQUEST_TOO_LARGE`                  |  413 | Request          |
| `DOCUMENT_TOO_LARGE`                 |  413 | Request          |
| `RESOURCE_DISABLED`                  |  409 | Resource         |
| `RESOURCE_STATE_CONFLICT`            |  409 | Resource         |
| `INTERNAL_ERROR`                     |  500 | System           |
| `SERVICE_UNAVAILABLE`                |  503 | System           |
| `AUTH_PROVIDER_UNAVAILABLE`          |  503 | External Service |
| `EMAIL_PROVIDER_UNAVAILABLE`         |  503 | External Service |

---

# 26. Error Code Stability

Once an error code is released as part of V1, its meaning must remain stable.

Do not reuse an existing code for a different condition.

If the semantics of an error materially change:

1. update `error-codes.md`;
2. update `error-contract.md`;
3. update `api.md` if API behavior changes;
4. record the decision in `memory.md`;
5. update affected implementation/tests.

---

# 27. Adding a New Error Code

A new error code should only be introduced when an existing code cannot accurately represent the condition.

Before adding one, ask:

```text
Can an existing code represent this condition?
        |
       YES
        ↓
Use existing code.

       NO
        ↓
Create a new code.
```

Avoid creating highly specific error codes for every internal failure.

---

# 28. Internal Error vs Public Error

Not every internal error requires a unique public error code.

Example:

```text
MongoDB driver error
MongoNetworkError
ConnectionPoolClearedError
SocketTimeoutError
        ↓
ShardFlow internal mapping
        ↓
DATABASE_OPERATION_FAILED
```

The internal error can be logged for debugging while the client receives a stable public error.

---

# 29. Security Principle

Error responses must not become an information-leak mechanism.

Do not expose:

```text
connection strings
database credentials
API key hashes
internal service URLs
stack traces
filesystem paths
database topology
internal MongoDB driver details
Supabase service credentials
Brevo credentials
```

Use stable public error codes for clients and detailed structured logs internally.

---

# 30. Source of Truth

Error behavior is divided between two documents:

### `error-codes.md`

Defines:

* available error codes;
* meaning;
* category;
* default HTTP status.

### `error-contract.md`

Defines:

* error response structure;
* HTTP behavior;
* response fields;
* headers;
* serialization rules;
* client-facing contract.

### `api.md`

Defines:

* which errors are relevant to individual endpoints;
* endpoint-specific validation behavior.

---

# 31. Final Principle

ShardFlow errors should be:

```text
Stable
Predictable
Machine-readable
Safe
Consistent
Actionable
```

The client should be able to handle:

```text
error.code
```

without parsing:

```text
error.message
```

The message is for human understanding.

The error code is the actual programmatic contract.
