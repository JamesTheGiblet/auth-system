const express = require('express');
const { register, verifyEmail, login, refreshToken } = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.get('/verify-email', verifyEmail);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/refresh-token', refreshToken);

module.exports = router;