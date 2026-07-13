import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsString()
  @MinLength(6, { message: 'Current password has at least 6 characters.' })
  currentPassword!: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'New password should have at least 6 characters.' })
  newPassword?: string;
}
