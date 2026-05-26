const initials = localStorage.getItem("userInitials");

// ─── AUTH FETCH ───────────────────────────────────────────────────
// Esegue una fetch aggiungendo il token JWT nell'header Authorization.
// Se il server risponde 401 o 403 (token mancante o scaduto),
// rimuove il token dal localStorage e reindirizza al login.
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, options);

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.replace("/");
    return;
  }

  return res;
}

// ─── CONTATORE RISULTATI ──────────────────────────────────────────
// Aggiorna il numero di transazioni mostrate nell'header della lista.
function updateCount(n) {
  document.getElementById("results-count").textContent = n;
}

// ─── FETCH E RENDER TRANSAZIONI ───────────────────────────────────
// Recupera le transazioni dal server applicando i filtri passati come oggetto.
// Svuota la lista e la ripopola clonando il template HTML per ogni risultato.
// Per ogni riga registra anche il listener sul bottone elimina, che rimuove
// la transazione dal server e aggiorna il contatore senza ricaricare la pagina.
async function fetchTransactions(filters = {}) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams(filters);
  const res = await authFetch(`/transaction/list?${params.toString()}`, {
    headers: { Authorization: "Bearer " + token },
  });

  const data = await res.json();
  const list = document.getElementById("list");
  const template = document.getElementById("transaction-template");

  list.innerHTML = "";

  if (!res.ok) {
    list.innerHTML = `<p style="padding:16px;color:var(--db-muted)">Errore: ${data.message}</p>`;
    updateCount(0);
    return;
  }

  if (data.length === 0) {
    list.innerHTML = '<p style="padding:16px;color:var(--db-muted)">Nessuna transazione trovata.</p>';
    updateCount(0);
    return;
  }

  updateCount(data.length);

  data.forEach((t) => {
    const clone = template.content.cloneNode(true);
    const div = clone.querySelector(".transaction");

    div.classList.add(t.type);

    const d = new Date(t.date);
    div.querySelector(".day").textContent = d.getDate();
    div.querySelector(".month").textContent = d.toLocaleString("it-IT", { month: "short" });
    div.querySelector(".year").textContent = d.getFullYear();
    div.querySelector(".description").textContent = t.description;
    div.querySelector(".tx-type-label").textContent = t.type === "income" ? "Entrata" : "Uscita";
    div.querySelector(".category").textContent = t.category || "—";
    div.querySelector(".amount").textContent = `${t.type === "income" ? "+" : "−"}€${t.amount}`;
    div.querySelector(".icon-img").src = getIconPath(t.category);

    list.appendChild(clone);

    // Listener sul bottone elimina: chiede conferma, chiama il server
    // e rimuove la riga dal DOM decrementando il contatore.
    const insertedDiv = list.lastElementChild;
    insertedDiv.querySelector(".delete-btn").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Sei sicuro di voler eliminare questa transazione?")) return;

      try {
        const token = localStorage.getItem("token");
        const delRes = await authFetch(`/transaction/delete?id=${t.id}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token },
        });

        if (delRes.ok) {
          insertedDiv.remove();
          updateCount(Math.max(0, parseInt(document.getElementById("results-count").textContent, 10) - 1));
        } else {
          const err = await delRes.json();
          alert("Errore: " + err.message);
        }
      } catch (error) {
        console.error("Errore eliminazione:", error);
        alert("Errore di connessione");
      }
    });
  });
}

// Restituisce il percorso dell'icona corrispondente alla categoria.
// Se la categoria non è mappata usa un'icona generica di fallback.
function getIconPath(category) {
  const map = {
    Casa: "../assets/home.png",
    Cibo: "../assets/food.png",
    Entrate: "../assets/income.png",
    Benessere: "../assets/health.png",
    Shopping: "../assets/shopping.png",
    Cultura: "../assets/culture.png",
    Viaggi: "../assets/travel.png",
    Sport: "../assets/sports.png",
  };
  return map[category] || "https://cdn-icons-png.flaticon.com/512/565/565547.png";
}

// ─── FILTRI ───────────────────────────────────────────────────────
// Legge i valori correnti dei controlli di filtro (tipo, categoria, date)
// e restituisce un oggetto con solo i campi valorizzati, pronto per
// essere passato a fetchTransactions().
function getFilters() {
  const filters = {};
  if (selectedType) filters.type = selectedType;
  if (document.getElementById("filter-category").value)
    filters.category = document.getElementById("filter-category").value;
  if (document.getElementById("filter-start").value)
    filters.startDate = document.getElementById("filter-start").value;
  if (document.getElementById("filter-end").value)
    filters.endDate = document.getElementById("filter-end").value;
  return filters;
}

// ─── PILLOLE TIPO ─────────────────────────────────────────────────
// Gestisce la selezione del tipo (Tutti / Entrate / Uscite) tramite le pill.
// Aggiorna selectedType e ricarica le transazioni con i filtri correnti.
let selectedType = "";

document.querySelectorAll(".type-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".type-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    selectedType = pill.dataset.value;
    fetchTransactions(getFilters());
  });
});

// ─── FILTRI AUTOMATICI ────────────────────────────────────────────
// Ogni volta che l'utente cambia categoria o intervallo di date,
// ricarica automaticamente le transazioni con i filtri aggiornati.
document.getElementById("filter-category").addEventListener("change", () => fetchTransactions(getFilters()));
document.getElementById("filter-start").addEventListener("change",   () => fetchTransactions(getFilters()));
document.getElementById("filter-end").addEventListener("change",     () => fetchTransactions(getFilters()));

// ─── RESET FILTRI ─────────────────────────────────────────────────
// Riporta tutti i controlli allo stato iniziale (tipo "Tutti", nessuna
// categoria, nessuna data) e ricarica tutte le transazioni senza filtri.
document.getElementById("reset-filters").addEventListener("click", () => {
  document.querySelectorAll(".type-pill").forEach((p) => p.classList.remove("active"));
  document.querySelector(".type-pill.all").classList.add("active");
  selectedType = "";
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-start").value = "";
  document.getElementById("filter-end").value = "";
  fetchTransactions();
});

// ─── ORDINAMENTO CLIENT-SIDE ──────────────────────────────────────
// Ordina le righe già presenti nel DOM senza fare una nuova chiamata al server.
// Supporta quattro modalità: data crescente/decrescente e importo crescente/decrescente.
// Legge i valori direttamente dal testo delle celle per costruire i criteri di confronto.
document.getElementById("sort-select").addEventListener("change", (e) => {
  const val = e.target.value;
  const list = document.getElementById("list");
  const rows = [...list.querySelectorAll(".transaction")];

  rows.sort((a, b) => {
    const amountA = parseFloat(a.querySelector(".amount").textContent.replace(/[^0-9.]/g, ""));
    const amountB = parseFloat(b.querySelector(".amount").textContent.replace(/[^0-9.]/g, ""));
    const dateA = new Date(`${a.querySelector(".day").textContent} ${a.querySelector(".month").textContent} ${a.querySelector(".year").textContent}`);
    const dateB = new Date(`${b.querySelector(".day").textContent} ${b.querySelector(".month").textContent} ${b.querySelector(".year").textContent}`);

    if (val === "date-desc")   return dateB - dateA;
    if (val === "date-asc")    return dateA - dateB;
    if (val === "amount-desc") return amountB - amountA;
    if (val === "amount-asc")  return amountA - amountB;
    return 0;
  });

  rows.forEach((r) => list.appendChild(r));
});

// ─── INIT ─────────────────────────────────────────────────────────
// Se non c'è un token nel localStorage reindirizza subito al login.
// Altrimenti imposta le iniziali dell'avatar e carica tutte le transazioni.
if (!localStorage.getItem("token")) {
  window.location.replace("/");
}
document.getElementById("avatar").textContent = initials;
fetchTransactions();