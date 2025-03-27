function cargarPaginaPrincipal() {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
        const iframe = document.createElement("iframe");
        iframe.src = "./info/info.html";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.frameBorder = "0";

        mainContent.innerHTML = "";
        mainContent.appendChild(iframe);
    } else {
        console.error("Elemento 'main-content' no encontrado.");
    }
}

function ocultarSubmenusYSecciones() {
    const allSubmenus = document.querySelectorAll('.submenu');
    allSubmenus.forEach(function(submenu) {
        submenu.style.display = 'none';
    });

    const allSections = document.querySelectorAll('.contenedor-seccion');
    allSections.forEach(function(section) {
        section.style.display = 'none';
        section.classList.remove('open');
    });
}

function mostrarPaginaPrincipal() {
    cargarPaginaPrincipal();
    ocultarSubmenusYSecciones();

    const contenedorPrincipal = document.querySelector('.contenedor-principal');
    if (contenedorPrincipal) {
        contenedorPrincipal.style.display = 'block';
    } else {
        console.error("Elemento 'contenedor-principal' no encontrado.");
    }
}

function mostrarFecha() {
    const fechaActual = new Date();
    const opciones = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    };
    const fechaFormateada = fechaActual.toLocaleDateString('es-ES', opciones);
    const dateElement = document.getElementById('date'); // Asegúrate de que este ID exista
    if (dateElement) {
        dateElement.innerHTML = fechaFormateada;
    } else {
        console.error("Elemento 'date' no encontrado. Asegúrate de que el ID 'date' esté en el HTML.");
    }
}

function showSection(sectionId) {
    const contenedorPrincipal = document.querySelector('.contenedor-principal');
    if (contenedorPrincipal) {
        contenedorPrincipal.style.display = 'none';
    }

    const sections = document.querySelectorAll('.contenedor-seccion');
    sections.forEach(function(section) {
        section.style.display = 'none';
    });

    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
}

function volverAlMenu() {
    const sections = document.querySelectorAll('.contenedor-seccion');
    sections.forEach(function(section) {
        section.style.display = 'none';
    });

    const contenedorPrincipal = document.querySelector('.contenedor-principal');
    if (contenedorPrincipal) {
        contenedorPrincipal.style.display = 'block';
    }
}

function toggleSubmenu(element) {
    const allSubmenus = document.querySelectorAll('.submenu');
    allSubmenus.forEach(submenu => {
        if (submenu !== element.nextElementSibling) {
            submenu.style.display = 'none';
        }
    });

    const submenu = element.nextElementSibling;
    if (submenu && submenu.classList.contains('submenu')) {
        if (submenu.style.display === 'none' || submenu.style.display === '') {
            submenu.style.display = 'block';
        } else {
            submenu.style.display = 'none';
        }
    }

    const allIcons = document.querySelectorAll(".fas.fa-chevron-right");
    allIcons.forEach(icon => {
        if (icon !== element.querySelector(".fas.fa-chevron-right")) {
            icon.classList.remove("rotated");
        }
    });

    const icon = element.querySelector(".fas.fa-chevron-right");
    if (icon) {
        icon.classList.toggle("rotated");
    }
}

function cargarFormulario(url) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameBorder = "0";

        mainContent.appendChild(iframe);
    } else {
        console.error("Elemento 'main-content' no encontrado.");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    mostrarFecha();

    window.addEventListener("load", mostrarPaginaPrincipal);

    const links = document.querySelectorAll('.formulario-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target) {
                cargarFormulario(target);
            } else {
                console.error("No se encontró 'data-target' en el enlace:", link);
            }
        });
    });

    const changeRoleBtn = document.getElementById('change-role-btn');
    const changeRoleModal = document.getElementById('changeRoleModal');
    const changeRoleSelect = document.getElementById('changeRoleSelect');
    const changeRoleConfirmBtn = document.getElementById('changeRoleConfirmBtn');

    if (changeRoleBtn) {
        changeRoleBtn.addEventListener('click', () => {
            const roles = JSON.parse(sessionStorage.getItem('roles')) || [];
            if (changeRoleSelect) {
                changeRoleSelect.innerHTML = '';

                const allRoles = ["admin", "usuario", "corporativo", "laboratorio"];
                allRoles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role;
                    option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                    changeRoleSelect.appendChild(option);
                });
            }
            if (changeRoleModal) changeRoleModal.classList.remove('hidden');
        });
    }

    if (changeRoleConfirmBtn) {
        changeRoleConfirmBtn.addEventListener('click', () => {
            const selectedRole = changeRoleSelect?.value;
            if (changeRoleModal) changeRoleModal.classList.add('hidden');

            const basePath = './'; 
            const dashboardMap = {
                "admin": 'dashboard-administrador.html',
                "usuario": 'dashboard-personal.html',
                "corporativo": 'dashboard-corporativo.html',
                "laboratorio": 'dashboard-laboratorio.html'
            };
            const dashboardUrl = dashboardMap[selectedRole];
            if (dashboardUrl) {
                window.location.href = basePath + dashboardUrl;
            } else {
                alert("Rol no válido: " + selectedRole);
            }
        });
    }

    if (changeRoleModal) {
        changeRoleModal.addEventListener('click', (e) => {
            if (e.target === changeRoleModal) {
                changeRoleModal.classList.add('hidden');
            }
        });
    }

    const logoutContainer = document.getElementById('logout-confirmation');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (logoutContainer) logoutContainer.classList.add('active');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            console.log('Cerrando sesión...');
            window.location.href = '../index.html';
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', () => {
            if (logoutContainer) logoutContainer.classList.remove('active');
        });
    }

    const userIcon = document.getElementById('user-icon');
    const userContainer = document.getElementById('user-container');
    const optionsContainer = document.getElementById('options-container');
    const optionLinks = optionsContainer?.querySelectorAll('a.formulario-link');

    if (userIcon) {
        userIcon.addEventListener('click', function(event) {
            event.stopPropagation();
            if (optionsContainer) optionsContainer.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', function(event) {
        if (userContainer && optionsContainer && !userContainer.contains(event.target)) {
            optionsContainer.classList.add('hidden');
        }
    });

    if (optionsContainer) {
        optionsContainer.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }

    optionLinks?.forEach(function(link) {
        link.addEventListener('click', function() {
            if (optionsContainer) optionsContainer.classList.add('hidden');
        });
    });
});