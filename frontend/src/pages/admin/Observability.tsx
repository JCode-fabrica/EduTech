import React, { useEffect, useState } from 'react';
import { Card } from '@edutech/ui';
import { api } from '../../lib/api';

export default function Observability() {
  const [m, setM] = useState<any>(null);
  useEffect(() => { api('/admin/metrics').then(setM as any).catch(() => setM(null)); }, []);
  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Observabilidade & Saúde</h2>
      <Card>
        <ul>
          <li>DB: {m?.db ? 'ok' : 'erro'}</li>
          <li>R2 config: {m?.r2 ? 'ok' : 'faltando'}</li>
          <li>OpenAI key: {m?.openai ? 'ok' : 'faltando'}</li>
          <li>Server time: {m?.time || '-'}</li>
        </ul>
      </Card>
    </div>
  );
}
