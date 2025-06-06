/**
 * JavaScript específico para EJECUTAR INVENTARIOS
 * Separado de programar-inventario.js para evitar conflictos
 */

// =====================================
// VARIABLES GLOBALES
// =====================================
let inventarioActual = null;
let productosInventario = [];
let productosFiltrados = [];
let estadisticasActuales = {};

// =====================================
// INICIALIZACIÓN
// =====================================
$(document).ready(function () {
    console.log('🚀 Ejecutar Inventario - Inicializando...');

    // ✅ OBTENER ID DEL INVENTARIO DESDE LA CONFIGURACIÓN GLOBAL
    const inventarioId = window.inventarioConfig?.inventarioId || getInventarioIdFromUrl();

    if (!inventarioId) {
        console.error('❌ No se pudo obtener el ID del inventario');
        console.log('📋 window.inventarioConfig:', window.inventarioConfig);
        console.log('📋 URL actual:', window.location.href);
        mostrarError('No se especificó un inventario válido');
        return;
    }

    console.log('✅ ID del inventario obtenido:', inventarioId);

    // Inicializar la página
    inicializarEjecutorInventario(inventarioId);

    // Configurar event listeners
    configurarEventListeners();
});

// =====================================
// FUNCIONES DE INICIALIZACIÓN
// =====================================
async function inicializarEjecutorInventario(inventarioId) {
    try {
        console.log(`📋 Inicializando ejecutor para inventario ID: ${inventarioId}`);

        // Cargar información del inventario
        await cargarInformacionInventario(inventarioId);

        // Cargar productos del inventario
        await cargarProductosInventario(inventarioId);

        // Actualizar estadísticas
        await actualizarEstadisticas();

        // Configurar auto-refresh cada 30 segundos
        setInterval(() => {
            actualizarEstadisticas();
        }, 30000);

    } catch (error) {
        console.error('❌ Error inicializando ejecutor:', error);
        mostrarError('Error al cargar el inventario');
    }
}

function configurarEventListeners() {
    // Filtro de búsqueda
    $('#filtroProductos').on('input', function () {
        const filtro = $(this).val().toLowerCase();
        filtrarProductos(filtro, $('#filtroEstado').val());
    });

    // Filtro por estado
    $('#filtroEstado').on('change', function () {
        const estadoFiltro = $(this).val();
        filtrarProductos($('#filtroProductos').val().toLowerCase(), estadoFiltro);
    });

    // Botón refrescar
    $('#btnRefrescar').on('click', function () {
        const inventarioId = inventarioActual?.inventarioProgramadoId;
        if (inventarioId) {
            cargarProductosInventario(inventarioId);
            actualizarEstadisticas();
        }
    });

    // Botón completar inventario
    $('#btnCompletarInventario').on('click', function () {
        mostrarModalCompletarInventario();
    });

    // Formulario de conteo
    $('#cantidadFisica').on('input', function () {
        calcularDiferencia();
    });

    // Guardar conteo
    $('#btnGuardarConteo').on('click', function () {
        guardarConteoProducto();
    });

    // Confirmar completar inventario
    $('#btnConfirmarCompletar').on('click', function () {
        completarInventario();
    });

    // Limpiar modal al cerrarse
    $('#modalConteo').on('hidden.bs.modal', function () {
        limpiarModalConteo();
    });
}

// =====================================
// FUNCIONES DE CARGA DE DATOS
// =====================================
async function cargarInformacionInventario(inventarioId) {
    try {
        console.log(`📋 Cargando información del inventario ${inventarioId}...`);

        // ✅ USAR LA INFORMACIÓN QUE YA TENEMOS DESDE EL SERVIDOR
        if (window.inventarioConfig) {
            console.log('✅ Usando información del inventario desde configuración global');

            inventarioActual = {
                inventarioProgramadoId: window.inventarioConfig.inventarioId,
                titulo: document.querySelector('h1')?.textContent?.replace('🔲', '').trim() || 'Inventario',
                estado: 'En Progreso', // Ya sabemos que está en progreso porque llegamos aquí
                permisos: window.inventarioConfig.permisos
            };

            // Actualizar UI con información del inventario
            $('#inventarioTitulo').text(inventarioActual.titulo || 'Sin título');
            $('#inventarioEstado').text('En Progreso')
                .removeClass('bg-light bg-warning bg-success bg-danger')
                .addClass('bg-success');

            console.log('✅ Información del inventario cargada desde configuración');
            return;
        }

        console.log('⚠️ No se encontró configuración global, intentando cargar desde servidor...');
        // Si no hay configuración global, continuar con la carga original (fallback)
        // Este código se puede quitar después, es solo por seguridad

    } catch (error) {
        console.error('❌ Error cargando información del inventario:', error);
        throw error;
    }
}


async function cargarProductosInventario(inventarioId) {
    try {
        console.log(`📦 Cargando productos del inventario ${inventarioId}...`);

        // Mostrar loading
        $('#loadingProductos').show();
        $('#listaProductos').hide();
        $('#emptyState').hide();

        const response = await fetch(`/TomaInventario/ObtenerProductos/${inventarioId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        productosInventario = data.productos || [];
        estadisticasActuales = data.estadisticas || {};

        console.log(`✅ Cargados ${productosInventario.length} productos`);

        // Renderizar productos
        renderizarProductos();

        // Aplicar filtros actuales
        filtrarProductos($('#filtroProductos').val().toLowerCase(), $('#filtroEstado').val());

    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        $('#loadingProductos').hide();
        $('#emptyState').show();
        mostrarError('Error al cargar productos del inventario');
    }
}

// =====================================
// FUNCIONES DE RENDERIZADO
// =====================================
function renderizarProductos() {
    const tbody = $('#productosTableBody');
    tbody.empty();

    if (productosInventario.length === 0) {
        $('#loadingProductos').hide();
        $('#listaProductos').hide();
        $('#emptyState').show();
        return;
    }

    productosInventario.forEach((producto, index) => {
        const row = crearFilaProducto(producto, index + 1);
        tbody.append(row);
    });

    $('#loadingProductos').hide();
    $('#listaProductos').show();
    $('#emptyState').hide();
}

function crearFilaProducto(producto, numero) {
    const tieneDiscrepancia = producto.tieneDiscrepancia;
    const estadoClass = tieneDiscrepancia ? 'estado-discrepancia' :
        producto.estadoConteo === 'Contado' ? 'estado-contado' : 'estado-pendiente';

    const imagenSrc = producto.imagenUrl || '/images/no-image.png';
    const diferencia = producto.diferencia || 0;
    const diferenciaClass = diferencia > 0 ? 'diferencia-positiva' :
        diferencia < 0 ? 'diferencia-negativa' : 'diferencia-cero';

    const estadoBadge = getEstadoBadge(producto.estadoConteo, tieneDiscrepancia);

    // Información adicional para llantas
    let infoLlanta = '';
    if (producto.esLlanta) {
        infoLlanta = `
            <div class="small text-muted">
                <i class="fas fa-circle-info me-1"></i>
                ${producto.marcaLlanta || ''} ${producto.modeloLlanta || ''} 
                ${producto.medidasLlanta || ''}
            </div>
        `;
    }

    return $(`
        <tr class="producto-row ${estadoClass}" data-producto-id="${producto.productoId}">
            <td class="text-center fw-bold">${numero}</td>
            <td>
                <img src="${imagenSrc}" alt="Producto" class="producto-imagen">
            </td>
            <td>
                <div class="fw-semibold">${producto.nombreProducto}</div>
                <div class="small text-muted">${producto.descripcionProducto || ''}</div>
                ${infoLlanta}
            </td>
            <td class="text-center">
                <span class="badge bg-primary">${producto.cantidadSistema}</span>
            </td>
            <td class="text-center">
                ${producto.cantidadFisica !== null ?
            `<span class="badge bg-info">${producto.cantidadFisica}</span>` :
            '<span class="text-muted">Sin contar</span>'
        }
            </td>
            <td class="text-center">
                <span class="${diferenciaClass}">
                    ${diferencia > 0 ? '+' : ''}${diferencia}
                </span>
            </td>
            <td class="text-center">
                ${estadoBadge}
            </td>
            <td class="text-center">
                ${crearBotonesAccion(producto)}
            </td>
        </tr>
    `);
}

function getEstadoBadge(estado, tieneDiscrepancia) {
    if (tieneDiscrepancia) {
        return '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i>Discrepancia</span>';
    }

    switch (estado) {
        case 'Contado':
            return '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Contado</span>';
        case 'Pendiente':
            return '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i>Pendiente</span>';
        default:
            return '<span class="badge bg-secondary">Desconocido</span>';
    }
}

function getEstadoBadgeClass(estado) {
    switch (estado) {
        case 'Programado':
            return 'bg-warning';
        case 'En Progreso':
            return 'bg-info';
        case 'Completado':
            return 'bg-success';
        case 'Cancelado':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// =====================================
// FUNCIONES DE FILTRADO
// =====================================
function filtrarProductos(textoFiltro, estadoFiltro) {
    productosFiltrados = productosInventario.filter(producto => {
        // ✅ VALIDACIÓN SEGURA - Filtro por texto
        const cumpleTexto = !textoFiltro ||
            (producto.nombreProducto && producto.nombreProducto.toLowerCase().includes(textoFiltro)) ||
            (producto.descripcionProducto && producto.descripcionProducto.toLowerCase().includes(textoFiltro)) ||
            (producto.marcaLlanta && producto.marcaLlanta.toLowerCase().includes(textoFiltro)) ||
            (producto.modeloLlanta && producto.modeloLlanta.toLowerCase().includes(textoFiltro));

        // ✅ VALIDACIÓN SEGURA - Filtro por estado
        let cumpleEstado = true;
        if (estadoFiltro) {
            switch (estadoFiltro) {
                case 'Pendiente':
                    cumpleEstado = producto.estadoConteo === 'Pendiente';
                    break;
                case 'Contado':
                    cumpleEstado = producto.estadoConteo === 'Contado';
                    break;
                case 'Discrepancia':
                    cumpleEstado = producto.tieneDiscrepancia;
                    break;
            }
        }

        return cumpleTexto && cumpleEstado;
    });

    // Re-renderizar solo los productos filtrados
    renderizarProductosFiltrados();
}


function renderizarProductosFiltrados() {
    const tbody = $('#productosTableBody');
    tbody.empty();

    if (productosFiltrados.length === 0) {
        $('#listaProductos').hide();
        $('#emptyState').show();
        return;
    }

    productosFiltrados.forEach((producto, index) => {
        const row = crearFilaProducto(producto, index + 1);
        tbody.append(row);
    });

    $('#listaProductos').show();
    $('#emptyState').hide();
}

// =====================================
// FUNCIONES DE CONTEO
// =====================================
function abrirModalConteo(productoId) {
    // Verificar permisos antes de abrir el modal
    if (!window.permisosUsuarioInventario?.permisoConteo) {
        mostrarError('No tienes permisos para realizar conteos en este inventario');
        return;
    }

    const producto = productosInventario.find(p => p.productoId === productoId);
    if (!producto) {
        mostrarError('Producto no encontrado');
        return;
    }

    console.log(`📝 Abriendo modal de conteo para producto: ${producto.nombreProducto}`);

    // Llenar información del producto
    $('#modalProductoId').val(producto.productoId);
    $('#modalInventarioId').val(inventarioActual.inventarioProgramadoId);
    $('#modalProductoNombre').text(producto.nombreProducto);
    $('#modalProductoDescripcion').text(producto.descripcionProducto || 'Sin descripción');
    $('#modalCantidadSistema').text(producto.cantidadSistema);

    // Imagen del producto
    const imagenSrc = producto.imagenUrl || '/images/no-image.png';
    $('#modalProductoImagen').attr('src', imagenSrc);

    // Información de llanta si aplica
    if (producto.esLlanta) {
        const infoLlanta = `${producto.marcaLlanta || ''} ${producto.modeloLlanta || ''} ${producto.medidasLlanta || ''}`.trim();
        $('#modalLlantaInfo').text(infoLlanta);
        $('#modalProductoLlanta').show();
    } else {
        $('#modalProductoLlanta').hide();
    }

    // Conteo anterior
    if (producto.cantidadFisica !== null) {
        $('#modalConteoAnterior').text(producto.cantidadFisica).removeClass('text-muted').addClass('text-info');
        $('#cantidadFisica').val(producto.cantidadFisica);
    } else {
        $('#modalConteoAnterior').text('Sin contar').removeClass('text-info').addClass('text-muted');
        $('#cantidadFisica').val('');
    }

    // Observaciones anteriores
    $('#observaciones').val(producto.observaciones || '');

    // Calcular diferencia inicial
    calcularDiferencia();

    // Mostrar modal
    $('#modalConteo').modal('show');

    // Focus en el campo de cantidad
    setTimeout(() => {
        $('#cantidadFisica').focus().select();
    }, 500);
}

function calcularDiferencia() {
    const cantidadSistema = parseInt($('#modalCantidadSistema').text()) || 0;
    const cantidadFisica = parseInt($('#cantidadFisica').val()) || 0;
    const diferencia = cantidadFisica - cantidadSistema;

    // Mostrar diferencia
    const $diferencia = $('#diferenciaCalculada');
    $diferencia.text(diferencia > 0 ? `+${diferencia}` : diferencia);

    // Colorear según la diferencia
    $diferencia.removeClass('text-success text-danger text-muted')
        .addClass(diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : 'text-muted');

    // Mostrar/ocultar alerta de discrepancia
    if (diferencia !== 0) {
        const tipoDiscrepancia = diferencia > 0 ? 'exceso' : 'faltante';
        const cantidadDiscrepancia = Math.abs(diferencia);
        $('#textoDiscrepancia').text(
            `Se detectó un ${tipoDiscrepancia} de ${cantidadDiscrepancia} unidad${cantidadDiscrepancia !== 1 ? 'es' : ''}.`
        );
        $('#alertaDiscrepancia').removeClass('d-none');
    } else {
        $('#alertaDiscrepancia').addClass('d-none');
    }
}

async function guardarConteoProducto() {
    try {
        const inventarioId = $('#modalInventarioId').val();
        const productoId = $('#modalProductoId').val();
        const cantidadFisica = parseInt($('#cantidadFisica').val());
        const observaciones = $('#observaciones').val().trim();

        // Validaciones
        if (!cantidadFisica && cantidadFisica !== 0) {
            mostrarError('Debes ingresar una cantidad física válida');
            return;
        }

        if (cantidadFisica < 0) {
            mostrarError('La cantidad física no puede ser negativa');
            return;
        }

        // Deshabilitar botón mientras se guarda
        const $btn = $('#btnGuardarConteo');
        const textoOriginal = $btn.html();
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Guardando...');

        console.log(`💾 Guardando conteo - Inventario: ${inventarioId}, Producto: ${productoId}, Cantidad: ${cantidadFisica}`);

        const conteoData = {
            inventarioProgramadoId: parseInt(inventarioId),
            productoId: parseInt(productoId),
            usuarioId: obtenerUsuarioId(), // Función que obtiene el ID del usuario actual
            cantidadFisica: cantidadFisica,
            observaciones: observaciones || null
        };

        const response = await fetch(`/TomaInventario/RegistrarConteo`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conteoData)
        });


        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        console.log('✅ Conteo guardado exitosamente:', resultado);

        // Mostrar mensaje de éxito
        if (resultado.hayDiscrepancia) {
            mostrarExito(`Conteo guardado. Discrepancia de ${resultado.diferencia} detectada.`);
        } else {
            mostrarExito('Conteo guardado exitosamente');
        }

        // Cerrar modal
        $('#modalConteo').modal('hide');

        // Recargar productos para mostrar el cambio
        await cargarProductosInventario(inventarioId);
        await actualizarEstadisticas();

    } catch (error) {
        console.error('❌ Error guardando conteo:', error);
        mostrarError(`Error al guardar conteo: ${error.message}`);
    } finally {
        // Restaurar botón
        $('#btnGuardarConteo').prop('disabled', false).html(textoOriginal);
    }
}

function limpiarModalConteo() {
    $('#modalProductoId').val('');
    $('#modalInventarioId').val('');
    $('#cantidadFisica').val('');
    $('#observaciones').val('');
    $('#alertaDiscrepancia').addClass('d-none');
    $('#modalProductoLlanta').hide();
}

// =====================================
// FUNCIONES DE ESTADÍSTICAS
// =====================================
async function actualizarEstadisticas() {
    try {
        if (!inventarioActual) return;

        const inventarioId = inventarioActual.inventarioProgramadoId;
        const response = await fetch(`/TomaInventario/ObtenerProgreso/${inventarioId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('⚠️ No se pudieron cargar las estadísticas');
            return;
        }

        const progreso = await response.json();

        // Actualizar estadísticas en la UI
        $('#statTotal').text(progreso.totalProductos || 0);
        $('#statContados').text(progreso.productosContados || 0);
        $('#statPendientes').text(progreso.productosPendientes || 0);
        $('#statDiscrepancias').text(progreso.discrepancias || 0);

        // Actualizar barra de progreso
        const porcentaje = progreso.porcentajeProgreso || 0;
        $('#barraProgreso').css('width', `${porcentaje}%`).attr('aria-valuenow', porcentaje);
        $('#progresoTexto').text(`${progreso.productosContados || 0} / ${progreso.totalProductos || 0} productos`);

        // Cambiar color de la barra según el progreso
        const $barra = $('#barraProgreso');
        $barra.removeClass('bg-danger bg-warning bg-info bg-success');
        if (porcentaje < 25) {
            $barra.addClass('bg-danger');
        } else if (porcentaje < 50) {
            $barra.addClass('bg-warning');
        } else if (porcentaje < 90) {
            $barra.addClass('bg-info');
        } else {
            $barra.addClass('bg-success');
        }

        console.log(`📊 Estadísticas actualizadas: ${porcentaje}% completado`);

    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

// =====================================
// FUNCIONES PARA COMPLETAR INVENTARIO
// =====================================
function mostrarModalCompletarInventario() {
    const stats = estadisticasActuales;
    const inventario = inventarioActual;

    const resumen = `
        <div class="row text-center">
            <div class="col-3">
                <div class="card bg-light">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold">${stats.total || 0}</div>
                        <small>Total</small>
                    </div>
                </div>
            </div>
            <div class="col-3">
                <div class="card bg-success bg-opacity-10">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold text-success">${stats.contados || 0}</div>
                        <small>Contados</small>
                    </div>
                </div>
            </div>
            <div class="col-3">
                <div class="card bg-warning bg-opacity-10">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold text-warning">${stats.pendientes || 0}</div>
                        <small>Pendientes</small>
                    </div>
                </div>
            </div>
            <div class="col-3">
                <div class="card bg-danger bg-opacity-10">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold text-danger">${stats.discrepancias || 0}</div>
                        <small>Discrepancias</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#resumenCompletarInventario').html(resumen);
    $('#modalCompletarInventario').modal('show');
}

async function completarInventario() {
    try {
        const inventarioId = inventarioActual.inventarioProgramadoId;

        // Deshabilitar botón
        const $btn = $('#btnConfirmarCompletar');
        const textoOriginal = $btn.html();
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Completando...');

        console.log(`🏁 Completando inventario ${inventarioId}...`);

        const response = await fetch(`/api/TomaInventario/${inventarioId}/completar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        console.log('✅ Inventario completado exitosamente:', resultado);

        // Cerrar modal
        $('#modalCompletarInventario').modal('hide');

        // Mostrar mensaje de éxito
        mostrarExito(`Inventario completado exitosamente. Total: ${resultado.totalProductos} productos, Discrepancias: ${resultado.discrepancias}`);

        // Recargar información del inventario
        await cargarInformacionInventario(inventarioId);
        await cargarProductosInventario(inventarioId);

        // Ocultar botón de completar
        $('#btnCompletarInventario').hide();

    } catch (error) {
        console.error('❌ Error completando inventario:', error);
        mostrarError(`Error al completar inventario: ${error.message}`);
    } finally {
        // Restaurar botón
        $('#btnConfirmarCompletar').prop('disabled', false).html(textoOriginal);
    }
}

// =====================================
// FUNCIONES AUXILIARES
// =====================================
function getInventarioIdFromUrl() {
    const path = window.location.pathname;
    console.log('🔍 Analizando path:', path);

    // Buscar patrón: /TomaInventario/Ejecutar/[número]
    const matches = path.match(/\/TomaInventario\/Ejecutar\/(\d+)/);
    const id = matches ? parseInt(matches[1]) : null;

    console.log('🔍 ID extraído de URL:', id);
    return id;
}
function obtenerUsuarioId() {
    // Esta función debería obtener el ID del usuario actual
    // Puedes implementarla según tu sistema de autenticación
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return parseInt(payload.userId || payload.nameid || payload.sub);
        }
    } catch (error) {
        console.error('Error obteniendo ID de usuario:', error);
    }
    return 1; // Fallback
}

function mostrarError(mensaje) {
    console.error('❌ Error:', mensaje);

    // Usar SweetAlert2 si está disponible, sino usar alert nativo
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } else {
        alert(`Error: ${mensaje}`);
    }
}

function mostrarExito(mensaje) {
    console.log('✅ Éxito:', mensaje);

    // Usar SweetAlert2 si está disponible, sino usar alert nativo
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Éxito',
            text: mensaje,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
        });
    } else {
        alert(`Éxito: ${mensaje}`);
    }
}

function mostrarInfo(mensaje) {
    console.log('ℹ️ Info:', mensaje);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Información',
            text: mensaje,
            icon: 'info',
            confirmButtonColor: '#0dcaf0'
        });
    } else {
        alert(`Info: ${mensaje}`);
    }
}

function crearBotonesAccion(producto) {
    const permisos = window.permisosUsuarioInventario || {};
    const inventarioEnProgreso = inventarioActual?.estado === 'En Progreso';

    let botones = '';

    // Botón de contar (solo si tiene permiso y el inventario está en progreso)
    if (permisos.permisoConteo && inventarioEnProgreso) {
        const textoBoton = producto.estadoConteo === 'Contado' ? 'Recontar' : 'Contar';
        botones += `
            <button class="btn btn-sm btn-primary btn-contar me-1" 
                    onclick="abrirModalConteo(${producto.productoId})">
                <i class="fas fa-calculator me-1"></i>
                ${textoBoton}
            </button>
        `;
    }

    // Botón de ajuste (solo si tiene permiso, hay discrepancia y el inventario está en progreso)
    if (permisos.permisoAjuste && producto.tieneDiscrepancia && inventarioEnProgreso) {
        botones += `
            <button class="btn btn-sm btn-warning btn-ajustar me-1" 
                    onclick="abrirModalAjuste(${producto.productoId})"
                    title="Ajustar discrepancia">
                <i class="fas fa-tools me-1"></i>
                Ajustar
            </button>
        `;
    }

    // Botón de validación (solo si tiene permiso y hay discrepancia)
    if (permisos.permisoValidacion && producto.tieneDiscrepancia) {
        botones += `
            <button class="btn btn-sm btn-info btn-validar" 
                    onclick="abrirModalValidacion(${producto.productoId})"
                    title="Validar discrepancia">
                <i class="fas fa-check-double me-1"></i>
                Validar
            </button>
        `;
    }

    // Si no tiene permisos o el inventario no está en progreso, mostrar botón deshabilitado
    if (!botones) {
        const razon = !inventarioEnProgreso ? 'Inventario no en progreso' : 'Sin permisos';
        botones = `
            <button class="btn btn-sm btn-secondary" disabled title="${razon}">
                <i class="fas fa-lock me-1"></i>
                Sin acceso
            </button>
        `;
    }

    return botones;
}

// Funciones placeholder para ajuste y validación (implementar después si es necesario)
function abrirModalAjuste(productoId) {
    mostrarInfo('Función de ajuste en desarrollo');
}

function abrirModalValidacion(productoId) {
    mostrarInfo('Función de validación en desarrollo');
}
window.abrirModalConteo = abrirModalConteo;
window.mostrarModalCompletarInventario = mostrarModalCompletarInventario;
window.completarInventario = completarInventario;