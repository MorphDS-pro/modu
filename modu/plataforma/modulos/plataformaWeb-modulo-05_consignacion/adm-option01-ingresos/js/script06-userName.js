import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


const firebaseConfig = {
    apiKey: "AIzaSyDsSD0EcY_QKPcqycpiynXg--mO9VMvRDs",
    authDomain: "usuarios-d4364.firebaseapp.com",
    projectId: "usuarios-d4364",
    storageBucket: "usuarios-d4364.firebasestorage.app",
    messagingSenderId: "1050588492432",
    appId: "1:1050588492432:web:5803cad6718dfa36a09e15",
    measurementId: "G-SZD8728PHP"
};

const app2 = initializeApp(firebaseConfig, 'proyecto2');
const db2 = getFirestore(app2);

const userId = sessionStorage.getItem('userId');

if (userId) {
    async function obtenerNombreCompleto() {
        try {
            const userRef = doc(db2, 'usuarios', userId);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const nombreCompleto = docSnap.data().nombreCompleto;

                const registerUsuario = document.getElementById('registerUsuario');
                const importUsuario = document.getElementById('importUsuario');
                const logrUsuario = document.getElementById('logrUsuario');

                if (registerUsuario) registerUsuario.textContent = nombreCompleto;
                if (importUsuario) importUsuario.textContent = nombreCompleto;
                if (logrUsuario) logrUsuario.textContent = nombreCompleto;

            } else {
                console.warn("Usuario no encontrado.");
                window.location.href = '../../../../morph_(ds)_plataformaWeb01-administrador/info/404ErrorPage.html';
            }
        } catch (error) {
            console.error("Error al obtener el nombre completo:", error);
            window.location.href = '../../../../morph_(ds)_plataformaWeb01-administrador/info/404ErrorPage.html';
        }
    }

    document.addEventListener('DOMContentLoaded', obtenerNombreCompleto);
} else {
    window.location.href = '../../../../morph_(ds)_plataformaWeb01-administrador/info/404ErrorPage.html';
}