import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '@users/entity/user.entity';
import { MovieEntity } from '@movies/entity/movie.entity';

@Entity()
@Unique(['name', 'user'])
export class FavoritelistEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => UserEntity, (user) => user.favoritelists, {
    onDelete: 'CASCADE',
  })
  user!: UserEntity;

  @ManyToMany(() => MovieEntity)
  @JoinTable({
    name: 'favoritelist_movies',
    joinColumn: {
      name: 'favoritelist_id',
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
