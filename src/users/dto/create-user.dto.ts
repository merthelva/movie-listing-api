import {
  IsDefined,
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @IsString({
    message: i18nValidationMessage('messages.users.NAME_MUST_BE_STRING'),
  })
  @IsDefined({ message: i18nValidationMessage('messages.users.NAME_REQUIRED') })
  @IsNotEmpty({
    message: i18nValidationMessage('messages.users.NAME_NOT_EMPTY'),
  })
  name!: string;

  @IsEmail(
    {},
    { message: i18nValidationMessage('messages.users.EMAIL_INVALID') },
  )
  @IsDefined({
    message: i18nValidationMessage('messages.users.EMAIL_REQUIRED'),
  })
  email!: string;

  @IsString({
    message: i18nValidationMessage('messages.users.PASSWORD_MUST_BE_STRING'),
  })
  @IsDefined({
    message: i18nValidationMessage('messages.users.PASSWORD_REQUIRED'),
  })
  @MinLength(6, {
    message: i18nValidationMessage('messages.users.PASSWORD_MIN_LENGTH'),
  })
  password!: string;
}
