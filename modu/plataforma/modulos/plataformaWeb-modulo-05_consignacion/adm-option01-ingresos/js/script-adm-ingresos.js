import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  deleteDoc, doc, updateDoc, getDoc, getDocs, serverTimestamp, query, where, orderBy 
} from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';
import { loadMedicos } from './script02-modales.js';

// Configuraciones de Firebase (sin cambios)
export const firebaseConfigUsers = {
    apiKey: "AIzaSyDfz0_7v43TmV0rlFM9UhnVVHLFGtRWhGw",
    authDomain: "prestaciones-57dcd.firebaseapp.com",
    projectId: "prestaciones-57dcd",
    storageBucket: "prestaciones-57dcd.firebasestorage.app",
    messagingSenderId: "409471759723",
    appId: "1:409471759723:web:faa6812772f44baa3ec82e",
    measurementId: "G-0CZ9BMJWMV"
};

export const firebaseConfigConsignaciones = {
    apiKey: "AIzaSyDlOW1-vrW4uiXrveFPoBcJ1ImZlPqzzlA",
    authDomain: "consignaciones-ee423.firebaseapp.com",
    projectId: "consignaciones-ee423",
    storageBucket: "consignaciones-ee423.firebasestorage.app",
    messagingSenderId: "992838229253",
    appId: "1:992838229253:web:38462a4886e4ede6a7ab6c",
    measurementId: "G-K58BRH151H"
};

export const firebaseConfigPatients = {
    apiKey: "AIzaSyAREVJYLuZXqKAEzroVMtqEHvj1l2vE_lQ",
    authDomain: "implantes-d2fbd.firebaseapp.com",
    projectId: "implantes-d2fbd",
    storageBucket: "implantes-d2fbd.firebasestorage.app",
    messagingSenderId: "1063212294537",
    appId: "1:1063212294537:web:9e0cc7290109da704f4158",
    measurementId: "G-3XGJW3EHLQ"
};

// Inicialización de Firebase (sin cambios)
let appUsers;
if (!getApps().some(app => app.name === 'usersApp')) {
  appUsers = initializeApp(firebaseConfigUsers, 'usersApp');
} else {
  appUsers = getApps().find(app => app.name === 'usersApp');
}
const dbUsers = getFirestore(appUsers);
const authUsers = getAuth(appUsers);

let appConsignaciones;
if (!getApps().some(app => app.name === 'consignacionesApp')) {
  appConsignaciones = initializeApp(firebaseConfigConsignaciones, 'consignacionesApp');
} else {
  appConsignaciones = getApps().find(app => app.name === 'consignacionesApp');
}
const dbConsignaciones = getFirestore(appConsignaciones);

let appPatients;
if (!getApps().some(app => app.name === 'patientsApp')) {
  appPatients = initializeApp(firebaseConfigPatients, 'patientsApp');
} else {
  appPatients = getApps().find(app => app.name === 'patientsApp');
}
const dbPatients = getFirestore(appPatients);

const dbCodes = getFirestore(appUsers);

// Funciones auxiliares (sin cambios)
function formatDate(dateString) {
  if (!dateString) return "";
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-");
  return `${day}-${month}-${year}`;
}

function formatProperName(name) {
  if (!name) return "";
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function searchCode(code) {
  try {
    const codesRef = collection(dbCodes, "codigos");
    const q = query(codesRef, where("codigo", "==", code));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const codeData = querySnapshot.docs[0].data();
      return {
        reference: codeData.referencia || "",
        details: codeData.detalles || "",
        description: codeData.descripcion || "",
        systemPrice: codeData.precio || codeData.precioNeto || "0",
        grouping: codeData.clasificacion || "",
        provider: codeData.proveedor || ""
      };
    }
    return {
      reference: "",
      details: "",
      description: "",
      systemPrice: "0",
      grouping: "",
      provider: ""
    };
  } catch (error) {
    console.error("Error al buscar código:", error);
    return {
      reference: "",
      details: "",
      description: "",
      systemPrice: "0",
      grouping: "",
      provider: ""
    };
  }
}

async function guardarIngreso(event) {
  event.preventDefault();

  document.getElementById('overlayRegister').classList.remove('hidden');

  const usuario = document.getElementById('registerUsuario').textContent.trim();
  const admission = document.getElementById('registerAdmission').value;
  let patient = document.getElementById('registerPatient').value.trim();
  patient = formatProperName(patient);
  
  const doctorInput = document.getElementById('registerDoctorInput');
  const doctorId = doctorInput.dataset.doctorId || '';
  const doctorName = doctorInput.value.trim();
  const surgeryDate = document.getElementById('registerSurgeryDate').value;
  const description = document.getElementById('registerDescriptionInput').value;
  const quantity = document.getElementById('registerQuantity').value;
  const company = document.getElementById('registerCompany').value;
  const code = document.getElementById('registerCode').value;
  const price = document.getElementById('registerPrice').value;
  const attribute = document.getElementById('registerAttribute').value;
  const status = document.getElementById('registerStatus').value;
  const type = document.getElementById('registerType').value;
  const creationDate = new Date().toISOString().split("T")[0];

  // Validar que se haya seleccionado un médico
  if (!doctorId || !doctorName) {
    document.getElementById('overlayRegister').classList.add('hidden');
    document.getElementById('errorText').innerHTML = 'Por favor, seleccione un médico válido.';
    document.getElementById('messageError').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('messageError').classList.add('hidden');
    }, 6000);
    return;
  }

  try {
    const ingresosCollection = collection(dbConsignaciones, 'ingresos');
    await addDoc(ingresosCollection, {
      usuario,
      admission,
      patient,
      doctorId,
      nombre: doctorName,
      surgeryDate,
      description,
      quantity,
      company,
      code,
      price,
      attribute,
      status,
      type,
      creationDate
    });

    document.getElementById('overlayRegister').classList.add('hidden');
    document.getElementById('successText').innerHTML = `Se ha registrado con éxito el paciente <strong>${patient}</strong> con el código <strong>${code}</strong> y la descripción <strong>${description}</strong>.`;
    document.getElementById('messageSuccess').classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('messageSuccess').classList.add('hidden');
    }, 6000);

    // Limpiar SOLO los campos especificados después de guardar
    document.getElementById('registerDescriptionInput').value = '';
    document.getElementById('registerQuantity').value = '';
    document.getElementById('registerCompany').value = '';
    document.getElementById('registerCode').value = '';
    document.getElementById('registerPrice').value = '';
    document.getElementById('registerAttribute').value = 'Consignación'; // Restaurar valor por defecto

  } catch (error) {
    console.error("Error al guardar el ingreso:", error);
    document.getElementById('overlayRegister').classList.add('hidden');
    document.getElementById('errorText').innerHTML = `Error al registrar el ingreso: ${error.message}`;
    document.getElementById('messageError').classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('messageError').classList.add('hidden');
    }, 6000);
  }
}

// Event listeners para mensajes (sin cambios)
document.getElementById('closeMessageSuccess').addEventListener('click', () => {
  document.getElementById('messageSuccess').classList.add('hidden');
});
document.getElementById('closeMessageError').addEventListener('click', () => {
  document.getElementById('messageError').classList.add('hidden');
});

const btnSave = document.getElementById('btnSave');
btnSave.addEventListener('click', guardarIngreso);

// Cargar datos en la tabla (sin cambios)
const tableBody = document.getElementById('table-body');
const ingresosCollection = collection(dbConsignaciones, 'ingresos');
const q = query(ingresosCollection, orderBy('creationDate', 'asc'));
onSnapshot(q, (snapshot) => {
  tableBody.innerHTML = '';
  snapshot.forEach((doc) => {
    const ingreso = doc.data();
    const docId = doc.id;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <i class="fas fa-trash-alt delete-icon" data-id="${docId}" style="margin-right: 10px; cursor: pointer; color: #e74c3c;"></i>
        <i class="fas fa-edit edit-icon" data-id="${docId}" style="margin-right: 10px; cursor: pointer; color: #4CAF50;"></i>
      </td>
      <td>${ingreso.admission}</td>
      <td>${ingreso.patient}</td>
      <td>${ingreso.nombre}</td>
      <td>${formatDate(ingreso.surgeryDate)}</td>
      <td>${ingreso.company}</td>
      <td>${ingreso.code}</td>
      <td>${ingreso.description}</td>
      <td>${ingreso.quantity}</td>
      <td>${ingreso.price}</td>
      <td>${ingreso.attribute}</td>
      <td>${ingreso.status}</td>
      <td>${ingreso.type}</td>
      <td>${formatDate(ingreso.creationDate)}</td>
      <td>${ingreso.usuario}</td>
    `;
    tableBody.appendChild(row);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("table-body");
  const db = dbConsignaciones;
  let deleteId = null;
  let currentDocId = null;

  loadMedicos();

  tableBody.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-icon")) {
      deleteId = event.target.getAttribute("data-id");
      document.getElementById("confirmationDeleteContainerNew").classList.remove("hidden");
    }
  });

  document.getElementById("btnConfirmDeleteNew").addEventListener("click", async () => {
    if (deleteId) {
      document.getElementById("confirmationDeleteContainerNew").classList.add("hidden");
      document.getElementById("overlayDelete").classList.remove("hidden");

      try {
        await deleteDoc(doc(db, "ingresos", deleteId));
        document.getElementById("overlayDelete").classList.add("hidden");
        document.getElementById("messageSuccess").classList.remove("hidden");
        document.getElementById("successText").innerText = `Se ha eliminado el registro ${deleteId}`;
      } catch (error) {
        document.getElementById("overlayDelete").classList.add("hidden");
        document.getElementById("messageError").classList.remove("hidden");
        document.getElementById("errorText").innerText = `Error al eliminar: ${error.message}`;
      }
    }
  });

  // Ajustar el evento del botón "Limpiar"
  document.getElementById('btnReset').addEventListener('click', () => {
    // Limpiar SOLO los campos especificados
    document.getElementById('registerAdmission').value = '';
    document.getElementById('registerPatient').value = '';
    const doctorInput = document.getElementById('registerDoctorInput');
    doctorInput.value = '';
    delete doctorInput.dataset.doctorId;
    document.getElementById('registerSurgeryDate').value = '';
    // Los siguientes campos NO se limpian: registerUsuario, registerAttribute, registerStatus, registerType
  });

  document.getElementById("btnCancelDeleteNew").addEventListener("click", () => {
    document.getElementById("confirmationDeleteContainerNew").classList.add("hidden");
  });

  // Resto del código del DOMContentLoaded (editar, cerrar modales, etc.) sin cambios
  tableBody.addEventListener("click", async (event) => {
    if (event.target.classList.contains("edit-icon")) {
      const docId = event.target.getAttribute("data-id");
      currentDocId = docId;

      try {
        const docSnap = await getDoc(doc(db, "ingresos", docId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          document.getElementById("editModalTitle").innerText = `Editar: ${data.code}`;
          document.getElementById("editModalAdmissionValue").innerText = data.admission || "Sin admisión";
          document.getElementById("editModalPacienteValue").innerText = data.patient || "Sin paciente";
          document.getElementById("editModalProviderName").innerText = data.company || "Proveedor desconocido";
          document.getElementById("editModalAdmisionInput").value = data.admission || "";
          document.getElementById("editModalPacienteInput").value = data.patient || "";
          document.getElementById("editModalCantInput").value = data.quantity || "";
          document.getElementById("editModal").classList.add("visible");
          document.getElementById("editModalOverlay").classList.add("visible");
          document.getElementById("saveChangesButton").onclick = async () => {
            const updatedData = {
              admission: document.getElementById("editModalAdmisionInput").value,
              patient: document.getElementById("editModalPacienteInput").value,
              quantity: document.getElementById("editModalCantInput").value
            };

            try {
              await updateDoc(doc(db, "ingresos", currentDocId), updatedData);
              document.getElementById("editModal").classList.remove("visible");
              document.getElementById("editModalOverlay").classList.remove("visible");
              document.getElementById("messageSuccess").classList.remove("hidden");
              document.getElementById("successText").innerText = `Se ha actualizado el registro ${currentDocId}`;
            } catch (error) {
              document.getElementById("messageError").classList.remove("hidden");
              document.getElementById("errorText").innerText = `Error al actualizar: ${error.message}`;
            }
          };
        }
      } catch (error) {
        document.getElementById("messageError").classList.remove("hidden");
        document.getElementById("errorText").innerText = `Error al obtener datos: ${error.message}`;
      }
    }
  });

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.classList.add("hidden");
    });
  });

  const qOrdered = query(collection(db, "ingresos"), orderBy('creationDate', 'asc'));
  onSnapshot(qOrdered, (snapshot) => {
    tableBody.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const row = `
        <tr>
          <td>
            <i class="fas fa-trash-alt delete-icon" data-id="${docSnap.id}" style="margin-right: 10px; cursor: pointer; color: #e74c3c;"></i>
            <i class="fas fa-edit edit-icon" data-id="${docSnap.id}" style="margin-right: 10px; cursor: pointer; color: #4CAF50;"></i>
          </td>
          <td>${data.admission}</td>
          <td>${data.patient}</td>
          <td>${data.nombre}</td>
          <td>${formatDate(data.surgeryDate)}</td>
          <td>${data.company}</td>
          <td>${data.code}</td>
          <td>${data.description}</td>
          <td>${data.quantity}</td>
          <td>${data.price}</td>
          <td>${data.attribute}</td>
          <td>${data.status}</td>
          <td>${data.type}</td>
          <td>${formatDate(data.creationDate)}</td>
          <td>${data.usuario}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  });
});

// Funciones de traspaso (sin cambios)
async function obtenerSiguienteIdHistorial() {
  const historialCollection = collection(dbConsignaciones, "historial");
  const snapshot = await getDocs(historialCollection);

  let maxId = 250000;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.incrementalId) {
      const numId = parseInt(data.incrementalId, 10);
      if (!isNaN(numId) && numId > maxId) {
        maxId = numId;
      }
    }
  });

  const siguienteId = (maxId + 1).toString();
  return siguienteId;
}

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

async function traspasarIngresosAHistorial() {
  document.getElementById('overlayImport').classList.remove('hidden');

  try {
    const ingresosCollection = collection(dbConsignaciones, "ingresos");
    const snapshot = await getDocs(ingresosCollection);

    if (snapshot.empty) {
      alert("No hay datos para traspasar.");
      document.getElementById('overlayImport').classList.add('hidden');
      return;
    }

    let successfulHistorialTransfers = 0;
    let successfulPatientTransfers = 0;
    let successfulConsumoTransfers = 0;

    const patientTotals = new Map();
    const patientDataMap = new Map();
    const consumosToAdd = [];

    for (const docSnap of snapshot.docs) {
      const ingreso = docSnap.data();
      const patientKey = `${ingreso.admission || ''}-${ingreso.company || ''}`;
      const quantity = parseFloat(ingreso.quantity) || 0;
      const price = parseFloat(ingreso.price) || 0;
      const totalItem = quantity * price;

      if (patientTotals.has(patientKey)) {
        patientTotals.set(patientKey, patientTotals.get(patientKey) + totalItem);
      } else {
        patientTotals.set(patientKey, totalItem);
        patientDataMap.set(patientKey, ingreso);
      }

      const nuevoId = await obtenerSiguienteIdHistorial();
      const cadenaHistorial = String(ingreso.admission || "") + String(ingreso.code || "");
      const historialData = {
        ...ingreso,
        incrementalId: nuevoId,
        orden_de_compra: "",
        guia: "",
        factura: "",
        cadena: cadenaHistorial,
        admission: ingreso.admission || "",
        company: ingreso.company || "",
        code: ingreso.code || "",
        uniqueKey: `${ingreso.admission || ""}${ingreso.company || ""}${ingreso.code || ""}`, // Añadido aquí
        status: "ingresado"
      };
      await addDoc(collection(dbConsignaciones, "historial"), historialData);
      successfulHistorialTransfers++;

      const codeData = await searchCode(ingreso.code);
      const margin = calculateMargin(price);
      const marginNum = parseFloat(margin.replace("%", "")) / 100;
      let sale = totalItem.toString();
      const grouping = codeData.grouping || "consignacion";

      if (grouping.toLowerCase() === "cotizacion") {
        sale = (totalItem + (totalItem * 0.30)).toFixed(2);
      } else if (grouping.toLowerCase() === "consignacion") {
        sale = (totalItem + (totalItem * marginNum)).toFixed(2);
      }

      const cadenaConsumo = `${ingreso.admission || ""}${ingreso.company || ""}`;
      const consumoData = {
        entryDate: serverTimestamp(),
        id: ingreso.admission || "",
        quote: "0",
        reference: codeData.reference || "",
        quantity: ingreso.quantity || "0",
        price: ingreso.price || "0",
        details: codeData.details || "",
        totalQuote: "",
        totalGroup: "",
        match: "",
        chargeDate: "",
        status: "Pendiente",
        admission: ingreso.admission || "",
        code: ingreso.code || "",
        sale: sale,
        check: "pendiente",
        insurance: "",
        patientAdmission: ingreso.admission || "",
        patientName: ingreso.patient || "",
        doctor: ingreso.nombre || "",
        surgeryDate: ingreso.surgeryDate || "",
        provider: ingreso.company || "",
        codeDescription: ingreso.code || "",
        description: codeData.description || ingreso.description || "",
        itemQuantity: ingreso.quantity || "0",
        systemPrice: codeData.systemPrice || ingreso.price || "0",
        grouping: grouping,
        totalItem: totalItem.toString(),
        chain: cadenaConsumo,
        margin: margin,
        creationDate: serverTimestamp(),
        user: ingreso.usuario || "Usuario desconocido",
        uniqueKey: `${ingreso.admission || ""}${ingreso.company || ""}${ingreso.code || ""}`, // Añadido aquí
        status: "ingresado"
      };
      consumosToAdd.push(consumoData);
    }

    for (const consumoData of consumosToAdd) {
      const patientKey = `${consumoData.admission || ''}-${consumoData.provider || ''}`;
      const totalSum = patientTotals.get(patientKey).toString();
      consumoData.totalQuote = totalSum;
      consumoData.totalGroup = totalSum;
      await addDoc(collection(dbPatients, "consumos"), consumoData);
      successfulConsumoTransfers++;
    }

    for (const [patientKey, totalQuote] of patientTotals) {
      const ingreso = patientDataMap.get(patientKey);
      const patientData = {
        admission: ingreso.admission || "",
        patient: ingreso.patient || "",
        doctor: ingreso.doctorId || "",
        doctorName: ingreso.nombre || "",
        surgeryDate: ingreso.surgeryDate || "",
        provider: ingreso.company || "",
        providerName: ingreso.company || "",
        attribute: "Consignación",
        totalQuote: totalQuote.toString(),
        report: "Consig.",
        status: "Pendiente",
        entryDate: serverTimestamp(),
        creationDate: serverTimestamp(),
        user: ingreso.usuario || "Usuario desconocido"
      };
      await addDoc(collection(dbPatients, "pacientes"), patientData);
      successfulPatientTransfers++;
    }

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(dbConsignaciones, "ingresos", docSnap.id));
    }

    document.getElementById('overlayImport').classList.add('hidden');
    document.getElementById('successText').innerHTML = `Traspaso realizado con éxito. Se traspasaron ${successfulHistorialTransfers} registros a 'historial', ${successfulPatientTransfers} registros únicos a 'pacientes', y ${successfulConsumoTransfers} registros a 'consumos'.`;
    document.getElementById('messageSuccess').classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('messageSuccess').classList.add('hidden');
    }, 6000);
  } catch (error) {
    console.error("Error al traspasar ingresos:", error);
    document.getElementById('overlayImport').classList.add('hidden');
    document.getElementById('errorText').innerHTML = `Error en el traspaso: ${error.message}`;
    document.getElementById('messageError').classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('messageError').classList.add('hidden');
    }, 6000);
  }
}

document.getElementById('saveButton').addEventListener('click', traspasarIngresosAHistorial);