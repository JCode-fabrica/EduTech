import React, { useEffect, useState } from 'react';
import { Card, Button, Modal } from '@jcode/ui/src';
import { api } from '../../lib/api';
import SchoolPicker from '../../components/SchoolPicker';
import { useSelectedSchool } from '../../admin/useAdminSchool';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ escola_id: '', email: '', role: 'professor' });
  const { schoolId } = useSelectedSchool();
  const load = async () => { const u = await api<any[]>(`/admin/users${schoolId ? `?escola_id=${schoolId}` : ''}`); setUsers(u); };
  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [schoolId]);
  const invite = async () => {
    setBusy(true);
    try {
      const res = await api<any>('/admin/users/invite', { method: 'POST', body: JSON.stringify(form) });
      alert(`Convite criado. Token: ${res.token}`);
      setOpen(false);
    } finally { setBusy(false); }
  };
  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Usuários & Permissões</h2>
        <Button onClick={() => setOpen(true)}>Convidar usuário</Button>
      </div>
      <SchoolPicker />
      <Card>
        <div className="col" style={{ gap: 8 }}>
          {users.map((u) => (
            <div key={u.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{u.nome || '(sem nome)'} — {u.email}</span>
              <span className="muted">{u.role} {u.escola_id ? `• ${u.escola_id}` : ''}</span>
            </div>
          ))}
          {users.length === 0 && <small className="muted">Sem usuários</small>}
        </div>
      </Card>
      <Modal open={open} title="Convidar usuário" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={invite} disabled={busy}>{busy ? 'Enviando...' : 'Criar convite'}</Button>
        </>}>
        <div className="col" style={{ gap: 10 }}>
          <label className="label">Escola</label>
          <SchoolPicker onChange={(id) => setForm({ ...form, escola_id: id })} />
          <label className="label">E-mail</label>
          <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="label">Role</label>
          <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="professor">professor</option>
            <option value="coordenacao">coordenacao</option>
            <option value="admin">admin</option>
          </select>
          <small className="muted">Será gerado um token de convite válido por 60 minutos. Use /auth/accept-invite com token para concluir.</small>
        </div>
      </Modal>
    </div>
  );
}
