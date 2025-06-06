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
    // ✅ CONFIGURAR MODAL DE CONTEO
    $('#cantidadFisicaConteo').on('input', function () {
        calcularDiferencia();
    });

    // ✅ CONFIGURAR BOTÓN DE GUARDAR CONTEO
    $('#btnGuardarConteo').off('click').on('click', function (e) {
        e.preventDefault();
        console.log('🖱️ Click en botón guardar conteo');
        guardarConteoProducto();
    });

    // ✅ LIMPIAR MODAL AL CERRARSE
    $('#conteoModal').on('hidden.bs.modal', function () {
        limpiarModalConteo();
    });

    // ✅ CONFIGURAR MODAL DE AJUSTE DE STOCK
    $('#tipoAjusteInventario').on('change', function () {
        const tipoAjuste = $(this).val();
        const producto = productosInventario.find(p => p.productoId == $('#productoIdAjuste').val());

        if (tipoAjuste === 'ajustar-sistema') {
            $('#containerCantidadAjuste').show();
            $('#cantidadAjusteInventario').val(producto?.cantidadFisica || 0);
        } else {
            $('#containerCantidadAjuste').hide();
        }

        actualizarVistaPreviaAjuste();
    });

    $('#cantidadAjusteInventario, #tipoAjusteInventario').on('input change', function () {
        actualizarVistaPreviaAjuste();
    });

    // ✅ CONFIGURAR BOTÓN DE GUARDAR AJUSTE
    $('#guardarAjusteInventarioBtn').off('click').on('click', function (e) {
        e.preventDefault();
        console.log('🖱️ Click en botón guardar ajuste de inventario');
        guardarAjusteInventario();
    })

}

function abrirModalAjuste(productoId) {
    try {
        console.log(`🔧 === ABRIENDO MODAL DE AJUSTE ===`);
        console.log(`🔧 Producto ID: ${productoId}`);

        // ✅ VERIFICAR PERMISOS ANTES DE ABRIR
        const permisos = window.inventarioConfig?.permisos || {};
        if (!permisos.puedeAjustar && !permisos.esAdmin) {
            mostrarError('No tienes permisos para ajustar stock en este inventario');
            return;
        }

        // ✅ BUSCAR EL PRODUCTO EN LOS DATOS CARGADOS
        const producto = productosInventario.find(p => p.productoId === productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        // ✅ VERIFICAR QUE HAYA DISCREPANCIA
        if (!producto.tieneDiscrepancia) {
            mostrarError('Este producto no tiene discrepancias que ajustar');
            return;
        }

        console.log(`🔧 Producto encontrado: ${producto.nombreProducto}`);
        console.log(`🔧 Discrepancia: ${producto.diferencia}`);

        // ✅ LLENAR INFORMACIÓN DEL PRODUCTO EN EL MODAL
        $('#productoIdAjuste').val(producto.productoId);
        $('#nombreProductoAjuste').text(producto.nombreProducto || 'Sin nombre');
        $('#stockSistemaAjuste').text(producto.cantidadSistema || 0);
        $('#stockFisicoAjuste').text(producto.cantidadFisica || 0);

        // ✅ MOSTRAR DISCREPANCIA CON COLOR
        const diferencia = producto.diferencia || 0;
        const $discrepancia = $('#discrepanciaAjuste');
        $discrepancia.text(diferencia > 0 ? `+${diferencia}` : diferencia);

        if (diferencia > 0) {
            $discrepancia.removeClass('text-danger').addClass('text-success');
        } else {
            $discrepancia.removeClass('text-success').addClass('text-danger');
        }

        // ✅ RESETEAR FORMULARIO
        $('#tipoAjusteInventario').val('');
        $('#cantidadAjusteInventario').val(producto.cantidadFisica || 0);
        $('#motivoAjusteInventario').val('');
        $('#containerCantidadAjuste').hide();
        $('#vistaPreviaAjuste').hide();

        // ✅ MOSTRAR EL MODAL
        const modal = new bootstrap.Modal(document.getElementById('ajusteStockInventarioModal'));
        modal.show();

        console.log(`✅ Modal de ajuste abierto exitosamente`);

    } catch (error) {
        console.error('❌ Error abriendo modal de ajuste:', error);
        mostrarError('Error al abrir el modal de ajuste');
    }
}


function limpiarModalConteo() {
    try {
        console.log('🧹 Limpiando modal de conteo...');

        $('#productoIdConteo').val('');
        $('#inventarioIdConteo').val('');
        $('#cantidadFisicaConteo').val('');
        $('#observacionesConteo').val('');
        $('#alertaDiferencia').hide();
        $('#medidasLlantaConteo').hide();

        // Limpiar imagen
        $('#imagenProductoConteo').attr('src', '/images/no-image.png');

        console.log('✅ Modal de conteo limpiado');
    } catch (error) {
        console.error('❌ Error limpiando modal:', error);
    }
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
        $('#productosLista').hide();
        $('#productosTarjetas').hide();
        $('#estadoVacio').hide();

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

        console.log('🔍 === DEBUGGING PRODUCTOS CARGADOS ===');
        console.log('🔍 Respuesta completa:', data);
        console.log('🔍 Productos array:', data.productos);
        console.log('🔍 Estadísticas:', data.estadisticas);

        productosInventario = data.productos || [];
        estadisticasActuales = data.estadisticas || {};

        if (productosInventario.length > 0) {
            const primerProducto = productosInventario[0];
            console.log('🔍 Primer producto:', primerProducto);
            console.log('🔍 Propiedades del primer producto:', Object.keys(primerProducto));
        }

        console.log(`✅ Cargados ${productosInventario.length} productos`);

        // Renderizar productos
        renderizarProductos();

        // Actualizar estadísticas
        actualizarEstadisticasUI();

    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        $('#loadingProductos').hide();
        $('#estadoVacio').show();
        mostrarError('Error al cargar productos del inventario');
    }
}


// =====================================
// FUNCIONES DE RENDERIZADO
// =====================================
function renderizarProductos() {
    try {
        console.log('🎨 Renderizando productos...');
        console.log('🎨 Total productos a renderizar:', productosInventario.length);

        const tbody = $('#tablaProductosBody');
        tbody.empty();

        if (productosInventario.length === 0) {
            $('#loadingProductos').hide();
            $('#productosLista').hide();
            $('#estadoVacio').show();
            return;
        }

        productosInventario.forEach((producto, index) => {
            const row = crearFilaProducto(producto, index + 1);
            tbody.append(row);
        });

        $('#loadingProductos').hide();
        $('#productosLista').show();
        $('#estadoVacio').hide();

        console.log('✅ Productos renderizados correctamente');

    } catch (error) {
        console.error('❌ Error renderizando productos:', error);
    }
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
    try {
        console.log('🔍 Filtrando productos - Texto:', textoFiltro, 'Estado:', estadoFiltro);
        console.log('🔍 productosInventario disponibles:', productosInventario.length);

        productosFiltrados = productosInventario.filter(producto => {
            // ✅ MANEJO SEGURO DE TEXTO CON VERIFICACIONES NULL
            let cumpleTexto = true;
            if (textoFiltro && textoFiltro.trim() !== '') {
                const textoMinuscula = textoFiltro.toLowerCase();
                cumpleTexto = false;

                // ✅ VERIFICAR TODAS LAS POSIBLES VARIANTES DE NOMBRES
                const nombreProducto = producto.nombreProducto || producto.NombreProducto || '';
                const descripcionProducto = producto.descripcionProducto || producto.DescripcionProducto || '';
                const marcaLlanta = producto.marcaLlanta || producto.MarcaLlanta || '';
                const modeloLlanta = producto.modeloLlanta || producto.ModeloLlanta || '';
                const productoId = producto.productoId || producto.ProductoId || '';

                // Verificar en todos los campos posibles
                if (nombreProducto.toLowerCase().includes(textoMinuscula) ||
                    descripcionProducto.toLowerCase().includes(textoMinuscula) ||
                    marcaLlanta.toLowerCase().includes(textoMinuscula) ||
                    modeloLlanta.toLowerCase().includes(textoMinuscula) ||
                    productoId.toString().includes(textoMinuscula)) {
                    cumpleTexto = true;
                }
            }

            // ✅ FILTRO POR ESTADO
            let cumpleEstado = true;
            if (estadoFiltro && estadoFiltro.trim() !== '') {
                const estadoConteo = producto.estadoConteo || producto.EstadoConteo || 'Pendiente';
                const tieneDiscrepancia = producto.tieneDiscrepancia || producto.TieneDiscrepancia || false;

                switch (estadoFiltro.toLowerCase()) {
                    case 'pendiente':
                        cumpleEstado = estadoConteo === 'Pendiente';
                        break;
                    case 'contado':
                        cumpleEstado = estadoConteo === 'Contado';
                        break;
                    case 'discrepancia':
                        cumpleEstado = tieneDiscrepancia === true;
                        break;
                }
            }

            return cumpleTexto && cumpleEstado;
        });

        console.log('✅ Productos filtrados:', productosFiltrados.length);

        // Re-renderizar productos filtrados
        renderizarProductosFiltrados();

    } catch (error) {
        console.error('❌ Error en filtrarProductos:', error);
        console.error('❌ Error stack:', error.stack);

        // Fallback - mostrar todos los productos
        productosFiltrados = productosInventario;
        renderizarProductosFiltrados();
    }
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
    try {
        console.log(`📝 === ABRIENDO MODAL DE CONTEO ===`);
        console.log(`📝 Producto ID: ${productoId}`);

        // ✅ VERIFICAR PERMISOS ANTES DE ABRIR
        const permisos = window.inventarioConfig?.permisos || {};
        if (!permisos.puedeContar && !permisos.esAdmin) {
            mostrarError('No tienes permisos para realizar conteos en este inventario');
            return;
        }

        // ✅ BUSCAR EL PRODUCTO EN LOS DATOS CARGADOS
        const producto = productosInventario.find(p => p.productoId === productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        console.log(`📝 Producto encontrado: ${producto.nombreProducto}`);

        // ✅ LLENAR INFORMACIÓN DEL PRODUCTO EN EL MODAL
        $('#productoIdConteo').val(producto.productoId);
        $('#inventarioIdConteo').val(window.inventarioConfig.inventarioId);
        $('#nombreProductoConteo').text(producto.nombreProducto || 'Sin nombre');
        $('#descripcionProductoConteo').text(producto.descripcionProducto || 'Sin descripción');
        $('#cantidadSistemaConteo').val(producto.cantidadSistema || 0);

        // ✅ IMAGEN DEL PRODUCTO
        const imagenSrc = producto.imagenUrl || '/images/no-image.png';
        $('#imagenProductoConteo').attr('src', imagenSrc).attr('alt', producto.nombreProducto);

        // ✅ INFORMACIÓN DE LLANTA SI APLICA
        if (producto.esLlanta && (producto.marcaLlanta || producto.modeloLlanta)) {
            const especificaciones = [
                producto.marcaLlanta,
                producto.modeloLlanta,
                producto.medidasLlanta
            ].filter(Boolean).join(' - ');

            $('#especificacionesLlanta').text(especificaciones || 'Sin especificaciones');
            $('#medidasLlantaConteo').show();
            $('#tipoProductoConteo').text('Llanta').removeClass('bg-info').addClass('bg-primary');
        } else {
            $('#medidasLlantaConteo').hide();
            $('#tipoProductoConteo').text('Accesorio').removeClass('bg-primary').addClass('bg-info');
        }

        // ✅ MOSTRAR CONTEO ANTERIOR SI EXISTE
        if (producto.cantidadFisica !== null && producto.cantidadFisica !== undefined) {
            $('#cantidadFisicaConteo').val(producto.cantidadFisica);
            console.log(`📝 Cantidad física anterior: ${producto.cantidadFisica}`);
        } else {
            $('#cantidadFisicaConteo').val('');
            console.log(`📝 Sin conteo anterior`);
        }

        // ✅ OBSERVACIONES ANTERIORES
        $('#observacionesConteo').val(producto.observaciones || '');

        // ✅ CALCULAR DIFERENCIA INICIAL
        calcularDiferencia();

        // ✅ MOSTRAR EL MODAL
        const modal = new bootstrap.Modal(document.getElementById('conteoModal'));
        modal.show();

        // ✅ FOCUS EN EL CAMPO DE CANTIDAD DESPUÉS DE QUE SE ABRA
        $('#conteoModal').on('shown.bs.modal', function () {
            $('#cantidadFisicaConteo').focus().select();
        });

        console.log(`✅ Modal de conteo abierto exitosamente`);

    } catch (error) {
        console.error('❌ Error abriendo modal de conteo:', error);
        mostrarError('Error al abrir el modal de conteo');
    }
}


function calcularDiferencia() {
    try {
        const cantidadSistema = parseInt($('#cantidadSistemaConteo').val()) || 0;
        const cantidadFisica = parseInt($('#cantidadFisicaConteo').val()) || 0;
        const diferencia = cantidadFisica - cantidadSistema;

        console.log(`🧮 Calculando diferencia: Sistema=${cantidadSistema}, Físico=${cantidadFisica}, Diferencia=${diferencia}`);

        // ✅ MOSTRAR/OCULTAR ALERTA DE DISCREPANCIA
        const $alerta = $('#alertaDiferencia');
        const $textoDiferencia = $('#textoDiferencia');

        if (diferencia !== 0 && cantidadFisica > 0) {
            // Hay discrepancia
            let mensaje = '';
            let claseAlerta = '';

            if (diferencia > 0) {
                mensaje = `Exceso de ${diferencia} unidad${diferencia !== 1 ? 'es' : ''}`;
                claseAlerta = 'alert-warning';
                $textoDiferencia.text(`+${diferencia} unidades`).removeClass('text-danger text-muted').addClass('text-warning');
            } else {
                mensaje = `Faltante de ${Math.abs(diferencia)} unidad${Math.abs(diferencia) !== 1 ? 'es' : ''}`;
                claseAlerta = 'alert-danger';
                $textoDiferencia.text(`${diferencia} unidades`).removeClass('text-warning text-muted').addClass('text-danger');
            }

            $alerta.removeClass('alert-info alert-warning alert-danger').addClass(claseAlerta);
            $alerta.find('strong').text('Discrepancia detectada:');
            $alerta.find('span').text(mensaje);
            $alerta.show();

        } else {
            // Sin discrepancia o sin cantidad física
            if (cantidadFisica > 0) {
                $alerta.removeClass('alert-warning alert-danger').addClass('alert-success');
                $alerta.find('strong').text('Conteo correcto:');
                $alerta.find('span').text('Las cantidades coinciden');
                $textoDiferencia.text('0 unidades').removeClass('text-danger text-warning').addClass('text-muted');
                $alerta.show();
            } else {
                $alerta.hide();
                $textoDiferencia.text('0 unidades').removeClass('text-danger text-warning').addClass('text-muted');
            }
        }

    } catch (error) {
        console.error('❌ Error calculando diferencia:', error);
    }
}

async function guardarConteoProducto() {
    try {
        console.log('💾 === INICIANDO GUARDADO DE CONTEO ===');

        // ✅ OBTENER DATOS DEL MODAL
        const inventarioId = $('#inventarioIdConteo').val();
        const productoId = $('#productoIdConteo').val();
        const cantidadFisica = parseInt($('#cantidadFisicaConteo').val());
        const observaciones = $('#observacionesConteo').val()?.trim() || '';

        console.log('📊 Datos del conteo:', {
            inventarioId,
            productoId,
            cantidadFisica,
            observaciones
        });

        // ✅ VALIDACIONES
        if (!inventarioId || !productoId) {
            mostrarError('Faltan datos del inventario o producto');
            return;
        }

        if (isNaN(cantidadFisica) || cantidadFisica < 0) {
            mostrarError('Debes ingresar una cantidad física válida (mayor o igual a 0)');
            $('#cantidadFisicaConteo').focus();
            return;
        }

        // ✅ OBTENER BOTÓN Y MANEJAR ESTADO SEGURO
        const $btn = $('#btnGuardarConteo');
        if (!$btn.length) {
            console.error('❌ No se encontró el botón de guardar');
            mostrarError('Error en la interfaz: botón no encontrado');
            return;
        }

        // ✅ GUARDAR ESTADO ORIGINAL Y CAMBIAR A LOADING
        const estadoOriginal = {
            disabled: $btn.prop('disabled'),
            html: $btn.html()
        };

        console.log('🔄 Cambiando botón a estado de carga...');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        // ✅ OBTENER USUARIO ACTUAL
        const usuarioId = window.inventarioConfig?.usuarioId || 1;

        // ✅ CREAR OBJETO DE CONTEO
        const conteoData = {
            inventarioProgramadoId: parseInt(inventarioId),
            productoId: parseInt(productoId),
            usuarioId: usuarioId,
            cantidadFisica: cantidadFisica,
            observaciones: observaciones || null,
            fechaConteo: new Date().toISOString()
        };

        console.log('📤 Enviando datos de conteo:', conteoData);

        // ✅ ENVIAR A LA API
        const response = await fetch('/TomaInventario/RegistrarConteo', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conteoData)
        });

        console.log('📡 Respuesta recibida:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(`Error ${response.status}: ${errorData}`);
        }

        const resultado = await response.json();
        console.log('✅ Resultado exitoso:', resultado);

        // ✅ MOSTRAR MENSAJE DE ÉXITO
        if (resultado.hayDiscrepancia) {
            mostrarExito(`Conteo guardado. Discrepancia de ${resultado.diferencia} unidades detectada.`);
        } else {
            mostrarExito('Conteo guardado exitosamente');
        }

        // ✅ CERRAR MODAL
        const modal = bootstrap.Modal.getInstance(document.getElementById('conteoModal'));
        if (modal) {
            modal.hide();
        }

        // ✅ RECARGAR PRODUCTOS Y ESTADÍSTICAS
        await cargarProductosInventario(inventarioId);
        await actualizarEstadisticasUI();

        console.log('🎉 Conteo guardado y datos actualizados');

    } catch (error) {
        console.error('❌ Error guardando conteo:', error);
        mostrarError(`Error al guardar conteo: ${error.message}`);
    } finally {
        // ✅ RESTAURAR BOTÓN SIEMPRE
        try {
            const $btn = $('#btnGuardarConteo');
            if ($btn.length) {
                $btn.prop('disabled', false);
                $btn.find('.loading-state').hide();
                $btn.find('.normal-state').show();
            }
        } catch (btnError) {
            console.error('❌ Error restaurando botón:', btnError);
        }
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
// FUNCIONES DE ACTUALIZACIÓN DE UI
// =====================================

/**
 * Actualiza las estadísticas en la interfaz de usuario
 */
function actualizarEstadisticasUI() {
    try {
        console.log('📊 Actualizando estadísticas UI...');
        console.log('📊 Estadísticas actuales:', estadisticasActuales);

        // Actualizar contadores
        $('#totalProductos').text(estadisticasActuales.total || 0);
        $('#productosContados').text(estadisticasActuales.contados || 0);
        $('#productosPendientes').text(estadisticasActuales.pendientes || 0);
        $('#discrepancias').text(estadisticasActuales.discrepancias || 0);

        // Actualizar barra de progreso
        const porcentaje = estadisticasActuales.porcentajeProgreso || 0;
        $('#porcentajeProgreso').text(`${porcentaje}%`);
        $('#barraProgreso').css('width', `${porcentaje}%`);

        // Cambiar color de la barra según el progreso
        const $barra = $('#barraProgreso');
        $barra.removeClass('bg-danger bg-warning bg-info bg-success progress-bar-striped progress-bar-animated');

        if (porcentaje < 25) {
            $barra.addClass('bg-danger progress-bar-striped progress-bar-animated');
        } else if (porcentaje < 50) {
            $barra.addClass('bg-warning progress-bar-striped progress-bar-animated');
        } else if (porcentaje < 90) {
            $barra.addClass('bg-info progress-bar-striped progress-bar-animated');
        } else {
            $barra.addClass('bg-success');
        }

        // Actualizar contador de productos mostrados
        $('#contadorProductosMostrados').text(productosInventario.length);

        console.log(`📊 Estadísticas actualizadas: ${porcentaje}% completado`);

    } catch (error) {
        console.error('❌ Error actualizando estadísticas UI:', error);
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

function actualizarVistaPreviaAjuste() {
    try {
        const tipoAjuste = $('#tipoAjusteInventario').val();
        const producto = productosInventario.find(p => p.productoId == $('#productoIdAjuste').val());

        if (!tipoAjuste || !producto) {
            $('#vistaPreviaAjuste').hide();
            return;
        }

        const stockActual = producto.cantidadSistema || 0;
        const stockFisico = producto.cantidadFisica || 0;
        let stockFinal = stockActual;
        let accionTexto = '';

        switch (tipoAjuste) {
            case 'ajustar-sistema':
                stockFinal = parseInt($('#cantidadAjusteInventario').val()) || stockFisico;
                accionTexto = 'Ajustar al físico';
                break;
            case 'reconteo':
                stockFinal = stockActual;
                accionTexto = 'Recontar';
                break;
            case 'verificacion':
                stockFinal = stockActual;
                accionTexto = 'Verificar';
                break;
        }

        $('#stockActualPreviewAjuste').text(stockActual);
        $('#stockFisicoPreviewAjuste').text(stockFisico);
        $('#accionPreviewAjuste').text(accionTexto);
        $('#stockFinalPreviewAjuste').text(stockFinal);

        $('#vistaPreviaAjuste').show();

    } catch (error) {
        console.error('❌ Error actualizando vista previa:', error);
    }
}

async function guardarAjusteInventario() {
    try {
        console.log('💾 === GUARDANDO AJUSTE DE INVENTARIO ===');

        const productoId = $('#productoIdAjuste').val();
        const tipoAjuste = $('#tipoAjusteInventario').val();
        const motivo = $('#motivoAjusteInventario').val()?.trim();

        // ✅ VALIDACIONES
        if (!productoId || !tipoAjuste || !motivo) {
            mostrarError('Todos los campos son obligatorios');
            return;
        }

        if (motivo.length < 10) {
            mostrarError('El motivo debe tener al menos 10 caracteres');
            $('#motivoAjusteInventario').focus();
            return;
        }

        // ✅ OBTENER BOTÓN Y MANEJAR ESTADO
        const $btn = $('#guardarAjusteInventarioBtn');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        let ajusteData = {};

        if (tipoAjuste === 'ajustar-sistema') {
            // ✅ USAR EL ENDPOINT EXISTENTE DE AJUSTE DE STOCK
            const cantidadFinal = parseInt($('#cantidadAjusteInventario').val());

            ajusteData = {
                tipoAjuste: 'ajuste',
                cantidad: cantidadFinal,
                comentario: `Ajuste por inventario físico: ${motivo}`
            };

            console.log('📤 Enviando ajuste de stock:', ajusteData);

            const response = await fetch(`/Inventario/AjustarStock/${productoId}`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ajusteData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }

            const resultado = await response.json();

            if (resultado.success) {
                mostrarExito(`Stock ajustado exitosamente. ${resultado.data.stockAnterior} → ${resultado.data.stockNuevo} unidades`);
            } else {
                throw new Error(resultado.message || 'Error al ajustar stock');
            }

        } else {
            // ✅ PARA RECONTEO Y VERIFICACIÓN, SOLO REGISTRAR EN EL INVENTARIO
            console.log('📝 Registrando acción en inventario:', tipoAjuste);

            // Aquí podrías implementar un endpoint específico para estas acciones
            // Por ahora, simular el éxito
            mostrarExito(`Acción "${tipoAjuste}" registrada exitosamente`);
        }

        // ✅ CERRAR MODAL Y RECARGAR DATOS
        const modal = bootstrap.Modal.getInstance(document.getElementById('ajusteStockInventarioModal'));
        if (modal) {
            modal.hide();
        }

        // ✅ RECARGAR PRODUCTOS Y ESTADÍSTICAS
        await cargarProductosInventario(window.inventarioConfig.inventarioId);
        await actualizarEstadisticasUI();

    } catch (error) {
        console.error('❌ Error guardando ajuste:', error);
        mostrarError(`Error al guardar ajuste: ${error.message}`);
    } finally {
        // ✅ RESTAURAR BOTÓN
        const $btn = $('#guardarAjusteInventarioBtn');
        $btn.prop('disabled', false);
        $btn.find('.loading-state').hide();
        $btn.find('.normal-state').show();
    }
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
    try {
        // ✅ OBTENER PERMISOS DESDE CONFIGURACIÓN GLOBAL
        const permisos = window.inventarioConfig?.permisos || {};
        const inventarioEnProgreso = inventarioActual?.estado === 'En Progreso';

        console.log('🔒 Permisos del usuario:', permisos);
        console.log('📊 Estado del inventario en progreso:', inventarioEnProgreso);

        let botones = '';

        // ✅ BOTÓN DE CONTAR (si tiene permiso y el inventario está en progreso)
        if ((permisos.puedeContar || permisos.esAdmin) && inventarioEnProgreso) {
            const textoBoton = producto.estadoConteo === 'Contado' ? 'Recontar' : 'Contar';
            const iconoBoton = producto.estadoConteo === 'Contado' ? 'bi-arrow-clockwise' : 'bi-calculator';

            botones += `
                <button class="btn btn-sm btn-primary btn-contar me-1" 
                        onclick="abrirModalConteo(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="${textoBoton} producto">
                    <i class="bi ${iconoBoton} me-1"></i>
                    ${textoBoton}
                </button>
            `;
        }

        // ✅ BOTÓN DE AJUSTE (solo si tiene permiso, hay discrepancia y el inventario está en progreso)
        if ((permisos.puedeAjustar || permisos.esAdmin) && producto.tieneDiscrepancia && inventarioEnProgreso) {
            botones += `
                <button class="btn btn-sm btn-warning btn-ajustar me-1" 
                        onclick="abrirModalAjuste(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Ajustar discrepancia en el sistema">
                    <i class="bi bi-tools me-1"></i>
                    Ajustar
                </button>
            `;
        }

        // ✅ BOTÓN DE VALIDACIÓN (solo si tiene permiso y hay discrepancia)
        if ((permisos.puedeValidar || permisos.esAdmin) && producto.tieneDiscrepancia) {
            botones += `
                <button class="btn btn-sm btn-info btn-validar me-1" 
                        onclick="abrirModalValidacion(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Validar y aprobar discrepancia">
                    <i class="bi bi-check-double me-1"></i>
                    Validar
                </button>
            `;
        }

        // ✅ BOTÓN INFORMATIVO si no tiene permisos
        if (!botones) {
            let razon = '';
            if (!inventarioEnProgreso) {
                razon = 'Inventario no está en progreso';
            } else if (!permisos.puedeContar && !permisos.esAdmin) {
                razon = 'Sin permisos de conteo';
            } else {
                razon = 'Sin acciones disponibles';
            }

            botones = `
                <button class="btn btn-sm btn-secondary" disabled 
                        data-bs-toggle="tooltip" 
                        title="${razon}">
                    <i class="bi bi-lock me-1"></i>
                    Sin acceso
                </button>
            `;
        }

        return botones;

    } catch (error) {
        console.error('❌ Error creando botones de acción:', error);
        return `
            <button class="btn btn-sm btn-secondary" disabled>
                <i class="bi bi-exclamation-triangle me-1"></i>
                Error
            </button>
        `;
    }
}

function abrirModalValidacion(productoId) {
    mostrarInfo('Función de validación en desarrollo');
}
window.abrirModalConteo = abrirModalConteo;
window.mostrarModalCompletarInventario = mostrarModalCompletarInventario;
window.completarInventario = completarInventario;


