import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot // Añadido para el listener en tiempo real
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Configuración de Firebase para cargar listas (medicos, previsiones, providers)
const firebaseConfigLists = {
  apiKey: "AIzaSyDfz0_7v43TmV0rlFM9UhnVVHLFGtRWhGw",
  authDomain: "prestaciones-57dcd.firebaseapp.com",
  projectId: "prestaciones-57dcd",
  storageBucket: "prestaciones-57dcd.firebasestorage.app",
  messagingSenderId: "409471759723",
  appId: "1:409471759723:web:faa6812772f44baa3ec82e",
  measurementId: "G-0CZ9BMJWMV"
};

// Configuración de Firebase para guardar pacientes
const firebaseConfigPatients = {
  apiKey: "AIzaSyAREVJYLuZXqKAEzroVMtqEHvj1l2vE_lQ",
  authDomain: "implantes-d2fbd.firebaseapp.com",
  projectId: "implantes-d2fbd",
  storageBucket: "implantes-d2fbd.firebasestorage.app",
  messagingSenderId: "1063212294537",
  appId: "1:1063212294537:web:9e0cc7290109da704f4158",
  measurementId: "G-3XGJW3EHLQ"
};

// Inicializar Firebase
const appLists = initializeApp(firebaseConfigLists, "listsApp");
const dbLists = getFirestore(appLists);
const appPatients = initializeApp(firebaseConfigPatients, "patientsApp");
const dbPatients = getFirestore(appPatients);

// Referencias a los elementos del formulario y tabla (sin cambios)
const registerInsurance = document.getElementById("registerInsurance");
const insuranceOptions = document.getElementById("insuranceOptions");
const registerDoctor = document.getElementById("registerDoctor");
const doctorOptions = document.getElementById("doctorOptions");
const registerProvider = document.getElementById("registerProvider");
const providerOptions = document.getElementById("providerOptions");
const registerForm = document.getElementById("formRegisterContainer");
const tableBody = document.getElementById("table-body");

// Referencias al modal de edición (sin cambios)
const editModalOverlay = document.getElementById("editModalOverlay");
const editModal = document.getElementById("editModal");
const closeEditModal = document.getElementById("closeEditModal");
const saveChangesButton = document.getElementById("saveChangesButton");
const editModalEntryDate = document.getElementById("editModalEntryDate");
const editModalInsurance = document.getElementById("editModalInsurance");
const editModalInsuranceOptions = document.getElementById("editModalInsuranceOptions");
const editModalAdmission = document.getElementById("editModalAdmission");
const editModalPatient = document.getElementById("editModalPatient");
const editModalDoctor = document.getElementById("editModalDoctor");
const editModalDoctorOptions = document.getElementById("editModalDoctorOptions");
const editModalSurgeryDate = document.getElementById("editModalSurgeryDate");
const editModalProvider = document.getElementById("editModalProvider");
const editModalProviderOptions = document.getElementById("editModalProviderOptions");
const editModalStatus = document.getElementById("editModalStatus");
const editModalChargeDate = document.getElementById("editModalChargeDate");
const editModalReport = document.getElementById("editModalReport");
const editModalTotalQuote = document.getElementById("editModalTotalQuote");
const editModalTotalPending = document.getElementById("editModalTotalPending");

// Referencias a los elementos de paginación
const btnPrevious = document.getElementById("btnPrevious");
const btnNext = document.getElementById("btnNext");
const pageNumber = document.getElementById("pageNumber");

// Nuevas referencias a los selectores de mes y año
const monthSelector = document.getElementById("monthSelector");
const yearSelector = document.getElementById("yearSelector");

// Referencia al toggle de "todos los registros"
const allFilterToggle = document.getElementById("allFilterToggle");

// Variables de paginación
let currentPage = 1;
const recordsPerPage = 100;
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();
let activeFilters = {};
let previsionesList = [];
let medicosList = [];
let companiesList = [];
let patientsList = [];
let filteredPatientsList = [];

// Convertir YYYY-MM-DD a DD-MM-YYYY
function toDDMMYYYY(dateString) {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }
  return dateString;
}

// Convertir DD-MM-YYYY a YYYY-MM-DD
function toYYYYMMDD(dateString) {
  if (!dateString) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`;
  }
  return dateString;
}

// Formatear fechas
function formatDate(date) {
  if (!date) return "";
  if (typeof date === "object" && date.toDate) {
    const d = date.toDate();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return toDDMMYYYY(date);
  if (/^\d{2}-\d{2}-\d{4}$/.test(date)) return date;
  return "";
}

// Obtener número de semana
function getWeekNumber(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Mostrar spinner
function showSpinner(type) {
  const overlay = document.getElementById(`overlay${type}`);
  overlay.classList.remove("hidden");
}

// Ocultar spinner
function hideSpinner(type) {
  const overlay = document.getElementById(`overlay${type}`);
  overlay.classList.add("hidden");
}

// Mostrar mensajes
function showMessage(type, text) {
  const messageContainer = document.getElementById(`message${type.charAt(0).toUpperCase() + type.slice(1)}`);
  const textElement = document.getElementById(`${type}Text`);
  textElement.textContent = text;
  messageContainer.classList.remove("hidden");
  setTimeout(() => messageContainer.classList.add("hidden"), 5000);
}

// Mostrar opciones para inputs
function showOptions(input, ulElement, optionsList) {
  ulElement.innerHTML = "";
  optionsList.forEach((option) => {
    const li = document.createElement("li");
    li.textContent = option.name;
    li.dataset.id = option.id;
    li.addEventListener("click", () => {
      input.value = option.name;
      input.dataset.id = option.id;
      ulElement.style.display = "none";
    });
    ulElement.appendChild(li);
  });
  ulElement.style.display = "block";
}

// Filtrar opciones para inputs
function filterOptions(input, ulElement, optionsList) {
  const filter = input.value.toLowerCase();
  ulElement.innerHTML = "";
  const filteredOptions = optionsList.filter((option) => 
    option.name.toLowerCase().includes(filter)
  );
  filteredOptions.forEach((option) => {
    const li = document.createElement("li");
    li.textContent = option.name;
    li.dataset.id = option.id;
    li.addEventListener("click", () => {
      input.value = option.name;
      input.dataset.id = option.id;
      ulElement.style.display = "none";
    });
    ulElement.appendChild(li);
  });
  ulElement.style.display = filteredOptions.length > 0 ? "block" : "none";
}

// Cargar listas desde Firebase
async function loadPrevisions() {
  try {
    showSpinner("Loading");
    const previsionesRef = collection(dbLists, "previsiones");
    const previsionesSnapshot = await getDocs(previsionesRef);
    previsionesList = previsionesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().prevision || "Sin previsión"
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error al cargar previsiones:", error);
    showMessage("error", "No se pudieron cargar las previsiones.");
  } finally {
    hideSpinner("Loading");
  }
}

async function loadDoctors() {
  try {
    showSpinner("Loading");
    const medicosRef = collection(dbLists, "medicos");
    const medicosSnapshot = await getDocs(medicosRef);
    medicosList = medicosSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().medico || "Sin médico"
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error al cargar médicos:", error);
    showMessage("error", "No se pudieron cargar los médicos.");
  } finally {
    hideSpinner("Loading");
  }
}

async function loadProviders() {
  try {
    showSpinner("Loading");
    const companiesRef = collection(dbLists, "companies");
    const companiesSnapshot = await getDocs(companiesRef);
    companiesList = companiesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().empresa || "Sin empresa"
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error al cargar proveedores:", error);
    showMessage("error", "No se pudieron cargar los proveedores.");
  } finally {
    hideSpinner("Loading");
  }
}

async function loadPatients() {
  try {
    showSpinner("Loading");
    const patientsRef = collection(dbPatients, "pacientes");
    const patientsSnapshot = await getDocs(patientsRef);
    patientsList = patientsSnapshot.docs.map(doc => ({
      id: doc.id,
      entryDate: doc.data().entryDate || "",
      attribute: doc.data().attribute || "",
      insurance: doc.data().insurance || "",
      insuranceName: doc.data().insuranceName || "",
      admission: doc.data().admission || "",
      patient: doc.data().patient || "",
      doctor: doc.data().doctor || "",
      doctorName: doc.data().doctorName || "",
      surgeryDate: doc.data().surgeryDate || "",
      provider: doc.data().provider || "",
      providerName: doc.data().providerName || "",
      status: doc.data().status || "",
      chargeDate: doc.data().chargeDate || "",
      report: doc.data().report || "",
      totalQuote: doc.data().totalQuote || "",
      totalPending: doc.data().totalPending || "",
      creationDate: doc.data().creationDate || "",
      user: doc.data().user || ""
    }));
    filterPatientsByMonth();
  } catch (error) {
    console.error("Error al cargar pacientes:", error);
    showMessage("error", "No se pudieron cargar los pacientes.");
  } finally {
    hideSpinner("Loading");
  }
}

// Configurar eventos de inputs
function setupInputEvents(input, ulElement, optionsList) {
  input.addEventListener("click", () => showOptions(input, ulElement, optionsList));
  input.addEventListener("input", () => filterOptions(input, ulElement, optionsList));
  input.addEventListener("blur", () => setTimeout(() => ulElement.style.display = "none", 200));
}

// Mostrar/ocultar filtro
window.toggleFilter = function(columnIndex) {
  const filterInput = document.getElementsByClassName("filter-input")[columnIndex];
  filterInput.classList.toggle("hidden");
  if (!filterInput.classList.contains("hidden")) {
    filterInput.focus();
  } else {
    filterInput.value = "";
    delete activeFilters[columnIndex];
    filterTable(columnIndex);
  }
};

// Filtrar la tabla
window.filterTable = function(columnIndex) {
  const filterInput = document.getElementsByClassName("filter-input")[columnIndex];
  const filterValue = filterInput.value.trim().toLowerCase();

  if (filterValue) {
    activeFilters[columnIndex] = filterValue;
  } else {
    delete activeFilters[columnIndex];
  }

  // Determinar la base de datos a filtrar según el toggle
  const baseList = allFilterToggle.checked ? patientsList : patientsList.filter((patient) => {
    if (!patient.surgeryDate) return false;
    const surgeryDate = new Date(patient.surgeryDate);
    return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
  });

  // Aplicar filtros activos
  let filteredData = [...baseList];
  Object.entries(activeFilters).forEach(([colIdx, value]) => {
    filteredData = filteredData.filter((patient) => {
      const surgeryDate = patient.surgeryDate ? new Date(patient.surgeryDate) : null;
      const values = [
        "", // Acciones
        formatDate(patient.entryDate),
        patient.attribute || "",
        patient.insuranceName || "",
        patient.admission || "",
        patient.patient || "",
        patient.doctorName || "",
        formatDate(patient.surgeryDate),
        patient.providerName || "",
        patient.status || "",
        formatDate(patient.chargeDate),
        patient.report || "",
        patient.totalQuote || "",
        patient.totalPending || "",
        surgeryDate ? getWeekNumber(patient.surgeryDate).toString() : "",
        surgeryDate ? String(surgeryDate.getDate()).padStart(2, "0") : "",
        surgeryDate ? String(surgeryDate.getMonth() + 1).padStart(2, "0") : "",
        surgeryDate ? surgeryDate.getFullYear().toString() : "",
        (patient.admission + patient.providerName) || "",
        formatDate(patient.creationDate),
        patient.user || ""
      ];
      return values[parseInt(colIdx)].toString().toLowerCase().includes(value);
    });
  });

  filteredPatientsList = filteredData;
  currentPage = 1;
  renderTable();
};

// Llenar selectores de mes y año
function populateMonthSelector() {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  monthSelector.innerHTML = months.map((month, index) => 
    `<option value="${index}" ${index === selectedMonth ? "selected" : ""}>${month}</option>`
  ).join("");
}

function populateYearSelector() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;
  const endYear = currentYear + 1;
  yearSelector.innerHTML = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
    .map(year => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`)
    .join("");
}

// Filtrar por mes y año
function filterPatientsByMonth() {
  filteredPatientsList = patientsList.filter((patient) => {
    if (!patient.surgeryDate) return false;
    const surgeryDate = new Date(patient.surgeryDate);
    return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
  });
  currentPage = 1;
  renderTable();
}

// Renderizar tabla
function renderTable() {
  tableBody.innerHTML = "";
  const totalPages = Math.ceil(filteredPatientsList.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredPatientsList.length);

  filteredPatientsList.sort((a, b) => {
    const dateA = a.surgeryDate ? new Date(a.surgeryDate) : new Date(0);
    const dateB = b.surgeryDate ? new Date(b.surgeryDate) : new Date(0);
    if (dateA - dateB !== 0) return dateA - dateB;
    return (a.patient || "").localeCompare(b.patient || "") || (a.providerName || "").localeCompare(b.providerName || "");
  });

  const paginatedPatients = filteredPatientsList.slice(startIndex, endIndex);
  paginatedPatients.forEach((patient) => {
    const surgeryDate = patient.surgeryDate ? new Date(patient.surgeryDate) : null;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <i class="fas fa-eye" style="cursor:pointer; color:#3498db; margin-right:20px;" title="Editar" onclick="editRecord('${patient.id}')"></i>
        <i class="fas fa-trash delete-icon" style="cursor:pointer; color:#FF0000;" title="Eliminar" onclick="deleteRecord('${patient.id}')"></i>
      </td>
      <td>${formatDate(patient.entryDate)}</td>
      <td>${patient.attribute}</td>
      <td>${patient.insuranceName}</td>
      <td>${patient.admission}</td>
      <td>${patient.patient}</td>
      <td>${patient.doctorName}</td>
      <td>${formatDate(patient.surgeryDate)}</td>
      <td>${patient.providerName}</td>
      <td class="status-${patient.status.toLowerCase().replace(/ /g, "-")}">${patient.status}</td>
      <td>${formatDate(patient.chargeDate)}</td>
      <td>${patient.report}</td>
      <td>${patient.totalQuote}</td>
      <td>${patient.totalPending || ""}</td>
      <td>${surgeryDate ? getWeekNumber(patient.surgeryDate) : ""}</td>
      <td>${surgeryDate ? String(surgeryDate.getDate()).padStart(2, "0") : ""}</td>
      <td>${surgeryDate ? String(surgeryDate.getMonth() + 1).padStart(2, "0") : ""}</td>
      <td>${surgeryDate ? surgeryDate.getFullYear() : ""}</td>
      <td>${patient.admission + patient.providerName}</td>
      <td>${formatDate(patient.creationDate)}</td>
      <td>${patient.user}</td>
    `;
    tableBody.appendChild(row);
  });

  pageNumber.textContent = `Página ${currentPage} de ${totalPages}`;
  btnPrevious.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages || totalPages === 0;
}

// Nueva función: Listener en tiempo real para pacientes
function setupPacientesListener() {
  const pacientesRef = collection(dbPatients, "pacientes");
  onSnapshot(pacientesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "modified" || change.type === "added" || change.type === "removed") {
        loadPatients(); // Recargar pacientes cuando haya cambios
      }
    });
  });
}

// Guardar paciente
async function savePatient(event) {
  event.preventDefault();
  const patientData = {
    entryDate: document.getElementById("registerEntryDate").value,
    attribute: document.getElementById("registerAttribute").value,
    insurance: registerInsurance.dataset.id || "",
    insuranceName: registerInsurance.value || "",
    admission: document.getElementById("registerAdmission").value,
    patient: document.getElementById("registerPatient").value,
    doctor: registerDoctor.dataset.id || "",
    doctorName: registerDoctor.value || "",
    surgeryDate: document.getElementById("registerSurgeryDate").value,
    provider: registerProvider.dataset.id || "",
    providerName: registerProvider.value || "",
    status: document.getElementById("registerStatus").value,
    chargeDate: document.getElementById("registerChargeDate").value,
    report: document.getElementById("registerReport").value,
    totalQuote: document.getElementById("registerTotalQuote").value,
    totalPending: "",
    creationDate: serverTimestamp(),
    user: document.getElementById("registerUsuario").textContent
  };

  try {
    showSpinner("Register");
    const docRef = await addDoc(collection(dbPatients, "pacientes"), patientData);
    patientData.id = docRef.id;
    patientData.creationDate = new Date();
    patientsList.push(patientData);
    filterPatientsByMonth();
    showMessage("success", "Paciente agregado correctamente.");
    registerForm.reset();
    registerInsurance.dataset.id = "";
    registerDoctor.dataset.id = "";
    registerProvider.dataset.id = "";
  } catch (error) {
    console.error("Error al guardar paciente:", error);
    showMessage("error", "No se pudo agregar el paciente.");
  } finally {
    hideSpinner("Register");
  }
}

// Eliminar paciente
window.deleteRecord = async function(id) {
  const confirmationContainer = document.getElementById("confirmationDeleteContainerNew");
  const btnConfirmDelete = document.getElementById("btnConfirmDeleteNew");
  const btnCancelDelete = document.getElementById("btnCancelDeleteNew");
  const closeConfirmation = document.getElementById("closeConfirmationDeleteNew");

  confirmationContainer.classList.remove("hidden");

  const confirmDeletion = new Promise((resolve) => {
    btnConfirmDelete.onclick = () => resolve(true);
    btnCancelDelete.onclick = () => resolve(false);
    closeConfirmation.onclick = () => resolve(false);
  });

  const confirmed = await confirmDeletion;
  confirmationContainer.classList.add("hidden");

  if (confirmed) {
    try {
      showSpinner("Delete");
      const patientRef = doc(dbPatients, "pacientes", id);
      await deleteDoc(patientRef);
      patientsList = patientsList.filter((patient) => patient.id !== id);
      filteredPatientsList = filteredPatientsList.filter((patient) => patient.id !== id);
      renderTable();
      showMessage("success", "Paciente eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar paciente:", error);
      showMessage("error", "No se pudo eliminar el paciente.");
    } finally {
      hideSpinner("Delete");
    }
  }
};

// Editar paciente
window.editRecord = function(id) {
  const patient = patientsList.find((p) => p.id === id);
  if (!patient) return;

  editModalOverlay.style.display = "block";
  editModal.style.display = "block";

  editModalEntryDate.value = patient.entryDate || "";
  editModalInsurance.value = patient.insuranceName || "";
  editModalInsurance.dataset.id = patient.insurance || "";
  editModalAdmission.value = patient.admission || "";
  editModalPatient.value = patient.patient || "";
  editModalDoctor.value = patient.doctorName || "";
  editModalDoctor.dataset.id = patient.doctor || "";
  editModalSurgeryDate.value = patient.surgeryDate || "";
  editModalProvider.value = patient.providerName || "";
  editModalProvider.dataset.id = patient.provider || "";
  editModalStatus.value = patient.status || "";
  editModalChargeDate.value = patient.chargeDate || "";
  editModalReport.value = patient.report || "";
  editModalTotalQuote.value = patient.totalQuote || "";
  editModalTotalPending.value = patient.totalPending || "";

  setupInputEvents(editModalInsurance, editModalInsuranceOptions, previsionesList);
  setupInputEvents(editModalDoctor, editModalDoctorOptions, medicosList);
  setupInputEvents(editModalProvider, editModalProviderOptions, companiesList);

  saveChangesButton.onclick = async () => {
    const updatedData = {
      entryDate: editModalEntryDate.value,
      insurance: editModalInsurance.dataset.id || "",
      insuranceName: editModalInsurance.value || "",
      admission: editModalAdmission.value,
      patient: editModalPatient.value,
      doctor: editModalDoctor.dataset.id || "",
      doctorName: editModalDoctor.value || "",
      surgeryDate: editModalSurgeryDate.value,
      provider: editModalProvider.dataset.id || "",
      providerName: editModalProvider.value || "",
      status: editModalStatus.value,
      chargeDate: editModalChargeDate.value,
      report: editModalReport.value,
      totalQuote: editModalTotalQuote.value,
      totalPending: editModalTotalPending.value
    };

    try {
      showSpinner("Modify");
      const patientRef = doc(dbPatients, "pacientes", id);
      await updateDoc(patientRef, updatedData);
      const patientIndex = patientsList.findIndex((p) => p.id === id);
      const filteredIndex = filteredPatientsList.findIndex((p) => p.id === id);
      if (patientIndex !== -1) Object.assign(patientsList[patientIndex], updatedData);
      if (filteredIndex !== -1) Object.assign(filteredPatientsList[filteredIndex], updatedData);
      renderTable();
      showMessage("success", "Paciente actualizado correctamente.");
      editModalOverlay.style.display = "none";
      editModal.style.display = "none";
    } catch (error) {
      console.error("Error al actualizar paciente:", error);
      showMessage("error", "No se pudo actualizar el paciente.");
    } finally {
      hideSpinner("Modify");
    }
  };

  closeEditModal.onclick = () => {
    editModalOverlay.style.display = "none";
    editModal.style.display = "none";
  };

  editModalOverlay.onclick = (event) => {
    if (event.target === editModalOverlay) {
      editModalOverlay.style.display = "none";
      editModal.style.display = "none";
    }
  };
};

// Eventos de paginación
btnPrevious.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

btnNext.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredPatientsList.length / recordsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadPrevisions(),
    loadDoctors(),
    loadProviders(),
    loadPatients()
  ]);

  setupInputEvents(registerInsurance, insuranceOptions, previsionesList);
  setupInputEvents(registerDoctor, doctorOptions, medicosList);
  setupInputEvents(registerProvider, providerOptions, companiesList);

  registerForm.addEventListener("submit", savePatient);

  populateMonthSelector();
  populateYearSelector();

  monthSelector.addEventListener("change", (e) => {
    selectedMonth = Number(e.target.value);
    if (!allFilterToggle.checked) filterPatientsByMonth();
    else filterTable(0);
  });

  yearSelector.addEventListener("change", (e) => {
    selectedYear = Number(e.target.value);
    if (!allFilterToggle.checked) filterPatientsByMonth();
    else filterTable(0);
  });

  allFilterToggle.addEventListener("change", (e) => {
    activeFilters = {};
    const filterInputs = document.querySelectorAll(".filter-input");
    filterInputs.forEach(input => input.value = "");
    if (e.target.checked) {
      filteredPatientsList = [...patientsList];
    } else {
      filterPatientsByMonth();
    }
    renderTable();
  });

  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.addEventListener('click', (event) => {
      event.preventDefault();
      input.showPicker();
    });
  });

  // Evento para importar Excel (sin cambios aquí)
  document.getElementById("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      showSpinner("Import");
      const overlayImport = document.getElementById("overlayImport");
      const spinnerContainer = document.getElementById("spinnerContainerImport");
      spinnerContainer.innerHTML = `
        <div class="lds-dual-ring-progress">
          <div class="progress-ring" id="progressRing"></div>
        </div>
        <div class="loading-text" id="loadingTextImportProgress">Cargando <span id="progressPercentage">0%</span></div>
      `;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData[0].map(header => header ? header.toString().trim().toLowerCase() : "");
        const rows = jsonData.slice(1);
        const totalRows = rows.length;
        let processedRows = 0;
        let successfulImports = 0;

        function parseDate(dateStr) {
          if (!dateStr) return "";
          if (!isNaN(dateStr)) {
            const excelDate = parseInt(dateStr, 10);
            const date = new Date((excelDate - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
          }
          let dateParts = null;
          if (dateStr.includes("/")) dateParts = dateStr.split("/");
          else if (dateStr.includes("-")) dateParts = dateStr.split("-");
          if (dateParts && dateParts.length === 3) {
            let day, month, year;
            if (dateParts[0].length <= 2 && dateParts[1].length <= 2) {
              day = parseInt(dateParts[0], 10);
              month = parseInt(dateParts[1], 10) - 1;
              year = parseInt(dateParts[2], 10);
            } else if (dateParts[2].length === 4) {
              year = parseInt(dateParts[0], 10);
              month = parseInt(dateParts[1], 10) - 1;
              day = parseInt(dateParts[2], 10);
            }
            if (day && month !== undefined && year) {
              const date = new Date(year, month, day);
              if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
            }
          }
          console.warn("Fecha no válida:", dateStr);
          return "";
        }

        for (const row of rows) {
          if (!row.length) continue;
          const patientData = {
            entryDate: "",
            attribute: "",
            insurance: "",
            insuranceName: "",
            admission: "",
            patient: "",
            doctor: "",
            doctorName: "",
            surgeryDate: "",
            provider: "",
            providerName: "",
            status: "",
            chargeDate: "",
            report: "",
            totalQuote: "",
            totalPending: "",
            creationDate: serverTimestamp(),
            user: document.getElementById("registerUsuario").textContent || "Usuario desconocido"
          };

          for (let i = 0; i < headers.length; i++) {
            if (i >= row.length) continue;
            const value = row[i] !== undefined ? row[i].toString().trim() : "";
            switch (headers[i]) {
              case "fecha ingreso": patientData.entryDate = parseDate(value); break;
              case "atributo": patientData.attribute = value; break;
              case "prevision":
              case "previsión":
                patientData.insuranceName = value || "Sin previsión";
                const prevision = previsionesList.find(p => p.name.toLowerCase() === value.toLowerCase());
                patientData.insurance = prevision ? prevision.id : "";
                break;
              case "admisión": patientData.admission = value; break;
              case "nombre paciente": patientData.patient = value; break;
              case "médico":
                patientData.doctorName = value || "Sin médico";
                const doctor = medicosList.find(d => d.name.toLowerCase() === value.toLowerCase());
                patientData.doctor = doctor ? doctor.id : "";
                break;
              case "fecha cirugía": patientData.surgeryDate = parseDate(value); break;
              case "proveedor":
                patientData.providerName = value || "Sin empresa";
                const provider = companiesList.find(c => c.name.toLowerCase() === value.toLowerCase());
                patientData.provider = provider ? provider.id : "";
                break;
              case "estado": patientData.status = value; break;
              case "fecha cargo": patientData.chargeDate = parseDate(value); break;
              case "informe": patientData.report = value; break;
              case "total cotización": patientData.totalQuote = value ? parseFloat(value) || "" : ""; break;
              case "total a actualizar pend.": patientData.totalPending = value ? parseFloat(value) || "" : ""; break;
            }
          }

          if (!patientData.patient || !patientData.surgeryDate) {
            console.warn("Fila omitida: Nombre del paciente o Fecha de cirugía vacíos", patientData);
            processedRows++;
            updateProgress(processedRows, totalRows);
            continue;
          }

          try {
            const docRef = await addDoc(collection(dbPatients, "pacientes"), patientData);
            const patientId = docRef.id;
            const localPatientData = { ...patientData, id: patientId, creationDate: new Date() };
            patientsList.push(localPatientData);
            filteredPatientsList.push(localPatientData);
            successfulImports++;
            processedRows++;
            updateProgress(processedRows, totalRows);
          } catch (error) {
            console.error("Error al importar fila:", error);
            processedRows++;
            updateProgress(processedRows, totalRows);
          }
        }

        filterPatientsByMonth();
        filteredPatientsList.sort((a, b) => {
          const dateA = a.surgeryDate ? new Date(a.surgeryDate) : new Date(0);
          const dateB = b.surgeryDate ? new Date(b.surgeryDate) : new Date(0);
          return dateA - dateB || a.patient.localeCompare(b.patient) || a.providerName.localeCompare(b.providerName);
        });
        renderTable();
        showMessage("success", `Importación completada. Se cargaron ${successfulImports} filas exitosamente de ${totalRows} filas totales.`);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error al importar pacientes:", error);
      showMessage("error", "No se pudieron importar los pacientes.");
    } finally {
      hideSpinner("Import");
      event.target.value = "";
    }
  });
});

function updateProgress(processed, total) {
  const percentage = Math.round((processed / total) * 100);
  const progressPercentage = document.getElementById("progressPercentage");
  const progressRing = document.getElementById("progressRing");
  if (progressPercentage && progressRing) {
    progressPercentage.textContent = `${percentage}%`;
    progressRing.style.background = `conic-gradient(#3498db ${percentage}%, #eee ${percentage}%)`;
  }
}