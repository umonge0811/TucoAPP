// ================================
// MÓDULO DE SERVICIOS PARA FACTURACIÓN
// ================================

class ServiciosFacturacion {
    constructor() {
        this.serviciosDisponibles = [];
        this.modalServicios = null;
        this.modalAgregarServicio = null;
        this.init();
    }

    init() {
        console.log('🛠️ === INICIALIZANDO MÓDULO SERVICIOS FACTURACIÓN ===');
        this.configurarEventosGlobales();
    }

    configurarEventosGlobales() {
        // Event listener para el botón principal de servicios
        $(document).on('click', '#btnServicios', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🛠️ Botón servicios clickeado desde módulo especializado');
            this.abrirModal();
        });
    }

    async abrirModal() {
        try {
            console.log('🛠️ === ABRIENDO MODAL DE SERVICIOS (MÓDULO ESPECIALIZADO) ===');

            const modalElement = document.getElementById('modalServicios');
            if (!modalElement) {
                throw new Error('Modal de servicios no encontrado en el DOM');
            }

            this.modalServicios = new bootstrap.Modal(modalElement);

            // Configurar evento único para cuando el modal sea visible
            $('#modalServicios').off('shown.bs.modal.serviciosModule').on('shown.bs.modal.serviciosModule', async () => {
                console.log('🛠️ Modal de servicios visible - inicializando contenido');
                await this.inicializarContenidoModal();
            });

            this.modalServicios.show();

        } catch (error) {
            console.error('❌ Error abriendo modal de servicios:', error);
            this.mostrarToast('Error', 'No se pudo abrir el modal de servicios', 'danger');
        }
    }

    async inicializarContenidoModal() {
        try {
            // Cargar tipos de servicios
            await this.cargarTiposServicios();

            // Configurar eventos de filtros
            this.configurarEventosFiltros();

            // Cargar servicios iniciales
            await this.cargarServicios();

        } catch (error) {
            console.error('❌ Error inicializando contenido del modal:', error);
        }
    }

    async cargarTiposServicios() {
        try {
            // Usar la ruta correcta del controlador
            const response = await fetch('/Servicios/ObtenerTipos', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const tipos = await response.json();
            const select = $('#tipoServicioFiltro');

            // Limpiar opciones existentes excepto la primera
            select.find('option:not(:first)').remove();

            // Agregar tipos si la respuesta es exitosa
            if (tipos.success && tipos.data) {
                tipos.data.forEach(tipo => {
                    select.append(`<option value="${tipo}">${tipo}</option>`);
                });
            } else if (Array.isArray(tipos)) {
                tipos.forEach(tipo => {
                    select.append(`<option value="${tipo}">${tipo}</option>`);
                });
            }

        } catch (error) {
            console.error('❌ Error cargando tipos de servicios:', error);
            // No mostrar error al usuario, continuar sin filtros
        }
    }

    configurarEventosFiltros() {
        let timeoutBusqueda = null;

        // Limpiar eventos anteriores con namespace específico
        $('#busquedaServicios').off('input.serviciosFacturacion');
        $('#tipoServicioFiltro, #estadoServicioFiltro').off('change.serviciosFacturacion');

        // Búsqueda con debounce
        $('#busquedaServicios').on('input.serviciosFacturacion', () => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                this.cargarServicios();
            }, 300);
        });

        // Filtros
        $('#tipoServicioFiltro, #estadoServicioFiltro').on('change.serviciosFacturacion', () => {
            this.cargarServicios();
        });
    }

    async cargarServicios() {
        try {
            console.log('🛠️ === CARGANDO SERVICIOS (MÓDULO ESPECIALIZADO) ===');

            // Mostrar loading
            $('#serviciosLoading').show();
            $('#serviciosContent').hide();
            $('#serviciosEmpty').hide();

            // Usar la ruta correcta del controlador
            const response = await fetch('/Servicios/ObtenerServicios', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const resultado = await response.json();
            console.log('🛠️ Servicios obtenidos:', resultado);

            let servicios = [];
            if (resultado.success && resultado.data) {
                servicios = resultado.data;
            } else if (Array.isArray(resultado)) {
                servicios = resultado;
            }

            if (servicios.length > 0) {
                this.serviciosDisponibles = servicios;
                this.mostrarServicios(servicios);
            } else {
                this.mostrarServiciosVacios();
            }

        } catch (error) {
            console.error('❌ Error cargando servicios:', error);
            this.mostrarServiciosVacios();
            this.mostrarToast('Error', 'Error al cargar servicios: ' + error.message, 'danger');
        } finally {
            $('#serviciosLoading').hide();
        }
    }

    mostrarServicios(servicios) {
        console.log('🛠️ Mostrando servicios en tabla:', servicios.length);

        const tbody = $('#serviciosTableBody');
        tbody.empty();

        // Aplicar filtros del frontend
        let serviciosFiltrados = this.aplicarFiltros(servicios);

        serviciosFiltrados.forEach(servicio => {
            const estadoBadge = servicio.estaActivo ?
                '<span class="badge bg-success">Activo</span>' :
                '<span class="badge bg-secondary">Inactivo</span>';

            const fila = `
                <tr data-servicio-id="${servicio.servicioId}" class="servicio-row">
                    <td>
                        <strong class="text-primary">${servicio.nombreServicio}</strong>
                        ${servicio.descripcion ? `<br><small class="text-muted">${servicio.descripcion}</small>` : ''}
                    </td>
                    <td>
                        <span class="badge bg-info">${servicio.tipoServicio || 'General'}</span>
                    </td>
                    <td class="text-end">
                        <strong class="text-success">₡${this.formatearMoneda(servicio.precioBase)}</strong>
                    </td>
                    <td class="text-center">
                        ${estadoBadge}
                    </td>
                    <td class="text-center">
                        ${servicio.estaActivo ? `
                            <button type="button"
                                    class="btn btn-sm btn-success btn-agregar-servicio-modulo"
                                    data-servicio-id="${servicio.servicioId}"
                                    title="Agregar al carrito">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        ` : `
                            <button type="button"
                                    class="btn btn-sm btn-secondary"
                                    disabled
                                    title="Servicio inactivo">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        `}
                    </td>
                </tr>
            `;
            tbody.append(fila);
        });

        // Configurar eventos de los botones con namespace específico
        $('.btn-agregar-servicio-modulo').off('click.serviciosFacturacion').on('click.serviciosFacturacion', (e) => {
            const servicioId = parseInt($(e.currentTarget).data('servicio-id'));
            this.mostrarModalAgregarServicio(servicioId);
        });

        $('#serviciosContent').show();
    }

    aplicarFiltros(servicios) {
        const busqueda = $('#busquedaServicios').val().toLowerCase().trim();
        const tipoServicio = $('#tipoServicioFiltro').val();
        const estadoFiltro = $('#estadoServicioFiltro').val();

        return servicios.filter(servicio => {
            // Filtro por búsqueda
            if (busqueda) {
                const nombre = (servicio.nombreServicio || '').toLowerCase();
                const descripcion = (servicio.descripcion || '').toLowerCase();
                const tipo = (servicio.tipoServicio || '').toLowerCase();

                if (!nombre.includes(busqueda) && !descripcion.includes(busqueda) && !tipo.includes(busqueda)) {
                    return false;
                }
            }

            // Filtro por tipo
            if (tipoServicio && servicio.tipoServicio !== tipoServicio) {
                return false;
            }

            // Filtro por estado
            if (estadoFiltro === 'activos' && !servicio.estaActivo) {
                return false;
            }
            if (estadoFiltro === 'inactivos' && servicio.estaActivo) {
                return false;
            }

            return true;
        });
    }

    mostrarServiciosVacios() {
        $('#serviciosContent').hide();
        $('#serviciosEmpty').show();
    }

    mostrarModalAgregarServicio(servicioId) {
        try {
            console.log('🛠️ === MOSTRANDO MODAL AGREGAR SERVICIO (ID:' + servicioId + ') ===');

            const servicio = this.serviciosDisponibles.find(s => s.servicioId === servicioId);
            if (!servicio) {
                throw new Error('Servicio no encontrado');
            }

            console.log('🛠️ Servicio encontrado:', servicio);

            // Llenar detalles del servicio
            const detalleHtml = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title text-primary">
                            <i class="bi bi-tools me-2"></i>${servicio.nombreServicio}
                        </h5>
                        ${servicio.descripcion ? `
                            <p class="card-text text-muted">${servicio.descripcion}</p>
                        ` : ''}
                        <div class="row">
                            <div class="col-6">
                                <strong>Tipo:</strong><br>
                                <span class="badge bg-info">${servicio.tipoServicio || 'General'}</span>
                            </div>
                            <div class="col-6">
                                <strong>Precio Base:</strong><br>
                                <span class="text-success fs-5 fw-bold">₡${this.formatearMoneda(servicio.precioBase)}</span>
                            </div>
                        </div>
                        ${servicio.observaciones ? `
                            <div class="mt-2">
                                <strong>Observaciones:</strong><br>
                                <small class="text-muted">${servicio.observaciones}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            $('#detalleServicioSeleccionado').html(detalleHtml);

            // Resetear campos
            $('#cantidadServicio').val(1);
            $('#observacionesServicio').val('');

            // Configurar eventos del modal
            this.configurarEventosModalAgregar(servicio);

            // Mostrar modal
            this.modalAgregarServicio = new bootstrap.Modal(document.getElementById('modalAgregarServicio'));
            this.modalAgregarServicio.show();

        } catch (error) {
            console.error('❌ Error mostrando modal agregar servicio:', error);
            this.mostrarToast('Error', 'No se pudo procesar el servicio seleccionado', 'danger');
        }
    }

    configurarEventosModalAgregar(servicio) {
        // Namespace específico para evitar conflictos
        const namespace = 'serviciosFacturacion';

        // Limpiar eventos anteriores
        $(`#btnMenosCantidadServicio`).off(`click.${namespace}`);
        $(`#btnMasCantidadServicio`).off(`click.${namespace}`);
        $(`#cantidadServicio`).off(`input.${namespace}`);
        $(`#btnConfirmarAgregarServicio`).off(`click.${namespace}`);

        // Botones de cantidad
        $(`#btnMenosCantidadServicio`).on(`click.${namespace}`, () => {
            const input = $('#cantidadServicio');
            const valorActual = parseInt(input.val()) || 1;
            if (valorActual > 1) {
                input.val(valorActual - 1);
            }
        });

        $(`#btnMasCantidadServicio`).on(`click.${namespace}`, () => {
            const input = $('#cantidadServicio');
            const valorActual = parseInt(input.val()) || 1;
            if (valorActual < 10) {
                input.val(valorActual + 1);
            }
        });

        // Validación del input
        $(`#cantidadServicio`).on(`input.${namespace}`, function () {
            const valor = parseInt($(this).val()) || 1;
            if (valor < 1) {
                $(this).val(1);
            } else if (valor > 10) {
                $(this).val(10);
            }
        });

        // Confirmar agregar servicio
        $(`#btnConfirmarAgregarServicio`).one(`click.${namespace}`, () => {
            const $boton = $('#btnConfirmarAgregarServicio');
            if ($boton.prop('disabled')) {
                return;
            }

            $boton.prop('disabled', true);
            $boton.html('<span class="spinner-border spinner-border-sm me-2"></span>Agregando...');

            try {
                const cantidad = parseInt($('#cantidadServicio').val()) || 1;
                const observaciones = $('#observacionesServicio').val().trim();
                const precio = servicio.precioBase; // Se usa el precio base

                // Verificar que la función esté disponible globalmente o en el contexto de facturación
                if (typeof window.agregarServicioAVenta === 'function') {
                    window.agregarServicioAVenta(servicio, cantidad, precio);
                    // Cerrar ambos modales
                    const modalAgregarServicio = bootstrap.Modal.getInstance(document.getElementById('modalAgregarServicio'));
                    if (modalAgregarServicio) {
                        modalAgregarServicio.hide();
                    }

                    const modalServicios = bootstrap.Modal.getInstance(document.getElementById('modalServicios'));
                    if (modalServicios) {
                        modalServicios.hide();
                    }
                } else if (typeof agregarServicioAVenta === 'function') {
                    agregarServicioAVenta(servicio, cantidad, precio);
                    // Cerrar ambos modales
                    const modalAgregarServicio = bootstrap.Modal.getInstance(document.getElementById('modalAgregarServicio'));
                    if (modalAgregarServicio) {
                        modalAgregarServicio.hide();
                    }

                    const modalServicios = bootstrap.Modal.getInstance(document.getElementById('modalServicios'));
                    if (modalServicios) {
                        modalServicios.hide();
                    }
                } else {
                    console.error('❌ Función agregarServicioAVenta no disponible');
                    console.log('🔍 Intentando agregar servicio directamente...');

                    // Fallback: agregar servicio directamente
                    if (typeof window.serviciosEnVenta !== 'undefined') {
                        const servicioVenta = {
                            servicioId: servicio.servicioId,
                            nombre: servicio.nombreServicio, // Corrected property name
                            cantidad: cantidad,
                            precio: precio,
                            subtotal: cantidad * precio
                        };

                        window.serviciosEnVenta = window.serviciosEnVenta || [];
                        window.serviciosEnVenta.push(servicioVenta);

                        // Actualizar totales si la función existe
                        if (typeof window.actualizarTotales === 'function') {
                            window.actualizarTotales();
                        }

                        // Cerrar ambos modales
                        const modalAgregarServicio = bootstrap.Modal.getInstance(document.getElementById('modalAgregarServicio'));
                        if (modalAgregarServicio) {
                            modalAgregarServicio.hide();
                        }

                        const modalServicios = bootstrap.Modal.getInstance(document.getElementById('modalServicios'));
                        if (modalServicios) {
                            modalServicios.hide();
                        }
                        console.log('✅ Servicio agregado usando fallback');
                    } else {
                        throw new Error('Función de agregar servicio no disponible');
                    }
                }

                mostrarToast('Servicio agregado', `${servicio.nombreServicio} agregado a la venta`, 'success');

            } catch (error) {
                console.error('❌ Error agregando servicio:', error);
                this.mostrarToast('Error', 'No se pudo agregar el servicio', 'danger');
            } finally {
                $boton.prop('disabled', false);
                $boton.html('<i class="bi bi-cart-plus me-1"></i>Agregar al Carrito');
            }
        });
    }

    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-CR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor || 0);
    }

    mostrarToast(titulo, mensaje, tipo = 'info') {
        // Usar la función de toast del archivo principal si existe
        if (typeof mostrarToast === 'function') {
            mostrarToast(titulo, mensaje, tipo);
        } else {
            console.log(`${tipo.toUpperCase()}: ${titulo} - ${mensaje}`);
        }
    }
}

// ================================
// INICIALIZACIÓN AUTOMÁTICA
// ================================

$(document).ready(function () {
    console.log('🛠️ Inicializando módulo especializado de servicios para facturación');
    window.serviciosFacturacion = new ServiciosFacturacion();
    console.log('✅ Módulo de servicios para facturación inicializado');
});

// ================================
// EXPORTAR PARA USO GLOBAL
// ================================
window.ServiciosFacturacion = ServiciosFacturacion;