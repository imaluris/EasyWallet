// routes/user.js
// Rotte per la gestione del profilo utente.
// Tutte le rotte sono protette: authenticateToken verifica il JWT
// prima di passare la richiesta al controller.

const express = require('express');
const { getUserInfo, updatePassword, updateProfile, deleteUser } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── ROTTE UTENTE ─────────────────────────────────────────────────
// GET    /user/userInfo       — recupera i dati anagrafici dell'utente loggato
// POST   /user/changePassword — aggiorna la password previa verifica di quella attuale
// POST   /user/updateProfile  — aggiorna i dati anagrafici (nome, indirizzo, ecc.)
// DELETE /user/deleteUser     — elimina definitivamente l'account dell'utente loggato
router.get   ('/userInfo',       authenticateToken, getUserInfo);
router.post  ('/changePassword', authenticateToken, updatePassword);
router.post  ('/updateProfile',  authenticateToken, updateProfile);
router.delete('/deleteUser',     authenticateToken, deleteUser);

module.exports = router;
