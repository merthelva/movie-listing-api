import helmet from 'helmet';
import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { json } from 'express';

import { AppModule } from '@/app.module';

// The global filter, validation pipe and timeout interceptor live in AppModule
// (APP_FILTER / APP_PIPE / APP_INTERCEPTOR), not here.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Get the underlying Express instance and set trust proxy:
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.enableShutdownHooks();
  // helmet first: its headers must also be on CORS preflight responses and on
  // errors raised by the middleware registered after it.
  app.use(helmet()); // TODO: Verify headers are present after production deployment: ex: `curl -I https://api.yourdomain.com/api/health`
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
  app.use(json({ limit: '1mb' }));
  app.setGlobalPrefix('api');
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
