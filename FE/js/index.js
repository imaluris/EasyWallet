/* // seleziona tutti i link del menu
const links = document.querySelectorAll('.menu a');
const mainContent = document.getElementById('main-content');

links.forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();           // previeni il comportamento di default
    const page = link.dataset.page; // prendi il file da caricare

    try {
      const response = await fetch(`/pages/${page}`);
      if (!response.ok) throw new Error('Pagina non trovata');
      const html = await response.text();
      mainContent.innerHTML = html;  // inserisce il contenuto nel div
    } catch (err) {
      mainContent.innerHTML = `<p>Errore nel caricamento della pagina.</p>`;
      console.error(err);
    }
  });
});

let currentPage = null; // 🔹 Tiene traccia della pagina corrente

async function loadPage(page) {
  try {
    // Evita di ricaricare la stessa pagina più volte
    if (currentPage === page) return;
    currentPage = page;

    const response = await fetch(`/pages/${page}`);
    if (!response.ok) throw new Error("Pagina non trovata");

    const html = await response.text();
    mainContent.innerHTML = html;

    // 🔹 Rimuove lo script della pagina precedente (se presente)
    const existingScript = document.querySelector(`[data-page-script]`);
    if (existingScript) existingScript.remove();

    // 🔹 Seleziona il file JS giusto
    let scriptPath = null;
    if (page === "dashboard.html") {
      scriptPath = "/js/dashboard.js";
    } else if (page === "transactions.html") {
      scriptPath = "/js/transactions.js";
    } else if (page === "statistics.html") {
      scriptPath = "/js/statistics.js";
    } else if (page === "profile.html") {
      scriptPath = "/js/profile.js";
    }

    // 🔹 Carica lo script solo se esiste
    if (scriptPath) {
      const script = document.createElement("script");
      script.src = scriptPath;
      script.dataset.pageScript = page; // utile per identificarlo e rimuoverlo
      document.body.appendChild(script);
    }

  } catch (err) {
    console.error(err);
    mainContent.innerHTML = `<p>Errore nel caricamento della pagina.</p>`;
  }
}


// 🔹 1️⃣ Carica la dashboard al primo avvio
document.addEventListener("DOMContentLoaded", () => {
  loadPage("dashboard.html");

  // 🔹 2️⃣ Aggancia gli eventi della navbar
  document.querySelectorAll(".navbar-item").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      loadPage(page);
    });
  });
});


 */