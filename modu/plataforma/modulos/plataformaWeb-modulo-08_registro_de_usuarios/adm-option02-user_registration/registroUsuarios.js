import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';
import { getFirestore, doc, setDoc, collection, onSnapshot, getDocs, updateDoc, query, where } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDsSD0EcY_QKPcqycpiynXg--mO9VMvRDs",
    authDomain: "usuarios-d4364.firebaseapp.com",
    projectId: "usuarios-d4364",
    storageBucket: "usuarios-d4364.firebasestorage.app",
    messagingSenderId: "1050588492432",
    appId: "1:1050588492432:web:5803cad6718dfa36a09e15",
    measurementId: "G-SZD8728PHP"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const registerForm = document.getElementById('registerForm');
const overlay = document.getElementById('overlay');
const usersTableBody = document.getElementById('usersTableBody');
let usersData = [];

// Formatear fecha para mostrar en la tabla
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Mostrar ícono de género (usando Font Awesome para evitar errores de imágenes no encontradas)
function getGenderIcon(identidad) {
    if (identidad === 'hombre') {
        return '<i class="fas fa-male" style="font-size: 20px;"></i>'; // Ícono de hombre
    } else if (identidad === 'mujer') {
        return '<i class="fas fa-female" style="font-size: 20px;"></i>'; // Ícono de mujer
    } else {
        return '<i class="fas fa-user" style="font-size: 20px;"></i>'; // Ícono genérico para "otro"
    }
}

// Cargar usuarios desde Firestore y escuchar cambios en tiempo real
function loadUsers() {
    onSnapshot(collection(db, 'usuarios'), (snapshot) => {
        usersData = [];
        snapshot.forEach((doc) => {
            const user = doc.data();
            usersData.push({
                id: doc.id, // Guardar el ID del documento para usarlo al actualizar
                nombreCompleto: user.nombreCompleto,
                rut: user.rut,
                correo: user.correo,
                identidad: user.identidad,
                usuario: user.usuario,
                roles: user.roles.join(', '), // Convertir el array de roles a una cadena para mostrar en la tabla
                fechaRegistro: user.fechaRegistro
            });
        });
        renderTable(usersData);
    }, (error) => {
        console.error("Error al cargar usuarios:", error);
    });
}

// Renderizar la tabla con los datos de los usuarios
function renderTable(data) {
    usersTableBody.innerHTML = '';
    data.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', user.id); // Guardar el ID del documento en la fila
        row.innerHTML = `
            <td contenteditable="true">${user.nombreCompleto}</td>
            <td contenteditable="true">${user.rut}</td>
            <td contenteditable="true">${user.correo}</td>
            <td>${getGenderIcon(user.identidad)}</td> <!-- No editable -->
            <td contenteditable="true">${user.usuario}</td>
            <td contenteditable="true">${user.roles}</td>
            <td>${formatDate(user.fechaRegistro)}</td> <!-- No editable -->
            <td>
                <button class="btn-save" onclick="saveUserChanges('${user.id}', this)">
                    <i class="fas fa-save"></i> Guardar
                </button>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

// Guardar los cambios editados en Firestore
window.saveUserChanges = async function(userId, button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');

    const updatedData = {
        nombreCompleto: cells[0].textContent.trim(),
        rut: cells[1].textContent.trim(),
        correo: cells[2].textContent.trim(),
        usuario: cells[4].textContent.trim(),
        roles: cells[5].textContent.trim().split(',').map(role => role.trim()) // Convertir roles a un array
    };

    try {
        // Validaciones básicas
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!updatedData.nombreCompleto || !updatedData.rut || !updatedData.correo || !updatedData.usuario || !updatedData.roles.length) {
            throw new Error("Todos los campos son obligatorios");
        }
        if (!emailRegex.test(updatedData.correo)) {
            throw new Error("El correo electrónico no es válido");
        }

        // Actualizar en Firestore
        await updateDoc(doc(db, "usuarios", userId), updatedData);

        // Mostrar mensaje de éxito
        document.getElementById('successText').textContent = `Usuario actualizado con éxito`;
        document.getElementById('messageSuccess').classList.remove('hidden');
        setTimeout(() => document.getElementById('messageSuccess').classList.add('hidden'), 3000);
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        let errorMessage = "Error al actualizar usuario";
        if (error.code === "permission-denied") {
            errorMessage = "No tienes permisos para realizar esta acción. Contacta al administrador.";
        } else {
            errorMessage = error.message || "Error desconocido";
        }
        document.getElementById('errorText').textContent = errorMessage;
        document.getElementById('messageError').classList.remove('hidden');
        setTimeout(() => document.getElementById('messageError').classList.add('hidden'), 3000);
    }
};

// Manejar el envío del formulario de registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    overlay.classList.remove('hidden');

    const nombreCompleto = document.getElementById('registrarNombreCompleto').value.trim();
    const rut = document.getElementById('registrarRut').value.trim();
    const correo = document.getElementById('registrarCorreo').value.trim();
    const identidad = document.getElementById('registrarIdentidad').value;
    const usuario = document.getElementById('registrarUsuario').value.trim();
    const contrasena = document.getElementById('registrarContrasena').value;
    const rol = document.getElementById('registrarRol').value;

    try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!nombreCompleto || !rut || !correo || !identidad || !usuario || !contrasena || !rol) {
            throw new Error("Todos los campos son obligatorios");
        }
        if (!emailRegex.test(correo)) {
            throw new Error("El correo electrónico no es válido");
        }
        if (contrasena.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres");
        }

        console.log("Procesando registro para:", { correo, rol });

        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, correo, contrasena);
            const userId = userCredential.user.uid;

            await setDoc(doc(db, "usuarios", userId), {
                nombreCompleto,
                rut,
                correo,
                identidad,
                usuario,
                roles: [rol],
                fechaRegistro: new Date().toISOString()
            });

            document.getElementById('successText').textContent = `Usuario ${usuario} registrado como ${rol} con éxito`;
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                const q = query(collection(db, "usuarios"), where("correo", "==", correo));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userId = userDoc.id;
                    const existingRoles = userDoc.data().roles || [];

                    if (existingRoles.includes(rol)) {
                        throw new Error(`El usuario ya tiene el rol ${rol}`);
                    }

                    await signInWithEmailAndPassword(auth, correo, contrasena);

                    const updatedRoles = [...new Set([...existingRoles, rol])];
                    await updateDoc(doc(db, "usuarios", userId), {
                        roles: updatedRoles
                    });

                    document.getElementById('successText').textContent = `Rol ${rol} agregado al usuario ${usuario} con éxito`;
                } else {
                    throw new Error("Usuario registrado en Authentication pero no encontrado en Firestore");
                }
            } else {
                throw error;
            }
        }

        document.getElementById('messageSuccess').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('messageSuccess').classList.add('hidden');
            registerForm.reset();
        }, 3000);
    } catch (error) {
        console.error("Error al procesar:", error.message);
        let errorMessage = "Error desconocido";
        if (error.code === "auth/email-already-in-use") {
            errorMessage = "El correo ya está registrado (verifica la contraseña)";
        } else if (error.code === "auth/invalid-email") {
            errorMessage = "El correo no es válido";
        } else if (error.code === "auth/weak-password") {
            errorMessage = "La contraseña debe tener al menos 6 caracteres";
        } else if (error.code === "auth/wrong-password") {
            errorMessage = "Contraseña incorrecta para agregar rol";
        } else {
            errorMessage = error.message;
        }
        document.getElementById('errorText').textContent = errorMessage;
        document.getElementById('messageError').classList.remove('hidden');
        setTimeout(() => document.getElementById('messageError').classList.add('hidden'), 3000);
    } finally {
        overlay.classList.add('hidden');
    }
});

// Mostrar u ocultar el input de filtro en la tabla
window.toggleFilter = function(columnIndex) {
    const filterInput = document.getElementsByClassName('filter-input')[columnIndex];
    filterInput.classList.toggle('hidden');
    if (!filterInput.classList.contains('hidden')) {
        filterInput.focus();
    }
};

// Filtrar los datos de la tabla según el valor del input
window.filterTable = function(columnIndex) {
    const filterValue = document.getElementsByClassName('filter-input')[columnIndex].value.trim().toLowerCase();
    const filteredData = usersData.filter(user => {
        const values = [
            user.nombreCompleto,
            user.rut,
            user.correo,
            user.identidad,
            user.usuario,
            user.roles,
            formatDate(user.fechaRegistro)
        ];
        return values[columnIndex].toLowerCase().includes(filterValue);
    });
    renderTable(filteredData);
};

// Cerrar los mensajes de éxito y error
document.getElementById('closeMessageSuccess').addEventListener('click', () => {
    document.getElementById('messageSuccess').classList.add('hidden');
});

document.getElementById('closeMessageError').addEventListener('click', () => {
    document.getElementById('messageError').classList.add('hidden');
});

// Cargar los usuarios al iniciar
loadUsers();