const express = require('express');
const { getMe, updatePassword } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateChangePassword, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// All routes below this are protected
router.use(authenticateToken);

router.get('/me', getMe);
router.put('/update-password', validateChangePassword, handleValidationErrors, updatePassword);

module.exports = router;