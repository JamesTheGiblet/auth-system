const express = require('express');
const router = express.Router();

// Placeholder for future admin routes
router.get('/', (req, res) => res.json({ message: 'Admin area' }));

module.exports = router;