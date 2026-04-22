const express = require('express');
const { getMonthlySummary } = require('../controllers/dashboardController');
const { getCategoryTotals } = require('../controllers/dashboardController');
const { getLastFiveTransactions } = require('../controllers/dashboardController');
const { getIncomeAndExpenseMonthly } = require('../controllers/dashboardController');


const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/summary', authenticateToken, getMonthlySummary);
router.get('/category-totals', authenticateToken, getCategoryTotals);
router.get('/last-five', authenticateToken, getLastFiveTransactions);
router.get('/income-expense-monthly', authenticateToken, getIncomeAndExpenseMonthly);



module.exports = router;
