import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';

export const router = Router();

router.get('/provas', requireAuth, requireRole(['coordenacao']), async (req, res) => {
  const status = (req.query.status as string) || 'SUBMITTED';
  const provas = await prisma.prova.findMany({
    where: { escola_id: req.user!.escola_id, status: status as any },
    orderBy: { updated_at: 'desc' }
  });
  return res.json(provas);
});

router.post('/provas/:id/approve', requireAuth, requireRole(['coordenacao']), async (req, res) => {
  const id = req.params.id;
  const prova = await prisma.prova.findFirst({ where: { id, escola_id: req.user!.escola_id } });
  if (!prova) return res.status(404).json({ error: 'not_found' });
  const updated = await prisma.prova.update({ where: { id }, data: { status: 'APPROVED' } });
  await prisma.revisaoCoordenacao.create({
    data: {
      prova_id: id,
      coordenador_id: req.user!.id,
      status: 'APPROVED',
      comentario: (req.body?.comentario as string) || null
    }
  });
  return res.json({ id: updated.id, status: updated.status });
});

router.post('/provas/:id/request-changes', requireAuth, requireRole(['coordenacao']), async (req, res) => {
  const id = req.params.id;
  const comentario = (req.body?.comentario as string) || 'Ajustes necessários';
  const prova = await prisma.prova.findFirst({ where: { id, escola_id: req.user!.escola_id } });
  if (!prova) return res.status(404).json({ error: 'not_found' });
  const updated = await prisma.prova.update({ where: { id }, data: { status: 'CHANGES_REQUESTED' } });
  await prisma.revisaoCoordenacao.create({
    data: { prova_id: id, coordenador_id: req.user!.id, status: 'CHANGES_REQUESTED', comentario }
  });
  return res.json({ id: updated.id, status: updated.status, comentario });
});

router.get('/provas/:id/relatorio', requireAuth, requireRole(['coordenacao']), async (req, res) => {
  const id = req.params.id;
  const prova = await prisma.prova.findFirst({
    where: { id, escola_id: req.user!.escola_id },
    include: { questoes: true, analises: true, imagens: true, autor: true, turma: true, materia: true, template: true }
  });
  if (!prova) return res.status(404).json({ error: 'not_found' });
  const relatorio = {
    cabecalho: {
      escola_id: prova.escola_id,
      professor: prova.autor.nome,
      disciplina: prova.materia.nome,
      turma: prova.turma.nome_exibicao,
      tema: prova.titulo_interno
    },
    conformidade: [],
    ia: prova.analises[0]?.resumo_scores || {},
    imagens: prova.imagens.map((i) => ({ ref: i.ref_code, inline_glossario: i.prefer_glossary ? 'glossário' : 'inline', legenda: i.legenda, alt_text: i.alt_text })),
    uso_ia: prova.analises[0]?.uso || {},
    comentarios: await prisma.revisaoCoordenacao.findMany({ where: { prova_id: id }, orderBy: { created_at: 'asc' } })
  };
  return res.json({ formato: 'JSON', data: relatorio });
});

export default router;
