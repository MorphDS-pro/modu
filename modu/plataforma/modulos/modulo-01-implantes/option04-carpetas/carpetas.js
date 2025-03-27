import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Configuración de Firebase para pacientes
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

// Referencias a los elementos del DOM
const tableBody = document.getElementById("table-body");
const monthSelector = document.getElementById("monthSelector");
const yearSelector = document.getElementById("yearSelector");
const btnPrevious = document.getElementById("btnPrevious");
const btnNext = document.getElementById("btnNext");
const pageNumber = document.getElementById("pageNumber");
const pendingFilterBtn = document.getElementById("pendingFilterBtn");
const allFilterBtn = document.getElementById("allFilterBtn");
const pdfModal = document.getElementById("pdfModal");
const pdfModalOverlay = document.getElementById("pdfModalOverlay");
const closePdfModal = document.getElementById("closePdfModal");
const patientNameSpan = document.getElementById("patientName");
const pdfList = document.getElementById("pdfList");

// Variables globales
let currentPage = 1;
const recordsPerPage = 10;
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();
let pacientesList = [];
let filteredPacientesList = [];
let currentAdmission = null;

// Función para formatear fechas a dd-mm-yyyy
function formatDate(date) {
  if (!date) return "";
  if (typeof date === "object" && date.toDate) date = date.toDate();
  else if (typeof date === "string") date = new Date(date);
  if (!(date instanceof Date) || isNaN(date)) return "";
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

// Cargar pacientes desde Firestore en tiempo real
function loadPacientes() {
  const pacientesRef = collection(dbPatients, "pacientes");
  onSnapshot(pacientesRef, (snapshot) => {
    pacientesList = snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    filterPacientesByMonth();
  }, (error) => {
    console.error("Error al cargar pacientes:", error);
  });
}

// Filtrar pacientes por mes y año
function filterPacientesByMonth() {
  filteredPacientesList = pacientesList.filter(paciente => {
    if (!paciente.surgeryDate) return false;
    const surgeryDate = new Date(paciente.surgeryDate);
    return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
  });
  currentPage = 1;
  renderTable();
}

// Filtrar registros pendientes
function filterPending() {
  filteredPacientesList = pacientesList.filter(paciente => {
    if (!paciente.surgeryDate) return false;
    const surgeryDate = new Date(paciente.surgeryDate);
    return surgeryDate.getMonth() === selectedMonth && 
           surgeryDate.getFullYear() === selectedYear && 
           (!paciente.status || paciente.status !== "completado");
  });
  currentPage = 1;
  renderTable();
}

// Crear fila de la tabla
function createRow(paciente) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><button class="view-pdfs" data-admission="${paciente.admission}">Ver PDFs</button></td>
    <td>${paciente.admission}</td>
    <td>${paciente.patient}</td>
    <td>${formatDate(paciente.surgeryDate)}</td>
    <td>${paciente.doctorName}</td>
  `;
  return row;
}

// Renderizar la tabla
function renderTable() {
  tableBody.innerHTML = "";
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredPacientesList.length);

  filteredPacientesList.sort((a, b) => {
    const dateA = new Date(a.surgeryDate);
    const dateB = new Date(b.surgeryDate);
    if (dateA - dateB !== 0) return dateA - dateB;
    const admA = a.admission || "";
    const admB = b.admission || "";
    return admA.localeCompare(admB);
  });

  const paginatedPacientes = filteredPacientesList.slice(startIndex, endIndex);

  paginatedPacientes.forEach(paciente => {
    const row = createRow(paciente);
    tableBody.appendChild(row);

    const viewButton = row.querySelector(".view-pdfs");
    viewButton.addEventListener("click", () => showPdfModal(paciente.admission, paciente.patient));
  });

  const totalPages = Math.ceil(filteredPacientesList.length / recordsPerPage);
  pageNumber.textContent = `Página ${currentPage} de ${totalPages}`;
  btnPrevious.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages || totalPages === 0;
}

// Mostrar el modal con los PDFs del paciente
function showPdfModal(admission, patientName) {
  currentAdmission = admission;
  patientNameSpan.textContent = patientName;
  pdfModalOverlay.classList.add("visible");
  pdfModal.classList.add("visible");
  loadPdfs(admission);
}

// Cargar los PDFs desde Firestore (enlaces de OneDrive)
function loadPdfs(admission) {
  const paciente = pacientesList.find(p => p.admission === admission);
  pdfList.innerHTML = "";
  if (!paciente || !paciente.pdfLinks || paciente.pdfLinks.length === 0) {
    pdfList.innerHTML = "<p>No hay PDFs subidos para este paciente.</p>";
  } else {
    paciente.pdfLinks.forEach((link, index) => {
      const pdfItem = document.createElement("div");
      pdfItem.className = "pdf-item";
      pdfItem.innerHTML = `<a href="${link}" target="_blank">PDF ${index + 1}</a>`;
      pdfList.appendChild(pdfItem);
    });
  }
}

// Poblar selectores de mes y año
function populateMonthSelector() {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  monthSelector.innerHTML = months.map((month, index) => 
    `<option value="${index}" ${index === selectedMonth ? "selected" : ""}>${month}</option>`
  ).join("");
}

function populateYearSelector() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
  yearSelector.innerHTML = years.map(year => 
    `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`
  ).join("");
}

// Configurar eventos de filtros de columna
function setupFilterEvents() {
  const filterIcons = document.querySelectorAll(".filter-icon");
  const filterInputs = document.querySelectorAll(".filter-input");

  filterIcons.forEach((icon, index) => {
    icon.addEventListener("click", () => {
      const filterInput = document.querySelector(`th:nth-child(${index + 1}) .filter-input`);
      filterInput.classList.toggle("hidden");
      if (!filterInput.classList.contains("hidden")) filterInput.focus();
    });
  });

  filterInputs.forEach((input, index) => {
    input.addEventListener("keyup", () => {
      const filterValue = input.value.toLowerCase();
      const rows = tableBody.getElementsByTagName("tr");
      for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].getElementsByTagName("td")[index];
        if (cell) {
          const cellText = cell.textContent.toLowerCase();
          rows[i].style.display = cellText.includes(filterValue) ? "" : "none";
        }
      }
    });
  });
}

// Eventos
monthSelector.addEventListener("change", e => {
  selectedMonth = Number(e.target.value);
  filterPacientesByMonth();
});

yearSelector.addEventListener("change", e => {
  selectedYear = Number(e.target.value);
  filterPacientesByMonth();
});

btnPrevious.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

btnNext.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredPacientesList.length / recordsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

pendingFilterBtn.addEventListener("click", filterPending);
allFilterBtn.addEventListener("click", filterPacientesByMonth);

closePdfModal.addEventListener("click", () => {
  pdfModalOverlay.classList.remove("visible");
  pdfModal.classList.remove("visible");
});

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  populateMonthSelector();
  populateYearSelector();
  loadPacientes();
  setupFilterEvents();
});