// viewPacientes.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const appPatients = initializeApp(firebaseConfigPatients, "patientsApp");
const dbPatients = getFirestore(appPatients);

// Referencias a los elementos de la interfaz
const tableBody = document.getElementById("table-body");
const btnPrevious = document.getElementById("btnPrevious");
const btnNext = document.getElementById("btnNext");
const pageNumber = document.getElementById("pageNumber");
const monthSelector = document.getElementById("monthSelector");
const yearSelector = document.getElementById("yearSelector");
const allFilterToggle = document.getElementById("allFilterToggle");
const btnDownload = document.getElementById("btnDownload");

// Variables de estado
let currentPage = 1;
const recordsPerPage = 100;
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();
let activeFilters = {};
let patientsList = [];
let filteredPatientsList = [];

// Funciones auxiliares
function formatDate(date) {
  if (!date) return "";
  if (typeof date === "object" && date.toDate) {
    const d = date.toDate();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  }
  return date;
}

async function loadPatients() {
  try {
    const patientsRef = collection(dbPatients, "pacientes");
    const patientsSnapshot = await getDocs(patientsRef);
    patientsList = patientsSnapshot.docs.map(doc => ({
      id: doc.id,
      entryDate: doc.data().entryDate || "",
      attribute: doc.data().attribute || "",
      insuranceName: doc.data().insuranceName || "",
      admission: doc.data().admission || "",
      patient: doc.data().patient || "",
      doctorName: doc.data().doctorName || "",
      surgeryDate: doc.data().surgeryDate || "",
      providerName: doc.data().providerName || "",
      status: doc.data().status || "",
      chargeDate: doc.data().chargeDate || "",
      report: doc.data().report || "",
      totalQuote: doc.data().totalQuote || "",
      creationDate: doc.data().creationDate || "",
      user: doc.data().user || ""
    }));
    filterPatientsByMonth();
  } catch (error) {
    console.error("Error al cargar pacientes:", error);
  }
}

function setupPacientesListener() {
  const pacientesRef = collection(dbPatients, "pacientes");
  onSnapshot(pacientesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "modified" || change.type === "added" || change.type === "removed") {
        loadPatients();
      }
    });
  });
}

window.toggleFilter = function(columnIndex) {
  const filterInput = document.getElementsByClassName("filter-input")[columnIndex - 1];
  filterInput.classList.toggle("hidden");
  if (!filterInput.classList.contains("hidden")) {
    filterInput.focus();
  } else {
    filterInput.value = "";
    delete activeFilters[columnIndex];
    filterTable(columnIndex);
  }
};

window.filterTable = function(columnIndex) {
  const filterInput = document.getElementsByClassName("filter-input")[columnIndex - 1];
  const filterValue = filterInput.value.trim().toLowerCase();

  if (filterValue) {
    activeFilters[columnIndex] = filterValue;
  } else {
    delete activeFilters[columnIndex];
  }

  const baseList = allFilterToggle.checked ? patientsList : patientsList.filter((patient) => {
    if (!patient.surgeryDate) return false;
    const surgeryDate = new Date(patient.surgeryDate);
    return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
  });

  let filteredData = [...baseList];
  Object.entries(activeFilters).forEach(([colIdx, value]) => {
    filteredData = filteredData.filter((patient) => {
      const values = [
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
        formatDate(patient.creationDate),
        patient.user || ""
      ];
      return values[parseInt(colIdx) - 1].toString().toLowerCase().includes(value);
    });
  });

  filteredPatientsList = filteredData;
  currentPage = 1;
  renderTable();
};

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

function filterPatientsByMonth() {
  filteredPatientsList = patientsList.filter((patient) => {
    if (!patient.surgeryDate) return false;
    const surgeryDate = new Date(patient.surgeryDate);
    return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
  });
  currentPage = 1;
  renderTable();
}

function renderTable() {
  tableBody.innerHTML = "";
  const totalPages = Math.ceil(filteredPatientsList.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredPatientsList.length);

  filteredPatientsList.sort((a, b) => {
    const dateA = a.surgeryDate ? new Date(a.surgeryDate) : new Date(0);
    const dateB = b.surgeryDate ? new Date(b.surgeryDate) : new Date(0);
    return dateA - dateB || (a.patient || "").localeCompare(b.patient || "") || (a.providerName || "").localeCompare(b.providerNameJune);
  });

  const paginatedPatients = filteredPatientsList.slice(startIndex, endIndex);
  paginatedPatients.forEach((patient) => {
    const row = document.createElement("tr");
    row.innerHTML = `
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
      <td>${formatDate(patient.creationDate)}</td>
      <td>${patient.user}</td>
    `;
    tableBody.appendChild(row);
  });

  pageNumber.textContent = `Página ${currentPage} de ${totalPages}`;
  btnPrevious.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages || totalPages === 0;
}

function downloadExcel() {
  const headers = [
    "Fecha Ingreso", "Atributo", "Previsión", "Admisión", "Nombre Paciente",
    "Médico", "Fecha Cirugía", "Proveedor", "Estado", "Fecha Cargo",
    "Informe", "Total Cotización", "Fecha Creación", "Usuario"
  ];
  
  const data = filteredPatientsList.map(patient => [
    formatDate(patient.entryDate),
    patient.attribute,
    patient.insuranceName,
    patient.admission,
    patient.patient,
    patient.doctorName,
    formatDate(patient.surgeryDate),
    patient.providerName,
    patient.status,
    formatDate(patient.chargeDate),
    patient.report,
    patient.totalQuote,
    formatDate(patient.creationDate),
    patient.user
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
  XLSX.writeFile(wb, `Pacientes_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  await loadPatients();
  setupPacientesListener();
  
  populateMonthSelector();
  populateYearSelector();

  monthSelector.addEventListener("change", (e) => {
    selectedMonth = Number(e.target.value);
    if (!allFilterToggle.checked) filterPatientsByMonth();
    else filterTable(1);
  });

  yearSelector.addEventListener("change", (e) => {
    selectedYear = Number(e.target.value);
    if (!allFilterToggle.checked) filterPatientsByMonth();
    else filterTable(1);
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

  btnDownload.addEventListener("click", downloadExcel);
});