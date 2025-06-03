/**
 * Funcionalidad para la gestión de inventario - VERSIÓN FINAL
 * Ordenamiento + Paginación + Filtros integrados
 */

// ✅ VARIABLES GLOBALES
let estadoOrdenamiento = {
    columna: null,
    direccion: 'asc'
};

let paginacionConfig = {
    paginaActual: 1,
    productosPorPagina: 25,
    totalProductos: 0,
    totalPaginas: 0,
    filasVisibles: []
};

document.addEventListener('DOMContentLoaded', function () {
    const filtrosAvanzados = document.getElementById('filtrosAvanzados');
    const iconoColapsar = document.getElementById('iconoColapsarFiltros');

    if (filtrosAvanzados && iconoColapsar) {
        // ✅ Evento cuando se abre/cierra el panel
        filtrosAvanzados.addEventListener('show.bs.collapse', function () {
            iconoColapsar.className = 'bi bi-chevron-up';
        });

        filtrosAvanzados.addEventListener('hide.bs.collapse', function () {
            iconoColapsar.className = 'bi bi-chevron-down';
        });
    }
});

// ✅ FUNCIONES GLOBALES DE PAGINACIÓN

// Función principal para inicializar la paginación
function inicializarPaginacion() {
    console.log('📄 Inicializando sistema de paginación');

    // Actualizar total de productos
    actualizarFilasVisibles();

    // Configurar eventos
    configurarEventosPaginacion();

    // Renderizar primera página
    renderizarPagina(1);

    console.log('✅ Paginación inicializada correctamente');
}

// Función para actualizar la lista de filas visibles (respetando filtros)
function actualizarFilasVisibles() {
    // ✅ CORRIGIENDO: Contar TODAS las filas que cumplen filtros, no solo las visibles por paginación
    paginacionConfig.filasVisibles = $("tbody tr").filter(function () {
        // Una fila está "disponible" si no está oculta por filtros
        // (pero puede estar oculta por paginación)
        const $fila = $(this);

        // Verificar si está oculta por filtros (no por paginación)
        // Si display es 'none' debido a filtros, no la contamos
        // Si display es 'none' debido a paginación, sí la contamos

        // Temporarily show all rows to check filter status
        const originalDisplay = $fila.css('display');
        $fila.show();

        // Check if it passes current filters
        const cumpleFiltros = verificarSiCumpleFiltros($fila);

        // Restore original display
        if (originalDisplay === 'none') {
            $fila.hide();
        }

        return cumpleFiltros;
    }).get();

    paginacionConfig.totalProductos = paginacionConfig.filasVisibles.length;
    paginacionConfig.totalPaginas = paginacionConfig.productosPorPagina === 'all'
        ? 1
        : Math.ceil(paginacionConfig.totalProductos / paginacionConfig.productosPorPagina);

    console.log(`📊 Productos que cumplen filtros: ${paginacionConfig.totalProductos}, Páginas: ${paginacionConfig.totalPaginas}`);
}

// ✅ FUNCIÓN COMPATIBLE CON EL SISTEMA DE FILTROS AVANZADOS
function verificarSiCumpleFiltros($fila) {
    // Verificar si las funciones de filtros están disponibles
    if (typeof cumpleFiltroTexto !== 'function') {
        // Fallback: usar lógica básica si no están cargados los filtros avanzados
        return true;
    }

    // Usar la lógica de filtros avanzados
    let cumpleTodos = true;

    if (!cumpleFiltroTexto($fila)) cumpleTodos = false;
    if (!cumpleFiltroCategoria($fila)) cumpleTodos = false;
    if (!cumpleFiltroStock($fila)) cumpleTodos = false;
    if (!cumpleFiltroMarca($fila)) cumpleTodos = false;
    if (!cumpleFiltrosPrecio($fila)) cumpleTodos = false;
    if (!cumpleFiltrosStockRango($fila)) cumpleTodos = false;
    if (!cumpleFiltrosUtilidad($fila)) cumpleTodos = false;
    if (!cumpleFiltrosLlantas($fila)) cumpleTodos = false;

    return cumpleTodos;
}

// Función para configurar todos los eventos de paginación
function configurarEventosPaginacion() {
    // Cambio en productos por página
    $("#productosPorPagina").off('change').on('change', function () {
        const valor = $(this).val();
        paginacionConfig.productosPorPagina = valor === 'all' ? 'all' : parseInt(valor);
        paginacionConfig.paginaActual = 1;

        console.log(`🔄 Cambiando a ${paginacionConfig.productosPorPagina} productos por página`);

        actualizarFilasVisibles();
        renderizarPagina(1);
    });

    // Navegación: Primera página
    $("#btn-primera").off('click').on('click', function (e) {
        e.preventDefault();
        if (!$(this).hasClass('disabled')) {
            renderizarPagina(1);
        }
    });

    // Navegación: Página anterior
    $("#btn-anterior").off('click').on('click', function (e) {
        e.preventDefault();
        if (!$(this).hasClass('disabled')) {
            renderizarPagina(paginacionConfig.paginaActual - 1);
        }
    });

    // Navegación: Página siguiente
    $("#btn-siguiente").off('click').on('click', function (e) {
        e.preventDefault();
        if (!$(this).hasClass('disabled')) {
            renderizarPagina(paginacionConfig.paginaActual + 1);
        }
    });

    // Navegación: Última página
    $("#btn-ultima").off('click').on('click', function (e) {
        e.preventDefault();
        if (!$(this).hasClass('disabled')) {
            renderizarPagina(paginacionConfig.totalPaginas);
        }
    });

    // Navegación: Números de página
    $("#paginacion-botones").off('click', '.page-link[data-pagina]').on('click', '.page-link[data-pagina]', function (e) {
        e.preventDefault();
        const pagina = parseInt($(this).data('pagina'));
        if (pagina && pagina !== paginacionConfig.paginaActual) {
            renderizarPagina(pagina);
        }
    });
}

// Función principal para renderizar una página específica
function renderizarPagina(numeroPagina) {
    console.log(`🎯 Renderizando página ${numeroPagina}`);

    // Validar número de página
    if (numeroPagina < 1 || (numeroPagina > paginacionConfig.totalPaginas && paginacionConfig.totalPaginas > 0)) {
        console.warn(`⚠️ Página ${numeroPagina} inválida. Total páginas: ${paginacionConfig.totalPaginas}`);
        return;
    }

    paginacionConfig.paginaActual = numeroPagina;

    // Mostrar/ocultar filas según la página
    mostrarFilasDePagina();

    // Actualizar botones de navegación
    actualizarBotonesNavegacion();

    // Actualizar información de estado
    actualizarInformacionPaginacion();

    // Actualizar contadores generales
    actualizarContadores();

    console.log(`✅ Página ${numeroPagina} renderizada correctamente`);
}

// Función para mostrar solo las filas de la página actual
function mostrarFilasDePagina() {
    // Ocultar todas las filas primero
    $("tbody tr").hide();

    if (paginacionConfig.productosPorPagina === 'all') {
        // Mostrar todas las filas visibles
        $(paginacionConfig.filasVisibles).show();
    } else {
        // Calcular rango de filas a mostrar
        const inicio = (paginacionConfig.paginaActual - 1) * paginacionConfig.productosPorPagina;
        const fin = inicio + paginacionConfig.productosPorPagina;

        // Mostrar solo las filas del rango actual
        const filasAPaginar = paginacionConfig.filasVisibles.slice(inicio, fin);
        $(filasAPaginar).show();

        console.log(`👁️ Mostrando filas ${inicio + 1} a ${Math.min(fin, paginacionConfig.totalProductos)}`);
    }
}

// Función para actualizar el estado de los botones de navegación
function actualizarBotonesNavegacion() {
    const $btnPrimera = $("#btn-primera");
    const $btnAnterior = $("#btn-anterior");
    const $btnSiguiente = $("#btn-siguiente");
    const $btnUltima = $("#btn-ultima");

    // Deshabilitar/habilitar botones según la página actual
    if (paginacionConfig.paginaActual <= 1) {
        $btnPrimera.addClass('disabled');
        $btnAnterior.addClass('disabled');
    } else {
        $btnPrimera.removeClass('disabled');
        $btnAnterior.removeClass('disabled');
    }

    if (paginacionConfig.paginaActual >= paginacionConfig.totalPaginas || paginacionConfig.productosPorPagina === 'all') {
        $btnSiguiente.addClass('disabled');
        $btnUltima.addClass('disabled');
    } else {
        $btnSiguiente.removeClass('disabled');
        $btnUltima.removeClass('disabled');
    }

    // Generar números de página
    generarNumerosPagina();
}

// Función para generar los números de página dinámicamente
function generarNumerosPagina() {
    const $contenedor = $("#paginacion-botones");

    // Remover números de página existentes (conservar botones de navegación)
    $contenedor.find('.page-item[id^="pagina-"]').remove();
    $contenedor.find('.page-item:has(.page-link:contains("..."))').remove();

    if (paginacionConfig.productosPorPagina === 'all' || paginacionConfig.totalPaginas <= 1) {
        return; // No mostrar números si es "todos" o solo hay 1 página
    }

    const paginaActual = paginacionConfig.paginaActual;
    const totalPaginas = paginacionConfig.totalPaginas;

    // Calcular rango de páginas a mostrar (máximo 5 números)
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);

    // Ajustar si estamos cerca del final
    if (fin - inicio < 4) {
        inicio = Math.max(1, fin - 4);
    }

    // Insertar números de página antes del botón "siguiente"
    const $btnSiguiente = $("#btn-siguiente");

    for (let i = inicio; i <= fin; i++) {
        const esActiva = i === paginaActual ? 'active' : '';
        const $nuevaPagina = $(`
            <li class="page-item ${esActiva}" id="pagina-${i}">
                <a class="page-link" href="#" data-pagina="${i}">${i}</a>
            </li>
        `);

        $nuevaPagina.insertBefore($btnSiguiente);
    }

    // Agregar puntos suspensivos si es necesario
    if (inicio > 1) {
        $(`<li class="page-item disabled"><span class="page-link">...</span></li>`).insertAfter($("#btn-anterior"));
    }

    if (fin < totalPaginas) {
        $(`<li class="page-item disabled"><span class="page-link">...</span></li>`).insertBefore($("#btn-siguiente"));
    }
}

// Función para actualizar la información de paginación
function actualizarInformacionPaginacion() {
    const inicio = paginacionConfig.productosPorPagina === 'all'
        ? 1
        : ((paginacionConfig.paginaActual - 1) * paginacionConfig.productosPorPagina) + 1;

    const fin = paginacionConfig.productosPorPagina === 'all'
        ? paginacionConfig.totalProductos
        : Math.min(paginacionConfig.paginaActual * paginacionConfig.productosPorPagina, paginacionConfig.totalProductos);

    $("#paginacion-inicio").text(paginacionConfig.totalProductos > 0 ? inicio : 0);
    $("#paginacion-fin").text(fin);
    $("#paginacion-total").text(paginacionConfig.totalProductos);
}

// ✅ FUNCIONES GLOBALES DE PRODUCTOS Y MODALES

// Función para cargar los detalles del producto desde la tabla
function cargarDetallesProducto(productoId) {
    resetFormularioDetalles();
    $("#productoId").val(productoId);

    const fila = $(`button.ver-detalles-btn[data-id="${productoId}"]`).closest("tr");

    if (fila.length === 0) {
        mostrarNotificacion("Error", "No se encontró el producto en la tabla", "danger");
        return;
    }

    // Datos básicos del producto
    const nombre = fila.find("td:eq(2) strong").text();
    const descripcion = fila.find("td:eq(2) .small").text() || "Sin descripción adicional";
    const stock = parseInt(fila.find("td:eq(8)").text().trim().split(' ')[0].replace(/[^\d]/g, '')) || 0;
    const stockMin = parseInt(fila.find("td:eq(9)").text().trim()) || 0;

    // Datos de precios
    const precioFinalTexto = fila.find("td:eq(7)").text().trim();
    const tipoPrecioTexto = fila.find("td:eq(7) small").text().trim();

    // Cargar información básica en el modal
    $("#nombreProductoVistaRapida").text(nombre);
    $("#descripcionVistaRapida").text(descripcion);
    $("#stockProductoVistaRapida").text(stock);
    $("#stockMinimoVistaRapida").text(stockMin);
    $("#precioProductoVistaRapida").text(precioFinalTexto.split('\n')[0] || "₡0");
    $("#tipoPrecioVistaRapida").text(tipoPrecioTexto || "Precio manual");

    // Configurar colores del precio
    if (tipoPrecioTexto === "Calculado") {
        $("#precioProductoVistaRapida").removeClass("text-primary").addClass("text-success");
    } else {
        $("#precioProductoVistaRapida").removeClass("text-success").addClass("text-primary");
    }

    // Configurar indicador visual de stock
    configurarIndicadorStock(stock, stockMin);

    // Cargar imágenes del producto
    cargarImagenesEnModal(fila, productoId);

    // Verificar si es una llanta y mostrar info específica
    const esLlanta = fila.find("td:eq(2) .badge").text() === "Llanta";
    if (esLlanta) {
        $("#infoLlantaVistaRapida").show();
        const medidas = fila.find("td:eq(3) .medida-llanta").text().trim();
        const marcaModelo = fila.find("td:eq(4) .marca-modelo span").first().text().trim();

        $("#medidasVistaRapida").text(medidas !== "N/A" && medidas ? medidas : "No disponible");
        $("#marcaVistaRapida").text(marcaModelo !== "N/A" && marcaModelo ? marcaModelo : "No disponible");
    } else {
        $("#infoLlantaVistaRapida").hide();
    }

    // Configurar botones
    $("#btnVerDetallesCompletos").attr("href", `/Inventario/DetalleProducto/${productoId}`);
    $("#btnAjustarStockVistaRapida").data("id", productoId);

    // Mostrar el modal
    $("#detallesProductoModal").modal("show");
}

// Función para configurar indicador visual de stock
function configurarIndicadorStock(stock, stockMin) {
    const porcentajeStock = stockMin > 0 ? Math.min((stock / (stockMin * 2)) * 100, 100) : 50;

    $("#barraProgresoStock").css("width", `${porcentajeStock}%`);

    if (stock <= stockMin) {
        $("#barraProgresoStock").removeClass("bg-warning bg-success").addClass("bg-danger");
        $("#alertaStockBajo").show();
        $("#stockProductoVistaRapida").addClass("text-danger fw-bold");
    } else if (stock <= stockMin * 1.5) {
        $("#barraProgresoStock").removeClass("bg-danger bg-success").addClass("bg-warning");
        $("#alertaStockBajo").hide();
        $("#stockProductoVistaRapida").removeClass("text-danger fw-bold").addClass("text-warning");
    } else {
        $("#barraProgresoStock").removeClass("bg-danger bg-warning").addClass("bg-success");
        $("#alertaStockBajo").hide();
        $("#stockProductoVistaRapida").removeClass("text-danger text-warning fw-bold").addClass("text-success");
    }
}

// Función para cargar imágenes en el modal
function cargarImagenesEnModal(fila, productoId) {
    const $contenedorImagenes = $("#contenedorImagenesModal");
    const $indicadores = $("#indicadoresModal");
    const $btnPrev = $("#btnPrevModal");
    const $btnNext = $("#btnNextModal");

    $contenedorImagenes.empty();
    $indicadores.empty();
    $btnPrev.hide();
    $btnNext.hide();
    $indicadores.hide();

    $.ajax({
        url: `/Inventario/ObtenerImagenesProducto/${productoId}`,
        type: "GET",
        success: function (imagenes) {
            console.log('🖼️ Imágenes recibidas:', imagenes);
            procesarImagenesDelProducto(imagenes);
        },
        error: function (xhr, status, error) {
            console.warn('⚠️ Error al cargar imágenes desde servidor:', error);
            const imagenDeTabla = fila.find("td:eq(1) img").attr("src");
            const imagenesFallback = imagenDeTabla ? [imagenDeTabla] : [];
            procesarImagenesDelProducto(imagenesFallback);
        }
    });
}

// Función para procesar imágenes del producto
function procesarImagenesDelProducto(imagenes) {
    const $contenedorImagenes = $("#contenedorImagenesModal");
    const $indicadores = $("#indicadoresModal");
    const $btnPrev = $("#btnPrevModal");
    const $btnNext = $("#btnNextModal");

    if (imagenes.length === 0) {
        $contenedorImagenes.html(`
            <div class="carousel-item active d-flex align-items-center justify-content-center" style="min-height: 400px;">
                <div class="text-center">
                    <i class="bi bi-image text-muted" style="font-size: 4rem;"></i>
                    <p class="text-muted mt-3">No hay imágenes disponibles</p>
                </div>
            </div>
        `);
    } else if (imagenes.length === 1) {
        $contenedorImagenes.html(`
            <div class="carousel-item active d-flex align-items-center justify-content-center" style="min-height: 400px;">
                <img src="${imagenes[0]}" 
                     class="img-fluid" 
                     style="max-height: 400px; max-width: 100%; object-fit: contain;"
                     alt="Imagen del producto">
            </div>
        `);
    } else {
        let imagenesHtml = '';
        let indicadoresHtml = '';

        imagenes.forEach((imagen, index) => {
            const activo = index === 0 ? 'active' : '';
            imagenesHtml += `
                <div class="carousel-item ${activo}">
                    <div class="d-flex align-items-center justify-content-center" style="min-height: 400px;">
                        <img src="${imagen}" 
                             class="img-fluid" 
                             style="max-height: 400px; max-width: 100%; object-fit: contain;"
                             alt="Imagen del producto ${index + 1}">
                    </div>
                </div>
            `;
            indicadoresHtml += `
                <button type="button" data-bs-target="#carruselImagenesModal" data-bs-slide-to="${index}" 
                        class="${activo}" aria-current="${index === 0 ? 'true' : 'false'}" 
                        aria-label="Slide ${index + 1}"></button>
            `;
        });

        $contenedorImagenes.html(imagenesHtml);
        $indicadores.html(indicadoresHtml);
        $indicadores.show();
        $btnPrev.show();
        $btnNext.show();
    }
}

// Función para resetear el formulario de detalles
function resetFormularioDetalles() {
    $("#nombreProductoVistaRapida").text("Cargando...");
    $("#descripcionVistaRapida").text("Cargando...");
    $("#precioProductoVistaRapida").text("₡0").removeClass("text-success text-primary");
    $("#tipoPrecioVistaRapida").text("Cargando...");
    $("#stockProductoVistaRapida").text("0").removeClass("text-danger text-warning text-success fw-bold");
    $("#stockMinimoVistaRapida").text("0");
    $("#alertaStockBajo").hide();
    $("#barraProgresoStock").css("width", "0%").removeClass("bg-danger bg-warning bg-success");
    $("#medidasVistaRapida").text("-");
    $("#marcaVistaRapida").text("-");
    $("#infoLlantaVistaRapida").hide();

    $("#contenedorImagenesModal").html(`
        <div class="carousel-item active d-flex align-items-center justify-content-center" style="min-height: 400px;">
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-muted">Cargando imágenes...</p>
            </div>
        </div>
    `);
    $("#indicadoresModal").empty().hide();
    $("#btnPrevModal").hide();
    $("#btnNextModal").hide();
}

// Función para mostrar notificaciones
function mostrarNotificacion(titulo, mensaje, tipo) {
    const alertHtml = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            <strong>${titulo}:</strong> ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    if ($("#alertContainer").length === 0) {
        $("body").prepend('<div id="alertContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>');
    }

    const $alert = $(alertHtml).appendTo("#alertContainer");
    setTimeout(() => {
        $alert.alert('close');
    }, 5000);
}

// ✅ FUNCIONES DE ORDENAMIENTO

// Función principal para ordenar por columna
function ordenarPorColumna(columna, tipo) {
    console.log(`🔄 Ordenando por columna: ${columna}, tipo: ${tipo}`);

    if (estadoOrdenamiento.columna === columna) {
        estadoOrdenamiento.direccion = estadoOrdenamiento.direccion === 'asc' ? 'desc' : 'asc';
    } else {
        estadoOrdenamiento.direccion = 'asc';
        estadoOrdenamiento.columna = columna;
    }

    actualizarIndicadoresOrdenamiento(columna);

    // ✅ CORRIGIENDO: Mostrar todas las filas temporalmente para ordenar
    const tabla = $("table tbody");

    // Guardar estado de visibilidad actual
    const estadosVisibilidad = [];
    tabla.find("tr").each(function (index) {
        estadosVisibilidad[index] = $(this).is(':visible');
    });

    // Mostrar todas las filas temporalmente para el ordenamiento
    tabla.find("tr").show();

    // Obtener y ordenar TODAS las filas
    const filas = tabla.find("tr").get();

    filas.sort(function (a, b) {
        return compararValores(a, b, columna, tipo, estadoOrdenamiento.direccion);
    });

    // Reordenar filas en la tabla
    $.each(filas, function (indice, fila) {
        tabla.append(fila);
    });

    // ✅ CORRIGIENDO: Actualizar paginación sin afectar el conteo total
    actualizarFilasVisibles();

    // REEMPLAZAR CON:
    if (typeof actualizarFilasVisibles === 'function') {
        actualizarFilasVisibles();
    }

    renderizarPagina(paginacionConfig.paginaActual);

    console.log(`✅ Ordenamiento completado: ${columna} ${estadoOrdenamiento.direccion}`);
}
// Función para actualizar indicadores visuales
function actualizarIndicadoresOrdenamiento(columnaActiva) {
    $('.sortable').removeClass('active asc desc');
    $('.sortable .sort-icon').removeClass('text-primary').addClass('opacity-50');

    const $columnaActiva = $(`.sortable[data-column="${columnaActiva}"]`);
    $columnaActiva.addClass('active');
    $columnaActiva.addClass(estadoOrdenamiento.direccion);

    const $icono = $columnaActiva.find('.sort-icon');
    $icono.removeClass('opacity-50').addClass('text-primary');

    if (estadoOrdenamiento.direccion === 'asc') {
        $icono.removeClass('bi-arrow-down-up bi-arrow-down').addClass('bi-arrow-up');
    } else {
        $icono.removeClass('bi-arrow-down-up bi-arrow-up').addClass('bi-arrow-down');
    }
}

// Función principal de comparación
function compararValores(filaA, filaB, columna, tipo, direccion) {
    let valorA, valorB;

    switch (columna) {
        case 'id':
            valorA = obtenerValorId(filaA);
            valorB = obtenerValorId(filaB);
            break;
        case 'producto':
            valorA = obtenerValorProducto(filaA);
            valorB = obtenerValorProducto(filaB);
            break;
        case 'medidas':
            valorA = obtenerValorMedidas(filaA);
            valorB = obtenerValorMedidas(filaB);
            break;
        case 'marca':
            valorA = obtenerValorMarca(filaA);
            valorB = obtenerValorMarca(filaB);
            break;
        case 'costo':
            valorA = obtenerValorCosto(filaA);
            valorB = obtenerValorCosto(filaB);
            break;
        case 'utilidad':
            valorA = obtenerValorUtilidad(filaA);
            valorB = obtenerValorUtilidad(filaB);
            break;
        case 'precio':
            valorA = obtenerValorPrecio(filaA);
            valorB = obtenerValorPrecio(filaB);
            break;
        case 'stock':
            valorA = obtenerValorStock(filaA);
            valorB = obtenerValorStock(filaB);
            break;
        case 'stockmin':
            valorA = obtenerValorStockMin(filaA);
            valorB = obtenerValorStockMin(filaB);
            break;
        default:
            return 0;
    }

    let resultado = 0;
    if (tipo === 'number' || tipo === 'currency' || tipo === 'percentage') {
        resultado = valorA - valorB;
    } else {
        resultado = valorA.localeCompare(valorB);
    }

    return direccion === 'desc' ? -resultado : resultado;
}

// ✅ FUNCIONES EXTRACTORAS DE VALORES

function obtenerValorId(fila) {
    const texto = $(fila).find("td:eq(0)").text().trim();
    return parseInt(texto) || 0;
}

function obtenerValorProducto(fila) {
    const texto = $(fila).find("td:eq(2) strong").text().trim();
    return texto.toLowerCase();
}

function obtenerValorMedidas(fila) {
    const texto = $(fila).find("td:eq(3)").text().trim();
    return (texto === "N/A" || texto === "-") ? "" : texto.toLowerCase();
}

function obtenerValorMarca(fila) {
    const texto = $(fila).find("td:eq(4)").text().trim();
    return (texto === "N/A" || texto === "Sin información") ? "" : texto.toLowerCase();
}

function obtenerValorCosto(fila) {
    const texto = $(fila).find("td:eq(5)").text().trim();
    const numero = texto.replace(/[₡,\s-]/g, '');
    return parseFloat(numero) || 0;
}

function obtenerValorUtilidad(fila) {
    const badge = $(fila).find("td:eq(6) .badge").text().trim();
    if (badge && badge !== "-") {
        const numero = badge.replace('%', '');
        return parseFloat(numero) || 0;
    }
    return 0;
}

function obtenerValorPrecio(fila) {
    const textoCompleto = $(fila).find("td:eq(7)").text().trim();
    const match = textoCompleto.match(/₡([\d,]+)/);
    if (match) {
        const numero = match[1].replace(/,/g, '');
        return parseFloat(numero) || 0;
    }
    return 0;
}

function obtenerValorStock(fila) {
    const texto = $(fila).find("td:eq(8)").text().trim();
    const numero = texto.split(' ')[0].replace(/[^\d]/g, '');
    return parseInt(numero) || 0;
}

function obtenerValorStockMin(fila) {
    const texto = $(fila).find("td:eq(9)").text().trim();
    return parseInt(texto) || 0;
}

// Función para actualizar contadores
function actualizarContadores() {
    const filasVisibles = $("tbody tr:visible").length;
    const filasStockBajo = $("tbody tr.table-danger:visible").length;

    $("#contadorProductos").text(filasVisibles);
    $("#contadorStockBajo").text(filasStockBajo);
}

// ✅ DOCUMENT READY - CONFIGURACIÓN E INICIALIZACIÓN
$(document).ready(function () {
    console.log('🚀 Inventario - Inicializando sistema completo');

    // Limpiar eventos previos
    $(document).off('click', '.producto-img-mini');
    $(document).off('click', '.producto-img-link');
    $(document).off('click', '.producto-img-mini img');
    $(document).off('click', '.ver-detalles-btn');
    $(document).off('click', '.sortable');

    // Evento para ordenamiento por columnas
    $(document).on('click', '.sortable', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const columna = $(this).data('column');
        const tipo = $(this).data('type');

        console.log(`🖱️ Click detectado en columna: ${columna}, tipo: ${tipo}`);

        if (columna && tipo) {
            ordenarPorColumna(columna, tipo);
        } else {
            console.error('❌ Faltan datos en el encabezado:', {
                columna: columna,
                tipo: tipo,
                elemento: this
            });
        }
    });

    // Mejorar cursor para indicar clickeable
    $('.sortable').css('cursor', 'pointer');

    // Evento para imagen miniatura -> modal
    $(document).on('click', 'td:has(.producto-img-container)', function (e) {
        if ($(e.target).closest('button, .btn, .sortable').length === 0) {
            e.preventDefault();
            e.stopPropagation();

            const $fila = $(this).closest('tr[data-id]');
            const productoId = $fila.attr('data-id');

            console.log('🖼️ Click en imagen - Abriendo modal para Producto ID:', productoId);

            if (productoId && typeof cargarDetallesProducto === 'function') {
                cargarDetallesProducto(productoId);
            }
        }
    });

    // Evento para botón ojo -> página de detalles
    $(document).on('click', '.ver-detalles-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const productoId = $(this).data("id");

        console.log('👁️ Click en botón ojo - Navegando a página de detalles para Producto ID:', productoId);

        if (productoId) {
            const url = `/Inventario/DetalleProducto/${productoId}`;
            console.log('🌐 Navegando a:', url);
            window.location.href = url;
        }
    });

    // Inicializar tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Eventos de ajuste de stock
    $(".ajuste-stock-btn").click(function () {
        const productoId = $(this).data("id");
        $("#productoId").val(productoId);
        $("#ajusteStockModal").modal("show");
    });

    $(".ajuste-stock-detalle-btn").click(function () {
        $("#detallesProductoModal").modal("hide");
        setTimeout(() => {
            $("#ajusteStockModal").modal("show");
        }, 500);
    });

    $("#btnAjustarStockVistaRapida").click(function () {
        const productoId = $(this).data("id");
        $("#productoId").val(productoId);
        $("#detallesProductoModal").modal("hide");
        setTimeout(() => {
            $("#ajusteStockModal").modal("show");
        }, 500);
    });

    // Eventos para compartir desde el modal
    $("#btnCompartirWhatsApp").click(function (e) {
        e.preventDefault();
        compartirPorWhatsApp();
    });

    $("#btnCompartirEmail").click(function (e) {
        e.preventDefault();
        compartirPorEmail();
    });

    // Guardar ajuste de stock
    $("#guardarAjusteBtn").click(function () {
        if (!validarFormularioAjuste()) {
            return;
        }

        const productoId = $("#productoId").val();
        const tipoAjuste = $("#tipoAjuste").val();
        const cantidad = $("#cantidad").val();

        const datos = {
            cantidad: parseInt(cantidad),
            tipoAjuste: tipoAjuste
        };

        $.ajax({
            url: `/api/Inventario/productos/${productoId}/ajuste-stock`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(datos),
            success: function (respuesta) {
                mostrarNotificacion("Éxito", "Stock ajustado correctamente", "success");
                $("#ajusteStockModal").modal("hide");
                setTimeout(() => {
                    location.reload();
                }, 1500);
            },
            error: function (xhr, status, error) {
                console.error("Error al ajustar stock:", error);
                mostrarNotificacion("Error", "No se pudo ajustar el stock", "danger");
            }
        });
    });

    // Funciones de compartir
    function compartirPorWhatsApp() {
        try {
            const nombre = $("#nombreProductoVistaRapida").text();
            const precio = $("#precioProductoVistaRapida").text();
            const stock = $("#stockProductoVistaRapida").text();
            const productoId = $("#btnVerDetallesCompletos").attr("href").split('/').pop();

            const urlProducto = `${window.location.origin}/Inventario/DetalleProducto/${productoId}`;
            const mensaje = `🛞 *${nombre}*\n\n💰 Precio: ${precio}\n📦 Stock disponible: ${stock} unidades\n\n🔗 Ver más detalles:\n${urlProducto}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

            window.open(whatsappUrl, '_blank');
            console.log('✅ Compartido por WhatsApp');
        } catch (error) {
            console.error('❌ Error al compartir por WhatsApp:', error);
            mostrarNotificacion("Error", "No se pudo compartir por WhatsApp", "danger");
        }
    }

    function compartirPorEmail() {
        try {
            const nombre = $("#nombreProductoVistaRapida").text();
            const precio = $("#precioProductoVistaRapida").text();
            const stock = $("#stockProductoVistaRapida").text();
            const descripcion = $("#descripcionVistaRapida").text();
            const productoId = $("#btnVerDetallesCompletos").attr("href").split('/').pop();

            const urlProducto = `${window.location.origin}/Inventario/DetalleProducto/${productoId}`;
            const asunto = `Producto: ${nombre}`;
            const cuerpo = `Hola,

Te comparto información sobre este producto:

🛞 PRODUCTO: ${nombre}

💰 PRECIO: ${precio}
📦 STOCK DISPONIBLE: ${stock} unidades
📝 DESCRIPCIÓN: ${descripcion}

🔗 Ver detalles completos:
${urlProducto}

Saludos.`;

            const emailUrl = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
            window.location.href = emailUrl;
            console.log('✅ Compartido por Email');
        } catch (error) {
            console.error('❌ Error al compartir por Email:', error);
            mostrarNotificacion("Error", "No se pudo compartir por Email", "danger");
        }
    }

    // Función de validación
    function validarFormularioAjuste() {
        let esValido = true;

        if ($("#tipoAjuste").val() === "") {
            $("#tipoAjuste").addClass("is-invalid");
            esValido = false;
        } else {
            $("#tipoAjuste").removeClass("is-invalid");
        }

        if ($("#cantidad").val() === "" || parseInt($("#cantidad").val()) < 1) {
            $("#cantidad").addClass("is-invalid");
            esValido = false;
        } else {
            $("#cantidad").removeClass("is-invalid");
        }

        return esValido;
    }

    

   


    // Ordenamiento original por select (mantener compatibilidad)
    $("#sortBy").on("change", function () {
        const valor = $(this).val();
        const tabla = $("table");
        const filas = tabla.find("tbody tr").get();

        filas.sort(function (a, b) {
            let valorA, valorB;

            if (valor === "name") {
                valorA = $(a).find("td:eq(2) strong").text().toLowerCase();
                valorB = $(b).find("td:eq(2) strong").text().toLowerCase();
                return valorA.localeCompare(valorB);
            } else if (valor === "price_asc") {
                valorA = parseFloat($(a).find("td:eq(7)").text().replace(/[^\d.]/g, ''));
                valorB = parseFloat($(b).find("td:eq(7)").text().replace(/[^\d.]/g, ''));
                return valorA - valorB;
            } else if (valor === "price_desc") {
                valorA = parseFloat($(a).find("td:eq(7)").text().replace(/[^\d.]/g, ''));
                valorB = parseFloat($(b).find("td:eq(7)").text().replace(/[^\d.]/g, ''));
                return valorB - valorA;
            } else if (valor === "stock") {
                valorA = parseInt($(a).find("td:eq(8)").text().trim());
                valorB = parseInt($(b).find("td:eq(8)").text().trim());
                return valorA - valorB;
            }

            return 0;
        });

        $.each(filas, function (indice, fila) {
            tabla.find("tbody").append(fila);
        });

        // Actualizar paginación después del ordenamiento
        actualizarFilasVisibles();
        renderizarPagina(paginacionConfig.paginaActual);
    });

    // Limpiar modal al cerrar
    $("#detallesProductoModal").on("hidden.bs.modal", function () {
        resetFormularioDetalles();
    });

    // ✅ INICIALIZAR PAGINACIÓN AL FINAL
    inicializarPaginacion();

    console.log('✅ Inventario - Sistema completo inicializado correctamente');
});