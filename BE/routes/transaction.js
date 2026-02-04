// routes/transaction.js
const express = require('express');
const { addTransaction, getTransactions, deleteTransaction } = require('../controllers/transactionController');
const authenticateToken = require('../middlewares/authMiddleware'); // il middleware JWT

const router = express.Router();

// Rotta POST
router.post('/addTransaction', authenticateToken, addTransaction);
router.get('/list', authenticateToken, getTransactions);
router.delete('/delete', authenticateToken, deleteTransaction);

module.exports = router;
