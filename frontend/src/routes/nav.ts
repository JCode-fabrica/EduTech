import type { Role } from '../auth/AuthContext';

export type NavItem = { label: string; path: string; roles: Role[]; icon?: string };

export const navItems: NavItem[] = [
  // Admin
  { label: '🧭 Painel', path: '/admin/overview', roles: ['admin'] },
  { label: '🏫 Escolas', path: '/admin/escolas', roles: ['admin'] },
  { label: '👥 Usuários', path: '/admin/usuarios', roles: ['admin'] },
  { label: '🧑‍🏫 Turmas & Matérias', path: '/admin/turmas-materias', roles: ['admin'] },
  { label: '📄 Templates', path: '/admin/templates', roles: ['admin'] },
  { label: '🤖 IA & Cotas', path: '/admin/ia-cotas', roles: ['admin'] },
  { label: '📊 Relatórios', path: '/admin/relatorios', roles: ['admin'] },
  { label: '🧾 Auditoria', path: '/admin/logs', roles: ['admin'] },
  { label: '🔑 Integrações & API', path: '/admin/integracoes', roles: ['admin'] },
  { label: '🗄️ Storage & PDFs', path: '/admin/storage-pdfs', roles: ['admin'] },
  { label: '🔐 Segurança', path: '/admin/seguranca', roles: ['admin'] },
  { label: '🩺 Observabilidade', path: '/admin/observabilidade', roles: ['admin'] },

  // Coordenação
  { label: '🔍 Revisões', path: '/coordenacao', roles: ['coordenacao'] },
  { label: '📊 Relatórios', path: '/coordenacao/relatorios', roles: ['coordenacao'] },

  // Professor
  { label: '📝 Minhas Provas', path: '/professor', roles: ['professor'] }
];

