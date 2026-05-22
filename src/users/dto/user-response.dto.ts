import { Expose } from 'class-transformer';

export class UserRegisterResponseDto {
  @Expose()
  email!: string;

  @Expose()
  id!: number;

  @Expose()
  name!: string;
}

export class UserLoginResponseDto extends UserRegisterResponseDto {
  @Expose()
  accessToken!: string;
}
