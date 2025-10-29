import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AppShell, Header, Sidebar, Button, Card } from '@jcode/ui/src';

function Nav() {
  return (
    <nav className="col" aria-label="Navegação principal">
      <Link to="/professor">Professor</Link>
      <Link to="/coordenacao">Coordenação</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  );
}

function ProfessorPage() {
  return (
    <div className="col">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" aria-label="Ações de prova">
          <span>Status: DRAFT</span>
        </div>
        <div className="row">
          <Button variant="outline">Salvar</Button>
          <Button variant="secondary">Pré-visualizar</Button>
          <Button>Enviar</Button>
        </div>
      </div>
      <div className="row">
        <Card style={{ flex: 1 }}>
          <strong>Metadados</strong>
          <div className="col">
            <label>
              Título interno
              <input style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
            </label>
            <label>
              Turma
              <input placeholder="Buscar turma..." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
            </label>
            <label>
              Matéria
              <select style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}>
                <option>Selecionar</option>
              </select>
            </label>
            <label>
              Template
              <select style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}>
                <option>Objetiva Simples</option>
                <option>Mista Bimestral</option>
                <option>Simulado A/B</option>
              </select>
            </label>
          </div>
        </Card>
        <Card style={{ flex: 2 }}>
          <strong>Questões</strong>
          <div className="col" style={{ marginTop: 8 }}>
            <div className="surface card" style={{ padding: 8 }}>
              <em>Lista de questões (drag & drop) — stub</em>
            </div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <strong>Painel IA</strong>
          <div className="col" style={{ marginTop: 8 }}>
            <Button variant="secondary">Analisar</Button>
            <div>
              <small>Badges e sugestões por questão — stub</small>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CoordenacaoPage() {
  return (
    <div className="col">
      <Card>
        <strong>Revisão</strong>
        <p>Abas: Análise IA, Conformidade Template, Imagens, Comentários — stub</p>
        <div className="row">
          <Button variant="outline">Solicitar ajustes</Button>
          <Button>Aprovar</Button>
        </div>
      </Card>
    </div>
  );
}

function AdminPage() {
  return (
    <div className="col">
      <Card>
        <strong>Admin</strong>
        <p>Escolas, Turmas, Matérias, Usuários, Vínculos — stub</p>
      </Card>
    </div>
  );
}

export default function App({ theme, setTheme }: { theme: 'light' | 'dark'; setTheme: (t: 'light' | 'dark') => void }) {
  return (
    <AppShell
      header={<Header onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />}
      sidebar={<Sidebar><Nav /></Sidebar>}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/professor" replace />} />
        <Route path="/professor" element={<ProfessorPage />} />
        <Route path="/coordenacao" element={<CoordenacaoPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </AppShell>
  );
}
