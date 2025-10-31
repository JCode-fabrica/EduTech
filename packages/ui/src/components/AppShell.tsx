import React from 'react';
import { Button } from './Button';

export function Header({ onToggleTheme, theme = 'light' as 'light' | 'dark' }: { onToggleTheme: () => void; theme?: 'light' | 'dark' }) {
  return (
    <div className="header">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <strong>EduTech</strong>
      </div>
      <div className="row">
        <Button variant="outline" onClick={onToggleTheme} aria-label="Alternar tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ children }: React.PropsWithChildren) {
  return <aside className="sidebar">{children}</aside>;
}

export function AppShell({
  header,
  sidebar,
  children
}: React.PropsWithChildren<{ header?: React.ReactNode; sidebar?: React.ReactNode }>) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%' }}>
      <div>{sidebar}</div>
      <div style={{ display: 'grid', gridTemplateRows: '56px 1fr' }}>
        <div>{header}</div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default AppShell;

