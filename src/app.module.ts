import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { UserEntity } from '@users/entity/user.entity';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import { MoviesModule } from '@movies/movies.module';
import { WatchlistsModule } from '@watchlists/watchlists.module';
import { MovieEntity } from '@movies/entity/movie.entity';
import { AppController } from '@/app.controller';
import { SeedModule } from '@/seed/seed.module';
import { FavoritelistsModule } from '@favoritelists/favoritelists.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ limit: 60, ttl: 60_000 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development', // TODO: change to .env.production in production environment
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
        entities: [UserEntity, WatchlistEntity, MovieEntity, FavoritelistEntity],
        synchronize: true,
        logging: true,
      }),
    }),
    AuthModule,
    UsersModule,
    MoviesModule,
    WatchlistsModule,
    FavoritelistsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
