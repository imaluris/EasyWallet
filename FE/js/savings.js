const API = "/api";
const initials = localStorage.getItem("userInitials");


let goals = [];
let avgIncome = 0;
let avgExpense = 0;
let editingId = null;

// ── HELPERS ─────────────────────────────────────────────────────
const fmt = (v) =>
  "€ " +
  parseFloat(v).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function monthsToGoal(goal) {
  const monthlySaving = avgIncome - avgExpense;
  if (monthlySaving <= 0) return "∞";
  const remaining = goal.target - goal.saved;
  if (remaining <= 0) return "✓ Raggiunto";
  const months = Math.ceil(remaining / monthlySaving);
  return months + " mes" + (months === 1 ? "e" : "i");
}

function spendingThreshold(goal) {
  const monthlySaving = avgIncome - avgExpense;
  if (monthlySaving <= 0) return null; // non calcolabile
  const remaining = goal.target - goal.saved;
  if (remaining <= 0) return null; // già raggiunto
  const months = Math.ceil(remaining / monthlySaving);
  const neededPerMonth = remaining / months;
  const threshold = avgIncome - neededPerMonth;
  return threshold;
}

function pct(goal) {
  if (goal.target <= 0) return 0;
  return Math.min(100, Math.round((goal.saved / goal.target) * 100));
}

// ── RENDER ──────────────────────────────────────────────────────
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
    card.querySelector(".sv-card-meta").textContent =
      `Target: ${fmt(goal.target)}`;
    card.querySelector(".sv-saved-label").textContent =
      `${fmt(goal.saved)} risparmiati`;
    card.querySelector(".sv-pct-label").textContent = `${p}%`;
    card.querySelector(".sv-progress-fill").style.width = `${p}%`;
    card
      .querySelector(".sv-progress-fill")
      .classList.toggle("sv-progress-done", done);
    card.querySelector(".sv-forecast-value").textContent = monthsToGoal(goal);

    const threshold = spendingThreshold(goal);
    const thresholdEl = card.querySelector(".sv-threshold-value");
    if (threshold !== null) {
      thresholdEl.textContent = "Max spese: " + fmt(threshold) + "/mese";
    } else if (pct(goal) >= 100) {
      thresholdEl.textContent = "🏆 Obiettivo raggiunto!";
    } else {
      thresholdEl.textContent = "Risparmio mensile insufficiente";
    }

    if (done) {
      card.querySelector(".sv-card").classList.add("sv-card-done");
      card.querySelector(".sv-card-icon").textContent = "🏆";
    }

    card
      .querySelector(".sv-delete-btn")
      .addEventListener("click", () => deleteGoal(goal.id));
    card
      .querySelector(".sv-update-btn")
      .addEventListener("click", () => openUpdateModal(goal));

    grid.appendChild(card);
  });
}

function renderBanner() {
  const saving = avgIncome - avgExpense;
  document.getElementById("sv-avg-income").textContent = fmt(avgIncome);
  document.getElementById("sv-avg-expense").textContent = fmt(avgExpense);
  document.getElementById("sv-monthly-saving").textContent =
    (saving >= 0 ? "+" : "") + fmt(saving);
  document.getElementById("sv-monthly-saving").className =
    "sv-banner-value " + (saving >= 0 ? "income" : "expense");
}

// ── API CALLS ────────────────────────────────────────────────────
async function load() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/savings`, {
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

async function createGoal(name, target, saved) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/savings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, target }),
  });
  const goal = await res.json();
  if (!res.ok) throw new Error(goal.error);

  // Se l'utente ha già messo qualcosa, aggiorna subito
  if (parseFloat(saved) > 0) {
    await fetch(`${API}/savings/${goal.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ saved }),
    });
  }

  await load();
}

async function updateGoal(id, saved) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/savings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ saved }),
  });
  if (!res.ok) throw new Error("Errore aggiornamento");
  await load();
}

async function deleteGoal(id) {
  const token = localStorage.getItem("token");
  await fetch(`${API}/savings/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await load();
}

// ── MODAL NUOVO ──────────────────────────────────────────────────
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
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modal")) closeModal();
});

document.getElementById("m-submit").addEventListener("click", async () => {
  const name = document.getElementById("m-name").value.trim();
  const target = parseFloat(document.getElementById("m-target").value);
  const saved = parseFloat(document.getElementById("m-saved").value) || 0;
  const err = document.getElementById("m-error");

  if (!name) {
    err.textContent = "Inserisci un nome";
    return;
  }
  if (!target || target <= 0) {
    err.textContent = "Inserisci un target valido";
    return;
  }
  if (saved > target) {
    err.textContent = "Il risparmio non può superare il target";
    return;
  }

  try {
    await createGoal(name, target, saved);
    closeModal();
  } catch (e) {
    err.textContent = e.message;
  }
});

// ── MODAL AGGIORNA ───────────────────────────────────────────────
function openUpdateModal(goal) {
  editingId = goal.id;
  document.getElementById("um-title").textContent = `Aggiorna: ${goal.name}`;
  document.getElementById("um-saved").value = goal.saved;
  document.getElementById("um-error").textContent = "";
  document.getElementById("update-modal").style.display = "flex";
}
function closeUpdateModal() {
  document.getElementById("update-modal").style.display = "none";
  editingId = null;
}

document
  .getElementById("closeUpdateModal")
  .addEventListener("click", closeUpdateModal);
document.getElementById("update-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("update-modal")) closeUpdateModal();
});

document.getElementById("um-submit").addEventListener("click", async () => {
  const saved = parseFloat(document.getElementById("um-saved").value);
  const err = document.getElementById("um-error");
  if (isNaN(saved) || saved < 0) {
    err.textContent = "Valore non valido";
    return;
  }

  try {
    await updateGoal(editingId, saved);
    closeUpdateModal();
  } catch (e) {
    err.textContent = e.message;
  }
});

// ── INIT ─────────────────────────────────────────────────────────
document.getElementById("avatar").textContent = initials;
load();
