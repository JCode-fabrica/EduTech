import type { Role } from '../auth/AuthContext';

export type NavItem = { label: string; path: string; roles: Role[]; icon: string };
export type NavGroup = { label: string; roles: Role[]; icon: string; items: NavItem[] };

// Grupos para ADMIN
export const adminGroups: NavGroup[] = [
  {
    label: 'Escolar',
    roles: ['admin'],
    icon: 'school',
    items: [
      { label: 'Escolas', path: '/admin/escolas', roles: ['admin'], icon: 'building' },
      { label: 'Turmas e matérias', path: '/admin/turmas-materias', roles: ['admin'], icon: 'layers' },
      { label: 'Templates', path: '/admin/templates', roles: ['admin'], icon: 'layout' }
    ]
  },
  {
    label: 'Administrativo',
    roles: ['admin'],
    icon: 'briefcase',
    items: [
      { label: 'Painel', path: '/admin/overview', roles: ['admin'], icon: 'dashboard' },
      { label: 'Usuários', path: '/admin/usuarios', roles: ['admin'], icon: 'users' },
      { label: 'Relatórios', path: '/admin/relatorios', roles: ['admin'], icon: 'chart' },
      { label: 'Storage e PDFs', path: '/admin/storage-pdfs', roles: ['admin'], icon: 'file' }
    ]
  },
  {
    label: 'Segurança',
    roles: ['admin'],
    icon: 'shield',
    items: [
      { label: 'Auditoria', path: '/admin/logs', roles: ['admin'], icon: 'audit' },
      { label: 'Observabilidade', path: '/admin/observabilidade', roles: ['admin'], icon: 'activity' }
    ]
  }
];

// Itens avulsos para outras roles
export const otherRoleItems: NavItem[] = [
  // Coordenação
  { label: 'Revisões', path: '/coordenacao', roles: ['coordenacao'], icon: 'review' },
  { label: 'Relatórios', path: '/coordenacao/relatorios', roles: ['coordenacao'], icon: 'chart' },
  // Professor
  { label: 'Minhas Provas', path: '/professor', roles: ['professor'], icon: 'file' }
];
