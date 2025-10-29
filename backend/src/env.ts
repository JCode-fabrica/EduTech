import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const cwd = process.cwd();
const env = process.env.NODE_ENV || 'development';

const files = [
  path.join(cwd, 'backend', `.env`),
  path.join(cwd, 'backend', `.env.${env}`),
  path.join(cwd, 'backend', `.env.local`),
  path.join(cwd, 'backend', `.env.${env}.local`)
];

for (const file of files) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: true });
  }
}

export const ENV = {
  NODE_ENV: env,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  API_BASE_URL: process.env.API_BASE_URL
};

