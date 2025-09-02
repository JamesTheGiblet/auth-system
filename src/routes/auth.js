const express = require('express');
const {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors
} = require('../middleware/validators');

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.get('/verify-email', verifyEmail);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password', validateResetPassword, handleValidationErrors, resetPassword);
router.post('/logout', logout);

module.exports = router;