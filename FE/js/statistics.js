const initials = localStorage.getItem("userInitials");

// ─── AUTH FETCH ───────────────────────────────────────────────────
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

// ─── ULTIMI 12 MESI SCORREVOLI ────────────────────────────────
function buildRolling12() {
  const now = new Date();
  const labels = [];
  const keys = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("it-IT", { month: "short", year: "numeric" }));
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return { labels, keys };
}

const { labels: rollingLabels, keys: rollingKeys } = buildRolling12();

const incomeMap = new Map(rollingKeys.map((k) => [k, 0]));
const expenseMap = new Map(rollingKeys.map((k) => [k, 0]));
const balanceMap = new Map(rollingKeys.map((k) => [k, 0]));
const categoryMap = new Map();
let totalTransactions = 0;

// ─── FETCH TUTTE LE TRANSAZIONI + POPOLA MAPPE ───────────────
async function loadAllData() {
  const token = localStorage.getItem("token");
  const res = await authFetch("/transaction/list", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;

  data.forEach((t) => {
    const amount = Number(t.amount);
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    totalTransactions++;
    runningBalance += t.type === "income" ? amount : -amount;

    if (incomeMap.has(key)) {
      if (t.type === "income") {
        incomeMap.set(key, incomeMap.get(key) + amount);
      } else {
        expenseMap.set(key, expenseMap.get(key) + amount);
      }
      balanceMap.set(key, runningBalance);
    }

    if (t.type === "expense") {
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + amount);
    }
  });

  let lastBalance = 0;
  data.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key < rollingKeys[0]) {
      lastBalance += t.type === "income" ? Number(t.amount) : -Number(t.amount);
    }
  });

  rollingKeys.forEach((key) => {
    if (incomeMap.get(key) === 0 && expenseMap.get(key) === 0) {
      balanceMap.set(key, lastBalance);
    } else {
      lastBalance = balanceMap.get(key);
    }
  });
}

// ─── KPI MESE CORRENTE ────────────────────────────────────────
function buildKPI() {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  setEl("stat-income", `€ ${incomeMap.get(currentKey).toLocaleString("it-IT")}`);
  setEl("stat-expense", `€ ${expenseMap.get(currentKey).toLocaleString("it-IT")}`);
  setEl("stat-balance", `€ ${balanceMap.get(currentKey).toLocaleString("it-IT")}`);
  setEl("stat-count", totalTransactions);
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── OPZIONI GRAFICI CONDIVISE ────────────────────────────────
const sharedScales = {
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
};

const sharedTooltip = {
  backgroundColor: "#1a1a24",
  borderColor: "#2a2a3a",
  borderWidth: 1,
  titleColor: "#6b6a80",
  bodyColor: "#f0eff5",
  callbacks: { label: (ctx) => ` €${ctx.parsed.y.toLocaleString("it-IT")}` },
};

// ─── GRAFICO BARRE: entrate/uscite ───────────────────────────
function buildFirstChart() {
  new Chart(document.getElementById("firstChart"), {
    type: "bar",
    data: {
      labels: rollingLabels,
      datasets: [
        {
          label: "Entrate",
          data: rollingKeys.map((k) => incomeMap.get(k)),
          backgroundColor: "rgba(200,255,87,0.85)",
          borderWidth: 0,
          borderRadius: 6,
        },
        {
          label: "Uscite",
          data: rollingKeys.map((k) => expenseMap.get(k)),
          backgroundColor: "rgba(255,92,92,0.75)",
          borderWidth: 0,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false }, tooltip: sharedTooltip },
      scales: sharedScales,
    },
  });
}

// ─── GRAFICO LINEA: balance trend ────────────────────────────
function buildSecondChart() {
  new Chart(document.getElementById("secondChart"), {
    type: "line",
    data: {
      labels: rollingLabels,
      datasets: [
        {
          label: "Saldo",
          data: rollingKeys.map((k) => balanceMap.get(k)),
          borderColor: "#5c9fff",
          backgroundColor: "rgba(92,159,255,0.08)",
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#5c9fff",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: sharedTooltip },
      scales: sharedScales,
    },
  });
}

// ─── DONUT: uscite per categoria ─────────────────────────────
function buildCategoryChart() {
  const canvas = document.getElementById("categoryChart");
  if (!canvas || !categoryMap.size) return;

  const entries = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: entries.map(([k]) => k),
      datasets: [
        {
          data: entries.map(([, v]) => v),
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
          position: "right",
          labels: { color: "#6b6a80", font: { family: "DM Mono", size: 11 }, padding: 14, usePointStyle: true },
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
}

// ─── TOP USCITE ───────────────────────────────────────────────
function buildTopList() {
  const container = document.getElementById("top-list");
  if (!container || !categoryMap.size) return;

  const sorted = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0][1];

  sorted.forEach(([name, value]) => {
    const pct = Math.round((value / max) * 100);
    const item = document.createElement("div");
    item.className = "top-item";
    item.innerHTML = `
      <div class="top-icon"><img src="${getIconPath(name)}" alt="${name}"></div>
      <div class="top-info">
        <div class="top-name">${name}</div>
        <div class="top-bar-bg"><div class="top-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="top-amount">€ ${value.toLocaleString("it-IT")}</div>
    `;
    container.appendChild(item);
  });
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

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  if (!localStorage.getItem("token")) {
    window.location.replace("/");
    return;
  }

  document.getElementById("avatar").textContent = initials;

  await loadAllData();
  buildKPI();
  buildFirstChart();
  buildSecondChart();
  buildCategoryChart();
  buildTopList();
}

init();