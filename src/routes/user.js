const express = require('express');
const { getMe, updatePassword, updateMe } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateChangePassword, validateUpdateProfile, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// All routes below this are protected
router.use(authenticateToken);

router.get('/me', getMe);
router.put('/me', validateUpdateProfile, handleValidationErrors, updateMe);
router.put('/update-password', validateChangePassword, handleValidationErrors, updatePassword);

module.exports = router;