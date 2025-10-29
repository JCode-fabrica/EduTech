import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';

export const router = Router();

router.get('/minhas-turmas', requireAuth, requireRole(['professor']), async (req, res) => {
  const vincs = await prisma.professorTurma.findMany({
    where: { professor_id: req.user!.id },
    include: { turma: true }
  });
  return res.json(vincs.map((v) => v.turma));
});

router.get('/minhas-materias', requireAuth, requireRole(['professor']), async (req, res) => {
  const { turma_id } = req.query as { turma_id?: string };
  const where: any = { professor_turma: { professor_id: req.user!.id } };
  if (turma_id) where.professor_turma.turma_id = turma_id;
  const vincs = await prisma.professorTurmaMateria.findMany({
    where,
    include: { materia: true }
  });
  const materias = vincs.map((v) => v.materia);
  return res.json(materias);
});

export default router;
