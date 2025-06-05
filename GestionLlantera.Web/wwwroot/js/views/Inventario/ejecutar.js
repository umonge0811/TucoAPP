// ========================================
// JAVASCRIPT PARA TOMA DE INVENTARIO
// Ubicación: GestionLlantera.Web/wwwroot/js/views/toma-inventario/ejecutar.js
// ========================================

/**
 * 🎯 MÓDULO PRINCIPAL PARA TOMA DE INVENTARIO
 * 
 * FUNCIONALIDADES:
 * - Carga y visualización de productos
 * - Búsqueda y filtros en tiempo real
 * - Registro de conteos
 * - Actualización de progreso
 * - Vista adaptativa (móvil/escritorio)
 */

class TomaInventarioManager {
    constructor() {
        // 🔧 Configuración inicial
        this.inventarioId = window.inventarioConfig?.inventarioId || 0;
        this.usuarioId = window.inventarioConfig?.usuarioId || 0;
        this.permisos = window.inventarioConfig?.permisos || {};

        // 📊 Estado de la aplicación
        this.productos = [];
        this.productosFiltrados = [];
        this.estadisticas = {};
        this.vistaActual = 'lista'; // 'lista' o 'tarjetas'
        this.filtrosActivos = {
            busqueda: '',
            estado: '',
            tipo: ''
        };

        // 🎮 Referencias DOM
        this.elementos = {
            // Progreso
            barraProgreso: document.getElementById('barraProgreso'),
            porcentajeProgreso: document.getElementById('porcentajeProgreso'),
            totalProductos: document.getElementById('totalProductos'),
            productosContados: document.getElementById('productosContados'),
            productosPendientes: document.getElementById('productosPendientes'),
            discrepancias: document.getElementById('discrepancias'),

            // Búsqueda y filtros
            busquedaRapida: document.getElementById('busquedaRapida'),
            filtroEstado: document.getElementById('filtroEstado'),
            filtroTipo: document.getElementById('filtroTipo'),
            btnBuscar: document.getElementById('btnBuscar'),
            btnLimpiarBusqueda: document.getElementById('btnLimpiarBusqueda'),

            // Vistas
            btnVistaLista: document.getElementById('btnVistaLista'),
            btnVistaTarjetas: document.getElementById('btnVistaTarjetas'),
            productosLista: document.getElementById('productosLista'),
            productosTarjetas: document.getElementById('productosTarjetas'),
            tablaProductosBody: document.getElementById('tablaProductosBody'),
            contenedorTarjetas: document.getElementById('contenedorTarjetas'),

            // Estados
            loadingProductos: document.getElementById('loadingProductos'),
            estadoVacio: document.getElementById('estadoVacio'),
            contadorProductosMostrados: document.getElementById('contadorProductosMostrados'),

            // Botones de acción
            btnActualizarProgreso: document.getElementById('btnActualizarProgreso'),
            btnMostrarTodos: document.getElementById('btnMostrarTodos'),
            btnSoloPendientes: document.getElementById('btnSoloPendientes'),
            btnSoloDiscrepancias: document.getElementById('btnSoloDiscrepancias'),
            btnLimpiarFiltros: document.getElementById('btnLimpiarFiltros')
        };

        // 🎭 Modal de conteo
        this.conteoModal = new bootstrap.Modal(document.getElementById('conteoModal'));
        this.productoSeleccionado = null;

        // 🏃‍♂️ Inicializar
        this.init();
    }

    // =====================================
    // 🚀 INICIALIZACIÓN
    // =====================================

    async init() {
        console.log('🚀 Inicializando Toma de Inventario Manager');
        console.log('📋 Configuración:', {
            inventarioId: this.inventarioId,
            usuarioId: this.usuarioId,
            permisos: this.permisos
        });

        try {
            // Configurar eventos
            this.configurarEventos();

            // Configurar vista inicial
            this.configurarVistaInicial();

            // Cargar datos iniciales
            await this.cargarProductos();
            await this.actualizarProgreso();

            // Configurar actualización automática cada 30 segundos
            setInterval(() => this.actualizarProgreso(), 30000);

            console.log('✅ Toma de Inventario Manager inicializado correctamente');

        } catch (error) {
            console.error('💥 Error al inicializar:', error);
            this.mostrarError('Error al cargar la interfaz de toma de inventario');
        }
    }

    configurarEventos() {
        // 🔍 Búsqueda y filtros
        this.elementos.busquedaRapida?.addEventListener('input', (e) => {
            this.filtrosActivos.busqueda = e.target.value.trim();
            this.debounce(() => this.aplicarFiltros(), 300);
        });

        this.elementos.filtroEstado?.addEventListener('change', (e) => {
            this.filtrosActivos.estado = e.target.value;
            this.aplicarFiltros();
        });

        this.elementos.filtroTipo?.addEventListener('change', (e) => {
            this.filtrosActivos.tipo = e.target.value;
            this.aplicarFiltros();
        });

        this.elementos.btnBuscar?.addEventListener('click', () => {
            this.buscarProductoEspecifico();
        });

        this.elementos.btnLimpiarBusqueda?.addEventListener('click', () => {
            this.limpiarBusqueda();
        });

        // 🎮 Botones de vista
        this.elementos.btnVistaLista?.addEventListener('click', () => {
            this.cambiarVista('lista');
        });

        this.elementos.btnVistaTarjetas?.addEventListener('click', () => {
            this.cambiarVista('tarjetas');
        });

        // 📊 Botones de progreso
        this.elementos.btnActualizarProgreso?.addEventListener('click', () => {
            this.actualizarProgreso();
        });

        // 🎯 Botones de acción rápida
        this.elementos.btnMostrarTodos?.addEventListener('click', () => {
            this.limpiarFiltros();
        });

        this.elementos.btnSoloPendientes?.addEventListener('click', () => {
            this.aplicarFiltroRapido('pendiente');
        });

        this.elementos.btnSoloDiscrepancias?.addEventListener('click', () => {
            this.aplicarFiltroRapido('discrepancia');
        });

        this.elementos.btnLimpiarFiltros?.addEventListener('click', () => {
            this.limpiarFiltros();
        });

        // 🎭 Modal de conteo
        this.configurarModalConteo();

        // 📱 Eventos para móvil
        this.configurarEventosMovil();
    }

    configurarVistaInicial() {
        // Detectar si es móvil para vista inicial
        const esMobile = window.innerWidth <= 768;
        this.cambiarVista(esMobile ? 'tarjetas' : 'lista');
    }

    // =====================================
    // 📊 CARGA Y GESTIÓN DE DATOS
    // =====================================

    async cargarProductos() {
        try {
            console.log('📋 Cargando productos del inventario...');
            this.mostrarLoading(true);

            const response = await fetch(`/TomaInventario/ObtenerProductos/${this.inventarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.productos = data.productos || [];
                this.estadisticas = data.estadisticas || {};
                this.productosFiltrados = [...this.productos];

                console.log(`✅ Cargados ${this.productos.length} productos`);

                this.renderizarProductos();
                this.actualizarContadores();
                this.mostrarLoading(false);

            } else {
                throw new Error(data.message || 'Error al cargar productos');
            }

        } catch (error) {
            console.error('💥 Error cargando productos:', error);
            this.mostrarError('Error al cargar los productos del inventario');
            this.mostrarLoading(false);
        }
    }

    async actualizarProgreso() {
        try {
            const response = await fetch(`/TomaInventario/ObtenerProgreso/${this.inventarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                console.warn('No se pudo actualizar el progreso');
                return;
            }

            const data = await response.json();

            if (data.success && data.progreso) {
                this.actualizarInterfazProgreso(data.progreso);
            }

        } catch (error) {
            console.warn('Error actualizando progreso:', error);
        }
    }

    actualizarInterfazProgreso(progreso) {
        // Actualizar barra de progreso
        const porcentaje = progreso.porcentajeProgreso || 0;

        if (this.elementos.barraProgreso) {
            this.elementos.barraProgreso.style.width = `${porcentaje}%`;
            this.elementos.barraProgreso.setAttribute('aria-valuenow', porcentaje);
        }

        if (this.elementos.porcentajeProgreso) {
            this.elementos.porcentajeProgreso.textContent = `${porcentaje}%`;
        }

        // Actualizar estadísticas
        if (this.elementos.totalProductos) {
            this.elementos.totalProductos.textContent = progreso.totalProductos || 0;
        }

        if (this.elementos.productosContados) {
            this.elementos.productosContados.textContent = progreso.productosContados || 0;
        }

        if (this.elementos.productosPendientes) {
            this.elementos.productosPendientes.textContent = progreso.productosPendientes || 0;
        }

        if (this.elementos.discrepancias) {
            this.elementos.discrepancias.textContent = progreso.totalDiscrepancias || 0;
        }

        // Cambiar color de barra según progreso
        if (this.elementos.barraProgreso) {
            this.elementos.barraProgreso.className = 'progress-bar progress-bar-striped progress-bar-animated';

            if (porcentaje === 100) {
                this.elementos.barraProgreso.classList.add('bg-success');
            } else if (porcentaje >= 75) {
                this.elementos.barraProgreso.classList.add('bg-info');
            } else if (porcentaje >= 50) {
                this.elementos.barraProgreso.classList.add('bg-warning');
            } else {
                this.elementos.barraProgreso.classList.add('bg-primary');
            }
        }
    }

    // =====================================
    // 🎨 RENDERIZADO DE PRODUCTOS
    // =====================================

    renderizarProductos() {
        if (this.vistaActual === 'lista') {
            this.renderizarVistaLista();
        } else {
            this.renderizarVistaTarjetas();
        }

        this.actualizarContadores();
    }

    renderizarVistaLista() {
        if (!this.elementos.tablaProductosBody) return;

        const tbody = this.elementos.tablaProductosBody;
        tbody.innerHTML = '';

        if (this.productosFiltrados.length === 0) {
            this.mostrarEstadoVacio();
            return;
        }

        this.productosFiltrados.forEach(producto => {
            const fila = this.crearFilaProducto(producto);
            tbody.appendChild(fila);
        });

        this.mostrarVista('lista');
    }

    renderizarVistaTarjetas() {
        if (!this.elementos.contenedorTarjetas) return;

        const contenedor = this.elementos.contenedorTarjetas;
        contenedor.innerHTML = '';

        if (this.productosFiltrados.length === 0) {
            this.mostrarEstadoVacio();
            return;
        }

        this.productosFiltrados.forEach(producto => {
            const tarjeta = this.crearTarjetaProducto(producto);
            contenedor.appendChild(tarjeta);
        });

        this.mostrarVista('tarjetas');
    }

    crearFilaProducto(producto) {
        const fila = document.createElement('tr');

        // Clase según estado
        if (producto.tieneDiscrepancia) {
            fila.classList.add('table-warning');
        } else if (producto.estadoConteo === 'Contado') {
            fila.classList.add('table-success');
        }

        fila.innerHTML = `
            <td>${producto.productoId}</td>
            <td>
                <div class="producto-imagen-mini">
                    ${producto.imagenUrl ?
                `<img src="${producto.imagenUrl}" alt="${producto.nombreProducto}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` :
                `<div class="sin-imagen-placeholder" style="width: 40px; height: 40px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: center;"><i class="bi bi-image text-muted"></i></div>`
            }
                </div>
            </td>
            <td>
                <div>
                    <strong>${producto.nombreProducto}</strong>
                    ${producto.descripcionProducto ? `<div class="small text-muted">${producto.descripcionProducto}</div>` : ''}
                    ${producto.esLlanta ? '<span class="badge bg-primary">Llanta</span>' : ''}
                </div>
            </td>
            <td class="text-center">
                <span class="badge ${this.getClaseEstado(producto.estadoConteo)}">
                    ${this.getTextoEstado(producto.estadoConteo)}
                </span>
            </td>
            <td class="text-center">
                <span class="fs-6">${producto.cantidadSistema}</span>
            </td>
            <td class="text-center">
                ${producto.cantidadFisica !== null ?
                `<span class="fs-6 fw-bold text-success">${producto.cantidadFisica}</span>` :
                '<span class="text-muted">-</span>'
            }
                ${producto.tieneDiscrepancia ?
                `<div class="small text-danger"><i class="bi bi-exclamation-triangle-fill"></i> Diferencia: ${producto.diferencia || 0}</div>` :
                ''
            }
            </td>
            <td>
                <div class="btn-group">
                    <button type="button" 
                            class="btn btn-sm btn-primary contar-btn" 
                            data-producto-id="${producto.productoId}"
                            ${!this.permisos.puedeContar ? 'disabled' : ''}>
                        <i class="bi bi-123"></i>
                        ${producto.estadoConteo === 'Contado' ? 'Recontar' : 'Contar'}
                    </button>
                </div>
            </td>
        `;

        // Configurar evento del botón contar
        const btnContar = fila.querySelector('.contar-btn');
        btnContar?.addEventListener('click', () => {
            this.abrirModalConteo(producto);
        });

        return fila;
    }

    crearTarjetaProducto(producto) {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';

        const claseEstado = producto.tieneDiscrepancia ? 'border-warning' :
            producto.estadoConteo === 'Contado' ? 'border-success' : 'border-light';

        col.innerHTML = `
            <div class="card h-100 ${claseEstado}" style="transition: transform 0.2s ease;">
                <div class="card-body p-3">
                    <!-- Imagen del producto -->
                    <div class="text-center mb-3">
                        ${producto.imagenUrl ?
                `<img src="${producto.imagenUrl}" alt="${producto.nombreProducto}" class="img-fluid rounded" style="max-height: 100px; object-fit: cover;">` :
                `<div class="sin-imagen-placeholder bg-light rounded d-flex align-items-center justify-content-center" style="height: 100px;"><i class="bi bi-image text-muted" style="font-size: 2rem;"></i></div>`
            }
                    </div>
                    
                    <!-- Información del producto -->
                    <h6 class="card-title text-truncate" title="${producto.nombreProducto}">
                        ${producto.nombreProducto}
                    </h6>
                    
                    <div class="mb-2">
                        <small class="text-muted">ID: ${producto.productoId}</small>
                        ${producto.esLlanta ? '<span class="badge bg-primary ms-2">Llanta</span>' : ''}
                    </div>
                    
                    <!-- Estado del conteo -->
                    <div class="text-center mb-3">
                        <span class="badge ${this.getClaseEstado(producto.estadoConteo)} w-100 py-2">
                            ${this.getTextoEstado(producto.estadoConteo)}
                        </span>
                    </div>
                    
                    <!-- Cantidades -->
                    <div class="row text-center mb-3">
                        <div class="col-6">
                            <div class="border-end">
                                <div class="h6 mb-1">${producto.cantidadSistema}</div>
                                <small class="text-muted">Sistema</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="h6 mb-1 ${producto.cantidadFisica !== null ? 'text-success' : 'text-muted'}">
                                ${producto.cantidadFisica !== null ? producto.cantidadFisica : '-'}
                            </div>
                            <small class="text-muted">Físico</small>
                        </div>
                    </div>
                    
                    <!-- Discrepancia si existe -->
                    ${producto.tieneDiscrepancia ?
                `<div class="alert alert-warning py-2 mb-3">
                            <small><i class="bi bi-exclamation-triangle-fill"></i> Diferencia: ${producto.diferencia || 0}</small>
                        </div>` : ''
            }
                    
                    <!-- Información de llanta si aplica -->
                    ${producto.esLlanta && (producto.medidasLlanta || producto.marcaLlanta) ?
                `<div class="card bg-light mb-3 p-2">
                            <small class="text-muted">
                                ${producto.medidasLlanta ? `<div><strong>Medidas:</strong> ${producto.medidasLlanta}</div>` : ''}
                                ${producto.marcaLlanta ? `<div><strong>Marca:</strong> ${producto.marcaLlanta}</div>` : ''}
                            </small>
                        </div>` : ''
            }
                </div>
                
                <!-- Footer con botón de acción -->
                <div class="card-footer bg-transparent border-0 pt-0">
                    <button type="button" 
                            class="btn btn-primary w-100 contar-btn" 
                            data-producto-id="${producto.productoId}"
                            ${!this.permisos.puedeContar ? 'disabled' : ''}>
                        <i class="bi bi-123 me-1"></i>
                        ${producto.estadoConteo === 'Contado' ? 'Recontar' : 'Contar'}
                    </button>
                </div>
            </div>
        `;

        // Configurar evento del botón contar
        const btnContar = col.querySelector('.contar-btn');
        btnContar?.addEventListener('click', () => {
            this.abrirModalConteo(producto);
        });

        // Efecto hover para tarjetas
        const card = col.querySelector('.card');
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });

        return col;
    }

    // =====================================
    // 🎭 MODAL DE CONTEO
    // =====================================

    configurarModalConteo() {
        const btnGuardarConteo = document.getElementById('btnGuardarConteo');
        const cantidadFisicaInput = document.getElementById('cantidadFisicaConteo');

        // Evento para guardar conteo
        btnGuardarConteo?.addEventListener('click', () => {
            this.guardarConteo();
        });

        // Calcular diferencia en tiempo real
        cantidadFisicaInput?.addEventListener('input', () => {
            this.calcularDiferencia();
        });

        // Enviar con Enter
        cantidadFisicaInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.guardarConteo();
            }
        });
    }

    abrirModalConteo(producto) {
        this.productoSeleccionado = producto;

        // Llenar datos del producto
        const nombreProducto = document.getElementById('nombreProductoConteo');
        const descripcionProducto = document.getElementById('descripcionProductoConteo');
        const idProducto = document.getElementById('idProductoConteo');
        const tipoProducto = document.getElementById('tipoProductoConteo');
        const imagenProducto = document.getElementById('imagenProductoConteo');
        const cantidadSistema = document.getElementById('cantidadSistemaConteo');
        const cantidadFisica = document.getElementById('cantidadFisicaConteo');
        const observaciones = document.getElementById('observacionesConteo');
        const medidasLlanta = document.getElementById('medidasLlantaConteo');
        const especificacionesLlanta = document.getElementById('especificacionesLlanta');

        // Datos básicos
        if (nombreProducto) nombreProducto.textContent = producto.nombreProducto;
        if (descripcionProducto) descripcionProducto.textContent = producto.descripcionProducto || 'Sin descripción';
        if (idProducto) idProducto.textContent = `ID: ${producto.productoId}`;
        if (tipoProducto) tipoProducto.textContent = producto.esLlanta ? 'Llanta' : 'Accesorio';

        // Imagen
        if (imagenProducto) {
            if (producto.imagenUrl) {
                imagenProducto.src = producto.imagenUrl;
                imagenProducto.style.display = 'block';
            } else {
                imagenProducto.style.display = 'none';
            }
        }

        // Cantidades
        if (cantidadSistema) cantidadSistema.value = producto.cantidadSistema;
        if (cantidadFisica) {
            cantidadFisica.value = producto.cantidadFisica !== null ? producto.cantidadFisica : '';
            cantidadFisica.focus();
        }

        // Observaciones existentes
        if (observaciones) observaciones.value = producto.observaciones || '';

        // Información de llanta
        if (producto.esLlanta && medidasLlanta) {
            if (producto.medidasLlanta || producto.marcaLlanta) {
                medidasLlanta.style.display = 'block';
                if (especificacionesLlanta) {
                    especificacionesLlanta.textContent =
                        `${producto.medidasLlanta || 'N/A'} - ${producto.marcaLlanta || 'Sin marca'}`;
                }
            } else {
                medidasLlanta.style.display = 'none';
            }
        } else if (medidasLlanta) {
            medidasLlanta.style.display = 'none';
        }

        // Calcular diferencia inicial
        this.calcularDiferencia();

        // Mostrar modal
        this.conteoModal.show();
    }

    calcularDiferencia() {
        const cantidadSistema = parseInt(document.getElementById('cantidadSistemaConteo')?.value || 0);
        const cantidadFisica = parseInt(document.getElementById('cantidadFisicaConteo')?.value || 0);
        const alertaDiferencia = document.getElementById('alertaDiferencia');
        const textoDiferencia = document.getElementById('textoDiferencia');

        if (!alertaDiferencia || !textoDiferencia) return;

        const diferencia = cantidadFisica - cantidadSistema;

        if (diferencia !== 0 && !isNaN(diferencia)) {
            alertaDiferencia.style.display = 'block';
            textoDiferencia.textContent = `${diferencia > 0 ? '+' : ''}${diferencia} unidades`;

            // Cambiar clase según el tipo de diferencia
            alertaDiferencia.className = 'alert mt-3';
            if (diferencia > 0) {
                alertaDiferencia.classList.add('alert-info');
            } else {
                alertaDiferencia.classList.add('alert-warning');
            }
        } else {
            alertaDiferencia.style.display = 'none';
        }
    }

    async guardarConteo() {
        if (!this.productoSeleccionado) return;

        const cantidadFisica = parseInt(document.getElementById('cantidadFisicaConteo')?.value || 0);
        const observaciones = document.getElementById('observacionesConteo')?.value || '';
        const btnGuardar = document.getElementById('btnGuardarConteo');

        // Validación
        if (isNaN(cantidadFisica) || cantidadFisica < 0) {
            this.mostrarError('La cantidad física debe ser un número válido mayor o igual a cero');
            return;
        }

        try {
            // Mostrar estado de carga
            if (btnGuardar) {
                btnGuardar.querySelector('.normal-state').style.display = 'none';
                btnGuardar.querySelector('.loading-state').style.display = 'inline-block';
                btnGuardar.disabled = true;
            }

            const conteoData = {
                inventarioProgramadoId: this.inventarioId,
                productoId: this.productoSeleccionado.productoId,
                cantidadFisica: cantidadFisica,
                observaciones: observaciones,
                usuarioId: this.usuarioId,
                fechaConteo: new Date().toISOString()
            };

            const response = await fetch('/TomaInventario/RegistrarConteo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value || ''
                },
                body: JSON.stringify(conteoData)
            });

            const result = await response.json();

            if (result.success) {
                // Cerrar modal
                this.conteoModal.hide();

                // Mostrar mensaje de éxito
                this.mostrarExito('Conteo registrado exitosamente');

                // Actualizar datos
                await this.cargarProductos();
                await this.actualizarProgreso();

                // Vibración en móviles
                if (navigator.vibrate) {
                    navigator.vibrate(100);
                }

            } else {
                throw new Error(result.message || 'Error al registrar conteo');
            }

        } catch (error) {
            console.error('Error guardando conteo:', error);
            this.mostrarError(`Error al registrar conteo: ${error.message}`);
        } finally {
            // Restaurar botón
            if (btnGuardar) {
                btnGuardar.querySelector('.normal-state').style.display = 'inline-block';
                btnGuardar.querySelector('.loading-state').style.display = 'none';
                btnGuardar.disabled = false;
            }
        }
    }

    // =====================================
    // 🔍 BÚSQUEDA Y FILTROS
    // =====================================

    aplicarFiltros() {
        let productosFiltrados = [...this.productos];

        // Filtro por búsqueda de texto
        if (this.filtrosActivos.busqueda) {
            const termino = this.filtrosActivos.busqueda.toLowerCase();
            productosFiltrados = productosFiltrados.filter(producto =>
                producto.nombreProducto.toLowerCase().includes(termino) ||
                producto.productoId.toString().includes(termino) ||
                (producto.marcaLlanta && producto.marcaLlanta.toLowerCase().includes(termino)) ||
                (producto.modeloLlanta && producto.modeloLlanta.toLowerCase().includes(termino)) ||
                (producto.medidasLlanta && producto.medidasLlanta.toLowerCase().includes(termino))
            );
        }

        // Filtro por estado
        if (this.filtrosActivos.estado) {
            productosFiltrados = productosFiltrados.filter(producto => {
                switch (this.filtrosActivos.estado) {
                    case 'pendiente':
                        return producto.estadoConteo === 'Pendiente';
                    case 'contado':
                        return producto.estadoConteo === 'Contado';
                    case 'discrepancia':
                        return producto.tieneDiscrepancia;
                    default:
                        return true;
                }
            });
        }

        // Filtro por tipo
        if (this.filtrosActivos.tipo) {
            productosFiltrados = productosFiltrados.filter(producto => {
                switch (this.filtrosActivos.tipo) {
                    case 'llanta':
                        return producto.esLlanta;
                    case 'accesorio':
                        return !producto.esLlanta;
                    default:
                        return true;
                }
            });
        }

        this.productosFiltrados = productosFiltrados;
        this.renderizarProductos();
    }

    async buscarProductoEspecifico() {
        const termino = this.elementos.busquedaRapida?.value?.trim();
        if (!termino) return;

        try {
            const response = await fetch(`/TomaInventario/BuscarProducto/${this.inventarioId}?termino=${encodeURIComponent(termino)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success && result.producto) {
                // Abrir directamente el modal de conteo
                this.abrirModalConteo(result.producto);
                this.mostrarExito(result.message);
            } else {
                this.mostrarError(result.message || 'Producto no encontrado');
            }

        } catch (error) {
            console.error('Error en búsqueda específica:', error);
            this.mostrarError('Error al buscar el producto');
        }
    }

    limpiarBusqueda() {
        if (this.elementos.busquedaRapida) {
            this.elementos.busquedaRapida.value = '';
        }
        this.filtrosActivos.busqueda = '';
        this.aplicarFiltros();
    }

    aplicarFiltroRapido(tipo) {
        // Limpiar otros filtros
        this.filtrosActivos.busqueda = '';
        this.filtrosActivos.tipo = '';

        if (this.elementos.busquedaRapida) {
            this.elementos.busquedaRapida.value = '';
        }

        if (this.elementos.filtroTipo) {
            this.elementos.filtroTipo.value = '';
        }

        // Aplicar filtro específico
        this.filtrosActivos.estado = tipo;

        if (this.elementos.filtroEstado) {
            this.elementos.filtroEstado.value = tipo;
        }

        this.aplicarFiltros();
    }

    limpiarFiltros() {
        // Limpiar todos los filtros
        this.filtrosActivos = {
            busqueda: '',
            estado: '',
            tipo: ''
        };

        // Limpiar elementos del DOM
        if (this.elementos.busquedaRapida) {
            this.elementos.busquedaRapida.value = '';
        }

        if (this.elementos.filtroEstado) {
            this.elementos.filtroEstado.value = '';
        }

        if (this.elementos.filtroTipo) {
            this.elementos.filtroTipo.value = '';
        }

        this.aplicarFiltros();
    }

    // =====================================
    // 🎮 GESTIÓN DE VISTAS
    // =====================================

    cambiarVista(nuevaVista) {
        this.vistaActual = nuevaVista;

        // Actualizar botones
        if (this.elementos.btnVistaLista && this.elementos.btnVistaTarjetas) {
            if (nuevaVista === 'lista') {
                this.elementos.btnVistaLista.classList.add('btn-primary');
                this.elementos.btnVistaLista.classList.remove('btn-outline-secondary');
                this.elementos.btnVistaTarjetas.classList.add('btn-outline-secondary');
                this.elementos.btnVistaTarjetas.classList.remove('btn-primary');
            } else {
                this.elementos.btnVistaTarjetas.classList.add('btn-primary');
                this.elementos.btnVistaTarjetas.classList.remove('btn-outline-secondary');
                this.elementos.btnVistaLista.classList.add('btn-outline-secondary');
                this.elementos.btnVistaLista.classList.remove('btn-primary');
            }
        }

        this.renderizarProductos();
    }

    mostrarVista(vista) {
        if (vista === 'lista') {
            if (this.elementos.productosLista) {
                this.elementos.productosLista.style.display = 'block';
            }
            if (this.elementos.productosTarjetas) {
                this.elementos.productosTarjetas.style.display = 'none';
            }
        } else {
            if (this.elementos.productosLista) {
                this.elementos.productosLista.style.display = 'none';
            }
            if (this.elementos.productosTarjetas) {
                this.elementos.productosTarjetas.style.display = 'block';
            }
        }

        if (this.elementos.estadoVacio) {
            this.elementos.estadoVacio.style.display = 'none';
        }
    }

    mostrarLoading(mostrar) {
        if (this.elementos.loadingProductos) {
            this.elementos.loadingProductos.style.display = mostrar ? 'block' : 'none';
        }

        if (!mostrar) {
            if (this.elementos.productosLista) {
                this.elementos.productosLista.style.display = 'none';
            }
            if (this.elementos.productosTarjetas) {
                this.elementos.productosTarjetas.style.display = 'none';
            }
        }
    }

    mostrarEstadoVacio() {
        if (this.elementos.estadoVacio) {
            this.elementos.estadoVacio.style.display = 'block';
        }

        if (this.elementos.productosLista) {
            this.elementos.productosLista.style.display = 'none';
        }

        if (this.elementos.productosTarjetas) {
            this.elementos.productosTarjetas.style.display = 'none';
        }
    }

    actualizarContadores() {
        if (this.elementos.contadorProductosMostrados) {
            this.elementos.contadorProductosMostrados.textContent = this.productosFiltrados.length;
        }
    }

    // =====================================
    // 🎨 MÉTODOS DE UTILIDAD
    // =====================================

    getClaseEstado(estado) {
        switch (estado) {
            case 'Contado':
                return 'bg-success';
            case 'Pendiente':
                return 'bg-warning text-dark';
            default:
                return 'bg-secondary';
        }
    }

    getTextoEstado(estado) {
        switch (estado) {
            case 'Contado':
                return '✅ Contado';
            case 'Pendiente':
                return '⏳ Pendiente';
            default:
                return estado;
        }
    }

    // =====================================
    // 📱 CONFIGURACIÓN MÓVIL
    // =====================================

    configurarEventosMovil() {
        // Cambio de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.ajustarVistaPorPantalla();
            }, 100);
        });

        // Redimensionado de ventana
        window.addEventListener('resize', () => {
            this.debounce(() => {
                this.ajustarVistaPorPantalla();
            }, 250);
        });

        // Optimización para touch
        this.optimizarTouch();
    }

    ajustarVistaPorPantalla() {
        const esMobile = window.innerWidth <= 768;

        // Cambiar vista automáticamente en móviles
        if (esMobile && this.vistaActual === 'lista') {
            this.cambiarVista('tarjetas');
        }

        // Ajustar tamaños de modal
        const modals = document.querySelectorAll('.modal-dialog');
        modals.forEach(modal => {
            if (esMobile) {
                modal.style.maxHeight = (window.innerHeight - 20) + 'px';
                modal.style.margin = '10px';
            } else {
                modal.style.maxHeight = '';
                modal.style.margin = '';
            }
        });
    }

    optimizarTouch() {
        // Agregar clases CSS para better touch
        const botones = document.querySelectorAll('.btn');
        botones.forEach(btn => {
            btn.style.minHeight = '44px'; // Tamaño mínimo recomendado para touch
        });

        // Haptic feedback para acciones importantes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-primary, .btn-success, .btn-danger')) {
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        });
    }

    // =====================================
    // 🛠️ UTILIDADES GENERALES
    // =====================================

    debounce(func, wait) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(func, wait);
    }

    mostrarExito(mensaje) {
        this.mostrarNotificacion(mensaje, 'success');
    }

    mostrarError(mensaje) {
        this.mostrarNotificacion(mensaje, 'danger');
    }

    mostrarNotificacion(mensaje, tipo) {
        // Crear contenedor si no existe
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        container.appendChild(toast);

        // Mostrar toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: tipo === 'danger' ? 8000 : 4000
        });

        bsToast.show();

        // Limpiar después de ocultar
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        });
    }
}

// =====================================
// 🚀 INICIALIZACIÓN GLOBAL
// =====================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎯 Inicializando sistema de toma de inventario...');

    // Verificar que tenemos la configuración necesaria
    if (!window.inventarioConfig) {
        console.error('❌ Configuración de inventario no encontrada');
        return;
    }

    // Crear instancia global del manager
    window.tomaInventarioManager = new TomaInventarioManager();

    console.log('✅ Sistema de toma de inventario inicializado');
});

// Prevenir pérdida de datos al salir
window.addEventListener('beforeunload', function (e) {
    // Solo mostrar advertencia si hay conteos sin guardar
    const modal = document.getElementById('conteoModal');
    if (modal && modal.classList.contains('show')) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// Manejar errores JavaScript globales
window.addEventListener('error', function (e) {
    console.error('💥 Error JavaScript:', e.error);

    // Solo mostrar al usuario errores críticos
    if (e.error && e.error.message && e.error.message.includes('fetch')) {
        if (window.tomaInventarioManager) {
            window.tomaInventarioManager.mostrarError('Error de conexión. Verifique su conexión a internet.');
        }
    }
});

// Exportar para uso en otros scripts si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TomaInventarioManager;
}

    /*
    ¿Qué hace este JavaScript?
🎯 Funcionalidades principales:

Gestión de estado: Maneja todos los datos de productos y progreso
Búsqueda inteligente: Filtros en tiempo real por texto, estado y tipo
Vista adaptativa: Automáticamente cambia entre lista y tarjetas según el dispositivo
Modal de conteo: Interfaz completa para registrar conteos con validaciones
Actualización en tiempo real: Progreso y estadísticas se actualizan automáticamente
Optimización móvil: Touch events, haptic feedback, y UI responsive

🔧 Conceptos importantes que estamos usando:

Clase ES6: Organizamos todo en una clase para mejor estructura
Async/Await: Para manejar llamadas a la API de forma moderna
Event Delegation: Los eventos se manejan eficientemente
Debouncing: Para optimizar búsquedas en tiempo real
Progressive Enhancement: Funciona básico sin JS, mejor con JS
    */