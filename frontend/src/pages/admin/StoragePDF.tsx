import React, { useEffect, useState } from 'react';
import { Card, Button } from '@edutech/ui';
import { api } from '../../lib/api';

export default function StoragePDF() {
  const [jobs, setJobs] = useState<any[]>([]);
  const load = async () => { const j = await api<any[]>('/admin/jobs'); setJobs(j); };
  useEffect(() => { load(); }, []);
  const retry = async (id: string) => { await api(`/admin/jobs/${id}/retry`, { method: 'POST' }); await load(); };
  const process = async () => { await api('/admin/jobs/process', { method: 'POST' }); await load(); };
  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Storage & PDFs</h2>
      <Card>
        <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
          <Button onClick={process}>Processar pendentes</Button>
        </div>
        <div className="col" style={{ gap: 8 }}>
          {jobs.map((j) => (
            <div key={j.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{j.type} — {j.status}</span>
              {j.status === 'failed' ? <Button variant="outline" onClick={() => retry(j.id)}>Reprocessar</Button> : <small className="muted">{j.result_url || ''}</small>}
            </div>
          ))}
          {jobs.length === 0 && <small className="muted">Sem jobs</small>}
        </div>
      </Card>
    </div>
  );
}
