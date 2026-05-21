require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/user');
const savingsRoutes = require('./routes/savings');

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000","http://192.168.200.108:3000"];

const app = express();
const port = 3000;

// Abilita CORS a tutti per permettere l'accesso da qualsiasi origine (se necessario, posso restringerlo a specifici domini )
app.use(cors());

// Middleware per leggere JSON
app.use(express.json());

// Rotte di autenticazione
app.use('/auth', authRoutes);
app.use('/transaction', transactionRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/user', userRoutes);
app.use('/api/savings', savingsRoutes);

app.use(express.static('../FE'));



app.listen(port, '0.0.0.0', () => console.log(`Server in ascolto su http://192.168.200.108:${port}`));
