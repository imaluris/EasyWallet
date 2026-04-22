const db = require("../db");

exports.getMonthlySummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month e year obbligatori" });
    }

    const [rows] = await db.execute(
      `
      SELECT
        /* saldo totale (tutti i movimenti) */
        IFNULL(SUM(
          CASE
            WHEN type = 'income' THEN amount
            ELSE -amount
          END
        ), 0) AS balance,

        /* entrate del mese */
        IFNULL(SUM(
          CASE
            WHEN type = 'income'
             AND MONTH(date) = ?
             AND YEAR(date) = ?
            THEN amount
            ELSE 0
          END
        ), 0) AS totalIncome,

        /* uscite del mese */
        IFNULL(SUM(
          CASE
            WHEN type = 'expense'
             AND MONTH(date) = ?
             AND YEAR(date) = ?
            THEN amount
            ELSE 0
          END
        ), 0) AS totalExpense

      FROM transaction
      WHERE user_id = ?;
      `,
      [month, year, month, year, userId],
    );

    res.json({
      balance: rows[0].balance,
      income: rows[0].totalIncome,
      expense: rows[0].totalExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore server" });
  }
};

exports.getCategoryTotals = async (req, res) => {
  try {
    const userId = req.userId; // preso dal middleware auth
    const { month, year } = req.query;

    const [rows] = await db.execute(
      `SELECT category, 
       SUM(amount) AS total
      FROM transaction
      WHERE user_id = ?
      AND MONTH(date) = ?
      AND YEAR(date) = ?
      AND type = 'expense'
      GROUP BY category`,
      [userId, month, year],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore server" });
  }
};

exports.getIncomeAndExpenseMonthly = async (req, res) => {
  try {
    const userId = req.userId; // preso dal middleware auth
    const { month, year } = req.query;

    const [rows] = await db.execute(
      `SELECT 
        DAY(date) AS day,
        type,
        SUM(amount) AS total
      FROM transaction
      WHERE user_id = ?
        AND MONTH(date) = ?
        AND YEAR(date) = ?
      GROUP BY DAY(date), type
      ORDER BY DAY(date);`,
      [userId, month, year],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore server" });
  }
};

exports.getLastFiveTransactions = async (req, res) => {
  try {
    const userId = req.userId;

    let query = `SELECT * FROM transaction WHERE user_id = ? ORDER BY date DESC LIMIT 5 `;
    const params = [userId];

    const [rows] = await db.execute(query, params);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore nel recupero delle transazioni" });
  }
};
