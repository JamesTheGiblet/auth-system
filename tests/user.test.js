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

  describe('PUT /update-password', () => {
    const userData = {
      name: 'ChangePw User',
      email: 'changepw@example.com',
      password: 'oldPassword123',
    };
    const newPassword = 'newPassword456';
    let accessToken;

    beforeEach(async () => {
      // Create a user and log them in before each test in this block
      await User.create({ ...userData, isVerified: true });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      accessToken = loginRes.body.accessToken;
    });

    it('should update the password successfully with correct current password', async () => {
      const res = await request(app)
        .put('/api/users/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: userData.password, newPassword });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Password updated successfully.');

      // Verify by logging in with the new password
      const loginWithNewPwRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: newPassword });
      
      expect(loginWithNewPwRes.statusCode).toEqual(200);
    });

    it('should return 401 if the current password is incorrect', async () => {
      const res = await request(app)
        .put('/api/users/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Your current password is incorrect');
    });

    it('should return 400 if the new password is too short', async () => {
      const res = await request(app)
        .put('/api/users/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: userData.password, newPassword: 'short' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].message).toBe('New password must be 8 or more characters');
    });
  });

  describe('PUT /me', () => {
    const userData = {
      name: 'Update User',
      email: 'update@example.com',
      password: 'password123',
    };
    let accessToken;

    beforeEach(async () => {
      // Create a user and log them in before each test
      await User.create({ ...userData, isVerified: true });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      accessToken = loginRes.body.accessToken;
    });

    it('should update the user name successfully', async () => {
      const newName = 'Updated Name';
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: newName });

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.name).toBe(newName);
    });

    it('should update the user email successfully', async () => {
      const newEmail = 'new.update@example.com';
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: newEmail });

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.email).toBe(newEmail);
    });

    it('should return 409 if the new email is already taken', async () => {
      // Create a second user whose email we will try to take
      await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        isVerified: true,
      });

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'other@example.com' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('This email is already in use.');
    });
  });
});