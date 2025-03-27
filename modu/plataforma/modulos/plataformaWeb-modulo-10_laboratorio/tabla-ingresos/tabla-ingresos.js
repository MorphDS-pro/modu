// Importar Firebase como módulos
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const tableBody = document.getElementById('table-body');
const monthSelector = document.getElementById('monthSelector');
const yearSelector = document.getElementById('yearSelector');
const btnPrevious = document.getElementById('btnPrevious');
const btnNext = document.getElementById('btnNext');
const pageNumber = document.getElementById('pageNumber');
const btnDownload = document.getElementById('btnDownload');

let currentPage = 1;
const rowsPerPage = 50;
let allData = [];
let filters = Array(16).fill(''); // 16 columnas ahora, sin "Acciones"

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

// Formato de monto en pesos chilenos sin decimales ni signo
function formatCLP(amount) {
    const num = parseInt(amount.toString().replace(/\D/g, '')) || 0;
    return num.toLocaleString('es-CL', { style: 'decimal', maximumFractionDigits: 0 });
}

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

    // Filtrar por mes y año seleccionados
    filteredData = filteredData.filter(item => {
        const matchesMonth = item.mesIngreso === selectedMonth;
        const matchesYear = item.añoIngreso === selectedYear;
        return matchesMonth && matchesYear;
    });

    filteredData = filteredData.filter(item => {
        return filters.every((filter, index) => {
            if (!filter) return true;
            const value = [
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
        tableBody.innerHTML = '<tr><td colspan="16">No se encontraron registros para los filtros seleccionados.</td></tr>';
    } else {
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
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

// Descargar tabla como Excel
btnDownload.addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
        ['ID', 'Fecha de Ingreso', 'Factura', 'Emisión de Factura', 'Monto de la Factura', 'OC', 'Fecha de OC', 'Proveedor', 'Acta', 'Fecha de Salida', 'Número de Salida', 'Mes de Ingreso', 'Año de Ingreso', 'Mes de Salida', 'Año de Salida', 'Usuario'],
        ...allData.map(item => [
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
            item.mesIngreso,
            item.añoIngreso,
            item.mesSalida,
            item.añoSalida,
            item.usuario
        ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Facturas");
    XLSX.writeFile(wb, "Tabla_Facturas.xlsx");
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

// Cambios en selectores
monthSelector.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
});

yearSelector.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
});

// Inicializar
loadData();