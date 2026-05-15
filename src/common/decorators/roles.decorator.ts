import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@/common/types/roles.type';

export const Roles = (...roles: Array<RoleType>) =>
  SetMetadata('user-roles', roles);
