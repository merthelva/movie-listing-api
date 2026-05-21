import { Injectable } from '@nestjs/common';
import { TtlCache } from '@/common/utils/ttl-cache.utils';
import { CachedUserType } from '@/auth/types';
import {
  maxUserCacheSize,
  userCacheTtlMs,
} from '@/auth/constants/user-cache.constant';

@Injectable()
export class UserCacheService {
  private readonly cache = new TtlCache<number, CachedUserType>(
    userCacheTtlMs,
    maxUserCacheSize,
  );

  constructor() {
    setInterval(() => this.cache.evictExpired(), userCacheTtlMs);
  }

  get(userId: number): CachedUserType | null {
    return this.cache.get(userId);
  }

  set(userId: number, user: CachedUserType): void {
    this.cache.set(userId, user);
  }

  invalidate(userId: number): void {
    this.cache.delete(userId);
  }
}
