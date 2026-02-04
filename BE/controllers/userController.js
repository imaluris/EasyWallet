const db = require('../db');


exports.getUserInfo = async (req, res) => {
    try {
        const userId = req.userId; // preso dal middleware di autenticazione


        const query = `
      SELECT *
      FROM user u
      JOIN customer_data c ON c.user_id = u.id
      WHERE u.id = ?;
    `;

        const [rows] = await db.execute(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        // Invi solo la prima riga (se l'utente è unico)
        res.json({ userInfo: rows[0] });

    } catch (error) {
        console.error("Errore nel recupero userInfo:", error);
        res.status(500).json({ message: "Errore server" });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.userId; // preso dal middleware
        const { currentPassword, newPassword } = req.body;

        // 1. Recupera la password attuale dell'utente
        const [users] = await db.execute(
            'SELECT password FROM user WHERE id = ?',
            [userId]
        );

        // 2. Verifica che la password attuale sia corretta
        if (users[0].password !== currentPassword) {
            return res.status(401).json({
                error: 'Password attuale non corretta'
            });
        }

        // 3. Aggiorna la password
        await db.execute(
            'UPDATE user SET password = ? WHERE id = ?',
            [newPassword, userId]
        );

        res.status(200).json({
            message: 'Password modificata con successo'
        });

    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({
            error: 'Errore del server'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId; // preso dal middleware
        const { first_name, last_name, birth_date, address, city, cap, province, phone } = req.body;

        //  Aggiorna i dati dell'user
        console.log("🟢 BODY:", req.body);
        console.log("🟢 userId:", req.userId);
        await db.execute(
            'UPDATE customer_data SET first_name = ?, last_name = ?, birth_date = ?, address = ?, city = ?, cap = ?, province = ?, phone = ? WHERE user_id = ?',
            [first_name, last_name, birth_date, address, city, cap, province, phone, userId]
        );

        res.status(200).json({
            message: 'Profilo aggiornato con successo'
        });

    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({
            error: 'Errore del server'
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.userId; // preso dal middleware

        const [rows] = await db.execute(
            `DELETE FROM user
             WHERE id = ?`,
            [userId]
        );

       res.status(200).json({
            message: 'Profilo eliminato'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore server" });
    }
};