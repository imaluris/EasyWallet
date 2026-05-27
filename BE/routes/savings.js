// routes/savings.js
// Rotte REST per la gestione degli obiettivi di risparmio (salvadanaio).
// Tutte le rotte sono protette: authenticateToken verifica il JWT
// prima di passare la richiesta al controller.

const express = require('express');
const router  = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const { getSavings, createSaving, updateSaving, deleteSaving } = require('../controllers/savingsController');

// ─── ROTTE SALVADANAIO ────────────────────────────────────────────
// GET    /api/savings/        — recupera tutti gli obiettivi + medie mensili entrate/uscite
// POST   /api/savings/        — crea un nuovo obiettivo di risparmio
// POST   /api/savings/update  — aggiorna l'importo accumulato di un obiettivo (id via query param)
// DELETE /api/savings/delete  — elimina un obiettivo (id via query param)
router.get   ('/',       authenticateToken, getSavings);
router.post  ('/',       authenticateToken, createSaving);
router.post  ('/update', authenticateToken, updateSaving);
router.delete('/delete', authenticateToken, deleteSaving);

module.exports = router;
