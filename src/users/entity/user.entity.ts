import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Roles } from '@/common/constants/roles.constant';
import type { RoleType } from '@/common/types/roles.type';
import type { FavoritelistEntity } from '@/favoritelists/entity/favoritelist.entity';
import type { WatchlistEntity } from '@/watchlists/entity/watchlist.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index() // efficient for db read operations for large tables
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'varchar', default: Roles.USER })
  role!: RoleType;

  @Column({ default: 1 })
  tokenVersion!: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @OneToMany('WatchlistEntity', (watchlist: WatchlistEntity) => watchlist.user)
  watchlists!: WatchlistEntity[];

  @OneToMany(
    'FavoritelistEntity',
    (favoritelist: FavoritelistEntity) => favoritelist.user,
  )
  favoritelists!: FavoritelistEntity[];
}
