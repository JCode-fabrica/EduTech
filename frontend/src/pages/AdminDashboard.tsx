import React, { useEffect, useState } from 'react';
import { Card, Button, Modal } from '@edutech/ui';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

type EscolaCard = { id: string; nome: string; slug?: string | null; coordenadores: number; professores: number };

export default function AdminDashboard() {
  const [items, setItems] = useState<EscolaCard[]>([]);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    contato_nome: '',
    contato_cpf: '',
    contato_email: '',
    contato_tel: '',
    contrato_inicio: '',
    contrato_fim: '',
    observacoes: ''
  });
  useEffect(() => {
    api<EscolaCard[]>('/escolas').then(setItems).catch(() => setItems([]));
  }, []);

  function openCreate() {
    setForm({ nome: '', endereco: '', contato_nome: '', contato_cpf: '', contato_email: '', contato_tel: '', contrato_inicio: '', contrato_fim: '', observacoes: '' });
    setOpen(true);
  }

  async function submitCreate() {
    if (creating) return;
    if (!form.nome.trim()) { setFormError('Informe o nome da escola'); return; }
    setCreating(true);
    const slug = form.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    try {
      await api('/escolas', { method: 'POST', body: JSON.stringify({ ...form, slug }) });
      const list = await api<EscolaCard[]>('/escolas');
      setItems(list);
      setOpen(false);
    } catch (e) {
      setFormError('Falha ao criar escola');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Escolas</h2>
        <Button onClick={openCreate}>Nova escola</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {items.map((e) => (
          <Link to={`/admin/escolas/${e.id}`} key={e.id}>
            <Card>
              <div className="col">
                <strong>{e.nome}</strong>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="muted">Coordenadores: {e.coordenadores}</span>
                  <span className="muted">Professores: {e.professores}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {items.length === 0 && (
          <Card>
            <div className="col">
              <strong>Nenhuma escola cadastrada</strong>
              <span className="muted">Clique em "Nova escola" para começar.</span>
            </div>
          </Card>
        )}
      </div>
      <Modal open={open} title="Nova escola" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submitCreate} disabled={creating}>{creating ? 'Criando...' : 'Criar'}</Button>
        </>}>
        <div className="col" style={{ gap: 10 }}>
          {formError && <small style={{ color: 'var(--danger)' }}>{formError}</small>}
          <label className="label">Nome da escola</label>
          <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />

          <label className="label">Endereco</label>
          <input className="input" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />

          <div className="row" style={{ gap: 12 }}>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Contato (nome)</label>
              <input className="input" value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} />
            </div>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Contato (CPF)</label>
              <input className="input" value={form.contato_cpf} onChange={(e) => setForm({ ...form, contato_cpf: e.target.value })} />
            </div>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Contato (email)</label>
              <input className="input" value={form.contato_email} onChange={(e) => setForm({ ...form, contato_email: e.target.value })} />
            </div>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Contato (telefone)</label>
              <input className="input" value={form.contato_tel} onChange={(e) => setForm({ ...form, contato_tel: e.target.value })} />
            </div>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Inicio do contrato</label>
              <input type="date" className="input" value={form.contrato_inicio} onChange={(e) => setForm({ ...form, contrato_inicio: e.target.value })} />
            </div>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Fim do contrato</label>
              <input type="date" className="input" value={form.contrato_fim} onChange={(e) => setForm({ ...form, contrato_fim: e.target.value })} />
            </div>
          </div>

          <label className="label">Observacoes</label>
          <textarea className="textarea" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
