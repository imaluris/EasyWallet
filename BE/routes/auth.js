// routes/auth.js
// Rotte pubbliche per l'autenticazione: non richiedono token JWT.
// Sono gli unici due endpoint accessibili senza essere loggati.

const express = require('express');
const { login, register } = require('../controllers/authController');

const router = express.Router();

// ─── ROTTE AUTENTICAZIONE ─────────────────────────────────────────
// POST /auth/login    — verifica le credenziali e restituisce un token JWT
// POST /auth/register — crea un nuovo utente con i relativi dati anagrafici
router.post('/login',    login);
router.post('/register', register);

module.exports = router;
