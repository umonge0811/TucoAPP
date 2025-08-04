
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
 * Función para cargar las alertas de stock desde el servidor
 */
async function cargarAlertasStock() {
    try {
        console.log('📊 Cargando alertas de stock...');
        
        // Mostrar loading en el componente
        mostrarCargandoAlertasStock();
        
        const response = await fetch('/Dashboard/ObtenerAlertasStock', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📊 Respuesta recibida:', resultado);

        if (resultado.success) {
            actualizarVistaAlertasStock(resultado.data);
        } else {
            console.error('❌ Error en respuesta:', resultado.message);
            mostrarErrorAlertasStock(resultado.message);
        }

    } catch (error) {
        console.error('❌ Error al cargar alertas de stock:', error);
        mostrarErrorAlertasStock('Error de conexión');
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
 * Mostrar error en la carga de alertas
 */
function mostrarErrorAlertasStock(mensaje = 'Error al cargar') {
    const $valor = $('#alertas-stock-valor');
    const $detalle = $('#alertas-stock-detalle');
    
    if ($valor.length && $detalle.length) {
        $valor.text('--');
        $detalle.html(`<span class="text-muted">${mensaje}</span>`).attr('class', 'stat-comparison text-muted');
    }
    
    console.log('❌ Error mostrado en vista de alertas:', mensaje);
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
    
    // Refrescar alertas de stock cada 5 minutos
    setInterval(() => {
        console.log('🔄 Refrescando alertas de stock automáticamente...');
        cargarAlertasStock();
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
    try {
        console.log('📊 Obteniendo estadísticas del dashboard...');
        
        // Aquí se implementaría la llamada para obtener más estadísticas
        // Por ejemplo: ventas del día, inventario total, etc.
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
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
