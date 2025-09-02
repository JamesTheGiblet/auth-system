const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, updateUserRoles } = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateUpdateRoles, handleValidationErrors } = require('../middleware/validators');

// All routes in this file are protected and require admin role
router.use(authenticateToken, requireRole(['admin']));

// Placeholder for future admin routes
router.get('/', (req, res) => res.json({ message: 'Welcome to the admin area!' }));

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/roles', validateUpdateRoles, handleValidationErrors, updateUserRoles);

module.exports = router;