# Auth System

**A production-ready, secure, and feature-complete authentication backend designed to accelerate your development process.**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue.svg?style=for-the-badge)

---

## The Problem

Building authentication is a critical but often repetitive and complex task. Developers frequently spend weeks implementing features like secure user registration, password hashing, token management, and email verification. It's easy to introduce security vulnerabilities, and this boilerplate work takes valuable time away from building the core features that make your application unique.

## The Solution

This project provides a **robust, secure, and drop-in solution** for user authentication. It handles the entire authentication lifecycle, from registration and secure login to password resets and email verification, allowing you to focus on your application's primary goals. By integrating this system, you get a production-ready auth layer built on modern best practices.

## Key Benefits

- **🚀 Accelerate Development:** Integrate a full authentication system in minutes, not weeks. Skip the boilerplate and get straight to building your app's core functionality.
- **🛡️ Enhance Security:** Built with security as a priority, featuring password hashing (bcrypt), secure JWTs with refresh tokens, rate limiting, CORS protection, and security headers via Helmet.js.
- **✅ Feature-Complete:** All the essential features are ready out-of-the-box, including registration, login, logout, email verification, and a secure password reset flow.
- **🧪 Fully Tested:** A comprehensive test suite using Jest and Supertest ensures the system is reliable, stable, and ready for production.

## Features

- 🔐 **JWT Authentication** - Secure, stateless authentication using JSON Web Tokens with a refresh token rotation strategy.
- 🛡️ **Security Features**:
  - Password hashing with bcrypt
  - Rate limiting to prevent brute-force attacks
  - CORS protection
  - Helmet.js for security headers
- 📧 **Email Verification** - Nodemailer integration for user verification and password reset emails.
- 🔒 **Password Management**:
  - Secure password reset functionality
  - Password strength validation on registration
- 🗄️ **MongoDB Integration** - Mongoose ODM for data modeling
- 🧪 **Testing** - Comprehensive test suite with Jest & Supertest.
- 📦 **Environment Configuration** - Easy configuration with dotenv

## Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (local or cloud instance)
- An SMTP server or email service (like Gmail, SendGrid, etc.) for email functionality.
- Git

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JamesTheGiblet/auth-system.git
   cd auth-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file:

   ```bash
   copy .env.example .env
   ```

   Edit the new `.env` file with your configuration:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/auth-system
   SESSION_SECRET=your-super-secret-and-long-random-string-for-sessions
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   
   # Email Credentials
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-email-password
   ```

4. **Start the application**

   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes

`POST /api/auth/register` - Register a new user.
`POST /api/auth/login` - Log in a user and receive tokens.
`POST /api/auth/logout` - Log out a user by clearing the refresh token cookie.
`POST /api/auth/refresh-token` - Get a new access token using a valid refresh token.
`GET /api/auth/verify-email` - Verify a user's email with a token from the query string (`?token=...`).
`POST /api/auth/forgot-password` - Request a password reset email.
`POST /api/auth/reset-password` - Reset a password using a token sent in the request body.

### User Routes

`GET /api/users/me` - Get the profile of the currently authenticated user.
`PUT /api/users/me` - Update the current user's profile (name, email).
`PUT /api/users/update-password` - Change the current user's password.

## Usage Examples

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### User login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### Get user profile (authenticated)

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer {your-access-token}"
```

## Testing

Run the complete test suite with:

```bash
npm test
```

## Project Structure

auth-system/
├── src/
│   ├── controllers/     # Route controllers
│   ├── models/         # MongoDB models
│   ├── middleware/     # Custom middleware
│   ├── utils/          # Utility functions
│   ├── routes/         # API routes
│   ├── config/         # Configuration files
│   └── app.js          # Express app setup
├── tests/              # Test files
├── .env.example        # Environment variables template
├── package.json
└── README.md

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | The port the server will run on. | No | `3000` |
| `MONGODB_URI` | Your MongoDB connection string. | Yes | - |
| `SESSION_SECRET` | A long, random string for securing sessions. | Yes | - |
| `JWT_SECRET` | Secret key for signing access tokens. | Yes | - |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens. | Yes | - |
| `FRONTEND_URL` | The URL of your frontend application for CORS. | Yes | `http://localhost:5173` |
| `EMAIL_HOST` | Hostname of your SMTP server. | No | - |
| `EMAIL_PORT` | Port of your SMTP server. | No | - |
| `EMAIL_USER` | Username for your SMTP server. | No | - |
| `EMAIL_PASS` | Password for your SMTP server. | No | - |
| `NODE_ENV` | The application environment. | No | `development` |

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **JWT Tokens**: Secure token-based authentication
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Input Validation**: Comprehensive request validation
- **Helmet.js**: Sets security-related HTTP headers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

If you have any questions or issues, please open an issue on GitHub or contact the maintainers.

## Acknowledgments

- Built with Express.js and MongoDB
- Uses JWT for authentication
- SendGrid for email services
- Jest for testing
