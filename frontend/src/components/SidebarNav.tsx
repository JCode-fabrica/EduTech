import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function SidebarNav() {
  const { user } = useAuth();
  return (
    <div className="sidebar-inner">
      <div className="brand">
        <span className="brand-accent">E</span>duTech
      </div>
      <nav className="nav" aria-label="Navegação principal">
        {(!user || user.role === 'professor') && (
          <NavLink to="/professor" className={({ isActive }) => (isActive ? 'active' : '')}>Professor</NavLink>
        )}
        {user && user.role === 'coordenacao' && (
          <NavLink to="/coordenacao" className={({ isActive }) => (isActive ? 'active' : '')}>Coordenacao</NavLink>
        )}
        {user && user.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>Admin</NavLink>
        )}
      </nav>
    </div>
  );
}
