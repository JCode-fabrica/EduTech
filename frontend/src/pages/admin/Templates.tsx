import React, { useEffect, useState } from 'react';
import { Card, Button, Modal } from '@edutech/ui';
import { api } from '../../lib/api';
import SchoolPicker from '../../components/SchoolPicker';
import { useSelectedSchool } from '../../admin/useAdminSchool';

export default function AdminTemplates() {
  const { schoolId, setSchoolId } = useSelectedSchool();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [tab, setTab] = useState<'preview'|'structure'>('preview');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState('');
  const [draft, setDraft] = useState<{ id: string; html?: string } | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [schemaText, setSchemaText] = useState('');
  const [mappingText, setMappingText] = useState('');

  const load = async () => { if (!schoolId) return; const t = await api<any[]>(`/templates?escola_id=${schoolId}`); setItems(t); };
  useEffect(() => { load(); }, [schoolId]);

  const openImport = () => { setFile(null); setNome(''); setOpen(true); };

  const importDocx = async () => {
    if (!schoolId || !file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('docx', file);
      fd.append('escola_id', schoolId);
      fd.append('nome_sugerido', nome || file.name.replace(/\.docx$/i, ''));
      const r = await fetch(`/api/templates/import-docx`, { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!r.ok) throw new Error('IMPORT_FAILED');
      const data = await r.json();
      // Preview HTML
      const prev = await api<any>('/render/preview', { method: 'POST', body: JSON.stringify({ template_id: data.template_id }) });
      setDraft({ id: data.template_id, html: prev.html });
      try { const d = await api<any>(`/templates/${data.template_id}`); setDetail(d); setSchemaText(JSON.stringify(d.schema_json||{}, null, 2)); setMappingText(JSON.stringify(d.mapping||{}, null, 2)); } catch {}
      setOpen(false);
      setOpenReview(true);
    } catch (e) {
      alert('Falha ao importar DOCX');
    } finally {
      setBusy(false);
      await load();
    }
  };

  const preview = async (id: string) => {
    const prev = await api<any>('/render/preview', { method: 'POST', body: JSON.stringify({ template_id: id }) });
    setDraft({ id, html: prev.html });
    try { const d = await api<any>(`/templates/${id}`); setDetail(d); setSchemaText(JSON.stringify(d.schema_json||{}, null, 2)); setMappingText(JSON.stringify(d.mapping||{}, null, 2)); } catch {}
    setOpenReview(true);
  };

  const publish = async () => {
    if (!draft) return;
    // optional save structure before publish
    try { await api(`/templates/${draft.id}`, { method: 'PUT', body: JSON.stringify({ schema_json: JSON.parse(schemaText||'{}'), mapping: JSON.parse(mappingText||'{}') }) }); } catch {}
    await api(`/templates/${draft.id}/publish`, { method: 'POST' });
    setOpenReview(false);
    await load();
  };

  const saveStructure = async () => {
    if (!draft) return;
    try { await api(`/templates/${draft.id}`, { method: 'PUT', body: JSON.stringify({ schema_json: JSON.parse(schemaText||'{}'), mapping: JSON.parse(mappingText||'{}') }) }); alert('Estrutura salva'); } catch { alert('Falha ao salvar'); }
  };

  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Templates</h2>
        <div className="row">
          <SchoolPicker onChange={(id) => setSchoolId(id)} />
          <Button onClick={openImport} disabled={!schoolId}>Adicionar via DOCX</Button>
        </div>
      </div>
      <Card>
        <div className="col" style={{ gap: 8 }}>
          {items.map((t) => (
            <div key={t.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>{t.nome}</strong> {t.ativo ? '' : <em className="muted">(rascunho)</em>} • v{t.versao}</span>
              <div className="row">
                <Button variant="outline" onClick={() => preview(t.id)}>Preview</Button>
                {!t.ativo && <Button onClick={() => api(`/templates/${t.id}/publish`, { method: 'POST' }).then(load)}>Publicar</Button>}
              </div>
            </div>
          ))}
          {items.length === 0 && <small className="muted">Sem templates</small>}
        </div>
      </Card>

      <Modal open={open} title="Importar template via DOCX" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={importDocx} disabled={busy || !file || !schoolId}>{busy ? 'Processando...' : 'Importar'}</Button>
        </>}>
        <div className="col" style={{ gap: 10 }}>
          <label className="label">Escola</label>
          <SchoolPicker onChange={(id) => setSchoolId(id)} />
          <label className="label">Arquivo DOCX</label>
          <input type="file" accept=".docx" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <label className="label">Nome sugerido</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
      </Modal>

      <Modal open={openReview} title="Revisar template" onClose={() => setOpenReview(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpenReview(false)}>Fechar</Button>
          {draft && <Button onClick={publish}>Publicar</Button>}
        </>}>
        <div className="col" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <Button variant="outline" onClick={() => setTab('preview')} disabled={tab==='preview'}>Preview</Button>
            <Button variant="outline" onClick={() => setTab('structure')} disabled={tab==='structure'}>Estrutura</Button>
          </div>
          {tab==='preview' ? (
            draft?.html ? (
              <iframe title="preview" style={{ width: '100%', height: 420, background: 'white' }} srcDoc={draft.html} />
            ) : <small className="muted">Gerando preview...</small>
          ) : (
            <div className="col" style={{ gap: 8 }}>
              <label className="label">schema_json</label>
              <textarea className="textarea" rows={10} value={schemaText} onChange={e=>setSchemaText(e.target.value)} />
              <label className="label">mapping</label>
              <textarea className="textarea" rows={10} value={mappingText} onChange={e=>setMappingText(e.target.value)} />
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={saveStructure}>Salvar estrutura</Button>
              </div>
            </div>
          )}
          <small className="muted">Revise o layout e a estrutura detectada antes de publicar.</small>
        </div>
      </Modal>
    </div>
  );
}
