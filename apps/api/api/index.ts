// Vercel serverless entrypoint for the NestJS API.
// Vercel routes all requests to this handler via vercel.json `rewrites`.

import 'reflect-metadata';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import express, { type Express } from 'express';
import { AppModule } from '../src/app.module';

let cachedApp: Express | null = null;

async function getApp(): Promise<Express> {
  if (cachedApp) return cachedApp;
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    cors: true,
    logger: ['error', 'warn'],
  });
  await app.init();
  cachedApp = expressApp;
  return cachedApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  return app(req as unknown as express.Request, res as unknown as express.Response);
}
