// ========================================
// MÓDULO DE PEDIDOS A PROVEEDORES
// Ubicación: /js/views/proveedores/pedidos-proveedor.js
// ========================================

console.log('🚀 Inicializando módulo de pedidos a proveedores...');

// =====================================
// VARIABLES GLOBALES
// =====================================

let pedidosData = [];
let pedidosFiltrados = [];
let proveedoresDisponibles = [];
let productosInventario = [];
let productosSeleccionados = [];
let proveedorSeleccionado = null;

// Variables para ordenamiento de productos
let estadoOrdenamientoProductos = {
    columna: null,
    direccion: 'asc'
};

// =====================================
// INICIALIZACIÓN
// =====================================

$(document).ready(function () {
    console.log('📚 DOM cargado, inicializando pedidos a proveedores...');

    try {
        configurarEventListeners();
        cargarDatosIniciales();

        console.log('✅ Módulo de pedidos a proveedores inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando módulo de pedidos:', error);
        mostrarError('Error al inicializar la página');
    }
});

// =====================================
// EVENT LISTENERS
// =====================================

function configurarEventListeners() {
    console.log('🔧 Configurando event listeners...');

    // Filtros
    $('#filtroProveedor, #filtroEstado').on('change', aplicarFiltros);
    $('#buscarPedido').on('input', aplicarFiltros);

    // Modal de nuevo pedido
    $('#modalNuevoPedido').on('hidden.bs.modal', function() {
        resetearFormularioPedido();
    });

    // Configurar ordenamiento de tabla de productos
    configurarOrdenamientoTablaProductos();
}

// =====================================
// FUNCIONES PRINCIPALES
// =====================================

/**
 * Cargar datos iniciales
 */
async function cargarDatosIniciales() {
    // Verificar si viene un proveedor específico desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const proveedorIdParam = urlParams.get('proveedorId');

    if (proveedorIdParam) {
        console.log(`🔗 Parámetro proveedorId detectado: ${proveedorIdParam}`);
        await Promise.all([
            cargarProveedores(),
            cargarPedidosDeProveedor(proveedorIdParam),
            cargarProductosInventario()
        ]);
    } else {
        console.log('📋 Cargando datos iniciales completos...');
        await Promise.all([
            cargarProveedores(),
            cargarPedidos(),
            cargarProductosInventario()
        ]);
    }
}

/**
 * Cargar todos los proveedores
 */
async function cargarProveedores() {
    try {
        console.log('👥 Cargando proveedores...');

        const response = await fetch('/Proveedores/ObtenerProveedores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📋 Respuesta del servidor:', data);

        if (data.success && data.data) {
            proveedoresDisponibles = Array.isArray(data.data) ? data.data : [];
            llenarSelectProveedores();
            console.log(`✅ ${proveedoresDisponibles.length} proveedores cargados`);
        } else {
            throw new Error(data.message || 'Error obteniendo proveedores');
        }
    } catch (error) {
        console.error('❌ Error cargando proveedores:', error);
        proveedoresDisponibles = [];
        llenarSelectProveedores(); // Llenar con array vacío para limpiar los selects
        if (typeof mostrarError === 'function') {
            mostrarError('Error cargando proveedores: ' + error.message);
        }
    }
}

/**
 * Cargar todos los pedidos (sin filtro por proveedor)
 */
async function cargarPedidos() {
    try {
        console.log('📦 Cargando TODOS los pedidos...');
        mostrarLoadingPedidos(true);

        const response = await fetch('/Proveedores/ObtenerPedidosProveedor', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Respuesta del servidor:', data);

        if (data.success && data.data) {
            pedidosData = Array.isArray(data.data) ? data.data : [];
            pedidosFiltrados = [...pedidosData];
            
            console.log(`✅ ${pedidosData.length} pedidos cargados`);
            
            if (pedidosData.length > 0) {
                console.log('📦 Primer pedido (estructura):', pedidosData[0]);
                console.log('📦 Propiedades del primer pedido:', Object.keys(pedidosData[0]));
                mostrarPedidos();
            } else {
                mostrarSinDatosPedidos(true);
            }
        } else {
            throw new Error(data.message || 'Error obteniendo pedidos');
        }
        
        actualizarContadorPedidos();

    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        pedidosData = [];
        pedidosFiltrados = [];
        mostrarSinDatosPedidos(true);
        actualizarContadorPedidos();
        if (typeof mostrarError === 'function') {
            mostrarError('Error cargando pedidos: ' + error.message);
        }
    } finally {
        mostrarLoadingPedidos(false);
    }
}

/**
 * Cargar pedidos de un proveedor específico (para cuando viene desde la vista de proveedores)
 */
async function cargarPedidosDeProveedor(proveedorId) {
    try {
        console.log(`📦 Cargando pedidos del proveedor ${proveedorId}...`);
        mostrarLoadingPedidos(true);

        const response = await fetch(`/Proveedores/ObtenerPedidosProveedor?proveedorId=${proveedorId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📦 Respuesta para proveedor ${proveedorId}:`, data);

        // Procesar respuesta igual que en cargarPedidos
        let pedidos = [];
        
        if (data.success && data.data) {
            pedidos = Array.isArray(data.data) ? data.data : [];
            console.log(`📦 Pedidos del proveedor ${proveedorId} procesados:`, pedidos.length);
        } else {
            console.log(`📦 No hay pedidos para el proveedor ${proveedorId}`);
            pedidos = [];
        }

        pedidosData = pedidos;
        pedidosFiltrados = [...pedidosData];

        console.log(`📊 Pedidos del proveedor ${proveedorId}: ${pedidosData.length}`);
        
        if (pedidosData.length === 0) {
            mostrarSinDatosPedidos(true);
        } else {
            mostrarPedidos();
        }
        
        actualizarContadorPedidos();
        console.log(`✅ ${pedidosData.length} pedidos del proveedor ${proveedorId} cargados`);

    } catch (error) {
        console.error('❌ Error cargando pedidos del proveedor:', error);
        mostrarError('Error cargando pedidos del proveedor: ' + error.message);
        mostrarSinDatosPedidos(true);
        pedidosData = [];
        pedidosFiltrados = [];
        actualizarContadorPedidos();
    } finally {
        mostrarLoadingPedidos(false);
    }
}

/**
 * Cargar productos del inventario
 */
async function cargarProductosInventario() {
    try {
        console.log('📦 Cargando productos del inventario...');

        const response = await fetch('/Facturacion/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success && data.productos) {
            productosInventario = data.productos;
            console.log(`✅ ${productosInventario.length} productos del inventario cargados`);
        }
    } catch (error) {
        console.error('❌ Error cargando productos del inventario:', error);
    }
}

/**
 * Llenar select de proveedores
 */
function llenarSelectProveedores() {
    console.log('🔄 Iniciando llenarSelectProveedores...');
    console.log('📋 proveedoresDisponibles:', proveedoresDisponibles);

    const select = $('#selectProveedor');
    const filtro = $('#filtroProveedor');

    // Limpiar opciones existentes
    select.html('<option value="">Seleccione un proveedor...</option>');
    filtro.html('<option value="">Todos los proveedores</option>');

    if (!proveedoresDisponibles || proveedoresDisponibles.length === 0) {
        console.warn('⚠️ No hay proveedores disponibles para llenar los selects');
        return;
    }

    console.log(`🔢 Total proveedores a procesar: ${proveedoresDisponibles.length}`);

    let proveedoresAgregados = 0;

    // Usar for loop clásico en lugar de forEach para mejor control
    for (let i = 0; i < proveedoresDisponibles.length; i++) {
        const proveedor = proveedoresDisponibles[i];
        console.log(`🔍 Procesando proveedor ${i + 1}:`, proveedor);

        // Log detallado de las propiedades del proveedor
        console.log('📊 Propiedades del proveedor:', {
            id: proveedor?.id,
            nombre: proveedor?.nombre,
            proveedorId: proveedor?.proveedorId,
            nombreProveedor: proveedor?.nombreProveedor,
            contacto: proveedor?.contacto,
            telefono: proveedor?.telefono,
            direccion: proveedor?.direccion
        });

        // Verificar si tiene los datos mínimos necesarios
        // Nota: Usar !== undefined y !== null para aceptar ID = 0
        const tieneId = proveedor && (
            (proveedor.id !== undefined && proveedor.id !== null) || 
            (proveedor.proveedorId !== undefined && proveedor.proveedorId !== null)
        );
        const tieneNombre = proveedor && (proveedor.nombre || proveedor.nombreProveedor);

        if (tieneId && tieneNombre) {
            // Usar la propiedad correcta según lo que esté disponible
            const proveedorId = proveedor.id || proveedor.proveedorId;
            const nombreProveedor = proveedor.nombre || proveedor.nombreProveedor || 'Sin nombre';

            const option = `<option value="${proveedorId}">${nombreProveedor}</option>`;

            console.log(`➕ Agregando opción: ${option}`);
            select.append(option);
            filtro.append(option);
            proveedoresAgregados++;
        } else {
            console.warn('⚠️ Proveedor con datos incompletos:', proveedor);
            console.warn('📋 Validación fallida:', {
                tieneId: tieneId,
                tieneNombre: tieneNombre,
                valorId: proveedor?.id !== undefined ? proveedor.id : proveedor?.proveedorId,
                valorNombre: proveedor?.nombre || proveedor?.nombreProveedor,
                idEsCero: (proveedor?.id === 0 || proveedor?.proveedorId === 0)
            });
        }
    }

    console.log(`✅ ${proveedoresAgregados} de ${proveedoresDisponibles.length} proveedores agregados a los selects`);

    // Verificar que las opciones se agregaron correctamente
    console.log(`📊 Opciones en select: ${select.find('option').length}`);
    console.log(`📊 Opciones en filtro: ${filtro.find('option').length}`);
}

/**
 * Mostrar pedidos en la tabla
 */
function mostrarPedidos() {
    console.log('📋 Iniciando mostrarPedidos...');
    console.log('📊 pedidosFiltrados:', pedidosFiltrados);
    
    const tbody = $('#cuerpoTablaPedidos');

    if (!pedidosFiltrados || pedidosFiltrados.length === 0) {
        console.log('📋 No hay pedidos para mostrar');
        mostrarSinDatosPedidos(true);
        return;
    }

    console.log(`📋 Renderizando ${pedidosFiltrados.length} pedidos en la tabla`);
    mostrarSinDatosPedidos(false);

    const html = pedidosFiltrados.map((pedido, index) => {
        console.log(`📦 Procesando pedido ${index + 1}:`, pedido);
        
        // Mapear las propiedades exactas que vienen de la API según la imagen del controlador
        const pedidoId = pedido.pedidoId || 'N/A';
        const proveedorNombre = pedido.proveedorNombre || 'Sin nombre';
        const fechaPedido = pedido.fechaPedido;
        const estado = pedido.estado || 'Pendiente';
        const montoTotal = pedido.totalPrecio || 0; // Usar totalPrecio en lugar de montoTotal
        const usuarioNombre = pedido.usuarioNombre || 'Sin usuario';
        
        // Formatear fecha correctamente
        let fechaFormateada = 'Fecha inválida';
        if (fechaPedido) {
            try {
                const fecha = new Date(fechaPedido);
                if (!isNaN(fecha.getTime())) {
                    fechaFormateada = fecha.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                }
            } catch (error) {
                console.warn('⚠️ Error formateando fecha:', error);
            }
        }
        
        const estadoBadge = obtenerBadgeEstado(estado);

        return `
            <tr>
                <td>${pedidoId}</td>
                <td>
                    <strong>${proveedorNombre}</strong>
                </td>
                <td>${fechaFormateada}</td>
                <td>${estadoBadge}</td>
                <td>
                    <strong>$${parseFloat(montoTotal).toFixed(2)}</strong>
                </td>
                <td>${usuarioNombre}</td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-info" onclick="verDetallePedido(${pedidoId})" title="Ver Detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-warning" onclick="cambiarEstadoPedido(${pedidoId}, '${estado}')" title="Cambiar Estado">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.html(html);
    console.log(`✅ ${pedidosFiltrados.length} pedidos renderizados en la tabla`);
}

/**
 * Obtener badge según el estado
 */
function obtenerBadgeEstado(estado) {
    const badges = {
        'Pendiente': 'bg-warning',
        'Enviado': 'bg-info',
        'Recibido': 'bg-success',
        'Cancelado': 'bg-danger'
    };

    const clase = badges[estado] || 'bg-secondary';
    return `<span class="badge ${clase}">${estado}</span>`;
}

/**
 * Aplicar filtros a la tabla
 */
function aplicarFiltros() {
    const proveedorId = $('#filtroProveedor').val();
    const estado = $('#filtroEstado').val();
    const busqueda = $('#buscarPedido').val().toLowerCase().trim();

    pedidosFiltrados = pedidosData.filter(pedido => {
        const cumpleProveedor = !proveedorId || pedido.proveedorId.toString() === proveedorId;
        const cumpleEstado = !estado || pedido.estado === estado;
        const cumpleBusqueda = !busqueda || 
            pedido.pedidoId.toString().includes(busqueda) ||
            (pedido.proveedorNombre && pedido.proveedorNombre.toLowerCase().includes(busqueda));

        return cumpleProveedor && cumpleEstado && cumpleBusqueda;
    });

    mostrarPedidos();
    actualizarContadorPedidos();
}

// =====================================
// FUNCIONES DEL MODAL NUEVO PEDIDO
// =====================================

/**
 * Abrir modal para nuevo pedido
 */
function abrirModalNuevoPedido() {
    if (proveedoresDisponibles.length === 0) {
        mostrarError('Debe crear al menos un proveedor antes de hacer un pedido');
        return;
    }

    resetearFormularioPedido();
    $('#modalNuevoPedido').modal('show');
}

/**
 * Seleccionar proveedor
 */
function seleccionarProveedor() {
    const proveedorId = $('#selectProveedor').val();

    if (!proveedorId) {
        proveedorSeleccionado = null;
        $('#infoProveedorSeleccionado').hide();
        $('#btnSiguientePaso').prop('disabled', false);
        return;
    }

    // Usar la propiedad correcta para buscar (id o proveedorId)
    proveedorSeleccionado = proveedoresDisponibles.find(p => {
        const id = p.id !== undefined ? p.id : p.proveedorId;
        return id.toString() === proveedorId;
    });

    if (proveedorSeleccionado) {
        mostrarInfoProveedor(proveedorSeleccionado);
        $('#btnSiguientePaso').prop('disabled', false);
    }
}

/**
 * Mostrar información del proveedor seleccionado
 */
function mostrarInfoProveedor(proveedor) {
    if (!proveedor) {
        console.error('❌ Proveedor no válido para mostrar información');
        return;
    }

    console.log('📋 Mostrando información del proveedor:', proveedor);

    const nombre = proveedor.nombre || proveedor.nombreProveedor || 'Sin nombre';
    const email = proveedor.email || proveedor.correo || 'No especificado';

    $('#infoNombreProveedor').text(nombre);
    $('#infoContactoProveedor').text(proveedor.contacto || 'No especificado');
    $('#infoEmailProveedor').text(email);
    $('#infoTelefonoProveedor').text(proveedor.telefono || 'No especificado');
    $('#infoDireccionProveedor').text(proveedor.direccion || 'No especificada');

    // Resaltar el email si existe
    if (email !== 'No especificado') {
        $('#infoEmailProveedor').removeClass('text-muted').addClass('text-info');
    } else {
        $('#infoEmailProveedor').removeClass('text-info').addClass('text-muted');
    }

    $('#infoProveedorSeleccionado').show();
}

/**
 * Ir al siguiente paso
 */
function siguientePaso() {
    $('#pasoSeleccionarProveedor').hide();
    $('#pasoSeleccionarProductos').show();
    cargarProductosEnTabla();
}

/**
 * Volver al paso anterior
 */
function anteriorPaso() {
    $('#pasoSeleccionarProductos').hide();
    $('#pasoSeleccionarProveedor').show();
}

/**
 * Configurar ordenamiento de la tabla de productos - EXACTAMENTE IGUAL QUE EN INVENTARIO FACTURACIÓN
 */
function configurarOrdenamientoTablaProductos() {
    console.log('🔧 Configurando ordenamiento de tabla de productos...');

    $('.sortable').off('click').on('click', function() {
        console.log('🚀 === INICIO FUNCIÓN DE ORDENAMIENTO ===');

        const column = $(this).data('column');
        const $table = $('#tablaProductosPedido');
        const $tbody = $table.find('tbody');
        const rows = $tbody.find('tr').toArray();

        console.log(`📊 DATOS DEL CLICK:`, {
            elemento: this,
            columna: column,
            tablaEncontrada: $table.length > 0,
            tbodyEncontrado: $tbody.length > 0,
            cantidadFilas: rows.length,
            columnValue: $(this).attr('data-column'),
            allDataAttributes: Object.assign({}, this.dataset)
        });

        // DIAGNÓSTICO DETALLADO
        console.log('🔍 === DIAGNÓSTICO DETALLADO ===');
        console.log('📋 ID de tabla buscada: tablaProductosPedido');
        console.log('📋 Tabla encontrada:', $table[0]);
        console.log('📋 TBody encontrado:', $tbody[0]);
        console.log('📋 HTML de tabla:', $table.length > 0 ? $table[0].outerHTML.substring(0, 200) + '...' : 'NO ENCONTRADA');
        console.log('📋 Contenido de tbody:', $tbody.html());
        console.log('📋 Todos los tr en tbody:', $tbody.find('tr'));
        console.log('📋 Cantidad de tr encontrados:', $tbody.find('tr').length);

        // Verificar si existe alguna tabla con productos
        const todasLasTablas = $('table');
        console.log('📋 Total de tablas en la página:', todasLasTablas.length);
        todasLasTablas.each(function(index) {
            console.log(`📋 Tabla ${index + 1}:`, {
                id: this.id,
                clases: this.className,
                filas: $(this).find('tr').length
            });
        });

        if (!column) {
            console.error('❌ NO SE DETECTÓ COLUMNA - data-column está vacío o indefinido');
            return;
        }

        if (rows.length === 0) {
            console.warn('⚠️ NO HAY FILAS PARA ORDENAR');
            console.warn('🔍 Intentando buscar filas con selectores alternativos...');

            // Buscar filas con data-producto-id
            const filasConData = $('tr[data-producto-id]');
            console.log('📋 Filas con data-producto-id encontradas:', filasConData.length);

            if (filasConData.length > 0) {
                console.log('✅ Usando filas encontradas con data-producto-id');
                // Usar estas filas en lugar de las del tbody
                const filasArray = filasConData.toArray();
                console.log('📋 Filas a ordenar:', filasArray.length);

                // Continuar con el ordenamiento usando filasArray
                ordenarFilas(filasArray, column, $(this));
                return;
            }

            return;
        }

        ordenarFilas(rows, column, $(this));
    });
}



/**
 * Cargar productos en la tabla de selección
 */
function cargarProductosEnTabla() {
    const tbody = $('#cuerpoTablaProductosPedido');

    if (productosInventario.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-exclamation-triangle text-warning"></i>
                    <p class="mt-2">No hay productos disponibles en el inventario</p>
                </td>
            </tr>
        `);
        return;
    }

    console.log('🔍 Datos de productos recibidos:', productosInventario);

    const html = productosInventario.map(producto => {
        // Log detallado de cada producto
        console.log('📦 Producto:', {
            id: producto.productoId,
            nombre: producto.nombreProducto,
            marca: producto.marca,
            modelo: producto.modelo,
            stock: producto.stock || producto.cantidadEnInventario,
            stockMinimo: producto.stockMinimo,
            esLlanta: producto.esLlanta,
            llanta: producto.llanta
        });

        // Determinar si es llanta y extraer medidas IGUAL QUE EN INVENTARIO FACTURACIÓN
        let esLlanta = false;
        let medidaLlanta = 'N/A';
        let medidaParaBusqueda = 'n/a';
        let marcaInfo = producto.marca || '';
        let modeloInfo = producto.modelo || '';

        try {
            // Verificar si es llanta usando la misma lógica del modal de inventario
            if (producto.llanta || (producto.Llanta && producto.Llanta.length > 0)) {
                esLlanta = true;
                const llantaInfo = producto.llanta || producto.Llanta[0];

                if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                    if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                        // Formato completo con perfil
                        medidaLlanta = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
                        medidaParaBusqueda = `${medidaLlanta} ${llantaInfo.ancho}/${llantaInfo.perfil} ${llantaInfo.ancho}x${llantaInfo.perfil}x${llantaInfo.diametro} ${llantaInfo.ancho} ${llantaInfo.perfil} ${llantaInfo.diametro}`.toLowerCase();
                    } else {
                        // Formato sin perfil
                        medidaLlanta = `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
                        medidaParaBusqueda = `${medidaLlanta} ${llantaInfo.ancho} R${llantaInfo.diametro} ${llantaInfo.diametro}`.toLowerCase();
                    }
                }

                // Usar marca y modelo de la llanta si están disponibles
                marcaInfo = llantaInfo.marca || marcaInfo || 'Sin marca';
                modeloInfo = llantaInfo.modelo || modeloInfo || '';
            }
        } catch (error) {
            console.warn('⚠️ Error procesando información de llanta:', error);
        }

        // Si no es llanta, usar marca/modelo del producto general
        if (!esLlanta) {
            marcaInfo = marcaInfo || 'N/A';
            modeloInfo = modeloInfo || '';
        }

        // Determinar stock usando la misma lógica del inventario
        const stockDisponible = producto.cantidadEnInventario || producto.stock || 0;
        const stockMinimo = producto.stockMinimo || 0;

        // Determinar clases de fila según stock - IGUAL QUE EN INVENTARIO FACTURACIÓN
        let rowClass = '';
        let stockBadge = '';
        if (stockDisponible <= 0) {
            rowClass = 'table-danger';
            stockBadge = '<span class="badge bg-danger">Sin Stock</span>';
        } else if (stockDisponible <= stockMinimo) {
            rowClass = 'table-warning';
            stockBadge = '<span class="badge bg-warning text-dark">Stock Bajo</span>';
        } else {
            stockBadge = '<span class="badge bg-success">Disponible</span>';
        }

        return `
            <tr class="${rowClass}" 
                data-producto-id="${producto.productoId}"
                data-nombre="${producto.nombreProducto || ''}"
                data-marca="${marcaInfo}"
                data-medida="${medidaLlanta}"
                data-stock="${stockDisponible}">
                <td>
                    <input type="checkbox" class="form-check-input producto-checkbox" 
                           value="${producto.productoId}" 
                           onchange="toggleProductoSeleccionado(${producto.productoId})">
                </td>
                <td class="text-center">
                    ${producto.productoId}
                </td>
                <td>
                    <div>
                        <strong>${producto.nombreProducto}</strong>
                    </div>
                    ${modeloInfo ? `<small class="text-muted">Modelo: ${modeloInfo}</small>` : ''}
                </td>
                <td>
                    <div>
                        ${marcaInfo}
                        ${modeloInfo && !esLlanta ? `<br><small class="text-muted">${modeloInfo}</small>` : ''}
                    </div>
                </td>
                <td class="text-center">
                    ${medidaLlanta !== 'N/A' ? `<span class="text-primary fw-bold">${medidaLlanta}</span>` : '<span class="text-muted">N/A</span>'}
                </td>
                <td class="text-center">
                    <div class="d-flex flex-column align-items-center">
                        <strong class="text-primary">${stockDisponible}</strong>
                        <small class="text-muted">Mín: ${stockMinimo}</small>
                        ${stockBadge}
                    </div>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm cantidad-producto" 
                           value="1" min="1" max="${stockDisponible}" style="width: 80px;" 
                           onchange="actualizarCantidadProducto(${producto.productoId}, this.value)"
                           disabled>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm precio-producto" 
                           value="0.00" min="0" step="0.01" style="width: 100px;"
                           onchange="actualizarPrecioProducto(${producto.productoId}, this.value)"
                           disabled>
                </td>
            </tr>
        `;
    }).join('');

    tbody.html(html);

    console.log('📋 === HTML DE PRODUCTOS CARGADO ===');
    console.log(`📊 Productos renderizados: ${productosInventario.length}`);

    // Verificar elementos sortable antes de configurar ordenamiento
    setTimeout(() => {
        const elementosSortable = $('.sortable');
        console.log('🔍 === VERIFICANDO ELEMENTOS SORTABLE ===');
        console.log(`📊 Elementos .sortable encontrados: ${elementosSortable.length}`);

        elementosSortable.each(function(index) {
            console.log(`📋 Elemento ${index + 1}:`, {
                elemento: this,
                dataColumn: $(this).data('column'),
                attrDataColumn: $(this).attr('data-column'),
                texto: $(this).text().trim(),
                clases: this.className
            });
        });

        // Configurar ordenamiento INMEDIATAMENTE después de cargar el HTML - IGUAL QUE EN INVENTARIO FACTURACIÓN
        configurarOrdenamientoTablaProductos();

        // Verificar que los event listeners se configuraron
        console.log('🔧 === VERIFICANDO EVENT LISTENERS ===');
        elementosSortable.each(function(index) {
            const events = $._data(this, 'events');
            console.log(`📋 Eventos en elemento ${index + 1}:`, events);
        });
    }, 100);
}

/**
 * Toggle producto seleccionado
 */
function toggleProductoSeleccionado(productoId) {
    const checkbox = $(`.producto-checkbox[value="${productoId}"]`);
    const fila = $(`tr[data-producto-id="${productoId}"]`);
    const cantidadInput = fila.find('.cantidad-producto');
    const precioInput = fila.find('.precio-producto');

    if (checkbox.is(':checked')) {
        // Agregar producto
        const producto = productosInventario.find(p => p.productoId === productoId);
        productosSeleccionados.push({
            ...producto,
            cantidad: 1,
            precioUnitario: 0.00
        });

        cantidadInput.prop('disabled', false);
        precioInput.prop('disabled', false);
        fila.addClass('table-success');
    } else {
        // Remover producto
        productosSeleccionados = productosSeleccionados.filter(p => p.productoId !== productoId);

        cantidadInput.prop('disabled', true).val(1);
        precioInput.prop('disabled', true).val('0.00');
        fila.removeClass('table-success');
    }

    actualizarResumenPedido();
}

/**
 * Actualizar cantidad de producto
 */
function actualizarCantidadProducto(productoId, cantidad) {
    const producto = productosSeleccionados.find(p => p.productoId === productoId);
    if (producto) {
        producto.cantidad = parseInt(cantidad) || 1;
        actualizarResumenPedido();
    }
}

/**
 * Actualizar precio de producto
 */
function actualizarPrecioProducto(productoId, precio) {
    const producto = productosSeleccionados.find(p => p.productoId === productoId);
    if (producto) {
        producto.precioUnitario = parseFloat(precio) || 0.00;
        actualizarResumenPedido();
    }
}

/**
 * Actualizar resumen del pedido
 */
function actualizarResumenPedido() {
    const totalProductos = productosSeleccionados.length;
    const cantidadTotal = productosSeleccionados.reduce((sum, p) => sum + p.cantidad, 0);
    const montoTotal = productosSeleccionados.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);

    $('#contadorSeleccionados').text(totalProductos);
    $('#totalProductosSeleccionados').text(totalProductos);
    $('#cantidadTotalSeleccionada').text(cantidadTotal);
    $('#montoTotalEstimado').text(montoTotal.toFixed(2));
}

/**
 * Filtrar productos en la tabla
 */
function filtrarProductosPedido() {
    const busqueda = $('#buscarProductoPedido').val().toLowerCase();
    const categoria = $('#filtroCategoriaPedido').val();

    $('tr[data-producto-id]').each(function() {
        const fila = $(this);
        const productoId = parseInt(fila.data('producto-id'));
        const producto = productosInventario.find(p => p.productoId === productoId);

        if (!producto) return;

        // Buscar en nombre del producto
        let cumpleBusqueda = !busqueda || producto.nombreProducto.toLowerCase().includes(busqueda);

        // Buscar en marca
        if (!cumpleBusqueda && producto.marca) {
            cumpleBusqueda = producto.marca.toLowerCase().includes(busqueda);
        }

        // Buscar en modelo
        if (!cumpleBusqueda && producto.modelo) {
            cumpleBusqueda = producto.modelo.toLowerCase().includes(busqueda);
        }

        // Buscar en medidas de llantas usando la misma lógica del modal de inventario
        if (!cumpleBusqueda) {
            try {
                if (producto.llanta || (producto.Llanta && producto.Llanta.length > 0)) {
                    const llantaInfo = producto.llanta || producto.Llanta[0];

                    // Buscar en marca de llanta
                    if (llantaInfo.marca) {
                        cumpleBusqueda = llantaInfo.marca.toLowerCase().includes(busqueda);
                    }

                    // Buscar en modelo de llanta
                    if (!cumpleBusqueda && llantaInfo.modelo) {
                        cumpleBusqueda = llantaInfo.modelo.toLowerCase().includes(busqueda);
                    }

                    // Buscar en medidas completas
                    if (!cumpleBusqueda && llantaInfo.ancho && llantaInfo.diametro) {
                        let medidas = '';
                        if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                            medidas = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
                        } else {
                            medidas = `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
                        }

                        // Buscar en formato completo y en componentes individuales
                        cumpleBusqueda = medidas.toLowerCase().includes(busqueda) ||
                                       llantaInfo.ancho.toString().includes(busqueda) ||
                                       (llantaInfo.perfil && llantaInfo.perfil.toString().includes(busqueda)) ||
                                       llantaInfo.diametro.toString().includes(busqueda);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error en búsqueda de llanta:', error);
            }
        }

        const cumpleCategoria = !categoria || producto.categoria === categoria;

        fila.toggle(cumpleBusqueda && cumpleCategoria);
    });
}

/**
 * Seleccionar todos los productos visibles
 */
function seleccionarTodosProductos() {
    const seleccionarTodos = $('#seleccionarTodosProductos').is(':checked');

    $('tr[data-producto-id]:visible .producto-checkbox').each(function() {
        const checkbox = $(this);
        const productoId = parseInt(checkbox.val());

        if (seleccionarTodos && !checkbox.is(':checked')) {
            checkbox.prop('checked', true);
            toggleProductoSeleccionado(productoId);
        } else if (!seleccionarTodos && checkbox.is(':checked')) {
            checkbox.prop('checked', false);
            toggleProductoSeleccionado(productoId);
        }
    });
}

/**
 * Finalizar pedido
 */
async function finalizarPedido() {
    if (productosSeleccionados.length === 0) {
        mostrarError('Debe seleccionar al menos un producto');
        return;
    }

    if (!proveedorSeleccionado) {
        mostrarError('Debe seleccionar un proveedor');
        return;
    }

    try {
        const btnFinalizar = $('button[onclick="finalizarPedido()"]');
        const textoOriginal = btnFinalizar.html();
        btnFinalizar.html('<i class="bi bi-hourglass-split me-1"></i>Creando Pedido...').prop('disabled', true);

        const datosPedido = {
            proveedorId: proveedorSeleccionado.id || proveedorSeleccionado.proveedorId,
            productos: productosSeleccionados.map(p => ({
                productoId: p.productoId,
                cantidad: p.cantidad,
                precioUnitario: p.precioUnitario
            }))
        };

        const response = await fetch('/Proveedores/CrearPedidoProveedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosPedido)
        });

        console.log('📦 Response completo:', response);
        console.log('📦 Response status:', response.status);
        console.log('📦 Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error HTTP response:', errorText);
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('📦 Response text crudo:', responseText);

        let resultado;
        try {
            resultado = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            console.log('📦 Texto que falló al parsear:', responseText);
            throw new Error('Respuesta del servidor no es JSON válido');
        }

        console.log('📦 Resultado parseado:', resultado);
        console.log('📦 Propiedades del resultado:', Object.keys(resultado || {}));
        console.log('📦 resultado.success:', resultado?.success);
        console.log('📦 resultado.data:', resultado?.data);
        console.log('📦 resultado.message:', resultado?.message);

        // Verificar diferentes estructuras de respuesta
        let success = false;
        let data = null;
        let mensaje = 'Pedido creado exitosamente';
        let pedidoId = null;

        // Estructura 1: { success: true, data: {...}, message: "..." }
        if (resultado && typeof resultado === 'object') {
            if (resultado.success === true) {
                success = true;
                data = resultado.data;
                mensaje = resultado.message || mensaje;
                if (data && data.pedidoId) {
                    pedidoId = data.pedidoId;
                }
                console.log('✅ Estructura tipo 1 detectada');
            }
            // Estructura 2: Respuesta directa con pedidoId
            else if (resultado.pedidoId) {
                success = true;
                data = resultado;
                pedidoId = resultado.pedidoId;
                mensaje = resultado.message || mensaje;
                console.log('✅ Estructura tipo 2 detectada (pedidoId directo)');
            }
            // Estructura 3: Array o respuesta sin success
            else if (Array.isArray(resultado) || (!resultado.hasOwnProperty('success') && resultado.pedidoId)) {
                success = true;
                data = resultado;
                pedidoId = resultado.pedidoId || 'N/A';
                console.log('✅ Estructura tipo 3 detectada');
            }
        }

        console.log('📦 Variables finales:', { success, data, mensaje, pedidoId });

        if (success) {
            console.log('✅ Pedido creado exitosamente con ID:', pedidoId);
            mostrarExito(`${mensaje}${pedidoId ? `. ID del pedido: ${pedidoId}` : ''}`);
            $('#modalNuevoPedido').modal('hide');
            await cargarPedidos();
            limpiarFormulario();
        } else {
            const errorMsg = resultado?.message || resultado?.details || resultado?.error || 'Error desconocido al crear el pedido';
            console.error('❌ Error creando pedido:', errorMsg);
            mostrarError(errorMsg);
        }
    } catch (error) {
        console.error('❌ Error de red creando pedido:', error);
        mostrarError('Error de conexión: ' + error.message);
    } finally {
        const btnFinalizar = $('button[onclick="finalizarPedido()"]');
        btnFinalizar.html('<i class="bi bi-check-circle me-1"></i>Finalizar Pedido <span id="contadorSeleccionados" class="badge bg-white text-success ms-1">' + productosSeleccionados.length + '</span>').prop('disabled', false);
    }
}

/**
 * Resetear formulario de pedido
 */
function resetearFormularioPedido() {
    proveedorSeleccionado = null;
    productosSeleccionados = [];

    $('#selectProveedor').val('');
    $('#infoProveedorSeleccionado').hide();
    $('#btnSiguientePaso').prop('disabled', true);

    $('#pasoSeleccionarProveedor').show();
    $('#pasoSeleccionarProductos').hide();

    $('#buscarProductoPedido').val('');
    $('#filtroCategoriaPedido').val('');
    $('#seleccionarTodosProductos').prop('checked', false);

    actualizarResumenPedido();
}

// =====================================
// MODAL PROVEEDOR RÁPIDO
// =====================================

/**
 * Abrir modal para crear proveedor rápido
 */
function abrirModalProveedorRapido() {
    $('#formProveedorRapido')[0].reset();
    $('#modalProveedorRapido').modal('show');
}

/**
 * Guardar proveedor rápido
 */
async function guardarProveedorRapido() {
    try {
        const nombre = $('#nombreProveedorRapido').val().trim();

        if (!nombre) {
            mostrarError('El nombre del proveedor es requerido');
            return;
        }

        const datosProveedor = {
            nombreProveedor: nombre,
            contacto: $('#contactoRapido').val().trim() || null,
            telefono: $('#telefonoRapido').val().trim() || null,
            direccion: null
        };

        const response = await fetch('/Proveedores/CrearProveedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosProveedor)
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito('Proveedor creado exitosamente');
            $('#modalProveedorRapido').modal('hide');

            // Recargar proveedores y seleccionar el nuevo
            await cargarProveedores();
            $('#selectProveedor').val(resultado.data.proveedorId);
            seleccionarProveedor();
        } else {
            mostrarError(resultado.message);
        }
    } catch (error) {
        console.error('❌ Error creando proveedor rápido:', error);
        mostrarError('Error creando proveedor: ' + error.message);
    }
}

// =====================================
// FUNCIONES DE ACCIONES
// =====================================

/**
 * Ver detalle de un pedido
 */
async function verDetallePedido(pedidoId) {
    try {
        console.log('👁️ Viendo detalle del pedido:', pedidoId);

        // Buscar pedido en los datos locales
        const pedido = pedidosData.find(p => p.pedidoId === pedidoId);

        if (!pedido) {
            mostrarError('Pedido no encontrado');
            return;
        }

        // Buscar información completa del proveedor
        const proveedorCompleto = proveedoresDisponibles.find(p => {
            const id = p.id || p.proveedorId;
            return id.toString() === pedido.proveedorId.toString();
        });

        const fecha = new Date(pedido.fechaPedido).toLocaleDateString('es-ES');
        const estadoBadge = obtenerBadgeEstado(pedido.estado);

        // Función para obtener información de llanta desde productosInventario
        const obtenerInfoLlanta = (productoNombre) => {
            const producto = productosInventario.find(p => 
                p.nombreProducto === productoNombre || 
                p.nombreProducto.toLowerCase().includes(productoNombre.toLowerCase())
            );
            
            if (producto && (producto.llanta || (producto.Llanta && producto.Llanta.length > 0))) {
                const llantaInfo = producto.llanta || producto.Llanta[0];
                
                if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                    if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                        return `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
                    } else {
                        return `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
                    }
                }
            }
            return 'N/A';
        };

        const html = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-box-seam me-2"></i>Información del Pedido</h6>
                    <table class="table table-sm table-borderless">
                        <tr>
                            <td><strong>ID:</strong></td>
                            <td>${pedido.pedidoId}</td>
                        </tr>
                        <tr>
                            <td><strong>Fecha:</strong></td>
                            <td>${fecha}</td>
                        </tr>
                        <tr>
                            <td><strong>Estado:</strong></td>
                            <td>${estadoBadge}</td>
                        </tr>
                        <tr>
                            <td><strong>Usuario:</strong></td>
                            <td>${pedido.usuarioNombre}</td>
                        </tr>
                        <tr>
                            <td><strong>Total:</strong></td>
                            <td><strong class="text-primary">₡${(pedido.totalPrecio || pedido.montoTotal || 0).toFixed(2)}</strong></td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6><i class="bi bi-truck me-2"></i>Información del Proveedor</h6>
                    <table class="table table-sm table-borderless">
                        <tr>
                            <td><strong>Nombre:</strong></td>
                            <td>${pedido.proveedorNombre}</td>
                        </tr>
                        ${proveedorCompleto ? `
                            <tr>
                                <td><strong>Contacto:</strong></td>
                                <td>${proveedorCompleto.contacto || 'No especificado'}</td>
                            </tr>
                            <tr>
                                <td><strong>Teléfono:</strong></td>
                                <td>${proveedorCompleto.telefono || 'No especificado'}</td>
                            </tr>
                            <tr>
                                <td><strong>Email:</strong></td>
                                <td>${proveedorCompleto.email || proveedorCompleto.correo || 'No especificado'}</td>
                            </tr>
                            <tr>
                                <td><strong>Dirección:</strong></td>
                                <td>${proveedorCompleto.direccion || 'No especificada'}</td>
                            </tr>
                        ` : `
                            <tr>
                                <td colspan="2"><em class="text-muted">Información adicional no disponible</em></td>
                            </tr>
                        `}
                    </table>
                </div>
            </div>

            <h6 class="mt-4 mb-3"><i class="bi bi-list-ul me-2"></i>Productos del Pedido</h6>
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead class="table-primary">
                        <tr>
                            <th class="text-center" style="width: 80px;">Cantidad</th>
                            <th class="text-center" style="width: 130px;">Medida</th>
                            <th style="width: 200px;">Producto</th>
                            <th class="text-center" style="width: 110px;">Precio Unit.</th>
                            <th class="text-center" style="width: 110px;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedido.detallePedidos && pedido.detallePedidos.length > 0 ? 
                            pedido.detallePedidos.map(detalle => {
                                const medidaLlanta = obtenerInfoLlanta(detalle.productoNombre);
                                const esLlanta = medidaLlanta !== 'N/A';
                                
                                return `
                                    <tr>
                                        <td class="text-center">
                                            <span class="badge bg-secondary">${detalle.cantidad}</span>
                                        </td>
                                        <td class="text-center">
                                            ${esLlanta ? 
                                                `<span class="badge bg-info text-dark">${medidaLlanta}</span>` : 
                                                '<span class="text-muted">N/A</span>'
                                            }
                                        </td>
                                        <td>
                                            <strong>${detalle.productoNombre}</strong>
                                        </td>
                                        <td class="text-center">
                                            <strong>₡${(detalle.precioUnitario || 0).toFixed(2)}</strong>
                                        </td>
                                        <td class="text-center">
                                            <strong class="text-success">₡${detalle.subtotal.toFixed(2)}</strong>
                                        </td>
                                    </tr>
                                `;
                            }).join('') 
                            : `
                                <tr>
                                    <td colspan="5" class="text-center text-muted py-3">
                                        <i class="bi bi-inbox"></i>
                                        <br>No hay productos en este pedido
                                    </td>
                                </tr>
                            `
                        }
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <th colspan="4" class="text-end">
                                <span class="fs-6">Total del Pedido:</span>
                            </th>
                            <th class="text-center">
                                <span class="fs-5 text-primary">₡${(pedido.totalPrecio || pedido.montoTotal || 0).toFixed(2)}</span>
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>

            ${pedido.detallePedidos && pedido.detallePedidos.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center py-2">
                                <small class="text-muted">Total de Items</small>
                                <div class="h5 mb-0 text-primary">${pedido.detallePedidos.reduce((sum, d) => sum + d.cantidad, 0)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center py-2">
                                <small class="text-muted">Productos Únicos</small>
                                <div class="h5 mb-0 text-info">${pedido.detallePedidos.length}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center py-2">
                                <small class="text-muted">Promedio por Item</small>
                                <div class="h5 mb-0 text-success">₡${((pedido.totalPrecio || pedido.montoTotal || 0) / pedido.detallePedidos.reduce((sum, d) => sum + d.cantidad, 0)).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;

        $('#contenidoDetallePedido').html(html);
        $('#modalDetallePedido').modal('show');
    } catch (error) {
        console.error('❌ Error viendo detalle del pedido:', error);
        mostrarError('Error cargando detalle del pedido');
    }
}

/**
 * Cambiar estado de un pedido
 */
function cambiarEstadoPedido(pedidoId, estadoActual) {
    // Implementar cambio de estado
    console.log('🔄 Cambiando estado del pedido:', pedidoId, estadoActual);
    // Por ahora solo log, se puede implementar un modal para cambiar estado
}

// =====================================
// FUNCIONES DE UI
// =====================================

/**
 * Mostrar/ocultar loading de pedidos
 */
function mostrarLoadingPedidos(mostrar) {
    $('#loadingPedidos').toggle(mostrar);
    $('#tablaPedidos').toggle(!mostrar);
}

/**
 * Mostrar/ocultar mensaje sin datos de pedidos
 */
function mostrarSinDatosPedidos(mostrar) {
    $('#sinDatosPedidos').toggle(mostrar);
    $('#tablaPedidos').toggle(!mostrar);
}

/**
 * Actualizar contador de pedidos
 */
function actualizarContadorPedidos() {
    $('#contadorPedidos').text(pedidosFiltrados.length);
}

// =====================================
// FUNCIONES DE MENSAJES
// =====================================

/**
 * Mostrar mensaje de éxito
 */
function mostrarExito(mensaje) {
    console.log('✅ Éxito:', mensaje);
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: mensaje,
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#28a745',
            timer: 3000,
            timerProgressBar: true
        });
    } else if (typeof mostrarToast === 'function') {
        mostrarToast('Éxito', mensaje, 'success');
    } else {
        alert('Éxito: ' + mensaje);
    }
}

/**
 * Mostrar mensaje de error
 */
function mostrarError(mensaje) {
    console.error('❌ Error:', mensaje);
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc3545'
        });
    } else if (typeof mostrarToast === 'function') {
        mostrarToast('Error', mensaje, 'danger');
    } else {
        alert('Error: ' + mensaje);
    }
}

/**
 * Función para ordenar filas de tabla
 */
function ordenarFilas(rows, column, $elementoClick) {
    console.log(`🔄 Ordenando por columna: ${column}`);
    console.log('📋 Filas recibidas para ordenar:', rows.length);

    // Determinar dirección de ordenamiento
    let ascending = true;
    if ($elementoClick.hasClass('sorted-asc')) {
        ascending = false;
        $elementoClick.removeClass('sorted-asc').addClass('sorted-desc');
    } else {
        $elementoClick.removeClass('sorted-desc').addClass('sorted-asc');
        ascending = true;
    }

    console.log(`📈 Dirección de ordenamiento: ${ascending ? 'ascendente' : 'descendente'}`);

    // Limpiar iconos de otras columnas
    $('.sortable').not($elementoClick).removeClass('sorted-asc sorted-desc');

    // Actualizar icono
    $('.sortable i').removeClass('bi-arrow-up bi-arrow-down').addClass('bi-arrow-down-up');
    $elementoClick.find('i').removeClass('bi-arrow-down-up').addClass(ascending ? 'bi-arrow-up' : 'bi-arrow-down');

    // Ordenar filas - USANDO .data() IGUAL QUE EN INVENTARIO FACTURACIÓN
    console.log('🔄 === INICIANDO FUNCIÓN SORT ===');

    rows.sort(function(a, b) {
        console.log('🚀 === DENTRO DE SORT FUNCTION ===');
        console.log('📋 Parámetros recibidos:', {
            a: a,
            b: b,
            column: column,
            aElement: $(a)[0],
            bElement: $(b)[0]
        });

        let aVal, bVal;

        console.log(`🔍 Entrando al switch con columna: "${column}"`);

        switch(column) {
            case 'id':
                console.log('✅ CASE ID - Obteniendo valores de producto-id');
                aVal = parseInt($(a).data('producto-id')) || 0;
                bVal = parseInt($(b).data('producto-id')) || 0;
                console.log('📊 ID Values:', { aVal, bVal });
                break;
            case 'nombre':
                console.log('✅ CASE NOMBRE - Obteniendo valores de nombre');
                aVal = $(a).data('nombre') || '';
                bVal = $(b).data('nombre') || '';
                console.log('📊 Nombre Values:', { aVal, bVal });
                break;
            case 'marca':
                console.log('✅ CASE MARCA - Obteniendo valores de marca');
                aVal = $(a).data('marca') || '';
                bVal = $(b).data('marca') || '';
                console.log('📊 Marca Values:', { aVal, bVal });
                break;
            case 'medida':
                console.log('✅ CASE MEDIDA - Obteniendo valores de medida');
                aVal = $(a).data('medida') || 'zzz';
                bVal = $(b).data('medida') || 'zzz';
                console.log('📊 Medida Values:', { aVal, bVal });
                break;
            case 'stock':
                console.log('✅ CASE STOCK - Obteniendo valores de stock');
                aVal = parseInt($(a).data('stock')) || 0;
                bVal = parseInt($(b).data('stock')) || 0;
                console.log('📊 Stock Values:', { aVal, bVal });
                break;
            default:
                console.error(`❌ DEFAULT CASE - Columna no reconocida: "${column}"`);
                console.log('📋 Todos los data attributes de A:', $(a).data());
                console.log('📋 Todos los data attributes de B:', $(b).data());
                return 0;
        }

        console.log('📊 Valores finales antes de comparar:', { aVal, bVal, tipo: typeof aVal });

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
            const result = ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            console.log('📊 Resultado comparación string:', result);
            return result;
        } else {
            const result = ascending ? aVal - bVal : bVal - aVal;
            console.log('📊 Resultado comparación numérica:', result);
            return result;
        }
    });

    console.log('✅ SORT FUNCTION COMPLETADA');

    // Determinar dónde colocar las filas ordenadas
    const $tabla = $('#tablaProductosPedido');
    const $tbody = $tabla.find('tbody');

    if ($tbody.length > 0) {
        console.log('📋 Reordenando en tbody de tablaProductosPedido');
        $tbody.empty().append(rows);
    } else {
        // Si no hay tbody específico, buscar el contenedor padre común
        console.log('📋 No se encontró tbody, buscando contenedor padre...');
        const $contenedorPadre = $(rows[0]).parent();
        console.log('📋 Contenedor padre encontrado:', $contenedorPadre[0]);
        $contenedorPadre.empty().append(rows);
    }

    console.log(`✅ Tabla ordenada por ${column} (${ascending ? 'ascendente' : 'descendente'})`);
    console.log('🏁 === FIN FUNCIÓN DE ORDENAMIENTO ===');
}

/**
 * Limpiar Formulario
 */
function limpiarFormulario() {
    // Deseleccionar todos los productos seleccionados
    $('tr[data-producto-id]:visible .producto-checkbox').each(function() {
        const checkbox = $(this);
        if (checkbox.is(':checked')) {
            checkbox.prop('checked', false);
            const productoId = parseInt(checkbox.val());
            toggleProductoSeleccionado(productoId);
        }
    });

    // Resetear el filtro de búsqueda de productos
    $('#buscarProductoPedido').val('');
    filtrarProductosPedido();

    // Resetear la selección de categoría
    $('#filtroCategoriaPedido').val('');

    // Desmarcar el checkbox de seleccionar todos
    $('#seleccionarTodosProductos').prop('checked', false);

    // Opcional: podría también resetear la cantidad y el precio de cada producto
    $('input.cantidad-producto').val(1);
    $('input.precio-producto').val(0.00);

    // Ocultar la información del proveedor seleccionado
    $('#infoProveedorSeleccionado').hide();

    // Deseleccionar el proveedor
    $('#selectProveedor').val('');
    seleccionarProveedor();

    // Actualizar el resumen del pedido
    actualizarResumenPedido();
}

// =====================================
// EXPORTAR FUNCIONES GLOBALMENTE
// =====================================

window.abrirModalNuevoPedido = abrirModalNuevoPedido;
window.seleccionarProveedor = seleccionarProveedor;
window.siguientePaso = siguientePaso;
window.anteriorPaso = anteriorPaso;
window.toggleProductoSeleccionado = toggleProductoSeleccionado;
window.actualizarCantidadProducto = actualizarCantidadProducto;
window.actualizarPrecioProducto = actualizarPrecioProducto;
window.filtrarProductosPedido = filtrarProductosPedido;
window.seleccionarTodosProductos = seleccionarTodosProductos;
window.finalizarPedido = finalizarPedido;
window.abrirModalProveedorRapido = abrirModalProveedorRapido;
window.guardarProveedorRapido = guardarProveedorRapido;
window.verDetallePedido = verDetallePedido;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.aplicarFiltros = aplicarFiltros;
window.cargarPedidosDeProveedor = cargarPedidosDeProveedor;

console.log('✅ Módulo de pedidos a proveedores cargado completamente');