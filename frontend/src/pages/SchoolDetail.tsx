import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Modal } from '@jcode/ui/src';
import { api } from '../lib/api';

type Escola = { id: string; nome: string; slug?: string | null };
type Turma = { id: string; nome_exibicao: string; ano_letivo: number; turno: string };
type Usuario = { id: string; nome: string; email: string; role: 'coordenacao' | 'professor' };
type Materia = { id: string; nome: string };

export default function SchoolDetail() {
  const { id } = useParams();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [nome, setNome] = useState('');
  const [tempPass, setTempPass] = useState<string | null>(null);
  const [openTurma, setOpenTurma] = useState(false);
  const [openCoord, setOpenCoord] = useState(false);
  const [busy, setBusy] = useState(false);
  const [turmaForm, setTurmaForm] = useState({ nome_exibicao: '', ano_letivo: new Date().getFullYear(), turno: 'manhÃ£' });
  const [coordForm, setCoordForm] = useState({ nome: '', email: '' });

  const load = async () => {
    const data = await api<{ escola: Escola; turmas: Turma[]; usuarios: Usuario[]; materias: Materia[] }>(`/escolas/${id}`);
    setEscola(data.escola);
    setNome(data.escola.nome);
    setTurmas(data.turmas);
    setUsuarios(data.usuarios);
    setMaterias(data.materias);
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveNome = async () => {
    await api(`/escolas/${id}`, { method: 'PUT', body: JSON.stringify({ nome }) });
    await load();
  };

  const abrirTurma = () => {
    setTurmaForm({ nome_exibicao: '', ano_letivo: new Date().getFullYear(), turno: 'manhÃ£' });
    setOpenTurma(true);
  };

  const submitTurma = async () => {
    if (busy) return;
    if (!turmaForm.nome_exibicao.trim()) return;
    setBusy(true);
    try {
      await api(`/escolas/${id}/turmas`, {
        method: 'POST',
        body: JSON.stringify({
          nome_exibicao: turmaForm.nome_exibicao,
          ano_letivo: Number(turmaForm.ano_letivo),
          turno: turmaForm.turno
        })
      });
      setOpenTurma(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const abrirCoord = () => {
    setCoordForm({ nome: '', email: '' });
    setOpenCoord(true);
  };

  const submitCoord = async () => {
    if (busy) return;
    if (!coordForm.nome.trim() || !coordForm.email.trim()) return;
    setBusy(true);
    try {
      const res = await api<any>(`/escolas/${id}/usuarios`, {
        method: 'POST',
        body: JSON.stringify({ nome: coordForm.nome, email: coordForm.email, role: 'coordenacao' })
      });
      setTempPass(res.temp_password || null);
      setOpenCoord(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!escola) return null;
  return (
    <>
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Escola</h2>
      <Card>
        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} style={{ maxWidth: 420 }} />
          <Button onClick={saveNome}>Salvar</Button>
          <Button variant="secondary" onClick={abrirTurma}>Nova turma</Button>
          <Button variant="outline" onClick={abrirCoord}>Novo coordenador</Button>
          {tempPass && <small className="muted">Senha temporÃ¡ria: <strong>{tempPass}</strong></small>}
        </div>
      </Card>

      <div className="page-grid-3" style={{ marginTop: 16 }}>
        <Card>
          <strong>Turmas</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {turmas.map((t) => (
              <div key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{t.nome_exibicao}</span>
                <span className="muted">{t.ano_letivo} â€¢ {t.turno}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <strong>Coordenadores</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {usuarios.filter((u) => u.role === 'coordenacao').map((u) => (
              <div key={u.id}>{u.nome} â€” {u.email}</div>
            ))}
          </div>
        </Card>
        <Card>
          <strong>Professores</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {usuarios.filter((u) => u.role === 'professor').map((u) => (
              <div key={u.id}>{u.nome} â€” {u.email}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
    <Modal open={openTurma} title="Nova turma" onClose={() => setOpenTurma(false)}
      footer={<>
        <Button variant="outline" onClick={() => setOpenTurma(false)}>Cancelar</Button>
        <Button onClick={submitTurma} disabled={busy}>{busy ? 'Salvando...' : 'Criar turma'}</Button>
      </>}>
      <div className="col" style={{ gap: 10 }}>
        <label className="label">Nome de exibiÃ§Ã£o</label>
        <input className="input" value={turmaForm.nome_exibicao} onChange={(e) => setTurmaForm({ ...turmaForm, nome_exibicao: e.target.value })} />
        <div className="row" style={{ gap: 12 }}>
          <div className="col" style={{ flex: 1 }}>
            <label className="label">Ano letivo</label>
            <input className="input" type="number" value={turmaForm.ano_letivo} onChange={(e) => setTurmaForm({ ...turmaForm, ano_letivo: Number(e.target.value) })} />
          </div>
          <div className="col" style={{ flex: 1 }}>
            <label className="label">Turno</label>
            <select className="select" value={turmaForm.turno} onChange={(e) => setTurmaForm({ ...turmaForm, turno: e.target.value })}>
              <option>manhÃ£</option>
              <option>tarde</option>
              <option>noite</option>
              <option>integral</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>

    <Modal open={openCoord} title="Novo coordenador" onClose={() => setOpenCoord(false)}
      footer={<>
        <Button variant="outline" onClick={() => setOpenCoord(false)}>Cancelar</Button>
        <Button onClick={submitCoord} disabled={busy}>{busy ? 'Criando...' : 'Criar coordenador'}</Button>
      </>}>
      <div className="col" style={{ gap: 10 }}>
        <label className="label">Nome</label>
        <input className="input" value={coordForm.nome} onChange={(e) => setCoordForm({ ...coordForm, nome: e.target.value })} />
        <label className="label">E-mail</label>
        <input className="input" value={coordForm.email} onChange={(e) => setCoordForm({ ...coordForm, email: e.target.value })} />
        <small className="muted">Uma senha temporÃ¡ria serÃ¡ gerada e mostrada apÃ³s criar. No primeiro acesso serÃ¡ exigida a troca.</small>
      </div>
    </Modal>
    </>
  );
}

