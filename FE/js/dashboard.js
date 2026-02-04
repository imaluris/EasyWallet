const modal = document.getElementById('transactionModal');
const openBtn = document.getElementById('openModal');
const closeBtn = document.getElementById('closeModal');
const form = document.getElementById('transactionForm');
const message = document.getElementById('message');
const monthYearEl = document.getElementById("month-year");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let chartInstance = null;

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const months = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];
function updateDisplay() {
    monthYearEl.textContent = `${months[currentMonth]} ${currentYear}`;
    getBalance();
    buildChart();
}

prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateDisplay();
});

nextBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateDisplay();
});


//TOTALE ENTRATE USCITE
async function getBalance() {
    const token = localStorage.getItem('token');
    let monthBE = currentMonth + 1; 
    try {
        const res = await fetch(`http://192.168.1.111:3000/dashboard/summary?month=${monthBE}&year=${currentYear}`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        if (res.ok) {
            const sign = data.balance < 0 ? '-' : '';
            const color = data.balance < 0 ? 'red' : 'green';

            document.getElementById('balance').innerHTML = `
        <span class="value" style="color:${color}">
            €${sign}${Math.abs(data.balance)}
        </span>`;

            document.getElementById('income').innerHTML = `
        <span class="value" style="color:green">
            €${Math.abs(data.income)}
        </span>`;

            document.getElementById('expense').innerHTML = `
        <span class="value" style="color:red">
            €${Math.abs(data.expense)}
        </span>`;

        } else {
            console.error(data.message);
        }
    } catch (err) {
        console.error("Errore connessione:", err);
    }
}

//GRAFICO A TORTA
// === Dati per grafico a torta ===
async function buildChart() {
    const token = localStorage.getItem('token');
    let monthBE = currentMonth + 1; 

    try {
        const res = await fetch(`http://192.168.1.111:3000/dashboard/category-totals?month=${monthBE}&year=${currentYear}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const categories = await res.json();

        const labels = categories.map(c => c.category);
        const values = categories.map(c => Math.abs(c.total));

        if (typeof Chart === "undefined") {
            console.error("Chart.js non è stato caricato correttamente!");
        } else {
            console.log("Chart.js caricato correttamente");
        }

         const canvas = document.getElementById('myChart');
        const ctx = canvas.getContext('2d');

        // 🔥 QUI È LA PARTE CHE MANCAVA
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Totale per categoria',
                    data: values,
                    backgroundColor: [
                        '#4CAF50', '#FF9800', '#03A9F4', '#E91E63', '#9C27B0', '#FFC107'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: false,
                        text: ''
                    }
                }
            }
        });

    } catch (err) {
        console.error("Errore nel caricamento del grafico:", err);
    }
}

//ULTIMI CINQUE MOVIMENTI
async function fetchLastFiveTransactions(filters = {}) {
    const token = localStorage.getItem('token');

    const res = await fetch(`http://192.168.1.111:3000/dashboard/last-five`, {
        headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();

    const list = document.getElementById('list');
    const template = document.getElementById('transaction-template');

    list.innerHTML = '';

    if (!res.ok) {
        console.log("Errore:" + data.message);
        return;
    }

    if (data.length === 0) {
        console.log("Nessuna transazione trovata.:");
        return;
    }


    data.forEach(t => {
        const clone = template.content.cloneNode(true);
        const div = clone.querySelector('.transaction');
        div.classList.add(t.type);

        const d = new Date(t.date);
        div.querySelector('.day').textContent = d.getDate();
        div.querySelector('.month').textContent = d.toLocaleString('it-IT', { month: 'long' });
        div.querySelector('.time').textContent = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        div.querySelector('.description').textContent = `"${t.description}"`;
        div.querySelector('.amount').textContent = `${t.type === 'income' ? '+' : '-'}€${t.amount}`;
        div.querySelector('.icon img').src = getIconPath(t.category);

        list.appendChild(clone);
    });

    function getIconPath(category) {
        // Qui puoi sostituire con icone vere (es. /img/home.svg)
        const map = {
            Casa: '../assets/home.png',
            cibo: '../assets/food.png',
            entrate: '../assets/income.png',
            Benessere: '../assets/health.png',
            shopping: '../assets/shopping.png',
            cultura: '../assets/culture.png',
            viaggi: '../assets/travel.png',
            sport: '../assets/sports.png'
        };
        return map[category] || 'https://cdn-icons-png.flaticon.com/512/565/565547.png';
    }
}

//BOTTONE E MODALE
console.log("dashboard");
updateDisplay();
fetchLastFiveTransactions();

// Apri la modal
openBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Chiudi la modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Chiudi cliccando fuori dal contenuto
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Gestione submit del form
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('submit intercettato!');

    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const token = localStorage.getItem('token');

    // Se vuoi inviare al server Express.js
    try {
        const res = await fetch('http://192.168.1.111:3000/transaction/addTransaction', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ type, description, amount, category, date })
        });

        const data = await res.json();

        if (res.ok) {
            message.style.color = 'green';
            message.textContent = data.message;

        } else {
            message.style.color = 'red';
            message.textContent = data.message;
        }

    } catch (err) {
        message.style.color = 'red';
        message.textContent = 'Errore di connessione al server';
        console.error(err);
    }

    // Chiudi la modal e resetta il form
    form.reset();
    modal.style.display = 'none';
});