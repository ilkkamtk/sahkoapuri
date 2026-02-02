import request from 'supertest';
import app from '../src/app';
import db from '../src/utils/db';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import UserModel from '../src/api/v1/models/userModel';

process.env.JWT_SECRET = 'test-secret';

describe('Prices API', () => {
  beforeAll(async () => {
    await db();
    // Create a test admin user
    const hashedPassword = bcrypt.hashSync('some pwd', 10);
    await UserModel.create({
      username: 'test-admin',
      password: hashedPassword,
      email: 'test-admin@example.com',
      user_level: 'admin',
    });
  });

  afterAll(async () => {
    // Delete the test user
    await UserModel.deleteOne({ username: 'test-admin' });
    await mongoose.disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'test-admin', password: 'some pwd' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('test-admin');
    });

    it('should return 403 for incorrect password', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'test-admin', password: 'wrong' })
        .expect(403);
    });
  });

  describe('GET /api/v1/prices', () => {
    it('should return an array of prices', async () => {
      const response = await request(app)
        .get(
          '/api/v1/prices?startDate=2025-01-01T00:00:00Z&endDate=2025-01-02T23:59:59Z',
        )
        .expect(200);

      const prices = response.body;

      console.log(prices);

      expect(Array.isArray(prices)).toBe(true);
      if (prices.length > 0) {
        expect(prices[0]).toHaveProperty('date');
        expect(prices[0]).toHaveProperty('price');
      }
    });

    it('should return 500 for invalid query params', async () => {
      await request(app)
        .get('/api/v1/prices?startDate=invalid&endDate=2025-01-02T23:59:59Z')
        .expect(500);
    });
  });

  describe('POST /api/v1/prices/populate', () => {
    let token: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'test-admin', password: 'some pwd' });
      token = response.body.token;
    });

    it('should allow populate with valid token', async () => {
      await request(app)
        .post('/api/v1/prices/populate')
        .set('Authorization', `Bearer ${token}`)
        .send({ years: [2021] })
        .expect((res) => {
          if (res.status === 401) {
            throw new Error('Should not return 401 with valid token');
          }
        });
    });

    it('should return 401 without token', async () => {
      await request(app)
        .post('/api/v1/prices/populate')
        .send({ years: [2021] })
        .expect(401);
    });
  });
});
