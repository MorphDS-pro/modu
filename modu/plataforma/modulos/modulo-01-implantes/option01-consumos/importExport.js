import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp,
  writeBatch,
  getDoc
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

// Elementos del DOM
const btnDownloadFormat = document.getElementById("btnDownloadFormat");
const btnImportExcel = document.getElementById("btnImportExcel");
const overlayImportProgress = document.getElementById("overlayImportProgress");
const progressText = document.getElementById("progressText");
const progressPercentage = document.getElementById("progressPercentage");
const progressTime = document.getElementById("progressTime");

// Columnas del formato Excel
const excelColumns = [
  "Fecha de Ingreso", "ID", "Cotización", "Referencia", "Cantidad", "Precio", "Detalles", 
  "Total Cotización", "Total Grupo", "Coincidencia", "Fecha de Cargo", "Estado", 
  "Admisión", "Código", "Venta", "Check", "Previsión", "Admisión Paciente", 
  "Nombre del Paciente", "Médico", "Fecha de Cirugía", "Proveedor", "Código_descripción", 
  "Descripción", "Cantidad Item", "Precio Sistema", "Agrupación", "Total Item", 
  "Cadena", "Margen", "Fecha de creación", "Usuario"
];

// Función para formatear precios a pesos chilenos durante la importación
function formatPrice(value) {
  if (!value || value === "") return "0";
  let numStr = value.toString().trim();
  numStr = numStr.replace(/[^\d.]/g, "");
  numStr = numStr.replace(/\./g, "");
  const num = parseFloat(numStr);
  return isNaN(num) ? "0" : num.toString();
}

// Función para descargar el formato Excel
function downloadExcelFormat() {
  const wb = XLSX.utils.book_new();
  const wsData = [excelColumns];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Formato_Consumos");
  XLSX.writeFile(wb, "Formato_Consumos.xlsx");
}

// Función para parsear fechas desde string o serial de Excel
function parseExcelDate(value) {
  if (!value) return "";
  if (typeof value === "number") { // Serial de Excel
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  }
  if (typeof value === "string") {
    const parts = value.split(/[-/]/);
    if (parts.length === 3) {
      return `${String(parts[0]).padStart(2, "0")}-${String(parts[1]).padStart(2, "0")}-${parts[2]}`;
    }
  }
  return value;
}

// Función para formatear tiempo en segundos o minutos
function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

// Variable para controlar la cancelación
let isCancelled = false;

// Función para importar datos desde Excel
async function importExcel() {
  overlayImportProgress.classList.remove("hidden");
  progressText.textContent = "Preparando importación...";
  progressPercentage.textContent = "0%";
  progressTime.textContent = "Lleva: 0s - Quedan: --";
  isCancelled = false; // Reiniciar el estado de cancelación

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx, .xls";
  input.style.display = "none";
  document.body.appendChild(input);

  // Agregar evento al botón de cancelar
  const cancelBtn = document.getElementById("cancelImportBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      isCancelled = true;
      overlayImportProgress.classList.add("hidden");
      input.remove();
      console.log("Importación cancelada por el usuario");
    };
  }

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      overlayImportProgress.classList.add("hidden");
      input.remove();
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const startTime = Date.now();
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

        const totalRows = jsonData.length;
        let processedRows = 0;
        let estimatedTotalTime = 0;
        let lastUpdateTime = startTime;

        const consumosRef = collection(dbPatients, "consumos");
        const existingConsumosSnapshot = await getDocs(consumosRef);
        const existingConsumosMap = new Map(
          existingConsumosSnapshot.docs.map(doc => [doc.data().chain + doc.data().reference, { id: doc.id, ...doc.data() }])
        );

        let batch = writeBatch(dbPatients);
        let batchOperations = 0;
        const BATCH_LIMIT = 400;
        const newDocs = [];
        const updatedDocs = [];

        const CHECK_OPTIONS = ["pendiente", "ingresado", "pendiente código"];

        const updateProgress = (progress, elapsedTime, remainingTime) => {
          progressText.textContent = `Importando: ${processedRows} de ${totalRows} registros`;
          progressPercentage.textContent = `${progress}%`;
          progressTime.textContent = `Lleva: ${formatTime(elapsedTime)} - Quedan: ${formatTime(remainingTime)}`;
          const progressRing = document.getElementById("progressRing");
          if (progressRing) {
            progressRing.style.background = `conic-gradient(#3498db ${progress}%, #eee ${progress}%)`;
          }
        };

        for (const row of jsonData) {
          if (isCancelled) {
            console.log("Importación interrumpida");
            return;
          }

          const chain = `${row["Admisión"] || ""}${row["Proveedor"] || ""}`;
          const uniqueKey = `${chain}${row["Código"] || ""}`;
          const existingConsumo = existingConsumosMap.get(chain + row["Referencia"]);

          let checkValue = "";
          for (const key in row) {
            if (key.toLowerCase().trim() === "check") {
              checkValue = row[key];
              break;
            }
          }

          if (checkValue) {
            checkValue = checkValue.toLowerCase().trim();
            if (checkValue === "ingresado" || checkValue === "Ingresado") {
              checkValue = "ingresado";
            }
            if (!CHECK_OPTIONS.includes(checkValue)) {
              console.warn(`Valor no válido para "Check" en fila ${processedRows + 1}: ${checkValue}. Usando valor por defecto "pendiente".`);
              checkValue = "pendiente";
            }
          } else {
            checkValue = "pendiente";
          }

          console.log(`Fila ${processedRows + 1} - Valor de "Check" leído: ${checkValue}`);

          const consumoData = {
            entryDate: row["Fecha de Ingreso"] ? parseExcelDate(row["Fecha de Ingreso"]) : serverTimestamp(),
            id: row["ID"] || row["Admisión"] || "",
            quote: row["Cotización"] || "",
            reference: row["Referencia"] || "",
            quantity: row["Cantidad"] || "0",
            price: formatPrice(row["Precio"] || "0"),
            details: row["Detalles"] || "",
            totalQuote: formatPrice(row["Total Cotización"] || "0"),
            totalGroup: formatPrice(row["Total Grupo"] || "0"),
            match: row["Coincidencia"] || "",
            chargeDate: parseExcelDate(row["Fecha de Cargo"]) || "",
            status: row["Estado"] || "Pendiente",
            admission: row["Admisión"] || "",
            code: row["Código"] || "",
            sale: formatPrice(row["Venta"] || "0"),
            check: checkValue,
            insurance: row["Previsión"] || "",
            patientAdmission: row["Admisión Paciente"] || row["Admisión"] || "",
            patientName: row["Nombre del Paciente"] || "",
            doctor: row["Médico"] || "",
            surgeryDate: parseExcelDate(row["Fecha de Cirugía"]) || "",
            provider: row["Proveedor"] || "",
            codeDescription: row["Código_descripción"] || row["Código"] || "",
            description: row["Descripción"] || "",
            itemQuantity: row["Cantidad Item"] || row["Cantidad"] || "0",
            systemPrice: formatPrice(row["Precio Sistema"] || "0"),
            grouping: row["Agrupación"] || "",
            totalItem: formatPrice(row["Total Item"] || "0"),
            chain: chain,
            uniqueKey: uniqueKey,
            margin: row["Margen"] || "",
            creationDate: row["Fecha de creación"] ? parseExcelDate(row["Fecha de creación"]) : serverTimestamp(),
            user: row["Usuario"] || "Importado"
          };

          if (existingConsumo) {
            const docRef = doc(dbPatients, "consumos", existingConsumo.id);
            const docSnapshot = await getDoc(docRef);
            if (docSnapshot.exists()) {
              const hasChanges = Object.keys(consumoData).some(key => 
                String(consumoData[key]) !== String(existingConsumo[key])
              );
              if (hasChanges) {
                batch.update(docRef, consumoData);
                updatedDocs.push(consumoData);
                batchOperations++;
              }
            } else {
              const newDocRef = doc(collection(dbPatients, "consumos"));
              batch.set(newDocRef, consumoData);
              newDocs.push({ ...consumoData, docId: newDocRef.id });
              batchOperations++;
            }
          } else {
            const newDocRef = doc(collection(dbPatients, "consumos"));
            batch.set(newDocRef, consumoData);
            newDocs.push({ ...consumoData, docId: newDocRef.id });
            batchOperations++;
          }

          if (batchOperations >= BATCH_LIMIT) {
            if (!isCancelled) {
              await batch.commit();
              batch = writeBatch(dbPatients);
              batchOperations = 0;
            } else {
              break;
            }
          }

          processedRows++;
          const progress = Math.round((processedRows / totalRows) * 100);
          const currentTime = Date.now();
          const elapsedTime = (currentTime - startTime) / 1000;

          if (processedRows > 0 && elapsedTime > 0) {
            estimatedTotalTime = (elapsedTime / processedRows) * totalRows;
          }
          const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);

          if (currentTime - lastUpdateTime >= 100) {
            lastUpdateTime = currentTime;
            updateProgress(progress, elapsedTime, remainingTime);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        if (!isCancelled) {
          updateProgress(100, (Date.now() - startTime) / 1000, 0);
          if (batchOperations > 0) {
            await batch.commit();
          }
          console.log(`Importación completada: ${newDocs.length} nuevos, ${updatedDocs.length} actualizados`);
          overlayImportProgress.classList.add("hidden");
          input.remove();
          if (typeof window.loadConsumos === "function") {
            window.loadConsumos();
          }
        }
      } catch (error) {
        console.error("Error al importar datos:", error);
        progressText.textContent = `Error: ${error.message}`;
        setTimeout(() => overlayImportProgress.classList.add("hidden"), 2000);
        input.remove();
      }
    };
    reader.readAsBinaryString(file);
  };

  input.click();
}

// Eventos
btnDownloadFormat.addEventListener("click", downloadExcelFormat);
btnImportExcel.addEventListener("click", importExcel);

export { downloadExcelFormat, importExcel };
