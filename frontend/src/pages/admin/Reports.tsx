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
  const load = async () => { const q = new URLSearchParams({ range, ...(schoolId ? { escola_id: schoolId } : {}) }); const r = await api<any>(`/admin/reports?${q}`); setData(r); };
  useEffect(() => { load(); }, [schoolId, range]);
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
          <Button onClick={() => window.print()}>Exportar (print)</Button>
        </div>
      </div>
      <SchoolPicker />
      <div className="page-grid-3" style={{ marginTop: 8 }}>
        <Card>
          <strong>Resumo</strong>
          <ul>
            <li>Total provas: {data?.total ?? '-'}</li>
            <li>Aprovadas/Revisão/Ajustes: {data?.aprovadas ?? 0} / {data?.revisao ?? 0} / {data?.ajustes ?? 0}</li>
          </ul>
        </Card>
        <Card>
          <strong>Uso de IA</strong>
          <ul>
            <li>Tokens in/out: {data?.tokens_in ?? 0} / {data?.tokens_out ?? 0}</li>
            <li>Custo: R$ {(data?.cost_cents ? (data.cost_cents/100).toFixed(2) : '0,00')}</li>
          </ul>
        </Card>
        <Card>
          <strong>Provas por dia</strong>
          {data?.provasPorDia ? (
            <LineChart labels={data.provasPorDia.map((d: any) => d.date)} data={data.provasPorDia.map((d: any) => d.count)} />
          ) : <small className="muted">Sem dados</small>}
        </Card>
      </div>
      <Card>
        <strong>Top Professores (por tokens IA)</strong>
        <div className="col" style={{ gap: 8, marginTop: 8 }}>
          {data?.topProfessores?.map((t: any) => (
            <div key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{t.id}</span>
              <span className="muted">{t.tokens} tokens</span>
            </div>
          )) || <small className="muted">Sem dados</small>}
        </div>
      </Card>
    </div>
  );
}
