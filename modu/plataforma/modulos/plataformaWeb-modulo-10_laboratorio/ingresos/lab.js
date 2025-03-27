// Importar Firebase como módulos
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDXPdub3tHM9K2zUViBuC05CL6M-zE_IM4",
    authDomain: "cajas-11e7b.firebaseapp.com",
    projectId: "cajas-11e7b",
    storageBucket: "cajas-11e7b.firebasestorage.app",
    messagingSenderId: "106380626220",
    appId: "1:106380626220:web:4a1741a20624bc177a8489",
    measurementId: "G-MZZYHPPECZ"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const detallesCollection = collection(db, "detalles");

// Elementos del DOM
const form = document.getElementById('formRegisterContainer');
const tableBody = document.getElementById('table-body');
const overlayRegister = document.getElementById('overlayRegister');
const overlayDelete = document.getElementById('overlayDelete');
const overlayImport = document.getElementById('overlayImport');
const messageSuccess = document.getElementById('messageSuccess');
const successText = document.getElementById('successText');
const monthSelector = document.getElementById('monthSelector');
const yearSelector = document.getElementById('yearSelector');
const allFilterBtn = document.getElementById('allFilterBtn');
const pendingFilterBtn = document.getElementById('pendingFilterBtn');
const btnPrevious = document.getElementById('btnPrevious');
const btnNext = document.getElementById('btnNext');
const pageNumber = document.getElementById('pageNumber');
const invoiceInput = document.getElementById('registerInvoice');
const amountInput = document.getElementById('registerInvoiceAmount');
const ocInput = document.getElementById('registerOc');
const ocDateInput = document.getElementById('registerOcDate');
const providerInput = document.getElementById('registerProvider');
const confirmationDeleteContainer = document.getElementById('confirmationDeleteContainerNew');
const btnConfirmDelete = document.getElementById('btnConfirmDeleteNew');
const btnCancelDelete = document.getElementById('btnCancelDeleteNew');
const closeConfirmationDelete = document.getElementById('closeConfirmationDeleteNew');
const editModalOverlay = document.getElementById('editModalOverlay');
const editModal = document.getElementById('editModal');
const editModalTitle = document.getElementById('editModalTitle');
const editModalActa = document.getElementById('editModalActa');
const editModalExitDate = document.getElementById('editModalExitDate');
const editModalExitNumber = document.getElementById('editModalExitNumber');
const saveChangesButton = document.getElementById('saveChangesButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const closeEditModal = document.getElementById('closeEditModal');
const importFileInput = document.getElementById('importFile');
const btnImport = document.getElementById('btnImport');
const btnDownloadFormat = document.getElementById('btnDownloadFormat');

let currentPage = 1;
const rowsPerPage = 50;
let allData = [];
let filters = Array(17).fill('');
let deleteDocId = null;
let currentEditDocId = null;

// Llenar selectores de mes y año
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index + 1;
    option.textContent = month;
    if (index === currentMonth) option.selected = true;
    monthSelector.appendChild(option);
});

for (let year = currentYear - 1; year <= currentYear + 5; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === currentYear) option.selected = true;
    yearSelector.appendChild(option);
}

// Generar ID automático (personalizado)
async function generateId() {
    const docs = await new Promise(resolve => onSnapshot(detallesCollection, snap => resolve(snap.docs)));
    const maxId = docs.length ? Math.max(...docs.map(doc => parseInt(doc.data().id.slice(1)))) : 0;
    return `F${String(maxId + 1).padStart(4, '0')}`;
}

// Formato de fecha (dd-mm-yyyy)
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Convertir formato "yyyy-mm-dd" a "dd-mm-yyyy"
function convertToDDMMYYYY(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}

// Convertir formato "dd-mm-yyyy" a "yyyy-mm-dd" para input type="date"
function convertToDateInputFormat(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
}

// Convertir número de Excel a fecha (dd-mm-yyyy)
function excelSerialToDate(serial) {
    if (typeof serial !== 'number' || isNaN(serial)) return serial; // Si no es un número, devolver tal cual

    // Excel cuenta los días desde el 1 de enero de 1900, pero tiene un error con el año bisiesto de 1900
    const excelEpoch = new Date(1900, 0, 1); // 1 de enero de 1900
    const daysOffset = serial - 2; // Restar 2 días por el error del año bisiesto
    const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    return formatDate(date);
}

// Convertir nombre del mes a número
function monthNameToNumber(monthName) {
    const monthMap = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
        'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };
    return monthMap[monthName.toLowerCase()] || parseInt(monthName) || 0;
}

// Formato de monto en pesos chilenos sin decimales ni signo
function formatCLP(amount) {
    const num = parseInt(amount.toString().replace(/\D/g, '')) || 0;
    return num.toLocaleString('es-CL', { style: 'decimal', maximumFractionDigits: 0 });
}

// Buscar OC en la colección "ordenes" y autocompletar campos
async function searchOrderByOC(ocNumber) {
    if (!ocNumber) {
        ocDateInput.value = '';
        providerInput.value = '';
        return;
    }

    try {
        const orderRef = doc(db, 'ordenes', ocNumber);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            ocDateInput.value = convertToDateInputFormat(orderData.generacion);
            providerInput.value = orderData.proveedor || '';
        } else {
            ocDateInput.value = '';
            providerInput.value = '';
            console.warn(`No se encontró la OC ${ocNumber} en la colección 'ordenes'`);
        }
    } catch (error) {
        console.error('Error al buscar la OC:', error);
        ocDateInput.value = '';
        providerInput.value = '';
    }
}

// Manejar el formato del monto en tiempo real
amountInput.addEventListener('input', () => {
    let value = amountInput.value.replace(/\D/g, '');
    if (value) {
        amountInput.value = formatCLP(value);
    }
});

amountInput.addEventListener('blur', () => {
    let value = amountInput.value.replace(/\D/g, '');
    if (value) {
        amountInput.value = formatCLP(value);
    } else {
        amountInput.value = '';
    }
});

// Permitir solo números en el campo de factura
invoiceInput.addEventListener('input', () => {
    invoiceInput.value = invoiceInput.value.replace(/\D/g, '');
});

// Buscar OC cuando el usuario termine de ingresar el número
ocInput.addEventListener('blur', () => {
    const ocNumber = ocInput.value.trim();
    searchOrderByOC(ocNumber);
});

// Guardar datos en Firestore (registro inicial)
// Guardar datos en Firestore (registro inicial)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    overlayRegister.classList.remove('hidden');

    const invoiceNumber = invoiceInput.value.trim();
    const entryDate = new Date();
    const id = await generateId();
    const usuario = document.getElementById('registerUsuario').textContent;
    const montoRaw = amountInput.value.replace(/\./g, '');
    const fechaEmisionRaw = document.getElementById('registerIssueDate').value; // yyyy-mm-dd
    const fechaEmision = fechaEmisionRaw ? convertToDDMMYYYY(fechaEmisionRaw) : ''; // Convertir a dd-mm-yyyy

    // Verificar si la factura ya existe en la base de datos
    const q = query(detallesCollection, orderBy('factura'));
    const snapshot = await new Promise(resolve => onSnapshot(q, snap => resolve(snap)));
    const existingInvoice = snapshot.docs.find(doc => doc.data().factura === invoiceNumber);

    if (existingInvoice) {
        // Mostrar mensaje de advertencia si la factura ya existe
        overlayRegister.classList.add('hidden');
        const messageWarning = document.getElementById('messageWarning');
        const warningText = document.getElementById('warningText');
        warningText.textContent = `Advertencia: La factura ${invoiceNumber} ya se encuentra ingresada en el sistema. Por favor, revisa el número de factura.`;
        messageWarning.classList.remove('hidden');
        setTimeout(() => messageWarning.classList.add('hidden'), 5000); // Ocultar después de 5 segundos
        return; // Detener la ejecución para no guardar el registro
    }

    // Si no existe, proceder a guardar el registro
    const data = {
        id: id,
        digitadoPor: usuario,
        factura: invoiceNumber,
        fechaEmision: fechaEmision, // Guardar como dd-mm-yyyy
        monto: parseInt(montoRaw) || 0,
        oc: ocInput.value,
        fechaOc: ocDateInput.value,
        proveedor: providerInput.value,
        fechaIngreso: formatDate(entryDate),
        mesIngreso: entryDate.getMonth() + 1,
        añoIngreso: entryDate.getFullYear(),
        acta: '',
        fechaSalida: '',
        numeroSalida: '',
        mesSalida: '',
        añoSalida: '',
        usuario: usuario
    };

    try {
        await addDoc(detallesCollection, data);
        overlayRegister.classList.add('hidden');
        successText.textContent = 'Registro guardado exitosamente';
        messageSuccess.classList.remove('hidden');
        setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
        form.reset();
    } catch (error) {
        console.error('Error al guardar:', error);
        overlayRegister.classList.add('hidden');
        successText.textContent = 'Error al guardar el registro';
        messageSuccess.classList.remove('hidden');
        setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
    }
});

// Mostrar modal de confirmación para eliminar
window.showDeleteConfirmation = (docId) => {
    deleteDocId = docId;
    confirmationDeleteContainer.classList.remove('hidden');
};

// Eliminar registro con spinner y mensaje
async function deleteItem() {
    if (!deleteDocId) {
        console.error('No hay ID de documento para eliminar');
        return;
    }

    confirmationDeleteContainer.classList.add('hidden');
    overlayDelete.classList.remove('hidden');

    try {
        const docRef = doc(db, 'detalles', deleteDocId);
        await deleteDoc(docRef);
        overlayDelete.classList.add('hidden');
        successText.textContent = 'Registro eliminado exitosamente';
        messageSuccess.classList.remove('hidden');
        setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
        deleteDocId = null;
    } catch (error) {
        console.error('Error al eliminar el documento:', error);
        overlayDelete.classList.add('hidden');
        successText.textContent = 'Error al eliminar el registro';
        messageSuccess.classList.remove('hidden');
        setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
    }
}

// Configurar eventos del modal de confirmación
btnConfirmDelete.addEventListener('click', deleteItem);
btnCancelDelete.addEventListener('click', () => confirmationDeleteContainer.classList.add('hidden'));
closeConfirmationDelete.addEventListener('click', () => confirmationDeleteContainer.classList.add('hidden'));

// Mostrar modal de edición
window.viewItem = (docId) => {
    const item = allData.find(data => data.docId === docId);
    if (!item) {
        console.error('No se encontró el documento con ID:', docId);
        return;
    }

    currentEditDocId = docId;
    editModalTitle.textContent = `${item.proveedor} - ${item.factura} - ${item.oc}`;
    editModalActa.value = item.acta || '';
    editModalExitDate.value = item.fechaSalida ? convertToDateInputFormat(item.fechaSalida) : '';
    editModalExitNumber.value = item.numeroSalida || '';

    editModalOverlay.classList.remove('hidden');
    editModalOverlay.classList.add('visible');
    editModal.classList.remove('hidden');
    editModal.classList.add('visible');
};

// Guardar cambios en Firestore desde el modal
saveChangesButton.addEventListener('click', async () => {
    if (!currentEditDocId) {
        console.error('No hay ID de documento para editar');
        return;
    }

    const exitDate = new Date(editModalExitDate.value);
    const updatedData = {
        acta: editModalActa.value,
        fechaSalida: editModalExitDate.value ? formatDate(exitDate) : '',
        numeroSalida: editModalExitNumber.value,
        mesSalida: editModalExitDate.value ? exitDate.getMonth() + 1 : '',
        añoSalida: editModalExitDate.value ? exitDate.getFullYear() : ''
    };

    try {
        const docRef = doc(db, 'detalles', currentEditDocId);
        await updateDoc(docRef, updatedData);
        editModalOverlay.classList.add('hidden');
        editModalOverlay.classList.remove('visible');
        editModal.classList.add('hidden');
        editModal.classList.remove('visible');
        successText.textContent = 'Datos agregados exitosamente';
        messageSuccess.classList.remove('hidden');
        setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
        currentEditDocId = null;
    } catch (error) {
        console.error('Error al actualizar el documento:', error);
        successText.textContent = 'Error al agregar datos';
        messageSuccess.classList.remove('hidden');
        setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
    }
});

// Cerrar modal sin guardar
cancelEditButton.addEventListener('click', () => {
    editModalOverlay.classList.add('hidden');
    editModalOverlay.classList.remove('visible');
    editModal.classList.add('hidden');
    editModal.classList.remove('visible');
    currentEditDocId = null;
});

closeEditModal.addEventListener('click', () => {
    editModalOverlay.classList.add('hidden');
    editModalOverlay.classList.remove('visible');
    editModal.classList.add('hidden');
    editModal.classList.remove('visible');
    currentEditDocId = null;
});

// Restringir a solo números en los campos Acta y Número de Salida
editModalActa.addEventListener('input', () => {
    editModalActa.value = editModalActa.value.replace(/\D/g, '');
});
editModalExitNumber.addEventListener('input', () => {
    editModalExitNumber.value = editModalExitNumber.value.replace(/\D/g, '');
});

// Cargar datos en tiempo real
function loadData() {
    const q = query(detallesCollection, orderBy('id'));
    onSnapshot(q, (snapshot) => {
        allData = snapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        }));
        renderTable();
    }, (error) => {
        console.error('Error al cargar datos:', error);
    });
}

// Renderizar tabla con paginación y filtros
function renderTable() {
    let filteredData = allData;
    const selectedMonth = parseInt(monthSelector.value);
    const selectedYear = parseInt(yearSelector.value);

    // Mostrar todos los datos si "Ver todos los registros" está activado
    const showAll = document.getElementById('allFilterToggle').checked;

    if (!showAll) {
        filteredData = filteredData.filter(item => {
            const matchesMonth = item.mesIngreso === selectedMonth;
            const matchesYear = item.añoIngreso === selectedYear;
            return matchesMonth && matchesYear;
        });
    }

    filteredData = filteredData.filter(item => {
        return filters.every((filter, index) => {
            if (!filter) return true;
            const value = [
                '', // Acciones
                item.id,
                item.fechaIngreso,
                item.factura,
                item.fechaEmision,
                formatCLP(item.monto.toString()),
                item.oc,
                item.fechaOc,
                item.proveedor,
                item.acta,
                item.fechaSalida,
                item.numeroSalida,
                item.mesIngreso.toString(),
                item.añoIngreso.toString(),
                item.mesSalida.toString(),
                item.añoSalida.toString(),
                item.usuario
            ][index];
            return value && value.toString().toLowerCase().includes(filter.toLowerCase());
        });
    });

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = filteredData.slice(start, end);

    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="17">No se encontraron registros para los filtros seleccionados.</td></tr>';
    } else {
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <i class="fas fa-trash-alt" style="color: red; cursor: pointer; margin-right: 10px;" onclick="showDeleteConfirmation('${item.docId}')"></i>
                    <i class="fas fa-eye" style="color: blue; cursor: pointer;" onclick="viewItem('${item.docId}')"></i>
                </td>
                <td>${item.id}</td>
                <td>${item.fechaIngreso}</td>
                <td>${item.factura}</td>
                <td>${item.fechaEmision}</td>
                <td>${formatCLP(item.monto.toString())}</td>
                <td>${item.oc}</td>
                <td>${item.fechaOc}</td>
                <td>${item.proveedor}</td>
                <td>${item.acta}</td>
                <td>${item.fechaSalida}</td>
                <td>${item.numeroSalida}</td>
                <td>${item.mesIngreso}</td>
                <td>${item.añoIngreso}</td>
                <td>${item.mesSalida}</td>
                <td>${item.añoSalida}</td>
                <td>${item.usuario}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    pageNumber.textContent = `Página ${currentPage} de ${totalPages}`;
    btnPrevious.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
}

// Importar registros desde Excel (.xlsx)
btnImport.addEventListener('click', async () => {
    const file = importFileInput.files[0];
    if (!file) {
        alert('Por favor, selecciona un archivo Excel (.xlsx).');
        return;
    }

    overlayImport.classList.remove('hidden');

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // La primera fila son los encabezados
            const headers = jsonData[0].map(header => header.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            const rows = jsonData.slice(1);

            const fieldMap = {
                'id': 'id',
                'digitadoPor': 'digitadoPor',
                'factura': 'factura',
                'fechaEmision': 'fechaEmision',
                'monto': 'monto',
                'oc': 'oc',
                'fechaOc': 'fechaOc',
                'proveedor': 'proveedor',
                'fechaIngreso': 'fechaIngreso',
                'mesIngreso': 'mesIngreso',
                'anoIngreso': 'añoIngreso',
                'acta': 'acta',
                'fechaSalida': 'fechaSalida',
                'numeroSalida': 'numeroSalida',
                'mesSalida': 'mesSalida',
                'anoSalida': 'añoSalida',
                'usuario': 'usuario'
            };

            for (const row of rows) {
                if (!row || row.length === 0) continue;

                const rowData = {};
                headers.forEach((header, index) => {
                    const normalizedHeader = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const field = Object.keys(fieldMap).find(key => key.toLowerCase() === normalizedHeader);
                    if (field) {
                        let value = row[index] ? row[index] : '';
                        if (['fechaEmision', 'fechaOc', 'fechaIngreso', 'fechaSalida'].includes(fieldMap[field])) {
                            value = excelSerialToDate(value); // Convertir número serial de Excel a "dd-mm-yyyy"
                        }
                        rowData[fieldMap[field]] = value.toString().trim();
                    }
                });

                // Generar ID único
                const id = await generateId();

                // Procesar fechaIngreso para mesIngreso y añoIngreso
                let fechaIngresoDate;
                if (rowData.fechaIngreso) {
                    const [day, month, year] = rowData.fechaIngreso.split('-').map(Number);
                    fechaIngresoDate = new Date(year, month - 1, day); // Meses en JS son 0-based
                } else {
                    fechaIngresoDate = new Date(); // Fecha actual si no hay fechaIngreso
                    rowData.fechaIngreso = formatDate(fechaIngresoDate);
                }

                // Procesar fechaSalida para mesSalida y añoSalida
                let fechaSalidaDate = null;
                if (rowData.fechaSalida) {
                    const [day, month, year] = rowData.fechaSalida.split('-').map(Number);
                    fechaSalidaDate = new Date(year, month - 1, day);
                }

                // Preparar datos para Firestore
                const dataToSave = {
                    id: id,
                    digitadoPor: rowData.digitadoPor || 'Importado',
                    factura: rowData.factura || '',
                    fechaEmision: rowData.fechaEmision || '',
                    monto: parseInt(rowData.monto.toString().replace(/\./g, '')) || 0,
                    oc: rowData.oc || '',
                    fechaOc: rowData.fechaOc || '',
                    proveedor: rowData.proveedor || '',
                    fechaIngreso: rowData.fechaIngreso || formatDate(fechaIngresoDate),
                    mesIngreso: fechaIngresoDate.getMonth() + 1, // Mes de fechaIngreso (1-12)
                    añoIngreso: fechaIngresoDate.getFullYear(),  // Año de fechaIngreso
                    acta: rowData.acta || '',
                    fechaSalida: rowData.fechaSalida || '',
                    numeroSalida: rowData.numeroSalida || '',
                    mesSalida: fechaSalidaDate ? fechaSalidaDate.getMonth() + 1 : '', // Mes de fechaSalida (1-12)
                    añoSalida: fechaSalidaDate ? fechaSalidaDate.getFullYear() : '', // Año de fechaSalida
                    usuario: rowData.usuario || 'Importado'
                };

                await addDoc(detallesCollection, dataToSave);
            }

            overlayImport.classList.add('hidden');
            successText.textContent = 'Registros importados exitosamente';
            messageSuccess.classList.remove('hidden');
            setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
            importFileInput.value = '';
        };

        reader.onerror = () => {
            overlayImport.classList.add('hidden');
            successText.textContent = 'Error al leer el archivo Excel';
            messageSuccess.classList.remove('hidden');
            setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
        };

        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error al importar registros:', error);
        overlayImport.classList.add('hidden');
        successText.textContent = 'Error al importar registros';
        messageSuccess.classList.remove('hidden');
        setTimeout(() => messageSuccess.classList.add('hidden'), 3000);
    }
});

// Descargar formato Excel para importación
btnDownloadFormat.addEventListener('click', () => {
    const headers = [
        'id', 'digitadoPor', 'factura', 'fechaEmision', 'monto', 'oc', 'fechaOc', 'proveedor',
        'fechaIngreso', 'mesIngreso', 'añoIngreso', 'acta', 'fechaSalida', 'numeroSalida',
        'mesSalida', 'añoSalida', 'usuario'
    ];
    const wsData = [headers]; // Solo los encabezados, sin datos de ejemplo

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Formato_Importacion");
    XLSX.writeFile(wb, "Formato_Importacion_Detalles.xlsx");
});

// Paginación
btnPrevious.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

btnNext.addEventListener('click', () => {
    const totalPages = Math.ceil(allData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

// Filtros de columnas
window.toggleFilter = (column) => {
    const filterInput = document.getElementsByClassName('filter-input')[column];
    filterInput.classList.toggle('hidden');
};

window.filterTable = (column) => {
    filters[column] = document.getElementsByClassName('filter-input')[column].value;
    currentPage = 1;
    renderTable();
};

// Botones de filtro
allFilterBtn.addEventListener('click', () => {
    allFilterBtn.dataset.showAll = 'true';
    renderTable();
});

pendingFilterBtn.addEventListener('click', () => {
    allFilterBtn.dataset.showAll = 'false';
    filters.fill('');
    document.querySelectorAll('.filter-input').forEach(input => input.value = '');
    currentPage = 1;
    renderTable();
});

// Cambios en selectores
monthSelector.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
});

yearSelector.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
});

// Actualizar tabla cuando cambie el filtro "Ver todos los registros"
document.getElementById('allFilterToggle').addEventListener('change', () => {
    currentPage = 1;
    renderTable();
});

// Inicializar
loadData();