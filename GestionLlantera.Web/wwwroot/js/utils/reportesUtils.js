// ✅ CONFIGURACIÓN CORREGIDA - Usar controladores Web
const REPORTES_CONFIG = {
    baseUrl: '/Reportes',  // Controlador Web,
    timeout: 30000,
    loadingText: 'Generando reporte...',
    downloadingText: 'Descargando archivo...'
};



/**
 * ✅ FUNCIÓN: Generar reporte de inventario (usando utilidades globales)
 */
async function generarReporteInventario(inventarioId) {
    try {
        console.log('📊 Generando reporte para inventario:', inventarioId);

        // ✅ OBTENER TÍTULO DEL INVENTARIO
        const tituloInventario = $('#tituloInventario').text().trim() ||
            $('.inventario-titulo').text().trim() ||
            'Inventario';

        // ✅ USAR FUNCIÓN GLOBAL PARA MOSTRAR OPCIONES
        mostrarOpcionesDescarga(inventarioId, tituloInventario);

    } catch (error) {
        console.error('❌ Error al generar reporte:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo generar el reporte del inventario',
            confirmButtonColor: '#d33'
        });
    }
}

/**
 * ✅ FUNCIÓN: Exportar inventario (legacy - redirige a nueva función)
 */
async function exportarInventario(inventarioId) {
    try {
        console.log('📤 Exportando inventario:', inventarioId);

        // ✅ OBTENER TÍTULO DEL INVENTARIO
        const tituloInventario = $('#tituloInventario').text().trim() ||
            $('.inventario-titulo').text().trim() ||
            'Inventario';

        // ✅ MOSTRAR OPCIONES DE DESCARGA DIRECTAMENTE
        Swal.fire({
            title: '📤 Exportar Inventario',
            html: `
                <div class="text-center">
                    <h5 class="mb-3">${tituloInventario}</h5>
                    <p class="text-muted mb-4">Seleccione el formato de exportación:</p>
                    
                    <div class="d-grid gap-3">
                        <button type="button" class="btn btn-success btn-lg" id="btnExportarExcel">
                            <i class="bi bi-file-earmark-excel fs-1"></i><br>
                            <strong>Exportar a Excel</strong><br>
                            <small class="text-muted">Archivo completo con todos los datos</small>
                        </button>
                        
                        <button type="button" class="btn btn-danger btn-lg" id="btnExportarPdf">
                            <i class="bi bi-file-earmark-pdf fs-1"></i><br>
                            <strong>Exportar a PDF</strong><br>
                            <small class="text-muted">Reporte profesional para presentar</small>
                        </button>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: '<i class="bi bi-x-circle"></i> Cancelar',
            cancelButtonColor: '#6c757d',
            width: '500px',
            didOpen: () => {
                // ✅ EVENTOS DE EXPORTACIÓN
                document.getElementById('btnExportarExcel').addEventListener('click', () => {
                    Swal.close();
                    descargarReporteExcel(inventarioId, tituloInventario);
                });

                document.getElementById('btnExportarPdf').addEventListener('click', () => {
                    Swal.close();
                    descargarReportePdf(inventarioId, tituloInventario);
                });
            }
        });

    } catch (error) {
        console.error('❌ Error al exportar inventario:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo exportar el inventario',
            confirmButtonColor: '#d33'
        });
    }
}

/**
 * Descarga el reporte en formato Excel (corregido)
 */
async function descargarReporteExcel(inventarioId, tituloInventario = 'inventario') {
    try {
        showLoadingAlert('Generando archivo Excel...');

        // ✅ USAR FETCH PARA OBTENER EL ARCHIVO
        const response = await fetch(`/Reportes/inventario/${inventarioId}/excel`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // ✅ OBTENER EL BLOB Y DESCARGARLO
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${tituloInventario}_${inventarioId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        hideLoadingAlert();

        // ✅ MOSTRAR ÉXITO
        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            text: `El reporte Excel de "${tituloInventario}" se ha descargado correctamente`,
            timer: 3000,
            timerProgressBar: true,
            confirmButtonColor: '#28a745'
        });

    } catch (error) {
        hideLoadingAlert();
        console.error('Error descargando Excel:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al descargar Excel',
            text: error.message || 'No se pudo descargar el archivo Excel',
            confirmButtonColor: '#d33'
        });
    }
}

// ✅ FUNCIONES AUXILIARES
function showLoadingAlert(message) {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function hideLoadingAlert() {
    if (Swal.isVisible()) {
        Swal.close();
    }
}

/**
 * Descarga el reporte en formato PDF (corregido)
 */
async function descargarReportePdf(inventarioId, tituloInventario = 'inventario') {
    try {
        showLoadingAlert('Generando archivo PDF...');

        // ✅ USAR FETCH PARA OBTENER EL ARCHIVO
        const response = await fetch(`/Reportes/inventario/${inventarioId}/pdf`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // ✅ OBTENER EL BLOB Y DESCARGARLO
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${tituloInventario}_${inventarioId}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        hideLoadingAlert();

        // ✅ MOSTRAR ÉXITO
        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            text: `El reporte PDF de "${tituloInventario}" se ha descargado correctamente`,
            timer: 3000,
            timerProgressBar: true,
            confirmButtonColor: '#28a745'
        });

    } catch (error) {
        hideLoadingAlert();
        console.error('Error descargando PDF:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al descargar PDF',
            text: error.message || 'No se pudo descargar el archivo PDF',
            confirmButtonColor: '#d33'
        });
    }
}

// ✅ FUNCIÓN DE CONVENIENCIA PARA INVENTARIOS COMPLETADOS
function mostrarAlertaInventarioCompletado(inventarioId, tituloInventario) {
    Swal.fire({
        icon: 'success',
        title: '✅ ¡Inventario Completado!',
        html: `
            <div class="text-center">
                <h5 class="mb-3">${tituloInventario}</h5>
                <p class="text-success mb-4">
                    <i class="fas fa-check-circle fa-2x"></i><br>
                    El inventario se ha completado exitosamente
                </p>
                <p class="text-muted mb-4">¿Desea descargar el reporte?</p>
                
                <div class="d-grid gap-2">
                    <button type="button" class="btn btn-primary btn-lg" onclick="mostrarOpcionesDescarga(${inventarioId}, '${tituloInventario}')">
                        <i class="fas fa-download"></i> Descargar Reporte
                    </button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: '<i class="fas fa-times"></i> Cerrar',
        cancelButtonColor: '#6c757d',
        width: '500px'
    });
}


/**
* Muestra el reporte de inventario en formato JSON (usando controlador Web)
*/
async function obtenerReporteInventario(inventarioId) {
    try {
        showLoadingAlert('Obteniendo datos del reporte...');

        // ✅ USAR CONTROLADOR WEB
        const response = await fetch(`${REPORTES_CONFIG.baseUrl}/ObtenerReporte?inventarioId=${inventarioId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        hideLoadingAlert();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const reporte = await response.json();
        return reporte;
    } catch (error) {
        hideLoadingAlert();
        console.error('Error obteniendo reporte:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al obtener reporte',
            text: error.message || 'No se pudo obtener el reporte del inventario',
            confirmButtonColor: '#d33'
        });

        throw error;
    }
}