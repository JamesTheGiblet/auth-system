const request = require('supertest');
const app = require('../app');
const User = require('../src/models/User');

describe('User API - /api/users', () => {
  describe('GET /me', () => {
    const userData = {
      name: 'Profile User',
      email: 'profile@example.com',
      password: 'password123',
    };

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Access token required');
    });

    it('should return the user profile if a valid token is provided', async () => {
      // 1. Create and verify a user
      await User.create({ ...userData, isVerified: true });

      // 2. Log the user in to get an access token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      const accessToken = loginRes.body.accessToken;

      // 3. Make a request to the protected route with the token
      const profileRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      // 4. Assert the response is successful and contains the user data
      expect(profileRes.statusCode).toEqual(200);
      expect(profileRes.body.user.name).toBe(userData.name);
      expect(profileRes.body.user.email).toBe(userData.email);
      expect(profileRes.body.user).not.toHaveProperty('password');
    });
  });
});