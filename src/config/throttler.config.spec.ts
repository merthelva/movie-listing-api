import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthThrottle } from '@/common/decorators/auth-throttle.decorator';
import { buildThrottlerOptions } from '@/config/throttler.config';

class SampleController {
  @AuthThrottle()
  login() {}

  list() {}
}

@AuthThrottle()
class WholeAuthController {
  anything() {}
}

function contextFor(
  controller: new () => object,
  handlerName: string,
): ExecutionContext {
  const handler = (controller.prototype as Record<string, () => void>)[
    handlerName
  ];
  return {
    getHandler: () => handler,
    getClass: () => controller,
  } as unknown as ExecutionContext;
}

function configWith(values: Record<string, number>) {
  return {
    getOrThrow: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('buildThrottlerOptions', () => {
  const config = configWith({
    THROTTLE_LIMIT: 60,
    THROTTLE_TTL_MS: 60_000,
    AUTH_THROTTLE_LIMIT: 10,
    AUTH_THROTTLE_TTL_MS: 30_000,
  });

  const [options] = buildThrottlerOptions(config);
  const resolve = (
    value: unknown,
    context: ExecutionContext,
  ): number | Promise<number> =>
    typeof value === 'function'
      ? (value as (ctx: ExecutionContext) => number)(context)
      : (value as number);

  it('returns a single throttler so header names stay unchanged', () => {
    expect(buildThrottlerOptions(config)).toHaveLength(1);
    expect(options.name).toBeUndefined();
  });

  it('uses the global limit and ttl on ordinary routes', async () => {
    const ctx = contextFor(SampleController, 'list');

    expect(await resolve(options.limit, ctx)).toBe(60);
    expect(await resolve(options.ttl, ctx)).toBe(60_000);
  });

  it('uses the auth limit and ttl on routes marked with @AuthThrottle()', async () => {
    const ctx = contextFor(SampleController, 'login');

    expect(await resolve(options.limit, ctx)).toBe(10);
    expect(await resolve(options.ttl, ctx)).toBe(30_000);
  });

  it('honours a class-level @AuthThrottle()', async () => {
    const ctx = contextFor(WholeAuthController, 'anything');

    expect(await resolve(options.limit, ctx)).toBe(10);
  });
});
