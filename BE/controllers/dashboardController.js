// controllers/dashboardController.js
// Fornisce i dati aggregati per la dashboard: riepilogo mensile, totali per categoria,
// ultime transazioni e andamento giornaliero entrate/uscite.
// Tutte le funzioni filtrano per userId per isolare i dati del singolo utente.

const db = require("../db");

// ─── RIEPILOGO MENSILE ────────────────────────────────────────────
// Calcola in un'unica query tre valori distinti:
//   - balance:      saldo cumulativo su tutta la storia delle transazioni
//   - totalIncome:  somma delle entrate del mese/anno specificato
//   - totalExpense: somma delle uscite del mese/anno specificato
// Usa CASE WHEN all'interno di SUM per distinguere income da expense
// senza dover eseguire query separate. IFNULL gestisce il caso in cui
// non ci siano transazioni (restituisce 0 invece di NULL).
exports.getMonthlySummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month e year obbligatori" });
    }

    const [rows] = await db.execute(
      `SELECT
        /* saldo totale su tutti i movimenti storici */
        IFNULL(SUM(
          CASE WHEN type = 'income' THEN amount ELSE -amount END
        ), 0) AS balance,

        /* entrate del mese selezionato */
        IFNULL(SUM(
          CASE
            WHEN type = 'income' AND MONTH(date) = ? AND YEAR(date) = ?
            THEN amount ELSE 0
          END
        ), 0) AS totalIncome,

        /* uscite del mese selezionato */
        IFNULL(SUM(
          CASE
            WHEN type = 'expense' AND MONTH(date) = ? AND YEAR(date) = ?
            THEN amount ELSE 0
          END
        ), 0) AS totalExpense

      FROM transaction
      WHERE user_id = ?;`,
      [month, year, month, year, userId],
    );

    res.json({
      balance: rows[0].balance,
      income:  rows[0].totalIncome,
      expense: rows[0].totalExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore server" });
  }
};

// ─── TOTALI PER CATEGORIA ─────────────────────────────────────────
// Raggruppa le uscite del mese per categoria e ne somma gli importi.
// Viene usato dalla dashboard per costruire il grafico a ciambella.
// Restituisce solo le uscite (type = 'expense') del mese e anno richiesti.
exports.getCategoryTotals = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    const [rows] = await db.execute(
      `SELECT category, SUM(amount) AS total
       FROM transaction
       WHERE user_id = ?
         AND MONTH(date) = ?
         AND YEAR(date)  = ?
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

// ─── ANDAMENTO GIORNALIERO ────────────────────────────────────────
// Restituisce entrate e uscite aggregate per ogni singolo giorno del mese
// selezionato (filtro per month + year). Il nome "monthly" si riferisce
// al filtro applicato, non alla granularità: i dati tornano a livello
// giornaliero. GROUP BY DAY(date), type produce una riga per ogni
// combinazione giorno/tipo presente nel mese, usata dal grafico a linee.
exports.getIncomeAndExpenseMonthly = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    const [rows] = await db.execute(
      `SELECT
         DAY(date)      AS day,
         type,
         SUM(amount)    AS total
       FROM transaction
       WHERE user_id = ?
         AND MONTH(date) = ?
         AND YEAR(date)  = ?
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

// ─── ULTIME 5 TRANSAZIONI ─────────────────────────────────────────
// Recupera le 5 transazioni più recenti dell'utente ordinate per data
// decrescente. Viene usata dalla dashboard per la sezione "Movimenti recenti".
exports.getLastFiveTransactions = async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await db.execute(
      `SELECT * FROM transaction
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 5`,
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore nel recupero delle transazioni" });
  }
};
