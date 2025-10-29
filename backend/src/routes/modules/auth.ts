import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { LoginRequest, LoginResponse, MeResponse } from '@jcode/types';
import { requireAuth } from '../middleware/auth';

export const router = Router();

router.post('/auth/login', (req, res) => {
  const { email, senha } = req.body as LoginRequest;
  if (!email || !senha) return res.status(400).json({ error: 'invalid_credentials' });

  // Stub user; replace with DB lookup + bcrypt compare
  const user = {
    id: 'u_1',
    nome: 'Usuário Demo',
    email,
    role: email.includes('coord') ? 'coordenacao' : email.includes('admin') ? 'admin' : 'professor',
    escola_id: 'escola_1'
  } as LoginResponse['user'];

  const token = jwt.sign(user, process.env.JWT_SECRET || 'devsecret-change-me', { expiresIn: '2h' });
  const resp: LoginResponse = { token, user };
  return res.json(resp);
});

router.get('/me', requireAuth, (req, res) => {
  const me: MeResponse = { user: req.user! };
  return res.json(me);
});

export default router;
