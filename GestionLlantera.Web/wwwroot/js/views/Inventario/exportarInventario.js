// Actualiza el código en exportarInventario.js
document.addEventListener('DOMContentLoaded', function () {
    // Referencias a los botones de exportación
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    const btnIniciarExportacion = document.getElementById('btnIniciarExportacion');

    // Modal de exportación
    const modalExportarInventario = new bootstrap.Modal(document.getElementById('modalExportarInventario'));

    // Botón para exportar a Excel desde el dropdown
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function () {
            // Seleccionar Excel por defecto
            document.getElementById('formatoExcel').checked = true;
            document.getElementById('formatoPDF').checked = false;

            // Mostrar el modal para ingresar información adicional
            modalExportarInventario.show();
        });
    }

    // Botón para exportar a PDF desde el dropdown
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', function () {
            // Seleccionar PDF por defecto
            document.getElementById('formatoExcel').checked = false;
            document.getElementById('formatoPDF').checked = true;

            // Mostrar el modal para ingresar información adicional
            modalExportarInventario.show();
        });
    }

    // Botón para iniciar la exportación después de completar el formulario
    if (btnIniciarExportacion) {
        btnIniciarExportacion.addEventListener('click', function () {
            // Recopilar información del formulario
            const responsable = document.getElementById('responsable').value;
            const solicitante = document.getElementById('solicitante').value;
            const fechaLimite = document.getElementById('fechaLimite').value;

            // Determinar formato seleccionado
            const formatoExcel = document.getElementById('formatoExcel').checked;

            // Construir la URL con parámetros
            let url = formatoExcel ? '/Inventario/ExportarExcel' : '/Inventario/ExportarPDF';
            url += `?responsable=${encodeURIComponent(responsable)}`;
            url += `&solicitante=${encodeURIComponent(solicitante)}`;
            url += `&fechaLimite=${encodeURIComponent(fechaLimite)}`;

            // Cerrar el modal
            modalExportarInventario.hide();

            // Mostrar mensaje de carga
            const mensaje = formatoExcel ? 'Generando archivo Excel...' : 'Generando archivo PDF...';

            // Realizar la descarga
            descargarArchivoConFetch(url, mensaje);
        });
    }

    // Inicializar la fecha límite con 7 días desde hoy por defecto
    const fechaLimiteInput = document.getElementById('fechaLimite');
    if (fechaLimiteInput) {
        const fechaHoy = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaHoy.getDate() + 7);

        // Formatear la fecha como YYYY-MM-DD para el input date
        const year = fechaLimite.getFullYear();
        let month = fechaLimite.getMonth() + 1;
        let day = fechaLimite.getDate();

        // Asegurar que el mes y día tengan dos dígitos
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;

        fechaLimiteInput.value = `${year}-${month}-${day}`;
    }

    // También vincular el botón "Programar Inventario" para que muestre el modal de exportación
    const btnProgramarInventario = document.getElementById('btnProgramarInventario');
    if (btnProgramarInventario) {
        btnProgramarInventario.addEventListener('click', function (e) {
            e.preventDefault();

            // Seleccionar Excel por defecto
            document.getElementById('formatoExcel').checked = true;
            document.getElementById('formatoPDF').checked = false;

            // Cambiar el título del modal para reflejar que es para programar un inventario
            const modalTitle = document.getElementById('modalExportarInventarioLabel');
            if (modalTitle) {
                modalTitle.textContent = 'Programar Toma de Inventario';
            }

            // Mostrar el modal
            modalExportarInventario.show();
        });
    }

    // Función mejorada para descargar archivos utilizando fetch API
    function descargarArchivoConFetch(url, mensajeCarga) {
        // Mostrar indicador de carga
        const loadingId = mostrarCargando(mensajeCarga);

        // Solicitar el archivo usando fetch con responseType blob
        fetch(url, {
            method: 'GET',
            credentials: 'same-origin'
        })
            .then(response => {
                // Verificar si la respuesta es exitosa
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                // Obtener el nombre del archivo del header Content-Disposition
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'archivo_descarga';

                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                }

                // Cuando obtenemos la respuesta (incluso antes de que el blob esté completamente descargado),
                // podemos empezar a ocultar el indicador de carga
                setTimeout(() => {
                    ocultarCargando(loadingId);
                }, 500);

                // Convertir la respuesta a blob para descarga
                return response.blob().then(blob => {
                    return { blob, filename };
                });
            })
            .then(({ blob, filename }) => {
                // Crear un objeto URL para el blob
                const url = window.URL.createObjectURL(blob);

                // Crear un enlace invisible y hacer clic en él para iniciar la descarga
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);

                // Iniciar la descarga
                a.click();

                // Limpiar
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Error durante la descarga:', error);
                ocultarCargando(loadingId);
                mostrarError('Se produjo un error al generar el archivo: ' + error.message);
            });
    }

    // Función para mostrar indicador de carga
    function mostrarCargando(mensaje) {
        // Generar ID único para esta operación de carga
        const loadingId = 'loading-' + Date.now().toString();

        // Verificar si ya existe un indicador de carga
        let loadingIndicator = document.getElementById('loadingIndicator');

        if (!loadingIndicator) {
            // Crear el indicador de carga si no existe
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loadingIndicator';
            loadingIndicator.className = 'loading-overlay';
            loadingIndicator.dataset.operationId = loadingId;

            const content = document.createElement('div');
            content.className =

// Función para configurar filtros de la tabla
function configureTableFilters() {
    const searchText = document.getElementById('searchText');
    const filterStock = document.getElementById('filterStock');
    const filterCategory = document.getElementById('filterCategory');
    const sortBy = document.getElementById('sortBy');

    // Función para aplicar todos los filtros
    function applyFilters() {
        const searchValue = searchText.value.toLowerCase().trim();
        const stockValue = filterStock.value;
        const categoryValue = filterCategory.value;
        const sortValue = sortBy.value;

        const rows = document.querySelectorAll('table tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            let showRow = true;

            // Filtro de búsqueda por texto
            if (searchValue) {
                const productName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                const productDesc = row.querySelector('td:nth-child(3) .text-muted')?.textContent.toLowerCase() || '';

                if (!productName.includes(searchValue) && !productDesc.includes(searchValue)) {
                    showRow = false;
                }
            }

            // Filtro por estado de stock
            if (showRow && stockValue) {
                const stockCell = row.querySelector('td:nth-child(7)');
                const stockValue = parseInt(stockCell.textContent.trim());
                const minStockCell = row.querySelector('td:nth-child(8)');
                const minStockValue = parseInt(minStockCell.textContent.trim());

                switch (filterStock.value) {
                    case 'low':
                        if (stockValue > minStockValue) showRow = false;
                        break;
                    case 'normal':
                        if (stockValue <= minStockValue || stockValue >= minStockValue * 2) showRow = false;
                        break;
                    case 'high':
                        if (stockValue < minStockValue * 2) showRow = false;
                        break;
                }
            }

            // Filtro por categoría
            if (showRow && categoryValue) {
                const isLlanta = row.querySelector('td:nth-child(3) .badge.bg-primary') !== null;

                switch (categoryValue) {
                    case 'llantas':
                        if (!isLlanta) showRow = false;
                        break;
                    case 'accesorios':
                    case 'herramientas':
                        if (isLlanta) showRow = false;
                        break;
                }
            }

            // Aplicar visibilidad
            row.style.display = showRow ? '' : 'none';

            if (showRow) {
                visibleCount++;
            }
        });

        // Actualizar contador de productos
        const contadorProductos = document.getElementById('contadorProductos');
        if (contadorProductos) {
            contadorProductos.textContent = visibleCount;
        }

        // Actualizar contador de stock bajo
        const contadorStockBajo = document.getElementById('contadorStockBajo');
        if (contadorStockBajo) {
            let lowStockCount = 0;
            rows.forEach(row => {
                if (row.style.display !== 'none' && row.classList.contains('table-danger')) {
                    lowStockCount++;
                }
            });
            contadorStockBajo.textContent = lowStockCount;
        }

        // Aplicar ordenamiento
        if (sortValue) {
            sortTable(sortValue);
        }
    }

    // Función para ordenar la tabla
    function sortTable(sortBy) {
        const table = document.querySelector('table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        // Solo ordenar filas visibles
        const visibleRows = rows.filter(row => row.style.display !== 'none');

        // Ordenar según el criterio seleccionado
        visibleRows.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    // Ordenar por nombre
                    const nameA = a.querySelector('td:nth-child(3) strong').textContent.toLowerCase();
                    const nameB = b.querySelector('td:nth-child(3) strong').textContent.toLowerCase();
                    return nameA.localeCompare(nameB);

                case 'price_asc':
                    // Ordenar por precio ascendente
                    const priceA = parseCurrency(a.querySelector('td:nth-child(6)').textContent);
                    const priceB = parseCurrency(b.querySelector('td:nth-child(6)').textContent);
                    return priceA - priceB;

                case 'price_desc':
                    // Ordenar por precio descendente
                    const priceDescA = parseCurrency(a.querySelector('td:nth-child(6)').textContent);
                    const priceDescB = parseCurrency(b.querySelector('td:nth-child(6)').textContent);
                    return priceDescB - priceDescA;

                case 'stock':
                    // Ordenar por stock disponible
                    const stockA = parseInt(a.querySelector('td:nth-child(7)').textContent.trim());
                    const stockB = parseInt(b.querySelector('td:nth-child(7)').textContent.trim());
                    return stockA - stockB;

                default:
                    return 0;
            }
        });

        // Reordenar las filas en el DOM
        visibleRows.forEach(row => {
            tbody.appendChild(row);
        });
    }

    // Función auxiliar para convertir texto de moneda a número
    function parseCurrency(text) {
        return parseFloat(text.replace(/[^\d.-]/g, '')) || 0;
    }

    // Asignar eventos a los controles de filtrado
    if (searchText) {
        searchText.addEventListener('input', applyFilters);
    }

    if (filterStock) {
        filterStock.addEventListener('change', applyFilters);
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', applyFilters);
    }

    if (sortBy) {
        sortBy.addEventListener('change', applyFilters);
    }
}