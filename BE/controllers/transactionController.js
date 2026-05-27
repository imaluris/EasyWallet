// controllers/transactionController.js
// Gestisce le operazioni CRUD sulle transazioni dell'utente loggato.
// Ogni funzione legge userId da req.userId, impostato dal middleware JWT,
// garantendo che un utente possa accedere solo alle proprie transazioni.

const db = require('../db');

// ─── AGGIUNGI TRANSAZIONE ─────────────────────────────────────────
// Valida i campi obbligatori (type, amount, date) e inserisce la transazione
// nella tabella transaction. description e category sono opzionali:
// se non forniti vengono salvati come NULL.
// Restituisce la transazione appena creata con il suo id generato dal DB.
exports.addTransaction = async (req, res) => {
    try {
        const userId = req.userId;
        const { type, description, amount, category, date } = req.body;

        if (!type || !amount || !date) {
            return res.status(400).json({ message: "Campi obbligatori mancanti." });
        }

        const [result] = await db.execute(
            `INSERT INTO transaction (user_id, type, description, amount, category, date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, type, description || null, amount, category || null, date]
        );

        res.status(201).json({
            message: "Transazione aggiunta con successo",
            transaction: {
                id: result.insertId,
                user_id: userId,
                type,
                description,
                amount,
                category,
                date
            }
        });
    } catch (error) {
        console.error("Errore nell'aggiunta transazione:", error);
        res.status(500).json({ message: "Errore server." });
    }
};

// ─── RECUPERA TRANSAZIONI ─────────────────────────────────────────
// Costruisce dinamicamente la query SQL in base ai filtri passati come
// query params (type, category, startDate, endDate).
// Solo i filtri presenti vengono aggiunti alla clausola WHERE, così
// senza parametri restituisce tutte le transazioni dell'utente.
// I risultati sono ordinati per data decrescente (più recenti prima).
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, category, startDate, endDate } = req.query;

    let query  = `SELECT * FROM transaction WHERE user_id = ?`;
    const params = [userId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (startDate && endDate) {
      // Filtra per intervallo di date (estremi inclusi)
      query += ` AND date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC`;

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero delle transazioni' });
  }
};

// ─── ELIMINA TRANSAZIONE ──────────────────────────────────────────
// Elimina la transazione corrispondente all'id passato come query param.
// La condizione AND user_id = ? garantisce che un utente non possa
// eliminare transazioni di altri utenti anche conoscendo l'id.
exports.deleteTransaction = async (req, res) => {
    try {
        const userId = req.userId;
        const { id }  = req.query;

        await db.execute(
            `DELETE FROM transaction WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        res.status(200).json({ message: 'Transazione eliminata' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore server" });
    }
};
