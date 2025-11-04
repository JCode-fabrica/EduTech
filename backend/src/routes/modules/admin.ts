import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';
import bcrypt from 'bcryptjs';
import { audit } from '../../services/audit';
import multer from 'multer';
import { uploadToR2 } from '../../services/r2';
import { lookup as mimeLookup } from 'mime-types';
import { randomBytes, createHash } from 'node:crypto';

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
  const body = req.body || {};
  let { nome, slug } = body as { nome: string; slug?: string };
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'invalid_nome' });
  if (!slug) {
    slug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  const created = await prisma.escola.create({
    data: {
      nome,
      slug,
      endereco: body.endereco || null,
      contato_nome: body.contato_nome || null,
      contato_cpf: body.contato_cpf || null,
      contato_email: body.contato_email || null,
      contato_tel: body.contato_tel || null,
      contrato_inicio: body.contrato_inicio ? new Date(body.contrato_inicio) : null,
      contrato_fim: body.contrato_fim ? new Date(body.contrato_fim) : null,
      observacoes: body.observacoes || null
    }
  });
  await audit('CREATE_ESCOLA', { actorId: req.user!.id, escolaId: created.id, meta: { nome } });
  return res.status(201).json(created);
});

router.put('/escolas/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body || {};
  const data: any = { ...body };
  if (body.contrato_inicio) data.contrato_inicio = new Date(body.contrato_inicio);
  if (body.contrato_fim) data.contrato_fim = new Date(body.contrato_fim);
  const updated = await prisma.escola.update({ where: { id: req.params.id }, data });
  await audit('UPDATE_ESCOLA', { actorId: req.user!.id, escolaId: updated.id, meta: data });
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
    // gerar senha aleatÃ³ria
    plain = Math.random().toString(36).slice(-10);
  }
  senha_hash = await bcrypt.hash(plain, 10);
  const must_change = rest.role === 'coordenacao';
  const created = await prisma.usuario.create({
    data: { ...rest, senha_hash, escola_id: req.params.id, must_change_password: must_change }
  });
  await audit('CREATE_USUARIO', { actorId: req.user!.id, escolaId: req.params.id, meta: { id: created.id, role: created.role } });
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

// Policies por escola
router.get('/escolas/:id/policy', requireAuth, requireRole(['admin']), async (req, res) => {
  const pol = await prisma.escolaPolicy.findFirst({ where: { escola_id: req.params.id }, orderBy: { updated_at: 'desc' } });
  return res.json(pol || {});
});

router.put('/escolas/:id/policy', requireAuth, requireRole(['admin']), async (req, res) => {
  const existing = await prisma.escolaPolicy.findFirst({ where: { escola_id: req.params.id } });
  let saved;
  if (existing) {
    saved = await prisma.escolaPolicy.update({ where: { id: existing.id }, data: { ...req.body, escola_id: req.params.id } });
  } else {
    saved = await prisma.escolaPolicy.create({ data: { ...req.body, escola_id: req.params.id } });
  }
  await audit('UPSERT_POLICY', { actorId: req.user!.id, escolaId: req.params.id, meta: req.body });
  return res.json(saved);
});

// Users list (admin-wide or filtered by escola)
router.get('/admin/users', requireAuth, requireRole(['admin']), async (req, res) => {
  const escolaId = (req.query.escola_id as string) || undefined;
  const users = await prisma.usuario.findMany({ where: { escola_id: escolaId }, orderBy: { nome: 'asc' } });
  return res.json(users.map((u) => ({ ...u, senha_hash: undefined })));
});

router.patch('/admin/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const data: any = {};
  if (req.body?.role) data.role = req.body.role;
  if (typeof req.body?.ativo === 'boolean') data.ativo = req.body.ativo;
  const updated = await prisma.usuario.update({ where: { id: req.params.id }, data });
  await audit('UPDATE_USER', { actorId: req.user!.id, escolaId: updated.escola_id || undefined, meta: data });
  return res.json({ ...updated, senha_hash: undefined });
});

// Invite flow
router.post('/admin/users/invite', requireAuth, requireRole(['admin']), async (req, res) => {
  const { escola_id, email, role, expires_minutes = 60 } = req.body || {};
  if (!escola_id || !email || !role) return res.status(400).json({ error: 'missing_fields' });
  const token = `ivk_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + Number(expires_minutes) * 60 * 1000);
  const iv = await prisma.inviteToken.create({ data: { escola_id, email: email.toLowerCase(), role, token_hash: hash, expires_at: expires } });
  await audit('CREATE_INVITE', { actorId: req.user!.id, escolaId: escola_id, meta: { email, role } });
  return res.status(201).json({ id: iv.id, token, expires_at: iv.expires_at });
});

// Overview KPIs
router.get('/admin/overview', requireAuth, requireRole(['admin']), async (_req, res) => {
  const escolas = await prisma.escola.count();
  const professores = await prisma.usuario.count({ where: { role: 'professor' } });
  const coordenacoes = await prisma.usuario.count({ where: { role: 'coordenacao' } });
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30);
  const provasHoje = await prisma.prova.count({ where: { created_at: { gte: startOfDay } } });
  const provasSemana = await prisma.prova.count({ where: { created_at: { gte: startOfWeek } } });
  const provasMes = await prisma.prova.count({ where: { created_at: { gte: startOfMonth } } });
  const aprovadas = await prisma.prova.count({ where: { status: 'APPROVED' } });
  const revisao = await prisma.prova.count({ where: { status: 'SUBMITTED' } });
  const ajustes = await prisma.prova.count({ where: { status: 'CHANGES_REQUESTED' } });
  const ia = await prisma.analiseIA.aggregate({ _sum: { tokens_in: true, tokens_out: true, cost_cents: true } });
  const jobsFalha = await prisma.job.count({ where: { status: 'failed' } });
  const jobsPend = await prisma.job.count({ where: { status: 'pending' } });
  return res.json({
    cards: { escolas, professores, coordenacoes, provasHoje, provasSemana, provasMes, aprovadas, revisao, ajustes, tokens_in: ia._sum.tokens_in || 0, tokens_out: ia._sum.tokens_out || 0, cost_cents: ia._sum.cost_cents || 0, jobs_falha: jobsFalha, jobs_pend: jobsPend }
  });
});

// Logs
router.get('/admin/logs', requireAuth, requireRole(['admin']), async (req, res) => {
  const escolaId = (req.query.escola_id as string) || undefined;
  const logs = await prisma.auditLog.findMany({
    where: { escola_id: escolaId },
    orderBy: { created_at: 'desc' },
    take: 200
  });
  return res.json(logs);
});

// Observabilidade
router.get('/admin/metrics', requireAuth, requireRole(['admin']), async (_req, res) => {
  return res.json({ db: 'ok', r2: !!process.env.R2_ACCOUNT_ID, openai: !!process.env.OPENAI_API_KEY, time: new Date().toISOString() });
});

// Reports agregados
router.get('/admin/reports', requireAuth, requireRole(['admin']), async (req, res) => {
  const escolaId = (req.query.escola_id as string) || undefined;
  const days = Number((req.query.range as string)?.replace('d', '')) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const whereBase: any = { created_at: { gte: since } };
  if (escolaId) whereBase.escola_id = escolaId;

  const total = await prisma.prova.count({ where: whereBase });
  const aprovadas = await prisma.prova.count({ where: { ...whereBase, status: 'APPROVED' } });
  const revisao = await prisma.prova.count({ where: { ...whereBase, status: 'SUBMITTED' } });
  const ajustes = await prisma.prova.count({ where: { ...whereBase, status: 'CHANGES_REQUESTED' } });
  const iaAgg = await prisma.analiseIA.groupBy({ by: ['prova_id'], where: { created_at: { gte: since } }, _sum: { tokens_in: true, tokens_out: true, cost_cents: true } });
  const tokens_in = iaAgg.reduce((a, b) => a + (b._sum.tokens_in || 0), 0);
  const tokens_out = iaAgg.reduce((a, b) => a + (b._sum.tokens_out || 0), 0);
  const cost_cents = iaAgg.reduce((a, b) => a + (b._sum.cost_cents || 0), 0);

  // SÃ©rie simples por dia
  const series: Record<string, number> = {};
  const provas = await prisma.prova.findMany({ where: whereBase, select: { created_at: true } });
  for (const p of provas) {
    const k = p.created_at.toISOString().slice(0, 10);
    series[k] = (series[k] || 0) + 1;
  }
  const provasPorDia = Object.entries(series).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

  // Top professores por uso IA
  const analises = await prisma.analiseIA.findMany({ where: { created_at: { gte: since } }, include: { prova: true } });
  const porAutor: Record<string, { tokens: number; count: number }> = {};
  for (const a of analises) {
    const autor = a.prova.autor_id;
    porAutor[autor] = porAutor[autor] || { tokens: 0, count: 0 };
    porAutor[autor].tokens += (a.tokens_in || 0) + (a.tokens_out || 0);
    porAutor[autor].count += 1;
  }
  const ids = Object.keys(porAutor);
  const usuarios = ids.length ? await prisma.usuario.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true, email: true } }) : [];
  const byId: Record<string, { nome: string | null; email: string }>= {};
  for (const u of usuarios) byId[u.id] = { nome: u.nome, email: u.email };
  const topProfessores = Object.entries(porAutor)
    .map(([id, v]) => ({ id, nome: byId[id]?.nome || null, email: byId[id]?.email || '', tokens: v.tokens, analises: v.count }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  return res.json({ total, aprovadas, revisao, ajustes, tokens_in, tokens_out, cost_cents, provasPorDia, topProfessores });
});

// Jobs list + retry
router.get('/admin/jobs', requireAuth, requireRole(['admin']), async (_req, res) => {
  const jobs = await prisma.job.findMany({ orderBy: { created_at: 'desc' }, take: 200 });
  return res.json(jobs);
});

router.post('/admin/jobs/:id/retry', requireAuth, requireRole(['admin']), async (req, res) => {
  const updated = await prisma.job.update({ where: { id: req.params.id }, data: { status: 'pending', error: null } });
  await audit('RETRY_JOB', { actorId: req.user!.id, escolaId: updated.escola_id || undefined, meta: { id: updated.id } });
  return res.json(updated);
});

// Process pending jobs (simple worker simulation)
router.post('/admin/jobs/process', requireAuth, requireRole(['admin']), async (_req, res) => {
  const pend = await prisma.job.findMany({ where: { status: 'pending' }, take: 10 });
  for (const j of pend) {
    if (j.type === 'PDF_RENDER') {
      await prisma.job.update({ where: { id: j.id }, data: { status: 'completed', result_url: `https://example.local/preview/${(j.payload as any)?.prova_id || 'file'}.pdf` } });
    }
  }
  return res.json({ processed: pend.length });
});

// Export per school
router.get('/escolas/:id/export/json', requireAuth, requireRole(['admin']), async (req, res) => {
  const escola = await prisma.escola.findFirst({ where: { id: req.params.id } });
  if (!escola) return res.status(404).json({ error: 'not_found' });
  const [turmas, materias, usuarios, templates, provas, imagens, analises, revisoes, logs] = await Promise.all([
    prisma.turma.findMany({ where: { escola_id: escola.id } }),
    prisma.materia.findMany({ where: { escola_id: escola.id } }),
    prisma.usuario.findMany({ where: { escola_id: escola.id } }),
    prisma.template.findMany({ where: { OR: [{ escola_id: escola.id }, { escola_id: null }] } }),
    prisma.prova.findMany({ where: { escola_id: escola.id } }),
    prisma.imagemUpload.findMany({ where: { escola_id: escola.id } }),
    prisma.analiseIA.findMany({ where: { prova: { escola_id: escola.id } } }),
    prisma.revisaoCoordenacao.findMany({ where: { prova: { escola_id: escola.id } } }),
    prisma.auditLog.findMany({ where: { escola_id: escola.id } })
  ]);
  return res.json({ escola, turmas, materias, usuarios, templates, provas, imagens, analises, revisoes, logs });
});


// Upload de branding da escola (logo/capa)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/uploads/escola-asset', requireAuth, requireRole(['admin']), upload.single('file'), async (req, res) => {
  try {
    const file = (req as any).file as any;
    const { escola_id, type } = (req.body || {}) as Record<string, string>;
    if (!file || !escola_id || !type) return res.status(400).json({ error: 'missing_fields' });
    const escola = await prisma.escola.findFirst({ where: { id: escola_id } });
    if (!escola) return res.status(404).json({ error: 'escola_not_found' });
    const ext = file.originalname.split('.').pop() || '';
    const guessed = (mimeLookup(ext) || '').toString();
    const ct = (file.mimetype || guessed || 'application/octet-stream').toString();
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
    if (!allowed.has(ct)) return res.status(400).json({ error: 'unsupported_media_type', contentType: ct });
    const { url } = await uploadToR2(file.buffer, ct, { escolaId: escola_id, provaId: 'branding', filename: file.originalname });
    if (type === 'logo') {
      await prisma.escola.update({ where: { id: escola_id }, data: { logo_url: url } });
    } else if (type === 'capa') {
      await prisma.escola.update({ where: { id: escola_id }, data: { pdf_capa_url: url } });
    }
    await audit('UPLOAD_ESCOLA_ASSET', { actorId: req.user!.id, escolaId: escola_id, meta: { type } });
    return res.status(201).json({ url });
  } catch (e: any) {
    return res.status(500).json({ error: 'upload_failed', detail: e?.message });
  }
});

// Turmas & matÃ©rias - delete/update bÃ¡sicos
router.delete('/turmas/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  await prisma.turma.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

router.delete('/materias/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  await prisma.materia.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
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




