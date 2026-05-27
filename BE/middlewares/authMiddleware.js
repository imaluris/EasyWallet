// middlewares/authMiddleware.js
// Middleware di autenticazione JWT applicato a tutte le rotte protette.
// Viene eseguito prima del controller e si occupa di verificare che
// la richiesta provenga da un utente autenticato con un token valido.

const jwt = require('jsonwebtoken');

// ─── VERIFICA TOKEN JWT ───────────────────────────────────────────
// Estrae il token dall'header Authorization nel formato "Bearer <token>".
// Restituisce 401 se il token è assente, 403 se non è valido o scaduto.
// Se la verifica ha successo, aggiunge userId e userEmail all'oggetto req
// così i controller successivi possono identificare l'utente senza fare
// ulteriori query al database.
module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ message: "Token mancante" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.id) {
            return res.status(403).json({ message: "Token valido ma senza id" });
        }

        // Aggiunge i dati dell'utente decodificati alla richiesta
        req.userId    = decoded.id;
        req.userEmail = decoded.email || null;

        next();
    } catch (err) {
        console.error("Errore verifica token:", err);
        return res.status(403).json({ message: "Token non valido o scaduto" });
    }
};
