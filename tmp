import { prisma } from './db';
import bcrypt from 'bcryptjs';

export async function bootstrapAdmin() {
  const existingUsers = await prisma.usuario.count();
  if (existingUsers > 0) return;

  const escola = await prisma.escola.create({
    data: {
      nome: process.env.ADMIN_SCHOOL_NAME || 'Escola Demo',
      slug: 'escola-demo'
    }
  });

  const senha = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(senha, 10);
  await prisma.usuario.create({
    data: {
      escola_id: null,
      nome: 'Admin JCode',
      email: process.env.ADMIN_EMAIL || 'admin@demo.com',
      role: 'admin',
      senha_hash: hash,
      ativo: true
    }
  });
  // opcional: dados mínimos
  await prisma.turma.create({ data: { escola_id: escola.id, nome_exibicao: '1A', ano_letivo: 2025, turno: 'manhã' } });
  await prisma.materia.create({ data: { escola_id: escola.id, nome: 'Matemática' } });
}
