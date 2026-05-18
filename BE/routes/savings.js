const express = require('express');
const router  = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const {getSavings, createSaving, updateSaving, deleteSaving}    = require('../controllers/savingsController');

router.get   ('/',    authenticateToken, getSavings);
router.post  ('/',    authenticateToken, createSaving);
router.patch ('/:id', authenticateToken, updateSaving);
router.delete('/:id', authenticateToken, deleteSaving);

module.exports = router;