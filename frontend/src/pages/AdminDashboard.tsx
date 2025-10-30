import React, { useEffect, useState } from 'react';
import { Card } from '@jcode/ui/src';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

type EscolaCard = { id: string; nome: string; slug?: string | null; coordenadores: number; professores: number };

export default function AdminDashboard() {
  const [items, setItems] = useState<EscolaCard[]>([]);
  useEffect(() => {
    api<EscolaCard[]>('/escolas').then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Escolas</h2>
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
      </div>
    </div>
  );
}

