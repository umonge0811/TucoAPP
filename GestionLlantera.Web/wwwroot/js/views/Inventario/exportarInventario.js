// Actualiza esta parte en tu archivo inventario.js
document.addEventListener('DOMContentLoaded', function () {
    // Referencias a los botones de exportación
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');

    // Botón para exportar a Excel
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function () {
            // Mostrar indicador de carga
            const loadingId = mostrarCargando('Generando archivo Excel...');

            // Crear un iframe oculto para la descarga
            const downloadFrame = crearIframeDescarga();

            // Establecer la URL del iframe
            downloadFrame.src = '/Inventario/ExportarExcel';

            // Detectar cuando la descarga comienza
            detectarDescarga(downloadFrame, loadingId);
        });
    }

    // Botón para exportar a PDF
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', function () {
            // Mostrar indicador de carga
            const loadingId = mostrarCargando('Generando archivo PDF...');

            // Crear un iframe oculto para la descarga
            const downloadFrame = crearIframeDescarga();

            // Establecer la URL del iframe
            downloadFrame.src = '/Inventario/ExportarPDF';

            // Detectar cuando la descarga comienza
            detectarDescarga(downloadFrame, loadingId);
        });
    }

    // Función para crear un iframe oculto para la descarga
    function crearIframeDescarga() {
        // Eliminar iframe existente si hay uno
        const existingFrame = document.getElementById('downloadFrame');
        if (existingFrame) {
            document.body.removeChild(existingFrame);
        }

        // Crear nuevo iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'downloadFrame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        return iframe;
    }

    // Función para detectar cuando se inicia la descarga
    function detectarDescarga(iframe, loadingId) {
        // Generar un ID único para esta operación de descarga
        const operationId = Date.now().toString();

        // Indicador de si la descarga fue detectada
        let downloadDetected = false;

        // Función para comprobar si la descarga ha comenzado
        const checkDownload = () => {
            try {
                // Si podemos acceder al contenido del iframe, la descarga aún no ha comenzado
                // (Esto fallará cuando comience la descarga debido a la política de seguridad)
                const iframeContent = iframe.contentWindow.document;

                // Si el contenido tiene una respuesta que indica descarga
                if (iframeContent && iframeContent.body && iframeContent.body.innerHTML) {
                    const content = iframeContent.body.innerHTML.toLowerCase();

                    // Si detectamos que es un archivo de descarga (comprobamos palabras clave)
                    if (content.includes('excel') || content.includes('pdf') ||
                        content.includes('download') || content.includes('application/') ||
                        content.includes('attachment')) {
                        downloadDetected = true;
                        ocultarCargando(loadingId);
                        return;
                    }

                    // Si encontramos un mensaje de error
                    if (content.includes('error') || content.includes('exception')) {
                        downloadDetected = true;
                        ocultarCargando(loadingId);
                        mostrarError('Se produjo un error al generar el archivo. Por favor, inténtelo de nuevo.');
                        return;
                    }
                }
            } catch (e) {
                // Si se produce una excepción, probablemente la descarga ha comenzado
                // (No podemos acceder al contenido por razones de seguridad)
                downloadDetected = true;
                ocultarCargando(loadingId);

                // Limpiar el iframe después de un momento
                setTimeout(() => {
                    if (iframe && iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                }, 5000);

                return;
            }

            // Si no se detectó la descarga aún, verificar nuevamente
            if (!downloadDetected) {
                setTimeout(checkDownload, 500);
            }
        };

        // Iniciar verificación después de un breve retraso
        setTimeout(checkDownload, 1000);

        // Establecer un límite de tiempo para mostrar el cargador (como respaldo)
        setTimeout(() => {
            if (!downloadDetected) {
                ocultarCargando(loadingId);
            }
        }, 15000); // 15 segundos como tiempo máximo
    }

    // Función para mostrar indicador de carga (modificada para devolver ID)
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
            content.className = 'loading-content';

            const spinner = document.createElement('div');
            spinner.className = 'spinner-border text-primary';
            spinner.setAttribute('role', 'status');

            const span = document.createElement('span');
            span.className = 'visually-hidden';
            span.textContent = 'Cargando...';

            const loadingMessage = document.createElement('p');
            loadingMessage.className = 'mt-2';
            loadingMessage.id = 'loadingMessage';
            loadingMessage.textContent = mensaje || 'Procesando...';

            spinner.appendChild(span);
            content.appendChild(spinner);
            content.appendChild(loadingMessage);
            loadingIndicator.appendChild(content);

            // Estilos para el overlay
            loadingIndicator.style.position = 'fixed';
            loadingIndicator.style.top = '0';
            loadingIndicator.style.left = '0';
            loadingIndicator.style.width = '100%';
            loadingIndicator.style.height = '100%';
            loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            loadingIndicator.style.display = 'flex';
            loadingIndicator.style.justifyContent = 'center';
            loadingIndicator.style.alignItems = 'center';
            loadingIndicator.style.zIndex = '9999';

            // Estilos para el contenido
            content.style.backgroundColor = 'white';
            content.style.padding = '20px';
            content.style.borderRadius = '5px';
            content.style.textAlign = 'center';

            // Añadir al body
            document.body.appendChild(loadingIndicator);
        } else {
            // Si ya existe, actualizamos el mensaje e ID
            loadingIndicator.dataset.operationId = loadingId;
            const loadingMessage = document.getElementById('loadingMessage');
            if (loadingMessage) {
                loadingMessage.textContent = mensaje || 'Procesando...';
            }

            // Mostrar el indicador existente
            loadingIndicator.style.display = 'flex';
        }

        return loadingId;
    }

    // Función para ocultar el indicador de carga (modificada para verificar ID)
    function ocultarCargando(operationId) {
        const loadingIndicator = document.getElementById('loadingIndicator');

        if (loadingIndicator) {
            // Solo ocultar si el ID coincide o no se proporciona ID
            if (!operationId || loadingIndicator.dataset.operationId === operationId) {
                loadingIndicator.style.display = 'none';

                // Opcionalmente eliminar después de ocultarlo
                setTimeout(() => {
                    if (loadingIndicator.parentNode) {
                        loadingIndicator.parentNode.removeChild(loadingIndicator);
                    }
                }, 500);
            }
        }
    }

    // Función para mostrar mensajes de error
    function mostrarError(mensaje) {
        // Verificar si ya existe un elemento de alerta
        let alertElement = document.getElementById('exportAlert');

        if (!alertElement) {
            // Crear un nuevo elemento de alerta
            alertElement = document.createElement('div');
            alertElement.id = 'exportAlert';
            alertElement.className = 'alert alert-danger alert-dismissible fade show fixed-top mx-auto mt-3';
            alertElement.style.maxWidth = '500px';
            alertElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            alertElement.setAttribute('role', 'alert');

            // Agregar contenido
            alertElement.innerHTML = `
                <strong>Error:</strong> ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            `;

            // Agregar al body
            document.body.appendChild(alertElement);

            // Configurar desaparición automática
            setTimeout(() => {
                if (alertElement && alertElement.parentNode) {
                    const bsAlert = new bootstrap.Alert(alertElement);
                    bsAlert.close();
                }
            }, 5000);
        }
    }

    // Configurar filtros y búsqueda
    configureTableFilters();
});

// El resto del código para configureTableFilters() se mantiene igual

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