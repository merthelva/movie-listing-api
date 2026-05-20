import {
  IsDefined,
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Roles } from '@/common/constants/roles.constant';
import type { RoleType } from '@/common/types/roles.type';

export class CreateUserDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsDefined()
  email!: string;

  @IsString()
  @IsDefined()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn([Roles.USER])
  role?: RoleType;
}
