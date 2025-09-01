// src/utils/jwt.js
const jwt = require('jsonwebtoken');

const generateToken = (payload, secret, options = {}) => {
  return jwt.sign(payload, secret, {
    expiresIn: options.expiresIn || '15m',
    ...options
  });
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const generateAccessToken = (userId) => {
  return generateToken({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return generateToken({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};