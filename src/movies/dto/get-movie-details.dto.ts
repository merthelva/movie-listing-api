import { IsIn, IsOptional } from 'class-validator';

import { SUPPORTED_LOCALES } from '@/common/constants/locale.constant';
import type { LocaleType } from '@/common/types/locale.type';

export class GetMovieDetailsDto {
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: LocaleType = 'en-US';
}
