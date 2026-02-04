const monthYearEl = document.getElementById("month-year");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const months = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const iconMap = {
    casa: '../assets/home.png',
    cibo: '../assets/food.png',
    entrate: '../assets/income.png',
    benessere: '../assets/health.png',
    shopping: '../assets/shopping.png',
    cultura: '../assets/culture.png',
    viaggi: '../assets/travel.png',
    sport: '../assets/sports.png'
};

const categoryMap = new Map([
    ['Casa', 0],
    ['Cibo', 0],
    ['Entrate', 0],
    ['Benessere', 0],
    ['Shopping', 0],
    ['Cultura', 0],
    ['Viaggi', 0],
    ['Sport', 0],
]);

const incomeMap = new Map([
    ['Gennaio', 0],
    ['Febbraio', 0],
    ['Marzo', 0],
    ['Aprile', 0],
    ['Maggio', 0],
    ['Giugno', 0],
    ['Luglio', 0],
    ['Agosto', 0],
    ['Settembre', 0],
    ['Ottobre', 0],
    ['Novembre', 0],
    ['Dicembre', 0],
]);

const expenseMap = new Map([
    ['Gennaio', 0],
    ['Febbraio', 0],
    ['Marzo', 0],
    ['Aprile', 0],
    ['Maggio', 0],
    ['Giugno', 0],
    ['Luglio', 0],
    ['Agosto', 0],
    ['Settembre', 0],
    ['Ottobre', 0],
    ['Novembre', 0],
    ['Dicembre', 0],
]);

const balanceMap = new Map([
    ['Gennaio', 0],
    ['Febbraio', 0],
    ['Marzo', 0],
    ['Aprile', 0],
    ['Maggio', 0],
    ['Giugno', 0],
    ['Luglio', 0],
    ['Agosto', 0],
    ['Settembre', 0],
    ['Ottobre', 0],
    ['Novembre', 0],
    ['Dicembre', 0],
]);

const monthMap = new Map([
    [1, 'Gennaio'],
    [2, 'Febbraio'],
    [3, 'Marzo'],
    [4, 'Aprile'],
    [5, 'Maggio'],
    [6, 'Giugno'],
    [7, 'Luglio'],
    [8, 'Agosto'],
    [9, 'Settembre'],
    [10, 'Ottobre'],
    [11, 'Novembre'],
    [12, 'Dicembre'],
]);

const Type = {
    INCOME: 'income',
    EXPENSE: 'expense',
};

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

///da qui è un casinoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
const token = localStorage.getItem('token');

async function getCategoryBalance(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`http://192.168.1.111:3000/transaction/list?${params.toString()}`, {
        headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();




    data.forEach(t => {

        //per ogni transazione prendo l'importo della categoria salvato nella mappa, sommo l'importo della transazione e lo riassegno alla mappa
        console.log(t);

        let sum = categoryMap.get(t.category);
        if (t.type == Type.INCOME) {
            sum += Number(t.amount);
        } else {
            sum -= Number(t.amount);
        }

        categoryMap.set(t.category, sum);

        //risalgo al mese come stringa
        const d = new Date(t.date);
        const month = d.getMonth() + 1;
        const monthString = monthMap.get(month);

        //per ogni mese, sommo uscite ed entrate
        if (t.type == "income") {
            let incomeSum = incomeMap.get(monthString);
            incomeSum += Number(t.amount);
            incomeMap.set(monthString, incomeSum);
        } else {
            let incomeSum = expenseMap.get(monthString);
            incomeSum += Number(t.amount);
            expenseMap.set(monthString, incomeSum);
        }
    });

    //per ogni mese dell'anno calcolo il saldo a fine mese
    for (let i = 1; i < monthMap.size + 1; i++) {
        if (i > 1) {
            let monthString = monthMap.get(i);
            let incomeMonth = incomeMap.get(monthString);

            let monthStringPrec = monthMap.get(i - 1);

            let expenseMonth = expenseMap.get(monthString);
            balanceMap.set(monthString, balanceMap.get(monthStringPrec) + (incomeMonth - expenseMonth));
        } else {
            let monthString = monthMap.get(i);
            let incomeMonth = incomeMap.get(monthString);
            let expenseMonth = expenseMap.get(monthString);
            balanceMap.set(monthString, incomeMonth - expenseMonth);
        }
    }
}

function populateCardIncome() {
    const list = document.getElementById('cards-list');
    const template = document.getElementById('card-template');

    for (const [key, value] of categoryMap) {
        if (value < 0) {
            const clone = template.content.cloneNode(true);
            const div = clone.querySelector('.card-income');

            div.querySelector('.first-row img').src = getIconPath(key);
            div.querySelector('.category').textContent = key;
            div.querySelector('.income').textContent = value;
            div.querySelector('.currency').textContent = "EUR";

            list.appendChild(clone);
        }
    }

    console.log(categoryMap);

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

//Funzione per generare il primo grafico (entrate ed uscite)
function buildFirstChart() {

    const labels = Array.from(incomeMap.keys());
    const valuesIncome = Array.from(incomeMap.values());
    const valuesExpense = Array.from(expenseMap.values());

    console.log("Chart:", typeof Chart);
    if (typeof Chart === "undefined") {
        console.error("Chart.js non è stato caricato correttamente!");
    } else {
        console.log("Chart.js caricato correttamente");
    }

    const ctx = document.getElementById('firstChart');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Entrate',
                    data: valuesIncome,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0,0,255,0.5)',
                },
                {
                    label: 'uscite',
                    data: valuesExpense,
                    borderColor: 'red',
                    backgroundColor: 'rgba(255,0,0,0.5)',
                }
            ]
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
    document.addEventListener('DOMContentLoaded', buildFirstChart);
}

//Funzione per generare il secondo grafico (balance trend)

function buildSecondChart() {

    const labels = Array.from(incomeMap.keys());
    const balanceForMonth = Array.from(balanceMap.values());


    console.log("Chart:", typeof Chart);
    if (typeof Chart === "undefined") {
        console.error("Chart.js non è stato caricato correttamente!");
    } else {
        console.log("Chart.js caricato correttamente");
    }

    const ctx = document.getElementById('secondChart');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Saldo',
                    data: balanceForMonth,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0,0,255,0.5)',
                    fill: 1
                },
            ]
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
    document.addEventListener('DOMContentLoaded', buildSecondChart);
}

// Mostra il mese corrente al caricamento
async function init() {
    await getCategoryBalance();  // aspetta che la mappa sia popolata
    populateCardIncome();         // ora la mappa è aggiornata
    buildFirstChart();
    buildSecondChart();
}

init();
