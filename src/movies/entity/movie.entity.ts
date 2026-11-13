import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';

import type { FavoritelistEntity } from '@/favoritelists/entity/favoritelist.entity';
import type { WatchlistEntity } from '@/watchlists/entity/watchlist.entity';

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

  // Inverse sides of the list <-> movie join tables. Never loaded or exposed;
  // they exist only because TypeORM reads the movie-side FK rule from here.
  // NO ACTION: the DB refuses to delete a movie that is still on a list.
  @ManyToMany('FavoritelistEntity', (list: FavoritelistEntity) => list.movies, {
    onDelete: 'NO ACTION',
  })
  favoritelists?: Array<FavoritelistEntity>;

  @ManyToMany('WatchlistEntity', (list: WatchlistEntity) => list.movies, {
    onDelete: 'NO ACTION',
  })
  watchlists?: Array<WatchlistEntity>;
}
