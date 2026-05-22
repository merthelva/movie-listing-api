import { Expose, Type } from 'class-transformer';

import { UserRegisterResponseDto } from './user-response.dto';

export class GetAllUsersResponseDto {
  @Expose()
  isFirstPage!: boolean;

  @Expose()
  isLastPage!: boolean;

  @Expose()
  @Type(() => UserRegisterResponseDto)
  items!: Array<UserRegisterResponseDto>;

  @Expose()
  limit!: number;

  @Expose()
  page!: number;

  @Expose()
  totalItems!: number;
}
