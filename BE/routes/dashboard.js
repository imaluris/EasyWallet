// routes/dashboard.js
// Rotte per i dati aggregati della dashboard.
// Tutte le rotte sono protette: authenticateToken verifica il JWT
// prima di passare la richiesta al controller.

const express = require('express');
const {
  getMonthlySummary,
  getCategoryTotals,
  getLastFiveTransactions,
  getIncomeAndExpenseMonthly,
} = require('../controllers/dashboardController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── ROTTE DASHBOARD ─────────────────────────────────────────────
// GET /dashboard/summary                — saldo totale + entrate/uscite del mese corrente
// GET /dashboard/category-totals        — totale uscite raggruppate per categoria nel mese
// GET /dashboard/last-five              — ultime 5 transazioni registrate
// GET /dashboard/income-expense-monthly — totale entrate/uscite per ogni giorno del mese selezionato
router.get('/summary',                authenticateToken, getMonthlySummary);
router.get('/category-totals',        authenticateToken, getCategoryTotals);
router.get('/last-five',              authenticateToken, getLastFiveTransactions);
router.get('/income-expense-monthly', authenticateToken, getIncomeAndExpenseMonthly);

module.exports = router;
