const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');
const AppError = require('../utils/AppError');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if a user with the provided email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already registered.', 409));
    }

    // 2. Create a new user instance
    const user = new User({
      name: name,
      email: email,
      password: password
    });
    // 3. Generate verification token using your own implementation
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiry
    await user.save();

    // 4. Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account.'
      });
    } catch (emailError) {
      return next(new AppError('Email could not be sent. Please try again later.', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (requires a valid refresh token cookie)
exports.refreshToken = async (req, res, next) => {
  try {
    // 1. Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new AppError('Refresh token not found. Please log in again.', 401));
    }

    // 2. Verify the refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3. Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('User associated with this token no longer exists.', 401));
    }

    // 4. Generate a new access token
    const newAccessToken = generateAccessToken(user._id);

    // 5. Send the new access token
    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 403));
  }
};

// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email, explicitly including the password field
    const user = await User.findOne({ email }).select('+password');

    // 2. Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3. Check if user is verified
    if (!user.isVerified) {
      return next(new AppError('Please verify your email before logging in.', 403));
    }

    // 4. If everything is ok, generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 5. Send refresh token in a secure, httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 6. Send access token and user data in the response
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify user's email
// @route   GET /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    // 1. Get token from query string and hash it for comparison
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.query.token)
      .digest('hex');

    // 2. Find user by token and check if token is still valid (not expired)
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    // 3. If token is invalid or expired, send error
    if (!user) {
      return next(new AppError('Token is invalid or has expired.', 400));
    }

    // 4. If token is valid, update user, clear token fields, and save
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};