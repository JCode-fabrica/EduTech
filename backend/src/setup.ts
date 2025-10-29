import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import './env';
import path from 'node:path';
import fs from 'node:fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { router as api } from './routes';


export function createServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true
    })
  );

  app.use(helmet());
  app.use(morgan('dev'));

  // Health
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // OpenAPI
  const openapiPath = path.join(__dirname, '../openapi/openapi.yaml');
  const doc = YAML.parse(fs.readFileSync(openapiPath, 'utf-8'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(doc));

  // API
  app.use('/api', api);

  return app;
}
