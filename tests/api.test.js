const request = require('supertest');
const API_URL = 'http://localhost:3000';

describe('CTF.UZ API', () => {
    describe('Auth', () => {
        it('GET /api/auth/session', async () => {
            const res = await request(API_URL).get('/api/auth/session');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success');
        });
    });

    describe('Challenges', () => {
        it('GET /api/challenges — login kerak', async () => {
            const res = await request(API_URL).get('/api/challenges');
            expect(res.status).toBe(401);
        });

        it('GET /api/challenges/leaderboard — public', async () => {
            const res = await request(API_URL).get('/api/challenges/leaderboard');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Security', () => {
        it('Admin /admin — login kerak', async () => {
            const res = await request(API_URL).get('/admin');
            expect([302, 403]).toContain(res.status);
        });

        it('CSRF token endpoint', async () => {
            const res = await request(API_URL).get('/api/csrf-token');
            expect(res.status).toBe(200);
            expect(res.body.csrfToken).toBeDefined();
        });
    });
});