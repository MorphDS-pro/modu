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
const surgeryDateFilter = document.getElementById("surgeryDateFilter");
const admissionFilter = document.getElementById("admissionFilter");
const downloadExcelBtn = document.getElementById("downloadExcelBtn");

// Variables globales
let currentPage = 1;
const recordsPerPage = 100;
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();
let selectedSurgeryDate = null;
let selectedAdmission = "";
let consumosList = [];
let filteredConsumosList = [];
let activeFilters = {};

// Función para formatear fechas a dd-mm-yyyy
function formatDate(date) {
  if (!date) return "";
  if (typeof date === "object" && date.toDate) date = date.toDate();
  else if (typeof date === "string") date = new Date(date);
  if (!(date instanceof Date) || isNaN(date)) return "";
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

// Función para formatear precios en pesos chilenos
function formatPrice(value) {
  const num = parseFloat(value) || 0;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Cargar consumos desde Firebase en tiempo real
function loadConsumos() {
  const consumosRef = collection(dbPatients, "consumos");
  onSnapshot(consumosRef, (snapshot) => {
    consumosList = snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    applyFilters();
  }, (error) => {
    console.error("Error al cargar consumos:", error);
  });
}

// Aplicar todos los filtros combinados
function applyFilters() {
  let baseList = [...consumosList];

  // Filtro por fecha exacta de cirugía (prioridad sobre mes/año)
  if (selectedSurgeryDate) {
    baseList = baseList.filter(consumo => {
      if (!consumo.surgeryDate) return false;
      const surgeryDate = new Date(consumo.surgeryDate);
      const filterDate = new Date(selectedSurgeryDate);
      return surgeryDate.getFullYear() === filterDate.getFullYear() &&
             surgeryDate.getMonth() === filterDate.getMonth() &&
             surgeryDate.getDate() === filterDate.getDate();
    });
  } else {
    // Filtro por mes y año si no hay fecha exacta
    baseList = baseList.filter(consumo => {
      if (!consumo.surgeryDate) return false;
      const surgeryDate = new Date(consumo.surgeryDate);
      return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
    });
  }

  // Filtro por admisión
  if (selectedAdmission) {
    baseList = baseList.filter(consumo => 
      (consumo.patientAdmission || "").toLowerCase().includes(selectedAdmission.toLowerCase())
    );
  }

  // Filtro por estado "pendiente" si se activa
  if (pendingFilterBtn.classList.contains("active")) {
    baseList = baseList.filter(consumo => consumo.status !== "cargado");
  }

  // Aplicar filtros de columna
  filteredConsumosList = baseList;
  Object.entries(activeFilters).forEach(([columnIndex, value]) => {
    filteredConsumosList = filteredConsumosList.filter(consumo => {
      const values = [
        consumo.status || "",
        formatPrice(consumo.sale),
        consumo.insurance || "",
        consumo.patientAdmission || "",
        consumo.patientName || "",
        consumo.doctor || "",
        formatDate(consumo.surgeryDate),
        consumo.provider || "",
        consumo.codeDescription || "",
        consumo.description || "",
        consumo.itemQuantity || "",
        formatPrice(consumo.systemPrice),
        consumo.grouping || "",
        formatPrice(consumo.totalItem)
      ];
      return values[parseInt(columnIndex)].toString().toLowerCase().includes(value.toLowerCase());
    });
  });

  currentPage = 1;
  renderTable();
}

// Crear fila de la tabla con la nueva columna "Estado"
function createRow(consumo) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="status-${consumo.status.toLowerCase().replace(/ /g, "-")}">${consumo.status}</td>

    <td>${consumo.insurance}</td>
    <td>${consumo.patientAdmission}</td>
    <td>${consumo.patientName}</td>
    <td>${consumo.doctor}</td>
    <td>${formatDate(consumo.surgeryDate)}</td>
    <td>${consumo.provider}</td>
    <td>${consumo.codeDescription}</td>
    <td>${consumo.description}</td>
    <td>${consumo.itemQuantity}</td>
    <td>${formatPrice(consumo.systemPrice)}</td>
    <td>${consumo.grouping}</td>
    <td>${formatPrice(consumo.totalItem)}</td>
        <td>${formatPrice(consumo.sale)}</td>
  `;
  return row;
}

// Renderizar la tabla
function renderTable() {
  tableBody.innerHTML = "";
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredConsumosList.length);

  filteredConsumosList.sort((a, b) => {
    const dateA = new Date(a.surgeryDate);
    const dateB = new Date(b.surgeryDate);
    if (dateA - dateB !== 0) return dateA - dateB;
    const admA = a.patientAdmission || "";
    const admB = b.patientAdmission || "";
    if (admA !== admB) return admA.localeCompare(admB);
    const provA = a.provider || "";
    const provB = b.provider || "";
    return provA.localeCompare(provB);
  });

  const paginatedConsumos = filteredConsumosList.slice(startIndex, endIndex);

  paginatedConsumos.forEach(consumo => {
    const row = createRow(consumo);
    tableBody.appendChild(row);
  });

  const totalPages = Math.ceil(filteredConsumosList.length / recordsPerPage);
  pageNumber.textContent = `Página ${currentPage} de ${totalPages}`;
  btnPrevious.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages || totalPages === 0;
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
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
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
      else {
        filterInput.value = "";
        delete activeFilters[index];
        applyFilters();
      }
    });
  });

  filterInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      const filterValue = input.value.trim();
      if (filterValue) {
        activeFilters[index] = filterValue;
      } else {
        delete activeFilters[index];
      }
      applyFilters();
    });
  });
}

// Descargar Excel del mes/año seleccionado
function downloadExcel() {
  const data = filteredConsumosList.map(consumo => ({
    Estado: consumo.status || "",
    Venta: formatPrice(consumo.sale),
    Previsión: consumo.insurance || "",
    "Admisión Paciente": consumo.patientAdmission || "",
    "Nombre del Paciente": consumo.patientName || "",
    Médico: consumo.doctor || "",
    "Fecha de Cirugía": formatDate(consumo.surgeryDate),
    Proveedor: consumo.provider || "",
    Código_descripción: consumo.codeDescription || "",
    Descripción: consumo.description || "",
    "Cantidad Item": consumo.itemQuantity || "",
    "Precio Sistema": formatPrice(consumo.systemPrice),
    Agrupación: consumo.grouping || "",
    "Total Item": formatPrice(consumo.totalItem)
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consumos");
  
  const monthName = monthSelector.options[monthSelector.selectedIndex].text;
  const fileName = `Consumos_${monthName}_${selectedYear}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// Mostrar el calendario al hacer clic en el input o la etiqueta
function setupDatePicker() {
  const surgeryDateLabel = document.querySelector('label[for="surgeryDateFilter"]');

  // Mostrar el picker al hacer clic en el input
  surgeryDateFilter.addEventListener("click", (event) => {
    event.preventDefault();
    surgeryDateFilter.showPicker();
  });

  // Mostrar el picker al hacer clic en la etiqueta
  surgeryDateLabel.addEventListener("click", (event) => {
    event.preventDefault();
    surgeryDateFilter.focus(); // Enfocar el input
    surgeryDateFilter.showPicker(); // Mostrar el calendario
  });
}

// Eventos
monthSelector.addEventListener("change", e => {
  selectedMonth = Number(e.target.value);
  selectedSurgeryDate = null;
  surgeryDateFilter.value = "";
  applyFilters();
});

yearSelector.addEventListener("change", e => {
  selectedYear = Number(e.target.value);
  selectedSurgeryDate = null;
  surgeryDateFilter.value = "";
  applyFilters();
});

btnPrevious.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

btnNext.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredConsumosList.length / recordsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

pendingFilterBtn.addEventListener("click", () => {
  selectedSurgeryDate = null;
  surgeryDateFilter.value = "";
  pendingFilterBtn.classList.toggle("active");
  allFilterBtn.classList.remove("active");
  applyFilters();
});

allFilterBtn.addEventListener("click", () => {
  selectedSurgeryDate = null;
  surgeryDateFilter.value = "";
  pendingFilterBtn.classList.remove("active");
  allFilterBtn.classList.add("active");
  applyFilters();
});

surgeryDateFilter.addEventListener("change", e => {
  selectedSurgeryDate = e.target.value;
  pendingFilterBtn.classList.remove("active");
  allFilterBtn.classList.remove("active");
  applyFilters();
});

admissionFilter.addEventListener("input", e => {
  selectedAdmission = e.target.value.trim();
  applyFilters();
});

downloadExcelBtn.addEventListener("click", downloadExcel);

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  populateMonthSelector();
  populateYearSelector();
  loadConsumos();
  setupFilterEvents();
  setupDatePicker(); // Configurar el picker de fechas
});