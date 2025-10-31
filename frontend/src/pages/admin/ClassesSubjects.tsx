import React, { useEffect, useState } from 'react';
import { Card, Button, Modal } from '@edutech/ui';
import { api } from '../../lib/api';
import SchoolPicker from '../../components/SchoolPicker';
import { useSelectedSchool } from '../../admin/useAdminSchool';

export default function ClassesSubjects() {
  const { schoolId } = useSelectedSchool();
  const [data, setData] = useState<any>(null);
  const [openT, setOpenT] = useState(false);
  const [openM, setOpenM] = useState(false);
  const [tForm, setTForm] = useState({ nome_exibicao: '', ano_letivo: new Date().getFullYear(), turno: 'manha' });
  const [mForm, setMForm] = useState({ nome: '' });
  const [openCSV, setOpenCSV] = useState(false);
  const [csv, setCsv] = useState('professor_email,turma_id,materia_id\n');
  const [csvNotice, setCsvNotice] = useState<string | null>(null);
  const load = async () => { if (!schoolId) return; const r = await api<any>(`/escolas/${schoolId}`); setData(r); };
  useEffect(() => { load(); }, [schoolId]);
  const createT = async () => { if (!schoolId) return; await api(`/escolas/${schoolId}/turmas`, { method: 'POST', body: JSON.stringify(tForm) }); setOpenT(false); await load(); };
  const createM = async () => { if (!schoolId) return; await api(`/escolas/${schoolId}/materias`, { method: 'POST', body: JSON.stringify(mForm) }); setOpenM(false); await load(); };
  const delT = async (id: string) => { await api(`/turmas/${id}`, { method: 'DELETE' }); await load(); };
  const delM = async (id: string) => { await api(`/materias/${id}`, { method: 'DELETE' }); await load(); };
  return (
    <div className="container">
      <div className="status-bar">
        <h2 style={{ margin: 0 }}>Turmas & Matérias</h2>
        <div className="row">
          <Button variant="secondary" onClick={() => setOpenT(true)}>Nova turma</Button>
          <Button onClick={() => setOpenM(true)}>Nova matéria</Button>
          <Button variant="outline" onClick={() => setOpenCSV(true)}>Importar vínculos (CSV)</Button>
        </div>
      </div>
      <SchoolPicker />
      <div className="page-grid-3" style={{ marginTop: 8 }}>
        <Card>
          <strong>Turmas</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {data?.turmas?.map((t: any) => (
              <div key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{t.nome_exibicao} · {t.ano_letivo} · {t.turno}</span>
                <Button variant="outline" onClick={() => delT(t.id)}>Excluir</Button>
              </div>
            ))}
            {!data?.turmas?.length && <small className="muted">Sem turmas</small>}
          </div>
        </Card>
        <Card>
          <strong>Matérias</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {data?.materias?.map((m: any) => (
              <div key={m.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{m.nome}</span>
                <Button variant="outline" onClick={() => delM(m.id)}>Excluir</Button>
              </div>
            ))}
            {!data?.materias?.length && <small className="muted">Sem matérias</small>}
          </div>
        </Card>
        <Card>
          <strong>Vínculos (em massa)</strong>
          <p>Importe CSV para criar vínculos Professor↔Turma↔Matéria.</p>
        </Card>
      </div>

      <Modal open={openT} title="Nova turma" onClose={() => setOpenT(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpenT(false)}>Cancelar</Button>
          <Button onClick={createT}>Criar</Button>
        </>}>
        <div className="col" style={{ gap: 10 }}>
          <label className="label">Nome de exibição</label>
          <input className="input" value={tForm.nome_exibicao} onChange={(e) => setTForm({ ...tForm, nome_exibicao: e.target.value })} />
          <label className="label">Ano letivo</label>
          <input className="input" type="number" value={tForm.ano_letivo} onChange={(e) => setTForm({ ...tForm, ano_letivo: Number(e.target.value) })} />
          <label className="label">Turno</label>
          <select className="select" value={tForm.turno} onChange={(e) => setTForm({ ...tForm, turno: e.target.value })}>
            <option>manha</option>
            <option>tarde</option>
            <option>noite</option>
            <option>integral</option>
          </select>
        </div>
      </Modal>

      <Modal open={openM} title="Nova matéria" onClose={() => setOpenM(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpenM(false)}>Cancelar</Button>
          <Button onClick={createM}>Criar</Button>
        </>}>
        <div className="col" style={{ gap: 10 }}>
          <label className="label">Nome</label>
          <input className="input" value={mForm.nome} onChange={(e) => setMForm({ ...mForm, nome: e.target.value })} />
        </div>
      </Modal>

      <Modal open={openCSV} title="Importar vínculos (CSV)" onClose={() => setOpenCSV(false)}
        footer={<>
          <Button variant="outline" onClick={() => setOpenCSV(false)}>Cancelar</Button>
          <Button onClick={async () => { if (!schoolId) return; await api('/admin/import/vinculos', { method: 'POST', body: JSON.stringify({ escola_id: schoolId, csv }) }); setCsvNotice('Importado com sucesso'); setOpenCSV(false); await load(); }}>Importar</Button>
        </>}>
        <div className="col" style={{ gap: 8 }}>
          {csvNotice && <small style={{ color: 'var(--success)' }}>{csvNotice}</small>}
          <small className="muted">Formato: professor_email,turma_id,materia_id (com cabeçalho)</small>
          <textarea className="textarea" rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
