const API = "/api";
const initials = localStorage.getItem("userInitials");

// ─── STATO GLOBALE ────────────────────────────────────────────────
let goals = [];      // array degli obiettivi di risparmio caricati dal server
let avgIncome = 0;   // media mensile delle entrate degli ultimi mesi
let avgExpense = 0;  // media mensile delle uscite degli ultimi mesi
let editingId = null; // id dell'obiettivo in fase di aggiornamento nel modal

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

// ─── HELPERS ──────────────────────────────────────────────────────
// Formatta un numero come valuta in euro con 2 decimali (es. "€ 1.250,00").
function fmt(amount) {
  return "€ " + parseFloat(amount).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Calcola i mesi stimati per raggiungere l'obiettivo in base al risparmio
// mensile medio (avgIncome - avgExpense). Restituisce "∞" se non si sta
// risparmiando, "✓ Raggiunto" se l'obiettivo è già stato centrato.
function monthsToGoal(goal) {
  const risparmioMensile = avgIncome - avgExpense;
  if (risparmioMensile <= 0) return "∞";
  const rimanente = goal.target - goal.saved;
  if (rimanente <= 0) return "Raggiunto";
  const mesi = Math.ceil(rimanente / risparmioMensile);
  if (mesi === 1) return "1 mese";
  return mesi + " mesi";
}

// Calcola la percentuale di completamento dell'obiettivo (0-100).
function pct(goal) {
  if (goal.target <= 0) return 0;
  const percentuale = Math.round((goal.saved / goal.target) * 100);
  if (percentuale > 100) return 100;
  return percentuale;
}

// ─── RENDER CARDS ─────────────────────────────────────────────────
// Svuota la griglia e ricrea tutte le card degli obiettivi dal template HTML.
// Per ogni obiettivo popola nome, target, progresso, previsione e soglia di spesa.
// Se non ci sono obiettivi mostra lo stato vuoto con il bottone per crearne uno.
function render() {
  const grid = document.getElementById("sv-grid");
  const empty = document.getElementById("sv-empty");
  grid.innerHTML = "";

  if (goals.length === 0) {
    empty.style.display = "flex";
    return;
  }
  empty.style.display = "none";

  const tmpl = document.getElementById("sv-card-template");

  goals.forEach((goal) => {
    const card = tmpl.content.cloneNode(true);
    const p = pct(goal);
    const done = p >= 100;

    card.querySelector(".sv-card-name").textContent = goal.name;
    card.querySelector(".sv-card-meta").textContent = `Target: ${fmt(goal.target)}`;
    card.querySelector(".sv-saved-label").textContent = `${fmt(goal.saved)} risparmiati`;
    card.querySelector(".sv-pct-label").textContent = `${p}%`;
    card.querySelector(".sv-progress-fill").style.width = `${p}%`;
    card.querySelector(".sv-progress-fill").classList.toggle("sv-progress-done", done);
    card.querySelector(".sv-forecast-value").textContent = monthsToGoal(goal);

    const thresholdEl = card.querySelector(".sv-threshold-value");
    if (p >= 100) {
      thresholdEl.textContent = "🏆 Obiettivo raggiunto!";
    } else if (avgIncome - avgExpense <= 0) {
      thresholdEl.textContent = "Risparmio mensile insufficiente";
    } else {
      const rimanente = goal.target - goal.saved;
      const mesi = Math.ceil(rimanente / (avgIncome - avgExpense));
      const maxSpese = avgIncome - (rimanente / mesi);
      thresholdEl.textContent = "Max spese: " + fmt(maxSpese) + "/mese";
    }

    if (done) {
      card.querySelector(".sv-card").classList.add("sv-card-done");
      card.querySelector(".sv-card-icon").textContent = "🏆";
    }

    card.querySelector(".sv-delete-btn").addEventListener("click", () => deleteGoal(goal.id));
    card.querySelector(".sv-update-btn").addEventListener("click", () => openUpdateModal(goal));

    grid.appendChild(card);
  });
}

// Aggiorna il banner in cima alla pagina con le medie mensili di entrate,
// uscite e risparmio netto. Colora il risparmio di verde o rosso
// in base al segno.
function renderBanner() {
  const saving = avgIncome - avgExpense;
  document.getElementById("sv-avg-income").textContent = fmt(avgIncome);
  document.getElementById("sv-avg-expense").textContent = fmt(avgExpense);
  document.getElementById("sv-monthly-saving").textContent = (saving >= 0 ? "+" : "") + fmt(saving);
  document.getElementById("sv-monthly-saving").className = "sv-banner-value " + (saving >= 0 ? "income" : "expense");
}

// ─── CHIAMATE API ─────────────────────────────────────────────────
// Carica dal server tutti gli obiettivi e le medie mensili,
// aggiorna lo stato globale e ridisegna banner e griglia.
async function load() {
  try {
    const token = localStorage.getItem("token");
    const res = await authFetch(`${API}/savings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    goals = data.goals;
    avgIncome = data.avgIncome;
    avgExpense = data.avgExpense;
    renderBanner();
    render();
  } catch {
    console.error("Errore nel caricamento");
  }
}

// Crea un nuovo obiettivo sul server con nome e target.
// Se l'utente ha già inserito un importo iniziale salvato,
// esegue subito dopo anche una PATCH per aggiornarlo.
// Al termine ricarica tutti i dati con load().
async function createGoal(name, target, saved) {
  const token = localStorage.getItem("token");
  const res = await authFetch(`${API}/savings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, target }),
  });
  const goal = await res.json();
  if (!res.ok) throw new Error(goal.error);

  if (parseFloat(saved) > 0) {
    await authFetch(`${API}/savings/update?id=${goal.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ saved }),
    });
  }

  await load();
}

// Aggiorna l'importo salvato di un obiettivo esistente tramite PATCH,
// poi ricarica tutti i dati con load().
async function updateGoal(id, saved) {
  const token = localStorage.getItem("token");
  const res = await authFetch(`${API}/savings/update?id=${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ saved }),
  });
  if (!res.ok) throw new Error("Errore aggiornamento");
  await load();
}

// Elimina un obiettivo dal server tramite DELETE e ricarica i dati.
async function deleteGoal(id) {
  const token = localStorage.getItem("token");
  await authFetch(`${API}/savings/delete?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await load();
}

// ─── MODAL NUOVO OBIETTIVO ────────────────────────────────────────
// Apre il modal di creazione e chiude resettando tutti i campi e gli errori.
function openModal() {
  document.getElementById("modal").style.display = "flex";
}
function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("m-name").value = "";
  document.getElementById("m-target").value = "";
  document.getElementById("m-saved").value = "";
  document.getElementById("m-error").textContent = "";
}

document.getElementById("openModal").addEventListener("click", openModal);
document.getElementById("openModalEmpty").addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
// Chiude il modal cliccando sull'overlay esterno
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modal")) closeModal();
});

// Valida i campi del form (nome, target, saved) e chiama createGoal().
// Mostra eventuali errori di validazione inline senza bloccare la pagina.
document.getElementById("m-submit").addEventListener("click", async () => {
  const name = document.getElementById("m-name").value.trim();
  const target = parseFloat(document.getElementById("m-target").value);
  const saved = parseFloat(document.getElementById("m-saved").value) || 0;
  const err = document.getElementById("m-error");

  if (!name) { err.textContent = "Inserisci un nome"; return; }
  if (!target || target <= 0) { err.textContent = "Inserisci un target valido"; return; }
  if (saved > target) { err.textContent = "Il risparmio non può superare il target"; return; }

  try {
    await createGoal(name, target, saved);
    closeModal();
  } catch (e) {
    err.textContent = e.message;
  }
});

// ─── MODAL AGGIORNA OBIETTIVO ─────────────────────────────────────
// Apre il modal di aggiornamento pre-compilando il campo con il valore
// attualmente salvato e memorizzando l'id dell'obiettivo in editingId.
function openUpdateModal(goal) {
  editingId = goal.id;
  document.getElementById("um-title").textContent = `Aggiorna: ${goal.name}`;
  document.getElementById("um-saved").value = goal.saved;
  document.getElementById("um-error").textContent = "";
  document.getElementById("update-modal").style.display = "flex";
}

// Chiude il modal di aggiornamento e resetta editingId.
function closeUpdateModal() {
  document.getElementById("update-modal").style.display = "none";
  editingId = null;
}

document.getElementById("closeUpdateModal").addEventListener("click", closeUpdateModal);
// Chiude il modal cliccando sull'overlay esterno
document.getElementById("update-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("update-modal")) closeUpdateModal();
});

// Valida il nuovo valore salvato e chiama updateGoal() con l'id memorizzato.
document.getElementById("um-submit").addEventListener("click", async () => {
  const saved = parseFloat(document.getElementById("um-saved").value);
  const err = document.getElementById("um-error");
  if (isNaN(saved) || saved < 0) { err.textContent = "Valore non valido"; return; }

  try {
    await updateGoal(editingId, saved);
    closeUpdateModal();
  } catch (e) {
    err.textContent = e.message;
  }
});

// ─── INIT ─────────────────────────────────────────────────────────
// Se non c'è un token nel localStorage reindirizza subito al login.
// Altrimenti imposta le iniziali dell'avatar e carica i dati della pagina.
if (!localStorage.getItem("token")) {
    window.location.replace("/");
}

document.getElementById("avatar").textContent = initials;
load();