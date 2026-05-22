import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeedModule } from '@/seed/seed.module';
import { envValidationSchema } from '@/config/env.validation';
import { AuthModule } from '@auth/auth.module';
import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import { FavoritelistsModule } from '@favoritelists/favoritelists.module';
import { HealthModule } from '@health/health.module';
import { MovieEntity } from '@movies/entity/movie.entity';
import { MoviesModule } from '@movies/movies.module';
import { UserEntity } from '@users/entity/user.entity';
import { UsersModule } from '@users/users.module';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import { WatchlistsModule } from '@watchlists/watchlists.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ limit: 60, ttl: 60_000 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'task_manager'),
        entities: [
          UserEntity,
          WatchlistEntity,
          MovieEntity,
          FavoritelistEntity,
        ],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    MoviesModule,
    WatchlistsModule,
    FavoritelistsModule,
    SeedModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
