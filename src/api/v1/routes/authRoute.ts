import express from 'express';
import { login, crypt } from '../controllers/authController';
import { validateBody } from '@/middlewares/validate';
import { loginSchema, cryptSchema } from '../schemas/authSchemas';

const router = express.Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/crypt', validateBody(cryptSchema), crypt);

export default router;
