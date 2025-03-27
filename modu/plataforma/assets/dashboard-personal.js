// Carga la página principal en un iframe
function cargarPaginaPrincipal() {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return console.error("No se encontró #main-content");

    mainContent.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = "info/info.html";
    iframe.style.cssText = "width: 100%; height: 100%; border: none;";
    iframe.onerror = () => console.error("Error al cargar iframe:", iframe.src);
    mainContent.appendChild(iframe);
}

// Muestra la página principal al cargar la ventana
function mostrarPaginaPrincipal() {
    cargarPaginaPrincipal();
}

// Carga un formulario en un iframe

function cargarFormulario(url) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = "99%";
        iframe.height = "800px";
        iframe.frameBorder = "0";

        mainContent.appendChild(iframe);
    } else {
        console.error("Elemento 'main-content' no encontrado.");
    }
}

// Muestra la fecha actual
function mostrarFecha() {
    const fechaActual = new Date();
    const opciones = {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
    };
    const fechaFormateada = fechaActual.toLocaleDateString("es-ES", opciones);
    const dateElement = document.getElementById("date");
    if (dateElement) {
        dateElement.innerHTML = fechaFormateada;
    } else {
        console.warn("No se encontró #date");
    }
}

// Muestra u oculta el diálogo de confirmación de logout
const logoutContainer = document.getElementById("logout-confirmation");
function showLogoutConfirmation() {
    if (logoutContainer) logoutContainer.classList.add("active");
}
function hideLogoutConfirmation() {
    if (logoutContainer) logoutContainer.classList.remove("active");
}

// Configuración inicial al cargar la página
window.addEventListener("load", mostrarPaginaPrincipal);

document.addEventListener("DOMContentLoaded", () => {
    // Mostrar fecha
    mostrarFecha();

    // Configurar enlaces de formularios
    const links = document.querySelectorAll(".formulario-link");
    links.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const target = link.getAttribute("data-target");
            if (target) cargarFormulario(target);
        });
    });

    // Botón y modal para cambiar de rol
    const changeRoleBtn = document.getElementById("change-role-btn");
    const changeRoleModal = document.getElementById("changeRoleModal");
    const changeRoleSelect = document.getElementById("changeRoleSelect");
    const changeRoleConfirmBtn = document.getElementById("changeRoleConfirmBtn");
    const roles = JSON.parse(sessionStorage.getItem("roles") || '[]');

    if (changeRoleBtn && changeRoleModal && changeRoleSelect && changeRoleConfirmBtn && roles.length > 1) {
        changeRoleBtn.style.display = 'block'; // Mostrar solo para usuarios con múltiples roles
        changeRoleBtn.addEventListener("click", () => {
            changeRoleSelect.innerHTML = "";
            const allRoles = ["admin", "usuario", "corporativo", "laboratorio"];
            allRoles.forEach(role => {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                changeRoleSelect.appendChild(option);
            });
            changeRoleModal.classList.remove("hidden");
        });

        changeRoleConfirmBtn.addEventListener("click", () => {
            const selectedRole = changeRoleSelect.value;
            changeRoleModal.classList.add("hidden");

            const basePath = './'; // Ruta relativa
            const roleRedirects = {
                "admin": 'dashboard-administrador.html',
                "usuario": 'dashboard-personal.html',
                "corporativo": 'dashboard-corporativo.html',
                "laboratorio": 'dashboard-laboratorio.html'
            };

            if (roleRedirects[selectedRole]) {
                window.location.href = basePath + roleRedirects[selectedRole];
            } else {
                console.error("Rol no reconocido:", selectedRole);
                alert("Rol no válido: " + selectedRole);
            }
        });

        changeRoleModal.addEventListener("click", e => {
            if (e.target === changeRoleModal) {
                changeRoleModal.classList.add("hidden");
            }
        });
    } else if (changeRoleBtn) {
        changeRoleBtn.style.display = 'none'; // Ocultar para usuarios con un solo rol
    }

    // Configurar logout
    const confirmLogout = document.getElementById("confirm-logout");
    const cancelLogout = document.getElementById("cancel-logout");
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn && confirmLogout && cancelLogout && logoutContainer) {
        logoutBtn.addEventListener("click", e => {
            e.preventDefault();
            showLogoutConfirmation();
        });
        confirmLogout.addEventListener("click", () => {
            console.log("Cerrando sesión...");
            window.location.href = "../index.html"; // Ajustado para salir al raíz
        });
        cancelLogout.addEventListener("click", hideLogoutConfirmation);
    } else {
        console.warn("Faltan elementos del logout");
    }

    // Configurar menú de usuario
    const userIcon = document.getElementById("user-icon");
    const userContainer = document.getElementById("user-container");
    const optionsContainer = document.getElementById("options-container");

    if (userIcon && userContainer && optionsContainer) {
        const optionLinks = optionsContainer.querySelectorAll("a.formulario-link");

        userIcon.addEventListener("click", e => {
            e.stopPropagation();
            optionsContainer.classList.toggle("hidden");
        });

        document.addEventListener("click", e => {
            if (!userContainer.contains(e.target)) {
                optionsContainer.classList.add("hidden");
            }
        });

        optionsContainer.addEventListener("click", e => {
            e.stopPropagation();
        });

        optionLinks.forEach(link => {
            link.addEventListener("click", () => {
                optionsContainer.classList.add("hidden");
            });
        });
    } else {
        console.warn("Faltan elementos del menú de usuario");
    }
});