// controllers/userController.js
// Gestisce le operazioni sul profilo dell'utente loggato:
// lettura dati anagrafici, aggiornamento profilo, cambio password ed eliminazione account.
// Ogni funzione legge userId da req.userId, impostato dal middleware JWT.

const db = require('../db');

// ─── RECUPERA INFO UTENTE ─────────────────────────────────────────
// Recupera tutti i dati dell'utente loggato con una JOIN tra la tabella
// User (credenziali) e customer_data (anagrafica).
// Restituisce la prima riga trovata poiché ogni utente ha esattamente un record.
exports.getUserInfo = async (req, res) => {
    try {
        const userId = req.userId;

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

        res.json({ userInfo: rows[0] });
    } catch (error) {
        console.error("Errore nel recupero userInfo:", error);
        res.status(500).json({ message: "Errore server" });
    }
};

// ─── CAMBIO PASSWORD ──────────────────────────────────────────────
// Verifica prima che la password attuale fornita corrisponda a quella
// salvata nel DB. Solo se il controllo passa esegue l'UPDATE.
// Questo impedisce a chiunque abbia solo il token di cambiare la password
// senza conoscere quella corrente.
exports.updatePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        // 1. Recupera la password attuale dal DB
        const [users] = await db.execute(
            'SELECT password FROM user WHERE id = ?',
            [userId]
        );

        // 2. Verifica che la password attuale fornita sia corretta
        if (users[0].password !== currentPassword) {
            return res.status(401).json({ error: 'Password attuale non corretta' });
        }

        // 3. Aggiorna con la nuova password
        await db.execute(
            'UPDATE user SET password = ? WHERE id = ?',
            [newPassword, userId]
        );

        res.status(200).json({ message: 'Password modificata con successo' });
    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({ error: 'Errore del server' });
    }
};

// ─── AGGIORNA PROFILO ─────────────────────────────────────────────
// Aggiorna tutti i campi anagrafici nella tabella customer_data
// per l'utente loggato. Il campo user_id nella WHERE garantisce
// che ogni utente possa modificare solo il proprio profilo.
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { first_name, last_name, birth_date, address, city, cap, province, phone } = req.body;

        await db.execute(
            `UPDATE customer_data
             SET first_name = ?, last_name = ?, birth_date = ?, address = ?,
                 city = ?, cap = ?, province = ?, phone = ?
             WHERE user_id = ?`,
            [first_name, last_name, birth_date, address, city, cap, province, phone, userId]
        );

        res.status(200).json({ message: 'Profilo aggiornato con successo' });
    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({ error: 'Errore del server' });
    }
};

// ─── ELIMINA ACCOUNT ──────────────────────────────────────────────
// Elimina definitivamente il record dell'utente dalla tabella user.
// Le tabelle customer_data e transaction hanno una foreign key con
// CASCADE DELETE, quindi i dati correlati vengono rimossi automaticamente.
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.userId;

        await db.execute(
            `DELETE FROM user WHERE id = ?`,
            [userId]
        );

        res.status(200).json({ message: 'Profilo eliminato' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore server" });
    }
};
