import React, { useEffect, useState } from 'react';
import { Card, Button } from '@jcode/ui/src';
import { api } from '../../lib/api';
import SchoolPicker from '../../components/SchoolPicker';
import { useSelectedSchool } from '../../admin/useAdminSchool';

export default function AIQuotas() {
  const { schoolId } = useSelectedSchool();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    const pol = await api<any>(`/escolas/${schoolId}/policy`);
    setForm(pol || {});
    setLoading(false);
  };
  useEffect(() => { load(); }, [schoolId]);
  const save = async () => { if (!schoolId) return; await api(`/escolas/${schoolId}/policy`, { method: 'PUT', body: JSON.stringify(form) }); alert('Salvo'); };
  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>IA & Cotas</h2>
        <div className="row"><Button onClick={save} disabled={!schoolId || loading}>Salvar</Button></div>
      </div>
      <SchoolPicker />
      <Card>
        <div className="page-grid-3" style={{ marginTop: 8 }}>
          <div className="col">
            <strong>Limiar de validação</strong>
            <label className="label">Aderencia mínima</label>
            <input className="input" type="number" value={form.aderencia_min ?? ''} onChange={(e) => setForm({ ...form, aderencia_min: Number(e.target.value) })} />
            <label className="label">Coerencia mínima</label>
            <input className="input" type="number" value={form.coerencia_min ?? ''} onChange={(e) => setForm({ ...form, coerencia_min: Number(e.target.value) })} />
            <label className="label">Imagens (modo)</label>
            <select className="select" value={form.imagens_modo || ''} onChange={(e) => setForm({ ...form, imagens_modo: e.target.value })}>
              <option value="">padrão</option>
              <option value="inline">inline</option>
              <option value="glossario">glossario</option>
              <option value="auto">auto</option>
            </select>
          </div>
          <div className="col">
            <strong>Cotas</strong>
            <label className="label">Máx. professores</label>
            <input className="input" type="number" value={form.max_professores ?? ''} onChange={(e) => setForm({ ...form, max_professores: Number(e.target.value) })} />
            <label className="label">Análises IA/mês</label>
            <input className="input" type="number" value={form.analises_mes ?? ''} onChange={(e) => setForm({ ...form, analises_mes: Number(e.target.value) })} />
            <label className="label">Upload máx (MB)</label>
            <input className="input" type="number" value={form.upload_max_mb ?? ''} onChange={(e) => setForm({ ...form, upload_max_mb: Number(e.target.value) })} />
          </div>
          <div className="col">
            <strong>Segurança</strong>
            <label className="label">Forçar 2FA</label>
            <select className="select" value={form.require_2fa ? '1' : '0'} onChange={(e) => setForm({ ...form, require_2fa: e.target.value === '1' })}>
              <option value="0">não</option>
              <option value="1">sim</option>
            </select>
            <label className="label">Senha mínima</label>
            <input className="input" type="number" value={form.password_min_len ?? ''} onChange={(e) => setForm({ ...form, password_min_len: Number(e.target.value) })} />
            <label className="label">Sessão (minutos)</label>
            <input className="input" type="number" value={form.session_exp_min ?? ''} onChange={(e) => setForm({ ...form, session_exp_min: Number(e.target.value) })} />
          </div>
        </div>
      </Card>
    </div>
  );
}
