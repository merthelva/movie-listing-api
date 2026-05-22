import { IsEnum } from 'class-validator';

import { Roles } from '@/common/constants/roles.constant';
import type { RoleType } from '@/common/types/roles.type';

export class UpdateUserRoleDto {
  @IsEnum(Roles)
  role!: RoleType;
}
