import React, { useState } from 'react';
import { Button, Card } from '@edutech/ui';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) { setError('Senhas não conferem'); return; }
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, new_password: next })
      });
      setOk(true);
      setTimeout(() => navigate('/'), 1000);
    } catch (err: any) {
      setError('Erro ao alterar senha');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 80, display: 'flex', justifyContent: 'center' }}>
      <Card style={{ width: 420 }}>
        <div className="col">
          <h2 style={{ margin: 0 }}>Alterar senha</h2>
          <form className="col" onSubmit={submit}>
            <label className="label">Senha atual (pode deixar vazio no primeiro acesso)</label>
            <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <label className="label">Nova senha</label>
            <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            <label className="label">Confirmar nova senha</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
            {ok && <small style={{ color: 'var(--success)' }}>Senha alterada!</small>}
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
