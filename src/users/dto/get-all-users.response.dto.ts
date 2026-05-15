import { Expose, Type } from 'class-transformer';
import { UserRegisterResponseDto } from './user-response.dto';

export class GetAllUsersResponseDto {
  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalItems!: number;

  @Expose()
  isFirstPage!: boolean;

  @Expose()
  isLastPage!: boolean;

  @Expose()
  @Type(() => UserRegisterResponseDto)
  items!: Array<UserRegisterResponseDto>;
}
