import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { adminGroups, otherRoleItems } from '../routes/nav';

export default function SidebarNav() {
  const { user } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of adminGroups) initial[g.label] = g.label === 'Escolar';
    return initial;
  });

  const isAdmin = user?.role === 'admin';
  const itemsForOtherRole = useMemo(() => otherRoleItems.filter(i => (user ? i.roles.includes(user.role) : false)), [user]);

  if (!user) return null;

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
                  onClick={() => setOpen({ ...open, [g.label]: !isOpen })}
                  aria-expanded={isOpen ? 'true' : 'false'}
                  aria-controls={`group-${g.label}`}
                >
                  <span>{g.label}</span>
                  <span className={`chevron ${isOpen ? 'open' : ''}`}>›</span>
                </button>
                {isOpen && (
                  <div id={`group-${g.label}`} className="nav-group-items">
                    {g.items.map((i) => (
                      <NavLink key={i.path} to={i.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                        {i.label}
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
              {i.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
