
// ================================
// MÓDULO DE SERVICIOS PARA FACTURACIÓN
// ================================

let serviciosDisponibles = [];
let servicioSeleccionado = null;

// ================================
// FUNCIONES PRINCIPALES
// ================================

async function abrirModalServicios() {
    console.log('🔧 Abriendo modal de servicios...');
    
    try {
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('modalServicios'));
        modal.show();
        
        // Cargar servicios
        await cargarServiciosDisponibles();
        
    } catch (error) {
        console.error('❌ Error al abrir modal de servicios:', error);
        mostrarNotificacion('Error al abrir modal de servicios', 'error');
    }
}

async function cargarServiciosDisponibles() {
    console.log('📋 Cargando servicios disponibles...');
    
    try {
        // Mostrar loading
        document.getElementById('serviciosLoading').style.display = 'block';
        document.getElementById('serviciosContent').style.display = 'none';
        document.getElementById('serviciosEmpty').style.display = 'none';
        
        const response = await fetch('/Servicios/ObtenerServicios', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            serviciosDisponibles = result.data || [];
            console.log('✅ Servicios cargados:', serviciosDisponibles.length);
            mostrarServiciosEnTabla();
        } else {
            throw new Error(result.message || 'Error al cargar servicios');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar servicios:', error);
        mostrarErrorServicios();
        mostrarNotificacion('Error al cargar servicios: ' + error.message, 'error');
    } finally {
        document.getElementById('serviciosLoading').style.display = 'none';
    }
}

function mostrarServiciosEnTabla() {
    const tbody = document.getElementById('serviciosTableBody');
    
    if (!serviciosDisponibles || serviciosDisponibles.length === 0) {
        document.getElementById('serviciosEmpty').style.display = 'block';
        document.getElementById('serviciosContent').style.display = 'none';
        return;
    }
    
    // Aplicar filtros
    const busqueda = document.getElementById('busquedaServicios')?.value?.toLowerCase() || '';
    const tipoFiltro = document.getElementById('tipoServicioFiltro')?.value || '';
    const estadoFiltro = document.getElementById('estadoServicioFiltro')?.value || '';
    
    let serviciosFiltrados = serviciosDisponibles.filter(servicio => {
        const cumpleBusqueda = !busqueda || 
            servicio.nombreServicio?.toLowerCase().includes(busqueda) ||
            servicio.descripcion?.toLowerCase().includes(busqueda);
            
        const cumpleTipo = !tipoFiltro || servicio.tipoServicio === tipoFiltro;
        
        const cumpleEstado = !estadoFiltro || 
            (estadoFiltro === 'activos' && servicio.estaActivo) ||
            (estadoFiltro === 'inactivos' && !servicio.estaActivo);
            
        return cumpleBusqueda && cumpleTipo && cumpleEstado;
    });
    
    tbody.innerHTML = '';
    
    serviciosFiltrados.forEach(servicio => {
        const row = crearFilaServicio(servicio);
        tbody.appendChild(row);
    });
    
    document.getElementById('serviciosContent').style.display = 'block';
    document.getElementById('serviciosEmpty').style.display = 'none';
}

function crearFilaServicio(servicio) {
    const row = document.createElement('tr');
    
    const estadoBadge = servicio.estaActivo 
        ? '<span class="badge bg-success">Activo</span>'
        : '<span class="badge bg-danger">Inactivo</span>';
    
    const precioFormateado = typeof servicio.precioBase === 'number' 
        ? `₡${servicio.precioBase.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`
        : '₡0.00';
    
    row.innerHTML = `
        <td>
            <strong>${servicio.nombreServicio || 'Sin nombre'}</strong>
            ${servicio.descripcion ? `<br><small class="text-muted">${servicio.descripcion}</small>` : ''}
        </td>
        <td class="text-center">
            <span class="badge bg-info">${servicio.tipoServicio || 'General'}</span>
        </td>
        <td class="text-end">
            <strong class="text-primary">${precioFormateado}</strong>
        </td>
        <td class="text-center">
            ${estadoBadge}
        </td>
        <td class="text-center">
            ${servicio.estaActivo ? `
                <button type="button" 
                        class="btn btn-success btn-sm" 
                        onclick="seleccionarServicio(${servicio.servicioId || servicio.id})"
                        title="Agregar al carrito">
                    <i class="bi bi-cart-plus me-1"></i>Agregar
                </button>
            ` : `
                <button type="button" class="btn btn-secondary btn-sm" disabled>
                    <i class="bi bi-ban me-1"></i>No disponible
                </button>
            `}
        </td>
    `;
    
    return row;
}

async function seleccionarServicio(servicioId) {
    console.log('🎯 Seleccionando servicio:', servicioId);
    
    try {
        const response = await fetch(`/Servicios/ObtenerServicioPorId?id=${servicioId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            servicioSeleccionado = result.data;
            mostrarModalAgregarServicio();
        } else {
            throw new Error(result.message || 'Error al obtener datos del servicio');
        }
        
    } catch (error) {
        console.error('❌ Error al seleccionar servicio:', error);
        mostrarNotificacion('Error al seleccionar servicio: ' + error.message, 'error');
    }
}

function mostrarModalAgregarServicio() {
    if (!servicioSeleccionado) {
        console.error('❌ No hay servicio seleccionado');
        return;
    }
    
    console.log('📝 Mostrando modal agregar servicio:', servicioSeleccionado);
    
    const precioFormateado = typeof servicioSeleccionado.precioBase === 'number' 
        ? `₡${servicioSeleccionado.precioBase.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`
        : '₡0.00';
    
    document.getElementById('detalleServicioSeleccionado').innerHTML = `
        <div class="card bg-light">
            <div class="card-body">
                <h6 class="card-title mb-2">
                    <i class="bi bi-tools me-2"></i>${servicioSeleccionado.nombreServicio}
                </h6>
                <p class="card-text mb-2">
                    <strong>Tipo:</strong> ${servicioSeleccionado.tipoServicio || 'General'}<br>
                    <strong>Precio base:</strong> <span class="text-primary fw-bold">${precioFormateado}</span>
                </p>
                ${servicioSeleccionado.descripcion ? `
                    <p class="card-text">
                        <strong>Descripción:</strong><br>
                        <small class="text-muted">${servicioSeleccionado.descripcion}</small>
                    </p>
                ` : ''}
            </div>
        </div>
    `;
    
    // Resetear campos
    document.getElementById('cantidadServicio').value = 1;
    document.getElementById('observacionesServicio').value = '';
    
    // Cerrar modal de servicios y abrir modal de agregar
    bootstrap.Modal.getInstance(document.getElementById('modalServicios')).hide();
    
    const modalAgregar = new bootstrap.Modal(document.getElementById('modalAgregarServicio'));
    modalAgregar.show();
}

function confirmarAgregarServicio() {
    if (!servicioSeleccionado) {
        console.error('❌ No hay servicio seleccionado');
        return;
    }
    
    const cantidad = parseInt(document.getElementById('cantidadServicio').value) || 1;
    const observaciones = document.getElementById('observacionesServicio').value.trim();
    
    console.log('✅ Agregando servicio al carrito:', {
        servicio: servicioSeleccionado,
        cantidad: cantidad,
        observaciones: observaciones
    });
    
    // Agregar al carrito (usando la función existente de facturación)
    if (typeof agregarServicioAVenta === 'function') {
        agregarServicioAVenta(servicioSeleccionado, cantidad, observaciones);
    } else {
        console.error('❌ Función agregarServicioAVenta no disponible');
        mostrarNotificacion('Error: función de agregar servicio no disponible', 'error');
    }
    
    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('modalAgregarServicio')).hide();
    
    // Limpiar selección
    servicioSeleccionado = null;
}

function mostrarErrorServicios() {
    document.getElementById('serviciosContent').style.display = 'none';
    document.getElementById('serviciosEmpty').style.display = 'block';
}

// ================================
// EVENTOS
// ================================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar filtros
    const busquedaInput = document.getElementById('busquedaServicios');
    const tipoSelect = document.getElementById('tipoServicioFiltro');
    const estadoSelect = document.getElementById('estadoServicioFiltro');
    
    if (busquedaInput) {
        busquedaInput.addEventListener('input', () => {
            clearTimeout(busquedaInput.timeout);
            busquedaInput.timeout = setTimeout(mostrarServiciosEnTabla, 300);
        });
    }
    
    if (tipoSelect) {
        tipoSelect.addEventListener('change', mostrarServiciosEnTabla);
    }
    
    if (estadoSelect) {
        estadoSelect.addEventListener('change', mostrarServiciosEnTabla);
    }
    
    // Configurar botones de cantidad
    const btnMenos = document.getElementById('btnMenosCantidadServicio');
    const btnMas = document.getElementById('btnMasCantidadServicio');
    const inputCantidad = document.getElementById('cantidadServicio');
    
    if (btnMenos && inputCantidad) {
        btnMenos.addEventListener('click', () => {
            const valor = parseInt(inputCantidad.value) || 1;
            if (valor > 1) {
                inputCantidad.value = valor - 1;
            }
        });
    }
    
    if (btnMas && inputCantidad) {
        btnMas.addEventListener('click', () => {
            const valor = parseInt(inputCantidad.value) || 1;
            const max = parseInt(inputCantidad.getAttribute('max')) || 10;
            if (valor < max) {
                inputCantidad.value = valor + 1;
            }
        });
    }
    
    // Configurar botón confirmar
    const btnConfirmar = document.getElementById('btnConfirmarAgregarServicio');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarAgregarServicio);
    }
});

// ================================
// EXPORTAR FUNCIONES GLOBALMENTE
// ================================

window.abrirModalServicios = abrirModalServicios;
window.cargarServiciosDisponibles = cargarServiciosDisponibles;
window.seleccionarServicio = seleccionarServicio;
window.confirmarAgregarServicio = confirmarAgregarServicio;

console.log('🔧 Módulo de servicios para facturación cargado correctamente');
