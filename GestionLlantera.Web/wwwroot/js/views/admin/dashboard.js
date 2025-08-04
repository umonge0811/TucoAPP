/**
 * ========================================
 * DASHBOARD - MÓDULO JAVASCRIPT
 * ========================================
 * Gestión de funcionalidades del dashboard administrativo
 * Autor: Sistema Gestión Llantera
 * Fecha: 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================
let dashboardInicializado = false;

// ========================================
// INICIALIZACIÓN DEL DASHBOARD
// ========================================

/**
 * Función principal de inicialización del dashboard
 */
function inicializarDashboard() {
    if (dashboardInicializado) {
        console.log('📊 Dashboard ya inicializado, omitiendo...');
        return;
    }

    console.log('📊 Dashboard - Inicializando módulo principal');

    try {
        // Cargar alertas de stock al inicializar
        cargarAlertasStock();
        // Cargar inventario total al inicializar
        cargarInventarioTotal();

        // Inicializar otros componentes del dashboard
        inicializarEventosFormularios();
        inicializarRefrescoAutomatico();

        dashboardInicializado = true;
        console.log('✅ Dashboard inicializado correctamente');

    } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
    }
}

// ========================================
// GESTIÓN DE ALERTAS DE STOCK
// ========================================

/**
 * Cargar alertas de stock desde el backend
 */
async function cargarAlertasStock() {
    try {
        console.log('📊 Cargando alertas de stock...');

        const response = await fetch('/Dashboard/ObtenerAlertasStock', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Respuesta del servidor: ${response.status}`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('✅ Datos de alertas recibidos:', resultado);

        if (resultado.success && resultado.data) {
            actualizarVistaAlertasStock(resultado.data);
        } else {
            mostrarErrorAlertasStock(resultado.message || 'Error al cargar alertas');
        }

    } catch (error) {
        console.error('❌ Error cargando alertas de stock:', error);
        mostrarErrorAlertasStock('Error de conexión al cargar alertas');
    }
}

/**
 * Mostrar estado de carga en las alertas de stock
 */
function mostrarCargandoAlertasStock() {
    const $valor = $('#alertas-stock-valor');
    const $detalle = $('#alertas-stock-detalle');

    if ($valor.length && $detalle.length) {
        $valor.html('<i class="spinner-border spinner-border-sm" role="status"></i>');
        $detalle.html('<span>Cargando...</span>').attr('class', 'stat-comparison text-muted');
    }
}

/**
 * Actualizar la vista con los datos de alertas de stock
 */
function actualizarVistaAlertasStock(data) {
    console.log('📊 Actualizando vista con datos:', data);

    const $valor = $('#alertas-stock-valor');
    const $detalle = $('#alertas-stock-detalle');
    const $card = $('#alertas-stock-card');

    if (!$valor.length || !$detalle.length) {
        console.warn('⚠️ Elementos de alertas de stock no encontrados en el DOM');
        return;
    }

    // Actualizar el valor principal
    $valor.text(data.totalAlertas || 0);

    // Actualizar el detalle y estilos según la cantidad
    if (data.totalAlertas > 0) {
        let mensaje = 'Productos requieren atención';
        let claseDetalle = 'text-warning';

        if (data.productosAgotados > 0) {
            mensaje = `${data.productosAgotados} agotados, ${data.productosCriticos} críticos`;
            claseDetalle = 'text-danger';
        } else if (data.productosCriticos > 0) {
            mensaje = `${data.productosCriticos} productos por agotarse`;
            claseDetalle = 'text-warning';
        }

        $detalle.html(`<span>${mensaje}</span>`).attr('class', `stat-comparison ${claseDetalle}`);

        // Agregar clase de alerta a la card
        if ($card.length) {
            $card.addClass('alert-danger-border');
        }

    } else {
        $detalle.html('<span>Stock en buen estado</span>').attr('class', 'stat-comparison text-success');
        if ($card.length) {
            $card.removeClass('alert-danger-border');
        }
    }

    console.log('✅ Vista de alertas de stock actualizada correctamente');
}

/**
 * Mostrar error en la tarjeta de alertas
 */
function mostrarErrorAlertasStock(mensaje) {
    const valorElement = document.getElementById('alertas-stock-valor');
    const detalleElement = document.getElementById('alertas-stock-detalle');

    if (valorElement) {
        valorElement.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i>';
    }

    if (detalleElement) {
        detalleElement.innerHTML = `<span class="text-danger">${mensaje}</span>`;
    }
}

// ========================================
// GESTIÓN DE INVENTARIO TOTAL
// ========================================

/**
 * Cargar estadísticas de inventario total desde el backend
 */
async function cargarInventarioTotal() {
    try {
        console.log('📊 Cargando estadísticas de inventario total...');

        const response = await fetch('/Dashboard/ObtenerInventarioTotal', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Respuesta del servidor (inventario): ${response.status}`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('✅ Datos de inventario total recibidos:', resultado);

        if (resultado.success && resultado.data) {
            actualizarTarjetaInventarioTotal(resultado.data);
        } else {
            mostrarErrorInventarioTotal(resultado.message || 'Error al cargar inventario total');
        }

    } catch (error) {
        console.error('❌ Error cargando inventario total:', error);
        mostrarErrorInventarioTotal('Error de conexión al cargar inventario');
    }
}

/**
 * Actualizar la tarjeta de inventario total con datos del backend
 */
function actualizarTarjetaInventarioTotal(data) {
    console.log('📊 Actualizando tarjeta de inventario total:', data);

    const valorElement = document.getElementById('inventario-total-valor');
    const detalleElement = document.getElementById('inventario-total-detalle');

    if (valorElement && data.valorTotal !== undefined) {
        // Formatear el valor como moneda costarricense
        const valorFormateado = new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(data.valorTotal);

        valorElement.textContent = valorFormateado;
        console.log('✅ Valor total actualizado:', valorFormateado);
    }

    if (detalleElement && data.totalProductos !== undefined) {
        const productos = data.totalProductos;
        const unidades = data.totalCantidad || 0;

        detalleElement.innerHTML = `<span>${productos} productos (${unidades} unidades)</span>`;
        console.log('✅ Detalle actualizado:', `${productos} productos (${unidades} unidades)`);
    }
}

/**
 * Mostrar error en la tarjeta de inventario total
 */
function mostrarErrorInventarioTotal(mensaje) {
    const valorElement = document.getElementById('inventario-total-valor');
    const detalleElement = document.getElementById('inventario-total-detalle');

    if (valorElement) {
        valorElement.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i>';
    }

    if (detalleElement) {
        detalleElement.innerHTML = `<span class="text-danger">${mensaje}</span>`;
    }
}


// ========================================
// GESTIÓN DE FORMULARIOS
// ========================================

/**
 * Inicializar eventos de formularios del dashboard
 */
function inicializarEventosFormularios() {
    console.log('📊 Inicializando eventos de formularios...');

    // Formulario de nueva nota
    const formNota = document.getElementById('newNoteForm');
    if (formNota) {
        formNota.addEventListener('submit', manejarNuevaNota);
    }

    // Formulario de nuevo anuncio
    const formAnuncio = document.getElementById('newAnnouncementForm');
    if (formAnuncio) {
        formAnuncio.addEventListener('submit', manejarNuevoAnuncio);
    }

    // Botones de acciones de notas
    document.addEventListener('click', function(e) {
        if (e.target.closest('.note-actions .btn-success')) {
            marcarNotaCompletada(e.target.closest('.note-item'));
        } else if (e.target.closest('.note-actions .btn-danger')) {
            eliminarNota(e.target.closest('.note-item'));
        }
    });
}

/**
 * Manejar envío de nueva nota
 */
function manejarNuevaNota(e) {
    e.preventDefault();
    console.log('📝 Creando nueva nota...');

    // Aquí se implementaría la lógica para crear una nueva nota
    // Por ahora solo cerramos el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newNoteModal'));
    if (modal) {
        modal.hide();
    }

    // Limpiar formulario
    e.target.reset();
}

/**
 * Manejar envío de nuevo anuncio
 */
function manejarNuevoAnuncio(e) {
    e.preventDefault();
    console.log('📢 Creando nuevo anuncio...');

    // Aquí se implementaría la lógica para crear un nuevo anuncio
    // Por ahora solo cerramos el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newAnnouncementModal'));
    if (modal) {
        modal.hide();
    }

    // Limpiar formulario
    e.target.reset();
}

/**
 * Marcar nota como completada
 */
function marcarNotaCompletada(noteItem) {
    if (noteItem) {
        noteItem.style.opacity = '0.5';
        noteItem.style.textDecoration = 'line-through';
        console.log('✅ Nota marcada como completada');
    }
}

/**
 * Eliminar nota
 */
function eliminarNota(noteItem) {
    if (noteItem && confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
        noteItem.remove();
        console.log('🗑️ Nota eliminada');
    }
}

// ========================================
// REFRESCO AUTOMÁTICO
// ========================================

/**
 * Inicializar refresco automático de datos
 */
function inicializarRefrescoAutomatico() {
    console.log('🔄 Configurando refresco automático...');

    // Refrescar alertas de stock y inventario total cada 5 minutos
    setInterval(() => {
        console.log('🔄 Refrescando datos del dashboard automáticamente...');
        cargarAlertasStock();
        cargarInventarioTotal();
    }, 5 * 60 * 1000); // 5 minutos
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Recargar manualmente las alertas de stock
 */
function recargarAlertasStock() {
    console.log('🔄 Recarga manual de alertas de stock');
    cargarAlertasStock();
}

/**
 * Obtener estadísticas del dashboard
 */
async function obtenerEstadisticasDashboard() {
    console.log('📊 Obteniendo estadísticas del dashboard...');

    // Esta función podría ser expandida para obtener y mostrar más estadísticas
    // Actualmente, las estadísticas se cargan al inicializar el dashboard y se refrescan periódicamente.
    // Podría agregarse aquí la lógica para refrescar manualmente todas las estadísticas si fuera necesario.
    try {
        // Ejemplo: podrías llamar a cargarAlertasStock() y cargarInventarioTotal() aquí si quisieras un refresco manual forzado.
        // cargarAlertasStock();
        // cargarInventarioTotal();
        console.log('✅ Estadísticas del dashboard (actuales) disponibles.');
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas del dashboard:', error);
    }
}

/**
 * Cargar el top vendedor desde el backend
 */
async function cargarTopVendedor() {
    try {
        console.log('📊 Cargando top vendedor...');

        const response = await fetch('/Dashboard/ObtenerTopVendedor', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Respuesta del servidor (top vendedor): ${response.status}`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('✅ Datos de top vendedor recibidos:', resultado);

        if (resultado.success && resultado.data) {
            actualizarTarjetaTopVendedor(resultado.data);
        } else {
            mostrarErrorTopVendedor(resultado.message || 'Error al cargar top vendedor');
        }

    } catch (error) {
        console.error('❌ Error cargando top vendedor:', error);
        mostrarErrorTopVendedor('Error de conexión al cargar top vendedor');
    }
}

/**
 * Actualizar la tarjeta del top vendedor con datos del backend
 */
function actualizarTarjetaTopVendedor(data) {
    console.log('📊 Actualizando tarjeta de top vendedor:', data);

    const $cardBody = $('#top-vendedor-card .card-body');

    if (!$cardBody.length) {
        console.warn('⚠️ Elemento card-body para top vendedor no encontrado en el DOM');
        return;
    }

    // Limpiar contenido anterior
    $cardBody.empty();

    if (data.length > 0) {
        // Ordenar por monto de facturas (descendente) como criterio principal
        data.sort((a, b) => b.montoFacturas - a.montoFacturas);

        // Generar HTML para cada vendedor en el top
        data.forEach((vendedor, index) => {
            const rankClass = index === 0 ? 'text-primary font-weight-bold' : '';
            const html = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="lead ${rankClass}">${index + 1}. ${vendedor.nombre}</span>
                    <span class="text-muted">${vendedor.montoFacturas.toLocaleString('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
            `;
            $cardBody.append(html);
        });
        console.log('✅ Tarjeta de top vendedor actualizada correctamente');
    } else {
        $cardBody.html('<p class="text-muted">No hay datos de vendedores disponibles.</p>');
        console.log('ℹ️ No se encontraron datos para el top vendedor.');
    }
}

/**
 * Mostrar error en la tarjeta del top vendedor
 */
function mostrarErrorTopVendedor(mensaje) {
    const $cardBody = $('#top-vendedor-card .card-body');

    if ($cardBody.length) {
        $cardBody.html(`<p class="text-danger"><i class="bi bi-exclamation-triangle"></i> ${mensaje}</p>`);
    }
}

// ========================================
// EVENTOS DE INICIALIZACIÓN
// ========================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard cargado, iniciando servicios...');

    // Cargar datos del dashboard
    cargarInventarioTotal();
    cargarAlertasStock();
    cargarTopVendedor();

    console.log('✅ Dashboard inicializado correctamente');
});

/**
 * Inicialización alternativa sin jQuery (funcionalidad básica)
 */
function inicializarDashboardSinJQuery() {
    console.log('📊 Inicializando dashboard sin jQuery (modo básico)');

    // Solo inicializar eventos básicos que no requieren jQuery
    inicializarEventosFormularios();

    console.warn('⚠️ Algunas funcionalidades del dashboard no estarán disponibles sin jQuery');
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

// Hacer disponibles las funciones principales globalmente
window.dashboardModule = {
    inicializar: inicializarDashboard,
    recargarAlertas: recargarAlertasStock,
    obtenerEstadisticas: obtenerEstadisticasDashboard
};

console.log('📊 Módulo Dashboard cargado correctamente');