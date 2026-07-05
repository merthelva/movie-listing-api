import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

import { SUPPORTED_LOCALES } from '@/common/constants/locale.constant';
import type { LocaleType } from '@/common/types/locale.type';

export class SearchMoviesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  page?: number;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: LocaleType = 'en-US';

  // TODO: Query parameters for a more refined search can be added later. For reference, see https://developer.themoviedb.org/reference/search-movie#query-params
}
