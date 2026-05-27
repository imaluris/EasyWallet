// server.js
// Punto di ingresso dell'applicazione Express.
// Configura i middleware globali, registra tutte le rotte API e avvia
// il server sulla porta 3000, rendendolo accessibile sia da localhost
// che da altri dispositivi sulla stessa rete locale.

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const authRoutes        = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const dashboardRoutes   = require('./routes/dashboard');
const userRoutes        = require('./routes/user');
const savingsRoutes     = require('./routes/savings');

const app  = express();
const port = 3000;

// ─── MIDDLEWARE GLOBALI ───────────────────────────────────────────
// cors() abilita le richieste cross-origin, necessario per il frontend
// servito da un'origine diversa durante lo sviluppo con Live Server.
// express.json() permette di leggere il body delle richieste in JSON.
app.use(cors());
app.use(express.json());

// ─── ROTTE API ────────────────────────────────────────────────────
// Ogni gruppo di rotte è montato su un prefisso dedicato.
// Il middleware authenticateToken è applicato sulle singole rotte
// nei file di routing per proteggere gli endpoint che richiedono autenticazione.
app.use('/auth',        authRoutes);
app.use('/transaction', transactionRoutes);
app.use('/dashboard',   dashboardRoutes);
app.use('/user',        userRoutes);
app.use('/api/savings', savingsRoutes);

// ─── FILE STATICI ─────────────────────────────────────────────────
// Serve i file del frontend (HTML, CSS, JS, assets) dalla cartella FE.
// Questo consente di accedere all'applicazione su http://localhost:3000
// senza dover avviare un server separato per il frontend.
app.use(express.static('../FE'));

// ─── AVVIO SERVER ─────────────────────────────────────────────────
// Il server ascolta su 0.0.0.0 per essere raggiungibile anche da altri
// dispositivi sulla stessa rete locale (es. smartphone o tablet).
// All'avvio rileva automaticamente l'IP locale della macchina e lo stampa
// in console insieme all'indirizzo localhost.
app.listen(port, '0.0.0.0', () => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    let localIP = 'localhost';
    for (const iface of Object.values(nets)) {
        for (const net of iface) {
            if (net.family === 'IPv4' && !net.internal) {
                localIP = net.address;
                break;
            }
        }
    }
    console.log(`Server in ascolto su http://localhost:${port}`);
    console.log(`Accesso da rete locale: http://${localIP}:${port}`);
});
