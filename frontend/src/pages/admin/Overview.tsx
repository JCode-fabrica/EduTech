import React, { useEffect, useState } from 'react';
import { Card } from '@jcode/ui/src';
import { api } from '../../lib/api';

export default function AdminOverview() {
  const [cards, setCards] = useState<any>(null);
  useEffect(() => { api('/admin/overview').then((d) => setCards((d as any).cards)).catch(() => setCards(null)); }, []);
  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Painel do Admin</h2>
      <div className="page-grid-3">
        <Card>
          <strong>KPIs</strong>
          <ul>
            <li>Escolas: {cards?.escolas ?? '-'}</li>
            <li>Professores: {cards?.professores ?? '-'}</li>
            <li>Coordenações: {cards?.coordenacoes ?? '-'}</li>
            <li>Provas Hoje/Semana/Mês: {cards?.provasHoje ?? '-'} / {cards?.provasSemana ?? '-'} / {cards?.provasMes ?? '-'}</li>
            <li>Status Aprovadas/Revisão/Ajustes: {cards?.aprovadas ?? '-'} / {cards?.revisao ?? '-'} / {cards?.ajustes ?? '-'}</li>
          </ul>
        </Card>
        <Card>
          <strong>Uso de IA</strong>
          <ul>
            <li>Tokens in/out: {cards?.tokens_in ?? 0} / {cards?.tokens_out ?? 0}</li>
            <li>Custo estimado: R$ {(cards?.cost_cents ? (cards.cost_cents/100).toFixed(2) : '0,00')}</li>
          </ul>
        </Card>
        <Card>
          <strong>Jobs</strong>
          <ul>
            <li>Pendentes: {cards?.jobs_pend ?? 0}</li>
            <li>Falhas: {cards?.jobs_falha ?? 0}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
