import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AcceptLanguageResolver,
  I18nModule,
  I18nValidationPipe,
} from 'nestjs-i18n';

import { SeedModule } from '@/seed/seed.module';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { TimeoutInterceptor } from '@/common/interceptors/timeout.interceptor';
import { envValidationSchema } from '@/config/env.validation';
import { buildThrottlerOptions } from '@/config/throttler.config';
import { AuthModule } from '@auth/auth.module';
import { FavoritelistsModule } from '@favoritelists/favoritelists.module';
import { HealthModule } from '@health/health.module';
import { MoviesModule } from '@movies/movies.module';
import { UsersModule } from '@users/users.module';
import { WatchlistsModule } from '@watchlists/watchlists.module';

import { DB_ENTITIES } from './database/constants/db-entities.constant';
import { DB_MIGRATIONS } from './database/constants/db-migrations.constant';

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
        // DB_* are required by the env schema (Joi); no hidden fallbacks.
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: DB_ENTITIES,
        migrations: DB_MIGRATIONS,
        migrationsRun: true,
        // Schema is owned by migrations in every environment.
        synchronize: false,
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
    // Registered here (not in main.ts) so e2e tests that boot AppModule get
    // exactly the same filter, pipe and interceptor as production.
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new I18nValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new TimeoutInterceptor(
          configService.getOrThrow<number>('REQUEST_TIMEOUT_MS'),
        ),
    },
  ],
})
export class AppModule {}
