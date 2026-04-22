const form    = document.getElementById('registerForm');
const message = document.getElementById('message');

document.addEventListener("DOMContentLoaded", () => {
  const step1        = document.getElementById("step1");
  const step2        = document.getElementById("step2");
  const nextBtn      = document.getElementById("nextBtn");
  const backBtn      = document.getElementById("backBtn");
  const indicator1   = document.getElementById("indicator-1");
  const indicator2   = document.getElementById("indicator-2");

  // ─── AVANTI ─────────────────────────────────────────────────
  nextBtn.addEventListener("click", () => {
    const email           = document.getElementById('email').value;
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!email || !password || !confirmPassword) {
      message.style.color = 'var(--db-accent2)';
      message.textContent = 'Compila tutti i campi.';
      return;
    }
    if (password !== confirmPassword) {
      message.style.color = 'var(--db-accent2)';
      message.textContent = 'Le password non coincidono!';
      return;
    }
    if (password.length < 8) {
      message.style.color = 'var(--db-accent2)';
      message.textContent = 'La password deve essere di almeno 8 caratteri.';
      return;
    }

    message.textContent = '';
    step1.classList.remove("active");
    step2.classList.add("active");
    indicator1.classList.remove("active");
    indicator2.classList.add("active");
  });

  // ─── INDIETRO ───────────────────────────────────────────────
  backBtn.addEventListener("click", () => {
    step2.classList.remove("active");
    step1.classList.add("active");
    indicator2.classList.remove("active");
    indicator1.classList.add("active");
  });
});

// ─── SUBMIT ───────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const first_name      = document.getElementById('first_name').value;
  const last_name       = document.getElementById('last_name').value;
  const birth_date      = document.getElementById('date').value;
  const phone           = document.getElementById('phone').value;
  const address         = document.getElementById('address').value;
  const city            = document.getElementById('city').value;
  const cap             = document.getElementById('cap').value;
  const province        = document.getElementById('province').value;
  const email           = document.getElementById('email').value;
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const message2        = document.getElementById('message2');

  try {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name, last_name, birth_date, phone,
        address, city, cap, province,
        email, password, confirmPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      // mostra modal successo
      document.getElementById('success-modal').classList.remove('hidden');
      // dopo 2 secondi vai al login
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 2000);
    } else {
      message2.style.color = 'var(--db-accent2)';
      message2.textContent = data.message;
    }

  } catch (err) {
    message2.style.color = 'var(--db-accent2)';
    message2.textContent = 'Errore di connessione al server';
    console.error(err);
  }
});