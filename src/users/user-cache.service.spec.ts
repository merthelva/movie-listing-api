import { UserCacheService } from '@/users/user-cache.service';
import { userCacheTtlMs } from '@/auth/constants/user-cache.constant';
import type { CachedUserType } from '@/auth/types';

describe('UserCacheService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts one sweeper timer and clears it on module destroy', () => {
    const service = new UserCacheService();
    expect(jest.getTimerCount()).toBe(1);

    service.onModuleDestroy();

    expect(jest.getTimerCount()).toBe(0);
  });

  it('can be destroyed more than once without throwing', () => {
    const service = new UserCacheService();

    service.onModuleDestroy();

    expect(() => service.onModuleDestroy()).not.toThrow();
  });

  it('keeps serving cached users until the sweeper evicts expired ones', () => {
    const service = new UserCacheService();
    const user = { id: 1 } as CachedUserType;

    service.set(1, user);
    expect(service.get(1)).toEqual(user);

    jest.advanceTimersByTime(userCacheTtlMs + 1);

    expect(service.get(1)).toBeNull();
    service.onModuleDestroy();
  });
});
