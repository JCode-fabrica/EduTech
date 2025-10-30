import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';
import bcrypt from 'bcryptjs';

export const router = Router();

// Listar escolas com contagem de coordenadores e professores
router.get('/escolas', requireAuth, requireRole(['admin']), async (_req, res) => {
  const escolas = await prisma.escola.findMany({ orderBy: { created_at: 'desc' } });
  const result = await Promise.all(
    escolas.map(async (e) => {
      const [coordenadores, professores] = await Promise.all([
        prisma.usuario.count({ where: { escola_id: e.id, role: 'coordenacao' } }),
        prisma.usuario.count({ where: { escola_id: e.id, role: 'professor' } })
      ]);
      return { ...e, coordenadores, professores };
    })
  );
  return res.json(result);
});

router.post('/escolas', requireAuth, requireRole(['admin']), async (req, res) => {
  const created = await prisma.escola.create({ data: req.body });
  return res.status(201).json(created);
});

router.put('/escolas/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const updated = await prisma.escola.update({ where: { id: req.params.id }, data: req.body });
  return res.json(updated);
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
  const { senha, ...rest } = req.body || {};
  let senha_hash: string | undefined;
  let plain = senha as string | undefined;
  if (!plain || plain.length === 0) {
    // gerar senha aleatória
    plain = Math.random().toString(36).slice(-10);
  }
  senha_hash = await bcrypt.hash(plain, 10);
  const must_change = rest.role === 'coordenacao';
  const created = await prisma.usuario.create({
    data: { ...rest, senha_hash, escola_id: req.params.id, must_change_password: must_change }
  });
  return res.status(201).json({ ...created, senha_hash: undefined, temp_password: must_change ? plain : undefined });
});

router.get('/escolas/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const escola = await prisma.escola.findFirst({ where: { id: req.params.id } });
  if (!escola) return res.status(404).json({ error: 'not_found' });
  const [turmas, materias, usuarios] = await Promise.all([
    prisma.turma.findMany({ where: { escola_id: escola.id }, orderBy: { nome_exibicao: 'asc' } }),
    prisma.materia.findMany({ where: { escola_id: escola.id }, orderBy: { nome: 'asc' } }),
    prisma.usuario.findMany({ where: { escola_id: escola.id }, orderBy: { nome: 'asc' } })
  ]);
  const resumo = {
    coordenadores: usuarios.filter((u) => u.role === 'coordenacao').length,
    professores: usuarios.filter((u) => u.role === 'professor').length
  };
  return res.json({ escola, turmas, materias, usuarios, resumo });
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
