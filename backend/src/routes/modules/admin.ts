import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';
import bcrypt from 'bcryptjs';
import { audit } from '../../services/audit';
import multer from 'multer';
import { uploadToR2 } from '../../services/r2';
import { lookup as mimeLookup } from 'mime-types';

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
    // gerar senha aleatória
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

// API Keys por escola
import crypto from 'node:crypto';

router.get('/escolas/:id/api-keys', requireAuth, requireRole(['admin']), async (req, res) => {
  const keys = await prisma.apiKey.findMany({ where: { escola_id: req.params.id }, orderBy: { created_at: 'desc' } });
  // Não retornamos o token real; apenas metadados
  return res.json(keys.map((k) => ({ id: k.id, name: k.name, active: k.active, last_used: k.last_used, created_at: k.created_at })));
});

router.post('/escolas/:id/api-keys', requireAuth, requireRole(['admin']), async (req, res) => {
  const name = (req.body?.name as string) || 'key';
  const token = `eduk_${crypto.randomBytes(24).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const created = await prisma.apiKey.create({ data: { escola_id: req.params.id, name, key_hash: hash } });
  await audit('CREATE_API_KEY', { actorId: req.user!.id, escolaId: req.params.id, meta: { id: created.id, name } });
  return res.status(201).json({ id: created.id, token });
});

router.patch('/api-keys/:id/disable', requireAuth, requireRole(['admin']), async (req, res) => {
  const updated = await prisma.apiKey.update({ where: { id: req.params.id }, data: { active: false } });
  await audit('DISABLE_API_KEY', { actorId: req.user!.id, escolaId: updated.escola_id, meta: { id: updated.id } });
  return res.json({ ok: true });
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
  const token = `ivk_${crypto.randomBytes(24).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
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

  // Série simples por dia
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
  const topProfessores = Object.entries(porAutor)
    .map(([id, v]) => ({ id, tokens: v.tokens, analises: v.count }))
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

router.get('/escolas/:id/export/csv', requireAuth, requireRole(['admin']), async (req, res) => {
  const tipo = (req.query.type as string) || 'usuarios';
  let rows: string[][] = [];
  if (tipo === 'usuarios') {
    const us = await prisma.usuario.findMany({ where: { escola_id: req.params.id } });
    rows = [['id', 'nome', 'email', 'role', 'ativo']].concat(us.map(u => [u.id, u.nome, u.email, u.role, String(u.ativo)]));
  } else if (tipo === 'turmas') {
    const ts = await prisma.turma.findMany({ where: { escola_id: req.params.id } });
    rows = [['id', 'nome_exibicao', 'ano_letivo', 'turno']].concat(ts.map(t => [t.id, t.nome_exibicao, String(t.ano_letivo), t.turno]));
  } else if (tipo === 'materias') {
    const ms = await prisma.materia.findMany({ where: { escola_id: req.params.id } });
    rows = [['id', 'nome']].concat(ms.map(m => [m.id, m.nome]));
  } else if (tipo === 'vinculos') {
    const vs = await prisma.professorTurma.findMany({ where: { turma: { escola_id: req.params.id } }, include: { materias: true, professor: true, turma: true } });
    rows = [['professor_email', 'turma_id', 'materia_id']];
    for (const v of vs) {
      for (const m of v.materias) rows.push([v.professor.email, v.turma_id, m.materia_id]);
    }
  }
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

// Import vínculos via CSV (professor_email,turma_id,materia_id)
router.post('/admin/import/vinculos', requireAuth, requireRole(['admin']), async (req, res) => {
  const { escola_id, csv } = req.body as { escola_id: string; csv: string };
  if (!escola_id || !csv) return res.status(400).json({ error: 'missing_fields' });
  const lines = csv.split(/\r?\n/).filter(Boolean);
  let createdPT = 0, createdPTM = 0;
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 && lines[0].toLowerCase().includes('professor')) continue;
    const parts = lines[i].split(',').map(s => s.replace(/^\s*"?|"?\s*$/g, ''));
    if (parts.length < 3) continue;
    const [email, turma_id, materia_id] = parts;
    const prof = await prisma.usuario.findFirst({ where: { email: email.toLowerCase(), escola_id, role: 'professor' } });
    if (!prof) continue;
    let pt = await prisma.professorTurma.findFirst({ where: { professor_id: prof.id, turma_id } });
    if (!pt) { pt = await prisma.professorTurma.create({ data: { professor_id: prof.id, turma_id } }); createdPT++; }
    const exists = await prisma.professorTurmaMateria.findFirst({ where: { professor_turma_id: pt.id, materia_id } });
    if (!exists) { await prisma.professorTurmaMateria.create({ data: { professor_turma_id: pt.id, materia_id } }); createdPTM++; }
  }
  await audit('IMPORT_VINCULOS', { actorId: req.user!.id, escolaId: escola_id, meta: { createdPT, createdPTM } });
  return res.json({ createdPT, createdPTM });
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

// Turmas & matérias - delete/update básicos
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
