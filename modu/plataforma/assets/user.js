import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDsSD0EcY_QKPcqycpiynXg--mO9VMvRDs",
    authDomain: "usuarios-d4364.firebaseapp.com",
    projectId: "usuarios-d4364",
    storageBucket: "usuarios-d4364.firebasestorage.app",
    messagingSenderId: "1050588492432",
    appId: "1:1050588492432:web:5803cad6718dfa36a09e15",
    measurementId: "G-SZD8728PHP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = sessionStorage.getItem('userId');
        const roles = JSON.parse(sessionStorage.getItem('roles') || '[]');

        if (!userId || roles.length === 0) {
            alert("Acceso denegado: No se encontraron datos de usuario o roles válidos.");
            window.location.href = '../login.html';
            return;
        }

        const userIconImg = document.querySelector('#user-icon img');
        const cachedName = sessionStorage.getItem('nombreCompleto');
        const cachedGender = sessionStorage.getItem('identidad');

        if (cachedName && cachedGender) {
            document.getElementById('user-name-span').textContent = cachedName;
            updateUserIcon(cachedGender, userIconImg);
            document.querySelector('.container').classList.remove('skeleton');
            return;
        }

        try {
            const userRef = doc(db, 'usuarios', userId);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const nombreCompleto = docSnap.data().nombreCompleto;
                const identidad = docSnap.data().identidad;
                sessionStorage.setItem('nombreCompleto', nombreCompleto);
                sessionStorage.setItem('identidad', identidad);
                document.getElementById('user-name-span').textContent = nombreCompleto;
                updateUserIcon(identidad, userIconImg);
                document.querySelector('.container').classList.remove('skeleton');
            } else {
                alert("Usuario no encontrado en Firestore.");
                window.location.href = '../login.html';
            }
        } catch (error) {
            console.error("Error al cargar datos del usuario:", error);
            alert("Error al cargar datos del usuario.");
            window.location.href = '../login.html';
        }
    } else {
        window.location.href = '../login.html';
    }
});

function updateUserIcon(identidad, imgElement) {
    try {
        if (identidad === 'hombre') {
            imgElement.src = './assets/img/usuario-Hombre.png'; 
            imgElement.alt = 'Hombre';
        } else if (identidad === 'mujer') {
            imgElement.src = './assets/img/usuario-Mujer.png'; 
            imgElement.alt = 'Mujer';
        } else {
            imgElement.src = './assets/img/otro.png';
            imgElement.alt = 'Otro';
        }
    } catch (error) {
        console.error("Error al cargar el ícono del usuario:", error);
        imgElement.src = './assets/img/default.png'; 
        imgElement.alt = 'Ícono predeterminado';
    }
}

const logoutBtn = document.getElementById('logout-btn');
const logoutConfirmation = document.getElementById('logout-confirmation');
const confirmLogout = document.getElementById('confirm-logout');
const cancelLogout = document.getElementById('cancel-logout');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        logoutConfirmation.style.display = 'flex';
    });
}

if (confirmLogout) {
    confirmLogout.addEventListener('click', () => {
        signOut(auth).then(() => {
            sessionStorage.clear();
            window.location.href = '../login.html';
        }).catch((error) => {
            console.error("Error al cerrar sesión:", error);
        });
    });
}

if (cancelLogout) {
    cancelLogout.addEventListener('click', () => {
        logoutConfirmation.style.display = 'none';
    });
}