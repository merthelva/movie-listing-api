import { PaginationType } from '@/common/types/pagination.type';
import { UserEntity } from './entity/user.entity';

export type ListUsersResponseType = PaginationType & {
  items: Array<UserEntity>;
};
