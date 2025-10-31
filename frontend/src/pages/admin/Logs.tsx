import React, { useEffect, useState } from 'react';
import { Card } from '@edutech/ui';
import { api } from '../../lib/api';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { api<any[]>('/admin/logs').then(setLogs).catch(() => setLogs([])); }, []);
  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Auditoria</h2>
      <Card>
        <div className="col" style={{ gap: 8 }}>
          {logs.map((l) => (
            <div key={l.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{new Date(l.created_at).toLocaleString()} — {l.action}</span>
              <span className="muted">{l.escola_id || 'global'}</span>
            </div>
          ))}
          {logs.length === 0 && <small className="muted">Sem eventos</small>}
        </div>
      </Card>
    </div>
  );
}
