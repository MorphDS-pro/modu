import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
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

// Configuración de Firebase para códigos
const firebaseConfigCodes = {
  apiKey: "AIzaSyDfz0_7v43TmV0rlFM9UhnVVHLFGtRWhGw",
  authDomain: "prestaciones-57dcd.firebaseapp.com",
  projectId: "prestaciones-57dcd",
  storageBucket: "prestaciones-57dcd.firebasestorage.app",
  messagingSenderId: "409471759723",
  appId: "1:409471759723:web:faa6812772f44baa3ec82e",
  measurementId: "G-0CZ9BMJWMV"
};

// Configuración de Firebase para consignaciones (usada para historial)
const firebaseConfigConsignaciones = {
  apiKey: "AIzaSyDlOW1-vrW4uiXrveFPoBcJ1ImZlPqzzlA",
  authDomain: "consignaciones-ee423.firebaseapp.com",
  projectId: "consignaciones-ee423",
  storageBucket: "consignaciones-ee423.firebasestorage.app",
  messagingSenderId: "992838229253",
  appId: "1:992838229253:web:38462a4886e4ede6a7ab6c",
  measurementId: "G-K58BRH151H"
};

// Inicializar Firebase
const appPatients = initializeApp(firebaseConfigPatients, "patientsApp");
const dbPatients = getFirestore(appPatients);
const appCodes = initializeApp(firebaseConfigCodes, "codesApp");
const dbCodes = getFirestore(appCodes);
const appConsignaciones = initializeApp(firebaseConfigConsignaciones, "consignacionesApp");
const dbConsignaciones = getFirestore(appConsignaciones);

// Usar la misma configuración para historial
const appHistorial = initializeApp(firebaseConfigConsignaciones, "historialApp");
const dbHistorial = getFirestore(appHistorial);

// Elementos del DOM
const registerAdmission = document.getElementById("registerAdmission");
const registerInsurance = document.getElementById("registerInsurance");
const registerPatient = document.getElementById("registerPatient");
const registerDoctor = document.getElementById("registerDoctor");
const registerSurgeryDate = document.getElementById("registerSurgeryDate");
const registerProvider = document.getElementById("registerProvider");
const registerReference = document.getElementById("registerReference");
const registerCode = document.getElementById("registerCode");
const registerDescription = document.getElementById("registerDescription");
const registerDetalle = document.getElementById("registerDetalle");
const registerSystemPrice = document.getElementById("registerSystemPrice");
const registerGrouping = document.getElementById("registerGrouping");
const registerQuote = document.getElementById("registerQuote");
const registerQuantity1 = document.getElementById("registerQuantity1");
const registerUsuario = document.getElementById("registerUsuario");
const registerForm = document.getElementById("formRegisterContainer");
const tableBody = document.getElementById("table-body");
const monthSelector = document.getElementById("monthSelector");
const yearSelector = document.getElementById("yearSelector");
const btnPrevious = document.getElementById("btnPrevious");
const btnNext = document.getElementById("btnNext");
const pageNumber = document.getElementById("pageNumber");
const confirmationDeleteContainer = document.getElementById("confirmationDeleteContainerNew");
const closeConfirmationDelete = document.getElementById("closeConfirmationDeleteNew");
const btnConfirmDelete = document.getElementById("btnConfirmDeleteNew");
const btnCancelDelete = document.getElementById("btnCancelDeleteNew");
const pendingFilterBtn = document.getElementById("pendingFilterBtn");
const allFilterBtn = document.getElementById("allFilterBtn");
const btnDownload = document.getElementById("btnDownload");
const editModal = document.getElementById("editModal");
const editModalOverlay = document.getElementById("editModalOverlay");
const closeEditModal = document.getElementById("closeEditModal");
const saveChangesButton = document.getElementById("saveChangesButton");
const editModalAdmission = document.getElementById("editModalAdmission");
const editModalReference = document.getElementById("editModalReference");
const editModalQuantity = document.getElementById("editModalQuantity");
const editModalSystemPrice = document.getElementById("editModalSystemPrice");
const editModalInsurance = document.getElementById("editModalInsurance");
const editModalPatient = document.getElementById("editModalPatient");
const editModalDoctor = document.getElementById("editModalDoctor");
const editModalSurgeryDate = document.getElementById("editModalSurgeryDate");
const editModalProvider = document.getElementById("editModalProvider");
const editModalCode = document.getElementById("editModalCode");
const editModalDescription = document.getElementById("editModalDescription");
const editModalDetails = document.getElementById("editModalDetails");
const editModalGrouping = document.getElementById("editModalGrouping");
const editModalTotalItem = document.getElementById("editModalTotalItem");
const editModalSale = document.getElementById("editModalSale");
const totalRecords = document.getElementById("totalRecords");
// Elementos del spinner
const spinnerOverlay = document.getElementById("spinnerOverlay");
const spinnerText = document.getElementById("spinnerText");
const progressText = document.getElementById("progress");
const progressCircle = document.querySelector(".progress-circle");

// Variables para la animación suave
let currentProgress = 0;
let targetProgress = 0;
let animationFrameId = null;

// Función para mostrar el spinner
function showSpinner(message) {
    spinnerOverlay.classList.remove("hidden");
    spinnerText.textContent = message;
    currentProgress = 0;
    targetProgress = 0;
    setProgress(0); // Corregido: usar setProgress en lugar de updateProgress
    animateProgress(); // Iniciar la animación
}

// Función para ocultar el spinner
function hideSpinner() {
    cancelAnimationFrame(animationFrameId); // Detener la animación
    spinnerOverlay.classList.add("hidden");
}

// Función para establecer el progreso objetivo
function setProgress(percentage) {
    targetProgress = Math.min(Math.max(percentage, 0), 100); // Limitar entre 0 y 100
    if (!animationFrameId) animateProgress(); // Iniciar animación si no está corriendo
}

// Función para animar el progreso suavemente
function animateProgress() {
    const step = (targetProgress - currentProgress) * 0.1; // Velocidad de interpolación (ajustable)
    currentProgress += step;

    // Si estamos cerca del objetivo, ajustamos directamente para evitar oscilaciones
    if (Math.abs(targetProgress - currentProgress) < 0.1) {
        currentProgress = targetProgress;
    }

    // Actualizar la UI
    progressText.textContent = `${Math.round(currentProgress)}%`;
    const degrees = currentProgress * 3.6; // 360° = 100%
    progressCircle.style.transform = `rotate(${degrees}deg)`;
    progressCircle.setAttribute("aria-valuenow", Math.round(currentProgress));

    // Continuar la animación si no hemos alcanzado el objetivo
    if (Math.abs(targetProgress - currentProgress) > 0.01) {
        animationFrameId = requestAnimationFrame(animateProgress);
    } else {
        animationFrameId = null; // Detener la animación cuando llegamos al objetivo
    }
}

// Variables globales
let currentPage = 1;
const recordsPerPage = 200;
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();
let consumosList = [];
let filteredConsumosList = [];
let docIdToDelete = null;
let activeFilters = {}; // { columnIndex: filterValue }

// Constantes para valores fijos
const STATUS_OPTIONS = ["ingresado", "cargado", "modificar precio", "crear código", "solicitado", "pendiente cargado", "cerrada regular"];
const CHECK_OPTIONS = ["pendiente", "ingresado", "pendiente código"];

// Cachés para optimización
const admissionCache = new Map();
const referenceCache = new Map();

// Listener en tiempo real para consumos
function setupConsumosListener() {
  const consumosRef = collection(dbPatients, "consumos");
  onSnapshot(consumosRef, async (snapshot) => {
    const changedDocs = snapshot.docChanges().filter(change => change.type === "modified");

    for (const change of changedDocs) {
      const data = change.doc.data();
      const admission = data.admission || "";
      const provider = data.provider || "";
      const newStatus = data.status || "";

      if (newStatus === "cargado") {
        const q = query(
          consumosRef,
          where("admission", "==", admission),
          where("provider", "==", provider)
        );
        const querySnapshot = await getDocs(q);
        const allLoaded = querySnapshot.docs.every(doc => doc.data().status === "cargado");

        if (allLoaded) {
          await updateHistorialRecords(admission, provider);
        }
      }
    }
  });
}

async function updateHistorialRecords(admission, provider) {
  try {
    const historialRef = collection(dbHistorial, "historial");
    const q = query(
      historialRef,
      where("admission", "==", admission),
      where("company", "==", provider)
    );
    const querySnapshot = await getDocs(q);

    for (const docSnap of querySnapshot.docs) {
      const docRef = doc(dbHistorial, "historial", docSnap.id);
      await updateDoc(docRef, { status: "Cargado" });
    }
  } catch (error) {
    console.error("Error al actualizar historial:", error);
  }
}

// Actualizar registros relacionados en ingresos y pacientes
async function updateRelatedRecords(admission, provider) {
  const chain = `${admission}${provider}`;

  const consumosQuery = query(
    collection(dbPatients, "consumos"),
    where("chain", "==", chain)
  );
  const consumosSnapshot = await getDocs(consumosQuery);
  const consumos = consumosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const allCargado = consumos.every(consumo => consumo.status === "cargado");
  const someCargado = consumos.some(consumo => consumo.status === "cargado");
  const newStatus = allCargado ? "cargado" : (someCargado ? "pendiente de carga" : "ingresado");

  const ingresosQuery = query(
    collection(dbConsignaciones, "ingresos"),
    where("admission", "==", admission),
    where("company", "==", provider)
  );
  const ingresosSnapshot = await getDocs(ingresosQuery);
  ingresosSnapshot.forEach(async (ingresoDoc) => {
    const ingresoRef = doc(dbConsignaciones, "ingresos", ingresoDoc.id);
    await updateDoc(ingresoRef, { status: newStatus });
  });

  const pacientesQuery = query(
    collection(dbPatients, "pacientes"),
    where("admission", "==", admission),
    where("provider", "==", provider)
  );
  const pacientesSnapshot = await getDocs(pacientesQuery);
  pacientesSnapshot.forEach(async (pacienteDoc) => {
    const pacienteRef = doc(dbPatients, "pacientes", pacienteDoc.id);
    const updateData = {
      status: allCargado ? "Cargado" : "Pendiente de Carga",
    };
    if (allCargado) {
      updateData.chargeDate = new Date().toISOString().split("T")[0];
    }
    await updateDoc(pacienteRef, updateData);
  });
}











// Función de debounce
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

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

// Función para calcular el margen según el precio
function calculateMargin(price) {
  const parsedPrice = parseFloat(price) || 0;
  if (parsedPrice < 301) return "500%";
  if (parsedPrice < 1001) return "400%";
  if (parsedPrice < 5001) return "300%";
  if (parsedPrice < 10001) return "250%";
  if (parsedPrice < 25001) return "200%";
  if (parsedPrice < 50001) return "160%";
  if (parsedPrice < 100001) return "140%";
  if (parsedPrice < 200001) return "80%";
  if (parsedPrice < 10000000) return "50%";
  return "0%";
}

// Función para obtener Total Cotización desde pacientes
async function getTotalCotizacionFromPacientes(cadena) {
  try {
    const pacientesRef = collection(dbPatients, "pacientes");
    const q = query(pacientesRef, where("admission", "==", cadena.slice(0, cadena.indexOf(registerProvider.value || ""))));
    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const pacienteCadena = `${data.admission}${data.providerName}`;
      if (pacienteCadena === cadena) return data.totalQuote || "0";
    }
    return "0";
  } catch (error) {
    console.error("Error al obtener Total Cotización:", error);
    return "0";
  }
}

// Función para mostrar mensajes
function showMessage(type, text) {
  const messageContainer = document.getElementById(`message${type.charAt(0).toUpperCase() + type.slice(1)}`);
  const textElement = document.getElementById(`${type}Text`);
  textElement.textContent = text;
  messageContainer.classList.remove("hidden");
  setTimeout(() => messageContainer.classList.add("hidden"), 5000);
}

// Función para bloquear campos
function lockFields() {
  registerInsurance.setAttribute("readonly", true);
  registerPatient.setAttribute("readonly", true);
  registerDoctor.setAttribute("readonly", true);
  registerSurgeryDate.setAttribute("readonly", true);
  registerProvider.setAttribute("readonly", true);
  registerCode.setAttribute("readonly", true);
  registerDescription.setAttribute("readonly", true);
  registerDetalle.setAttribute("readonly", true);
  registerSystemPrice.setAttribute("readonly", true);
  registerGrouping.setAttribute("readonly", true);
}

// Función para buscar y autocompletar datos basados en la admisión
const searchAdmission = debounce(async (admissionValue) => {
  if (admissionCache.has(admissionValue)) {
    const cached = admissionCache.get(admissionValue);
    registerInsurance.value = cached.insuranceName || "";
    registerPatient.value = cached.patient || "";
    registerDoctor.value = cached.doctorName || "";
    registerSurgeryDate.value = cached.surgeryDate || "";
    registerProvider.value = cached.providerName || "";
    return;
  }
  try {
    const pacientesRef = collection(dbPatients, "pacientes");
    const q = query(pacientesRef, where("admission", "==", admissionValue));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const patientData = querySnapshot.docs[0].data();
      registerInsurance.value = patientData.insuranceName || "";
      registerPatient.value = patientData.patient || "";
      registerDoctor.value = patientData.doctorName || "";
      registerSurgeryDate.value = patientData.surgeryDate || "";
      registerProvider.value = patientData.providerName || "";
      admissionCache.set(admissionValue, patientData);
    } else {
      registerInsurance.value = "";
      registerPatient.value = "";
      registerDoctor.value = "";
      registerSurgeryDate.value = "";
      registerProvider.value = "";
    }
  } catch (error) {
    console.error("Error al buscar la admisión:", error);
  }
}, 300);

// Función para buscar y autocompletar datos basados en la referencia
const searchReference = debounce(async (referenceValue) => {
  if (referenceCache.has(referenceValue)) {
    const cached = referenceCache.get(referenceValue);
    registerCode.value = cached.codigo || "";
    registerDescription.value = cached.descripcion || "";
    registerDetalle.value = cached.detalles || "";
    registerSystemPrice.value = cached.precio || cached.precioNeto || "";
    registerGrouping.value = cached.clasificacion || "";
    registerProvider.value = cached.proveedor || "";
    return;
  }
  try {
    const codesRef = collection(dbCodes, "codigos");
    const q = query(codesRef, where("referencia", "==", referenceValue));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const codeData = querySnapshot.docs[0].data();
      registerCode.value = codeData.codigo || "";
      registerDescription.value = codeData.descripcion || "";
      registerDetalle.value = codeData.detalles || "";
      registerSystemPrice.value = codeData.precio || codeData.precioNeto || "";
      registerGrouping.value = codeData.clasificacion || "";
      registerProvider.value = codeData.proveedor || "";
      referenceCache.set(referenceValue, codeData);
    } else {
      registerCode.value = "";
      registerDescription.value = "";
      registerDetalle.value = "";
      registerSystemPrice.value = "";
      registerGrouping.value = "";
      registerProvider.value = "";
    }
  } catch (error) {
    console.error("Error al buscar la referencia:", error);
  }
}, 300);

// Nueva función para buscar y actualizar la previsión desde "pacientes"
async function updateInsuranceFromPatients(consumo) {
  try {
    const pacientesRef = collection(dbPatients, "pacientes");
    const q = query(pacientesRef, where("admission", "==", consumo.patientAdmission));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const patientData = querySnapshot.docs[0].data();
      const newInsurance = patientData.insuranceName || patientData.insurance || "";
      
      if (consumo.insurance !== newInsurance) {
        const consumoRef = doc(dbPatients, "consumos", consumo.docId);
        await updateDoc(consumoRef, { insurance: newInsurance });
        consumo.insurance = newInsurance;
      }
      return newInsurance;
    } else {
      return consumo.insurance || "";
    }
  } catch (error) {
    console.error("Error al buscar/actualizar previsión:", error);
    showMessage("error", "Error al actualizar previsión: " + error.message);
    return consumo.insurance || "";
  }
}

// Cargar consumos desde Firebase en tiempo real y actualizar previsión
async function loadConsumos() {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  showSpinner(`Cargando registros de ${months[selectedMonth]}`);
  
  const consumosRef = collection(dbPatients, "consumos");
  onSnapshot(consumosRef, async (snapshot) => {
      const totalDocs = snapshot.docs.length;
      let processedDocs = 0;

      consumosList = await Promise.all(snapshot.docs.map(async (doc) => {
          const consumoData = doc.data();
          const totalQuote = consumoData.totalQuote || await getTotalCotizacionFromPacientes(consumoData.chain);
          
          const consumo = {
              docId: doc.id,
              ...consumoData,
              totalQuote: totalQuote
          };

          consumo.insurance = await updateInsuranceFromPatients(consumo);
          processedDocs++;
          setProgress((processedDocs / totalDocs) * 100); // Usar setProgress
          
          return consumo;
      }));
      
      filterConsumosByMonth();
      setProgress(100); // Asegurar que llegue al 100%
      setTimeout(hideSpinner, 500); // Ocultar con un pequeño retraso para que se vea el 100%
  }, (error) => {
      console.error("Error al cargar consumos:", error);
      showMessage("error", "Error al cargar consumos: " + error.message);
      hideSpinner();
  });
}

// Actualizar Total Grupo
async function updateTotalGrupo(cadena) {
  try {
    const consumosRef = collection(dbPatients, "consumos");
    const q = query(consumosRef, where("chain", "==", cadena));
    const querySnapshot = await getDocs(q);

    const totalGrupo = querySnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (parseFloat(data.totalItem) || 0);
    }, 0).toString();

    await Promise.all(querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { totalGroup: totalGrupo })
    ));

    consumosList.forEach(item => {
      if (item.chain === cadena) item.totalGroup = totalGrupo;
    });

    return totalGrupo;
  } catch (error) {
    console.error("Error al actualizar Total Grupo:", error);
    return "0";
  }
}

// Filtrar consumos por mes y año
function filterConsumosByMonth() {
  filteredConsumosList = consumosList.filter(consumo => {
      if (!consumo.surgeryDate) return false;
      const surgeryDate = new Date(consumo.surgeryDate);
      return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
  });
  currentPage = 1;
  renderTableAsync();
  totalRecords.textContent = `Total: ${filteredConsumosList.length} registros`; // Actualizar total
}

// Funciones para filtros de tabla
function toggleFilter(columnIndex) {
  const filterInput = document.querySelector(`th:nth-child(${columnIndex + 1}) .filter-input`);
  filterInput.classList.toggle("hidden");
  if (!filterInput.classList.contains("hidden")) {
    filterInput.focus();
  } else {
    filterInput.value = "";
    delete activeFilters[columnIndex];
    filterTable(columnIndex);
  }
}

document.getElementById("allFilterToggle").addEventListener("change", (e) => {
  activeFilters = {};
  const filterInputs = document.querySelectorAll(".filter-input");
  filterInputs.forEach(input => (input.value = ""));
  if (e.target.checked) {
    filteredConsumosList = [...consumosList];
  } else {
    filterConsumosByMonth();
  }
  renderTableAsync();
});

// Función auxiliar para obtener el valor de una columna según el índice
// Filtrar la tabla (optimizado con debounce)
const filterTable = debounce((columnIndex) => {
  const filterInput = document.querySelector(`th:nth-child(${columnIndex + 1}) .filter-input`);
  const filterValue = filterInput.value.trim().toLowerCase();

  if (filterValue) {
    activeFilters[columnIndex] = filterValue;
  } else {
    delete activeFilters[columnIndex];
  }

  const baseList = document.getElementById("allFilterToggle")?.checked
    ? consumosList
    : consumosList.filter(consumo => {
        if (!consumo.surgeryDate) return false;
        const surgeryDate = new Date(consumo.surgeryDate);
        return surgeryDate.getMonth() === selectedMonth && surgeryDate.getFullYear() === selectedYear;
      });

  let filteredData = [...baseList];
  Object.entries(activeFilters).forEach(([colIdx, value]) => {
    filteredData = filteredData.filter(consumo => {
      const columnValue = getColumnValue(consumo, parseInt(colIdx)).toLowerCase();
      return columnValue.includes(value);
    });
  });

  filteredConsumosList = filteredData;
  currentPage = 1;
  renderTableAsync();
}, 300);

// Función auxiliar para obtener el valor de una columna según el índice (optimizada)
function getColumnValue(consumo, columnIndex) {
  const fields = [
    "",
    formatDate(consumo.entryDate),
    consumo.id || "",
    consumo.quote || "",
    consumo.reference || "",
    consumo.quantity || "",
    formatPrice(consumo.price) || "",
    consumo.details || "",
    formatPrice(consumo.totalQuote) || "",
    formatPrice(consumo.totalGroup) || "",
    consumo.totalQuote === consumo.totalGroup ? "Sí" : "No",
    formatDate(consumo.chargeDate) || "",
    consumo.status || "",
    consumo.admission || "",
    consumo.code || "",
    consumo.quantity || "",
    formatPrice(consumo.sale) || "",
    consumo.check || "",
    consumo.insurance || "",
    consumo.patientAdmission || "",
    consumo.patientName || "",
    consumo.doctor || "",
    formatDate(consumo.surgeryDate) || "",
    consumo.provider || "",
    consumo.codeDescription || "",
    consumo.description || "",
    consumo.itemQuantity || "",
    formatPrice(consumo.systemPrice) || "",
    consumo.grouping || "",
    formatPrice(consumo.totalItem) || "",
    consumo.chain || "",
    consumo.margin || "",
    formatDate(consumo.creationDate) || "",
    consumo.user || ""
  ];
  return fields[columnIndex] || "";
}

// Función para copiar texto al portapapeles
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error("Error al copiar al portapapeles:", error);
  }
}

// Función para eliminar un registro
function deleteRecord(docId) {
  docIdToDelete = docId;
  confirmationDeleteContainer.classList.remove("hidden");
}

// Crear fila de la tabla
function createRow(consumo) {
  const matchIcon = parseFloat(consumo.totalQuote) === parseFloat(consumo.totalGroup)
      ? '<i class="fas fa-check" style="color: green;" aria-label="Coincidencia Sí"></i>'
      : '<i class="fas fa-times" style="color: red;" aria-label="Coincidencia No"></i>';

  const statusSelect = `
      <select class="status-select status-${consumo.status.replace(' ', '-')}" data-docid="${consumo.docId}" aria-label="Estado del consumo">
          ${STATUS_OPTIONS.map(option => 
              `<option value="${option}" ${consumo.status === option ? "selected" : ""}>${option}</option>`
          ).join("")}
      </select>
  `;

  const checkSelect = `
      <select class="check-select" data-docid="${consumo.docId}" aria-label="Check del consumo">
          ${CHECK_OPTIONS.map(option => 
              `<option value="${option}" ${consumo.check === option ? "selected" : ""}>${option}</option>`
          ).join("")}
      </select>
  `;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>
        <i class="fas fa-eye" style="cursor:pointer; color:#3498db; margin-right:20px;" title="Editar" aria-label="Editar registro" role="button" tabindex="0"></i>
        <i class="fas fa-trash delete-icon" style="cursor:pointer; color:#FF0000;" title="Eliminar" aria-label="Eliminar registro" role="button" tabindex="0"></i>
    </td>
    <td>${formatDate(consumo.entryDate)}</td>
    <td>${consumo.id}</td>
    <td>${consumo.quote}</td>
    <td>${consumo.reference}</td>
    <td>${consumo.quantity}</td>
    <td>${formatPrice(consumo.price)}</td>
    <td>${consumo.details}</td>
    <td>${formatPrice(consumo.totalQuote)}</td>
    <td>${formatPrice(consumo.totalGroup)}</td>
    <td>${matchIcon}</td>
    <td class="charge-date">${formatDate(consumo.chargeDate)}</td>
    <td class="status-${consumo.status.replace(' ', '-')}">${statusSelect}</td>
    <td>${consumo.admission} <i class="fas fa-copy copy-icon" style="cursor:pointer; margin-left:5px;" title="Copiar" aria-label="Copiar Admisión" role="button" tabindex="0"></i></td>
    <td>${consumo.code} <i class="fas fa-copy copy-icon" style="cursor:pointer; margin-left:5px;" title="Copiar"></i></td>
    <td>${consumo.quantity}</td>
    <td>${formatPrice(consumo.sale)}</td>
    <td>${checkSelect}</td>
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
    <td>${consumo.chain}</td>
    <td>${consumo.margin}</td>
    <td>${formatDate(consumo.creationDate)}</td>
    <td>${consumo.user}</td>
  `;
  return row;
}

// Añadir eventos a la fila
function addRowEvents(row, consumo) {
  const editIcon = row.querySelector(".fa-eye");
  const deleteIcon = row.querySelector(".delete-icon");
  const copyIcons = row.querySelectorAll(".copy-icon");
  const statusSelect = row.querySelector(".status-select");
  const statusCell = row.cells[12];
  const chargeDateCell = row.cells[11];

  editIcon.addEventListener("click", () => editRecord(consumo.docId));
  editIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter") editRecord(consumo.docId);
  });

  deleteIcon.addEventListener("click", () => deleteRecord(consumo.docId));
  deleteIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter") deleteRecord(consumo.docId);
  });

  copyIcons.forEach(icon => {
      icon.addEventListener("click", e => {
          const text = e.target.parentElement.textContent.trim().replace(/\s*Copiar\s*/, "");
          copyToClipboard(text);
      });
      icon.addEventListener("keydown", e => {
          if (e.key === "Enter") {
              const text = e.target.parentElement.textContent.trim().replace(/\s*Copiar\s*/, "");
              copyToClipboard(text);
          }
      });
  });

  if (statusSelect) {
      statusSelect.addEventListener("change", async e => {
          e.preventDefault();
          const newStatus = e.target.value;
          const docId = e.target.dataset.docid;
          const consumoRef = doc(dbPatients, "consumos", docId);
          const consumo = consumosList.find(c => c.docId === docId);
          const currentTotalQuote = consumo ? consumo.totalQuote : await getTotalCotizacionFromPacientes(consumo.chain);

          const updateData = { 
              status: newStatus,
              totalQuote: currentTotalQuote
          };
          if (newStatus === "cargado") {
              const currentDate = new Date();
              updateData.chargeDate = currentDate.toISOString();
              chargeDateCell.textContent = formatDate(currentDate);
          } else {
              updateData.chargeDate = "";
              chargeDateCell.textContent = "";
          }

          try {
              await updateDoc(consumoRef, updateData);
              if (consumo) {
                  consumo.status = newStatus;
                  consumo.chargeDate = updateData.chargeDate;
                  consumo.totalQuote = currentTotalQuote;
              }
              statusCell.className = `status-${newStatus.replace(' ', '-')}`;
              statusSelect.className = `status-select status-${newStatus.replace(' ', '-')}`; // Actualizar clase del select
              showMessage("success", `Estado actualizado a "${newStatus}" correctamente.`);
              await sincronizarEstados(consumo.admission, consumo.provider, docId, newStatus);
          } catch (error) {
              console.error("Error al actualizar estado:", error);
              showMessage("error", `Error al actualizar estado: ${error.message}`);
          }
      });
  }

  const checkSelect = row.querySelector(".check-select");
  if (checkSelect) {
    checkSelect.addEventListener("change", async e => {
      const newCheck = e.target.value;
      const docId = e.target.dataset.docid;
      const consumoRef = doc(dbPatients, "consumos", docId);
      await updateDoc(consumoRef, { check: newCheck });
      const consumo = consumosList.find(c => c.docId === docId);
      if (consumo) consumo.check = newCheck;
    });
  }
}

// Nueva función para sincronizar estados en consumos, historial y pacientes
async function sincronizarEstados(admission, provider, changedDocId, newStatus) {
  const today = new Date().toISOString().split("T")[0];

  const consumosQuery = query(
    collection(dbPatients, "consumos"),
    where("admission", "==", admission),
    where("provider", "==", provider)
  );
  const consumosSnapshot = await getDocs(consumosQuery);
  const consumos = consumosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const changedConsumo = consumos.find(c => c.id === changedDocId);
  if (changedConsumo) {
    changedConsumo.status = newStatus;
  }

  const totalRegistros = consumos.length;
  const cargados = consumos.filter(c => c.status === "cargado");
  const todosCargados = cargados.length === totalRegistros;

  console.log(`Total registros: ${totalRegistros}, Cargados: ${cargados.length}, Todos cargados: ${todosCargados}`);
  console.log("Estados en consumos:", consumos.map(c => `${c.uniqueKey}: ${c.status}`));

  const historialQuery = query(
    collection(dbConsignaciones, "historial"),
    where("admission", "==", admission),
    where("company", "==", provider)
  );
  const historialSnapshot = await getDocs(historialQuery);
  const historialDocs = historialSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  for (const consumo of consumos) {
    const matchingHistorial = historialDocs.find(h => h.uniqueKey === consumo.uniqueKey);
    if (matchingHistorial) {
      const historialRef = doc(dbConsignaciones, "historial", matchingHistorial.id);
      const historialStatus = consumo.status === "cargado" ? "cargado" : "pendiente de carga";
      try {
        await updateDoc(historialRef, { status: historialStatus });
        console.log(`Historial actualizado: ${matchingHistorial.uniqueKey} -> ${historialStatus}`);
      } catch (error) {
        console.error(`Error al actualizar historial ${matchingHistorial.uniqueKey}:`, error);
      }
    } else {
      console.warn(`No se encontró registro en historial con uniqueKey=${consumo.uniqueKey}`);
    }
  }

  const pacientesQuery = query(
    collection(dbPatients, "pacientes"),
    where("admission", "==", admission),
    where("provider", "==", provider)
  );
  const pacientesSnapshot = await getDocs(pacientesQuery);

  if (!pacientesSnapshot.empty) {
    const pacienteDoc = pacientesSnapshot.docs[0];
    const pacienteRef = doc(dbPatients, "pacientes", pacienteDoc.id);
    const updateData = {};

    if (todosCargados) {
      updateData.status = "cargado";
      updateData.chargeDate = today;
    } else {
      updateData.status = "pendiente de carga";
      updateData.chargeDate = "";
    }

    try {
      await updateDoc(pacienteRef, updateData);
      console.log(`Paciente actualizado: admission=${admission}, provider=${provider}`);
    } catch (error) {
      console.error(`Error al actualizar paciente:`, error);
    }
  } else {
    console.warn(`No se encontró paciente con admission=${admission} y provider=${provider}`);
  }

  console.log("Refrescando tabla...");
  filterConsumosByMonth();
}

// Renderizar la tabla
function renderTableAsync() {
  tableBody.innerHTML = "";
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredConsumosList.length);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  showSpinner(`Cargando registros de ${months[selectedMonth]}`);

  filteredConsumosList.sort((a, b) => {
      const dateA = new Date(a.surgeryDate);
      const dateB = new Date(b.surgeryDate);
      if (dateA - dateB !== 0) return dateA - dateB;
      const admA = a.admission || "";
      const admB = b.admission || "";
      if (admA !== admB) return admA.localeCompare(admB);
      const provA = a.provider || "";
      const provB = b.provider || "";
      return provA.localeCompare(provB);
  });

  const paginatedConsumos = filteredConsumosList.slice(startIndex, endIndex);
  const totalRows = paginatedConsumos.length;
  const batchSize = 50;
  let currentBatchIndex = 0;

  const renderBatch = () => {
      const batchEnd = Math.min(currentBatchIndex + batchSize, paginatedConsumos.length);
      for (let i = currentBatchIndex; i < batchEnd; i++) {
          const consumo = paginatedConsumos[i];
          const row = createRow(consumo);
          addRowEvents(row, consumo);
          tableBody.appendChild(row);
      }

      currentBatchIndex = batchEnd;
      setProgress((currentBatchIndex / totalRows) * 100); // Usar setProgress

      if (currentBatchIndex < paginatedConsumos.length) {
          requestAnimationFrame(renderBatch);
      } else {
          const totalPages = Math.ceil(filteredConsumosList.length / recordsPerPage);
          pageNumber.textContent = `Página ${currentPage} de ${totalPages}`;
          totalRecords.textContent = `Total: ${filteredConsumosList.length} registros`; // Mostrar total
          btnPrevious.disabled = currentPage === 1;
          btnNext.disabled = currentPage === totalPages || totalPages === 0;
          setProgress(100);
          setTimeout(hideSpinner, 500);
      }
  };

  requestAnimationFrame(renderBatch);
}

// Guardar consumo
async function saveConsumo(event) {
  event.preventDefault();
  const precio = parseFloat(registerSystemPrice.value) || 0;
  const cantidad = parseFloat(registerQuantity1.value) || 0;
  const margen = calculateMargin(precio);
  const totalItem = cantidad * precio;
  const cadena = `${registerAdmission.value}${registerProvider.value}`;
  const uniqueKey = `${registerAdmission.value}${registerProvider.value}${registerCode.value}`;
  const totalCotizacion = await getTotalCotizacionFromPacientes(cadena);
  const agrupacion = registerGrouping.value.toLowerCase();

  let venta = "0";
  if (agrupacion === "cotizacion") {
    venta = (totalItem + (totalItem * 0.30)).toFixed(2);
  } else if (agrupacion === "consignacion") {
    const margenNum = parseFloat(margen.replace("%", "")) / 100;
    venta = (totalItem + (totalItem * margenNum)).toFixed(2);
  }

  const consumoData = {
    entryDate: serverTimestamp(),
    id: registerAdmission.value,
    quote: registerQuote.value,
    reference: registerReference.value,
    quantity: registerQuantity1.value,
    price: precio.toString(),
    details: registerDetalle.value,
    totalQuote: totalCotizacion,
    totalGroup: "0",
    match: "",
    chargeDate: "",
    status: "Pendiente",
    admission: registerAdmission.value,
    code: registerCode.value,
    sale: venta,
    check: "pendiente",
    insurance: registerInsurance.value,
    patientAdmission: registerAdmission.value,
    patientName: registerPatient.value,
    doctor: registerDoctor.value,
    surgeryDate: registerSurgeryDate.value,
    provider: registerProvider.value,
    codeDescription: registerCode.value,
    description: registerDescription.value,
    itemQuantity: registerQuantity1.value,
    systemPrice: precio.toString(),
    grouping: registerGrouping.value,
    totalItem: totalItem.toFixed(2),
    chain: cadena,
    uniqueKey: uniqueKey,
    margin: margen,
    creationDate: serverTimestamp(),
    user: registerUsuario.textContent
  };

  try {
    const docRef = await addDoc(collection(dbPatients, "consumos"), consumoData);
    consumoData.docId = docRef.id;
    consumoData.entryDate = new Date();
    consumosList.push(consumoData);
    await updateTotalGrupo(cadena);
    registerReference.value = "";
    registerQuantity1.value = "";
    registerDetalle.value = "";
    registerProvider.value = "";
    registerCode.value = "";
    registerDescription.value = "";
    registerSystemPrice.value = "";
    registerGrouping.value = "";
    filterConsumosByMonth();
  } catch (error) {
    console.error("Error al guardar consumo:", error);
    showMessage("error", "Error al guardar consumo: " + error.message);
  }
}

// Editar registro
function editRecord(docId) {
  const consumo = consumosList.find(c => c.docId === docId);
  if (!consumo) return;

  editModalAdmission.value = consumo.admission || "";
  editModalReference.value = consumo.reference || "";
  editModalQuantity.value = consumo.quantity || "";
  editModalSystemPrice.value = consumo.systemPrice || "";
  editModalInsurance.value = consumo.insurance || "";
  editModalPatient.value = consumo.patientName || "";
  editModalDoctor.value = consumo.doctor || "";
  editModalSurgeryDate.value = consumo.surgeryDate || "";
  editModalProvider.value = consumo.provider || "";
  editModalCode.value = consumo.code || "";
  editModalDescription.value = consumo.description || "";
  editModalDetails.value = consumo.details || "";
  editModalGrouping.value = consumo.grouping || "";
  editModalTotalItem.value = consumo.totalItem || "";
  editModalSale.value = consumo.sale || "";

  editModal.dataset.docId = docId;
  editModalOverlay.classList.add("visible");
  editModal.classList.add("visible");

  updateChainAndTotals();
}

async function updateChainAndTotals() {
  const precio = parseFloat(editModalSystemPrice.value) || 0;
  const cantidad = parseFloat(editModalQuantity.value) || 0;
  const agrupacion = editModalGrouping.value.toLowerCase();
  const cadena = `${editModalAdmission.value}${editModalProvider.value}`;

  const totalItem = cantidad * precio;
  editModalTotalItem.value = totalItem.toFixed(2);

  let venta = "0";
  if (agrupacion === "cotizacion") {
    venta = (totalItem + (totalItem * 0.30)).toFixed(2);
  } else if (agrupacion === "consignacion") {
    const margen = calculateMargin(precio);
    const margenNum = parseFloat(margen.replace("%", "")) / 100;
    venta = (totalItem + (totalItem * margenNum)).toFixed(2);
  }
  editModalSale.value = venta;

  await getTotalCotizacionFromPacientes(cadena);
}

// Resetear formulario
// Resetear formulario
function resetFormExceptUsuario(event) {
  event.preventDefault();
  const usuarioValue = registerUsuario.textContent;
  registerForm.reset();
  registerUsuario.textContent = usuarioValue;
}

// Configurar eventos de filtros
function setupFilterEvents() {
  const filterIcons = document.querySelectorAll(".filter-icon");
  const filterInputs = document.querySelectorAll(".filter-input");
  filterIcons.forEach((icon, index) => {
    icon.addEventListener("click", () => toggleFilter(index));
  });
  filterInputs.forEach((input, index) => {
    input.addEventListener("input", () => filterTable(index));
    input.addEventListener("keyup", () => filterTable(index));
  });
}

// Filtrar registros pendientes
function filterPending() {
  filteredConsumosList = consumosList.filter(consumo => {
      if (!consumo.surgeryDate) return false;
      const surgeryDate = new Date(consumo.surgeryDate);
      return (
          surgeryDate.getMonth() === selectedMonth &&
          surgeryDate.getFullYear() === selectedYear &&
          consumo.status !== "cargado"
      );
  });
  currentPage = 1;
  renderTableAsync();
  totalRecords.textContent = `Total: ${filteredConsumosList.length} registros`; // Actualizar total
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
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 0 + i);
  yearSelector.innerHTML = years.map(year => 
    `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`
  ).join("");
}

// Exportar a Excel
function exportToExcel() {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Fecha de Ingreso", "ID", "Cotización", "Referencia", "Cantidad", "Precio", "Detalles", 
     "Total Cotización", "Total Grupo", "Coincidencia", "Fecha de Cargo", "Estado", 
     "Admisión", "Código", "Venta", "Check", "Previsión", "Admisión Paciente", 
     "Nombre del Paciente", "Médico", "Fecha de Cirugía", "Proveedor", "Código_descripción", 
     "Descripción", "Cantidad Item", "Precio Sistema", "Agrupación", "Total Item", 
     "Cadena", "Margen", "Fecha de creación", "Usuario"],
    ...filteredConsumosList.map(consumo => [
      formatDate(consumo.entryDate), consumo.id, consumo.quote, consumo.reference, 
      consumo.quantity, formatPrice(consumo.price), consumo.details, 
      formatPrice(consumo.totalQuote), formatPrice(consumo.totalGroup), 
      consumo.totalQuote === consumo.totalGroup ? "Sí" : "No", 
      formatDate(consumo.chargeDate), consumo.status, consumo.admission, 
      consumo.code, formatPrice(consumo.sale), consumo.check, consumo.insurance, 
      consumo.patientAdmission, consumo.patientName, consumo.doctor, 
      formatDate(consumo.surgeryDate), consumo.provider, consumo.codeDescription, 
      consumo.description, consumo.itemQuantity, formatPrice(consumo.systemPrice), 
      consumo.grouping, formatPrice(consumo.totalItem), consumo.chain, 
      consumo.margin, formatDate(consumo.creationDate), consumo.user
    ])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Consumos");
  XLSX.writeFile(wb, `Consumos_${selectedMonth + 1}_${selectedYear}.xlsx`);
}

// Eventos
registerAdmission.addEventListener("input", e => {
  const admissionValue = e.target.value.trim();
  admissionValue ? searchAdmission(admissionValue) : (
    registerInsurance.value = "",
    registerPatient.value = "",
    registerDoctor.value = "",
    registerSurgeryDate.value = "",
    registerProvider.value = ""
  );
});

registerReference.addEventListener("input", e => {
  const referenceValue = e.target.value.trim();
  referenceValue ? searchReference(referenceValue) : (
    registerCode.value = "",
    registerDescription.value = "",
    registerDetalle.value = "",
    registerSystemPrice.value = "",
    registerGrouping.value = "",
    registerProvider.value = ""
  );
});

monthSelector.addEventListener("change", e => {
  selectedMonth = Number(e.target.value);
  filterConsumosByMonth();
});

yearSelector.addEventListener("change", e => {
  selectedYear = Number(e.target.value);
  filterConsumosByMonth();
});

btnPrevious.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTableAsync();
  }
});

btnNext.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredConsumosList.length / recordsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTableAsync();
  }
});

registerForm.addEventListener("submit", saveConsumo);
document.getElementById("btnReset").addEventListener("click", resetFormExceptUsuario);

closeConfirmationDelete.addEventListener("click", () => confirmationDeleteContainer.classList.add("hidden"));
btnCancelDelete.addEventListener("click", () => {
  confirmationDeleteContainer.classList.add("hidden");
  docIdToDelete = null;
});

btnConfirmDelete.addEventListener("click", async () => {
  if (docIdToDelete) {
    try {
      const consumoToDelete = consumosList.find(c => c.docId === docIdToDelete);
      const cadena = consumoToDelete ? consumoToDelete.chain : null;
      const consumoRef = doc(dbPatients, "consumos", docIdToDelete);
      await deleteDoc(consumoRef);
      confirmationDeleteContainer.classList.add("hidden");
      docIdToDelete = null;
      if (cadena) await updateTotalGrupo(cadena);
      filterConsumosByMonth();
    } catch (error) {
      console.error("Error al eliminar registro:", error);
      showMessage("error", "Error al eliminar registro: " + error.message);
    }
  }
});

pendingFilterBtn.addEventListener("click", filterPending);
allFilterBtn.addEventListener("click", filterConsumosByMonth);
btnDownload.addEventListener("click", exportToExcel);

editModalAdmission.addEventListener("input", async e => {
  const admissionValue = e.target.value.trim();
  if (admissionValue) {
    await searchAdmission(admissionValue);
    editModalInsurance.value = registerInsurance.value;
    editModalPatient.value = registerPatient.value;
    editModalDoctor.value = registerDoctor.value;
    editModalSurgeryDate.value = registerSurgeryDate.value;
    editModalProvider.value = registerProvider.value;
  } else {
    editModalInsurance.value = "";
    editModalPatient.value = "";
    editModalDoctor.value = "";
    editModalSurgeryDate.value = "";
    editModalProvider.value = "";
  }
  updateChainAndTotals();
});

editModalReference.addEventListener("input", async e => {
  const referenceValue = e.target.value.trim();
  if (referenceValue) {
    await searchReference(referenceValue);
    editModalCode.value = registerCode.value;
    editModalDescription.value = registerDescription.value;
    editModalDetails.value = registerDetalle.value;
    editModalSystemPrice.value = registerSystemPrice.value;
    editModalGrouping.value = registerGrouping.value;
    editModalProvider.value = registerProvider.value;
  } else {
    editModalCode.value = "";
    editModalDescription.value = "";
    editModalDetails.value = "";
    editModalSystemPrice.value = "";
    editModalGrouping.value = "";
    editModalProvider.value = "";
  }
  updateChainAndTotals();
});

editModalQuantity.addEventListener("input", updateChainAndTotals);
editModalSystemPrice.addEventListener("input", updateChainAndTotals);

saveChangesButton.addEventListener("click", async () => {
  const docId = editModal.dataset.docId;
  const consumoRef = doc(dbPatients, "consumos", docId);
  const cadena = `${editModalAdmission.value}${editModalProvider.value}`;

  const updatedData = {
    admission: editModalAdmission.value,
    reference: editModalReference.value,
    quantity: editModalQuantity.value,
    systemPrice: editModalSystemPrice.value,
    insurance: editModalInsurance.value,
    patientName: editModalPatient.value,
    doctor: editModalDoctor.value,
    surgeryDate: editModalSurgeryDate.value,
    provider: editModalProvider.value,
    code: editModalCode.value,
    description: editModalDescription.value,
    details: editModalDetails.value,
    grouping: editModalGrouping.value,
    totalItem: editModalTotalItem.value,
    sale: editModalSale.value,
    chain: cadena,
    margin: calculateMargin(editModalSystemPrice.value),
    totalQuote: await getTotalCotizacionFromPacientes(cadena),
  };

  try {
    await updateDoc(consumoRef, updatedData);
    const newTotalGrupo = await updateTotalGrupo(cadena);
    const consumo = consumosList.find(c => c.docId === docId);
    if (consumo) {
      Object.assign(consumo, updatedData);
      consumo.totalGroup = newTotalGrupo;
    }
    editModalOverlay.classList.remove("visible");
    editModal.classList.remove("visible");
    filterConsumosByMonth();
  } catch (error) {
    console.error("Error al guardar cambios:", error);
    showMessage("error", "Error al guardar cambios: " + error.message);
  }
});

closeEditModal.addEventListener("click", () => {
  editModalOverlay.classList.remove("visible");
  editModal.classList.remove("visible");
});

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  lockFields();
  populateMonthSelector();
  populateYearSelector();
  loadConsumos();
  setupFilterEvents();
  setupConsumosListener();
});
