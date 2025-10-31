import React, { useEffect, useState } from 'react';
import { Card, Button } from '@jcode/ui/src';
import { api } from '../../lib/api';
import SchoolPicker from '../../components/SchoolPicker';
import { useSelectedSchool } from '../../admin/useAdminSchool';

export default function AdminIntegrations() {
  const { schoolId } = useSelectedSchool();
  const [keys, setKeys] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const load = async () => { if (!schoolId) return; const ks = await api<any[]>(`/escolas/${schoolId}/api-keys`); setKeys(ks); };
  useEffect(() => { load(); }, [schoolId]);
  const createKey = async () => { if (!schoolId) return; setBusy(true); try { const res = await api<any>(`/escolas/${schoolId}/api-keys`, { method: 'POST', body: JSON.stringify({ name: 'default' }) }); alert(`Nova API key: ${res.token}`); await load(); } finally { setBusy(false); } };
  const disable = async (id: string) => { await api(`/api-keys/${id}/disable`, { method: 'PATCH' }); await load(); };
  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Integrações & OpenAPI</h2>
        <div className="row">
          <Button onClick={() => window.open('/api/docs', '_blank')}>Swagger</Button>
          <Button onClick={createKey} disabled={!schoolId || busy}>Criar API Key</Button>
        </div>
      </div>
      <SchoolPicker />
      <Card>
        <div className="col" style={{ gap: 8 }}>
          {keys.map((k) => (
            <div key={k.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{k.name} — {k.active ? 'ativa' : 'inativa'}</span>
              {k.active && <Button variant="outline" onClick={() => disable(k.id)}>Desativar</Button>}
            </div>
          ))}
          {keys.length === 0 && <small className="muted">Sem keys</small>}
        </div>
      </Card>
    </div>
  );
}
