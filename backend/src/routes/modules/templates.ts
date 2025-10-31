import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
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

// CRUD básico para admin
router.post('/templates', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body || {};
  const created = await prisma.template.create({ data: { nome: body.nome, regras_json: body.regras_json || {}, versao: body.versao || '1.0.0', ativo: true, escola_id: body.escola_id || null } });
  return res.status(201).json(created);
});

router.put('/templates/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body || {};
  const updated = await prisma.template.update({ where: { id: req.params.id }, data: { nome: body.nome, regras_json: body.regras_json, versao: body.versao, ativo: body.ativo } });
  return res.json(updated);
});

// Validação sandbox
router.post('/templates/:id/validate', requireAuth, requireRole(['admin']), async (req, res) => {
  const t = await prisma.template.findFirst({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'not_found' });
  const regras: any = t.regras_json || {};
  const prova = req.body?.prova || {};
  const issues: string[] = [];
  if (Array.isArray(regras.tipos_permitidos) && Array.isArray(prova.questoes)) {
    const tipos = new Set(regras.tipos_permitidos);
    if (prova.questoes.some((q: any) => !tipos.has(q.tipo))) issues.push('tipo_nao_permitido');
  }
  if (Array.isArray(regras.secoes) && Array.isArray(prova.questoes)) {
    const ordem = prova.questoes.map((q: any) => q.tipo);
    if (regras.secoes.join(',') === 'objetivas,dissertativas') {
      let seen = false;
      for (const t of ordem) { if (t === 'dissertativa') seen = true; if (t === 'objetiva' && seen) issues.push('ordem_objetivas_primeiro'); }
    }
  }
  return res.json({ ok: issues.length === 0, issues });
});

router.delete('/templates/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  await prisma.template.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

// Duplicate a template with new version
router.post('/templates/:id/duplicate', requireAuth, requireRole(['admin']), async (req, res) => {
  const base = await prisma.template.findFirst({ where: { id: req.params.id } });
  if (!base) return res.status(404).json({ error: 'not_found' });
  const versao = (req.body?.versao as string) || `${base.versao || '1.0.0'}-copy`;
  const created = await prisma.template.create({
    data: { escola_id: base.escola_id, nome: `${base.nome} (copy)`, regras_json: base.regras_json, versao, ativo: true }
  });
  return res.status(201).json(created);
});

export default router;
