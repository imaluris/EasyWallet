const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://192.168.1.111:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Salva il token JWT in localStorage
      localStorage.setItem('token', data.token);
      message.style.color = 'green';
      message.textContent = `Login effettuato! Benvenuto ${data.user.email}`;

      // Dopo 1 secondo reindirizza a index.html
      setTimeout(() => { window.location.href = '../pages/dashboard.html'; }, 1000);
    } else {
      message.style.color = 'red';
      message.textContent = data.message;
    }

  } catch (err) {
    message.style.color = 'red';
    message.textContent = 'Errore di connessione al server';
    console.error(err);
  }
});
