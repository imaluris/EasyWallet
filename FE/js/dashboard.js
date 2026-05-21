const modal = document.getElementById("transactionModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const form = document.getElementById("quickForm");
const message = document.getElementById("message");
const initials = localStorage.getItem("userInitials");

let chartInstance = null;
let selectedType = null;

// ─── AUTH FETCH ───────────────────────────────────────────────────
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.replace("/");
    return;
  }

  return res;
}

// ─── SALDO / ENTRATE / USCITE ────────────────────────────────────
async function getBalance() {
  const now = new Date();
  const monthBE = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  try {
    const res = await authFetch(
      `/dashboard/summary?month=${monthBE}&year=${currentYear}`
    );
    const data = await res.json();

    if (res.ok) {
      const balanceEl = document.getElementById("balance");
      balanceEl.textContent = `€${Math.abs(data.balance)}`;
      balanceEl.classList.toggle("negative", data.balance < 0);
      document.getElementById("income").textContent = `€${Math.abs(data.income)}`;
      document.getElementById("expense").textContent = `€${Math.abs(data.expense)}`;
    } else {
      console.error(data.message);
    }
  } catch (err) {
    console.error("Errore connessione:", err);
  }
}

async function buildLineChart() {
  const canvas = document.getElementById("lineChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();

  const res = await authFetch(
    `/dashboard/income-expense-monthly?month=${month}&year=${year}`
  );
  const rows = await res.json();

  const incomeData = Array(daysInMonth).fill(0);
  const expenseData = Array(daysInMonth).fill(0);

  rows.forEach((row) => {
    if (row.type === "income") incomeData[row.day - 1] = parseFloat(row.total);
    if (row.type === "expense") expenseData[row.day - 1] = parseFloat(row.total);
  });

  const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Entrate",
          data: incomeData,
          borderColor: "#c8ff57",
          backgroundColor: "rgba(200,255,87,0.08)",
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Uscite",
          data: expenseData,
          borderColor: "#ff5c5c",
          backgroundColor: "rgba(255,92,92,0.06)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: { color: "#6b6a80", font: { family: "DM Mono", size: 12 }, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: "#1a1a24",
          borderColor: "#2a2a3a",
          borderWidth: 1,
          titleColor: "#6b6a80",
          bodyColor: "#f0eff5",
          callbacks: { label: (ctx) => ` €${ctx.parsed.y.toLocaleString("it-IT")}` },
        },
      },
      scales: {
        x: {
          grid: { color: "#2a2a3a", drawBorder: false },
          ticks: { color: "#6b6a80", font: { family: "DM Mono", size: 10 } },
        },
        y: {
          grid: { color: "#2a2a3a", drawBorder: false },
          ticks: {
            color: "#6b6a80",
            font: { family: "DM Mono", size: 10 },
            callback: (v) => `€${v.toLocaleString("it-IT")}`,
          },
        },
      },
    },
  });
}

// ─── GRAFICO DONUT CATEGORIE ──────────────────────────────────────
async function buildChart() {
  const now = new Date();
  const monthBE = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  try {
    const res = await authFetch(
      `/dashboard/category-totals?month=${monthBE}&year=${currentYear}`
    );
    const categories = await res.json();

    const labels = categories.map((c) => c.category);
    const values = categories.map((c) => Math.abs(c.total));

    const canvas = document.getElementById("myChart");
    const ctx = canvas.getContext("2d");

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            label: "Totale per categoria",
            data: values,
            backgroundColor: ["#c8ff57", "#ff5c5c", "#5c9fff", "#a855f7", "#f59e0b", "#10b981"],
            borderColor: "#111118",
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#6b6a80", font: { family: "DM Mono", size: 12 }, padding: 16, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: "#1a1a24",
            borderColor: "#2a2a3a",
            borderWidth: 1,
            titleColor: "#6b6a80",
            bodyColor: "#f0eff5",
            callbacks: { label: (ctx) => ` €${ctx.parsed.toLocaleString("it-IT")}` },
          },
        },
      },
    });
  } catch (err) {
    console.error("Errore nel caricamento del grafico:", err);
  }
}

// ─── ULTIME 5 TRANSAZIONI ─────────────────────────────────────────
async function fetchLastFiveTransactions() {
  try {
    const res = await authFetch(`/dashboard/last-five`);
    const data = await res.json();

    const list = document.getElementById("list");
    const template = document.getElementById("transaction-template");
    list.innerHTML = "";

    if (!res.ok || data.length === 0) return;

    data.forEach((t) => {
      const clone = template.content.cloneNode(true);
      const div = clone.querySelector(".transaction");
      div.classList.add(t.type);

      const d = new Date(t.date);
      div.querySelector(".day").textContent = d.getDate();
      div.querySelector(".month").textContent = d.toLocaleString("it-IT", { month: "long" });
      div.querySelector(".time").textContent = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      div.querySelector(".description").textContent = t.description;
      div.querySelector(".amount").textContent = `${t.type === "income" ? "+" : "−"}€${t.amount}`;
      div.querySelector(".tx-icon-img").src = getIconPath(t.category);

      list.appendChild(clone);
    });
  } catch (err) {
    console.error("Errore transazioni:", err);
  }
}

function getIconPath(category) {
  const map = {
    Casa: "../assets/home.png",
    cibo: "../assets/food.png",
    entrate: "../assets/income.png",
    Benessere: "../assets/health.png",
    shopping: "../assets/shopping.png",
    cultura: "../assets/culture.png",
    viaggi: "../assets/travel.png",
    sport: "../assets/sports.png",
  };
  return map[category] || "https://cdn-icons-png.flaticon.com/512/565/565547.png";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    type: document.getElementById("typeIncome").classList.contains("active") ? "income" : "expense",
    description: document.getElementById("quickDescription").value,
    amount: document.getElementById("quickAmount").value,
    category: document.getElementById("quickCategory").value,
    date: document.getElementById("quickDate").value,
  };

  try {
    const res = await authFetch("/transaction/addTransaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    message.style.color = res.ok ? "var(--accent)" : "var(--accent2)";
    message.textContent = data.message;
  } catch (err) {
    message.style.color = "var(--accent2)";
    message.textContent = "Errore di connessione al server";
    console.error(err);
  }

  form.reset();
  modal.style.display = "none";
});

// ─── TOGGLE INCOME/EXPENSE NEL MODAL ─────────────────────────────
document.getElementById("typeIncome").addEventListener("click", () => {
  selectedType = "income";
  document.getElementById("typeIncome").classList.toggle("active");
  if (document.getElementById("typeExpense").classList.contains("active")) {
    document.getElementById("typeExpense").classList.remove("active");
  }
});

document.getElementById("typeExpense").addEventListener("click", () => {
  selectedType = "expense";
  document.getElementById("typeExpense").classList.toggle("active");
  if (document.getElementById("typeIncome").classList.contains("active")) {
    document.getElementById("typeIncome").classList.remove("active");
  }
});

// ─── INIT ─────────────────────────────────────────────────────────
if (!localStorage.getItem("token")) {
  window.location.replace("/");
}

document.getElementById("avatar").textContent = initials;

getBalance();
buildLineChart();
buildChart();
fetchLastFiveTransactions();