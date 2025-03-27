import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getFirestore, collection, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDRpskUwmGXFrTggbUEEwG3_-5M6Sznq9Y",
  authDomain: "corporativo-3a3f2.firebaseapp.com",
  projectId: "corporativo-3a3f2",
  storageBucket: "corporativo-3a3f2.firebasestorage.app",
  messagingSenderId: "2416210110",
  appId: "1:2416210110:web:f3321faa969bf3d6ef2eef",
  measurementId: "G-J29C5HPX5C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function formatPesoChileno(value) {
  let num = (typeof value === "number") ? value : parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(num);
}

function parseDateFromString(dateStr) {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return new Date(0);
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

let tableData = [];      
let filteredData = [];   
let filters = {};         
let currentPage = 1;
const rowsPerPage = 200;

const columnsMapping = [
  "", 
  "ID_PACIENTE",
  "PACIENTE",
  "MEDICO",
  "FECHA_CIRUGIA",
  "PROVEEDOR",
  "CODIGO_CLINICA",
  "CODIGO_PROVEEDOR",
  "CANTIDAD",
  "PRECIO_UNITARIO",
  "ATRIBUTO",
  "OC",
  "OC_MONTO",
  "ESTADO",
  "FECHA_RECEPCION",
  "FECHA_CARGO",
  "NUMERO_GUIA",
  "NUMERO_FACTURA",
  "FECHA_EMISION",
  "FECHA_INGRESO",
  "LOTE",
  "FECHA_VENCIMIENTO",
  "CADENA"
];

function toggleFilter(index) {
  const filterInputs = document.querySelectorAll('.filter-input');
  const input = filterInputs[index];
  if (input.classList.contains('hidden')) {
    input.classList.remove('hidden');
    input.focus();
  } else {
    input.classList.add('hidden');
    input.value = "";
    filterTable(index); 
  }
}

function filterTable(index) {
  const filterInputs = document.querySelectorAll('.filter-input');
  const input = filterInputs[index];
  const filterValue = input.value.trim().toLowerCase();
  const columnKey = columnsMapping[index + 1];
  
  if (!columnKey) return;
  
  filters[columnKey] = filterValue;
  applyFilters();
}

function renderTablePage() {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach(data => {
    const tr = document.createElement("tr");
    
    const cadena = 
      (data["ID_PACIENTE"] != null ? data["ID_PACIENTE"].toString() : "") + 
      (data["CODIGO_CLINICA"] != null ? data["CODIGO_CLINICA"].toString() : "");

    const columns = [
      "", 
      data["ID_PACIENTE"] || "",
      data["PACIENTE"] || "",
      data["MEDICO"] || "",
      data["FECHA_CIRUGIA"] || "",
      data["PROVEEDOR"] || "",
      data["CODIGO_CLINICA"] || "",
      data["CODIGO_PROVEEDOR"] || "",
      data["CANTIDAD"] || "",
      data["PRECIO_UNITARIO"] || "",
      data["ATRIBUTO"] || "",
      data["OC"] || "",
      data["OC_MONTO"] || "",
      data["ESTADO"] || "",
      data["FECHA_RECEPCION"] || "",
      data["FECHA_CARGO"] || "",
      data["NUMERO_GUIA"] || "",
      data["NUMERO_FACTURA"] || "",
      data["FECHA_EMISION"] || "",
      data["FECHA_INGRESO"] || "",
      data["LOTE"] || "",
      data["FECHA_VENCIMIENTO"] || "",
      cadena
    ];
    
    columns.forEach(colValue => {
      const td = document.createElement("td");
      td.textContent = colValue;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function updatePagination() {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pageNumberSpan = document.getElementById("pageNumber");
  pageNumberSpan.textContent = `Página ${currentPage} de ${totalPages}`;
  
  const recordCountSpan = document.getElementById("recordCount");
  if (filteredData.length !== tableData.length) {
    recordCountSpan.textContent = ` * Se ha filtrado ${filteredData.length} registros de ${tableData.length} totales.`;
  } else {
    recordCountSpan.textContent = ` * Se han encontrado ${tableData.length} registros.`;
  }
  
  document.getElementById("btnPrevious").disabled = currentPage === 1;
  document.getElementById("btnNext").disabled = currentPage === totalPages;
}

function applyFilters() {
  filteredData = tableData.filter(row => {
    let include = true;
    for (let key in filters) {
      if (filters[key]) {
        let cellValue = "";
        if (key === "CADENA") {
          cellValue = (
            (row["ID_PACIENTE"] != null ? row["ID_PACIENTE"].toString() : "") + 
            (row["CODIGO_CLINICA"] != null ? row["CODIGO_CLINICA"].toString() : "")
          ).toLowerCase();
        } else {
          cellValue = row[key] ? row[key].toString().toLowerCase() : "";
        }
        const searchTerms = filters[key].split(" ").filter(term => term.trim() !== "");
        for (let term of searchTerms) {
          if (!cellValue.includes(term)) {
            include = false;
            break;
          }
        }
        if (!include) break;
      }
    }
    return include;
  });

  filteredData.sort((a, b) => {
    const fechaA = a["FECHA_CIRUGIA"] ? parseDateFromString(a["FECHA_CIRUGIA"]) : new Date(0);
    const fechaB = b["FECHA_CIRUGIA"] ? parseDateFromString(b["FECHA_CIRUGIA"]) : new Date(0);
    if (fechaA < fechaB) return -1;
    if (fechaA > fechaB) return 1;
    
    const pacienteA = a["PACIENTE"] ? a["PACIENTE"].toLowerCase() : "";
    const pacienteB = b["PACIENTE"] ? b["PACIENTE"].toLowerCase() : "";
    if (pacienteA < pacienteB) return -1;
    if (pacienteA > pacienteB) return 1;
    
    const proveedorA = a["PROVEEDOR"] ? a["PROVEEDOR"].toLowerCase() : "";
    const proveedorB = b["PROVEEDOR"] ? b["PROVEEDOR"].toLowerCase() : "";
    if (proveedorA < proveedorB) return -1;
    if (proveedorA > proveedorB) return 1;
    
    return 0;
  });
  
  currentPage = 1;
  renderTablePage();
  updatePagination();
}

async function updateTable() {
  const overlayLoading = document.getElementById("overlayLoading");
  const progressText = document.getElementById("progressPercentageLoading");
  const progressRing = document.getElementById("progressRingLoading");

  if (!overlayLoading || !progressText || !progressRing) {
    console.error("No se encontraron los elementos del overlayLoading");
    return;
  }

  try {
    overlayLoading.classList.remove("hidden");
    overlayLoading.classList.add("show");
    progressText.textContent = "0%";
    progressRing.style.background = "conic-gradient(#3498db 0%, #eee 0%)";

    const colRef = collection(db, "implantes");
    const snapshot = await getDocs(colRef);
    const totalDocs = snapshot.size;
    let processedDocs = 0;

    tableData = [];

    const docsArray = snapshot.docs;

    for (const docSnap of docsArray) {
      const data = docSnap.data();
      
      if (data["PRECIO_UNITARIO"]) {
        data["PRECIO_UNITARIO"] = formatPesoChileno(data["PRECIO_UNITARIO"]);
      }
      if (data["OC_MONTO"]) {
        data["OC_MONTO"] = formatPesoChileno(data["OC_MONTO"]);
      }
      
      tableData.push(data);
      processedDocs++;
      const progress = Math.floor((processedDocs / totalDocs) * 100);
      progressText.textContent = `${progress}%`;
      progressRing.style.background = `conic-gradient(#3498db ${progress}%, #eee ${progress}%)`;

      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    tableData.sort((a, b) => {
      const fechaA = a["FECHA_CIRUGIA"] ? parseDateFromString(a["FECHA_CIRUGIA"]) : new Date(0);
      const fechaB = b["FECHA_CIRUGIA"] ? parseDateFromString(b["FECHA_CIRUGIA"]) : new Date(0);
      if (fechaA < fechaB) return -1;
      if (fechaA > fechaB) return 1;
      
      const pacienteA = a["PACIENTE"] ? a["PACIENTE"].toLowerCase() : "";
      const pacienteB = b["PACIENTE"] ? b["PACIENTE"].toLowerCase() : "";
      if (pacienteA < pacienteB) return -1;
      if (pacienteA > pacienteB) return 1;
      
      const proveedorA = a["PROVEEDOR"] ? a["PROVEEDOR"].toLowerCase() : "";
      const proveedorB = b["PROVEEDOR"] ? b["PROVEEDOR"].toLowerCase() : "";
      if (proveedorA < proveedorB) return -1;
      if (proveedorA > proveedorB) return 1;
      
      return 0;
    });
    
    filteredData = tableData.slice();
    currentPage = 1;
    renderTablePage();
    updatePagination();

    overlayLoading.classList.remove("show");
    overlayLoading.classList.add("hidden");
  } catch (error) {
    console.error("Error al cargar los registros:", error);
    overlayLoading.classList.remove("show");
    overlayLoading.classList.add("hidden");
    alert("Error al cargar los registros: " + error.message);
  }
}

document.getElementById("btnPrevious").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTablePage();
    updatePagination();
  }
});

document.getElementById("btnNext").addEventListener("click", () => {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTablePage();
    updatePagination();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await updateTable();
});

window.toggleFilter = toggleFilter;
window.filterTable = filterTable;