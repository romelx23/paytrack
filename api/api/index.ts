import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import { createExpressHandler } from '../src/create-app.js';

// Vercel ejecuta este archivo como función serverless. La app Nest se crea una vez por
// instancia caliente y se reutiliza en las siguientes peticiones.
let instance: Promise<Express> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  instance ??= createExpressHandler();
  const app = await instance;
  app(req, res);
}
