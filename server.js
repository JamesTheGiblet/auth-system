// server.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app'); // Import the configured app

const PORT = process.env.PORT || 3000;

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Auth system running on port ${PORT}`);
});