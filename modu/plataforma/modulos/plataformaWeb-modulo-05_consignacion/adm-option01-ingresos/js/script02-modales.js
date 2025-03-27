import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyDfz0_7v43TmV0rlFM9UhnVVHLFGtRWhGw",
  authDomain: "prestaciones-57dcd.firebaseapp.com",
  projectId: "prestaciones-57dcd",
  storageBucket: "prestaciones-57dcd.firebasestorage.app",
  messagingSenderId: "409471759723",
  appId: "1:409471759723:web:faa6812772f44baa3ec82e",
  measurementId: "G-0CZ9BMJWMV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportar la función loadMedicos (mantenida por compatibilidad)
export async function loadMedicos() {
  try {
    const querySnapshot = await getDocs(collection(db, 'medicos'));
    const selectMedicos = document.getElementById('registerDoctor');
    
    if (!selectMedicos) return;

    selectMedicos.innerHTML = '<option value="">Seleccione un médico</option>';

    if (querySnapshot.empty) return;

    const medicos = [];
    querySnapshot.forEach((doc) => {
      const medicoData = doc.data();
      medicos.push({
        id: doc.id,
        nombre: medicoData.medico || ''
      });
    });

    medicos.sort((a, b) => a.nombre.localeCompare(b.nombre));

    medicos.forEach((medico) => {
      const option = document.createElement('option');
      option.value = medico.id;
      option.textContent = medico.nombre;
      selectMedicos.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar médicos:", error);
  }
}

// Nueva función para cargar y filtrar médicos en el input
async function loadDoctors() {
  try {
    const querySnapshot = await getDocs(collection(db, 'medicos'));
    const input = document.getElementById('registerDoctorInput');
    const list = document.getElementById('customDoctorsList');
    const searchTerm = input.value.trim().toLowerCase();

    list.innerHTML = '';

    if (querySnapshot.empty) {
      list.style.display = 'none';
      return;
    }

    const medicos = [];
    querySnapshot.forEach((doc) => {
      const medicoData = doc.data();
      medicos.push({
        id: doc.id,
        nombre: medicoData.medico || ''
      });
    });

    const filteredMedicos = medicos.filter(medico =>
      medico.nombre.toLowerCase().includes(searchTerm)
    );

    filteredMedicos.sort((a, b) => a.nombre.localeCompare(b.nombre));

    filteredMedicos.forEach((medico) => {
      const optionItem = document.createElement('li');
      optionItem.textContent = medico.nombre;
      optionItem.dataset.id = medico.id;
      optionItem.onclick = function() {
        input.value = medico.nombre;
        input.dataset.doctorId = medico.id;
        list.style.display = 'none';
      };
      list.appendChild(optionItem);
    });

    list.style.display = filteredMedicos.length > 0 ? 'block' : 'none';
  } catch (error) {
    console.error("Error al cargar médicos dinámicos:", error);
  }
}

// Variable global para rastrear el modo de agrupación
let currentGrouping = 'consignacion'; // Valor por defecto

// Función para cargar descripciones según la agrupación seleccionada
async function loadConsignacionDescriptions() {
  try {
    const querySnapshot = await getDocs(collection(db, 'codigos'));
    const input = document.getElementById('registerDescriptionInput');
    const list = document.getElementById('customDescriptionsList');   
    const searchTerm = input.value.trim().toLowerCase();
    
    list.innerHTML = '';

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.clasificacion.toLowerCase() === currentGrouping && 
          data.descripcion.toLowerCase().includes(searchTerm)) {
        const optionItem = document.createElement('li');
        optionItem.textContent = data.descripcion;
        optionItem.onclick = function() {
          input.value = data.descripcion;
          document.getElementById('registerCode').value = data.codigo || '';
          document.getElementById('registerPrice').value = data.precio || '';
          document.getElementById('registerCompany').value = data.proveedor || 'Proveedor Desconocido';
          list.style.display = 'none';
        };
        list.appendChild(optionItem);
      }
    });

    list.style.display = list.innerHTML.trim() !== '' ? 'block' : 'none';
  } catch (error) {
    console.error("Error al cargar descripciones:", error);
  }
}

// Event listeners para el campo de médicos
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('registerDoctorInput');
  const button = document.getElementById('showDoctorsButton');
  const list = document.getElementById('customDoctorsList');

  input.addEventListener('input', loadDoctors);

  button.addEventListener('click', () => {
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
    loadDoctors();
  });

  // Evento para alternar entre Consignación y Cotización
  const toggleButton = document.getElementById('toggleGroupingButton');
  toggleButton.addEventListener('click', () => {
    if (currentGrouping === 'consignacion') {
      currentGrouping = 'cotizacion';
      toggleButton.textContent = 'Cotización';
      toggleButton.classList.add('cotizacion');
    } else {
      currentGrouping = 'consignacion';
      toggleButton.textContent = 'Consignación';
      toggleButton.classList.remove('cotizacion');
    }
    loadConsignacionDescriptions(); // Recargar la lista con el nuevo filtro
  });

  // Evento global para ocultar ambas listas al hacer clic fuera
  document.addEventListener('click', (e) => {
    const doctorInput = document.getElementById('registerDoctorInput');
    const doctorButton = document.getElementById('showDoctorsButton');
    const doctorList = document.getElementById('customDoctorsList');
    const descInput = document.getElementById('registerDescriptionInput');
    const descButton = document.getElementById('showDescriptionsButton');
    const descList = document.getElementById('customDescriptionsList');

    if (!doctorInput.contains(e.target) && !doctorButton.contains(e.target) && !doctorList.contains(e.target)) {
      doctorList.style.display = 'none';
    }
    if (!descInput.contains(e.target) && !descButton.contains(e.target) && !descList.contains(e.target)) {
      descList.style.display = 'none';
    }
  });
});

// Resto del código sin cambios
document.addEventListener("DOMContentLoaded", () => {
  const bttnRegister = document.getElementById("bttnRegister");
  const bttnSearch = document.getElementById("bttnSearch");
  const formRegisterContainer = document.getElementById("formRegisterContainer");
  const searchContainer = document.getElementById("searchContainer");

  bttnRegister?.addEventListener("click", () => {
    const isRegisterVisible = !formRegisterContainer.classList.contains("hidden");
    searchContainer.classList.add("hidden");
    if (isRegisterVisible) {
      formRegisterContainer.classList.add("hidden");
    } else {
      formRegisterContainer.classList.remove("hidden");
    }
  });

  bttnSearch?.addEventListener("click", () => {
    const isSearchVisible = !searchContainer.classList.contains("hidden");
    formRegisterContainer.classList.add("hidden");
    if (isSearchVisible) {
      searchContainer.classList.add("hidden");
    } else {
      searchContainer.classList.remove("hidden");
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const surgeryDateInput = document.getElementById('registerSurgeryDate');
  const surgeryDateContainer = document.getElementById('register-surgery-date');
  const today = new Date().toISOString().split('T')[0];
  surgeryDateInput.setAttribute('max', today);
  surgeryDateContainer.addEventListener('click', function () {
    surgeryDateInput.showPicker();
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const admissionInput = document.getElementById('registerAdmission');
  admissionInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 6);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const codeInput = document.getElementById('registerCode');
  codeInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 20);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const attributeInput = document.getElementById('registerAttribute');
  attributeInput.value = "Consignación";
  attributeInput.addEventListener('input', function () {
    this.value = "Consignación";
  });
});

document.addEventListener('DOMContentLoaded', loadConsignacionDescriptions);
document.getElementById('registerDescriptionInput').addEventListener('input', loadConsignacionDescriptions);

document.getElementById('showDescriptionsButton').addEventListener('click', function() {
  const list = document.getElementById('customDescriptionsList');
  list.style.display = list.style.display === 'none' ? 'block' : 'none';
  loadConsignacionDescriptions(); 
});