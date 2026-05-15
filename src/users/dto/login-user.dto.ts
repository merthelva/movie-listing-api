import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsDefined()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsDefined()
  @MinLength(6)
  password!: string;
}
