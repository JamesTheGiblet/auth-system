const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the real app
const User = require('../src/models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../src/utils/email');

describe('Auth API - /api/auth', () => {
  
  describe('POST /register', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully and send a verification email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Check response
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toContain('Registration successful');

      // Check database
      const user = await User.findOne({ email: validUserData.email });
      expect(user).not.toBeNull();
      expect(user.name).toBe(validUserData.name);
      expect(user.isVerified).toBe(false);

      // Check that password is not plain text
      expect(user.password).not.toBe(validUserData.password);

      // Check that email mock was called
      expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(sendVerificationEmail).toHaveBeenCalledWith(validUserData.email, expect.any(String));
    });

    it('should return 409 if email is already registered', async () => {
      // Pre-seed the database with a user
      await User.create(validUserData);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toContain('A user with this email already exists');
    });

    it('should return 400 for missing name', async () => {
      const { name, ...userData } = validUserData;
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].message).toBe('Name is required');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, email: 'not-an-email' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].message).toBe('Please include a valid email');
    });

    it('should return 400 for a password that is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, password: '123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].message).toBe('Password must be 8 or more characters');
    });
  });

  describe('POST /login', () => {
    const userData = {
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    };

    // beforeEach is used to set up a common state before each test in this block
    let verifiedUser;
    beforeEach(async () => {
      // Create a user and manually mark them as verified for login tests
      verifiedUser = await User.create({ ...userData, isVerified: true });
    });

    it('should log in a verified user successfully and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe(userData.email);

      // Check for the secure httpOnly cookie
      expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=.+; Max-Age=.+; Path=\/; HttpOnly; SameSite=Strict/);
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should return 401 for a non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nouser@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should return 403 if the user is not verified', async () => {
      // Create a new, unverified user for this specific test
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unverified@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Please verify your email before logging in.');
    });

    it('should return 400 for missing password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: userData.email });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].message).toBe('Password is required');
    });
  });

  describe('GET /verify-email', () => {
    const userData = {
      name: 'Verify User',
      email: 'verify@example.com',
      password: 'password123',
    };

    it('should verify a user with a valid token', async () => {
      // 1. Create a user and generate a token
      const user = new User(userData);
      const unhashedToken = user.createEmailVerificationToken();
      await user.save();

      // 2. Make the verification request
      const res = await request(app)
        .get(`/api/auth/verify-email?token=${unhashedToken}`);

      // 3. Assert the response is successful
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Email verified successfully. You can now log in.');

      // 4. Assert the user is updated in the database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeUndefined();
    });

    it('should return 400 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email?token=thisisnotavalidtoken');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Token is invalid or has expired.');
    });

    it('should return 400 for an expired token', async () => {
      // 1. Create a user and generate a token
      const user = new User(userData);
      const unhashedToken = user.createEmailVerificationToken();
      // 2. Manually expire the token
      user.emailVerificationExpires = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      await user.save();

      // 3. Make the verification request
      const res = await request(app)
        .get(`/api/auth/verify-email?token=${unhashedToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Token is invalid or has expired.');
    });
  });

  describe('POST /forgot-password', () => {
    const userData = {
      name: 'Forgot Pw User',
      email: 'forgot@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // Clear mocks before each test in this block
      sendPasswordResetEmail.mockClear();
      // Create a user for the tests
      await User.create({ ...userData, isVerified: true });
    });

    it('should send a password reset email if the user exists', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('a password reset link has been sent');

      // Check that the email mock was called
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(userData.email, expect.any(String));

      // Check that a reset token was set on the user
      const user = await User.findOne({ email: userData.email });
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
    });

    it('should return a generic success message even if the user does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('a password reset link has been sent');

      // Ensure no email was sent to prevent email enumeration
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].message).toBe('Please provide a valid email');
    });
  });

  describe('POST /reset-password', () => {
    const userData = {
      name: 'Reset Pw User',
      email: 'reset@example.com',
      password: 'oldPassword123',
    };
    const newPassword = 'newPassword456';

    it('should reset the password with a valid token', async () => {
      // 1. Create user and generate reset token
      const user = new User(userData);
      const unhashedToken = user.createPasswordResetToken();
      await user.save();

      // 2. Make the reset password request
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: unhashedToken, password: newPassword });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Password has been reset successfully.');

      // 3. Verify the password was changed by trying to log in
      const updatedUser = await User.findOne({ email: userData.email }).select('+password');
      const isMatch = await updatedUser.comparePassword(newPassword);
      expect(isMatch).toBe(true);

      // 4. Verify the reset token fields are cleared
      expect(updatedUser.passwordResetToken).toBeUndefined();
    });

    it('should return 400 for an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalidtoken', password: newPassword });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Token is invalid or has expired.');
    });

    it('should return 400 if the new password is too short', async () => {
      const user = new User(userData);
      const unhashedToken = user.createPasswordResetToken();
      await user.save();

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: unhashedToken, password: 'short' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].message).toBe('Password must be 8 or more characters');
    });
  });

  describe('POST /refresh-token', () => {
    const userData = {
      name: 'Refresh User',
      email: 'refresh@example.com',
      password: 'password123',
    };

    let refreshTokenCookie;

    beforeEach(async () => {
      // Create a verified user and log them in to get a valid refresh token cookie
      const user = await User.create({ ...userData, isVerified: true });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      refreshTokenCookie = loginRes.headers['set-cookie'];
    });

    it('should issue a new access token with a valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', refreshTokenCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.accessToken).not.toBeNull();
    });

    it('should return 401 if no refresh token is provided', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Refresh token not found. Please log in again.');
    });

    it('should return 403 for an invalid or expired refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', 'refreshToken=thisisafaketoken');

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Invalid or expired refresh token. Please log in again.');
    });

    it('should return 401 if the user associated with the token is deleted', async () => {
      // Delete the user after getting the token
      await User.deleteOne({ email: userData.email });

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', refreshTokenCookie);
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('User associated with this token no longer exists.');
    });
  });

  describe('POST /logout', () => {
    const userData = {
      name: 'Logout User',
      email: 'logout@example.com',
      password: 'password123',
    };

    it('should clear the refreshToken cookie on logout', async () => {
      // 1. Create a user and log in to get a valid cookie
      await User.create({ ...userData, isVerified: true });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      const refreshTokenCookie = loginRes.headers['set-cookie'];

      // 2. Call the logout endpoint
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', refreshTokenCookie);

      // 3. Assert the response is successful
      expect(logoutRes.statusCode).toEqual(200);
      expect(logoutRes.body.message).toBe('Logout successful');

      // 4. Assert the set-cookie header instructs the browser to clear the cookie
      expect(logoutRes.headers['set-cookie'][0]).toMatch(/refreshToken=;/);
      expect(logoutRes.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it('should return a success message even if no cookie is provided', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Logout successful');
    });
  });
});