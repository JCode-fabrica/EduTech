import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Modal } from '@edutech/ui';
import { api } from '../../lib/api';
import SchoolPicker from '../../components/SchoolPicker';
import { useSelectedSchool } from '../../admin/useAdminSchool';

export default function AdminTemplates() {
  const { schoolId, setSchoolId } = useSelectedSchool();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [tab, setTab] = useState<"preview" | "structure">("preview");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState('');
  const [draft, setDraft] = useState<{ id: string; html?: string } | null>(null);
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
      setOpen(false);
      setOpenReview(true);
    } catch (e) {
      alert('Falha ao importar DOCX');
    } finally {
      setBusy(false);
      await load();
    }
  };

  const publish = async () => {
    if (!draft) return;
    await api(`/templates/${draft.id}/publish`, { method: 'POST' });
    setOpenReview(false);
    await load();
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
              <span><strong>{t.nome}</strong> {t.ativo ? '' : <em className="muted">(rascunho)</em>}</span>
              <div className="row">
                <Button variant="outline" onClick={async () => { const prev = await api<any>('/render/preview', { method: 'POST', body: JSON.stringify({ template_id: t.id }) }); setDraft({ id: t.id, html: prev.html }); setOpenReview(true); }}>Preview</Button>
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
          <div className="row" style={{ gap: 8, marginBottom: 8 }}><Button variant="outline" onClick={() => setTab("preview")} disabled={tab==="preview"}>Preview</Button><Button variant="outline" onClick={() => setTab("structure")} disabled={tab==="structure"}>Estrutura</Button></div>
          {tab==="preview" ? (draft?.html ? (
              <iframe title="preview" style={{ width: "100%", height: 420, background: "white" }} srcDoc={draft.html} />
            ) : <small className="muted">Gerando preview...</small>) : (
              <pre style={{ maxHeight: 420, overflow: "auto" }} >{JSON.stringify(items.find(i=>i.id===draft?.id)||{}, null, 2)}</pre>
            )}
          <small className="muted">Nesta revisão você poderá ajustar estrutura e mapeamentos em uma próxima etapa.</small>
        </div>
      </Modal>
    </div>
  );
}

