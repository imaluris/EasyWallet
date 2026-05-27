// controllers/authController.js
// Gestisce la registrazione e il login degli utenti.
// Al login restituisce un token JWT firmato con JWT_SECRET (letto da .env)
// che il frontend memorizza nel localStorage e allega ad ogni richiesta successiva.

const db  = require("../db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ─── LOGIN ────────────────────────────────────────────────────────
// Verifica che email e password siano presenti, poi cerca l'utente
// nella tabella User con una JOIN su customer_data per recuperare
// nome e cognome in un'unica query.
// Se le credenziali sono corrette genera un token JWT con scadenza di 1 ora
// e lo restituisce al client insieme ai dati base dell'utente.
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Dati mancanti" });
  }

  try {
    const [rows] = await db.query(
      `SELECT u.*, c.first_name, c.last_name
       FROM User u
       LEFT JOIN customer_data c ON c.user_id = u.id
       WHERE u.email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Email non valide" });
    }

    const user = rows[0];

    // Confronto password senza hash (bcrypt) per ora
    const isMatch = password === user.password;
    if (!isMatch) {
      return res.status(401).json({ message: "psw non valide" });
    }

    // Genera il token JWT con id ed email nel payload, scadenza 1 ora
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      message: "Login effettuato",
      token,
      user: {
        id:        user.id,
        email:     user.email,
        firstName: user.first_name,
        lastName:  user.last_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore server" });
  }
};

// ─── REGISTER ─────────────────────────────────────────────────────
// Valida tutti i campi obbligatori e verifica che le due password coincidano.
// L'inserimento avviene in due query distinte:
//   1. INSERT nella tabella User (email + password)
//   2. INSERT nella tabella Customer_Data con i dati anagrafici e la foreign key user_id
// In questo modo le credenziali di accesso e i dati anagrafici restano su tabelle separate.
exports.register = async (req, res) => {
  const {
    first_name, last_name, birth_date,
    address, city, cap, province, phone,
    email, password, confirmPassword,
  } = req.body;

  if (
    !first_name || !last_name || !birth_date ||
    !address    || !city      || !cap        ||
    !province   || !phone     || !email      ||
    !password   || !confirmPassword
  ) {
    return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Le password non coincidono" });
  }

  try {
    // 1. Inserisce le credenziali nella tabella User
    const [userResult] = await db.query(
      "INSERT INTO User (email, password) VALUES (?, ?)",
      [email, password], // ⚠️ da sostituire con hash in produzione
    );

    const userId = userResult.insertId;

    // 2. Inserisce i dati anagrafici in Customer_Data con la foreign key user_id
    await db.query(
      `INSERT INTO Customer_Data (user_id, first_name, last_name, birth_date, address, city, cap, province, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, first_name, last_name, birth_date, address, city, cap, province, phone],
    );

    res.status(201).json({ message: "Registrazione completata con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore durante la registrazione" });
  }
};
