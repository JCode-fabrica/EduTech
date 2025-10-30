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

  const payload: any = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role as any,
    escola_id: user.escola_id
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret-change-me', { expiresIn: '2h' });
  return res.json({ token, user: { ...payload, must_change_password: user.must_change_password as any } } as any);
});

router.get('/me', requireAuth, (req, res) => {
  const me: MeResponse = { user: req.user! };
  return res.json(me);
});

router.post('/auth/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body as { current_password: string; new_password: string };
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'weak_password' });
  const user = await prisma.usuario.findFirst({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  // If user must change password, we can allow skipping current check. Otherwise, verify current.
  if (!user.must_change_password) {
    const ok = await bcrypt.compare(String(current_password || ''), user.senha_hash || '');
    if (!ok) return res.status(401).json({ error: 'invalid_current_password' });
  }
  const hash = await bcrypt.hash(new_password, 10);
  await prisma.usuario.update({ where: { id: user.id }, data: { senha_hash: hash, must_change_password: false } });
  return res.json({ ok: true });
});

export default router;
