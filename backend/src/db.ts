import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});


// Keeps a lightweight connection alive to avoid PgBouncer/Neon idle closes
export function keepPrismaAlive(intervalMs = 240_000) {
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // best-effort; errors here are non-fatal
    }
  }, Math.max(60_000, intervalMs));
}
