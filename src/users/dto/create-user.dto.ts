import {
  IsDefined,
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

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
}
