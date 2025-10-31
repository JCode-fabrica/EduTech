import { prisma } from '../db';

export async function audit(action: string, params: { actorId?: string | null; escolaId?: string | null; meta?: any } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actor_user_id: params.actorId || null,
        escola_id: params.escolaId || null,
        meta: params.meta ?? null
      }
    });
  } catch (e) {
    // best-effort
  }
}

