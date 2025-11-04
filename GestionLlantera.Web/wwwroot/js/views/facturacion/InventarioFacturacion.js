// ===== MÓDULO DE INVENTARIO PARA FACTURACIÓN =====

let modalInventarioFacturacion = null;
let productosInventarioCompleto = [];
let productosFiltrados = [];
let filtrosInventarioActivos = {
    busqueda: '',
    categoria: '',
    stock: '',
    ancho: '',
    perfil: '',
    diametro: '',
    tipoterreno: '',
    marca: '',
    velocidad: ''
};

/**
 * Actualizar filtros en cascada según selecciones previas (Modal Inventario)
 */
function actualizarFiltrosCascadaInventario() {
    console.log('🔄 Actualizando filtros en cascada (Modal Inventario)...');

    // Obtener selecciones actuales
    const anchoSeleccionado = $('#filterAncho').val() || '';
    const perfilSeleccionado = $('#filterPerfil').val() || '';
    const diametroSeleccionado = $('#filterDiametro').val() || '';

    // Filtrar productos según selecciones
    let productosFiltrados = [...productosInventarioCompleto];

    // Filtrar por ancho si está seleccionado
    if (anchoSeleccionado) {
        productosFiltrados = productosFiltrados.filter(producto => {
            const llantaInfo = producto.llanta || (producto.Llanta && producto.Llanta[0]);
            if (!llantaInfo) return false;
            const ancho = String(llantaInfo.ancho || '');
            return ancho === anchoSeleccionado;
        });
    }

    // Filtrar por perfil si está seleccionado
    if (perfilSeleccionado) {
        productosFiltrados = productosFiltrados.filter(producto => {
            const llantaInfo = producto.llanta || (producto.Llanta && producto.Llanta[0]);
            if (!llantaInfo || !llantaInfo.perfil) return false;

            const perfilNum = parseFloat(llantaInfo.perfil);
            const perfilFormateado = (perfilNum % 1 === 0) ?
                perfilNum.toString() :
                perfilNum.toFixed(2);

            return perfilFormateado === perfilSeleccionado;
        });
    }

    // Extraer valores únicos de los productos filtrados
    const valores = {
        perfiles: new Set(),
        diametros: new Set(),
        tiposTerreno: new Set(),
        marcas: new Set(),
        velocidades: new Set()
    };

    productosFiltrados.forEach(producto => {
        const llantaInfo = producto.llanta || (producto.Llanta && producto.Llanta[0]);

        if (llantaInfo) {
            // Extraer perfiles
            if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                const perfilNum = parseFloat(llantaInfo.perfil);
                const perfilFormateado = (perfilNum % 1 === 0) ?
                    perfilNum.toString() :
                    perfilNum.toFixed(2);
                valores.perfiles.add(perfilFormateado);
            }

            // Extraer diámetros
            if (llantaInfo.diametro) {
                const diametroNum = parseFloat(llantaInfo.diametro);
                const diametroFormateado = (diametroNum % 1 === 0) ?
                    diametroNum.toString() :
                    diametroNum.toFixed(1);
                valores.diametros.add(diametroFormateado);
            }

            // Extraer tipo de terreno
            const tipoTerreno = llantaInfo.tipoTerreno || llantaInfo.tipoterreno;
            if (tipoTerreno && tipoTerreno !== 'N/A' && tipoTerreno !== '-') {
                const tipoNormalizado = String(tipoTerreno).trim().toUpperCase();
                valores.tiposTerreno.add(tipoNormalizado);
            }

            // Extraer marca
            if (llantaInfo.marca && llantaInfo.marca !== 'N/A' && llantaInfo.marca !== '-') {
                const marcaNormalizada = String(llantaInfo.marca).trim().toUpperCase();
                valores.marcas.add(marcaNormalizada);
            }

            // Extraer velocidad
            if (llantaInfo.indiceVelocidad && llantaInfo.indiceVelocidad !== 'N/A') {
                valores.velocidades.add(llantaInfo.indiceVelocidad.toUpperCase());
            }
        }
    });

    // Actualizar select de Perfil (solo si hay ancho seleccionado)
    if (anchoSeleccionado) {
        const perfiles = Array.from(valores.perfiles).sort((a, b) => parseFloat(a) - parseFloat(b));
        const opcionesPerfiles = perfiles.map(perfil =>
            `<option value="${perfil}" ${perfilSeleccionado === perfil ? 'selected' : ''}>${perfil}</option>`
        ).join('');
        $('#filterPerfil').html('<option value="">Todos</option>' + opcionesPerfiles);

        console.log(`✅ Perfil actualizado: ${perfiles.length} opciones disponibles`);
    }

    // Actualizar select de Diámetro (solo si hay ancho o perfil seleccionado)
    if (anchoSeleccionado || perfilSeleccionado) {
        const diametros = Array.from(valores.diametros).sort((a, b) => parseFloat(a) - parseFloat(b));
        const opcionesDiametros = diametros.map(diametro =>
            `<option value="${diametro}" ${diametroSeleccionado === diametro ? 'selected' : ''}>R${diametro}"</option>`
        ).join('');
        $('#filterDiametro').html('<option value="">Todos</option>' + opcionesDiametros);

        console.log(`✅ Diámetro actualizado: ${diametros.length} opciones disponibles`);
    }

    // Actualizar Tipo de Terreno
    if (anchoSeleccionado || perfilSeleccionado || diametroSeleccionado) {
        const tiposTerreno = Array.from(valores.tiposTerreno).sort();
        const tipoTerrenoSeleccionado = $('#filterTipoTerreno').val() || '';
        const opcionesTipoTerreno = tiposTerreno.map(tipo =>
            `<option value="${tipo}" ${tipoTerrenoSeleccionado === tipo ? 'selected' : ''}>${tipo}</option>`
        ).join('');
        $('#filterTipoTerreno').html('<option value="">Todos</option>' + opcionesTipoTerreno);

        console.log(`✅ Tipo Terreno actualizado: ${tiposTerreno.length} opciones disponibles`);
    }

    // Actualizar Marca
    if (anchoSeleccionado || perfilSeleccionado || diametroSeleccionado) {
        const marcas = Array.from(valores.marcas).sort();
        const marcaSeleccionada = $('#filterMarca').val() || '';
        const opcionesMarcas = marcas.map(marca =>
            `<option value="${marca}" ${marcaSeleccionada === marca ? 'selected' : ''}>${marca}</option>`
        ).join('');
        $('#filterMarca').html('<option value="">Todas</option>' + opcionesMarcas);

        console.log(`✅ Marca actualizada: ${marcas.length} opciones disponibles`);
    }

    // Actualizar Velocidad
    if (anchoSeleccionado || perfilSeleccionado || diametroSeleccionado) {
        const velocidades = Array.from(valores.velocidades).sort();
        const velocidadSeleccionada = $('#filterVelocidad').val() || '';
        if (velocidades.length > 0) {
            const opcionesVelocidades = velocidades.map(vel =>
                `<option value="${vel}" ${velocidadSeleccionada === vel ? 'selected' : ''}>${vel}</option>`
            ).join('');
            $('#filterVelocidad').html('<option value="">Todos</option>' + opcionesVelocidades);

            console.log(`✅ Velocidad actualizada: ${velocidades.length} opciones disponibles`);
        }
    }

    // ✅ INDICADOR VISUAL DE CAMBIOS PENDIENTES
    $('#btnAplicarFiltrosInventario').addClass('btn-warning').removeClass('btn-primary');
    $('#btnAplicarFiltrosInventario').html('<i class="bi bi-funnel-fill me-1"></i>Aplicar Filtros *');
}


/**
 * Inicializar modal de inventario para facturación
 */
function inicializarModalInventario() {
    console.log('📦 === INICIALIZANDO MODAL INVENTARIO FACTURACIÓN ===');

    try {
        const modalElement = document.getElementById('modalInventario');
        if (modalElement) {
            modalInventarioFacturacion = new bootstrap.Modal(modalElement);
            console.log('✅ Modal de inventario inicializado correctamente');

            // Configurar eventos del modal
            configurarEventosModalInventario();
        } else {
            console.error('❌ No se encontró el elemento #modalInventario');
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ Error inicializando modal inventario:', error);
        return false;
    }
}

/**
 * Configurar eventos del modal de inventario
 */
function configurarEventosModalInventario() {
    console.log('📦 Configurando eventos del modal inventario...');

    // Limpiar eventos anteriores
    $('#modalInventario').off('shown.bs.modal');
    $('#modalInventario').off('hidden.bs.modal');

    // Evento cuando se muestra el modal
    $('#modalInventario').on('shown.bs.modal', function() {
        console.log('📦 Modal inventario mostrado - cargando productos');
        cargarInventarioCompleto();
    });

    // Evento cuando se oculta el modal
    $('#modalInventario').on('hidden.bs.modal', function() {
        console.log('📦 Modal inventario ocultado - limpiando datos');
        limpiarInventarioModal();
    });

    // Configurar filtros
    configurarFiltrosInventario();
}

/**
 * Poblar filtros de llantas desde los productos cargados
 */
function poblarFiltrosLlantasInventario() {
    console.log('📊 Poblando filtros de llantas en modal inventario...');

    const valores = {
        anchos: new Set(),
        perfiles: new Set(),
        diametros: new Set(),
        tiposTerreno: new Set(),
        marcas: new Set(),
        velocidades: new Set()
    };

    // Recorrer productos para extraer valores únicos
    productosInventarioCompleto.forEach(producto => {
        const esLlanta = producto.llanta || (producto.Llanta && producto.Llanta.length > 0);

        if (esLlanta) {
            const llantaInfo = producto.llanta || producto.Llanta[0];

            // Extraer ancho
            if (llantaInfo.ancho) {
                valores.anchos.add(String(llantaInfo.ancho));
            }

            // Extraer perfil
            if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                const perfilNum = parseFloat(llantaInfo.perfil);
                const perfilFormateado = (perfilNum % 1 === 0) ?
                    perfilNum.toString() :
                    perfilNum.toFixed(2);
                valores.perfiles.add(perfilFormateado);
            }

            // Extraer diámetro
            if (llantaInfo.diametro) {
                const diametroNum = parseFloat(llantaInfo.diametro);
                const diametroFormateado = (diametroNum % 1 === 0) ?
                    diametroNum.toString() :
                    diametroNum.toFixed(1);
                valores.diametros.add(diametroFormateado);
            }

            // Extraer tipo de terreno
            const tipoTerreno = llantaInfo.tipoTerreno || llantaInfo.tipoterreno;
            if (tipoTerreno && tipoTerreno !== 'N/A' && tipoTerreno !== '-') {
                const tipoNormalizado = String(tipoTerreno).trim().toUpperCase();
                valores.tiposTerreno.add(tipoNormalizado);
            }

            // Extraer marca
            const marca = llantaInfo.marca;
            if (marca && marca !== 'N/A' && marca !== '-') {
                const marcaNormalizada = String(marca).trim().toUpperCase();
                valores.marcas.add(marcaNormalizada);
            }

            // Extraer índice de velocidad
            const velocidad = llantaInfo.indiceVelocidad;
            if (velocidad && velocidad !== 'N/A' && velocidad !== '-') {
                valores.velocidades.add(velocidad.toUpperCase());
            }
        }
    });

    // Poblar selectores
    const anchos = Array.from(valores.anchos).sort((a, b) => parseFloat(a) - parseFloat(b));
    $('#filterAncho').html('<option value="">Todos</option>' +
        anchos.map(ancho => `<option value="${ancho}">${ancho} mm</option>`).join(''));

    const perfiles = Array.from(valores.perfiles).sort((a, b) => parseFloat(a) - parseFloat(b));
    $('#filterPerfil').html('<option value="">Todos</option>' +
        perfiles.map(perfil => `<option value="${perfil}">${perfil}</option>`).join(''));

    const diametros = Array.from(valores.diametros).sort((a, b) => parseFloat(a) - parseFloat(b));
    $('#filterDiametro').html('<option value="">Todos</option>' +
        diametros.map(diametro => `<option value="${diametro}">R${diametro}"</option>`).join(''));

    const tiposTerreno = Array.from(valores.tiposTerreno).sort();
    $('#filterTipoTerreno').html('<option value="">Todos</option>' +
        tiposTerreno.map(tipo => `<option value="${tipo}">${tipo}</option>`).join(''));

    const marcas = Array.from(valores.marcas).sort();
    $('#filterMarca').html('<option value="">Todas</option>' +
        marcas.map(marca => `<option value="${marca}">${marca}</option>`).join(''));

    const velocidades = Array.from(valores.velocidades).sort();
    if (velocidades.length > 0) {
        $('#filterVelocidad').html('<option value="">Todos</option>' +
            velocidades.map(vel => `<option value="${vel}">${vel}</option>`).join(''));
    }

    console.log('✅ Filtros de llantas poblados en modal inventario:', {
        anchos: anchos.length,
        perfiles: perfiles.length,
        diametros: diametros.length,
        tiposTerreno: tiposTerreno.length,
        marcas: marcas.length,
        velocidades: velocidades.length
    });
}

/**
 * Configurar filtros de inventario
 */
function configurarFiltrosInventario() {
    console.log('📦 Configurando filtros de inventario...');

    // Búsqueda por texto
    $('#busquedaInventarioModal').off('input').on('input', function () {
        const termino = $(this).val().trim();
        filtrosInventarioActivos.busqueda = termino;
        aplicarFiltrosInventario();
    });

    // Filtro por categoría
    $('#categoriaInventarioModal').off('change').on('change', function () {
        filtrosInventarioActivos.categoria = $(this).val();
        aplicarFiltrosInventario();
    });

    // Filtro por stock
    $('#stockInventarioModal').off('change').on('change', function () {
        filtrosInventarioActivos.stock = $(this).val();
        aplicarFiltrosInventario();
    });

    // ✅ FILTROS ESPECÍFICOS DE LLANTAS CON CASCADA
    $('#filterAncho').off('change').on('change', function () {
        const valor = $(this).val();
        console.log('🔄 Ancho cambiado (Modal):', valor);
        actualizarFiltrosCascadaInventario();
    });

    $('#filterPerfil').off('change').on('change', function () {
        const valor = $(this).val();
        console.log('🔄 Perfil cambiado (Modal):', valor);
        actualizarFiltrosCascadaInventario();
    });

    $('#filterDiametro').off('change').on('change', function () {
        const valor = $(this).val();
        console.log('🔄 Diámetro cambiado (Modal):', valor);
        actualizarFiltrosCascadaInventario();
    });

    $('#filterTipoTerreno, #filterMarca, #filterVelocidad').off('change').on('change', function () {
        console.log('🔄 Filtro de llanta cambiado (Modal)');
        $('#btnAplicarFiltrosInventario').addClass('btn-warning').removeClass('btn-primary');
        $('#btnAplicarFiltrosInventario').html('<i class="bi bi-funnel-fill me-1"></i>Aplicar Filtros *');
    });

    // ✅ BOTÓN APLICAR FILTROS
    $('#btnAplicarFiltrosInventario').off('click').on('click', function () {
        console.log('🔘 Usuario hizo clic en Aplicar Filtros (Modal)');

        // Obtener valores de filtros
        filtrosInventarioActivos.ancho = $('#filterAncho').val() || '';
        filtrosInventarioActivos.perfil = $('#filterPerfil').val() || '';
        filtrosInventarioActivos.diametro = $('#filterDiametro').val() || '';
        filtrosInventarioActivos.tipoterreno = $('#filterTipoTerreno').val() || '';
        filtrosInventarioActivos.marca = $('#filterMarca').val() || '';
        filtrosInventarioActivos.velocidad = $('#filterVelocidad').val() || '';

        // Aplicar filtros
        aplicarFiltrosInventario();

        // ✅ RESETEAR BOTÓN
        $(this).removeClass('btn-warning').addClass('btn-primary');
        $(this).html('<i class="bi bi-check-circle me-1"></i>Aplicar Filtros');
    });

    // ✅ BOTÓN LIMPIAR FILTROS DE LLANTAS
    $('#btnLimpiarFiltrosLlantas').off('click').on('click', function () {
        console.log('🧹 Limpiando filtros de llantas (Modal)...');

        // Limpiar selectores
        $('#filterAncho, #filterPerfil, #filterDiametro, #filterTipoTerreno, #filterMarca, #filterVelocidad').val('');

        // Limpiar filtros activos
        filtrosInventarioActivos.ancho = '';
        filtrosInventarioActivos.perfil = '';
        filtrosInventarioActivos.diametro = '';
        filtrosInventarioActivos.tipoterreno = '';
        filtrosInventarioActivos.marca = '';
        filtrosInventarioActivos.velocidad = '';

        // Repoblar filtros con todas las opciones
        poblarFiltrosLlantasInventario();

        // Reaplicar solo filtros generales (búsqueda, categoría, stock)
        aplicarFiltrosInventario();

        // Resetear botón
        $('#btnAplicarFiltrosInventario').removeClass('btn-warning').addClass('btn-primary');
        $('#btnAplicarFiltrosInventario').html('<i class="bi bi-check-circle me-1"></i>Aplicar Filtros');

        // Mostrar notificación
        mostrarToast('Filtros Limpiados', 'Se han limpiado todos los filtros de llantas', 'success');
    });

    // Botón de limpiar filtros generales
    $('#btnLimpiarFiltrosInventario').off('click').on('click', function () {
        limpiarFiltrosInventario();
    });
}/**
 * Abrir modal de inventario
 */
function consultarInventario() {
    console.log('📦 === ABRIENDO MODAL INVENTARIO ===');

    if (!modalInventarioFacturacion) {
        console.log('📦 Modal no inicializado, inicializando...');
        if (!inicializarModalInventario()) {
            console.error('❌ No se pudo inicializar el modal');
            mostrarToast('Error', 'No se pudo abrir el inventario', 'danger');
            return;
        }
    }

    try {
        modalInventarioFacturacion.show();
        console.log('📦 Modal mostrado exitosamente');
    } catch (error) {
        console.error('❌ Error mostrando modal:', error);
        mostrarToast('Error', 'No se pudo abrir el inventario', 'danger');
    }
}

/**
 * Cargar inventario completo
 */
async function cargarInventarioCompleto() {
    try {
        console.log('📦 === CARGANDO INVENTARIO COMPLETO ===');

        // Mostrar loading
        const loadingElement = $('#inventarioModalLoading');
        const contentElement = $('#inventarioModalContent');

        if (loadingElement.length) {
            loadingElement.show();
        }
        if (contentElement.length) {
            contentElement.hide();
        }

        console.log('📦 Realizando petición al servidor...');

        const response = await fetch('/Facturacion/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Respuesta del servidor:', data);

        if (data && data.productos) {
            productosInventarioCompleto = data.productos;
            console.log(`📦 Productos cargados: ${productosInventarioCompleto.length}`);

            // ✅ POBLAR FILTROS DE LLANTAS
            poblarFiltrosLlantasInventario();

            mostrarProductosInventario(productosInventarioCompleto);
        } else {
            throw new Error('No se encontraron productos en la respuesta');
        }

    } catch (error) {
        console.error('❌ Error cargando inventario:', error);
        mostrarErrorInventario(error.message);
    } finally {
        const loadingElement = $('#inventarioModalLoading');
        if (loadingElement.length) {
            loadingElement.hide();
        }
    }
}

/**
 * Mostrar productos en el modal de inventario (SIN PAGINACIÓN)
 */
function mostrarProductosInventario(productos) {
    console.log('📦 === MOSTRANDO PRODUCTOS INVENTARIO ===');
    console.log('📦 Productos totales:', productos?.length || 0);

    const tbody = $('#inventarioModalProductos');
    const cantidadTexto = $('#cantidadProductosTexto');

    if (!tbody.length) {
        console.error('❌ No se encontró el tbody #inventarioModalProductos');
        mostrarErrorInventario('Error en la interfaz del modal');
        return;
    }

    if (!productos || productos.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-box-seam display-1 text-muted"></i>
                    <p class="mt-2 text-muted">No hay productos disponibles</p>
                </td>
            </tr>
        `);
        cantidadTexto.text('0 productos');
        $('#inventarioModalContent').show();
        return;
    }

    // ✅ ORDENAR POR MEDIDAS POR DEFECTO (MENOR A MAYOR)
    const productosOrdenados = ordenarProductosPorMedidas(productos, true);

    // Actualizar productos filtrados globalmente
    productosFiltrados = productosOrdenados;

    // Actualizar contador
    cantidadTexto.text(`${productosOrdenados.length} producto${productosOrdenados.length !== 1 ? 's' : ''}`);

    console.log(`📦 Generando HTML para ${productosOrdenados.length} productos ordenados por medida...`);

    // ✅ GENERAR HTML PARA TODOS LOS PRODUCTOS
    generarHTMLProductos(productosOrdenados, tbody);

    $('#inventarioModalContent').show();

    // ✅ MARCAR LA COLUMNA MEDIDA COMO ORDENADA ASCENDENTE
    $('.sortable').removeClass('sorted-asc sorted-desc');
    $('.sortable[data-column="medida"]').addClass('sorted-asc');
    $('.sortable i').removeClass('bi-arrow-up bi-arrow-down').addClass('bi-arrow-down-up');
    $('.sortable[data-column="medida"] i').removeClass('bi-arrow-down-up').addClass('bi-arrow-up');

    console.log('✅ Productos de inventario mostrados y ordenados por medida (ascendente)');
}

/**
 * Función auxiliar para ordenar productos por medidas
 * @param {Array} productos - Array de productos a ordenar
 * @param {Boolean} ascendente - true para ascendente, false para descendente
 * @returns {Array} - Array ordenado
 */
function ordenarProductosPorMedidas(productos, ascendente = true) {
    console.log(`📊 Ordenando ${productos.length} productos por medidas (${ascendente ? 'ascendente' : 'descendente'})...`);

    // Función para parsear medidas de un producto
    const parseaMedidaProducto = (producto) => {
        try {
            if (!producto.llanta && (!producto.Llanta || producto.Llanta.length === 0)) {
                return { ancho: 999999, perfil: 999999, diametro: 999999 };
            }

            const llantaInfo = producto.llanta || producto.Llanta[0];

            const ancho = parseFloat(llantaInfo.ancho) || 999999;
            const perfil = parseFloat(llantaInfo.perfil) || 0;
            const diametro = parseFloat(llantaInfo.diametro) || 999999;

            return { ancho, perfil, diametro };
        } catch (error) {
            console.warn('⚠️ Error parseando medida:', error);
            return { ancho: 999999, perfil: 999999, diametro: 999999 };
        }
    };

    // Clonar array para no mutar el original
    const productosOrdenados = [...productos];

    // Ordenar
    productosOrdenados.sort((a, b) => {
        const medidaA = parseaMedidaProducto(a);
        const medidaB = parseaMedidaProducto(b);

        // 1️⃣ Primero por DIÁMETRO
        if (medidaA.diametro !== medidaB.diametro) {
            const resultado = medidaA.diametro - medidaB.diametro;
            return ascendente ? resultado : -resultado;
        }

        // 2️⃣ Luego por ANCHO
        if (medidaA.ancho !== medidaB.ancho) {
            const resultado = medidaA.ancho - medidaB.ancho;
            return ascendente ? resultado : -resultado;
        }

        // 3️⃣ Finalmente por PERFIL
        const resultado = medidaA.perfil - medidaB.perfil;
        return ascendente ? resultado : -resultado;
    });

    // Debug: Mostrar primeras 10 medidas
    console.log('🔍 Primeras 10 medidas ordenadas:');
    productosOrdenados.slice(0, 10).forEach((producto, index) => {
        const llanta = producto.llanta || (producto.Llanta && producto.Llanta[0]);
        if (llanta) {
            const medida = llanta.perfil && llanta.perfil > 0
                ? `${llanta.ancho}/${llanta.perfil}/R${llanta.diametro}`
                : `${llanta.ancho}/R${llanta.diametro}`;
            console.log(`  ${index + 1}. ${medida} - ${producto.nombreProducto}`);
        }
    });

    return productosOrdenados;
}


/**
 * Generar HTML de productos
 */
function generarHTMLProductos(productos, tbody) {

    let html = '';
    productos.forEach(producto => {
        // Mapear propiedades del producto
        const nombreProducto = producto.nombreProducto || producto.NombreProducto || 'Producto sin nombre';
        const productoId = producto.productoId || producto.ProductoId || 0;
        const precio = producto.precio || producto.Precio || 0;
        const cantidadInventario = producto.cantidadEnInventario || producto.CantidadEnInventario || 0;
        const stockMinimo = producto.stockMinimo || producto.StockMinimo || 0;
        const descripcion = producto.descripcion || producto.Descripcion || '';
        const capas = producto.llanta.capas;
        const tipoTerreno = producto.llanta.tipoTerreno;

        // Determinar si es llanta y extraer medidas
        let esLlanta = false;
        let medidaLlanta = 'N/A';
        let medidaParaBusqueda = 'n/a';

        try {
            if (producto.llanta || (producto.Llanta && producto.Llanta.length > 0)) {
                esLlanta = true;
                const llantaInfo = producto.llanta || producto.Llanta[0];

                if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                    if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                        medidaLlanta = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
                        // Crear múltiples formatos para búsqueda
                        medidaParaBusqueda = `${medidaLlanta} ${llantaInfo.ancho}/${llantaInfo.perfil} ${llantaInfo.ancho}x${llantaInfo.perfil}x${llantaInfo.diametro} ${llantaInfo.ancho} ${llantaInfo.perfil} ${llantaInfo.diametro}`.toLowerCase();
                    } else {
                        medidaLlanta = `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
                        // Crear múltiples formatos para búsqueda
                        medidaParaBusqueda = `${medidaLlanta} ${llantaInfo.ancho} R${llantaInfo.diametro} ${llantaInfo.diametro}`.toLowerCase();
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Error procesando información de llanta:', error);
        }

        // Calcular precios por método de pago
        const precioEfectivo = precio;
        const precioTarjeta = precio * 1.05;

        // Determinar clases de fila según stock
        let rowClass = '';
        let stockBadge = '';
        if (cantidadInventario <= 0) {
            rowClass = 'table-danger';
            stockBadge = '<span class="badge bg-danger">Sin Stock</span>';
        } else if (cantidadInventario <= stockMinimo) {
            rowClass = 'table-warning';
            stockBadge = '<span class="badge bg-warning text-dark">Stock Bajo</span>';
        } else {
            stockBadge = '<span class="badge bg-success">Disponible</span>';
        }

        // OBJETO PRODUCTO LIMPIO EXACTAMENTE IGUAL AL INDEX DE FACTURACIÓN
        const productoLimpio = {
            productoId: productoId,
            nombreProducto: nombreProducto,
            precio: precio,
            cantidadEnInventario: cantidadInventario,
            stockMinimo: stockMinimo,
            imagenesUrls: producto.imagenesUrls || [],
            descripcion: descripcion,
            esLlanta: esLlanta || false,
            marca: producto.llanta.marca || null,
            modelo: producto.llanta.modelo || null,
            medidaCompleta: medidaLlanta || null,
            capas: producto.llanta.capas || null,
            ancho: producto.llanta.ancho || null,
            perfil: producto.llanta.perfil || null,
            diametro: producto.llanta.diametro || null,
            tipoterreno: producto.llanta.tipoTerreno || null
        };

        const productoJson = JSON.stringify(productoLimpio).replace(/"/g, '&quot;');

        html += `
            <tr class="${rowClass}" 
                data-producto-id="${productoId}"
                data-nombre="${nombreProducto.toLowerCase()}"
                data-capas="${capas}"
                data-tipoTerreno="${tipoTerreno}"
                data-stock="${cantidadInventario}"
                data-precio-efectivo="${precioEfectivo}"
                data-precio-tarjeta="${precioTarjeta}"
                data-medida="${medidaParaBusqueda}">
                <td>
                    <strong class="d-block">${nombreProducto}</strong>
                    <small class="text-muted">ID: ${productoId}</small>
                    ${esLlanta ? '<span class="badge bg-primary mt-1">Llanta</span>' : ''}
                </td>
                <td class="text-center">
                    ${esLlanta ? (() => {
                                // Parsear la medida existente
                                let medidaMostrar = medidaLlanta;

                                try {
                                    // Si la medida viene en formato "ancho/perfil/Rdiametro"
                                    const partes = medidaLlanta.split('/');

                                    if (partes.length === 3) {
                                        const ancho = partes[0];
                                        const perfil = partes[1];
                                        const diametro = partes[2]; // Ya incluye la R

                                        // Formatear el perfil
                                        const perfilNum = parseFloat(perfil);
                                        if (!isNaN(perfilNum)) {
                                            const perfilFormateado = (perfilNum % 1 === 0) ?
                                                perfilNum.toString() :
                                                perfilNum.toFixed(2);

                                            medidaMostrar = `${ancho}/${perfilFormateado}/${diametro}`;
                                        }
                                    }
                                } catch (error) {
                                    console.warn('Error formateando medida:', error);
                                }

                                return `<span class="fw-bold text-primary">${medidaMostrar}</span>`;
                            })() : '<span class="text-muted">N/A</span>'}
                </td>
                <td>
                    <span class="text-muted" title="${capas}">
                    ${capas && capas !== 'N/A' && capas !== 0 && capas !== '0' ? `
                        <div class="col-md-4">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-layers-fill text-info me-2"></i>
                                <div>
                                    <small class="text-muted d-block">Capas</small>
                                    <strong class="small">${capas} PR</strong>
                                </div>
                            </div>
                        </div>
                    ` : ''}   
                    </span>
                </td>
                <td class="text-center">
                    ${tipoTerreno && tipoTerreno !== 'N/A' ? `
                        <span class="badge bg-success">${tipoTerreno}</span>
                    ` : '<span class="text-muted">-</span>'}
                </td>
                <td class="text-center">
                    <div class="d-flex flex-column align-items-center">
                        <strong class="text-primary">${cantidadInventario}</strong>
                        <small class="text-muted">Mín: ${stockMinimo}</small>
                        ${stockBadge}
                    </div>
                </td>
                <td class="text-end">
                    <span class="text-success fw-bold">₡${formatearMoneda(precioEfectivo)}</span>
                </td>
                <td class="text-end">
                    <span class="text-warning fw-bold">₡${formatearMoneda(precioTarjeta)}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group-vertical btn-group-sm">
                        ${cantidadInventario > 0 ? `
                            <button type="button" 
                                    class="btn btn-primary btn-sm btn-agregar-desde-inventario mb-1"
                                    data-producto="${productoJson}"
                                    title="Agregar al carrito">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        ` : `
                            <button type="button" 
                                    class="btn btn-secondary btn-sm mb-1" 
                                    disabled
                                    title="Sin stock disponible">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        `}
                        <button type="button" 
                                class="btn btn-outline-info btn-sm btn-ver-detalle-inventario"
                                data-producto="${productoJson}"
                                title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.html(html);

    // Configurar eventos de los botones
    configurarEventosProductosInventario();

    // Configurar ordenamiento de tabla
    configurarOrdenamientoTablaInventario();
}

/**
 * Actualizar controles de paginación
 */
function actualizarControlsPaginacion() {
    const paginacionContainer = $('#paginacionInventarioModal');
    
    if (paginacionConfig.totalPaginas <= 1) {
        paginacionContainer.hide();
        return;
    }

    paginacionContainer.show();

    let html = `
        <nav aria-label="Paginación de inventario">
            <ul class="pagination pagination-sm justify-content-center mb-0">
    `;

    // Botón anterior
    html += `
        <li class="page-item ${paginacionConfig.paginaActual === 1 ? 'disabled' : ''}">
            <button class="page-link btn-pagina-inventario" data-pagina="${paginacionConfig.paginaActual - 1}" ${paginacionConfig.paginaActual === 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
    `;

    // Páginas
    const maxPaginasVisibles = 5;
    let inicio = Math.max(1, paginacionConfig.paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(paginacionConfig.totalPaginas, inicio + maxPaginasVisibles - 1);

    if (fin - inicio + 1 < maxPaginasVisibles) {
        inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }

    // Primera página si no está visible
    if (inicio > 1) {
        html += `
            <li class="page-item">
                <button class="page-link btn-pagina-inventario" data-pagina="1">1</button>
            </li>
        `;
        if (inicio > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Páginas visibles
    for (let i = inicio; i <= fin; i++) {
        html += `
            <li class="page-item ${i === paginacionConfig.paginaActual ? 'active' : ''}">
                <button class="page-link btn-pagina-inventario" data-pagina="${i}">${i}</button>
            </li>
        `;
    }

    // Última página si no está visible
    if (fin < paginacionConfig.totalPaginas) {
        if (fin < paginacionConfig.totalPaginas - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `
            <li class="page-item">
                <button class="page-link btn-pagina-inventario" data-pagina="${paginacionConfig.totalPaginas}">${paginacionConfig.totalPaginas}</button>
            </li>
        `;
    }

    // Botón siguiente
    html += `
        <li class="page-item ${paginacionConfig.paginaActual === paginacionConfig.totalPaginas ? 'disabled' : ''}">
            <button class="page-link btn-pagina-inventario" data-pagina="${paginacionConfig.paginaActual + 1}" ${paginacionConfig.paginaActual === paginacionConfig.totalPaginas ? 'disabled' : ''}>
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;

    html += `
            </ul>
        </nav>
    `;

    paginacionContainer.html(html);

    // Configurar eventos de paginación
    configurarEventosPaginacion();
}

/**
 * Configurar eventos de paginación
 */
function configurarEventosPaginacion() {
    $('.btn-pagina-inventario').off('click').on('click', function(e) {
        e.preventDefault();
        
        if ($(this).prop('disabled')) {
            return;
        }

        const nuevaPagina = parseInt($(this).data('pagina'));
        
        if (nuevaPagina >= 1 && nuevaPagina <= paginacionConfig.totalPaginas && nuevaPagina !== paginacionConfig.paginaActual) {
            paginacionConfig.paginaActual = nuevaPagina;
            mostrarProductosInventario(productosFiltrados);
            console.log(`📦 Navegando a página ${nuevaPagina}`);
        }
    });
}

/**
 * Actualizar información de paginación
 */
function actualizarInfoPaginacion(productosPagina, totalProductos) {
    const infoContainer = $('#infoPaginacionInventario');
    
    if (totalProductos === 0) {
        infoContainer.html('<small class="text-muted">No hay productos para mostrar</small>');
        return;
    }

    if (paginacionConfig.totalPaginas <= 1) {
        infoContainer.html(`<small class="text-muted">Mostrando ${totalProductos} producto${totalProductos !== 1 ? 's' : ''}</small>`);
        return;
    }

    const inicio = (paginacionConfig.paginaActual - 1) * paginacionConfig.productosPorPagina + 1;
    const fin = Math.min(inicio + productosPagina - 1, totalProductos);

    infoContainer.html(`
        <small class="text-muted">
            Mostrando ${inicio}-${fin} de ${totalProductos} productos 
            (Página ${paginacionConfig.paginaActual} de ${paginacionConfig.totalPaginas})
        </small>
    `);
}

/**
 * Ocultar controles de paginación
 */
function ocultarControlsPaginacion() {
    $('#paginacionInventarioModal').hide();
}

/**
 * Cambiar productos por página
 */
function cambiarProductosPorPagina(cantidad) {
    paginacionConfig.productosPorPagina = cantidad;
    paginacionConfig.paginaActual = 1; // Volver a la primera página
    mostrarProductosInventario(productosFiltrados);
    console.log(`📦 Productos por página cambiado a: ${cantidad}`);
}

/**
 * Configurar ordenamiento de la tabla de inventario (CON SCROLL)
 */
function configurarOrdenamientoTablaInventario() {
    console.log('📦 Configurando ordenamiento de tabla...');

    $('.sortable').off('click').on('click', function () {
        const column = $(this).data('column');
        const $tbody = $('#inventarioModalProductos');
        const rows = $tbody.find('tr').toArray();

        // Determinar dirección de ordenamiento
        let ascending = true;
        if ($(this).hasClass('sorted-asc')) {
            ascending = false;
            $(this).removeClass('sorted-asc').addClass('sorted-desc');
        } else {
            $(this).removeClass('sorted-desc').addClass('sorted-asc');
            ascending = true;
        }

        // Limpiar iconos de otras columnas
        $('.sortable').not(this).removeClass('sorted-asc sorted-desc');

        // Actualizar icono
        $('.sortable i').removeClass('bi-arrow-up bi-arrow-down').addClass('bi-arrow-down-up');
        $(this).find('i').removeClass('bi-arrow-down-up').addClass(ascending ? 'bi-arrow-up' : 'bi-arrow-down');

        // ✅ FUNCIÓN PARA PARSEAR MEDIDAS
        const parseaMedida = (medidaTexto) => {
            if (!medidaTexto || medidaTexto === 'N/A') {
                return { ancho: 999999, perfil: 999999, diametro: 999999 };
            }

            // Con perfil: 175/70/R12
            let match = medidaTexto.match(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)/);
            if (match) {
                return {
                    ancho: parseFloat(match[1]) || 0,
                    perfil: parseFloat(match[2]) || 0,
                    diametro: parseFloat(match[3]) || 0
                };
            }

            // Sin perfil: 700/R16
            match = medidaTexto.match(/(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)/);
            if (match) {
                return {
                    ancho: parseFloat(match[1]) || 0,
                    perfil: 0,
                    diametro: parseFloat(match[2]) || 0
                };
            }

            return { ancho: 999999, perfil: 999999, diametro: 999999 };
        };

        // ✅ ORDENAR TODAS LAS FILAS
        rows.sort(function (a, b) {
            if (column === 'medida') {
                // ORDENAMIENTO ESPECIAL PARA MEDIDAS
                const medidaA = $(a).find("td:eq(1)").text().trim();
                const medidaB = $(b).find("td:eq(1)").text().trim();

                const partsA = parseaMedida(medidaA);
                const partsB = parseaMedida(medidaB);

                // 1️⃣ DIÁMETRO
                if (partsA.diametro !== partsB.diametro) {
                    const resultado = partsA.diametro - partsB.diametro;
                    return ascending ? resultado : -resultado;
                }

                // 2️⃣ ANCHO
                if (partsA.ancho !== partsB.ancho) {
                    const resultado = partsA.ancho - partsB.ancho;
                    return ascending ? resultado : -resultado;
                }

                // 3️⃣ PERFIL
                const resultado = partsA.perfil - partsB.perfil;
                return ascending ? resultado : -resultado;
            }

            // OTROS ORDENAMIENTOS
            let aVal, bVal;

            switch (column) {
                case 'nombre':
                    aVal = $(a).data('nombre') || '';
                    bVal = $(b).data('nombre') || '';
                    break;
                case 'stock':
                    aVal = parseInt($(a).data('stock')) || 0;
                    bVal = parseInt($(b).data('stock')) || 0;
                    break;
                case 'precioEfectivo':
                    aVal = parseFloat($(a).data('precio-efectivo')) || 0;
                    bVal = parseFloat($(b).data('precio-efectivo')) || 0;
                    break;
                case 'precioTarjeta':
                    aVal = parseFloat($(a).data('precio-tarjeta')) || 0;
                    bVal = parseFloat($(b).data('precio-tarjeta')) || 0;
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
                return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return ascending ? aVal - bVal : bVal - aVal;
            }
        });

        // Reordenar en el DOM
        $tbody.empty().append(rows);

        console.log(`📦 ${rows.length} filas ordenadas por ${column}`);
    });
}




function configurarEventosProductosInventario() {
    console.log('📦 Configurando eventos de productos...');

    // Botón agregar producto
    $('.btn-agregar-desde-inventario').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            const productoJson = $(this).attr('data-producto');
            const producto = JSON.parse(productoJson.replace(/&quot;/g, '"'));

            console.log('📦 Agregando producto desde inventario:', producto.nombreProducto);

            // Cerrar modal de inventario
            if (modalInventarioFacturacion) {
                modalInventarioFacturacion.hide();
            }

            // Mostrar modal de selección de producto
            setTimeout(() => {
                if (typeof mostrarModalSeleccionProducto === 'function') {
                    mostrarModalSeleccionProducto(producto);
                } else {
                    console.error('❌ Función mostrarModalSeleccionProducto no disponible');
                    mostrarToast('Error', 'No se pudo procesar el producto', 'danger');
                }
            }, 300);

        } catch (error) {
            console.error('❌ Error agregando producto desde inventario:', error);
            mostrarToast('Error', 'No se pudo procesar el producto', 'danger');
        }
    });

    // Botón ver detalle - Abrir modal de detalles existente
    $('.btn-ver-detalle-inventario').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            const productoJson = $(this).attr('data-producto');
            const producto = JSON.parse(productoJson.replace(/&quot;/g, '"'));

            console.log('👁️ Abriendo modal de detalles para producto:', producto.nombreProducto);

            // Usar la función existente de verDetalleProducto
            if (typeof verDetalleProducto === 'function') {
                verDetalleProducto(producto);
            } else {
                console.error('❌ Función verDetalleProducto no disponible');
                mostrarToast('Error', 'No se pudo abrir el modal de detalles', 'danger');
            }

        } catch (error) {
            console.error('❌ Error abriendo modal de detalles desde inventario:', error);
            mostrarToast('Error', 'No se pudo abrir el modal de detalles', 'danger');
        }
    });
}

/**
 * Aplicar filtros al inventario
 */
function aplicarFiltrosInventario() {
    if (!productosInventarioCompleto || productosInventarioCompleto.length === 0) {
        return;
    }

    let productosFiltradosTemp = [...productosInventarioCompleto];

    // Filtro por texto de búsqueda
    if (filtrosInventarioActivos.busqueda) {
        const termino = filtrosInventarioActivos.busqueda.toLowerCase();
        productosFiltradosTemp = productosFiltradosTemp.filter(producto => {
            const nombre = (producto.nombreProducto || '').toLowerCase();
            const descripcion = (producto.descripcion || '').toLowerCase();

            // Buscar también en medidas de llantas
            let medidaTexto = '';
            try {
                if (producto.llanta || (producto.Llanta && producto.Llanta.length > 0)) {
                    const llantaInfo = producto.llanta || producto.Llanta[0];

                    if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                        if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                            medidaTexto = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`.toLowerCase();
                        } else {
                            medidaTexto = `${llantaInfo.ancho}/R${llantaInfo.diametro}`.toLowerCase();
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error procesando medida para filtro:', error);
            }

            return nombre.includes(termino) ||
                descripcion.includes(termino) ||
                medidaTexto.includes(termino);
        });
    }

    // Filtro por categoría
    if (filtrosInventarioActivos.categoria && filtrosInventarioActivos.categoria !== 'todas') {
        productosFiltradosTemp = productosFiltradosTemp.filter(producto => {
            return (producto.categoria || '').toLowerCase() === filtrosInventarioActivos.categoria.toLowerCase();
        });
    }

    // Filtro por stock
    if (filtrosInventarioActivos.stock) {
        switch (filtrosInventarioActivos.stock) {
            case 'disponible':
                productosFiltradosTemp = productosFiltradosTemp.filter(p => (p.cantidadEnInventario || 0) > 0);
                break;
            case 'agotado':
                productosFiltradosTemp = productosFiltradosTemp.filter(p => (p.cantidadEnInventario || 0) === 0);
                break;
            case 'bajo':
                productosFiltradosTemp = productosFiltradosTemp.filter(p =>
                    (p.cantidadEnInventario || 0) > 0 &&
                    (p.cantidadEnInventario || 0) <= (p.stockMinimo || 0)
                );
                break;
        }
    }

    // ✅ FILTROS ESPECÍFICOS DE LLANTAS
    if (filtrosInventarioActivos.ancho || filtrosInventarioActivos.perfil ||
        filtrosInventarioActivos.diametro || filtrosInventarioActivos.tipoterreno ||
        filtrosInventarioActivos.marca || filtrosInventarioActivos.velocidad) {

        productosFiltradosTemp = productosFiltradosTemp.filter(producto => {
            const esLlanta = producto.llanta || (producto.Llanta && producto.Llanta.length > 0);

            // Si no es llanta y hay filtros de llanta activos, excluir
            if (!esLlanta) {
                return false;
            }

            const llantaInfo = producto.llanta || producto.Llanta[0];

            // Filtro de ancho
            if (filtrosInventarioActivos.ancho) {
                const ancho = String(llantaInfo.ancho || '');
                if (ancho !== filtrosInventarioActivos.ancho) {
                    return false;
                }
            }

            // Filtro de perfil
            if (filtrosInventarioActivos.perfil) {
                if (!llantaInfo.perfil) return false;

                const perfilNum = parseFloat(llantaInfo.perfil);
                const perfilFormateado = (perfilNum % 1 === 0) ?
                    perfilNum.toString() :
                    perfilNum.toFixed(2);

                if (perfilFormateado !== filtrosInventarioActivos.perfil) {
                    return false;
                }
            }

            // Filtro de diámetro
            if (filtrosInventarioActivos.diametro) {
                const diametroNum = parseFloat(llantaInfo.diametro || 0);
                const diametroFormateado = (diametroNum % 1 === 0) ?
                    diametroNum.toString() :
                    diametroNum.toFixed(1);

                if (diametroFormateado !== filtrosInventarioActivos.diametro) {
                    return false;
                }
            }

            // Filtro de tipo de terreno
            if (filtrosInventarioActivos.tipoterreno) {
                const tipoTerreno = llantaInfo.tipoTerreno || llantaInfo.tipoterreno || '';
                const tipoNormalizado = String(tipoTerreno).trim().toUpperCase();
                const filtroNormalizado = String(filtrosInventarioActivos.tipoterreno).trim().toUpperCase();

                if (tipoNormalizado !== filtroNormalizado) {
                    return false;
                }
            }

            // Filtro de marca
            if (filtrosInventarioActivos.marca) {
                const marca = llantaInfo.marca || '';
                const marcaNormalizada = String(marca).trim().toUpperCase();
                const filtroNormalizado = String(filtrosInventarioActivos.marca).trim().toUpperCase();

                if (marcaNormalizada !== filtroNormalizado) {
                    return false;
                }
            }

            // Filtro de velocidad
            if (filtrosInventarioActivos.velocidad) {
                const velocidad = llantaInfo.indiceVelocidad || '';
                if (velocidad.toUpperCase() !== filtrosInventarioActivos.velocidad.toUpperCase()) {
                    return false;
                }
            }

            return true;
        });
    }

    console.log(`🔍 Filtros aplicados: ${productosFiltradosTemp.length} de ${productosInventarioCompleto.length} productos`);

    

    mostrarProductosInventario(productosFiltradosTemp);
}

/**
 * Limpiar filtros de inventario
 */
function limpiarFiltrosInventario() {
    console.log('🧹 Limpiando todos los filtros de inventario');

    filtrosInventarioActivos = {
        busqueda: '',
        categoria: '',
        stock: '',
        ancho: '',
        perfil: '',
        diametro: '',
        tipoterreno: '',
        marca: '',
        velocidad: ''
    };

    $('#busquedaInventarioModal').val('');
    $('#categoriaInventarioModal').val('todas');
    $('#stockInventarioModal').val('');
    $('#filterAncho, #filterPerfil, #filterDiametro, #filterTipoTerreno, #filterMarca, #filterVelocidad').val('');

    // ✅ RESTABLECER TODOS LOS FILTROS A SU ESTADO INICIAL
    poblarFiltrosLlantasInventario();

    // ✅ RESETEAR BOTÓN
    $('#btnAplicarFiltrosInventario').removeClass('btn-warning').addClass('btn-primary');
    $('#btnAplicarFiltrosInventario').html('<i class="bi bi-check-circle me-1"></i>Aplicar Filtros');

    // Mostrar todos los productos ordenados
    const productosOrdenados = ordenarProductosPorMedidas(productosInventarioCompleto, true);
    mostrarProductosInventario(productosOrdenados);
}

/**
 * Limpiar datos del modal de inventario
 */
function limpiarInventarioModal() {
    console.log('🧹 Limpiando modal de inventario');

    $('#inventarioModalProductos').empty();
    productosInventarioCompleto = [];
    productosFiltrados = [];

    // Reiniciar paginación
    paginacionConfig = {
        paginaActual: 1,
        productosPorPagina: 20,
        totalPaginas: 1,
        totalProductos: 0
    };

    // Limpiar ordenamiento
    $('.sortable').removeClass('sorted-asc sorted-desc');
    $('.sortable i').removeClass('bi-arrow-up bi-arrow-down').addClass('bi-arrow-down-up');

    // Ocultar controles de paginación
    ocultarControlsPaginacion();

    limpiarFiltrosInventario();
}

/**
 * Mostrar error en el modal de inventario
 */
function mostrarErrorInventario(mensaje) {
    const contentElement = $('#inventarioModalContent');
    const tbody = $('#inventarioModalProductos');

    if (contentElement.length) {
        contentElement.show();
    }

    if (tbody.length) {
        tbody.html(`
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                    <p class="mt-2 text-danger">Error cargando inventario</p>
                    <p class="text-muted">${mensaje}</p>
                    <button class="btn btn-outline-primary" onclick="cargarInventarioCompleto()">
                        <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
                    </button>
                </td>
            </tr>
        `);
    } else {
        console.error('❌ No se encontró contenedor para mostrar error');
    }
}

/**
 * Actualizar vista de productos después de ajuste de stock
 */
async function actualizarVistaProductosPostAjuste() {
    try {
        console.log('📦 === ACTUALIZANDO VISTA POST-AJUSTE ===');

        // Solo actualizar si el modal está abierto
        if (modalInventarioFacturacion && $('#modalInventario').hasClass('show')) {
            await cargarInventarioCompleto();
            console.log('✅ Vista de inventario actualizada después del ajuste');
        }

        // También actualizar la búsqueda principal si hay productos cargados
        if (typeof cargarProductosIniciales === 'function') {
            // Limpiar estado de búsqueda para forzar actualización
            if (typeof limpiarEstadoBusqueda === 'function') {
                limpiarEstadoBusqueda();
            }
            await cargarProductosIniciales();
            console.log('✅ Vista principal de productos actualizada');
        }

    } catch (error) {
        console.error('❌ Error actualizando vista post-ajuste:', error);
    }
}

/**
 * Función auxiliar para formatear moneda
 */
function formatearMoneda(valor) {
    if (typeof valor !== 'number') {
        valor = parseFloat(valor) || 0;
    }
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

/**
 * ✅ FUNCIÓN AUXILIAR: Construir URL de imagen correcta
 */
function construirUrlImagen(urlOriginal) {
    if (!urlOriginal || urlOriginal.trim() === '') {
        return '/images/no-image.png';
    }

    const url = urlOriginal.trim();

    // Si ya es una URL completa, usarla directamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Construir URL para el servidor API
    if (url.startsWith('/uploads/productos/')) {
        return `https://localhost:7273${url}`;
    } else if (url.startsWith('uploads/productos/')) {
        return `https://localhost:7273/${url}`;
    } else if (url.startsWith('/')) {
        return `https://localhost:7273${url}`;
    } else {
        return `https://localhost:7273/${url}`;
    }
}







// ✅ NO NECESITAMOS FUNCIÓN DUPLICADA - SE USA LA DE FACTURACION.JS PRINCIPAL

/**
 * Función auxiliar para mostrar toast - usando la función principal de facturacion.js
 */
function mostrarToast(titulo, mensaje, tipo = 'info') {
    // Verificar si existe la función principal de facturacion.js
    if (typeof window.mostrarToastModerno === 'function') {
        window.mostrarToastModerno(titulo, mensaje, tipo);
    } else if (typeof toastr !== 'undefined') {
        // Fallback a toastr si está disponible
        toastr[tipo] ? toastr[tipo](`${titulo}: ${mensaje}`) : toastr.info(`${titulo}: ${mensaje}`);
    } else {
        console.log(`${tipo.toUpperCase()}: ${titulo} - ${mensaje}`);
        alert(`${titulo}: ${mensaje}`);
    }
}

// ===== EXPORTAR FUNCIONES GLOBALMENTE =====
window.inicializarModalInventario = inicializarModalInventario;
window.consultarInventario = consultarInventario;
window.cargarInventarioCompleto = cargarInventarioCompleto;
window.actualizarVistaProductosPostAjuste = actualizarVistaProductosPostAjuste;
window.cambiarProductosPorPagina = cambiarProductosPorPagina;

// ✅ VERIFICAR QUE verDetalleProducto ESTÉ DISPONIBLE DESDE FACTURACION.JS
if (typeof window.verDetalleProducto !== 'function') {
    console.warn('⚠️ verDetalleProducto no está disponible desde facturacion.js');
} else {
    console.log('✅ verDetalleProducto disponible desde facturacion.js');
}

console.log('📦 Módulo InventarioFacturacion.js cargado correctamente');