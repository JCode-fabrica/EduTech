import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card } from '@jcode/ui/src';
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

  const criarTurma = async () => {
    const nome_exibicao = prompt('Nome da turma (ex.: 1A)') || '';
    if (!nome_exibicao) return;
    await api(`/escolas/${id}/turmas`, { method: 'POST', body: JSON.stringify({ nome_exibicao, ano_letivo: 2025, turno: 'manhã' }) });
    await load();
  };

  const criarCoord = async () => {
    const nome = prompt('Nome do coordenador') || '';
    const email = prompt('Email do coordenador') || '';
    if (!nome || !email) return;
    const res = await api<any>(`/escolas/${id}/usuarios`, { method: 'POST', body: JSON.stringify({ nome, email, role: 'coordenacao' }) });
    setTempPass(res.temp_password || null);
    await load();
  };

  if (!escola) return null;
  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>Escola</h2>
      <Card>
        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} style={{ maxWidth: 420 }} />
          <Button onClick={saveNome}>Salvar</Button>
          <Button variant="secondary" onClick={criarTurma}>Nova turma</Button>
          <Button variant="outline" onClick={criarCoord}>Novo coordenador</Button>
          {tempPass && <small className="muted">Senha temporária: <strong>{tempPass}</strong></small>}
        </div>
      </Card>

      <div className="page-grid-3" style={{ marginTop: 16 }}>
        <Card>
          <strong>Turmas</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {turmas.map((t) => (
              <div key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{t.nome_exibicao}</span>
                <span className="muted">{t.ano_letivo} • {t.turno}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <strong>Coordenadores</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {usuarios.filter((u) => u.role === 'coordenacao').map((u) => (
              <div key={u.id}>{u.nome} — {u.email}</div>
            ))}
          </div>
        </Card>
        <Card>
          <strong>Professores</strong>
          <div className="col" style={{ marginTop: 8 }}>
            {usuarios.filter((u) => u.role === 'professor').map((u) => (
              <div key={u.id}>{u.nome} — {u.email}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

