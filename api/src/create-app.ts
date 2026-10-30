import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Express } from 'express';
import { AppModule } from './app.module.js';

// Configuración compartida por el servidor local y por la función serverless de Vercel.
export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  return app;
}

// Devuelve la instancia de Express que Vercel invoca como handler.
export async function createExpressHandler(): Promise<Express> {
  const app = await createNestApp();
  await app.init();
  return app.getHttpAdapter().getInstance() as Express;
}
