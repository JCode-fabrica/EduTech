import { Router } from 'express';
import { router as auth } from './modules/auth';
import { router as admin } from './modules/admin';
import { router as professor } from './modules/professor';
import { router as coordenacao } from './modules/coordenacao';
import { router as templates } from './modules/templates';
import { router as provas } from './modules/provas';

export const router = Router();

router.use(auth);
router.use(admin);
router.use(professor);
router.use(coordenacao);
router.use(templates);
router.use(provas);
