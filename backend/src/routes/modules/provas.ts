import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
// Using local types to avoid external workspace dependency during typecheck
type CreateProvaRequest = any;
type UpdateProvaRequest = any;
import { prisma } from '../../db';
import multer from 'multer';
import { uploadToR2 } from '../../services/r2';
import { lookup as mimeLookup } from 'mime-types';

export const router = Router();

router.post('/provas', requireAuth, async (req, res) => {
  const body = req.body as CreateProvaRequest;
  if (!body?.titulo_interno || !body?.turma_id || !body?.materia_id || !body?.template_id) {
    return res.status(400).json({ error: 'invalid_payload' });
  }
  const created = await prisma.prova.create({
    data: {
      escola_id: req.user!.escola_id,
      autor_id: req.user!.id,
      titulo_interno: body.titulo_interno,
      turma_id: body.turma_id,
      materia_id: body.materia_id,
      template_id: body.template_id,
      status: 'DRAFT',
      questoes: body.questoes && body.questoes.length > 0 ? {
        create: body.questoes.map((q: any, idx: number) => ({
          ordem: idx + 1,
          tipo: q.tipo,
          enunciado: q.enunciado,
          alternativas: q.alternativas ? q.alternativas : undefined,
          correta_index: q.correta_index ?? null,
          images_refs: q.images_refs ? q.images_refs : undefined,
          images_inline_ids: q.images_inline_ids ? q.images_inline_ids : undefined
        }))
      } : undefined
    },
    include: { questoes: true }
  });
  return res.status(201).json(created);
});

router.put('/provas/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const body = req.body as UpdateProvaRequest;

  // Ensure ownership + tenant scope
  const existing = await prisma.prova.findFirst({ where: { id, escola_id: req.user!.escola_id, autor_id: req.user!.id } });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const updates: any = {};
  if (body.titulo_interno) updates.titulo_interno = body.titulo_interno;
  if (body.turma_id) updates.turma_id = body.turma_id;
  if (body.materia_id) updates.materia_id = body.materia_id;
  if (body.template_id) updates.template_id = body.template_id;

  const result = await prisma.$transaction(async (db) => {
    const updated = await db.prova.update({ where: { id }, data: updates });
    if (Array.isArray(body.questoes)) {
      await db.questao.deleteMany({ where: { prova_id: id } });
      if (body.questoes.length > 0) {
        await db.questao.createMany({
          data: body.questoes.map((q: any, idx: number) => ({
            prova_id: id,
            ordem: idx + 1,
            tipo: q.tipo,
            enunciado: q.enunciado,
            alternativas: q.alternativas ? q.alternativas : undefined,
            correta_index: q.correta_index ?? null,
            images_refs: q.images_refs ? q.images_refs : undefined,
            images_inline_ids: q.images_inline_ids ? q.images_inline_ids : undefined
          }))
        });
      }
    }
    return updated;
  });

  return res.json(result);
});

router.post('/provas/:id/analisar', requireAuth, async (req, res) => {
  // Stub IA response
  const provaId = req.params.id;
  const result = {
    id: 'ai_1',
    prova_id: provaId,
    resumo_scores: { gramatica: 86, coerencia: 90, aderencia: 88 },
    por_questao: [
      { questao_id: 'q1', issues: ['pontuaÃ§Ã£o'], sugestoes: ['Melhorar clareza do enunciado'] }
    ],
    uso: { mostradas: 5, aplicadas: 2, tempo_seg: 18 },
    tokens_in: 1200,
    tokens_out: 450,
    cost_cents: 2
  };
  // Persist stub analysis for audit/reporting
  await prisma.analiseIA.create({
    data: {
      prova_id: provaId,
      resumo_scores: result.resumo_scores as any,
      por_questao: result.por_questao as any,
      uso: result.uso as any,
      tokens_in: result.tokens_in,
      tokens_out: result.tokens_out,
      cost_cents: result.cost_cents
    }
  });
  return res.json(result);
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/uploads/imagem', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const file = (req as any).file as any;
    const { prova_id, alt_text, legenda, prefer_glossary } = (req.body || {}) as Record<string, string>;
    if (!file) return res.status(400).json({ error: 'missing_file' });
    if (!alt_text || !alt_text.trim()) return res.status(400).json({ error: 'missing_alt_text' });
    if (!prova_id) return res.status(400).json({ error: 'missing_prova_id' });

    const prova = await prisma.prova.findFirst({ where: { id: prova_id, escola_id: req.user!.escola_id } });
    if (!prova) return res.status(404).json({ error: 'prova_not_found' });

    const ext = file.originalname.split('.').pop() || '';
    const guessed = (mimeLookup(ext) || '').toString();
    const ct = (file.mimetype || guessed || 'application/octet-stream').toString();
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']);
    if (!allowed.has(ct)) return res.status(400).json({ error: 'unsupported_media_type', contentType: ct });
    const { url, key } = await uploadToR2(file.buffer, ct, {
      escolaId: req.user!.escola_id,
      provaId: prova.id,
      filename: file.originalname
    });

    // Generate ref_code (IMAGEM N) per prova
    let ref_code: string | null = null;
    if (prova) {
      const count = await prisma.imagemUpload.count({ where: { prova_id: prova.id } });
      ref_code = `IMAGEM ${count + 1}`;
    }

    const created = await prisma.imagemUpload.create({
      data: {
        escola_id: req.user!.escola_id,
        prova_id: prova.id,
        filename: file.originalname,
        storage_url: url,
        alt_text,
        legenda: legenda || null,
        prefer_glossary: prefer_glossary ? prefer_glossary === 'true' : null,
        ref_code: ref_code || undefined
      }
    });

    return res.status(201).json({ ...created, key });
  } catch (err: any) {
    return res.status(500).json({ error: 'upload_failed', detail: err?.message });
  }
});

router.post('/provas/:id/preview', requireAuth, (req, res) => {
  // Stub: HTML->PDF (futuro)
  return res.json({ url: `https://example.local/preview/${req.params.id}.pdf` });
});

// Enfileirar renderizaÃ§Ã£o de PDF
router.post('/provas/:id/render', requireAuth, async (req, res) => {
  const id = req.params.id;
  const prova = await prisma.prova.findFirst({ where: { id, escola_id: req.user!.escola_id } });
  if (!prova) return res.status(404).json({ error: 'not_found' });
  const job = await prisma.job.create({ data: { escola_id: prova.escola_id, type: 'PDF_RENDER', status: 'pending', payload: { prova_id: id } as any } });
  return res.status(201).json(job);
});

router.post('/provas/:id/submit', requireAuth, async (req, res) => {
  const id = req.params.id;
  const prova = await prisma.prova.findFirst({
    where: { id, escola_id: req.user!.escola_id, autor_id: req.user!.id },
    include: { questoes: true, template: true, imagens: true }
  });
  if (!prova) return res.status(404).json({ error: 'not_found' });

  // Minimal validation: objetivas precisam de correta_index
  const invalida = prova.questoes.some((q) => q.tipo === 'objetiva' && (q.correta_index === null || q.correta_index === undefined));
  if (invalida) return res.status(400).json({ error: 'objetiva_sem_correta' });

  // Template validations
  const regras = (prova.template?.regras_json as any) || {};
  if (Array.isArray(regras.tipos_permitidos)) {
    const tipos = new Set(regras.tipos_permitidos as string[]);
    const temNaoPermitido = prova.questoes.some((q) => !tipos.has(q.tipo));
    if (temNaoPermitido) return res.status(400).json({ error: 'tipo_questao_nao_permitido' });
  }
  if (Array.isArray(regras.secoes) && regras.secoes.join(',') === 'objetivas,dissertativas') {
    let seenDissertativa = false;
    for (const q of prova.questoes.sort((a, b) => a.ordem - b.ordem)) {
      if (q.tipo === 'dissertativa') seenDissertativa = true;
      if (q.tipo === 'objetiva' && seenDissertativa) {
        return res.status(400).json({ error: 'ordem_invalida_objetivas_primeiro' });
      }
    }
  }
  if (regras.glossario_obrigatorio) {
    const inlineInvalida = prova.questoes.some((q) => Array.isArray(q.images_inline_ids) && q.images_inline_ids.length > 0);
    if (inlineInvalida) return res.status(400).json({ error: 'glossario_obrigatorio_sem_inline' });
    // Checar que todas as imagens tem ref_code e sÃ£o referenciadas por alguma questÃ£o (images_refs)
    const refsUsadas = new Set<string>();
    for (const q of prova.questoes) {
      (Array.isArray(q.images_refs) ? (q.images_refs as string[]) : []).forEach((r) => refsUsadas.add(r));
    }
    const faltandoRef = prova.imagens.some((img) => !img.ref_code || !refsUsadas.has(img.ref_code));
    if (faltandoRef) return res.status(400).json({ error: 'imagem_sem_referencia_glossario' });
  }

  // EscolaPolicy enforcement
  const policy = await prisma.escolaPolicy.findFirst({ where: { escola_id: prova.escola_id } });
  if (policy?.imagens_modo === 'glossario') {
    const inlineInvalida2 = prova.questoes.some((q) => Array.isArray(q.images_inline_ids) && q.images_inline_ids.length > 0);
    if (inlineInvalida2) return res.status(400).json({ error: 'policy_glossario_obrigatorio' });
  }
  if (policy?.aderencia_min || policy?.coerencia_min) {
    const last = await prisma.analiseIA.findFirst({ where: { prova_id: prova.id }, orderBy: { created_at: 'desc' } });
    if (!last) return res.status(400).json({ error: 'analise_requerida' });
    const ader = (last.resumo_scores as any)?.aderencia ?? 100;
    const coer = (last.resumo_scores as any)?.coerencia ?? 100;
    if (policy?.aderencia_min && ader < policy.aderencia_min) return res.status(400).json({ error: 'aderencia_abaixo_limiar', min: policy.aderencia_min, valor: ader });
    if (policy?.coerencia_min && coer < policy.coerencia_min) return res.status(400).json({ error: 'coerencia_abaixo_limiar', min: policy.coerencia_min, valor: coer });
  }

  const updated = await prisma.prova.update({ where: { id }, data: { status: 'SUBMITTED' } });
  return res.json({ id: updated.id, status: updated.status });
});

export default router;

