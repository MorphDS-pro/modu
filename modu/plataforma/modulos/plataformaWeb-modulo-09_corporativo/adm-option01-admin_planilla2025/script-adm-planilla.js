import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getFirestore, collection, getDocs, doc, writeBatch 
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

function excelDateToJSDate(serial) {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

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
    
    // Convertir a string para concatenar correctamente
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
      cadena  // Columna CADENA calculada
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
    overlayLoading.classList.add("show"); // Añadir clase show para animación
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

      await new Promise(resolve => setTimeout(resolve, 10)); // Retraso para visibilidad
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

async function batchDeleteCollection() {
  try {
    const colRef = collection(db, "implantes");
    const snapshot = await getDocs(colRef);
    const totalDocs = snapshot.docs.length;
    let processedDocs = 0;
    let batch = writeBatch(db);
    let batchCounter = 0;

    for (let i = 0; i < totalDocs; i++) {
      const docRef = doc(db, "implantes", snapshot.docs[i].id);
      batch.delete(docRef);
      batchCounter++;
      processedDocs++;
      const progress = Math.floor((processedDocs / totalDocs) * 100);
      document.getElementById("delete-progress-text").textContent = progress + "%";

      if (batchCounter === 500 || i === totalDocs - 1) {
        await batch.commit();
        batch = writeBatch(db);
        batchCounter = 0;
      }
    }
  } catch (error) {
    console.error("Error al vaciar la colección:", error);
  }
}

async function batchImportData(jsonData) {
  try {
    const totalRows = jsonData.length;
    let processedRows = 0;
    let batch = writeBatch(db);
    let batchCounter = 0;

    for (let i = 0; i < totalRows; i++) {
      const row = jsonData[i];

      const dateFields = [
        "FECHA_CIRUGIA",
        "FECHA_RECEPCION",
        "FECHA_CARGO",
        "FECHA_EMISION",
        "FECHA_INGRESO",
        "FECHA_VENCIMIENTO"
      ];
      dateFields.forEach(field => {
        if (row[field] !== "") {
          let dateValue;
          if (row[field] instanceof Date) {
            dateValue = row[field];
          } else if (typeof row[field] === "number") {
            dateValue = excelDateToJSDate(row[field]);
          }
          if (dateValue) {
            row[field] = dateValue.toLocaleDateString("es-ES");
          }
        }
      });

      if (row.hasOwnProperty("PRECIO_UNITARIO") && row["PRECIO_UNITARIO"] !== "") {
        let val = row["PRECIO_UNITARIO"];
        if (typeof val === "number") {
          row["PRECIO_UNITARIO"] = val;
        } else if (typeof val === "string") {
          const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
          row["PRECIO_UNITARIO"] = isNaN(num) ? val : num;
        }
      }
      if (row.hasOwnProperty("OC_MONTO") && row["OC_MONTO"] !== "") {
        let val = row["OC_MONTO"];
        if (typeof val === "number") {
          row["OC_MONTO"] = val;
        } else if (typeof val === "string") {
          const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
          row["OC_MONTO"] = isNaN(num) ? val : num;
        }
      }

      const newDocRef = doc(collection(db, "implantes"));
      batch.set(newDocRef, row);
      batchCounter++;
      processedRows++;
      const progress = Math.floor((processedRows / totalRows) * 100);
      document.getElementById("progress-text").textContent = progress + "%";

      if (batchCounter === 500 || i === totalRows - 1) {
        await batch.commit();
        batch = writeBatch(db);
        batchCounter = 0;
      }
    }
  } catch (error) {
    console.error("Error al importar los datos:", error);
  }
}

document.getElementById("btnDownload").addEventListener("click", async () => {
  const overlayDelete = document.getElementById("overlayDelete");
  overlayDelete.classList.remove("hidden");
  overlayDelete.classList.add("show");

  await batchDeleteCollection();

  overlayDelete.classList.remove("show");
  overlayDelete.classList.add("hidden");
  updateTable();
});

document.getElementById("btnImport").addEventListener("click", async () => {
  const overlayImport = document.getElementById("overlayImport");
  overlayImport.classList.remove("hidden");
  overlayImport.classList.add("show");
  document.getElementById("progress-text").textContent = "0%";

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx, .xls";
  input.style.display = "none";
  document.body.appendChild(input);

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      overlayImport.classList.remove("show");
      overlayImport.classList.add("hidden");
      input.remove();
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });
        console.log("Datos leídos:", jsonData.length, "registros");

        await batchImportData(jsonData);
        updateTable();
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
      } finally {
        overlayImport.classList.remove("show");
        overlayImport.classList.add("hidden");
        input.remove();
      }
    };
    reader.readAsBinaryString(file);
  };

  window.addEventListener("focus", function onFocus() {
    setTimeout(() => {
      if (!input.files || input.files.length === 0) {
        overlayImport.classList.remove("show");
        overlayImport.classList.add("hidden");
        input.remove();
      }
    }, 500);
    window.removeEventListener("focus", onFocus);
  });

  input.click();
});

document.addEventListener("DOMContentLoaded", async () => {
  await updateTable();
});

window.toggleFilter = toggleFilter;
window.filterTable = filterTable;