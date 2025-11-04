import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { adminGroups, otherRoleItems } from '../routes/nav';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const p = { stroke: 'currentColor', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const S = (children: React.ReactNode) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className={`nav-icon ${className}`}> {children} </svg>
  );
  switch (name) {
    case 'building':
      return S(<g {...p}><rect x="3" y="7" width="7" height="13"/><rect x="14" y="3" width="7" height="17"/><path d="M3 12h7M14 8h7"/></g>);
    case 'layers':
      return S(<g {...p}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/></g>);
    case 'layout':
      return S(<g {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M3 10h18"/></g>);
    case 'dashboard':
      return S(<g {...p}><circle cx="12" cy="12" r="9"/><path d="M12 12l5-3"/></g>);
    case 'users':
      return S(<g {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>);
    case 'chart':
      return S(<g {...p}><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-7"/></g>);
    case 'file':
      return S(<g {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></g>);
    case 'audit':
      return S(<g {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></g>);
    case 'activity':
      return S(<g {...p}><path d="M22 12H18l-3 7L9 5l-3 7H2"/></g>);
    case 'briefcase':
      return S(<g {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></g>);
    case 'shield':
      return S(<g {...p}><path d="M12 22s8-4 8-10V6l-8-3-8 3v6c0 6 8 10 8 10z"/></g>);
    case 'school':
      return S(<g {...p}><path d="M3 10l9-5 9 5-9 5-9-5z"/><path d="M21 10v6"/><path d="M12 15v7"/></g>);
    case 'review':
      return S(<g {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-5"/></g>);
    default:
      return S(<g {...p}><circle cx="12" cy="12" r="2"/></g>);
  }
}

export default function SidebarNav() {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const initialOpen = useMemo(() => {
    const st: Record<string, boolean> = {};
    for (const g of adminGroups) st[g.label] = false;
    // open matching group by current path
    const match = adminGroups.find(g => g.items.some(i => location.pathname.startsWith(i.path)));
    if (match) st[match.label] = true; else st['Escolar'] = true;
    return st;
  }, [location.pathname]);

  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);
  useEffect(() => { setOpen(initialOpen); }, [initialOpen]);

  const itemsForOtherRole = useMemo(() => otherRoleItems.filter(i => (user ? i.roles.includes(user.role) : false)), [user]);

  if (!user) return null;

  const exclusiveToggle = (label: string) => {
    const next: Record<string, boolean> = {};
    for (const g of adminGroups) next[g.label] = false;
    next[label] = !open[label];
    setOpen(next);
  };

  return (
    <div className="sidebar-inner">
      <div className="brand">
        <span className="brand-accent">E</span>duTech
      </div>
      {isAdmin ? (
        <nav className="nav" aria-label="Navegação principal">
          {adminGroups.map((g) => {
            const isOpen = !!open[g.label];
            return (
              <div key={g.label} className="nav-group">
                <button
                  className="nav-group-header"
                  onClick={() => exclusiveToggle(g.label)}
                  aria-expanded={isOpen ? 'true' : 'false'}
                  aria-controls={`group-${g.label}`}
                >
                  <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={g.icon} />{g.label}</span>
                    <span className={`chevron ${isOpen ? 'open' : ''}`}>›</span>
                  </div>
                </button>
                {isOpen && (
                  <div id={`group-${g.label}`} className="nav-group-items">
                    {g.items.map((i) => (
                      <NavLink key={i.path} to={i.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name={i.icon} />{i.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      ) : (
        <nav className="nav" aria-label="Navegação principal">
          {itemsForOtherRole.map((i) => (
            <NavLink key={i.path} to={i.path} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name={i.icon} />{i.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
