const db = require("../db");

// GET tutti i savings dell'utente + media mensile entrate/uscite
exports.getSavings = async (req, res) => {
  const userId = req.userId;
  try {
    const [goals] = await db.query(
      "SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    // Media mensile: prendo entrate e uscite degli ultimi 6 mesi
    const [stats] = await db.query(
      `
      SELECT 
        AVG(monthly_income)  AS avg_income,
        AVG(monthly_expense) AS avg_expense
      FROM (
        SELECT
          DATE_FORMAT(date, '%Y-%m')          AS month,
          SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS monthly_income,
          SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS monthly_expense
        FROM transaction
        WHERE user_id = ?
          AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(date, '%Y-%m')
      ) AS monthly
    `,
      [userId],
    );

    res.json({
      goals,
      avgIncome: parseFloat(stats[0].avg_income || 0),
      avgExpense: parseFloat(stats[0].avg_expense || 0),
    });
  } catch (err) {
    console.error("SAVINGS ERROR:", err); // aggiungi questa riga

    res.status(500).json({ error: err.message });
  }
};

// POST crea nuovo goal
exports.createSaving = async (req, res) => {
  const userId = req.userId;
  const { name, target } = req.body;
  if (!name || !target)
    return res.status(400).json({ error: "name e target obbligatori" });
  try {
    const [result] = await db.query(
      "INSERT INTO savings_goals (user_id, name, target) VALUES (?, ?, ?)",
      [userId, name, parseFloat(target)],
    );
    const [rows] = await db.query("SELECT * FROM savings_goals WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH aggiorna importo accumulato
exports.updateSaving = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { saved } = req.body;
  if (saved === undefined)
    return res.status(400).json({ error: "saved obbligatorio" });
  try {
    await db.query(
      "UPDATE savings_goals SET saved = ? WHERE id = ? AND user_id = ?",
      [parseFloat(saved), id, userId],
    );
    const [rows] = await db.query("SELECT * FROM savings_goals WHERE id = ?", [
      id,
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE elimina goal
exports.deleteSaving = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    await db.query("DELETE FROM savings_goals WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
