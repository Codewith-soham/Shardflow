# ShardFlow Backend

ShardFlow is a database infrastructure layer for multi-tenant applications that operate across multiple MongoDB databases. This is the backend application built with Node.js, TypeScript, and Fastify.

For full product and architectural documentation, see the `docs/` directory at the project root.

## Current Scope

This is **Task 0.1 — Backend Project Initialization**. The backend currently provides:

- A minimal Fastify application
- TypeScript with strict type checking
- ESM module system
- A `/health` endpoint for verifying the server is running
- The directory structure documented in `docs/architecture.md`

No business logic, database connections, authentication, or routing have been implemented yet.

## Prerequisites

- Node.js (v18 or later recommended)
- npm

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Edit `.env` as needed. See `.env.example` for available variables.

## Development

Start the development server with auto-reload:

```bash
npm run dev
```

The server starts on `http://localhost:3000` by default.

## Production

Build and start:

```bash
npm run build
npm start
```

## Type Checking

Run TypeScript type checks without emitting files:

```bash
npm run typecheck
```

## Project Structure

```text
backend/
└── src/
    ├── auth/              # Authentication (future)
    ├── control-plane/     # Control plane operations (future)
    ├── data-plane/        # Data plane operations (future)
    ├── health/            # Health monitoring (future)
    ├── database/          # Database connections (future)
    ├── observability/     # Logging, metrics (future)
    ├── errors/            # Error infrastructure (future)
    ├── config/            # Environment/configuration
    ├── utils/             # Shared utilities
    ├── app.ts             # Fastify application construction
    └── server.ts          # Server startup entry point
```
