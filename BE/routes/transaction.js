// routes/transaction.js
// Rotte per la gestione delle transazioni.
// Tutte le rotte sono protette: authenticateToken verifica il JWT
// prima di passare la richiesta al controller.

const express = require('express');
const { addTransaction, getTransactions, deleteTransaction } = require('../controllers/transactionController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── ROTTE TRANSAZIONI ────────────────────────────────────────────
// POST   /transaction/addTransaction — inserisce una nuova transazione
// GET    /transaction/list           — recupera le transazioni con filtri opzionali (tipo, categoria, date)
// DELETE /transaction/delete         — elimina una transazione tramite id passato come query param
router.post  ('/addTransaction', authenticateToken, addTransaction);
router.get   ('/list',           authenticateToken, getTransactions);
router.delete('/delete',         authenticateToken, deleteTransaction);

module.exports = router;
