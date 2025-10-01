const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // <- qui importi il router
const app = express();
const port = 3000;

// Abilita CORS per permettere richieste dal front end
app.use(cors());

// Middleware per leggere JSON
app.use(express.json());

// Rotte di autenticazione
app.use('/auth', authRoutes);

app.listen(port, () => console.log(`Server in ascolto su http://localhost:${port}`));
