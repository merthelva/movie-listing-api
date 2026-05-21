import { UserEntity } from '@/users/entity/user.entity';

export type JwtPayloadType = {
  sub: number;
  email: string;
  tokenVersion: number;
};

export type LoginResponseType = {
  accessToken: string;
  id: number;
  email: string;
};

export type CachedUserType = Pick<
  UserEntity,
  'id' | 'email' | 'role' | 'tokenVersion'
>;
