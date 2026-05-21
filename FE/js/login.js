// ─── RIFERIMENTI DOM ──────────────────────────────────────────────
const form    = document.getElementById("loginForm");
const message = document.getElementById("message"); // messaggio di esito login

// ─── SUBMIT LOGIN ─────────────────────────────────────────────────
// Invia email e password al server. In caso di successo salva il token JWT
// e le iniziali dell'utente nel localStorage, mostra un messaggio di benvenuto
// e reindirizza alla dashboard dopo 1 secondo.
// In caso di errore mostra il messaggio restituito dal server inline.
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Salva il token per le chiamate autenticate e le iniziali per l'avatar
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "userInitials",
        `${data.user.firstName[0]}${data.user.lastName[0]}`.toUpperCase(),
      );
      message.style.color = "var(--db-accent)";
      message.textContent = `Benvenuto ${data.user.email}!`;
      setTimeout(() => {
        window.location.href = "pages/dashboard.html";
      }, 1000);
    } else {
      message.style.color = "var(--db-accent2)";
      message.textContent = data.message;
    }
  } catch (err) {
    message.style.color = "var(--db-accent2)";
    message.textContent = "Errore di connessione al server";
    console.error(err);
  }
});