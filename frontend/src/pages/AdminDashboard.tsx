import React, { useEffect, useState } from 'react';
import { Card, Button } from '@jcode/ui/src';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

type EscolaCard = { id: string; nome: string; slug?: string | null; coordenadores: number; professores: number };

export default function AdminDashboard() {
  const [items, setItems] = useState<EscolaCard[]>([]);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    api<EscolaCard[]>('/escolas').then(setItems).catch(() => setItems([]));
  }, []);

  async function createSchool() {
    if (creating) return;
    const nome = prompt('Nome da escola');
    if (!nome) return;
    setCreating(true);
    const slug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    try {
      await api('/escolas', { method: 'POST', body: JSON.stringify({ nome, slug }) });
      const list = await api<EscolaCard[]>('/escolas');
      setItems(list);
    } catch (e) {
      alert('Falha ao criar escola');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Escolas</h2>
        <Button onClick={createSchool} disabled={creating}>{creating ? 'Criando...' : 'Nova escola'}</Button>
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
    </div>
  );
}
