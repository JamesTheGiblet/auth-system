const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const authRoutes = require('../src/routes/auth');
const globalErrorHandler = require('../src/controllers/errorController');
const { sendVerificationEmail } = require('../src/utils/email');
const cookieParser = require('cookie-parser');

// We need to create a minimal express app for testing
const app = express();
app.use(express.json());
app.use(cookieParser()); // Add cookie parser for testing cookie-based auth
app.use('/api/auth', authRoutes);
app.use(globalErrorHandler);

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
});