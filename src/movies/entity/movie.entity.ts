import { Expose } from 'class-transformer';
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
  releaseDate!: string;

  @Expose()
  @Column()
  voteAverage!: number;
}
