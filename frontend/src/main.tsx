import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@jcode/ui/src/theme.css';

function Root() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  return (
    <BrowserRouter>
      <App theme={theme} setTheme={setTheme} />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
