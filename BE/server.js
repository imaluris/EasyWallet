require('dotenv').config(); // ← aggiungi questa riga

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // <- qui importi il router
const transactionRoutes = require('./routes/transaction'); // 👈 aggiungi questo
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/user');

const allowedOrigins = ["http://192.168.1.111:8080", "http://localhost:8080"];

const app = express();
const port = 3000;

// Abilita CORS per permettere richieste dal front end

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Middleware per leggere JSON
app.use(express.json());

// Rotte di autenticazione
app.use('/auth', authRoutes);
app.use('/transaction', transactionRoutes); // 👈 registra anche questa
app.use('/dashboard', dashboardRoutes);
app.use('/user', userRoutes);



app.listen(port, '0.0.0.0', () => console.log(`Server in ascolto su http://192.168.1.111:${port}`));
