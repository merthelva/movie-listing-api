import { IsEnum } from 'class-validator';
import type { RoleType } from '@/common/types/roles.type';
import { Roles } from '@/common/constants/roles.constant';

export class UpdateUserRoleDto {
  @IsEnum(Roles)
  role!: RoleType;
}
