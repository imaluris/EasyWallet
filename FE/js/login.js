const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(data);
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
