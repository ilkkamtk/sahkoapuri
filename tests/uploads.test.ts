import request from 'supertest';
import app from '../src/app';
import db from '../src/utils/db';
import mongoose from 'mongoose';
import path from 'path';

describe('Uploads API', () => {
  beforeAll(async () => {
    await db();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/v1/uploads', () => {
    it('should upload an Excel file and return consumption analysis', async () => {
      const testFilePath = path.join(__dirname, 'test.xlsx');

      const response = await request(app)
        .post('/api/v1/uploads')
        .attach('file', testFilePath)
        .expect(200);

      expect(response.body).toHaveProperty('aiAnalysis');
      expect(response.body).toHaveProperty('totalConsumption');
      expect(response.body).toHaveProperty('averagePrice');

      expect(response.body.aiAnalysis).toEqual({
        consumption: 'Kokonaissiirto (kWh)',
        datetime: 'Ajankohta',
        interval: '1hour',
        dateFormat: 'd.M.yyyy HH:mm',
      });

      // Check that we got numerical values
      expect(typeof response.body.totalConsumption).toBe('number');
      expect(typeof response.body.averagePrice).toBe('number');

      // Total consumption should be about 14,800-15,000 kWh
      expect(response.body.totalConsumption).toBeGreaterThan(14000);
      expect(response.body.totalConsumption).toBeLessThan(16000);

      // Average price: total cost / total consumption
      // For 2025 data, should be around 5-7 cents/kWh
      expect(response.body.averagePrice).toBeGreaterThan(5);
      expect(response.body.averagePrice).toBeLessThan(7);
    }, 20000); // 20 second timeout for AI processing

    it('should return 400 when no file is uploaded', async () => {
      await request(app).post('/api/v1/uploads').expect(400);
    });

    it('should return error when file is not an Excel file', async () => {
      // Multer will reject non-Excel files with a 500 error
      const response = await request(app)
        .post('/api/v1/uploads')
        .attach('file', Buffer.from('not an excel file'), 'test.txt');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
