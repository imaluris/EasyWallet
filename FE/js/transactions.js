const token = localStorage.getItem("token");
const initials = localStorage.getItem("userInitials");

// ─── CONTATORE RISULTATI ───────────────────────────────────────
function updateCount(n) {
  document.getElementById("results-count").textContent = n;
}

// ─── FETCH + RENDER TRANSAZIONI ───────────────────────────────
async function fetchTransactions(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(
    `http://localhost:3000/transaction/list?${params.toString()}`,
    {
      headers: { Authorization: "Bearer " + token },
    },
  );

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
    list.innerHTML =
      '<p style="padding:16px;color:var(--db-muted)">Nessuna transazione trovata.</p>';
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
    div.querySelector(".month").textContent = d.toLocaleString("it-IT", {
      month: "short",
    });
    div.querySelector(".year").textContent = d.getFullYear();
    div.querySelector(".description").textContent = t.description;
    div.querySelector(".tx-type-label").textContent =
      t.type === "income" ? "Entrata" : "Uscita";
    div.querySelector(".category").textContent = t.category || "—";
    div.querySelector(".amount").textContent =
      `${t.type === "income" ? "+" : "−"}€${t.amount}`;
    div.querySelector(".icon-img").src = getIconPath(t.category);

    list.appendChild(clone);

    // ─── DELETE ───────────────────────────────────────────────
    const insertedDiv = list.lastElementChild;
    insertedDiv
      .querySelector(".delete-btn")
      .addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm("Sei sicuro di voler eliminare questa transazione?"))
          return;

        try {
          const delRes = await fetch(
            `http://localhost:3000/transaction/delete?id=${t.id}`,
            {
              method: "DELETE",
              headers: { Authorization: "Bearer " + token },
            },
          );

          if (delRes.ok) {
            insertedDiv.remove();
            updateCount(
              Math.max(
                0,
                parseInt(
                  document.getElementById("results-count").textContent,
                  10,
                ) - 1,
              ),
            );
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
  return (
    map[category] || "https://cdn-icons-png.flaticon.com/512/565/565547.png"
  );
}

// ─── FILTRI: manda solo i parametri non vuoti ──────────────────
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

// ─── PILLOLE TIPO ──────────────────────────────────────────────
let selectedType = "";

document.querySelectorAll(".type-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document
      .querySelectorAll(".type-pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    selectedType = pill.dataset.value;
    fetchTransactions(getFilters());
  });
});

// ─── FILTRO AUTOMATICO su categoria e date ─────────────────────
document
  .getElementById("filter-category")
  .addEventListener("change", () => fetchTransactions(getFilters()));
document
  .getElementById("filter-start")
  .addEventListener("change", () => fetchTransactions(getFilters()));
document
  .getElementById("filter-end")
  .addEventListener("change", () => fetchTransactions(getFilters()));

// ─── RESET FILTRI ──────────────────────────────────────────────
document.getElementById("reset-filters").addEventListener("click", () => {
  document
    .querySelectorAll(".type-pill")
    .forEach((p) => p.classList.remove("active"));
  document.querySelector(".type-pill.all").classList.add("active");
  selectedType = "";
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-start").value = "";
  document.getElementById("filter-end").value = "";
  fetchTransactions();
});

// ─── ORDINAMENTO LATO FE ───────────────────────────────────────
document.getElementById("sort-select").addEventListener("change", (e) => {
  const val = e.target.value;
  const list = document.getElementById("list");
  const rows = [...list.querySelectorAll(".transaction")];

  rows.sort((a, b) => {
    const amountA = parseFloat(
      a.querySelector(".amount").textContent.replace(/[^0-9.]/g, ""),
    );
    const amountB = parseFloat(
      b.querySelector(".amount").textContent.replace(/[^0-9.]/g, ""),
    );
    const dateA = new Date(
      `${a.querySelector(".day").textContent} ${a.querySelector(".month").textContent} ${a.querySelector(".year").textContent}`,
    );
    const dateB = new Date(
      `${b.querySelector(".day").textContent} ${b.querySelector(".month").textContent} ${b.querySelector(".year").textContent}`,
    );

    if (val === "date-desc") return dateB - dateA;
    if (val === "date-asc") return dateA - dateB;
    if (val === "amount-desc") return amountB - amountA;
    if (val === "amount-asc") return amountA - amountB;
    return 0;
  });

  rows.forEach((r) => list.appendChild(r));
});

// ─── INIT ──────────────────────────────────────────────────────
document.getElementById("avatar").textContent = initials;

fetchTransactions();
