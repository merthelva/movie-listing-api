import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateWatchlistDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9#\.\s_-]+$/, {
    message:
      'name contains invalid characters; only letters, numbers, spaces, hyphens and underscores are allowed',
  })
  name!: string;
}
