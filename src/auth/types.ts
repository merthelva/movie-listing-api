import { UserEntity } from '@/users/entity/user.entity';

export type JwtPayloadType = {
  sub: number;
  email: string;
};

export type LoginResponseType = {
  accessToken: string;
} & UserEntity;
