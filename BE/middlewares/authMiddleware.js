const jwt = require('jsonwebtoken');

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

        req.userId = decoded.id;
        req.userEmail = decoded.email || null;

        next();
    } catch (err) {
        console.error("Errore verifica token:", err);
        return res.status(403).json({ message: "Token non valido o scaduto" });
    }
};
