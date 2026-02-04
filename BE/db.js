// backend/db.js
const mysql = require('mysql2');

// Configura la connessione
const pool = mysql.createPool({
  host: 'localhost',      // indirizzo del DB
  user: 'root',           // utente DB
  password: 'Roland1993?',   // password DB
  database: 'EasyWalletDB' // nome del DB che hai creato
});

module.exports = pool.promise();
