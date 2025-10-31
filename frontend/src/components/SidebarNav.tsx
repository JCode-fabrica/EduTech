import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { navItems } from '../routes/nav';

export default function SidebarNav() {
  const { user } = useAuth();
  return (
    <div className="sidebar-inner">
      <div className="brand">
        <span className="brand-accent">E</span>duTech
      </div>
      <nav className="nav" aria-label="Navegação principal">
        {navItems
          .filter((i) => (user ? i.roles.includes(user.role) : i.path === '/professor'))
          .map((i) => (
            <NavLink key={i.path} to={i.path} className={({ isActive }) => (isActive ? 'active' : '')}>
              {i.label}
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
