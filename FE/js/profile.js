const user = {
    email: "",
    first_name: "",
    last_name: "",
    birth_date: 0,
    address: "",
    city: "",
    cap: "",
    province: 0,
    phone: "",
}

async function getInfoProfile() {
    const token = localStorage.getItem('token');

    try {
        const res = await fetch('http://192.168.1.111:3000/user/userInfo', {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        if (res.ok) {
            //Riempio l'oggetto user con i dati presi dal backend
            user.email = (data.userInfo.email);
            user.first_name = (data.userInfo.first_name);
            user.last_name = (data.userInfo.last_name);
            const date = new Date(data.userInfo.birth_date);
            const dataLocale = date.toISOString().split('T')[0];
            user.birth_date = (dataLocale);
            user.address = (data.userInfo.address);
            user.city = (data.userInfo.city);
            user.cap = (data.userInfo.cap);
            user.province = (data.userInfo.province);
            user.phone = (data.userInfo.phone);
            //assegno ai div i dati per visualizzare email, iniziali, nome e cognome
            document.getElementById('avatar').textContent = (user.first_name[0] + user.last_name[0]).toUpperCase();
            document.getElementById('full_name').textContent = (user.first_name + ' ' + user.last_name);
            document.getElementById('email').textContent = user.email;
            //Assegno i valori agli input della modal per la modifica del profilo
            document.getElementById('first_name').value = user.first_name;
            document.getElementById('last_name').value = user.last_name;
            document.getElementById('birth_date').value = user.birth_date;
            document.getElementById('address').value = user.address;
            document.getElementById('city').value = user.city;
            document.getElementById('cap').value = user.cap;
            document.getElementById('province').value = user.province;
            document.getElementById('phone').value = user.phone;
        } else {
            console.error(data.message);
        }
    } catch (err) {
        console.error("Errore connessione:", err);
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('current-psw').value;
    const newPassword = document.getElementById('new-psw').value;
    const confirmPassword = document.getElementById('confirm-new-psw').value;
    const errorDiv = document.getElementById('error-message');

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = "Le password non coincidono!";
        return;
    }
    if (newPassword === currentPassword) {
        errorDiv.textContent = "La nuova password non deve coincidere con la precedente!"
        return;
    }

    try {
        const response = await fetch('http://192.168.1.111:3000/user/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // o il tuo metodo di auth
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error;
            return;
        }

        // Successo!
        alert('Password cambiata con successo');
        document.getElementById('change-password-form').reset();

    } catch (error) {
        errorDiv.textContent = 'Errore di connessione';
    }
}

async function updateProfile() {
    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const birth_date = document.getElementById('birth_date').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const cap = document.getElementById('cap').value;
    const province = document.getElementById('province').value;
    const phone = document.getElementById('phone').value;
    const errorDiv = document.getElementById('error-message');

    try {
        const response = await fetch('http://192.168.1.111:3000/user/updateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // o il tuo metodo di auth
            },
            body: JSON.stringify({
                first_name,
                last_name,
                birth_date,
                address,
                city,
                cap,
                province,
                phone,
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error;
            return;
        }
        // Successo!
        alert('Profilo aggiornato con successo');
        console.log(data);

    } catch (error) {
        errorDiv.textContent = 'Errore di connessione';
    }
}

async function deleteProfile() {
    try {
        const response = await fetch('http://192.168.1.111:3000/user/deleteUser', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // o il tuo metodo di auth
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.error);
            return;
        }
        // Successo!
        alert('Profilo eliminato');

    } catch (error) {
        console.log('Errore di connessione');
    }
}

function openModal(type) {

    let modal, confirmBtn, cancelBtn;

    switch (type) {
        case "logout":
            modal = document.getElementById("logout-modal");
            confirmBtn = document.getElementById("confirm-logout");
            cancelBtn = document.getElementById("cancel-logout");
            confirmBtn.onclick = () => {
                localStorage.removeItem("token");
                window.location.href = "http://192.168.1.111:8080";
            };
            break;

        case "delete":
            modal = document.getElementById("delete-modal");
            confirmBtn = document.getElementById("confirm-delete");
            cancelBtn = document.getElementById("cancel-delete");
            confirmBtn.onclick = () => {
                deleteProfile();
                window.location.href = "http://192.168.1.111:8080";

            };
            break;

        case "changePsw":
            modal = document.getElementById("modifyPsw-modal");
            cancelBtn = document.getElementById("cancel-password");

            break;

        case "changeProfile":
            modal = document.getElementById("modifyProfile-modal");
            cancelBtn = document.getElementById("cancel-modify-profile");

            break;

        default:
            return;
    }

    if (modal) {
        modal.classList.remove("hidden");

        // Imposta il pulsante di annulla
        if (cancelBtn) {
            cancelBtn.onclick = (e) => {
                e.preventDefault(); // Previeni il submit del form
                modal.classList.add("hidden");
                // Reset eventuali errori
                const errorDiv = modal.querySelector('#error-message');
                if (errorDiv) errorDiv.textContent = '';
            };
        }
    }
}

getInfoProfile();

//Vado ad intercettare il click dei pulsanti (del menu profilo) controllando da quale pulsante proviene in base all'id
//apro la modal relativa al pulsante cliccato
document.getElementById("logout-btn").addEventListener("click", () => openModal("logout"));
document.getElementById("deleteProfile-btn").addEventListener("click", () => openModal("delete"));
document.getElementById("changePsw-btn").addEventListener("click", () => openModal("changePsw"));
document.getElementById("changeProfile-btn").addEventListener("click", () => openModal("changeProfile"));

//aggiungo il listener per il pulsante conferma nella modifica della password e richiamo la funzione per la modifica
document.getElementById("change-password-form").addEventListener('submit', async (e) => {
    e.preventDefault();
    changePassword();
});

//aggiungo il listener per il pulsante conferma nella modifica della password e richiamo la funzione per la modifica
document.getElementById("modify-profile-form").addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Entrato");
    updateProfile();
});