import { RoleType } from '@/common/types/roles.type';

/**
 * Minimal shape of the authenticated user that `common/` code relies on.
 * Keeps shared guards independent from feature entities (e.g. UserEntity).
 */
export interface AuthUser {
  role: RoleType;
}
