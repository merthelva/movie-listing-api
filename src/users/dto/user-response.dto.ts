import { Expose } from 'class-transformer';
import type { RoleType } from '@/common/types/roles.type';

export class UserRegisterResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  role!: RoleType;
}

export class UserLoginResponseDto extends UserRegisterResponseDto {
  @Expose()
  accessToken!: string;
}
