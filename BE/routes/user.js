// routes/user.js
const express = require('express');
const { getUserInfo, updatePassword, updateProfile, deleteUser } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware'); // il middleware JWT

const router = express.Router();


router.get('/userInfo', authenticateToken, getUserInfo);
router.post('/changePassword', authenticateToken, updatePassword)
router.post('/updateProfile', authenticateToken, updateProfile)
router.delete('/deleteUser', authenticateToken, deleteUser)



module.exports = router;