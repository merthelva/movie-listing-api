import { Expose } from 'class-transformer';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class MovieEntity {
  @Expose()
  @PrimaryColumn()
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
  @Column({ type: 'double precision' })
  voteAverage!: number;

  @Expose()
  @Column()
  voteCount!: number;

  @Expose()
  @Column({ type: 'bigint' })
  budget!: number;

  @Expose()
  @Column({ type: 'bigint' })
  revenue!: number;

  @Expose()
  @Column({ type: 'int', nullable: true })
  runtime!: number | null;

  @Expose()
  @Column('text', { array: true, default: [] })
  genres!: Array<string>;
}
