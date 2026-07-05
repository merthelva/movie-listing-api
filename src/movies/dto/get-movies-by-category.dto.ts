import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { SUPPORTED_LOCALES } from '@/common/constants/locale.constant';
import type { LocaleType } from '@/common/types/locale.type';

export class GetMoviesByCategoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  page?: number;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: LocaleType = 'en-US';
}
