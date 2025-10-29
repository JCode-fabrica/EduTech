import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../../db';

export const router = Router();

async function ensureDefaults() {
  const count = await prisma.template.count();
  if (count > 0) return;
  await prisma.template.createMany({
    data: [
      {
        id: 'tmpl_objetiva_simples',
        nome: 'Objetiva Simples',
        regras_json: { tipos_permitidos: ['objetiva'], alternativas: 4, embaralhamento: true },
        versao: '1.0.0',
        ativo: true
      },
      {
        id: 'tmpl_mista_bimestral',
        nome: 'Mista Bimestral',
        regras_json: { secoes: ['objetivas', 'dissertativas'], cabecalho: 'institucional fixo' },
        versao: '1.0.0',
        ativo: true
      },
      {
        id: 'tmpl_simulado_ab',
        nome: 'Simulado A/B',
        regras_json: { duas_versoes: true, glossario_obrigatorio: true },
        versao: '1.0.0',
        ativo: true
      }
    ]
  });
}

router.get('/templates', requireAuth, async (req, res) => {
  await ensureDefaults();
  const escolaId = req.user!.escola_id;
  const rows = await prisma.template.findMany({
    where: { OR: [{ escola_id: null }, { escola_id: escolaId }], ativo: true },
    orderBy: [{ escola_id: 'asc' }, { nome: 'asc' }]
  });
  return res.json(rows);
});

router.get('/templates/:id', requireAuth, async (req, res) => {
  const t = await prisma.template.findFirst({
    where: { id: req.params.id, OR: [{ escola_id: null }, { escola_id: req.user!.escola_id }] }
  });
  if (!t) return res.status(404).json({ error: 'not_found' });
  return res.json(t);
});

export default router;
