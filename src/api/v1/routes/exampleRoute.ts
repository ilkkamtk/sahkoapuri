import express from 'express';
import { exampleGet, examplePost } from '../controllers/exampleController';
import { validateBody } from '@/middlewares/validate';
import { exampleCreateSchema } from '../schemas/exampleSchemas';

const router = express.Router();

router.route('/').get(exampleGet).post(validateBody(exampleCreateSchema), examplePost);

export default router;
