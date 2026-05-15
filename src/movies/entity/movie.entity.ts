import { Expose } from 'class-transformer';
import { Column, PrimaryColumn } from 'typeorm';

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
  @Column({ nullable: true })
  posterPath!: string | null;

  @Expose()
  @Column()
  releaseDate!: string;

  @Expose()
  @Column()
  voteAverage!: number;
}
