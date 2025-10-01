// controllers/authController.js
const db = require('../db');

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Dati mancanti" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM User WHERE email = ? AND password = ?",
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    res.json({ message: "Login effettuato", user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore server" });
  }
};

// REGISTER
exports.register = async (req, res) => {
  const { first_name, last_name, birth_date, address, phone, email, password, confirmPassword } = req.body;

  if (!first_name || !last_name || !birth_date || !address || !phone || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Le password non coincidono" });
  }

  try {
    // 1. inserisci nella tabella User
    const [userResult] = await db.query(
      "INSERT INTO User (email, password) VALUES (?, ?)",
      [email, password]  // ⚠️ da sostituire con hash in produzione
    );

    const userId = userResult.insertId;

    // 2. inserisci nella tabella CustomerData con foreign key
    await db.query(
      `INSERT INTO Customer_Data (user_id, first_name, last_name, birth_date, address, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, first_name, last_name, birth_date, address, phone]
    );

    res.status(201).json({ message: "Registrazione completata con successo" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore durante la registrazione" });
  }
};

