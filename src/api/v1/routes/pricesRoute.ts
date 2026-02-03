import express from 'express';
import { populatePrices, getPrices } from '../controllers/pricesController';

const router = express.Router();

router.get('/', getPrices);
router.post('/populate', populatePrices);

export default router;
