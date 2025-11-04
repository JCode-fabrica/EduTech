import React, { useEffect, useState } from 'react';
import { Card, Button } from '@edutech/ui';
import { api } from '../../lib/api';
import SchoolPicker from '../../components/SchoolPicker';
import { useSelectedSchool } from '../../admin/useAdminSchool';
import LineChart from '../../components/LineChart';

export default function AdminReports() {
  const { schoolId } = useSelectedSchool();
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ range, ...(schoolId ? { escola_id: schoolId } : {}) });
      const r = await api<any>(`/admin/reports?${q}`);
      setData(r);
    } catch (e) {
      setError('Falha ao carregar relatórios');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [schoolId, range]);

  const currency = (cents?: number) => {
    const v = (cents || 0) / 100;
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Relatórios</h2>
        <div className="row">
          <select className="select" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="90d">90 dias</option>
          </select>
          <Button onClick={() => window.print()}>Exportar (impressão)</Button>
        </div>
      </div>
      <SchoolPicker />

      {error && <div className="surface card" style={{ marginTop: 8, padding: 10, borderLeft: '4px solid var(--danger)' }}><small>{error}</small></div>}

      <div className="page-grid-3" style={{ marginTop: 8 }}>
        <Card>
          <strong>Resumo</strong>
          {!loading ? (
            <ul>
              <li>Total de provas: {data?.total ?? '-'}</li>
              <li>Aprovadas / Revisão / Ajustes: {data?.aprovadas ?? 0} / {data?.revisao ?? 0} / {data?.ajustes ?? 0}</li>
            </ul>
          ) : <small className="muted">Carregando...</small>}
        </Card>
        <Card>
          <strong>Uso de IA</strong>
          {!loading ? (
            <ul>
              <li>Tokens in/out: {data?.tokens_in ?? 0} / {data?.tokens_out ?? 0}</li>
              <li>Custo: {currency(data?.cost_cents)}</li>
            </ul>
          ) : <small className="muted">Carregando...</small>}
        </Card>
        <Card>
          <strong>Provas por dia</strong>
          {(!loading && data?.provasPorDia) ? (
            <LineChart labels={data.provasPorDia.map((d: any) => d.date)} data={data.provasPorDia.map((d: any) => d.count)} />
          ) : <small className="muted">{loading ? 'Carregando...' : 'Sem dados'}</small>}
        </Card>
      </div>

      <Card>
        <strong>Top Professores (por uso de tokens IA)</strong>
        <div className="col" style={{ gap: 8, marginTop: 8 }}>
          {(!loading && data?.topProfessores?.length) ? (
            data.topProfessores.map((t: any) => (
              <div key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{t.nome || t.email || t.id}</span>
                <span className="muted">{t.tokens} tokens • {t.analises || 0} análises</span>
              </div>
            ))
          ) : <small className="muted">{loading ? 'Carregando...' : 'Sem dados'}</small>}
        </div>
      </Card>
    </div>
  );
}
