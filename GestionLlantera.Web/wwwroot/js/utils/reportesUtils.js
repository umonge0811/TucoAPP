/**
 * Utilidades globales para descargar reportes de inventarios
 * Funciones reutilizables desde cualquier parte del sistema
 */

// ✅ CONFIGURACIÓN GLOBAL
const REPORTES_CONFIG = {
    baseUrl: '/api/Reportes',
    timeout: 30000, // 30 segundos
    loadingText: 'Generando reporte...',
    downloadingText: 'Descargando archivo...'
};

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


/**
 * Descarga el reporte en formato Excel (corregido)
 */
async function descargarReporteExcel(inventarioId, tituloInventario = 'inventario') {
    try {
        showLoadingAlert('Generando archivo Excel...');

        // ✅ USAR FETCH PARA OBTENER EL ARCHIVO
        const response = await fetch(`${REPORTES_CONFIG.baseUrl}/DescargarExcel?inventarioId=${inventarioId}`, {
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

/**
 * Descarga el reporte en formato PDF (corregido)
 */
async function descargarReportePdf(inventarioId, tituloInventario = 'inventario') {
    try {
        showLoadingAlert('Generando archivo PDF...');

        // ✅ USAR FETCH PARA OBTENER EL ARCHIVO
        const response = await fetch(`${REPORTES_CONFIG.baseUrl}/DescargarPdf?inventarioId=${inventarioId}`, {
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

/**
 * Muestra modal con opciones de descarga de reportes
 * @param {number} inventarioId - ID del inventario
 * @param {string} tituloInventario - Título del inventario
 */
function mostrarOpcionesDescarga(inventarioId, tituloInventario = 'Inventario') {
    Swal.fire({
        title: `📊 Descargar Reporte`,
        html: `
            <div class="text-center">
                <h5 class="mb-3">${tituloInventario}</h5>
                <p class="text-muted mb-4">Seleccione el formato de descarga:</p>
                
                <div class="row justify-content-center">
                    <div class="col-md-5 mb-3">
                        <button type="button" class="btn btn-success btn-lg w-100" id="btnDescargarExcel">
                            <i class="fas fa-file-excel fa-2x mb-2"></i><br>
                            <strong>Excel</strong><br>
                            <small>Datos completos y editables</small>
                        </button>
                    </div>
                    <div class="col-md-5 mb-3">
                        <button type="button" class="btn btn-danger btn-lg w-100" id="btnDescargarPdf">
                            <i class="fas fa-file-pdf fa-2x mb-2"></i><br>
                            <strong>PDF</strong><br>
                            <small>Reporte con formato profesional</small>
                        </button>
                    </div>
                </div>
                
                <div class="mt-3">
                    <button type="button" class="btn btn-info btn-sm" id="btnVerReporte">
                        <i class="fas fa-eye"></i> Ver datos del reporte
                    </button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: '<i class="fas fa-times"></i> Cerrar',
        cancelButtonColor: '#6c757d',
        width: '600px',
        customClass: {
            popup: 'swal-wide'
        },
        didOpen: () => {
            // ✅ EVENTOS DE LOS BOTONES
            document.getElementById('btnDescargarExcel').addEventListener('click', () => {
                Swal.close();
                descargarReporteExcel(inventarioId, tituloInventario);
            });

            document.getElementById('btnDescargarPdf').addEventListener('click', () => {
                Swal.close();
                descargarReportePdf(inventarioId, tituloInventario);
            });

            document.getElementById('btnVerReporte').addEventListener('click', () => {
                Swal.close();
                mostrarReporteModal(inventarioId, tituloInventario);
            });
        }
    });
}

/**
 * Muestra modal con resumen del reporte
 * @param {number} inventarioId - ID del inventario
 * @param {string} tituloInventario - Título del inventario
 */
async function mostrarReporteModal(inventarioId, tituloInventario = 'Inventario') {
    try {
        const reporte = await obtenerReporteInventario(inventarioId);

        const html = `
            <div class="reporte-modal">
                <h5 class="text-center mb-4">${reporte.titulo}</h5>
                
                <!-- Información General -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <i class="fas fa-info-circle"></i> Información General
                            </div>
                            <div class="card-body">
                                <p><strong>Creado por:</strong> ${reporte.usuarioCreador}</p>
                                <p><strong>Fecha Inicio:</strong> ${new Date(reporte.fechaInicio).toLocaleString()}</p>
                                <p><strong>Fecha Fin:</strong> ${new Date(reporte.fechaFin).toLocaleString()}</p>
                                <p><strong>Generado:</strong> ${new Date(reporte.fechaGeneracionReporte).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-warning text-dark">
                                <i class="fas fa-chart-bar"></i> Resumen Ejecutivo
                            </div>
                            <div class="card-body">
                                <p><strong>Total Productos:</strong> ${reporte.totalProductosContados}</p>
                                <p><strong>Con Discrepancia:</strong> <span class="badge badge-warning">${reporte.productosConDiscrepancia}</span></p>
                                <p><strong>% Discrepancia:</strong> ${reporte.porcentajeDiscrepancia}%</p>
                                <p><strong>Impacto Total:</strong> <span class="text-danger">₡${reporte.valorTotalDiscrepancia.toLocaleString()}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="alert alert-success text-center">
                            <h5>${reporte.productosConExceso}</h5>
                            <p class="mb-0">Productos con Exceso<br><small>₡${reporte.valorExceso.toLocaleString()}</small></p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="alert alert-danger text-center">
                            <h5>${reporte.productosConFaltante}</h5>
                            <p class="mb-0">Productos con Faltante<br><small>₡${reporte.valorFaltante.toLocaleString()}</small></p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="alert alert-info text-center">
                            <h5>${reporte.totalProductosContados - reporte.productosConDiscrepancia}</h5>
                            <p class="mb-0">Productos Correctos<br><small>Sin diferencias</small></p>
                        </div>
                    </div>
                </div>

                <!-- Botones de descarga -->
                <div class="text-center">
                    <button type="button" class="btn btn-success me-2" onclick="descargarReporteExcel(${inventarioId}, '${tituloInventario}')">
                        <i class="fas fa-file-excel"></i> Descargar Excel
                    </button>
                    <button type="button" class="btn btn-danger" onclick="descargarReportePdf(${inventarioId}, '${tituloInventario}')">
                        <i class="fas fa-file-pdf"></i> Descargar PDF
                    </button>
                </div>
            </div>
        `;

        Swal.fire({
            title: '📊 Reporte de Inventario',
            html: html,
            width: '800px',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: '<i class="fas fa-times"></i> Cerrar',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal-wide'
            }
        });

    } catch (error) {
        console.error('Error mostrando reporte:', error);
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