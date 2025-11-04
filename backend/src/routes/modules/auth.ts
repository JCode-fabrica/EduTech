import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../../db';
import { createHash } from 'node:crypto';

export const router = Router();

router.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body as any;
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
  const me: any = { user: req.user! };
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

// Accept invite and create/set password
router.post('/auth/accept-invite', async (req, res) => {
  const { token, nome, senha } = req.body as { token: string; nome: string; senha: string };
  if (!token || !nome || !senha) return res.status(400).json({ error: 'missing_fields' });
  const hash = createHash('sha256').update(token).digest('hex');
  const iv = await prisma.inviteToken.findFirst({ where: { token_hash: hash, used_at: null } });
  if (!iv || iv.expires_at < new Date()) return res.status(400).json({ error: 'invalid_or_expired' });
  // if user exists, update password; else create
  const senha_hash = await bcrypt.hash(senha, 10);
  const existing = await prisma.usuario.findFirst({ where: { email: iv.email } });
  let user;
  if (existing) {
    user = await prisma.usuario.update({ where: { id: existing.id }, data: { senha_hash, must_change_password: false, ativo: true } });
  } else {
    user = await prisma.usuario.create({ data: { escola_id: iv.escola_id, nome, email: iv.email, role: iv.role, senha_hash, ativo: true, must_change_password: false } });
  }
  await prisma.inviteToken.update({ where: { id: iv.id }, data: { used_at: new Date() } });
  const payload: any = { id: user.id, nome: user.nome, email: user.email, role: user.role, escola_id: user.escola_id };
  const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret-change-me', { expiresIn: '2h' });
  return res.json({ token: jwtToken, user: payload });
});

export default router;

