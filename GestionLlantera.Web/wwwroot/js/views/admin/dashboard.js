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
        // Cargar datos iniciales del dashboard
        await Promise.all([
            cargarAlertasStock(),
            cargarInventarioTotal(),
            cargarTopVendedor()
        ]);
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
        mostrarErrorInventarioTotal();
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
        console.log('✅ Detalle actualizado:', `${productos} (${unidades} unidades)`);
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

/**
 * 🏆 FUNCIÓN: Cargar información del top vendedor
 */
async function cargarTopVendedor() {
    try {
        console.log('🏆 Cargando información del top vendedor...');

        const response = await fetch('/Dashboard/ObtenerTopVendedor', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            mostrarTopVendedor(resultado.data);
            console.log('✅ Top vendedor cargado correctamente:', resultado.data);
        } else {
            console.warn('⚠️ No se pudo obtener información del top vendedor');
            mostrarErrorTopVendedor();
        }
    } catch (error) {
        console.error('❌ Error cargando top vendedor:', error);
        mostrarErrorTopVendedor();
    }
}

/**
 * 🏆 FUNCIÓN: Mostrar información del top vendedor
 */
function mostrarTopVendedor(data) {
    try {
        console.log('🏆 Mostrando datos del top vendedor:', data);

        // Buscar el contenedor del top vendedor
        const container = document.querySelector('[data-section="top-vendedor"]');
        if (!container) {
            console.warn('⚠️ Contenedor de top vendedor no encontrado');
            return;
        }

        // Actualizar nombre del vendedor
        const nombreElement = container.querySelector('.stat-value');
        if (nombreElement) {
            nombreElement.textContent = data.vendedor || 'No disponible';
        }

        // Actualizar información adicional
        const detalleElement = container.querySelector('.stat-comparison');
        if (detalleElement) {
            const totalVentas = data.totalVentas || 0;
            const montoTotal = data.montoTotal || 0;

            // Formatear monto
            const montoFormateado = new Intl.NumberFormat('es-HN', {
                style: 'currency',
                currency: 'HNL'
            }).format(montoTotal);

            detalleElement.innerHTML = `
                <i class="fas fa-trophy text-warning me-1"></i>
                ${totalVentas} ventas • ${montoFormateado}
            `;
        }

        // Agregar clase de éxito
        container.classList.remove('error');
        container.classList.add('loaded');

        console.log('✅ Top vendedor mostrado correctamente');
    } catch (error) {
        console.error('❌ Error mostrando top vendedor:', error);
        mostrarErrorTopVendedor();
    }
}

/**
 * 🏆 FUNCIÓN: Mostrar error en top vendedor
 */
function mostrarErrorTopVendedor() {
    try {
        const container = document.querySelector('[data-section="top-vendedor"]');
        if (!container) return;

        // Mostrar mensaje de error
        const nombreElement = container.querySelector('.stat-value');
        if (nombreElement) {
            nombreElement.textContent = 'Error al cargar';
        }

        const detalleElement = container.querySelector('.stat-comparison');
        if (detalleElement) {
            detalleElement.innerHTML = `
                <i class="fas fa-exclamation-triangle text-warning me-1"></i>
                No se pudo cargar la información
            `;
        }

        // Agregar clase de error
        container.classList.remove('loaded');
        container.classList.add('error');

        console.log('⚠️ Error mostrado en sección de top vendedor');
    } catch (error) {
        console.error('❌ Error mostrando error de top vendedor:', error);
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

    // Refrescar alertas de stock, inventario total y top vendedor cada 5 minutos
    setInterval(() => {
        console.log('🔄 Refrescando datos del dashboard automáticamente...');
        cargarAlertasStock();
        cargarInventarioTotal();
        cargarTopVendedor();
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
        // Ejemplo: podrías llamar a cargarAlertasStock(), cargarInventarioTotal() y cargarTopVendedor() aquí si quisieras un refresco manual forzado.
        cargarAlertasStock();
        cargarInventarioTotal();
        cargarTopVendedor();
        console.log('✅ Estadísticas del dashboard (actuales) disponibles.');
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas del dashboard:', error);
    }
}

// ========================================
// EVENTOS DE INICIALIZACIÓN
// ========================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 DOM cargado, verificando disponibilidad de jQuery...');

    // Verificar si jQuery está disponible
    if (typeof $ === 'undefined') {
        console.log('⏳ Esperando a que jQuery se cargue...');

        // Intentar nuevamente después de un pequeño delay
        setTimeout(function() {
            if (typeof $ !== 'undefined') {
                inicializarDashboard();
            } else {
                console.error('❌ jQuery no disponible después de esperar');
                // Intentar inicializar sin jQuery (funcionalidad limitada)
                inicializarDashboardSinJQuery();
            }
        }, 500);
    } else {
        inicializarDashboard();
    }
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