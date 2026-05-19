import { Expose } from 'class-transformer';
import { Matches } from 'class-validator';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class MovieEntity {
  @Expose()
  @PrimaryColumn({ unique: true })
  tmdbId!: number;

  @Expose()
  @Column()
  title!: string;

  @Expose()
  @Column()
  overview!: string;

  @Expose()
  @Column({ type: 'varchar', nullable: true })
  posterPath!: string | null;

  @Expose()
  @Column()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'releaseDate must be in format "YYYY-MM-DD" (e.g., "1970-01-01")',
  })
  releaseDate!: string;

  @Expose()
  @Column({ type: 'double precision' })
  voteAverage!: number;
}
