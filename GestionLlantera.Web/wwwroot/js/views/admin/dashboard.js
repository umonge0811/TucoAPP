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
async function inicializarDashboard() {
    if (dashboardInicializado) {
        console.log('📊 Dashboard ya inicializado, omitiendo...');
        return;
    }

    console.log('📊 Dashboard - Inicializando módulo principal');

    try {
        // Marcar como inicializado para evitar múltiples inicializaciones
        dashboardInicializado = true;

        // Cargar datos iniciales del dashboard
        await Promise.all([
            cargarAlertasStock(),
            cargarInventarioTotal(),
            cargarTopVendedor(),
            cargarUsuariosConectados(),
            cargarNotasRapidas()
        ]);

        // Inicializar eventos de formularios
        inicializarEventosFormularios();

        // Inicializar refresco automático
        inicializarRefrescoAutomatico();

        console.log('✅ Dashboard inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
        dashboardInicializado = false; // Permitir reintentos
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
            const montoFormateado = new Intl.NumberFormat('es-CR', {
                style: 'currency',
                currency: 'CRC'
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
// GESTIÓN DE USUARIOS CONECTADOS
// ========================================

/**
 * 👥 FUNCIÓN: Cargar información de usuarios conectados
 */
async function cargarUsuariosConectados() {
    try {
        console.log('👥 Cargando información de usuarios conectados...');

        const response = await fetch('/Dashboard/ObtenerUsuariosConectados', {
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
            mostrarUsuariosConectados(resultado.data);
            console.log('✅ Usuarios conectados cargados correctamente:', resultado.data);
        } else {
            console.warn('⚠️ No se pudo obtener información de usuarios conectados');
            mostrarErrorUsuariosConectados();
        }
    } catch (error) {
        console.error('❌ Error cargando usuarios conectados:', error);
        mostrarErrorUsuariosConectados();
    }
}

/**
 * 👥 FUNCIÓN: Mostrar información de usuarios conectados
 */
function mostrarUsuariosConectados(data) {
    try {
        console.log('👥 Mostrando datos de usuarios conectados:', data);

        // Actualizar el número en la tarjeta principal
        const valorElement = document.querySelector('.stat-card.pending .stat-value');
        if (valorElement) {
            valorElement.textContent = data.totalUsuarios || 0;
        }

        // Actualizar el botón con información adicional
        const detalleElement = document.querySelector('.stat-card.pending .stat-comparison');
        if (detalleElement) {
            const totalUsuarios = data.totalUsuarios || 0;
            const totalSesiones = data.totalSesiones || 0;

            detalleElement.innerHTML = `
                <button class="btn btn-link p-0 text-decoration-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#usersPanelBottom">
                    ${totalUsuarios > 0 ?
                    `${totalSesiones} sesiones activas` :
                    'No hay usuarios conectados'
                } <i class="bi bi-chevron-right"></i>
                </button>
            `;
        }

        // Actualizar el panel lateral con la lista de usuarios
        actualizarPanelUsuariosConectados(data.usuarios || []);

        // Actualizar el contador del sidebar si la función existe
        if (window.sidebarUsuarios && typeof window.sidebarUsuarios.actualizar === 'function') {
            window.sidebarUsuarios.actualizar(data.totalUsuarios || 0);
        }


        console.log('✅ Usuarios conectados mostrados correctamente');
    } catch (error) {
        console.error('❌ Error mostrando usuarios conectados:', error);
        mostrarErrorUsuariosConectados();
    }
}

/**
 * 👥 FUNCIÓN: Actualizar el panel lateral con usuarios conectados
 */
function actualizarPanelUsuariosConectados(usuarios) {
    try {
        const panelUsuarios = document.querySelector('#usersPanelBottom .connected-users-list');
        if (!panelUsuarios) {
            console.warn('⚠️ Panel de usuarios conectados (bottom) no encontrado');
            return;
        }

        // Limpiar contenido actual
        panelUsuarios.innerHTML = '';

        if (usuarios.length === 0) {
            panelUsuarios.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-person-x fs-1 mb-2 d-block"></i>
                    <p>No hay usuarios conectados</p>
                </div>
            `;
            return;
        }

        // Generar elementos de usuarios
        usuarios.forEach(usuario => {
            const estadoClase = {
                'Activo': 'success',
                'Inactivo': 'warning',
                'Desconectado': 'secondary'
            }[usuario.estado] || 'secondary';

            const iniciales = usuario.nombreUsuario
                ? usuario.nombreUsuario.substring(0, 2).toUpperCase()
                : 'US';

            const tiempoTexto = usuario.tiempoConectadoMinutos <= 30
                ? `Activo hace ${Math.round(usuario.tiempoConectadoMinutos)} min`
                : `${usuario.estado} hace ${Math.round(usuario.tiempoConectadoMinutos)} min`;

            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <div class="user-avatar bg-${estadoClase}">${iniciales}</div>
                <div class="user-info">
                    <div class="user-name">${usuario.nombreUsuario || 'Usuario'}</div>
                    <div class="user-role">
                        <span class="badge bg-${estadoClase}">${usuario.estado}</span>
                        ${usuario.sesionesActivas > 1 ? `<span class="badge bg-info ms-1">${usuario.sesionesActivas} sesiones</span>` : ''}
                    </div>
                    <div class="user-status">${tiempoTexto}</div>
                </div>
            `;

            panelUsuarios.appendChild(userElement);
        });

        console.log('✅ Panel de usuarios conectados (bottom) actualizado');
    } catch (error) {
        console.error('❌ Error actualizando panel de usuarios (bottom):', error);
    }
}

/**
 * 👥 FUNCIÓN: Mostrar error en usuarios conectados
 */
function mostrarErrorUsuariosConectados() {
    try {
        const valorElement = document.querySelector('.stat-card.pending .stat-value');
        if (valorElement) {
            valorElement.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i>';
        }

        const detalleElement = document.querySelector('.stat-card.pending .stat-comparison');
        if (detalleElement) {
            detalleElement.innerHTML = `
                <span class="text-danger">Error al cargar</span>
            `;
        }

        console.log('⚠️ Error mostrado en sección de usuarios conectados');
    } catch (error) {
        console.error('❌ Error mostrando error de usuarios conectados:', error);
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
    document.addEventListener('click', function (e) {
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
async function manejarNuevaNota(e) {
    e.preventDefault();
    console.log('📝 Procesando nueva nota...');

    const form = e.target;
    const titulo = form.querySelector('#noteTitle')?.value || '';
    const contenido = form.querySelector('#noteContent')?.value || '';
    const color = form.querySelector('#noteColor')?.value || '#ffd700';

    if (!titulo.trim()) {
        alert('El título es requerido');
        return;
    }

    if (!contenido.trim()) {
        alert('El contenido es requerido');
        return;
    }

    // Deshabilitar el botón de envío
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando...';

    try {
        const exito = await crearNuevaNota(titulo, contenido, color);
        
        if (exito) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newNoteModal'));
            if (modal) {
                modal.hide();
            }
            
            // Limpiar formulario
            form.reset();
            
            // Mostrar mensaje de éxito
            console.log('✅ Nota creada exitosamente');
        } else {
            alert('Error al crear la nota. Inténtalo de nuevo.');
        }
    } catch (error) {
        console.error('❌ Error en manejarNuevaNota:', error);
        alert('Error al crear la nota. Inténtalo de nuevo.');
    } finally {
        // Rehabilitar el botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
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

    // Refrescar alertas de stock, inventario total, top vendedor y usuarios conectados cada 5 minutos
    setInterval(() => {
        console.log('🔄 Refrescando datos del dashboard automáticamente...');
        cargarAlertasStock();
        cargarInventarioTotal();
        cargarTopVendedor();
        cargarUsuariosConectados();
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

/**
 * Actualizar contador para usar el nuevo panel
 */
function actualizarContadorSidebar(totalUsuarios) {
    try {
        // Buscar el botón del sidebar que muestra usuarios conectados
        const sidebarButton = document.querySelector('.online-users-toggle');
        if (sidebarButton) {
            // Actualizar el texto del botón con el número dinámico
            const iconHtml = '<i class="bi bi-circle-fill text-success me-2"></i>';
            const chevronHtml = '<i class="bi bi-chevron-up"></i>';

            sidebarButton.innerHTML = `
                ${iconHtml}
                Usuarios Conectados (${totalUsuarios})
                ${chevronHtml}
            `;

            // Asegurar que el botón apunte al panel correcto
            sidebarButton.setAttribute('data-bs-target', '#usersPanelBottom');
            sidebarButton.setAttribute('aria-controls', 'usersPanelBottom');

            console.log(`✅ Contador del sidebar actualizado: ${totalUsuarios} usuarios`);
        } else {
            console.warn('⚠️ Botón de usuarios conectados del sidebar no encontrado');
        }
    } catch (error) {
        console.error('❌ Error actualizando contador del sidebar:', error);
    }
}


// ========================================
// EVENTOS DE INICIALIZACIÓN
// ========================================

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Dashboard cargado exitosamente');

    // Configurar event listeners para formularios
    const newNoteForm = document.getElementById('newNoteForm');
    if (newNoteForm) {
        newNoteForm.addEventListener('submit', manejarNuevaNota);
    }

    const newAnnouncementForm = document.getElementById('newAnnouncementForm');
    if (newAnnouncementForm) {
        newAnnouncementForm.addEventListener('submit', manejarNuevoAnuncio);
    }

    // Cargar notas rápidas al inicializar
    cargarNotasRapidas();

    // Aquí se pueden agregar más inicializaciones según sea necesario
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
// GESTIÓN DE NOTAS RÁPIDAS
// ========================================

/**
 * 📝 FUNCIÓN: Cargar notas rápidas del usuario
 */
async function cargarNotasRapidas() {
    try {
        console.log('📝 Cargando notas rápidas...');

        const response = await fetch('/NotasRapidas/ObtenerNotas', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.notas) {
            mostrarNotasRapidas(resultado.notas);
            console.log('✅ Notas rápidas cargadas correctamente:', resultado.notas);
        } else {
            console.warn('⚠️ No se pudieron cargar las notas rápidas');
            mostrarErrorNotasRapidas();
        }
    } catch (error) {
        console.error('❌ Error cargando notas rápidas:', error);
        mostrarErrorNotasRapidas();
    }
}

/**
 * 📝 FUNCIÓN: Mostrar notas rápidas en el dashboard
 */
function mostrarNotasRapidas(notas) {
    try {
        console.log('📝 Mostrando notas rápidas:', notas);

        const container = document.querySelector('#quick-notes-list');
        if (!container) {
            console.warn('⚠️ Contenedor de notas rápidas no encontrado');
            return;
        }

        // Limpiar contenido actual
        container.innerHTML = '';

        if (!notas || notas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-sticky fs-1 mb-2 d-block"></i>
                    <p>No tienes notas rápidas</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="abrirModalNuevaNota()">
                        <i class="bi bi-plus-circle me-1"></i>
                        Crear primera nota
                    </button>
                </div>
            `;
            return;
        }

        // Mostrar solo las primeras 5 notas para el dashboard
        const notasParaMostrar = notas.slice(0, 5);
        
        notasParaMostrar.forEach(nota => {
            const notaElement = document.createElement('div');
            notaElement.className = 'note-item';
            notaElement.setAttribute('data-nota-id', nota.notaId);
            
            const fechaFormateada = new Date(nota.fechaCreacion).toLocaleDateString('es-CR');
            
            notaElement.innerHTML = `
                <div class="note-header d-flex justify-content-between align-items-start">
                    <h6 class="note-title mb-1" style="color: ${nota.color || '#ffd700'}">
                        ${nota.esFavorita ? '<i class="bi bi-star-fill text-warning me-1"></i>' : ''}
                        ${nota.titulo || 'Sin título'}
                    </h6>
                    <div class="note-actions">
                        <button class="btn btn-sm btn-outline-secondary" onclick="editarNota(${nota.notaId})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm ${nota.esFavorita ? 'btn-warning' : 'btn-outline-warning'}" 
                                onclick="toggleFavorita(${nota.notaId}, ${!nota.esFavorita})" title="Favorita">
                            <i class="bi ${nota.esFavorita ? 'bi-star-fill' : 'bi-star'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarNota(${nota.notaId})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="note-content mb-2">${nota.contenido || 'Sin contenido'}</p>
                <small class="note-date text-muted">${fechaFormateada}</small>
            `;

            container.appendChild(notaElement);
        });

        // Agregar botón para ver todas las notas si hay más de 5
        if (notas.length > 5) {
            const verMasElement = document.createElement('div');
            verMasElement.className = 'text-center mt-3';
            verMasElement.innerHTML = `
                <button class="btn btn-outline-primary btn-sm" onclick="verTodasLasNotas()">
                    Ver todas las notas (${notas.length})
                </button>
            `;
            container.appendChild(verMasElement);
        }

        console.log('✅ Notas rápidas mostradas correctamente');
    } catch (error) {
        console.error('❌ Error mostrando notas rápidas:', error);
        mostrarErrorNotasRapidas();
    }
}

/**
 * 📝 FUNCIÓN: Mostrar error en notas rápidas
 */
function mostrarErrorNotasRapidas() {
    try {
        const container = document.querySelector('#quick-notes-list');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-exclamation-triangle text-warning fs-1 mb-2 d-block"></i>
                <p class="text-muted">Error al cargar las notas</p>
                <button class="btn btn-outline-primary btn-sm" onclick="cargarNotasRapidas()">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Reintentar
                </button>
            </div>
        `;

        console.log('⚠️ Error mostrado en sección de notas rápidas');
    } catch (error) {
        console.error('❌ Error mostrando error de notas rápidas:', error);
    }
}

/**
 * 📝 FUNCIÓN: Abrir modal para nueva nota
 */
function abrirModalNuevaNota() {
    const modal = document.getElementById('newNoteModal');
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

/**
 * 📝 FUNCIÓN: Crear nueva nota
 */
async function crearNuevaNota(titulo, contenido, color = '#ffd700') {
    try {
        console.log('📝 Creando nueva nota:', { titulo, contenido, color });

        const response = await fetch('/NotasRapidas/Crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo,
                contenido: contenido,
                color: color
            })
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log('✅ Nota creada exitosamente');
            // Recargar las notas
            await cargarNotasRapidas();
            return true;
        } else {
            console.error('❌ Error creando nota:', resultado.mensaje);
            return false;
        }
    } catch (error) {
        console.error('❌ Error creando nota:', error);
        return false;
    }
}

/**
 * 📝 FUNCIÓN: Editar nota existente
 */
function editarNota(notaId) {
    console.log('📝 Editando nota:', notaId);
    // Esta función se puede expandir para abrir un modal de edición
    alert('Función de editar nota en desarrollo');
}

/**
 * 📝 FUNCIÓN: Toggle favorita
 */
async function toggleFavorita(notaId, esFavorita) {
    try {
        console.log('📝 Cambiando estado favorita:', { notaId, esFavorita });

        const response = await fetch(`/NotasRapidas/CambiarFavorita/${notaId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ esFavorita: esFavorita })
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log('✅ Estado favorita cambiado exitosamente');
            // Recargar las notas
            await cargarNotasRapidas();
        } else {
            console.error('❌ Error cambiando estado favorita:', resultado.mensaje);
        }
    } catch (error) {
        console.error('❌ Error cambiando estado favorita:', error);
    }
}

/**
 * 📝 FUNCIÓN: Eliminar nota
 */
async function eliminarNota(notaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
        return;
    }

    try {
        console.log('📝 Eliminando nota:', notaId);

        const response = await fetch(`/NotasRapidas/Eliminar/${notaId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log('✅ Nota eliminada exitosamente');
            // Recargar las notas
            await cargarNotasRapidas();
        } else {
            console.error('❌ Error eliminando nota:', resultado.mensaje);
        }
    } catch (error) {
        console.error('❌ Error eliminando nota:', error);
    }
}

/**
 * 📝 FUNCIÓN: Ver todas las notas
 */
function verTodasLasNotas() {
    console.log('📝 Redirigiendo a vista completa de notas');
    // Esta función se puede expandir para mostrar todas las notas en un modal o página separada
    alert('Vista completa de notas en desarrollo');
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

// Hacer disponibles las funciones principales globalmente
window.dashboardModule = {
    inicializar: inicializarDashboard,
    recargarAlertas: recargarAlertasStock,
    obtenerEstadisticas: obtenerEstadisticasDashboard,
    cargarNotasRapidas: cargarNotasRapidas,
    crearNuevaNota: crearNuevaNota,
    editarNota: editarNota,
    eliminarNota: eliminarNota,
    toggleFavorita: toggleFavorita
};

console.log('📊 Módulo Dashboard cargado correctamente');