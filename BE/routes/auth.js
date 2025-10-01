// routes/auth.js
const express = require('express');
const { login } = require('../controllers/authController');
const { register } = require('../controllers/authController');


const router = express.Router();

// Rotta POST /auth/login
router.post('/login', login);

// Rotta POST /auth/register
router.post('/register', register);

module.exports = router;
