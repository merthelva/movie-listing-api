import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { MovieEntity } from '@/movies/entity/movie.entity';
import { UserEntity } from '@/users/entity/user.entity';

@Entity()
@Unique(['name', 'user'])
export class WatchlistEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => UserEntity, (user) => user.watchlists, {
    onDelete: 'CASCADE',
  })
  user!: UserEntity;

  @ManyToMany(() => MovieEntity)
  @JoinTable({
    name: 'watchlist_movies',
    joinColumn: {
      name: 'watchlist_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'movie_tmdb_id',
      referencedColumnName: 'tmdbId',
    },
  })
  movies!: Array<MovieEntity>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
