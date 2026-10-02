const request = require('supertest');

const API_URL = 'http://localhost:3000';

describe('Auth API', () => {
    it('GET /api/auth/session — login qilmagan', async () => {
        const res = await request(API_URL).get('/api/auth/session');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login — noto\'g\'ri parol', async () => {
        const res = await request(API_URL)
            .post('/api/auth/login')
            .send({ username: 'nonexistent', password: 'wrong' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/register — parol kuchsiz', async () => {
        const res = await request(API_URL)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                username: 'testuser123',
                phone: '998901234567',
                email: 'test@example.com',
                password: '123'
            });
        expect(res.status).toBe(400);
    });
});