import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../../db';
import multer from 'multer';
import { uploadToR2 } from '../../services/r2';
import { audit } from '../../services/audit';

export const router = Router();

// List templates by school
router.get('/templates', requireAuth, async (req, res) => {
  const escolaId = (req.query.escola_id as string) || req.user!.escola_id;
  if (!escolaId) return res.status(400).json({ error: 'missing_escola_id' });
  const rows = await prisma.template.findMany({
    where: { escola_id: escolaId },
    orderBy: [{ nome: 'asc' }],
    select: { id: true, nome: true, versao: true, ativo: true }
  });
  return res.json(rows);
});

// Get template (full) with school scope
router.get('/templates/:id', requireAuth, async (req, res) => {
  const t = await prisma.template.findFirst({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'not_found' });
  if (t.escola_id !== req.user!.escola_id && req.user!.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  return res.json(t);
});

// Create/update metadata (manual edit)
router.put('/templates/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const allowed: any = {};
  for (const k of ['nome', 'slug', 'metadata', 'schema_json', 'layout_hbs', 'css_extra', 'regras_pag', 'mapping', 'sample_data', 'ativo']) {
    if (req.body?.[k] !== undefined) allowed[k] = req.body[k];
  }
  const updated = await prisma.template.update({ where: { id: req.params.id }, data: allowed });
  return res.json(updated);
});

// Validate basic schema_json presence
router.post('/templates/:id/validate', requireAuth, requireRole(['admin']), async (req, res) => {
  const t = await prisma.template.findFirst({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'not_found' });
  const schema: any = (t as any).schema_json || {};
  const data = req.body?.data || {};
  const issues: string[] = [];
  if (!schema || schema.type !== 'object') issues.push('invalid_schema');
  if (Array.isArray(schema.required)) {
    for (const f of schema.required as string[]) {
      if (data[f] === undefined) issues.push(`missing_${f}`);
    }
  }
  return res.json({ ok: issues.length === 0, issues });
});

// Import DOCX -> canonical (IA stub)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

router.post('/templates/import-docx', requireAuth, requireRole(['admin']), upload.single('docx'), async (req, res) => {
  try {
    const escolaId = (req.body?.escola_id as string) || req.user!.escola_id;
    if (!escolaId) return res.status(400).json({ error: 'missing_escola_id' });

    let sourceUrl = (req.body?.arquivo_docx_url as string) || '';
    if (!sourceUrl) {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: 'missing_docx' });
      const ct = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const up = await uploadToR2(file.buffer, ct, { escolaId, provaId: 'template', filename: file.originalname || 'template.docx' });
      sourceUrl = up.url;
    }

    const suggested = (req.body?.nome_sugerido as string) || 'Template Prova (DOCX)';
    const canonical = {
      nome: suggested,
      slug: slugify(suggested),
      metadata: { serie: null, disciplina_padrao: null, observacoes: 'Gerado automaticamente (stub)', gabarito_modelo: null },
      schema_json: {
        title: suggested,
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
      layout_hbs: '<div class="sheet"><header><img src="{{header.logo_url}}" alt="logo" style="height:40px;"/> <div>{{header.escola_nome}} - {{header.turma}} - {{header.disciplina}} - {{header.professor}} - {{header.data}}</div></header><main>{{#each questoes as |q idx|}}<section class="questao break-inside-avoid"><strong>{{inc idx}})</strong> {{q.enunciado}} {{#if (eq q.tipo "multiple_choice")}}<ul>{{#each (letters q.alternativas) as |alt|}}<li>({{alt.key}}) {{alt.val}}</li>{{/each}}</ul>{{/if}}{{#if (gt q.linhas_resposta 0)}}<div class="linhas">{{{repeat q.linhas_resposta "<hr/>"}}}</div>{{/if}}</section>{{/each}}</main></div>',
      css_extra: '.break-inside-avoid{break-inside:avoid;} .sheet{font-size:12pt;}',
      regras_pag: { avoid_break_inside: ['questao'], max_questions_per_page: 6, min_lines_per_question: 2 },
      mapping: { strategy: 'docx_html_rules', hints: ['stub'] },
      source_docx_url: sourceUrl,
      sample_data: {
        header: { logo_url: '', escola_nome: 'Minha Escola', turma: '6A', disciplina: 'Matematica', professor: 'Prof Demo', data: new Date().toISOString().slice(0,10), instrucoes: 'Marque apenas uma alternativa.' },
        questoes: [ { tipo:'multiple_choice', enunciado:'Quanto eh 12 x 8?', peso:1, alternativas: { a:'80', b:'96', c:'108', d:'112' }, gabarito:'b' } ]
      }
    };

    const created = await prisma.template.create({
      data: ({
      data: {
        escola_id: escolaId,
        nome: canonical.nome,
        slug: canonical.slug,
        versao: (1 as any),
        ativo: false,
        metadata: canonical.metadata as any,
        schema_json: canonical.schema_json as any,
        layout_hbs: canonical.layout_hbs,
        css_extra: canonical.css_extra,
        regras_pag: canonical.regras_pag as any,
        mapping: canonical.mapping as any,
        source_docx_url: sourceUrl,
        sample_data: canonical.sample_data as any
      }
      } as any)
    });

    await audit('IMPORT_TEMPLATE_DOCX', { actorId: req.user!.id, escolaId: escolaId, meta: { template_id: created.id } });
    return res.status(201).json({ template_id: created.id, status: 'draft', preview_url: `/api/render/preview?template_id=${created.id}` });
  } catch (e: any) {
    return res.status(500).json({ error: 'import_failed', detail: e?.message });
  }
});

// Publish template: bump version for same slug within school and activate
router.post('/templates/:id/publish', requireAuth, requireRole(['admin']), async (req, res) => {
  const t = await prisma.template.findFirst({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'not_found' });
  const schoolId = t.escola_id || req.user!.escola_id!;
  const slug = ((t as any).slug || 'default') as string;
  const maxVer = await prisma.template.aggregate({ where: { escola_id: schoolId } as any, _max: { versao: true } });
  const next = ((maxVer as any)._max?.versao || 0) + 1;
  await prisma.template.updateMany({ where: { escola_id: schoolId, ativo: true } as any, data: { ativo: false } });
  const updated = await prisma.template.update({ where: { id: t.id }, data: { ativo: true, versao: (next as any) } });
  await audit('PUBLISH_TEMPLATE', { actorId: req.user!.id, escolaId: schoolId, meta: { id: t.id, slug } });
  return res.json({ id: updated.id, ativo: updated.ativo, versao: updated.versao });
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
    if (t.escola_id !== req.user!.escola_id && req.user!.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    layout = ((t as any).layout_hbs) || '';
    css = ((t as any).css_extra) || '';
    payload = ((t as any).sample_data) || {};
  }
  if (!layout) return res.status(400).json({ error: 'missing_layout' });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

export default router;


