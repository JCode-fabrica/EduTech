import React from 'react';
import { NavLink } from 'react-router-dom';

export default function SidebarNav() {
  return (
    <div className="sidebar-inner">
      <div className="brand">
        <span className="brand-accent">J</span>Code
      </div>
      <nav className="nav" aria-label="Navegação principal">
        <NavLink to="/professor" className={({ isActive }) => (isActive ? 'active' : '')}>Professor</NavLink>
        <NavLink to="/coordenacao" className={({ isActive }) => (isActive ? 'active' : '')}>Coordenação</NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>Admin</NavLink>
      </nav>
    </div>
  );
}

