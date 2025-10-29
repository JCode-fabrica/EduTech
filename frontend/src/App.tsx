import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell, Header, Sidebar, Button, Card } from '@jcode/ui/src';
import SidebarNav from './components/SidebarNav';

function ProfessorPage() {
  return (
    <div className="container">
      <div className="status-bar">
        <span className="muted">Status: DRAFT</span>
        <div className="row">
          <Button variant="outline">Salvar</Button>
          <Button variant="secondary">Pré-visualizar</Button>
          <Button>Enviar</Button>
        </div>
      </div>
      <div className="page-grid-3">
        <Card>
          <strong>Metadados</strong>
          <div className="col" style={{ marginTop: 8 }}>
            <label className="label" htmlFor="titulo">Título interno</label>
            <input id="titulo" className="input" />

            <label className="label" htmlFor="turma">Turma</label>
            <input id="turma" className="input" placeholder="Buscar turma..." />

            <label className="label" htmlFor="materia">Matéria</label>
            <select id="materia" className="select">
              <option>Selecionar</option>
            </select>

            <label className="label" htmlFor="template">Template</label>
            <select id="template" className="select">
              <option>Objetiva Simples</option>
              <option>Mista Bimestral</option>
              <option>Simulado A/B</option>
            </select>
          </div>
        </Card>
        <Card>
          <strong>Questões</strong>
          <div className="col" style={{ marginTop: 8 }}>
            <div className="surface card" style={{ padding: 8 }}>
              <em>Lista de questões (drag & drop) — stub</em>
            </div>
          </div>
        </Card>
        <Card>
          <strong>Painel IA</strong>
          <div className="col" style={{ marginTop: 8 }}>
            <Button variant="secondary">Analisar</Button>
            <small className="muted">Badges e sugestões por questão — stub</small>
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
      sidebar={<Sidebar><SidebarNav /></Sidebar>}
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
