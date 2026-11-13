import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { ThrottlerOptions } from '@nestjs/throttler';

import { AUTH_THROTTLE_KEY } from '@/common/decorators/auth-throttle.decorator';

const reflector = new Reflector();

const isAuthRoute = (context: ExecutionContext): boolean =>
  reflector.getAllAndOverride<boolean | undefined>(AUTH_THROTTLE_KEY, [
    context.getHandler(),
    context.getClass(),
  ]) === true;

/**
 * One "default" throttler whose limit/ttl are resolved per request:
 * routes marked with `@AuthThrottle()` get the stricter auth values, every
 * other route gets the global ones. Using a single (unnamed) throttler keeps
 * the response header names unchanged (`Retry-After`, not `Retry-After-auth`).
 * Values come from validated env (Joi defaults in env.validation.ts).
 */
export function buildThrottlerOptions(
  config: ConfigService,
): Array<ThrottlerOptions> {
  const limit = config.getOrThrow<number>('THROTTLE_LIMIT');
  const ttl = config.getOrThrow<number>('THROTTLE_TTL_MS');
  const authLimit = config.getOrThrow<number>('AUTH_THROTTLE_LIMIT');
  const authTtl = config.getOrThrow<number>('AUTH_THROTTLE_TTL_MS');

  return [
    {
      limit: (context) => (isAuthRoute(context) ? authLimit : limit),
      ttl: (context) => (isAuthRoute(context) ? authTtl : ttl),
    },
  ];
}
