import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@edutech/ui';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('prof@demo.com');
  const [senha, setSenha] = useState('demo');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light'|'dark'>(() => (localStorage.getItem('theme') as 'light'|'dark') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, senha);
      if (email.includes('admin')) navigate('/admin');
      else if (email.includes('coord')) navigate('/coordenacao');
      else navigate('/professor');
    } catch {
      setError('Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-toggle">
        <Button variant="outline" aria-label="Alternar tema" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
      </div>
      <div className="login-bg">
        <span className="blob a float-slow" />
        <span className="blob b float-slow" style={{ animationDelay: '1.5s' }} />
      </div>
      <Card className="animate-fade-in-up card-glow" style={{ width: 420 }}>
        <div className="col">
          <h2 style={{ margin: 0 }}><span className="brand-accent">E</span>duTech</h2>
          <p className="muted">Acesse sua conta</p>
          <form className="col" onSubmit={submit}>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="label" htmlFor="senha">Senha</label>
            <input id="senha" type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
            {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
