import { RoleType } from '@/common/types/roles.type';

export const Roles = {
  ADMIN: 'admin',
  USER: 'user',
} satisfies Record<`${Uppercase<RoleType>}`, RoleType>;
