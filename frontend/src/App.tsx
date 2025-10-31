import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell, Sidebar, Button, Card } from '@edutech/ui';
import SidebarNav from './components/SidebarNav';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/Login';
import ChangePasswordPage from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import SchoolDetail from './pages/SchoolDetail';
import AdminOverview from './pages/admin/Overview';
import AdminUsers from './pages/admin/Users';
import ClassesSubjects from './pages/admin/ClassesSubjects';
import AdminTemplates from './pages/admin/Templates';
import AIQuotas from './pages/admin/AIQuotas';
import AdminReports from './pages/admin/Reports';
import AdminLogs from './pages/admin/Logs';
import AdminIntegrations from './pages/admin/Integrations';
import StoragePDF from './pages/admin/StoragePDF';
import Security from './pages/admin/Security';
import Observability from './pages/admin/Observability';
import { useAuth } from './auth/AuthContext';

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

export default function App({ theme, setTheme }: { theme: 'light' | 'dark'; setTheme: (t: 'light' | 'dark') => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  const TopBar = (
    <div className="header">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <strong>EduTech</strong>
      </div>
      <div className="row">
        {user && <span className="muted">{user.nome} · {user.role}</span>}
        <Button variant="outline" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Alternar tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
        {user ? (
          <Button variant="outline" onClick={logout}>Sair</Button>
        ) : null}
      </div>
    </div>
  );
  return (
    <AppShell header={TopBar} sidebar={<Sidebar><SidebarNav /></Sidebar>}>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/professor' : '/login'} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/alterar-senha" element={<ChangePasswordPage />} />
        <Route element={<ProtectedRoute allow={["professor"] as any} />}>
          <Route path="/professor" element={<ProfessorPage />} />
        </Route>
        <Route element={<ProtectedRoute allow={["coordenacao"] as any} />}>
          <Route path="/coordenacao" element={<CoordenacaoPage />} />
        </Route>
        <Route element={<ProtectedRoute allow={["admin"] as any} />}>
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="/admin/overview" element={<AdminOverview />} />
          <Route path="/admin/escolas" element={<AdminDashboard />} />
          <Route path="/admin/escolas/:id" element={<SchoolDetail />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/turmas-materias" element={<ClassesSubjects />} />
          <Route path="/admin/templates" element={<AdminTemplates />} />
          <Route path="/admin/ia-cotas" element={<AIQuotas />} />
          <Route path="/admin/relatorios" element={<AdminReports />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/integracoes" element={<AdminIntegrations />} />
          <Route path="/admin/storage-pdfs" element={<StoragePDF />} />
          <Route path="/admin/seguranca" element={<Security />} />
          <Route path="/admin/observabilidade" element={<Observability />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
