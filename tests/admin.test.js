const request = require('supertest');
const app = require('../app');
const User = require('../src/models/User');
const mongoose = require('mongoose');

describe('Admin API - /api/admin', () => {
  describe('GET /users', () => {
    const regularUserData = {
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      roles: ['user'],
      isVerified: true,
    };

    const adminUserData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      roles: ['admin'],
      isVerified: true,
    };

    let regularUserToken;
    let adminUserToken;

    beforeEach(async () => {
      // Create users
      await User.create([regularUserData, adminUserData]);

      // Log in regular user
      const regularLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: regularUserData.email, password: regularUserData.password });
      regularUserToken = regularLoginRes.body.accessToken;

      // Log in admin user
      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: adminUserData.email, password: adminUserData.password });
      adminUserToken = adminLoginRes.body.accessToken;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if a non-admin user tries to access', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Insufficient permissions');
    });

    it('should return the first page with default limit if no query params are provided', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.total).toBe(2);
      expect(res.body.count).toBe(2);
      expect(res.body.users).toBeInstanceOf(Array);
      expect(res.body.users.length).toBe(2);
      expect(res.body.pagination).toEqual({});
    });

    it('should return a paginated list of users when query params are provided', async () => {
      // Create more users to test pagination
      const moreUsers = Array.from({ length: 15 }, (_, i) => ({
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: 'password123',
        isVerified: true,
      }));
      await User.create(moreUsers);

      const res = await request(app)
        .get('/api/admin/users?page=2&limit=5')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.total).toBe(17); // 15 new + 2 from beforeEach
      expect(res.body.count).toBe(5);
      expect(res.body.pagination).toHaveProperty('next');
      expect(res.body.pagination).toHaveProperty('prev');
    });

    it('should filter users by a search query on name', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=Admin')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.total).toBe(1);
      expect(res.body.users[0].name).toBe('Admin User');
    });

    it('should filter users by a search query on email', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=user@example.com')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.total).toBe(1);
      expect(res.body.users[0].email).toBe('user@example.com');
    });

    it('should return an empty array if search query matches no users', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=nonexistent')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.total).toBe(0);
      expect(res.body.users.length).toBe(0);
    });
  });

  describe('DELETE /users/:id', () => {
    let regularUser;
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      // Create users
      [regularUser, adminUser] = await User.create([
        {
          name: 'Regular User to Delete',
          email: 'delete-user@example.com',
          password: 'password123',
          roles: ['user'],
          isVerified: true,
        },
        {
          name: 'Admin User Deleter',
          email: 'deleter-admin@example.com',
          password: 'password123',
          roles: ['admin'],
          isVerified: true,
        },
      ]);

      // Log in admin user
      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' });
      adminToken = adminLoginRes.body.accessToken;
    });

    it('should allow an admin to delete another user', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);

      // Verify the user is deleted from the database
      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 if trying to delete a non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('No user found with that ID');
    });

    it('should prevent an admin from deleting their own account', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('You cannot delete your own account.');
    });
  });

  describe('PUT /users/:id/roles', () => {
    let regularUser;
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      // Create users
      [regularUser, adminUser] = await User.create([
        {
          name: 'Regular User To Promote',
          email: 'promote-user@example.com',
          password: 'password123',
          roles: ['user'],
          isVerified: true,
        },
        {
          name: 'Admin User Updater',
          email: 'updater-admin@example.com',
          password: 'password123',
          roles: ['admin'],
          isVerified: true,
        },
      ]);

      // Log in admin user
      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' });
      adminToken = adminLoginRes.body.accessToken;
    });

    it("should allow an admin to update another user's roles", async () => {
      const newRoles = ['user', 'admin'];
      const res = await request(app)
        .put(`/api/admin/users/${regularUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: newRoles });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('User roles updated successfully.');
      expect(res.body.user.roles).toEqual(expect.arrayContaining(newRoles));
    });

    it('should prevent an admin from updating their own roles', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['user'] });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('You cannot change your own roles.');
    });

    it('should return 400 for invalid role values', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${regularUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['user', 'super-admin'] }); // 'super-admin' is not a valid role

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].message).toContain('Invalid role provided');
    });
  });
});