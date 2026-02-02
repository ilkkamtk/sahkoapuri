import { Request, Response, Router } from 'express';
import exampleRouter from './routes/exampleRoute';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'media api v1',
  });
});

router.use('/example', exampleRouter);

export default router;
