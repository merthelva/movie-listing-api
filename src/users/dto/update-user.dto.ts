import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

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
  @MinLength(6, {
    message: i18nValidationMessage('messages.users.CURRENT_PASSWORD_MIN_LENGTH'),
  })
  currentPassword!: string;

  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: i18nValidationMessage('messages.users.NEW_PASSWORD_MIN_LENGTH'),
  })
  newPassword?: string;
}
