// controllers/savingsController.js
// Gestisce le operazioni CRUD sugli obiettivi di risparmio (salvadanaio).
// Ogni funzione legge userId da req.userId per isolare i dati del singolo utente.

const db = require("../db");

// ─── RECUPERA OBIETTIVI + MEDIE MENSILI ───────────────────────────
// Restituisce due insiemi di dati in un'unica risposta:
//   - goals:      tutti gli obiettivi di risparmio dell'utente, ordinati per data creazione
//   - avgIncome / avgExpense: media mensile di entrate e uscite degli ultimi 6 mesi
// La media mensile viene calcolata con una subquery che prima raggruppa le
// transazioni per mese (monthly_income, monthly_expense), poi calcola
// la media sui mesi risultanti. Serve alla pagina salvadanaio per stimare
// in quanti mesi l'utente riuscirà a raggiungere un obiettivo.
exports.getSavings = async (req, res) => {
  const userId = req.userId;
  try {
    const [goals] = await db.query(
      "SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // Prendo le transazioni degli ultimi 6 mesi e calcolo le medie mensili in JS
    const [transactions] = await db.query(
      `SELECT type, amount, DATE_FORMAT(date, '%Y-%m') AS month
       FROM transaction
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`,
      [userId]
    );

    const monthlyTotals = {};
    transactions.forEach((t) => {
      if (!monthlyTotals[t.month]) {
        monthlyTotals[t.month] = { income: 0, expense: 0 };
      }
      if (t.type === "income") {
        monthlyTotals[t.month].income += parseFloat(t.amount);
      } else {
        monthlyTotals[t.month].expense += parseFloat(t.amount);
      }
    });

    const months = Object.keys(monthlyTotals);
    let totalIncome = 0;
    let totalExpense = 0;
    months.forEach((m) => {
      totalIncome += monthlyTotals[m].income;
      totalExpense += monthlyTotals[m].expense;
    });

    const avgIncome = months.length > 0 ? totalIncome / months.length : 0;
    const avgExpense = months.length > 0 ? totalExpense / months.length : 0;

    res.json({ goals, avgIncome, avgExpense });
  } catch (err) {
    console.error("SAVINGS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── CREA OBIETTIVO ───────────────────────────────────────────────
// Inserisce un nuovo obiettivo di risparmio con nome e importo target.
// Dopo l'INSERT recupera il record appena creato per restituirlo al client
// completo di id e timestamp generati dal database.
exports.createSaving = async (req, res) => {
  const userId = req.userId;
  const { name, target } = req.body;

  if (!name || !target)
    return res.status(400).json({ error: "name e target obbligatori" });

  try {
    const [result] = await db.query(
      "INSERT INTO savings_goals (user_id, name, target) VALUES (?, ?, ?)",
      [userId, name, parseFloat(target)]
    );
    res.status(201).json({ id: result.insertId, user_id: userId, name, target: parseFloat(target), saved: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── AGGIORNA IMPORTO ACCUMULATO ──────────────────────────────────
// Aggiorna il campo "saved" (importo accumulato finora) di un obiettivo.
// La condizione AND user_id = ? impedisce di modificare obiettivi altrui.
// Dopo l'UPDATE restituisce il record aggiornato al client.
exports.updateSaving = async (req, res) => {
  const userId = req.userId;
  const { id }   = req.query;
  const { saved } = req.body;

  if (saved === undefined)
    return res.status(400).json({ error: "saved obbligatorio" });

  try {
    await db.query(
      "UPDATE savings_goals SET saved = ? WHERE id = ? AND user_id = ?",
      [parseFloat(saved), id, userId],
    );
    const [rows] = await db.query(
      "SELECT * FROM savings_goals WHERE id = ?",
      [id],
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── ELIMINA OBIETTIVO ────────────────────────────────────────────
// Elimina l'obiettivo specificato da id.
// La condizione AND user_id = ? garantisce che ogni utente possa
// eliminare solo i propri obiettivi.
exports.deleteSaving = async (req, res) => {
  const userId = req.userId;
  const { id }   = req.query;

  try {
    await db.query(
      "DELETE FROM savings_goals WHERE id = ? AND user_id = ?",
      [id, userId],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
