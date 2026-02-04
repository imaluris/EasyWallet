const db = require('../db');

// Aggiungi una nuova transazione
exports.addTransaction = async (req, res) => {
    try {
        const userId = req.userId;
        const { type, description, amount, category, date } = req.body;

        // Validazione di base
        if (!type || !amount || !date) {
            return res.status(400).json({ message: "Campi obbligatori mancanti." });
        }

        // Query di inserimento
        const [result] = await db.execute(
            `INSERT INTO transaction (user_id, type, description, amount, category, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, type, description || null, amount, category || null, date]
        );

        // Ritorno la transazione appena creata
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

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, category, startDate, endDate } = req.query;

    let query = `SELECT * FROM transaction WHERE user_id = ?`;
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

exports.deleteTransaction = async (req, res) => {
    try {
        const userId = req.userId; // preso dal middleware
        const { id } = req.query;


        const [rows] = await db.execute(
            `DELETE FROM transaction
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

       res.status(200).json({
            message: 'Transazione eliminata'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore server" });
    }
};
