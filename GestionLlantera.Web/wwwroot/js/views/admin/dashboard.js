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
 * Inicializar todas las funcionalidades del dashboard
 */
function inicializarDashboard() {
    console.log('🚀 Inicializando dashboard completo...');

    // Cargar datos iniciales
    cargarNotasRapidas();
    cargarAnuncios();
    cargarAlertasStock();
    cargarInventarioTotal();
    cargarTopVendedor();
    cargarUsuariosConectados();

    // Inicializar eventos
    inicializarEventosFormularios();
    inicializarRefrescoAutomatico();

    console.log('✅ Dashboard inicializado correctamente');
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
            // La llamada a eliminarNota ahora se encuentra en mostrarNotasRapidas
        }
    });
}

/**
 * Manejar envío de nueva nota o edición
 */
async function manejarNuevaNota(e) {
    e.preventDefault();

    const form = e.target;
    const notaId = form.getAttribute('data-editing');
    const esEdicion = notaId !== null;

    console.log(esEdicion ? '✏️ Actualizando nota...' : '📝 Creando nueva nota...');

    try {
        const formData = new FormData(form);
        const notaData = {
            titulo: formData.get('titulo'),
            contenido: formData.get('contenido'),
            color: formData.get('color') || '#ffd700',
            esFavorita: false
        };

        console.log('📋 Datos de la nota a enviar:', notaData);

        let url, method;
        if (esEdicion) {
            url = `/NotasRapidas/Actualizar?id=${notaId}`;
            method = 'PUT';
        } else {
            url = '/NotasRapidas/Crear';
            method = 'POST';
        }

        // Obtener el token JWT de las cookies o localStorage si es necesario
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // Si es una actualización, podemos usar credentials include ya que el controlador usa ObtenerTokenJWT()
        const response = await fetch(url, {
            method: method,
            credentials: 'include',
            headers: headers,
            body: JSON.stringify(notaData)
        });

        const data = await response.json();

        if (data.success) {
            console.log(esEdicion ? '✅ Nota actualizada correctamente' : '✅ Nota creada correctamente');

            // Mostrar mensaje de éxito
            await Swal.fire({
                title: '✅ ¡Éxito!',
                text: esEdicion ? 'La nota ha sido actualizada correctamente.' : 'La nota ha sido creada correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newNoteModal'));
            if (modal) {
                modal.hide();
            }

            // Limpiar formulario completamente
            form.reset();
            form.removeAttribute('data-editing');

            // Limpiar campos manualmente para asegurar limpieza completa
            document.getElementById('titulo').value = '';
            document.getElementById('contenido').value = '';
            document.getElementById('color').value = '#ffd700';
            document.getElementById('esFavorita').checked = false;

            // Restaurar título del modal para próximo uso
            const modalElement = document.getElementById('newNoteModal');
            const modalTitle = modalElement ? modalElement.querySelector('.modal-title') : null;
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-sticky-note text-warning me-2"></i>Nueva Nota Rápida';
            }

            // Restaurar texto del botón
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Nota';
            }

            // Recargar notas
            cargarNotasRapidas();
        } else {
            throw new Error(data.message || 'Error al procesar la nota');
        }
    } catch (error) {
        console.error('❌ Error procesando nota:', error);

        await Swal.fire({
            title: '❌ Error',
            text: esEdicion ? 'No se pudo actualizar la nota.' : 'No se pudo crear la nota.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
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
        // También podrías querer refrescar los anuncios si la lista es dinámica
        // cargarAnuncios();
    }, 5 * 60 * 1000); // 5 minutos

    console.log('🔄 Refresco automático configurado (5 minutos)');
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
        cargarAnuncios(); // Agregar carga de anuncios para estadísticas
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
// GESTIÓN DE NOTAS RÁPIDAS
// ========================================

/**
 * 📝 FUNCIÓN: Cargar notas rápidas del usuario actual
 */
async function cargarNotasRapidas() {
    try {
        console.log('📝 Cargando notas rápidas...');

        const response = await fetch('/NotasRapidas/ObtenerMisNotas', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            mostrarNotasRapidas(resultado.data);
            console.log('✅ Notas rápidas cargadas correctamente:', resultado.data);
        } else {
            console.warn('⚠️ No se pudieron obtener las notas rápidas');
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

        const container = document.querySelector('.quick-notes-list, #quick-notes-container, .notes-container');
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
                    <button class="btn btn-sm btn-outline-primary" onclick="abrirModalNuevaNota()">
                        <i class="bi bi-plus"></i> Crear primera nota
                    </button>
                </div>
            `;
            return;
        }

        // Generar elementos de notas
        notas.forEach(nota => {
            const notaElement = document.createElement('div');
            notaElement.className = 'note-item mb-2';
            notaElement.style.backgroundColor = nota.color || '#ffd700';
            notaElement.innerHTML = `
                <div class="note-content">
                    <h6 class="note-title">${nota.titulo || 'Sin título'}</h6>
                    <p class="note-text">${nota.contenido || ''}</p>
                    <small class="note-date text-muted">
                        ${new Date(nota.fechaCreacion).toLocaleDateString()}
                        ${nota.esFavorita ? '<i class="bi bi-star-fill text-warning ms-1"></i>' : ''}
                    </small>
                </div>
                <div class="note-actions">
                        <button class="btn btn-sm btn-link text-primary" onclick="editarNota(${nota.notaId}, '${nota.titulo.replace(/'/g, "\\'")}', '${nota.contenido.replace(/'/g, "\\'")}', '${nota.color}', ${nota.esFavorita ? 'true' : 'false'})" title="Editar nota">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-warning" onclick="marcarFavorita(${nota.notaId}, ${!nota.esFavorita})" title="${nota.esFavorita ? 'Quitar de favoritas' : 'Marcar como favorita'}">
                            <i class="bi ${nota.esFavorita ? 'bi-star-fill' : 'bi-star'}"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-danger" onclick="eliminarNota(${nota.notaId}, '${nota.titulo.replace(/'/g, "\\'")}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
            `;

            container.appendChild(notaElement);
        });

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
        const container = document.querySelector('.quick-notes-list, #quick-notes-container, .notes-container');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-4 text-danger">
                <i class="bi bi-exclamation-triangle fs-1 mb-2 d-block"></i>
                <p>Error al cargar notas</p>
                <button class="btn btn-sm btn-outline-secondary" onclick="cargarNotasRapidas()">
                    <i class="bi bi-arrow-clockwise"></i> Reintentar
                </button>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error mostrando mensaje de error:', error);
    }
}

/**
 * 🗑️ FUNCIÓN: Eliminar nota rápida con SweetAlert
 */
async function eliminarNota(notaId, titulo) {
    try {
        console.log('🗑️ Intentando eliminar nota:', notaId);

        // Mostrar confirmación con SweetAlert
        const resultado = await Swal.fire({
            title: '🗑️ ¿Eliminar nota?',
            html: `
                <div class="text-start">
                    <p><strong>Título:</strong> ${titulo}</p>
                    <div class="alert alert-warning mt-3">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Esta acción no se puede deshacer.
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-trash me-2"></i>Eliminar',
            cancelButtonText: '<i class="bi bi-x-lg me-2"></i>Cancelar',
            reverseButtons: true
        });

        if (!resultado.isConfirmed) {
            console.log('🚫 Usuario canceló la eliminación');
            return;
        }

        // Proceder con la eliminación
        const response = await fetch(`/NotasRapidas/Eliminar?id=${notaId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Nota eliminada correctamente');

            // Mostrar mensaje de éxito
            await Swal.fire({
                title: '✅ ¡Eliminada!',
                text: 'La nota ha sido eliminada correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Recargar notas
            cargarNotasRapidas();
        } else {
            throw new Error(data.message || 'Error al eliminar la nota');
        }

    } catch (error) {
        console.error('❌ Error eliminando nota:', error);

        await Swal.fire({
            title: '❌ Error',
            text: 'No se pudo eliminar la nota. Inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}

/**
 * ⭐ FUNCIÓN: Marcar/desmarcar nota como favorita
 */
async function marcarFavorita(notaId, esFavorita) {
    try {
        console.log('⭐ Cambiando estado favorita:', { notaId, esFavorita });

        const response = await fetch(`/NotasRapidas/CambiarFavorita`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                notaId: notaId,
                esFavorita: esFavorita
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Estado favorita cambiado correctamente');

            // Recargar notas para reflejar el cambio
            cargarNotasRapidas();
        } else {
            throw new Error(data.message || 'Error al cambiar estado favorita');
        }

    } catch (error) {
        console.error('❌ Error cambiando estado favorita:', error);

        await Swal.fire({
            title: '❌ Error',
            text: 'No se pudo cambiar el estado de favorita. Inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}


/**
 * ✏️ FUNCIÓN: Editar nota existente
 */
async function editarNota(notaId, titulo, contenido, color, esFavorita) {
    try {
        console.log('✏️ Editando nota:', { notaId, titulo, contenido, color, esFavorita });

        // Llenar el formulario con los datos existentes
        const modal = document.getElementById('newNoteModal');
        const form = document.getElementById('newNoteForm');

        if (!modal || !form) {
            console.error('❌ Modal o formulario no encontrado');
            return;
        }

        // Cambiar el título del modal
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit text-primary me-2"></i>Editar Nota Rápida';
        }

        // Llenar los campos del formulario
        document.getElementById('titulo').value = titulo || '';
        document.getElementById('contenido').value = contenido || '';
        document.getElementById('color').value = color || '#ffd700';

        // Cambiar el texto del botón
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Nota';
        }

        // Agregar atributo para identificar que es edición
        form.setAttribute('data-editing', notaId);

        // Mostrar el modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        console.log('✅ Modal de edición preparado');
    } catch (error) {
        console.error('❌ Error preparando edición de nota:', error);

        await Swal.fire({
            title: '❌ Error',
            text: 'No se pudo abrir el editor de notas.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}

/**
 * 📝 FUNCIÓN: Abrir modal para nueva nota
 */
function abrirModalNuevaNota() {
    const modal = document.getElementById('newNoteModal');
    const form = document.getElementById('newNoteForm');

    if (modal && form) {
        // Resetear completamente el formulario
        form.reset();
        form.removeAttribute('data-editing');

        // Restaurar título del modal
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-sticky-note text-warning me-2"></i>Nueva Nota Rápida';
        }

        // Restaurar texto del botón
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Nota';
        }

        // Asegurar que los campos estén limpios
        document.getElementById('titulo').value = '';
        document.getElementById('contenido').value = '';
        document.getElementById('color').value = '#ffd700';

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

/**
 * 📢 FUNCIÓN: Abrir modal para nuevo anuncio
 */
function abrirModalNuevoAnuncio() {
    const modal = document.getElementById('newAnnouncementModal');
    const form = document.getElementById('newAnnouncementForm');

    if (modal && form) {
        // Resetear completamente el formulario
        form.reset();
        form.removeAttribute('data-editing-anuncio-id');

        // Restaurar título del modal
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-bullhorn text-primary me-2"></i>Nuevo Anuncio';
        }

        // Restaurar texto del botón
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Anuncio';
        }

        // Asegurar que los campos estén limpios
        const tituloField = form.querySelector('input[name="tituloAnuncio"]');
        const contenidoField = form.querySelector('textarea[name="contenidoAnuncio"]');
        const fechaField = form.querySelector('input[name="fechaExpiracionAnuncio"]');
        
        if (tituloField) tituloField.value = '';
        if (contenidoField) contenidoField.value = '';
        if (fechaField) fechaField.value = '';

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

// ========================================
// GESTIÓN DE ANUNCIOS
// ========================================

/**
 * 📢 FUNCIÓN: Cargar lista de anuncios del sistema
 */
async function cargarAnuncios() {
    try {
        console.log('📢 Cargando anuncios del sistema...');

        const response = await fetch('/Dashboard/ObtenerAnuncios', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();

        if (resultado.success && Array.isArray(resultado.data)) {
            mostrarAnuncios(resultado.data);
            console.log('✅ Anuncios cargados correctamente:', resultado.data);
        } else {
            console.warn('⚠️ No se pudieron obtener los anuncios');
            mostrarErrorAnuncios();
        }
    } catch (error) {
        console.error('❌ Error cargando anuncios:', error);
        mostrarErrorAnuncios();
    }
}

/**
 * 📢 FUNCIÓN: Mostrar lista de anuncios en el dashboard
 */
function mostrarAnuncios(anuncios) {
    try {
        console.log('📢 Mostrando anuncios:', anuncios);

        const container = document.querySelector('.announcements-list, #announcements-container, .anuncios-container');
        if (!container) {
            console.warn('⚠️ Contenedor de anuncios no encontrado');
            return;
        }

        // Limpiar contenido actual
        container.innerHTML = '';

        if (!anuncios || anuncios.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-megaphone fs-1 mb-2 d-block"></i>
                    <p>No hay anuncios importantes</p>
                    <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#newAnnouncementModal">
                        <i class="bi bi-plus"></i> Crear primer anuncio
                    </button>
                </div>
            `;
            return;
        }

        // Generar elementos de anuncios
        anuncios.forEach(anuncio => {
            const anuncioElement = document.createElement('div');
            anuncioElement.className = 'announcement-item mb-3 p-3 border rounded shadow-sm';
            anuncioElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="announcement-title mb-0">${anuncio.titulo || 'Anuncio sin título'}</h6>
                    <small class="announcement-date text-muted">
                        ${new Date(anuncio.fechaCreacion).toLocaleDateString()}
                        ${anuncio.fechaExpiracion ? ` - Expira: ${new Date(anuncio.fechaExpiracion).toLocaleDateString()}` : ''}
                    </small>
                </div>
                <p class="announcement-content mb-2">${anuncio.contenido || ''}</p>
                <div class="announcement-actions text-end">
                    <button class="btn btn-sm btn-outline-secondary" onclick="editarAnuncio(${anuncio.anuncioId})">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarAnuncio(${anuncio.anuncioId}, '${(anuncio.titulo || 'Anuncio sin título').replace(/'/g, "\\'")}')">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            `;
            container.appendChild(anuncioElement);
        });

        console.log('✅ Anuncios mostrados correctamente');
    } catch (error) {
        console.error('❌ Error mostrando anuncios:', error);
        mostrarErrorAnuncios();
    }
}

/**
 * 📢 FUNCIÓN: Mostrar error en anuncios
 */
function mostrarErrorAnuncios() {
    try {
        const container = document.querySelector('.announcements-list');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-4 text-danger">
                <i class="bi bi-exclamation-triangle fs-1 mb-2 d-block"></i>
                <p>Error al cargar anuncios</p>
                <button class="btn btn-sm btn-outline-secondary" onclick="cargarAnuncios()">
                    <i class="bi bi-arrow-clockwise"></i> Reintentar
                </button>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error mostrando mensaje de error de anuncios:', error);
    }
}

/**
 * 🗑️ FUNCIÓN: Eliminar anuncio con SweetAlert
 */
async function eliminarAnuncio(anuncioId, titulo) {
    try {
        console.log('🗑️ Intentando eliminar anuncio:', anuncioId);

        const resultado = await Swal.fire({
            title: '🗑️ ¿Eliminar anuncio?',
            html: `
                <div class="text-start">
                    <p><strong>Título:</strong> ${titulo}</p>
                    <div class="alert alert-warning mt-3">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Esta acción no se puede deshacer.
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-trash me-2"></i>Eliminar',
            cancelButtonText: '<i class="bi bi-x-lg me-2"></i>Cancelar',
            reverseButtons: true
        });

        if (!resultado.isConfirmed) {
            console.log('🚫 Usuario canceló la eliminación del anuncio');
            return;
        }

        const response = await fetch(`/Dashboard/EliminarAnuncio?id=${anuncioId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Anuncio eliminado correctamente');
            await Swal.fire({
                title: '✅ ¡Eliminado!',
                text: 'El anuncio ha sido eliminado correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            cargarAnuncios(); // Recargar la lista de anuncios
        } else {
            throw new Error(data.message || 'Error al eliminar el anuncio');
        }

    } catch (error) {
        console.error('❌ Error eliminando anuncio:', error);
        await Swal.fire({
            title: '❌ Error',
            text: 'No se pudo eliminar el anuncio. Inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}

/**
 * ✏️ FUNCIÓN: Editar anuncio existente
 */
async function editarAnuncio(anuncioId) {
    try {
        console.log('✏️ Editando anuncio con ID:', anuncioId);

        const response = await fetch(`/Dashboard/ObtenerAnuncioPorId?id=${anuncioId}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener anuncio ${anuncioId}: ${response.status}`);
        }

        const resultado = await response.json();

        if (!resultado.success || !resultado.data) {
            throw new Error(resultado.message || 'No se pudieron obtener los datos del anuncio.');
        }

        const anuncio = resultado.data;

        // Llenar el formulario con los datos existentes
        const modal = document.getElementById('newAnnouncementModal');
        const form = document.getElementById('newAnnouncementForm');

        if (!modal || !form) {
            console.error('❌ Modal o formulario no encontrado');
            return;
        }

        // Cambiar el título del modal
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit text-primary me-2"></i>Editar Anuncio';
        }

        // Llenar los campos del formulario
        const tituloField = form.querySelector('input[name="tituloAnuncio"]');
        const contenidoField = form.querySelector('textarea[name="contenidoAnuncio"]');
        const fechaField = form.querySelector('input[name="fechaExpiracionAnuncio"]');

        if (tituloField) tituloField.value = anuncio.titulo || '';
        if (contenidoField) contenidoField.value = anuncio.contenido || '';

        // Formatear fecha para el input type="date"
        if (fechaField && anuncio.fechaVencimiento) {
            const fecha = new Date(anuncio.fechaVencimiento);
            const year = fecha.getFullYear();
            const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
            const day = fecha.getDate().toString().padStart(2, '0');
            fechaField.value = `${year}-${month}-${day}`;
        }

        // Cambiar el texto del botón
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Anuncio';
        }

        // Agregar atributo para identificar que es edición
        form.setAttribute('data-editing-anuncio-id', anuncioId);

        // Mostrar el modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        console.log('✅ Modal de edición preparado');
    } catch (error) {
        console.error('❌ Error preparando edición de anuncio:', error);

        await Swal.fire({
            title: '❌ Error',
            text: 'No se pudo abrir el editor de anuncios.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}

/**
 * 📢 FUNCIÓN: Manejar creación y edición de anuncios
 */
async function manejarNuevoAnuncio(e) {
    e.preventDefault();

    const form = e.target;
    const anuncioId = form.getAttribute('data-editing-anuncio-id');
    const esEdicion = anuncioId !== null && anuncioId !== '';

    console.log(esEdicion ? '✏️ Actualizando anuncio...' : '📢 Creando nuevo anuncio...');

    try {
        const formData = new FormData(form);
        const anuncioData = {
            titulo: formData.get('tituloAnuncio'),
            contenido: formData.get('contenidoAnuncio'),
            fechaVencimiento: formData.get('fechaExpiracionAnuncio') || null,
            tipoAnuncio: 'General',
            prioridad: 'Normal',
            esImportante: false
        };

        console.log('📋 Datos del anuncio a enviar:', anuncioData);

        let url, method;
        if (esEdicion) {
            url = `/Dashboard/ActualizarAnuncio?id=${anuncioId}`;
            method = 'PUT';
        } else {
            url = '/Dashboard/CrearAnuncio';
            method = 'POST';
        }

        // Obtener el token JWT de las cookies o localStorage si es necesario
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // Si es una actualización, podemos usar credentials include ya que el controlador usa ObtenerTokenJWT()
        const response = await fetch(url, {
            method: method,
            credentials: 'include',
            headers: headers,
            body: JSON.stringify(anuncioData)
        });

        const data = await response.json();

        if (data.success) {
            console.log(esEdicion ? '✅ Anuncio actualizado correctamente' : '✅ Anuncio creado correctamente');

            // Mostrar mensaje de éxito
            await Swal.fire({
                title: '✅ ¡Éxito!',
                text: esEdicion ? 'El anuncio ha sido actualizado correctamente.' : 'El anuncio ha sido creado correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newAnnouncementModal'));
            if (modal) {
                modal.hide();
            }

            // Limpiar formulario completamente
            form.reset();
            form.removeAttribute('data-editing-anuncio-id');

            // Limpiar campos manualmente para asegurar limpieza completa
            const tituloField = form.querySelector('input[name="tituloAnuncio"]');
            const contenidoField = form.querySelector('textarea[name="contenidoAnuncio"]');
            const fechaField = form.querySelector('input[name="fechaExpiracionAnuncio"]');
            
            if (tituloField) tituloField.value = '';
            if (contenidoField) contenidoField.value = '';
            if (fechaField) fechaField.value = '';

            // Restaurar título del modal para próximo uso
            const modalElement = document.getElementById('newAnnouncementModal');
            const modalTitle = modalElement ? modalElement.querySelector('.modal-title') : null;
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-bullhorn text-primary me-2"></i>Nuevo Anuncio';
            }

            // Restaurar texto del botón
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Anuncio';
            }

            // Recargar anuncios
            cargarAnuncios();
        } else {
            throw new Error(data.message || 'Error al procesar el anuncio');
        }
    } catch (error) {
        console.error('❌ Error procesando anuncio:', error);

        await Swal.fire({
            title: '❌ Error',
            text: esEdicion ? 'No se pudo actualizar el anuncio.' : 'No se pudo crear el anuncio.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}

// ========================================
// EVENTOS DE INICIALIZACIÓN
// ========================================

// Cargar todas las funcionalidades del dashboard
setTimeout(() => {
    inicializarDashboard();
}, 500);

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

// Hacer disponibles las funciones principales globalmente
window.dashboardModule = {
    inicializar: inicializarDashboard,
    recargarAlertas: recargarAlertasStock,
    obtenerEstadisticas: obtenerEstadisticasDashboard,
    cargarAnuncios: cargarAnuncios // Exportar también la carga de anuncios
};

console.log('📊 Módulo Dashboard cargado correctamente');