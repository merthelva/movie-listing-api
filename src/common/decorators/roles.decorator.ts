import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@/common/types/roles.type';
import { ROLES_KEY } from '@/common/constants/roles-key.constant';

export const Roles = (...roles: Array<RoleType>) =>
  SetMetadata(ROLES_KEY, roles);
