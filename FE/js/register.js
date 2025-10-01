const form = document.getElementById('registerForm');
const message = document.getElementById('message');

document.addEventListener("DOMContentLoaded", () => {
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");

  nextBtn.addEventListener("click", () => {
    step1.classList.remove("active");
    step2.classList.add("active");
  });

  backBtn.addEventListener("click", () => {
    step2.classList.remove("active");
    step1.classList.add("active");
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('submit intercettato!');

  const first_name = document.getElementById('first_name').value;
  const last_name = document.getElementById('last_name').value;
  const birth_date = document.getElementById('date').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  try {
    if (password !== confirmPassword) {
        alert("Le password non coincidono!");
        return false; // blocca il submit
    }
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, birth_date, phone, address, email, password, confirmPassword })
    });

    const data = await response.json();

    if (response.ok) {
      message.style.color = 'green';
      message.textContent = data.message;
      // Dopo 1 secondo reindirizza a index.html
      setTimeout(() => { window.location.href = '../index.html'; }, 1000);
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