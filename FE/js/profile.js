const user = {
  email: "", first_name: "", last_name: "", birth_date: 0,
  address: "", city: "", cap: "", province: 0, phone: "",
}

async function getInfoProfile() {
  const token = localStorage.getItem('token');
  try {
    const res  = await fetch('http://localhost:3000/user/userInfo', {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();

    if (res.ok) {
      user.email      = data.userInfo.email;
      user.first_name = data.userInfo.first_name;
      user.last_name  = data.userInfo.last_name;
      const date      = new Date(data.userInfo.birth_date);
      user.birth_date = date.toISOString().split('T')[0];
      user.address    = data.userInfo.address;
      user.city       = data.userInfo.city;
      user.cap        = data.userInfo.cap;
      user.province   = data.userInfo.province;
      user.phone      = data.userInfo.phone;

      // ─── Avatar e info header ───────────────────────────────
      const initials = (user.first_name[0] + user.last_name[0]).toUpperCase();
      document.getElementById('avatar').textContent     = initials;
      document.getElementById('avatar-big').textContent = initials;
      document.getElementById('full_name').textContent  = user.first_name + ' ' + user.last_name;
      document.getElementById('email').textContent      = user.email;

      // ─── Campi display (colonna destra) ─────────────────────
      document.getElementById('display-first_name').textContent  = user.first_name;
      document.getElementById('display-last_name').textContent   = user.last_name;
      document.getElementById('display-birth_date').textContent  = date.toLocaleDateString('it-IT');
      document.getElementById('display-address').textContent     = user.address  || '—';
      document.getElementById('display-city').textContent        = user.city     || '—';
      document.getElementById('display-cap').textContent         = user.cap      || '—';
      document.getElementById('display-province').textContent    = user.province || '—';
      document.getElementById('display-phone').textContent       = user.phone    || '—';

      // ─── Valori negli input della modal modifica profilo ────
      document.getElementById('first_name').value  = user.first_name;
      document.getElementById('last_name').value   = user.last_name;
      document.getElementById('birth_date').value  = user.birth_date;
      document.getElementById('address').value     = user.address;
      document.getElementById('city').value        = user.city;
      document.getElementById('cap').value         = user.cap;
      document.getElementById('province').value    = user.province;
      document.getElementById('phone').value       = user.phone;

    } else {
      console.error(data.message);
    }
  } catch (err) {
    console.error("Errore connessione:", err);
  }
}

async function changePassword() {
  const currentPassword  = document.getElementById('current-psw').value;
  const newPassword      = document.getElementById('new-psw').value;
  const confirmPassword  = document.getElementById('confirm-new-psw').value;
  const errorDiv         = document.getElementById('error-message');

  if (newPassword !== confirmPassword) {
    errorDiv.textContent = "Le password non coincidono!";
    return;
  }
  if (newPassword === currentPassword) {
    errorDiv.textContent = "La nuova password non deve coincidere con la precedente!";
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/user/changePassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await response.json();

    if (!response.ok) { errorDiv.textContent = data.error; return; }

    alert('Password cambiata con successo');
    document.getElementById('change-password-form').reset();
    document.getElementById('modifyPsw-modal').classList.add('hidden');
  } catch (error) {
    errorDiv.textContent = 'Errore di connessione';
  }
}

async function updateProfile() {
  const errorDiv = document.getElementById('error-message');
  const payload  = {
    first_name: document.getElementById('first_name').value,
    last_name:  document.getElementById('last_name').value,
    birth_date: document.getElementById('birth_date').value,
    address:    document.getElementById('address').value,
    city:       document.getElementById('city').value,
    cap:        document.getElementById('cap').value,
    province:   document.getElementById('province').value,
    phone:      document.getElementById('phone').value,
  };

  try {
    const response = await fetch('http://localhost:3000/user/updateProfile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) { errorDiv.textContent = data.error; return; }

    alert('Profilo aggiornato con successo');
    document.getElementById('modifyProfile-modal').classList.add('hidden');
    getInfoProfile(); // aggiorna i campi display
  } catch (error) {
    errorDiv.textContent = 'Errore di connessione';
  }
}

async function deleteProfile() {
  try {
    const response = await fetch('http://localhost:3000/user/deleteUser', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();

    if (!response.ok) { console.log(data.error); return; }

    alert('Profilo eliminato');
  } catch (error) {
    console.log('Errore di connessione');
  }
}

function openModal(type) {
  let modal, confirmBtn, cancelBtn;

  switch (type) {
    case "logout":
      modal      = document.getElementById("logout-modal");
      confirmBtn = document.getElementById("confirm-logout");
      cancelBtn  = document.getElementById("cancel-logout");
      confirmBtn.onclick = () => {
        localStorage.removeItem("token");
        window.location.href = "http://localhost:5500";
      };
      break;

    case "delete":
      modal      = document.getElementById("delete-modal");
      confirmBtn = document.getElementById("confirm-delete");
      cancelBtn  = document.getElementById("cancel-delete");
      confirmBtn.onclick = () => {
        deleteProfile();
        window.location.href = "http://localhost:5500";
      };
      break;

    case "changePsw":
      modal     = document.getElementById("modifyPsw-modal");
      cancelBtn = document.getElementById("cancel-password");
      break;

    case "changeProfile":
      modal     = document.getElementById("modifyProfile-modal");
      cancelBtn = document.getElementById("cancel-modify-profile");
      break;

    default:
      return;
  }

  if (modal) {
    modal.classList.remove("hidden");

    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add("hidden");
        const errorDiv = modal.querySelector('#error-message');
        if (errorDiv) errorDiv.textContent = '';
      };
    }

    // chiudi cliccando fuori
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    }, { once: true });
  }
}

// ─── INIT ─────────────────────────────────────────────────────
getInfoProfile();

document.getElementById("logout-btn").addEventListener("click",        () => openModal("logout"));
document.getElementById("deleteProfile-btn").addEventListener("click", () => openModal("delete"));
document.getElementById("changePsw-btn").addEventListener("click",     () => openModal("changePsw"));
document.getElementById("changeProfile-btn").addEventListener("click", () => openModal("changeProfile"));

document.getElementById("change-password-form").addEventListener('submit', async (e) => {
  e.preventDefault();
  changePassword();
});

document.getElementById("modify-profile-form").addEventListener('submit', async (e) => {
  e.preventDefault();
  updateProfile();
});