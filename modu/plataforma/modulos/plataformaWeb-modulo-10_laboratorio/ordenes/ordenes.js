import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Habilita persistencia offline para Firestore
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.error('Persistencia offline no disponible: múltiples pestañas abiertas.');
    } else if (err.code === 'unimplemented') {
        console.error('Persistencia offline no soportada por este navegador.');
    }
});

let orders = [];
let currentPage = 1;
const recordsPerPage = 100;

document.addEventListener('DOMContentLoaded', () => {
    initializeMonthYearSelectors();
    loadOrders();
    setupEventListeners();
});

function initializeMonthYearSelectors() {
    const monthSelector = document.getElementById('monthSelector');
    const yearSelector = document.getElementById('yearSelector');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelector.appendChild(option);
    });

    for (let year = currentYear - 1; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelector.appendChild(option);
    }

    monthSelector.value = currentMonth + 1;
    yearSelector.value = currentYear;

    monthSelector.addEventListener('change', () => applyCurrentFilter());
    yearSelector.addEventListener('change', () => applyCurrentFilter());
}

function setupEventListeners() {
    document.getElementById('btnImport').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = handleFileUpload;
        input.click();
    });

    document.getElementById('pendingFilterBtn').addEventListener('click', () => {
        currentFilter = 'Pendiente';
        applyCurrentFilter();
    });
    document.getElementById('allFilterBtn').addEventListener('click', () => {
        currentFilter = 'Todas';
        applyCurrentFilter();
    });
    document.getElementById('btnDownload').addEventListener('click', clearDatabase);
    document.getElementById('btnPrevious').addEventListener('click', previousPage);
    document.getElementById('btnNext').addEventListener('click', nextPage);
    document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcel);
    document.getElementById('btnFormat').addEventListener('click', downloadFormat);
}

let currentFilter = 'Todas'; // Estado del filtro actual ("Pendiente" o "Todas")

async function handleFileUpload(e) {
    const file = e.target.files[0];
    const overlayImport = document.getElementById('overlayImport');
    const progressText = document.getElementById('progress-text');

    if (!file) return; // Si no hay archivo, salir

    if (!overlayImport || !progressText) {
        console.error('Error: Elementos #overlayImport o #progress-text no encontrados en el HTML.');
        return;
    }

    // Mostrar el overlay inmediatamente
    overlayImport.classList.remove('hidden'); // Asegurarse de que no esté oculto
    overlayImport.classList.add('show');
    overlayImport.style.display = 'flex';
    progressText.textContent = '0%';

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const existingOrders = await getDocs(collection(db, 'ordenes'));
            const existingMap = new Map();
            existingOrders.forEach(doc => existingMap.set(doc.id, doc.data()));

            let processed = 0;
            const totalRows = jsonData.length;

            for (const row of jsonData) {
                const orderId = row['Código'].toString();
                const newOrder = {
                    codigo: row['Código'] || '',
                    generacion: formatDate(row['Generación']),
                    autorizacion: formatDate(row['Autorización']),
                    sociedad: row['Sociedad'] || '',
                    tipoCompra: row['Tipo compra'] || '',
                    proveedor: row['Proveedor'] || '',
                    digitador: row['Digitador'] || '',
                    nivelActual: row['Nivel Actual'] || '',
                    nivelOC: row['Nivel OC'] || '',
                    liberada: row['Liberada'] || '',
                    total: row['Total'] || 0,
                    estado: row['Estado'] || ''
                };

                const existingOrder = existingMap.get(orderId);
                if (!existingOrder || JSON.stringify(existingOrder) !== JSON.stringify(newOrder)) {
                    await setDoc(doc(db, 'ordenes', orderId), newOrder);
                }

                processed++;
                const percentage = Math.round((processed / totalRows) * 100);
                progressText.textContent = `${percentage}%`;

                // Añadir un pequeño retraso para que el spinner sea visible
                await new Promise(resolve => setTimeout(resolve, 50)); // Reducido de 200ms a 50ms para mejor rendimiento
            }

            // Actualizar la interfaz después de la importación
            await loadOrders();

            if (orders.length > 0) {
                const firstOrder = orders[0];
                if (firstOrder.generacion) {
                    const [, monthStr, yearStr] = firstOrder.generacion.split('-');
                    document.getElementById('monthSelector').value = parseInt(monthStr);
                    document.getElementById('yearSelector').value = parseInt(yearStr);
                }
            }

            applyCurrentFilter();
        } catch (error) {
            console.error('Error durante la importación:', error);
            progressText.textContent = 'Error al importar';
        } finally {
            // Ocultar el overlay al finalizar
            setTimeout(() => {
                overlayImport.classList.remove('show');
                overlayImport.classList.add('hidden');
                overlayImport.style.display = 'none';
            }, 500); // Retraso para que el usuario vea el 100%
        }
    };

    reader.onerror = () => {
        console.error('Error al leer el archivo');
        progressText.textContent = 'Error al leer el archivo';
        overlayImport.classList.remove('show');
        overlayImport.classList.add('hidden');
        overlayImport.style.display = 'none';
    };

    reader.readAsArrayBuffer(file);
}

function formatDate(dateValue) {
    if (!dateValue) return '';
    let date;
    if (typeof dateValue === 'number') {
        date = new Date((dateValue - 25569) * 86400 * 1000);
    } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else {
        return String(dateValue);
    }

    if (isNaN(date.getTime())) return String(dateValue);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

async function loadOrders() {
    const overlayLoading = document.getElementById('overlayLoading');
    const progressPercentage = document.getElementById('progressPercentageLoading');
    overlayLoading.classList.add('show');
    overlayLoading.style.display = 'flex';

    try {
        const querySnapshot = await getDocs(collection(db, 'ordenes'));
        orders = [];
        querySnapshot.forEach((doc) => {
            orders.push(doc.data());
        });
        progressPercentage.textContent = '100%';
    } catch (error) {
        console.error('Error cargando órdenes:', error.code, error.message);
        progressPercentage.textContent = `Error: ${error.message}`;
    } finally {
        setTimeout(() => {
            overlayLoading.classList.remove('show');
            overlayLoading.style.display = 'none';
        }, 500);
    }

    applyCurrentFilter();
}

function toggleFilter(columnIndex) {
    const filterInputs = document.querySelectorAll('.filter-input');
    const currentInput = filterInputs[columnIndex];
    currentInput.classList.toggle('hidden');
    if (!currentInput.classList.contains('hidden')) {
        currentInput.focus();
    }
}

function filterTable(columnIndex) {
    const filterInputs = document.querySelectorAll('.filter-input');
    const filterValue = filterInputs[columnIndex].value.toLowerCase();

    const month = parseInt(document.getElementById('monthSelector').value);
    const year = parseInt(document.getElementById('yearSelector').value);

    // Filtrar por mes y año
    let filteredByDate = orders.filter(order => {
        if (typeof order.generacion !== 'string' || !order.generacion) return false;
        const [, monthStr, yearStr] = order.generacion.split('-');
        return parseInt(monthStr) === month && parseInt(yearStr) === year;
    });

    // Aplicar filtro "Pendiente" o "Todas"
    let filteredOrders = currentFilter === 'Pendiente' 
        ? filteredByDate.filter(order => order.estado !== 'Autorizada') 
        : filteredByDate;

    // Aplicar filtros acumulativos
    filterInputs.forEach((input, index) => {
        const value = input.value.trim().toLowerCase();
        if (value && !input.classList.contains('hidden')) {
            const columnKeys = ['codigo', 'generacion', 'autorizacion', 'sociedad', 'tipoCompra', 'proveedor', 'digitador', 'nivelActual', 'nivelOC', 'liberada', 'total', 'estado'];
            const key = columnKeys[index];
            filteredOrders = filteredOrders.filter(order => 
                String(order[key]).toLowerCase().includes(value)
            );
        }
    });

    displayOrders(filteredOrders);
}

function applyCurrentFilter() {
    const month = parseInt(document.getElementById('monthSelector').value);
    const year = parseInt(document.getElementById('yearSelector').value);

    const filteredByDate = orders.filter(order => {
        if (typeof order.generacion !== 'string' || !order.generacion) return false;
        const [, monthStr, yearStr] = order.generacion.split('-');
        return parseInt(monthStr) === month && parseInt(yearStr) === year;
    });

    let finalFilteredOrders = currentFilter === 'Pendiente' 
        ? filteredByDate.filter(order => order.estado !== 'Autorizada') 
        : filteredByDate;

    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach((input, index) => {
        const value = input.value.trim().toLowerCase();
        if (value && !input.classList.contains('hidden')) {
            const columnKeys = ['codigo', 'generacion', 'autorizacion', 'sociedad', 'tipoCompra', 'proveedor', 'digitador', 'nivelActual', 'nivelOC', 'liberada', 'total', 'estado'];
            const key = columnKeys[index];
            finalFilteredOrders = finalFilteredOrders.filter(order => 
                String(order[key]).toLowerCase().includes(value)
            );
        }
    });

    displayOrders(finalFilteredOrders);
}

function displayOrders(filteredOrders) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedOrders = filteredOrders.slice(start, end);

    paginatedOrders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.codigo}</td>
            <td>${order.generacion}</td>
            <td>${order.autorizacion}</td>
            <td>${order.sociedad}</td>
            <td>${order.tipoCompra}</td>
            <td>${order.proveedor}</td>
            <td>${order.digitador}</td>
            <td>${order.nivelActual}</td>
            <td>${order.nivelOC}</td>
            <td>${order.liberada}</td>
            <td>${order.total}</td>
            <td>${order.estado}</td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination(filteredOrders.length);
}

function updatePagination(totalRecords) {
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    document.getElementById('pageNumber').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('recordCount').textContent = `Total de registros: ${totalRecords}`;
    document.getElementById('btnPrevious').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage === totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        applyCurrentFilter();
    }
}

function nextPage() {
    const totalPages = Math.ceil(orders.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        applyCurrentFilter();
    }
}

async function clearDatabase() {
    const overlayDelete = document.getElementById('overlayDelete');
    const deleteProgressText = document.getElementById('delete-progress-text');
    overlayDelete.classList.add('show');
    overlayDelete.style.display = 'flex';

    try {
        const querySnapshot = await getDocs(collection(db, 'ordenes'));
        let processed = 0;
        const total = querySnapshot.size;

        for (const docSnap of querySnapshot.docs) {
            await deleteDoc(doc(db, 'ordenes', docSnap.id));
            processed++;
            deleteProgressText.textContent = `${Math.round((processed / total) * 100)}%`;
        }
    } catch (error) {
        console.error('Error eliminando registros:', error.code, error.message);
        deleteProgressText.textContent = `Error: ${error.message}`;
    } finally {
        overlayDelete.classList.remove('show');
        overlayDelete.style.display = 'none';
        orders = [];
        displayOrders([]);
    }
}

function downloadFormat() {
    const formatData = [{
        'Código': '',
        'Generación': '',
        'Autorización': '',
        'Sociedad': '',
        'Tipo compra': '',
        'Proveedor': '',
        'Digitador': '',
        'Nivel Actual': '',
        'Nivel OC': '',
        'Liberada': '',
        'Total': '',
        'Estado': ''
    }];

    const worksheet = XLSX.utils.json_to_sheet(formatData);
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    range.s.r = 0;
    range.e.r = 0;
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Formato');
    XLSX.writeFile(workbook, 'formato_ordenes.xlsx');
}

function downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet(orders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordenes');
    XLSX.writeFile(workbook, 'ordenes.xlsx');
}

// Exportar funciones al ámbito global
window.toggleFilter = toggleFilter;
window.filterTable = filterTable;