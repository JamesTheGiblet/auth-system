const session = require('express-session');
const MongoStore = require('connect-mongo');

// A secure secret is required for sessions.
// Ensure SESSION_SECRET is set in your .env file.
if (!process.env.SESSION_SECRET) {
  // In a real application, you'd want to handle this more gracefully
  // or ensure your deployment process sets this variable.
  console.error('FATAL ERROR: SESSION_SECRET is not defined in the environment variables.');
  process.exit(1);
}

const sessionConfig = session({
  secret: process.env.SESSION_SECRET,
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create a session until something is stored
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions' // Optional: name of the collection to store sessions
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevents client-side JS from reading the cookie
    maxAge: 1000 * 60 * 60 * 24 // Cookie expires in 1 day
  }
});

module.exports = sessionConfig;