import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';

export const router = Router();

router.post('/escolas', requireAuth, requireRole(['admin']), async (req, res) => {
  const created = await prisma.escola.create({ data: req.body });
  return res.status(201).json(created);
});

router.post('/escolas/:id/turmas', requireAuth, requireRole(['admin']), async (req, res) => {
  const created = await prisma.turma.create({ data: { ...req.body, escola_id: req.params.id } });
  return res.status(201).json(created);
});

router.post('/escolas/:id/materias', requireAuth, requireRole(['admin']), async (req, res) => {
  const created = await prisma.materia.create({ data: { ...req.body, escola_id: req.params.id } });
  return res.status(201).json(created);
});

router.post('/escolas/:id/usuarios', requireAuth, requireRole(['admin']), async (req, res) => {
  const created = await prisma.usuario.create({ data: { ...req.body, escola_id: req.params.id } });
  return res.status(201).json(created);
});

router.post('/vinculos/professor-turma', requireAuth, requireRole(['admin']), async (req, res) => {
  const created = await prisma.professorTurma.create({ data: req.body });
  return res.status(201).json(created);
});

router.post('/vinculos/professor-turma-materia', requireAuth, requireRole(['admin']), async (req, res) => {
  const created = await prisma.professorTurmaMateria.create({ data: req.body });
  return res.status(201).json(created);
});

export default router;
