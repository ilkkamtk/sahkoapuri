import { Request, Response, Router } from 'express';
import pricesRouter from './routes/pricesRoute';
import uploadsRouter from './routes/uploadsRoute';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'media api v1',
  });
});

router.use('/prices', pricesRouter);
router.use('/uploads', uploadsRouter);

export default router;
