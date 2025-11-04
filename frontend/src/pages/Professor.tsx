import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button } from '@edutech/ui';
import { api } from '../lib/api';

export default function ProfessorPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [detail, setDetail] = useState<any>(null);
  const [data, setData] = useState<any>({ header: {}, questoes: [] });
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState<string>('');
  const [materias, setMaterias] = useState<any[]>([]);
  const [materiaId, setMateriaId] = useState<string>('');

  useEffect(() => { api('/templates').then(setTemplates as any).catch(()=>setTemplates([])); api('/minhas-turmas').then(setTurmas as any).catch(()=>setTurmas([])); }, []);
  useEffect(() => { if (turmaId) api(`/minhas-materias?turma_id=${turmaId}`).then(setMaterias as any).catch(()=>setMaterias([])); }, [turmaId]);

  const loadDetail = async (id: string) => {
    const t = await api<any>(`/templates/${id}`);
    setDetail(t);
    const init = (t.sample_data as any) || { header: {}, questoes: [] };
    setData(init);
    setPreviewHtml('');
  };

  const renderPreview = async () => {
    if (!detail) return;
    const prev = await api<any>('/render/preview', { method: 'POST', body: JSON.stringify({ layout_hbs: detail.layout_hbs, css_extra: detail.css_extra, data }) });
    setPreviewHtml(prev.html);
  };

  const addQuestao = () => {
    setData({ ...data, questoes: [...(data.questoes||[]), { tipo: 'multiple_choice', enunciado: '', alternativas: { a:'', b:'', c:'', d:'', e:'' }, linhas_resposta: 0 }] });
  };

  const saveProva = async () => {
    if (!detail || !turmaId || !materiaId || !selected) { alert('Preencha título, turma, matéria e template'); return; }
    const questoes = (data.questoes||[]).map((q: any) => {
      if (q.tipo === 'multiple_choice') {
        const alts = q.alternativas || {}; const arr = ['a','b','c','d','e'].map(k => alts[k] || '').filter((x: string) => x!==undefined);
        const g = q.gabarito || null; const gi = g ? ['a','b','c','d','e'].indexOf(g) : null;
        return { tipo: 'objetiva', enunciado: q.enunciado, alternativas: arr, correta_index: gi };
      } else {
        return { tipo: 'dissertativa', enunciado: q.enunciado };
      }
    });
    await api('/provas', { method: 'POST', body: JSON.stringify({ titulo_interno: titulo || 'Prova', turma_id: turmaId, materia_id: materiaId, template_id: selected, questoes }) });
    alert('Prova criada');
  };

  return (
    <div className="container">
      <div className="status-bar">
        <span className="muted">Crie sua prova a partir de um template</span>
        <div className="row">
          <Button variant="outline" onClick={renderPreview}>Pré-visualizar</Button>
          <Button onClick={saveProva}>Salvar</Button>
        </div>
      </div>
      <div className="page-grid-3">
        <Card>
          <strong>Metadados</strong>
          <div className="col" style={{ marginTop: 8 }}>
            <label className="label">Título interno</label>
            <input className="input" value={titulo} onChange={e=>setTitulo(e.target.value)} />

            <label className="label">Template</label>
            <select className="select" value={selected} onChange={(e)=> { setSelected(e.target.value); if (e.target.value) loadDetail(e.target.value); }}>
              <option value="">Selecionar</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.nome} {t.ativo ? '' : '(rascunho)'}</option>)}
            </select>

            <label className="label">Turma</label>
            <select className="select" value={turmaId} onChange={(e)=>setTurmaId(e.target.value)}>
              <option value="">Selecionar</option>
              {turmas.map((t:any)=> <option key={t.id} value={t.id}>{t.nome_exibicao}</option>)}
            </select>

            <label className="label">Matéria</label>
            <select className="select" value={materiaId} onChange={(e)=>setMateriaId(e.target.value)}>
              <option value="">Selecionar</option>
              {materias.map((m:any)=> <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
        </Card>
        <Card>
          <strong>Questões</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {(data.questoes||[]).map((q:any, idx:number) => (
              <div key={idx} className="surface card" style={{ padding: 8 }}>
                <div className="row" style={{ gap: 8 }}>
                  <select className="select" value={q.tipo} onChange={(e)=>{ const qs=[...data.questoes]; qs[idx] = { ...q, tipo: e.target.value }; setData({ ...data, questoes: qs }); }}>
                    <option value="multiple_choice">Objetiva</option>
                    <option value="discursiva">Discursiva</option>
                    <option value="sem_espaco">Sem espaço</option>
                  </select>
                  <input className="input" placeholder={`Enunciado ${idx+1}`} value={q.enunciado||''} onChange={(e)=>{ const qs=[...data.questoes]; qs[idx] = { ...q, enunciado: e.target.value }; setData({ ...data, questoes: qs }); }} />
                </div>
                {q.tipo === 'multiple_choice' && (
                  <div className="col" style={{ marginTop: 6 }}>
                    {['a','b','c','d','e'].map((k)=> (
                      <div key={k} className="row"><span style={{ width: 20 }}>{k.toUpperCase()})</span><input className="input" value={(q.alternativas?.[k]||'')} onChange={(e)=>{ const alt={...(q.alternativas||{})}; alt[k]=e.target.value; const qs=[...data.questoes]; qs[idx] = { ...q, alternativas: alt }; setData({ ...data, questoes: qs }); }} /></div>
                    ))}
                    <label className="label">Gabarito (a-e opcional)</label>
                    <input className="input" value={q.gabarito||''} onChange={(e)=>{ const qs=[...data.questoes]; qs[idx]={...q, gabarito:e.target.value.toLowerCase()}; setData({ ...data, questoes: qs }); }} />
                  </div>
                )}
              </div>
            ))}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={addQuestao}>Adicionar questão</Button>
            </div>
          </div>
        </Card>
        <Card>
          <strong>Pré-visualização</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {previewHtml ? (
              <iframe title="preview" style={{ width: '100%', height: 420, background: 'white' }} srcDoc={previewHtml} />
            ) : <small className="muted">Clique em Pré-visualizar para gerar</small>}
          </div>
        </Card>
      </div>
    </div>
  );
}
