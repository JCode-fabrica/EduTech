import React from 'react';
import { Card } from '@edutech/ui';

export default function Security() {
  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Segurança & Compliance</h2>
      <Card>
        <p>Políticas de senha, 2FA, escopo por escola, LGPD e rate-limit.</p>
      </Card>
    </div>
  );
}
