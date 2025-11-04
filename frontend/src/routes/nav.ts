import type { Role } from '../auth/AuthContext';

export type NavItem = { label: string; path: string; roles: Role[] };
export type NavGroup = { label: string; roles: Role[]; items: NavItem[] };

// Grupos para ADMIN
export const adminGroups: NavGroup[] = [
  {
    label: 'Escolar',
    roles: ['admin'],
    items: [
      { label: 'Escolas', path: '/admin/escolas', roles: ['admin'] },
      { label: 'Turmas e matérias', path: '/admin/turmas-materias', roles: ['admin'] },
      { label: 'Templates', path: '/admin/templates', roles: ['admin'] }
    ]
  },
  {
    label: 'Administrativo',
    roles: ['admin'],
    items: [
      { label: 'Painel', path: '/admin/overview', roles: ['admin'] },
      { label: 'Relatórios', path: '/admin/relatorios', roles: ['admin'] },
      { label: 'Storage e PDFs', path: '/admin/storage-pdfs', roles: ['admin'] }
    ]
  },
  {
    label: 'Segurança',
    roles: ['admin'],
    items: [
      { label: 'Auditoria', path: '/admin/logs', roles: ['admin'] },
      { label: 'Observabilidade', path: '/admin/observabilidade', roles: ['admin'] }
    ]
  }
];

// Itens avulsos para outras roles
export const otherRoleItems: NavItem[] = [
  // Coordenação
  { label: 'Revisões', path: '/coordenacao', roles: ['coordenacao'] },
  { label: 'Relatórios', path: '/coordenacao/relatorios', roles: ['coordenacao'] },
  // Professor
  { label: 'Minhas Provas', path: '/professor', roles: ['professor'] }
];
