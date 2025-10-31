import React, { useEffect, useState } from 'react';
import { Card, Button, Modal } from '@edutech/ui';
import { api } from '../../lib/api';

export default function AdminTemplates() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nome: '', versao: '1.0.0', regras_json: '{}' });
  const load = async () => { const t = await api<any[]>('/templates'); setItems(t); };
  useEffect(() => { load(); }, []);
  const create = async () => {
    setBusy(true);
    try {
      await api('/templates', { method: 'POST', body: JSON.stringify({ nome: form.nome, versao: form.versao, regras_json: JSON.parse(form.regras_json || '{}') }) });
      setOpen(false);
      await load();
    } finally { setBusy(false); }
  };
  const validate = async (id: string) => {
    const prova = { questoes: [{ tipo: 'objetiva' }, { tipo: 'dissertativa' }] };
    const r = await api<any>(`/templates/${id}/validate`, { method: 'POST', body: JSON.stringify({ prova }) });
    alert(r.ok ? 'OK' : `Falhas: ${r.issues.join(', ')}`);
  };
  const toggleActive = async (t: any) => {
    await api(`/templates/${t.id}`, { method: 'PUT', body: JSON.stringify({ ativo: !t.ativo }) });
    await load();
  };
  const remove = async (t: any) => {
    if (!confirm(`Excluir template ${t.nome}?`)) return;
    await api(`/templates/${t.id}`, { method: 'DELETE' });
    await load();
  };
  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Templates de Provas</h2>
        <Button onClick={() => setOpen(true)}>Novo template</Button>
      </div>
      <Card>
        <div className="col" style={{ gap: 8 }}>
          {items.map((t) => (
            <div key={t.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>{t.nome}</strong> — v{t.versao} {t.ativo ? '' : <em className="muted">(descontinuado)</em>}</span>
              <div className="row">
                <Button variant="secondary" onClick={() => validate(t.id)}>Validar</Button>
                <Button variant="outline" onClick={() => toggleActive(t)}>{t.ativo ? 'Descontinuar' : 'Ativar'}</Button>
                <Button variant="outline" onClick={() => remove(t)}>Excluir</Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <small className="muted">Sem templates</small>}
        </div>
      </Card>

      <Modal open={open} title="Novo template" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={create} disabled={busy}>{busy ? 'Criando...' : 'Criar'}</Button>
        </>}>
        <div className="col" style={{ gap: 10 }}>
          <label className="label">Nome</label>
          <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <label className="label">Versão</label>
          <input className="input" value={form.versao} onChange={(e) => setForm({ ...form, versao: e.target.value })} />
          <label className="label">Regras (JSON)</label>
          <textarea className="textarea" value={form.regras_json} onChange={(e) => setForm({ ...form, regras_json: e.target.value })} rows={8} />
        </div>
      </Modal>
    </div>
  );
}
