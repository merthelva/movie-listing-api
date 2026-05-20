import { Expose } from 'class-transformer';

export class UserRegisterResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  email!: string;
}

export class UserLoginResponseDto extends UserRegisterResponseDto {
  @Expose()
  accessToken!: string;
}
