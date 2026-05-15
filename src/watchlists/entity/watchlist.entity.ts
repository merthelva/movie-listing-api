import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '@users/entity/user.entity';
import { MovieEntity } from '@movies/entity/movie.entity';

@Entity()
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
  @JoinTable()
  movies!: Array<MovieEntity>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
