import type { FastifyInstance, RouteOptions } from 'fastify';

/**
 * Explicit, reviewed allowlist of routes that may be served without credentials.
 * Every other route must carry an authentication preHandler or app startup fails.
 */
export const PUBLIC_ROUTES: ReadonlyArray<{ method: string; url: string }> = [
  { method: 'GET', url: '/health' },
  { method: 'POST', url: '/api/v1/auth/forgot-password' },
  { method: 'POST', url: '/api/v1/auth/reset-password' },
];

const AUTH_GUARD = Symbol.for('shardflow.authGuard');

/** Tags an authentication preHandler so the route guard can recognise it. */
export function markAuthGuard<T extends (...args: any[]) => any>(handler: T): T {
  (handler as any)[AUTH_GUARD] = true;
  return handler;
}

function isAuthGuard(handler: unknown): boolean {
  return typeof handler === 'function' && (handler as any)[AUTH_GUARD] === true;
}

function isPublicRoute(method: string, url: string): boolean {
  return PUBLIC_ROUTES.some((route) => route.method === method && route.url === url);
}

function hasAuthGuard(options: RouteOptions): boolean {
  const hooks = [options.onRequest, options.preValidation, options.preHandler].flat();
  return hooks.some(isAuthGuard);
}

/**
 * Makes protection the default: every route registered after this call must either
 * be in PUBLIC_ROUTES or include an authentication guard. Violations throw at
 * registration time, so an unprotected route can never reach a running server.
 */
export function enforceRouteProtection(app: FastifyInstance): void {
  app.addHook('onRoute', (options) => {
    const methods = Array.isArray(options.method) ? options.method : [options.method];

    for (const method of methods) {
      // OPTIONS (CORS preflight) is answered by the global onRequest hook before routing.
      if (method === 'OPTIONS') continue;
      // HEAD routes are auto-derived from GET and share its handlers.
      const effective = method === 'HEAD' ? 'GET' : method;

      if (isPublicRoute(effective, options.url) || hasAuthGuard(options)) continue;

      throw new Error(
        `Unprotected route ${method} ${options.url}: add an auth preHandler or list it in PUBLIC_ROUTES`
      );
    }
  });
}
