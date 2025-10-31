import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Modal } from '@edutech/ui';
import { api } from '../lib/api';

type Escola = { id: string; nome: string; slug?: string | null; logo_url?: string | null; pdf_capa_url?: string | null; pdf_footer?: string | null };
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
  const [turmaForm, setTurmaForm] = useState({ nome_exibicao: '', ano_letivo: new Date().getFullYear(), turno: 'manha' });
  const [coordForm, setCoordForm] = useState({ nome: '', email: '' });
  const [footer, setFooter] = useState('');
  const [policy, setPolicy] = useState<any>({});
  const [keys, setKeys] = useState<any[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [newApiToken, setNewApiToken] = useState<string | null>(null);

  async function load() {
    const data = await api<{ escola: Escola; turmas: Turma[]; usuarios: Usuario[]; materias: Materia[] }>(`/escolas/${id}`);
    setEscola(data.escola);
    setNome(data.escola.nome);
    setFooter((data as any).escola.pdf_footer || '');
    setTurmas(data.turmas);
    setUsuarios(data.usuarios);
    setMaterias(data.materias);
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { (async () => { if (!id) return; try { const pol = await api<any>(`/escolas/${id}/policy`); setPolicy(pol || {}); const ks = await api<any[]>(`/escolas/${id}/api-keys`); setKeys(ks); } catch {} })(); }, [id]);

  async function saveNome() {
    await api(`/escolas/${id}`, { method: 'PUT', body: JSON.stringify({ nome }) });
    await load();
  }

  async function saveFooter() {
    await api(`/escolas/${id}`, { method: 'PUT', body: JSON.stringify({ pdf_footer: footer }) });
    await load();
  }

  async function upload(type: 'logo'|'capa', file: File) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('escola_id', String(id));
    fd.append('type', type);
    await api(`/uploads/escola-asset`, { method: 'POST', body: fd });
    await load();
  }

  async function savePolicy() {
    await api(`/escolas/${id}/policy`, { method: 'PUT', body: JSON.stringify(policy) });
    setNotice('Política salva');
  }

  async function createKey() {
    const res = await api<any>(`/escolas/${id}/api-keys`, { method: 'POST', body: JSON.stringify({ name: 'default' }) });
    setNewApiToken(res.token);
    const ks = await api<any[]>(`/escolas/${id}/api-keys`);
    setKeys(ks);
  }

  async function disableKey(keyId: string) {
    await api(`/api-keys/${keyId}/disable`, { method: 'PATCH' });
    const ks = await api<any[]>(`/escolas/${id}/api-keys`);
    setKeys(ks);
  }

  function abrirTurma() {
    setTurmaForm({ nome_exibicao: '', ano_letivo: new Date().getFullYear(), turno: 'manha' });
    setOpenTurma(true);
  }

  async function submitTurma() {
    if (busy) return;
    if (!turmaForm.nome_exibicao.trim()) return;
    setBusy(true);
    try {
      await api(`/escolas/${id}/turmas`, { method: 'POST', body: JSON.stringify(turmaForm) });
      setOpenTurma(false);
      await load();
    } finally { setBusy(false); }
  }

  function abrirCoord() { setCoordForm({ nome: '', email: '' }); setOpenCoord(true); }

  async function submitCoord() {
    if (busy) return;
    if (!coordForm.nome.trim() || !coordForm.email.trim()) return;
    setBusy(true);
    try {
      const res = await api<any>(`/escolas/${id}/usuarios`, { method: 'POST', body: JSON.stringify({ ...coordForm, role: 'coordenacao' }) });
      setTempPass(res.temp_password || null);
      setOpenCoord(false);
      await load();
    } finally { setBusy(false); }
  }

  if (!escola) return null;
  return (
    <>
      <div className="container">
        {notice && <div className="surface card" style={{ marginBottom: 12, padding: 10, borderLeft: '4px solid var(--success)' }}><small>{notice}</small></div>}
        <h2 style={{ marginTop: 0 }}>Escola</h2>
        <Card>
          <div className="row" style={{ alignItems: 'center', gap: 12 }}>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} style={{ maxWidth: 420 }} />
            <Button onClick={saveNome}>Salvar</Button>
            <Button variant="secondary" onClick={abrirTurma}>Nova turma</Button>
            <Button variant="outline" onClick={abrirCoord}>Novo coordenador</Button>
            {tempPass && <small className="muted">Senha temporaria: <strong>{tempPass}</strong></small>}
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

      <div className="page-grid-3" style={{ marginTop: 16 }}>
        <Card>
          <strong>Branding</strong>
          <div className="col" style={{ marginTop: 8, gap: 10 }}>
            <div className="row" style={{ gap: 12 }}>
              <div className="col" style={{ flex: 1 }}>
                <label className="label">Logo</label>
                {escola?.logo_url && <img src={escola.logo_url} alt="logo" style={{ maxWidth: '100%', maxHeight: 80 }} />}
                <input type="file" className="input" onChange={(e) => e.target.files && upload('logo', e.target.files[0])} />
              </div>
              <div className="col" style={{ flex: 1 }}>
                <label className="label">Capa do PDF</label>
                {(escola as any)?.pdf_capa_url && <img src={(escola as any).pdf_capa_url} alt="capa" style={{ maxWidth: '100%', maxHeight: 80 }} />}
                <input type="file" className="input" onChange={(e) => e.target.files && upload('capa', e.target.files[0])} />
              </div>
            </div>
            <label className="label">Rodapé do PDF</label>
            <input className="input" value={footer} onChange={(e) => setFooter(e.target.value)} />
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={saveFooter}>Salvar rodapé</Button>
            </div>
          </div>
        </Card>
        <Card>
          <strong>Políticas</strong>
          <div className="col" style={{ gap: 8, marginTop: 8 }}>
            <label className="label">Aderencia mínima</label>
            <input className="input" type="number" value={policy.aderencia_min ?? ''} onChange={(e) => setPolicy({ ...policy, aderencia_min: Number(e.target.value) })} />
            <label className="label">Coerencia mínima</label>
            <input className="input" type="number" value={policy.coerencia_min ?? ''} onChange={(e) => setPolicy({ ...policy, coerencia_min: Number(e.target.value) })} />
            <label className="label">Imagens (modo)</label>
            <select className="select" value={policy.imagens_modo || ''} onChange={(e) => setPolicy({ ...policy, imagens_modo: e.target.value })}>
              <option value="">padrão</option>
              <option value="inline">inline</option>
              <option value="glossario">glossario</option>
              <option value="auto">auto</option>
            </select>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={savePolicy}>Salvar políticas</Button>
            </div>
          </div>
        </Card>
        <Card>
          <strong>API Keys</strong>
          <div className="col" style={{ gap: 8, marginTop: 8 }}>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={createKey}>Nova API Key</Button>
            </div>
            {keys.map((k) => (
              <div key={k.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{k.name} — {k.active ? 'ativa' : 'inativa'}</span>
                {k.active && <Button variant="outline" onClick={() => disableKey(k.id)}>Desativar</Button>}
              </div>
            ))}
            {keys.length === 0 && <small className="muted">Sem keys</small>}
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
          <label className="label">Nome de exibicao</label>
          <input className="input" value={turmaForm.nome_exibicao} onChange={(e) => setTurmaForm({ ...turmaForm, nome_exibicao: e.target.value })} />
          <div className="row" style={{ gap: 12 }}>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Ano letivo</label>
              <input className="input" type="number" value={turmaForm.ano_letivo} onChange={(e) => setTurmaForm({ ...turmaForm, ano_letivo: Number(e.target.value) })} />
            </div>
            <div className="col" style={{ flex: 1 }}>
              <label className="label">Turno</label>
              <select className="select" value={turmaForm.turno} onChange={(e) => setTurmaForm({ ...turmaForm, turno: e.target.value })}>
                <option>manha</option>
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
          <label className="label">Email</label>
          <input className="input" value={coordForm.email} onChange={(e) => setCoordForm({ ...coordForm, email: e.target.value })} />
          <small className="muted">Uma senha temporaria sera gerada e mostrada apos criar. No primeiro acesso sera exigida a troca.</small>
        </div>
      </Modal>

      <Modal open={!!newApiToken} title="Nova API Key" onClose={() => setNewApiToken(null)}
        footer={<>
          <Button onClick={() => setNewApiToken(null)}>Fechar</Button>
        </>}>
        <div className="col" style={{ gap: 10 }}>
          <small className="muted">Copie e guarde sua chave com segurança. Ela será mostrada apenas uma vez.</small>
          <div className="surface card" style={{ padding: 10, userSelect: 'all' }}>
            <code>{newApiToken}</code>
          </div>
        </div>
      </Modal>
    </>
  );
}
