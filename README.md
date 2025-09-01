# Auth System

A modern authentication system built with Node.js, Express, and MongoDB, featuring JWT-based authentication with comprehensive security measures.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication system
- 🛡️ **Security Features**:
  - Password hashing with bcrypt
  - Rate limiting on login attempts
  - CORS protection
  - Helmet.js for security headers
- 📧 **Email Verification** - SendGrid integration for user verification
- 🔒 **Password Management**:
  - Secure password reset functionality
  - Password strength validation
- 🗄️ **MongoDB Integration** - Mongoose ODM for data modeling
- 🧪 **Testing** - Comprehensive test suite with Jest
- 📦 **Environment Configuration** - Easy configuration with dotenv

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- SendGrid account (for email functionality)
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
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/auth-system
   JWT_SECRET=your-super-secret-jwt-key
   SENDGRID_API_KEY=your-sendgrid-api-key
   FRONTEND_URL=http://localhost:3001
   NODE_ENV=development
   ```

4. **Start MongoDB** (if using local instance)
   ```bash
   # Using brew on macOS
   brew services start mongodb/brew/mongodb-community
   
   # Or using systemctl on Linux
   sudo systemctl start mongod
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### User Routes
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `DELETE /api/users/me` - Delete user account

## Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
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
  -H "Authorization: Bearer <your-jwt-token>"
```

## Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
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
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `SENDGRID_API_KEY` | SendGrid API key for emails | No | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:3001 |
| `NODE_ENV` | Environment mode | No | development |

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
