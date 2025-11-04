import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { uploadToR2 } from '../../services/r2';
import { audit } from '../../services/audit';
import type { Request } from 'express';

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
  const escolaId = (req.query.escola_id as string) || req.user!.escola_id;
  const rows = await prisma.template.findMany({
    where: { escola_id: escolaId, ativo: true },
    orderBy: [{ nome: 'asc' }]
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

// CRUD basico para admin
router.post('/templates', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body || {};
  const created = await prisma.template.create({
    data: {
      nome: body.nome,
      regras_json: (body.regras_json ?? {}) as Prisma.InputJsonValue,
      versao: body.versao || '1.0.0',
      ativo: true,
      escola_id: body.escola_id || req.user!.escola_id || null
    }
  });
  return res.status(201).json(created);
});

router.put('/templates/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body || {};
  const regras = body.regras_json === null ? Prisma.JsonNull : (body.regras_json as Prisma.InputJsonValue | undefined);
  const updated = await prisma.template.update({
    where: { id: req.params.id },
    data: { nome: body.nome, regras_json: regras, versao: body.versao, ativo: body.ativo }
  });
  return res.json(updated);
});

// Validacao sandbox
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
      for (const t of ordem) {
        if (t === 'dissertativa') seen = true;
        if (t === 'objetiva' && seen) issues.push('ordem_objetivas_primeiro');
      }
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
  const regras = base.regras_json === null ? Prisma.JsonNull : (base.regras_json as Prisma.InputJsonValue);
  const created = await prisma.template.create({
    data: { escola_id: base.escola_id, nome: `${base.nome} (copy)`, regras_json: regras, versao, ativo: true }
  });
  return res.status(201).json(created);
});

// ===== New: Import DOCX -> Canonical via IA (stub) =====
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

type ImportDocxBody = {
  escola_id: string;
  nome_sugerido?: string;
  arquivo_docx_url?: string;
  usar_ia?: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

router.post('/templates/import-docx', requireAuth, requireRole(['admin']), upload.single('docx'), async (req: Request, res) => {
  try {
    const body = (req.body || {}) as unknown as ImportDocxBody;
    const escolaId = body.escola_id || req.user!.escola_id;
    if (!escolaId) return res.status(400).json({ error: 'missing_escola_id' });

    // Source: either provided URL or uploaded file -> upload to R2
    let sourceUrl = body.arquivo_docx_url || '';
    if (!sourceUrl) {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: 'missing_docx' });
      const ct = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const up = await uploadToR2(file.buffer, ct, { escolaId, provaId: 'template', filename: file.originalname || 'template.docx' });
      sourceUrl = up.url;
    }

    // Stub: convert DOCX -> HTML (real: mammoth/pandoc)
    const docxHtml = `<div class="docx-stub">Template importado. Fonte: ${sourceUrl}</div>`;

    // Stub: IA canonical output (real: OpenAI call)
    const suggestedName = body.nome_sugerido || 'Template Prova (DOCX)';
    const canonical = {
      nome: suggestedName,
      slug: slugify(suggestedName),
      metadata: { serie: null, disciplina_padrao: null, observacoes: 'Gerado automaticamente (stub)', gabarito_modelo: null },
      schema_json: {
        title: suggestedName,
        type: 'object',
        required: ['header', 'questoes'],
        properties: {
          header: {
            type: 'object',
            required: ['escola_nome', 'turma', 'disciplina', 'professor', 'data'],
            properties: {
              logo_url: { type: 'string' },
              escola_nome: { type: 'string' },
              turma: { type: 'string' },
              disciplina: { type: 'string' },
              professor: { type: 'string' },
              data: { type: 'string', format: 'date' },
              instrucoes: { type: 'string', default: 'Marque apenas uma alternativa.' }
            }
          },
          questoes: {
            type: 'array', minItems: 1, maxItems: 50,
            items: {
              type: 'object', required: ['enunciado','tipo'],
              properties: {
                tipo: { type: 'string', enum: ['multiple_choice','discursiva','sem_espaco','vf','relacionar'] },
                enunciado: { type: 'string' },
                peso: { type: 'number', default: 1 },
                alternativas: { type: 'object', properties: { a:{type:'string'}, b:{type:'string'}, c:{type:'string'}, d:{type:'string'}, e:{type:'string'} } },
                gabarito: { type: 'string', enum: ['a','b','c','d','e'], nullable: true },
                linhas_resposta: { type: 'integer', minimum: 0, default: 0 },
                sem_espaco: { type: 'boolean', default: false }
              }
            }
          }
        }
      },
      layout_hbs: `<div class="sheet"><header><img src="{{header.logo_url}}" alt="logo" style="height:40px;"/> <div>{{header.escola_nome}} - {{header.turma}} - {{header.disciplina}} - {{header.professor}} - {{header.data}}</div></header><main>{{#each questoes as |q idx|}}<section class="questao break-inside-avoid"><strong>{{inc idx}})</strong> {{q.enunciado}} {{#if (eq q.tipo 'multiple_choice')}}<ul>{{#each (letters q.alternativas) as |alt|}}<li>({{alt.key}}) {{alt.val}}</li>{{/each}}</ul>{{/if}}{{#if (gt q.linhas_resposta 0)}}<div class="linhas">{{repeat q.linhas_resposta "<hr/>"}}</div>{{/if}}</section>{{/each}}</main></div>`,
      css_extra: '.break-inside-avoid{break-inside:avoid;} .sheet{font-size:12pt;}',
      regras_pag: { avoid_break_inside: ['questao'], max_questions_per_page: 6, min_lines_per_question: 2 },
      mapping: { strategy: 'docx_html_rules', hints: ['stub'] },
      source_docx_url: sourceUrl,
      sample_data: {
        header: { logo_url: '', escola_nome: 'Minha Escola', turma: '6A', disciplina: 'Matematica', professor: 'Prof Demo', data: new Date().toISOString().slice(0,10), instrucoes: 'Marque apenas uma alternativa.' },
        questoes: [ { tipo:'multiple_choice', enunciado:'Quanto eh 12 x 8?', peso:1, alternativas: { a:'80', b:'96', c:'108', d:'112' }, gabarito:'b' } ]
      },
      review_flags: [] as string[]
    };

    // Persistir como rascunho dentro de regras_json (para nao quebrar schema atual)
    const created = await prisma.template.create({
      data: {
        escola_id: escolaId,
        nome: canonical.nome,
        versao: '1',
        ativo: false,
        regras_json: { canonical } as any
      }
    });

    await audit('IMPORT_TEMPLATE_DOCX', { actorId: req.user!.id, escolaId: escolaId, meta: { template_id: created.id } });
    return res.status(201).json({ template_id: created.id, status: 'draft', preview_url: `/api/render/preview?template_id=${created.id}` });
  } catch (e: any) {
    return res.status(500).json({ error: 'import_failed', detail: e?.message });
  }
});

// Publicar template (versao simples): ativa e desativa outros com mesmo slug (se houver)
router.post('/templates/:id/publish', requireAuth, requireRole(['admin']), async (req, res) => {
  const t = await prisma.template.findFirst({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'not_found' });
  const schoolId = t.escola_id || req.user!.escola_id;
  const canonical: any = (t.regras_json as any)?.canonical || {};
  const slug = canonical.slug || t.id;
  await prisma.template.updateMany({ where: { escola_id: schoolId, ativo: true, NOT: { id: t.id } }, data: { ativo: false } });
  const updated = await prisma.template.update({ where: { id: t.id }, data: { ativo: true } });
  await audit('PUBLISH_TEMPLATE', { actorId: req.user!.id, escolaId: schoolId || undefined, meta: { id: t.id, slug } });
  return res.json({ id: updated.id, ativo: updated.ativo });
});

// Render preview (HTML)
router.post('/render/preview', requireAuth, async (req, res) => {
  const { template_id, layout_hbs, css_extra, data } = req.body || {};
  let layout = layout_hbs as string | undefined;
  let css = (css_extra as string) || '';
  let payload = data as any;
  if (template_id && !layout) {
    const t = await prisma.template.findFirst({ where: { id: String(template_id) } });
    if (!t) return res.status(404).json({ error: 'not_found' });
    const canonical: any = (t.regras_json as any)?.canonical || {};
    layout = canonical.layout_hbs;
    css = canonical.css_extra || '';
    payload = canonical.sample_data || {};
  }
  if (!layout) return res.status(400).json({ error: 'missing_layout' });
  const Handlebars = require('handlebars');
  Handlebars.registerHelper('eq', (a: any, b: any) => (a === b));
  Handlebars.registerHelper('inc', (i: number) => i + 1);
  Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
  Handlebars.registerHelper('repeat', (n: number, s: string) => new Array(Math.max(0, n)).fill(s).join(''));
  Handlebars.registerHelper('letters', (alts: any) => Object.entries(alts || {}).map(([k,v]) => ({ key: k, val: v })));
  const tpl = Handlebars.compile(String(layout));
  const body = tpl(payload || {});
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${body}</body></html>`;
  return res.json({ html });
});

// Render PDF (stub via Job)
router.post('/render/pdf', requireAuth, async (req, res) => {
  const id = `tmpl_${Date.now()}`;
  const job = await prisma.job.create({ data: { escola_id: req.user!.escola_id || null, type: 'PDF_RENDER', status: 'pending', payload: { kind: 'template', id } as any } });
  return res.status(201).json({ job_id: job.id });
});

export default router;
