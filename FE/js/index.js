// seleziona tutti i link del menu
const links = document.querySelectorAll('.menu a');
const mainContent = document.getElementById('main-content');

links.forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();           // previeni il comportamento di default
    const page = link.dataset.page; // prendi il file da caricare

    try {
      const response = await fetch(`pages/${page}`);
      if (!response.ok) throw new Error('Pagina non trovata');
      const html = await response.text();
      mainContent.innerHTML = html;  // inserisce il contenuto nel div
    } catch (err) {
      mainContent.innerHTML = `<p>Errore nel caricamento della pagina.</p>`;
      console.error(err);
    }
  });
});
