const express = require('express');
const { register, verifyEmail } = require('../controllers/authController');
const { validateRegister, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.get('/verify-email', verifyEmail);

module.exports = router;