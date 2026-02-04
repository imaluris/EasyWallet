const token = localStorage.getItem('token');

async function fetchTransactions(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`http://192.168.1.111:3000/transaction/list?${params.toString()}`, {
    headers: { "Authorization": "Bearer " + token }
  });

  const data = await res.json();

  const list = document.getElementById('list');
  const template = document.getElementById('transaction-template');

  list.innerHTML = '';

  if (!res.ok) {
    list.innerHTML = `<p>Errore: ${data.message}</p>`;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = '<p>Nessuna transazione trovata.</p>';
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

const insertedDiv = list.lastElementChild;
const overlay = insertedDiv.querySelector('.delete-overlay');

let pressTimer;

insertedDiv.addEventListener('mousedown', (e) => {
  console.log("Mouse premuto");
  pressTimer = setTimeout(() => {
    console.log("Mostro overlay");
    overlay.style.display = 'flex';
  }, 600);
});

insertedDiv.addEventListener('mouseup', () => {
  console.log("Mouse rilasciato");
  clearTimeout(pressTimer);
});

insertedDiv.addEventListener('mouseleave', () => {
  console.log("Mouse uscito");
  clearTimeout(pressTimer);
});

// Per mobile
insertedDiv.addEventListener('touchstart', (e) => {
  console.log("Touch iniziato");
  pressTimer = setTimeout(() => {
    console.log("Mostro overlay (touch)");
    overlay.style.display = 'flex';
  }, 600);
}, { passive: true });

insertedDiv.addEventListener('touchend', () => {
  console.log("Touch finito");
  clearTimeout(pressTimer);
});

insertedDiv.addEventListener('touchcancel', () => {
  console.log("Touch cancellato");
  clearTimeout(pressTimer);
});

// CHIUDI L'OVERLAY se clicchi sullo sfondo blu
overlay.addEventListener('click', (e) => {
  // Se clicchi sullo sfondo (non sul pulsante)
  if (e.target === overlay) {
    overlay.style.display = 'none';
  }
});

// GESTISCI il pulsante cestino
const deleteBtn = overlay.querySelector('.delete-btn');
deleteBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  
  if (confirm('Sei sicuro di voler eliminare questa transazione?')) {
    try {
      const res = await fetch(`http://192.168.1.111:3000/transaction/delete?id=${t.id}`, {
        method: 'DELETE',
        headers: { "Authorization": "Bearer " + token }
      });
      
      if (res.ok) {
        // Rimuovi l'elemento dalla lista
        insertedDiv.remove();
        console.log("Transazione eliminata");
      } else {
        const data = await res.json();
        alert('Errore: ' + data.message);
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      alert('Errore di connessione');
    }
  }
  
  overlay.style.display = 'none';
});
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

// al caricamento
console.log("Script transactions caricato");
fetchTransactions();

// gestione filtri
document.getElementById('apply-filters').addEventListener('click', () => {
  const type = document.getElementById('filter-type').value;
  const category = document.getElementById('filter-category').value;
  const startDate = document.getElementById('filter-start').value;
  const endDate = document.getElementById('filter-end').value;

  fetchTransactions({ type, category, startDate, endDate });
});
