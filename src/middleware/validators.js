const { check, validationResult } = require('express-validator');

exports.validateRegister = [
  check('name', 'Name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be 8 or more characters').isLength({ min: 8 })
];

exports.validateLogin = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists()
];

exports.validateForgotPassword = [
  check('email', 'Please provide a valid email').isEmail().normalizeEmail()
];

exports.validateResetPassword = [
  // We check for the token in the body, assuming it's sent from a form.
  check('token', 'Reset token is required').not().isEmpty(),
  check('password', 'Password must be 8 or more characters').isLength({ min: 8 })
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};