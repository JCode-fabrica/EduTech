import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell, Sidebar, Button, Card } from '@edutech/ui';
import SidebarNav from './components/SidebarNav';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/Login';
import ChangePasswordPage from './pages/ChangePassword';
import ProfessorPage from './pages/Professor';
import AdminDashboard from './pages/AdminDashboard';
import SchoolDetail from './pages/SchoolDetail';
import AdminOverview from './pages/admin/Overview';
import AdminUsers from './pages/admin/Users';
import ClassesSubjects from './pages/admin/ClassesSubjects';
import AdminTemplates from './pages/admin/Templates';
import AdminReports from './pages/admin/Reports';
import AdminLogs from './pages/admin/Logs';
import StoragePDF from './pages/admin/StoragePDF';
import Observability from './pages/admin/Observability';
import { useAuth } from './auth/AuthContext';

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
        {user && <span className="muted">{user.nome} — {user.role}</span>}
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
          <Route path="/admin/relatorios" element={<AdminReports />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/storage-pdfs" element={<StoragePDF />} />
          <Route path="/admin/observabilidade" element={<Observability />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
