import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';
import { getFirestore, query, where, getDocs, collection } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDsSD0EcY_QKPcqycpiynXg--mO9VMvRDs",
    authDomain: "usuarios-d4364.firebaseapp.com",
    projectId: "usuarios-d4364",
    storageBucket: "usuarios-d4364.firebasestorage.app",
    messagingSenderId: "1050588492432",
    appId: "1:1050588492432:web:5803cad6718dfa36a09e15",
    measurementId: "G-SZD8728PHP"
};

document.addEventListener('DOMContentLoaded', () => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const loginForm = document.getElementById('loginForm');
    const overlay = document.getElementById('overlay');
    const roleModal = document.getElementById('roleModal');
    const roleSelect = document.getElementById('roleSelect');
    const continueBtn = document.getElementById('continueBtn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const resetModal = document.getElementById('resetModal');
    const resetEmail = document.getElementById('resetEmail');
    const resetBtn = document.getElementById('resetBtn');
    const passwordInput = document.getElementById('password');
    const capsLockWarning = document.getElementById('capsLockWarning');

    // Detectar mayúsculas
    if (passwordInput && capsLockWarning) {
        passwordInput.addEventListener('keyup', (e) => {
            if (e.getModifierState('CapsLock')) {
                capsLockWarning.classList.remove('hidden');
            } else {
                capsLockWarning.classList.add('hidden');
            }
        });

        // Verificar al enfocar el campo
        passwordInput.addEventListener('focus', () => {
            const event = new KeyboardEvent('keyup');
            passwordInput.dispatchEvent(event);
        });

        // Ocultar mensaje al salir del campo si no está activo
        passwordInput.addEventListener('blur', () => {
            if (!passwordInput.getModifierState || !passwordInput.getModifierState('CapsLock')) {
                capsLockWarning.classList.add('hidden');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (overlay) overlay.classList.remove('hidden');

            const username = document.getElementById('username').value;
            const password = passwordInput.value;

            try {
                const usuariosRef = collection(db, 'usuarios');
                const q = query(usuariosRef, where("usuario", "==", username));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userEmail = userDoc.data().correo;
                    const roles = userDoc.data().roles || [];

                    const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
                    const user = userCredential.user;

                    if (user) {
                        sessionStorage.setItem('userId', userDoc.id);
                        sessionStorage.setItem('roles', JSON.stringify(roles));

                        // Priorizar la verificación del rol "admin" o usuario "admin"/"19433769"
                        if (roles.includes("admin") || username.toLowerCase() === "admin" || username.toLowerCase() === "19433769") {
                            redirectToDashboard("admin"); // Redirigir directamente al dashboard de admin
                        } else if (roles.length === 1) {
                            redirectToDashboard(roles[0]); // Si tiene un solo rol, redirigir directamente
                        } else if (roles.length > 1) {
                            // Si tiene más de un rol y no es "admin", mostrar el modal de selección
                            if (roleSelect) {
                                roleSelect.innerHTML = '';
                                roles.forEach(role => {
                                    const option = document.createElement('option');
                                    option.value = role;
                                    option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                                    roleSelect.appendChild(option);
                                });
                            }
                            if (roleModal) roleModal.classList.remove('hidden');
                            if (overlay) overlay.classList.add('hidden');
                        } else {
                            throw new Error("No se encontraron roles válidos");
                        }
                    }
                } else {
                    alert("Nombre de usuario no encontrado.");
                }
            } catch (error) {
                console.error("Error durante el inicio de sesión:", error);
                let errorMessage = "Credenciales incorrectas o error de acceso. Intenta nuevamente.";
                if (error.code === "auth/wrong-password") {
                    errorMessage = "Contraseña incorrecta.";
                } else if (error.code === "auth/user-not-found") {
                    errorMessage = "Usuario no encontrado en Firebase Authentication.";
                } else if (error.code === "auth/invalid-email") {
                    errorMessage = "Correo no válido.";
                }
                alert(errorMessage);
            } finally {
                if (roleModal && !roleModal.classList.contains('hidden')) return;
                if (overlay) overlay.classList.add('hidden');
            }
        });
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            const selectedRole = roleSelect?.value;
            if (roleModal) roleModal.classList.add('hidden');
            redirectToDashboard(selectedRole);
        });
    }

    if (roleModal) {
        roleModal.addEventListener('click', (e) => {
            if (e.target === roleModal) {
                roleModal.classList.add('hidden');
            }
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (resetModal) resetModal.classList.remove('hidden');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const email = resetEmail?.value.trim();
            if (!email) {
                alert("Por favor, ingresa tu correo electrónico.");
                return;
            }

            if (overlay) overlay.classList.remove('hidden');
            if (resetModal) resetModal.classList.add('hidden');

            try {
                await sendPasswordResetEmail(auth, email);
                alert("Se ha enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada o spam.");
            } catch (error) {
                console.error("Error al enviar el correo de recuperación:", error);
                let errorMessage = "Error al enviar el correo de recuperación.";
                if (error.code === "auth/invalid-email") {
                    errorMessage = "Correo no válido.";
                } else if (error.code === "auth/user-not-found") {
                    errorMessage = "No se encontró un usuario con ese correo.";
                }
                alert(errorMessage);
            } finally {
                if (overlay) overlay.classList.add('hidden');
                if (resetEmail) resetEmail.value = '';
            }
        });
    }

    if (resetModal) {
        resetModal.addEventListener('click', (e) => {
            if (e.target === resetModal) {
                resetModal.classList.add('hidden');
                if (resetEmail) resetEmail.value = '';
            }
        });
    }

    function redirectToDashboard(role) {
        if (!role) {
            alert("Por favor, selecciona un rol.");
            return;
        }
        const basePath = './plataforma/';
        const dashboardMap = {
            "admin": 'dashboard-administrador.html',
            "usuario": 'dashboard-personal.html',
            "corporativo": 'dashboard-corporativo.html',
            "laboratorio": 'dashboard-laboratorio.html'
        };
        const dashboardUrl = dashboardMap[role];
        if (dashboardUrl) {
            window.location.href = basePath + dashboardUrl;
        } else {
            alert("Rol no válido: " + role);
        }
    }
});