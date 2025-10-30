import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { LoginRequest, LoginResponse, MeResponse } from '@jcode/types';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../../db';

export const router = Router();

router.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body as LoginRequest;
  if (!email || !senha) return res.status(400).json({ error: 'invalid_credentials' });

  const user = await prisma.usuario.findFirst({ where: { email: email.toLowerCase(), ativo: true } });
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await bcrypt.compare(String(senha), user.senha_hash || '');
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const payload: LoginResponse['user'] = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role as any,
    escola_id: user.escola_id
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret-change-me', { expiresIn: '2h' });
  return res.json({ token, user: payload } as LoginResponse);
});

router.get('/me', requireAuth, (req, res) => {
  const me: MeResponse = { user: req.user! };
  return res.json(me);
});

export default router;
