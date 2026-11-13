import { SetMetadata } from '@nestjs/common';

export const AUTH_THROTTLE_KEY = 'auth-throttle';

/**
 * Marks a route as sensitive (register, login): the stricter "auth" throttler
 * applies to it instead of the global "default" one. Limits come from config,
 * see `buildThrottlerOptions`.
 */
export const AuthThrottle = () => SetMetadata(AUTH_THROTTLE_KEY, true);
