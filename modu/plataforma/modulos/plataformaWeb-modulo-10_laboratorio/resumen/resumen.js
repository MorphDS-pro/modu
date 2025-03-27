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
const yearSelector = document.getElementById('yearSelector');
const btnDownload = document.getElementById('btnDownload');

let allData = [];

// Llenar selector de año
const currentYear = new Date().getFullYear();
for (let year = currentYear - 1; year <= currentYear + 5; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === currentYear) option.selected = true;
    yearSelector.appendChild(option);
}

// Formato de monto en pesos chilenos sin decimales ni signo
function formatCLP(amount) {
    const num = parseInt(amount) || 0;
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
        console.log('Datos cargados desde Firestore:', allData); // Depuración
        renderTable();
    }, (error) => {
        console.error('Error al cargar datos:', error);
    });
}

// Renderizar tabla con resumen mensual
function renderTable() {
    const selectedYear = parseInt(yearSelector.value);
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const proyectadoBase = 50000000; // Valor fijo proyectado

    tableBody.innerHTML = '';

    months.forEach((month, index) => {
        const monthIndex = index + 1;

        // Calcular Factura-Acta (suma de montos de ingresos en el mes)
        const facturaActaRaw = allData
            .filter(item => {
                const mesIngreso = parseInt(item.mesIngreso);
                const añoIngreso = parseInt(item.añoIngreso);
                return mesIngreso === monthIndex && añoIngreso === selectedYear;
            })
            .reduce((sum, item) => sum + (item.monto || 0), 0);
        const facturaActa = facturaActaRaw > 0 ? facturaActaRaw : '';

        // Calcular Salidas (suma de montos de salidas en el mes)
        const salidasItems = allData.filter(item => {
            const mesSalida = parseInt(item.mesSalida);
            const añoSalida = parseInt(item.añoSalida);
            return mesSalida === monthIndex && añoSalida === selectedYear;
        });
        console.log(`Salidas para ${month} ${selectedYear}:`, salidasItems); // Depuración
        const salidasRaw = salidasItems.reduce((sum, item) => sum + (item.monto || 0), 0);
        const salidas = salidasRaw > 0 ? salidasRaw : '';

        // Calcular Proyectado (texto "llevas X de 50,000,000"), solo si hay facturaActa
        const proyectado = facturaActa !== '' 
            ? `llevas ${formatCLP(facturaActa)} de ${formatCLP(proyectadoBase)}` 
            : '';

        // Calcular Porcentaje (Factura-Acta / ProyectadoBase * 100), solo si hay facturaActa
        const porcentaje = facturaActa !== '' 
            ? ((facturaActa / proyectadoBase) * 100).toFixed(2) 
            : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td>${facturaActa !== '' ? formatCLP(facturaActa) : ''}</td>
            <td>${salidas !== '' ? formatCLP(salidas) : ''}</td>
            <td>${proyectado}</td>
            <td>${porcentaje !== '' ? `${porcentaje}%` : ''}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Descargar tabla como Excel
btnDownload.addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
        ['Mes', 'Factura-Acta', 'Salidas', 'Proyectado', 'Porcentaje'],
        ...Array.from(tableBody.rows).map(row => [
            row.cells[0].textContent,
            row.cells[1].textContent,
            row.cells[2].textContent,
            row.cells[3].textContent,
            row.cells[4].textContent
        ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Resumen");
    XLSX.writeFile(wb, `Resumen_${yearSelector.value}.xlsx`);
});

// Actualizar tabla al cambiar el año
yearSelector.addEventListener('change', renderTable);

// Inicializar
loadData();