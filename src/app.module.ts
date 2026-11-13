import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';

import { SeedModule } from '@/seed/seed.module';
import { envValidationSchema } from '@/config/env.validation';
import { buildThrottlerOptions } from '@/config/throttler.config';
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

import { InitialSchema1779552504166 } from './database/migrations/1779552504166-InitialSchema';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildThrottlerOptions,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      validationSchema: envValidationSchema,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en-US',
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [AcceptLanguageResolver],
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
        database: configService.get<string>(
          'DB_NAME',
          'user_movie_list_db_dev',
        ),
        entities: [
          UserEntity,
          WatchlistEntity,
          MovieEntity,
          FavoritelistEntity,
        ],
        migrations: [InitialSchema1779552504166],
        migrationsRun: true,
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
