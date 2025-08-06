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

    // ✅ REORGANIZAR BOTONES PARA MÓVILES
    reorganizarBotonesModal();

    // Mostrar el modal
    $("#detallesProductoModal").modal("show");
}
// ✅ NUEVA FUNCIÓN PARA REORGANIZAR BOTONES EN MÓVILES
function reorganizarBotonesModal() {
    const isMobile = window.innerWidth <= 767;

    if (isMobile) {
        console.log('📱 Reorganizando botones para móvil');

        // Encontrar el contenedor de botones
        const $footer = $("#detallesProductoModal .modal-footer");
        const $botonesContainer = $footer.find('.d-flex.gap-2');

        if ($botonesContainer.length > 0) {
            // Crear contenedor para botones secundarios si no existe
            if ($botonesContainer.find('.modal-botones-secundarios').length === 0) {
                const $btnAjustar = $botonesContainer.find('#btnAjustarStockVistaRapida');
                const $btnCompartir = $botonesContainer.find('.btn-group');

                if ($btnAjustar.length > 0 && $btnCompartir.length > 0) {
                    // Crear contenedor para botones secundarios
                    const $secundarios = $('<div class="modal-botones-secundarios"></div>');

                    // Mover botones al contenedor secundario
                    $btnAjustar.appendTo($secundarios);
                    $btnCompartir.appendTo($secundarios);

                    // Agregar contenedor después del botón principal
                    $botonesContainer.append($secundarios);

                    console.log('✅ Botones reorganizados para móvil');
                }
            }
        }
    }
}

// ✅ AGREGAR EVENT LISTENER PARA CAMBIOS DE ORIENTACIÓN
window.addEventListener('resize', function () {
    // Solo reorganizar si el modal está abierto
    if ($("#detallesProductoModal").hasClass('show')) {
        setTimeout(reorganizarBotonesModal, 100);
    }
});

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

// Función para procesar imágenes del producto - VERSIÓN CORREGIDA
function procesarImagenesDelProducto(imagenes) {
    const $contenedorImagenes = $("#contenedorImagenesModal");
    const $indicadores = $("#indicadoresModal");
    const $btnPrev = $("#btnPrevModal");
    const $btnNext = $("#btnNextModal");

    if (imagenes.length === 0) {
        $contenedorImagenes.html(`
            <div class="carousel-item active">
                <div class="text-center">
                    <i class="bi bi-image text-muted"></i>
                    <p class="text-muted mt-3">No hay imágenes disponibles</p>
                </div>
            </div>
        `);
    } else if (imagenes.length === 1) {
        // ✅ UNA SOLA IMAGEN - CORREGIDA
        $contenedorImagenes.html(`
            <div class="carousel-item active">
                <img src="${imagenes[0]}" 
                     class="img-fluid" 
                     alt="Imagen del producto"
                     onload="this.style.opacity=1"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                     style="opacity: 0; transition: opacity 0.3s ease;">
                <div class="text-center" style="display: none;">
                    <i class="bi bi-image text-muted"></i>
                    <p class="text-muted mt-2">Error al cargar imagen</p>
                </div>
            </div>
        `);
    } else {
        // ✅ MÚLTIPLES IMÁGENES - CORREGIDAS
        let imagenesHtml = '';
        let indicadoresHtml = '';

        imagenes.forEach((imagen, index) => {
            const activo = index === 0 ? 'active' : '';
            imagenesHtml += `
                <div class="carousel-item ${activo}">
                    <img src="${imagen}" 
                         class="img-fluid" 
                         alt="Imagen del producto ${index + 1}"
                         onload="this.style.opacity=1"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                         style="opacity: 0; transition: opacity 0.3s ease;">
                    <div class="text-center" style="display: none;">
                        <i class="bi bi-image text-muted"></i>
                        <p class="text-muted mt-2">Error al cargar imagen ${index + 1}</p>
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



//// Función para mostrar notificaciones
//function mostrarNotificacion(titulo, mensaje, tipo) {
//    const alertHtml = `
//        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
//            <strong>${titulo}:</strong> ${mensaje}
//            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
//        </div>
//    `;

//    if ($("#alertContainer").length === 0) {
//        $("body").prepend('<div id="alertContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>');
//    }

//    const $alert = $(alertHtml).appendTo("#alertContainer");
//    setTimeout(() => {
//        $alert.alert('close');
//    }, 5000);
//}

// ========================================
// ✅ NUEVAS FUNCIONES DE AJUSTE DE STOCK
// ========================================

/**
 * Valida completamente el formulario de ajuste de stock
 * @returns {boolean} True si es válido, False si hay errores
 */
function validarFormularioAjusteCompleto() {
    console.log('🔍 === VALIDANDO FORMULARIO COMPLETO ===');

    let esValido = true;

    // Limpiar validaciones anteriores
    $("#ajusteStockForm .form-control").removeClass('is-invalid is-valid');
    $(".validation-feedback").remove();

    // Validar ProductoId
    const productoId = $("#productoId").val();
    if (!productoId || productoId <= 0) {
        console.error('❌ ProductoId inválido:', productoId);
        mostrarAlertaSimple('Error: No se pudo identificar el producto', 'danger');
        return false;
    }

    // Validar tipo de ajuste
    const tipoAjuste = $("#tipoAjuste").val();
    if (!tipoAjuste || !['entrada', 'salida', 'ajuste'].includes(tipoAjuste)) {
        console.error('❌ Tipo de ajuste inválido:', tipoAjuste);
        $("#tipoAjuste").addClass('is-invalid');
        agregarMensajeValidacion("#tipoAjuste", "Debe seleccionar un tipo de ajuste válido");
        esValido = false;
    } else {
        $("#tipoAjuste").addClass('is-valid');
    }

    // Validar cantidad
    const cantidad = $("#cantidad").val();
    const cantidadNum = parseInt(cantidad);

    if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
        console.error('❌ Cantidad inválida:', cantidad);
        $("#cantidad").addClass('is-invalid');
        agregarMensajeValidacion("#cantidad", "La cantidad debe ser un número mayor a cero");
        esValido = false;
    } else {
        // Validación específica para salidas
        if (tipoAjuste === 'salida') {
            const stockActual = parseInt($("#ajusteStockForm").data('stock-actual')) || 0;
            if (cantidadNum > stockActual) {
                console.warn('⚠️ Salida excede stock disponible');
                $("#cantidad").addClass('is-invalid');
                agregarMensajeValidacion("#cantidad", `La cantidad no puede ser mayor al stock disponible (${stockActual})`);
                esValido = false;
            } else {
                $("#cantidad").addClass('is-valid');
            }
        } else {
            $("#cantidad").addClass('is-valid');
        }
    }

    // Validar comentario (opcional pero con límite de caracteres)
    const comentario = $("#comentario").val();
    if (comentario && comentario.length > 500) {
        console.error('❌ Comentario muy largo:', comentario.length);
        $("#comentario").addClass('is-invalid');
        agregarMensajeValidacion("#comentario", "El comentario no puede exceder 500 caracteres");
        esValido = false;
    } else {
        $("#comentario").addClass('is-valid');
    }

    console.log(`🔍 Resultado validación: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'}`);

    // Marcar formulario como validado
    $("#ajusteStockForm").addClass('was-validated');

    return esValido;
}

/**
 * Agrega mensaje de validación a un campo específico
 * @param {string} selector - Selector del campo
 * @param {string} mensaje - Mensaje de error
 */
function agregarMensajeValidacion(selector, mensaje) {
    // Remover mensaje anterior si existe
    $(selector).siblings('.invalid-feedback').remove();

    // Crear nuevo mensaje
    const $mensaje = $(`<div class="invalid-feedback">${mensaje}</div>`);

    // Agregar después del campo
    $(selector).after($mensaje);
}

/**
 * Función para limpiar el formulario de ajuste
 */
function limpiarFormularioAjuste() {
    $("#ajusteStockForm")[0].reset();
    $("#ajusteStockForm").removeClass('was-validated');
    $("#tipoAjuste, #cantidad, #comentario").removeClass('is-invalid is-valid');
    $("#vistaPrevia").hide();
    $("#infoProductoAjuste").hide();
    $("#guardarAjusteBtn").prop('disabled', false);

    // Resetear estados visuales del botón
    const $btnGuardar = $("#guardarAjusteBtn");
    $btnGuardar.find('.normal-state').show();
    $btnGuardar.find('.loading-state').hide();
}

/**
 * Función para cargar información del producto en el modal
 */
function cargarInformacionProductoEnModal(productoId, $fila) {
    console.log('📋 Cargando información del producto en modal...');

    // Limpiar formulario
    limpiarFormularioAjuste();

    // Establecer ID del producto
    $("#productoId").val(productoId);

    // Extraer información de la fila
    const nombre = $fila.find("td:eq(2) strong").text().trim() || "Producto sin nombre";
    const stockActualTexto = $fila.find("td:eq(8)").text().trim();
    const stockActual = parseInt(stockActualTexto.split(' ')[0].replace(/[^\d]/g, '')) || 0;

    console.log('📋 Datos extraídos:', { nombre, stockActual });

    // Mostrar información en el modal
    $("#nombreProductoAjuste").text(nombre);
    $("#stockActualAjuste").text(stockActual);
    $("#infoProductoAjuste").show();

    // Guardar stock actual para validaciones
    $("#ajusteStockForm").data('stock-actual', stockActual);

    console.log('✅ Información del producto cargada en modal');
}

/**
 * Función para actualizar vista previa del ajuste
 */
function actualizarVistaPrevia() {
    const tipoAjuste = $("#tipoAjuste").val();
    const cantidad = parseInt($("#cantidad").val()) || 0;
    const stockActual = parseInt($("#ajusteStockForm").data('stock-actual')) || 0;

    if (!tipoAjuste || cantidad <= 0) {
        $("#vistaPrevia").hide();
        return;
    }

    let stockNuevo = stockActual;
    let operacion = '';
    let colorOperacion = 'text-primary';
    let colorResultado = 'text-success';

    switch (tipoAjuste) {
        case 'entrada':
            stockNuevo = stockActual + cantidad;
            operacion = `+${cantidad}`;
            colorOperacion = 'text-success';
            break;
        case 'salida':
            stockNuevo = Math.max(0, stockActual - cantidad);
            operacion = `-${cantidad}`;
            colorOperacion = 'text-danger';
            if (stockActual < cantidad) {
                colorResultado = 'text-warning';
            }
            break;
        case 'ajuste':
            stockNuevo = cantidad;
            operacion = `=${cantidad}`;
            colorOperacion = 'text-info';
            break;
    }

    // Actualizar vista previa
    $("#stockActualPreview").text(stockActual);
    $("#operacionPreview").text(operacion).attr('class', `h5 mb-1 ${colorOperacion}`);
    $("#stockNuevoPreview").text(stockNuevo).attr('class', `h5 mb-1 ${colorResultado}`);

    // Mostrar vista previa
    $("#vistaPrevia").show();

    // Validar si es una salida que excede el stock
    if (tipoAjuste === 'salida' && cantidad > stockActual) {
        $("#cantidad").addClass('is-invalid');
        mostrarMensajeValidacion("La cantidad de salida excede el stock disponible", "warning");
    } else {
        $("#cantidad").removeClass('is-invalid').addClass('is-valid');
    }
}

/**
 * Función para mostrar mensajes de validación
 */
function mostrarMensajeValidacion(mensaje, tipo) {
    // Remover mensajes anteriores
    $(".validation-feedback").remove();

    // Crear nuevo mensaje
    const claseColor = tipo === 'warning' ? 'text-warning' : tipo === 'danger' ? 'text-danger' : 'text-info';
    const $mensaje = $(`<div class="validation-feedback d-block ${claseColor}"><small>${mensaje}</small></div>`);

    // Agregar después del campo cantidad
    $("#cantidad").after($mensaje);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
        $mensaje.fadeOut(() => $mensaje.remove());
    }, 3000);
}

/**
 * Procesa la respuesta exitosa del ajuste y actualiza la interfaz
 * VERSIÓN CORREGIDA - Sin duplicación de notificaciones
 * @param {Object} datos - Datos de la respuesta del servidor
 */
function procesarAjusteExitoso(datos) {
    console.log('🎉 === PROCESANDO AJUSTE EXITOSO ===');
    console.log('🎉 Datos recibidos:', datos);

    try {
        // ✅ VALIDAR QUE TENEMOS LOS DATOS NECESARIOS
        if (!datos || typeof datos !== 'object') {
            console.error('❌ Datos inválidos recibidos:', datos);
            mostrarNotificacion('Ajuste completado, pero no se recibieron datos válidos del servidor', 'warning');
            return;
        }

        // ✅ EXTRAER INFORMACIÓN CON VALORES POR DEFECTO
        const {
            productoId = null,
            nombreProducto = 'Producto',
            stockAnterior = 0,
            stockNuevo = 0,
            diferencia = 0,
            tipoAjuste = 'ajuste',
            stockBajo = false,
            stockMinimo = 0
        } = datos;

        console.log('📊 Datos extraídos:', {
            productoId, nombreProducto, stockAnterior, stockNuevo, diferencia, stockBajo
        });

        // ✅ ACTUALIZAR LA FILA EN LA TABLA (CON MANEJO DE ERRORES)
        if (productoId) {
            try {
                actualizarFilaProductoEnTabla(productoId, stockNuevo, stockBajo, stockMinimo);
                console.log('✅ Fila actualizada correctamente en la tabla');
            } catch (filaError) {
                console.warn('⚠️ Error al actualizar fila, pero continuando:', filaError);
            }
        } else {
            console.warn('⚠️ No se recibió ProductoId válido, omitiendo actualización de fila');
        }

        // ✅ MOSTRAR NOTIFICACIÓN PRINCIPAL DE ÉXITO (SOLO UNA)
        const signo = diferencia >= 0 ? '+' : '';
        const mensaje = `Stock actualizado: ${stockAnterior} → ${stockNuevo} (${signo}${diferencia})`;

        console.log('📢 Mostrando notificación principal:', mensaje);
        mostrarNotificacion(mensaje, 'success');

        // ✅ ACTUALIZAR CONTADORES GENERALES (CON MANEJO DE ERRORES)
        try {
            // Verificar que las funciones existen antes de llamarlas
            if (typeof actualizarContadoresTabla === 'function') {
                actualizarContadoresTabla();
                console.log('✅ Contadores actualizados');
            } else if (typeof actualizarContadores === 'function') {
                actualizarContadores();
                console.log('✅ Contadores actualizados (método alternativo)');
            } else {
                console.warn('⚠️ Funciones de actualización de contadores no encontradas');
            }
        } catch (contadorError) {
            console.warn('⚠️ Error al actualizar contadores, pero continuando:', contadorError);
        }

        // ✅ MOSTRAR ADVERTENCIAS ADICIONALES SOLO SI ES NECESARIO
        // (Con delay para evitar sobrecargar al usuario)
        if (stockBajo && stockNuevo > 0) {
            setTimeout(() => {
                const advertencia = `⚠️ ${nombreProducto} quedó con stock bajo (${stockNuevo} ≤ ${stockMinimo})`;
                console.log('📢 Mostrando advertencia de stock bajo:', advertencia);
                mostrarNotificacion(advertencia, 'warning');
            }, 2500); // 2.5 segundos después
        } else if (stockNuevo === 0) {
            setTimeout(() => {
                const critico = `🚨 ${nombreProducto} quedó SIN STOCK`;
                console.log('📢 Mostrando alerta crítica:', critico);
                mostrarNotificacion(critico, 'danger');
            }, 2500); // 2.5 segundos después
        }

        console.log('✅ === PROCESAMIENTO COMPLETADO EXITOSAMENTE ===');

    } catch (error) {
        console.error('❌ Error específico al procesar ajuste exitoso:', error);
        console.error('❌ Stack trace:', error.stack);

        // ✅ MOSTRAR UNA NOTIFICACIÓN MÁS ESPECÍFICA
        const mensajeError = `Error al actualizar la interfaz: ${error.message || 'Error desconocido'}. Considere recargar la página.`;
        mostrarNotificacion(mensajeError, 'warning');
    }
}

/**
 * Actualiza una fila específica en la tabla con el nuevo stock
 * @param {number} productoId - ID del producto
 * @param {number} stockNuevo - Nuevo stock
 * @param {boolean} stockBajo - Si está en stock bajo
 * @param {number} stockMinimo - Stock mínimo
 */
function actualizarFilaProductoEnTabla(productoId, stockNuevo, stockBajo, stockMinimo) {
    console.log(`🔄 Actualizando fila del producto ${productoId} con stock ${stockNuevo}`);

    // Encontrar la fila del producto
    const $fila = $(`tr[data-id="${productoId}"]`);

    if ($fila.length === 0) {
        console.warn('⚠️ No se encontró la fila del producto en la tabla');
        return;
    }

    // Actualizar celda de stock (columna 8, índice 8)
    const $celdaStock = $fila.find('td:eq(8)');
    const $spanStock = $celdaStock.find('span');

    if ($spanStock.length > 0) {
        // Actualizar el texto del stock
        $spanStock.text(stockNuevo);

        // Actualizar clases de estilo
        $spanStock.removeClass('text-danger fw-bold');
        if (stockBajo) {
            $spanStock.addClass('text-danger fw-bold');
        }

        // Manejar icono de advertencia
        const $icono = $spanStock.find('i.bi-exclamation-triangle-fill');
        if (stockBajo && $icono.length === 0) {
            $spanStock.append('<i class="bi bi-exclamation-triangle-fill ms-1" data-bs-toggle="tooltip" title="Stock bajo"></i>');
        } else if (!stockBajo && $icono.length > 0) {
            $icono.remove();
        }
    } else {
        // Si no tiene la estructura esperada, actualizar directamente
        $celdaStock.html(stockBajo ?
            `<span class="text-danger fw-bold">${stockNuevo} <i class="bi bi-exclamation-triangle-fill ms-1" data-bs-toggle="tooltip" title="Stock bajo"></i></span>` :
            `<span>${stockNuevo}</span>`
        );
    }

    // Actualizar clase de la fila completa
    if (stockBajo) {
        $fila.addClass('table-danger');
    } else {
        $fila.removeClass('table-danger');
    }

    // Efecto visual de actualización
    $celdaStock.addClass('bg-success text-white').animate({ opacity: 0.7 }, 200).animate({ opacity: 1 }, 200, function () {
        setTimeout(() => {
            $celdaStock.removeClass('bg-success text-white');
        }, 1000);
    });

    console.log('✅ Fila actualizada correctamente');
}

/**
 * Muestra una alerta al usuario usando diferentes métodos disponibles
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta: success, danger, warning, info
 */
//function mostrarAlertaSimple(mensaje, tipo) {
//    console.log(`🔔 Mostrando alerta: [${tipo}] ${mensaje}`);

//    // Método 1: Si toastr está disponible (recomendado)
//    if (typeof toastr !== 'undefined') {
//        console.log('✅ Usando toastr para mostrar alerta');
//        const tipoToastr = tipo === 'danger' ? 'error' : tipo;
//        toastr[tipoToastr](mensaje);
//        return;
//    }

//    // Método 2: Si SweetAlert está disponible
//    if (typeof Swal !== 'undefined') {
//        console.log('✅ Usando SweetAlert para mostrar alerta');
//        const iconoSwal = tipo === 'danger' ? 'error' : tipo === 'warning' ? 'warning' : tipo === 'success' ? 'success' : 'info';
//        Swal.fire({
//            icon: iconoSwal,
//            title: tipo === 'success' ? '¡Éxito!' : tipo === 'danger' ? 'Error' : 'Información',
//            text: mensaje,
//            timer: tipo === 'success' ? 3000 : 5000,
//            showConfirmButton: false
//        });
//        return;
//    }

//    // Método 3: Crear alerta Bootstrap personalizada
//    console.log('✅ Usando alertas Bootstrap personalizadas');
//    crearAlertaBootstrap(mensaje, tipo);
//}

///**
// * Crea una alerta Bootstrap personalizada
// * @param {string} mensaje - Mensaje a mostrar
// * @param {string} tipo - Tipo de alerta Bootstrap
// */
//function crearAlertaBootstrap(mensaje, tipo) {
//    // Determinar el color Bootstrap
//    const colorBootstrap = tipo === 'danger' ? 'danger' :
//        tipo === 'success' ? 'success' :
//            tipo === 'warning' ? 'warning' : 'info';

//    // Determinar el icono
//    const icono = tipo === 'success' ? 'bi-check-circle' :
//        tipo === 'danger' ? 'bi-exclamation-triangle' :
//            tipo === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';

//    // Crear ID único para la alerta
//    const alertId = 'alert-' + Date.now();

//    // HTML de la alerta
//    const alertHtml = `
//        <div id="${alertId}" class="alert alert-${colorBootstrap} alert-dismissible fade show shadow-sm"
//             style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 350px; max-width: 500px;"
//             role="alert">
//            <div class="d-flex align-items-center">
//                <i class="bi ${icono} me-2" style="font-size: 1.2rem;"></i>
//                <div class="flex-grow-1">
//                    ${mensaje}
//                </div>
//                <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
//            </div>
//        </div>
//    `;

//    // Agregar al DOM
//    $('body').append(alertHtml);

//    // Auto-remover después de 5 segundos (8 segundos para errores)
//    const timeout = tipo === 'danger' ? 8000 : 5000;
//    setTimeout(() => {
//        $(`#${alertId}`).fadeOut(300, function () {
//            $(this).remove();
//        });
//    }, timeout);

//    console.log(`✅ Alerta Bootstrap creada con ID: ${alertId}`);
//}

// ========================================
// ✅ FUNCIÓN ÚNICA DE NOTIFICACIONES CORREGIDA
// ========================================

/**
 * Función principal para mostrar notificaciones - VERSIÓN CORREGIDA
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo: success, danger, warning, info
 * @param {string} titulo - Título opcional
 */
function mostrarNotificacion(mensaje, tipo = 'info', titulo = '') {
    console.log(`🔔 [NOTIFICACIÓN] Tipo: ${tipo}, Mensaje: ${mensaje}`);

    try {
        // Prevenir múltiples notificaciones del mismo mensaje
        if (window.ultimaNotificacion === mensaje && Date.now() - window.ultimaNotificacionTiempo < 2000) {
            console.log('🚫 Notificación duplicada bloqueada');
            return;
        }

        window.ultimaNotificacion = mensaje;
        window.ultimaNotificacionTiempo = Date.now();

        // ✅ VERIFICAR SI TOASTR ESTÁ DISPONIBLE
        if (typeof toastr !== 'undefined' && toastr !== null) {
            console.log('✅ Usando Toastr');

            // ✅ CONFIGURAR TOASTR
            toastr.options = {
                "closeButton": true,
                "progressBar": true,
                "positionClass": "toast-top-right",
                "timeOut": tipo === 'success' ? "4000" : "6000",
                "preventDuplicates": true
            };

            // Convertir tipo 'danger' a 'error' para Toastr
            const tipoToastr = tipo === 'danger' ? 'error' : tipo;

            // Verificar que el método existe y ejecutar
            if (typeof toastr[tipoToastr] === 'function') {
                toastr[tipoToastr](mensaje);
                return;
            }
        }

        // ✅ FALLBACK con SweetAlert si está disponible
        if (typeof Swal !== 'undefined' && typeof Swal.fire === 'function') {
            console.log('✅ Usando SweetAlert como fallback');
            const icono = tipo === 'danger' ? 'error' : tipo === 'warning' ? 'warning' : tipo === 'success' ? 'success' : 'info';
            Swal.fire({
                icon: icono,
                title: titulo || (tipo === 'success' ? '¡Éxito!' : tipo === 'danger' ? 'Error' : 'Información'),
                text: mensaje,
                timer: 3000,
                showConfirmButton: false
            });
            return;
        }

        // ✅ FALLBACK final con Bootstrap Alert
        crearAlertaBootstrap(mensaje, tipo, titulo);

    } catch (error) {
        console.error('❌ Error en mostrarNotificacion:', error);
        // Fallback de emergencia
        alert('Notificación: ' + mensaje);
    }
}
/**
 * Función de compatibilidad con el formato anterior
 * @param {string} titulo - Título
 * @param {string} mensaje - Mensaje  
 * @param {string} tipo - Tipo
 */
function mostrarNotificacionLegacy(titulo, mensaje, tipo) {
    mostrarNotificacion(mensaje, tipo, titulo);
}

/**
 * Función de compatibilidad con formato simple
 * @param {string} mensaje - Mensaje
 * @param {string} tipo - Tipo
 */
function mostrarAlertaSimple(mensaje, tipo) {
    mostrarNotificacion(mensaje, tipo);
}


/**
 * Función para crear alertas Bootstrap personalizadas
 * SOLO se usa como fallback cuando no hay Toastr o SweetAlert
 */
function crearAlertaBootstrap(mensaje, tipo, titulo = '') {
    const colorBootstrap = {
        'success': 'success',
        'danger': 'danger',
        'warning': 'warning',
        'info': 'info'
    }[tipo] || 'info';

    const icono = {
        'success': 'bi-check-circle',
        'danger': 'bi-exclamation-triangle',
        'warning': 'bi-exclamation-triangle',
        'info': 'bi-info-circle'
    }[tipo] || 'bi-info-circle';

    const alertId = 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const mensajeCompleto = titulo ? `<strong>${titulo}:</strong> ${mensaje}` : mensaje;

    const alertHtml = `
    <div id="${alertId}" class="alert alert-${colorBootstrap} alert-dismissible fade show shadow-sm" 
         style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 350px; max-width: 500px;" 
         role="alert">
        <div class="d-flex align-items-center">
            <i class="bi ${icono} me-2" style="font-size: 1.2rem;"></i>
            <div class="flex-grow-1">
                ${mensajeCompleto}
            </div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    </div>
`;

    // Verificar que no existe ya una alerta con el mismo mensaje
    if ($(`div[role="alert"]:contains("${mensaje.substring(0, 20)}")`).length > 0) {
        console.log('🚫 Alerta Bootstrap duplicada bloqueada');
        return;
    }

    $('body').append(alertHtml);

    // Auto-remover
    setTimeout(() => {
        $(`#${alertId}`).fadeOut(300, function () {
            $(this).remove();
        });
    }, tipo === 'danger' ? 8000 : 5000);

    console.log(`✅ Alerta Bootstrap creada: ${alertId}`);
}

/**
 * Función principal para ejecutar el ajuste de stock
 */
function ejecutarAjusteStock(productoId, tipoAjuste, cantidad, comentario) {
    console.log('🚀 === EJECUTANDO AJUSTE DE STOCK ===');

    const $btnGuardar = $("#guardarAjusteBtn");
    const $normalState = $btnGuardar.find('.normal-state');
    const $loadingState = $btnGuardar.find('.loading-state');

    // Mostrar estado de carga
    $btnGuardar.prop('disabled', true);
    $normalState.hide();
    $loadingState.show();

    // Preparar datos para envío
    const datosAjuste = {
        TipoAjuste: tipoAjuste.toLowerCase(),
        Cantidad: cantidad,
        Comentario: comentario || null
    };

    console.log('📡 Enviando petición AJAX...');
    console.log('📡 URL:', `/Inventario/AjustarStock/${productoId}`);
    console.log('📡 Datos:', datosAjuste);

    // Obtener token anti-forgery
    const token = $('input[name="__RequestVerificationToken"]').val();

    // Realizar petición AJAX
    $.ajax({
        url: `/Inventario/AjustarStock/${productoId}`,
        type: 'POST',
        contentType: 'application/json',
        headers: {
            'RequestVerificationToken': token
        },
        data: JSON.stringify(datosAjuste),
        dataType: 'json',
        success: function (response) {
            console.log('📡 === RESPUESTA RECIBIDA ===');
            console.log('📡 Response:', response);

            // Rehabilitar botón
            $btnGuardar.prop('disabled', false);
            $normalState.show();
            $loadingState.hide();

            if (response.success) {
                console.log('✅ Ajuste exitoso');
                procesarAjusteExitoso(response.data);
                $("#ajusteStockModal").modal("hide");
            } else {
                console.error('❌ Error en ajuste:', response.message);
            }
        },
        error: function (xhr, status, error) {
            console.error('❌ === ERROR EN PETICIÓN ===');
            console.error('❌ Status:', status);
            console.error('❌ Error:', error);
            console.error('❌ Response:', xhr.responseText);

            // Rehabilitar botón
            $btnGuardar.prop('disabled', false);
            $normalState.show();
            $loadingState.hide();

            // Manejar errores específicos
            let mensajeError = 'Error desconocido al ajustar stock';

            if (xhr.status === 401) {
                mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
            } else if (xhr.status === 403) {
                mensajeError = 'No tiene permisos para ajustar stock.';
            } else if (xhr.responseText) {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    mensajeError = errorResponse.message || mensajeError;
                } catch (e) {
                    mensajeError = `Error ${xhr.status}: ${error}`;
                }
            }

            mostrarAlertaSimple(mensajeError, 'danger');
        }
    });
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

    console.log('🚀 Inventario - Inicializando ajuste de stock');

    // ✅ EVENTO PARA ABRIR MODAL DE AJUSTE
    $(document).on('click', '.ajuste-stock-btn', function (e) {
        console.log('📦 === ABRIENDO MODAL AJUSTE STOCK ===');

        e.preventDefault();
        e.stopPropagation();

        const $boton = $(this);
        const productoId = $boton.data("id");
        const $fila = $boton.closest('tr');

        console.log('📦 Producto ID:', productoId);

        if (!productoId) {
            console.error('❌ No se pudo obtener el ProductoId');
            mostrarAlertaSimple("Error: No se pudo identificar el producto", "danger");
            return;
        }

        // Cargar información del producto desde la fila
        cargarInformacionProductoEnModal(productoId, $fila);

        // Mostrar el modal
        $("#ajusteStockModal").modal("show");
    });

    // ✅ EVENTOS PARA ACTUALIZAR VISTA PREVIA
    $("#tipoAjuste, #cantidad").on('change input', function () {
        actualizarVistaPrevia();
    });

    // ✅ EVENTO PRINCIPAL PARA GUARDAR EL AJUSTE
    $("#guardarAjusteBtn").off('click').on('click', function () {
        console.log('💾 === INICIANDO GUARDADO DE AJUSTE ===');

        // Validar formulario
        if (!validarFormularioAjusteCompleto()) {
            console.log('❌ Validación del formulario falló');
            return;
        }

        // Obtener datos del formulario
        const productoId = $("#productoId").val();
        const tipoAjuste = $("#tipoAjuste").val();
        const cantidad = parseInt($("#cantidad").val());
        const comentario = $("#comentario").val().trim();

        console.log('📦 Datos a enviar:', { productoId, tipoAjuste, cantidad, comentario });

        // Ejecutar ajuste
        ejecutarAjusteStock(productoId, tipoAjuste, cantidad, comentario);
    });

    // ✅ LIMPIAR MODAL CUANDO SE CIERRA
    $("#ajusteStockModal").on('hidden.bs.modal', function () {
        console.log('🧹 Limpiando modal de ajuste al cerrar...');
        limpiarFormularioAjuste();
    });

    // ✅ LIMPIAR VALIDACIONES AL CAMBIAR VALORES
    $("#tipoAjuste").on('change', function () {
        $(this).removeClass('is-invalid');
        $(this).siblings('.invalid-feedback').remove();
    });

    $("#cantidad").on('input', function () {
        $(this).removeClass('is-invalid');
        $(this).siblings('.invalid-feedback').remove();
    });

    $("#comentario").on('input', function () {
        $(this).removeClass('is-invalid');
        $(this).siblings('.invalid-feedback').remove();
    });

    console.log('✅ Sistema de ajuste de stock inicializado correctamente');
    console.log('🚀 Inventario - Sistema completo');

    // ✅ LIMPIAR EVENTOS PREVIOS
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

    // ✅ EVENTO MEJORADO PARA IMAGEN MINIATURA -> MODAL
    $(document).on('click', 'td:has(.producto-img-container)', function (e) {
        console.log('🖼️ === CLICK EN IMAGEN ===');

        // ✅ VERIFICAR QUE NO SE HIZO CLICK EN BOTONES
        if ($(e.target).closest('button, .btn, .sortable, a').length > 0) {
            console.log('🚫 Click interceptado por otro elemento, ignorando...');
            return; // No hacer nada si se clickeó un botón
        }

        e.preventDefault();
        e.stopPropagation();

        const $fila = $(this).closest('tr[data-id]');
        const productoId = $fila.attr('data-id');

        console.log('🖼️ Abriendo modal para Producto ID:', productoId);

        if (productoId && typeof cargarDetallesProducto === 'function') {
            cargarDetallesProducto(productoId);
        } else {
            console.error('❌ ProductoId inválido o función no disponible');
        }
    });

    // ✅ EVENTO MEJORADO PARA BOTÓN OJO -> PÁGINA DE DETALLES
    $(document).on('click', '.ver-detalles-btn', function (e) {
        console.log('👁️ === CLICK EN BOTÓN VER DETALLES ===');

        // ✅ PREVENIR COMPORTAMIENTOS NO DESEADOS
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const productoId = $(this).data("id");
        console.log('📋 ProductoId obtenido:', productoId);

        if (!productoId) {
            console.error('❌ No se pudo obtener el ProductoId');
            return;
        }

        try {
            const url = `/Inventario/DetalleProducto/${productoId}`;
            console.log('🌐 Navegando a:', url);

            // ✅ NAVEGACIÓN DIRECTA SIN AJAX
            window.location.href = url;

        } catch (error) {
            console.error('❌ Error en navegación:', error);
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
        console.log('📦 === ABRIENDO MODAL AJUSTE DESDE DETALLE ===');

        const productoId = $("#productoId").val() || $(this).data("id");
        console.log('📦 Producto ID desde detalle:', productoId);

        if (!productoId) {
            console.error('❌ No se pudo obtener el ProductoId desde detalle');
            mostrarAlertaSimple("Error: No se pudo identificar el producto", "danger");
            return;
        }

        // ✅ ENCONTRAR LA FILA DEL PRODUCTO EN LA TABLA
        const $fila = $(`tr[data-id="${productoId}"]`);

        if ($fila.length === 0) {
            console.error('❌ No se encontró la fila del producto en la tabla');
            mostrarAlertaSimple("Error: No se pudo encontrar el producto en la tabla", "danger");
            return;
        }

        // ✅ CARGAR INFORMACIÓN DEL PRODUCTO
        cargarInformacionProductoEnModal(productoId, $fila);

        $("#detallesProductoModal").modal("hide");
        setTimeout(() => {
            $("#ajusteStockModal").modal("show");
        }, 500);
    });



    // ========================================
    // EVENTOS PARA ELIMINAR PRODUCTO
    // ========================================
    // ========================================
    // FUNCIÓN MEJORADA PARA OBTENER NOMBRE DEL PRODUCTO
    // También reemplazar esta parte en el evento click
    // ========================================

    $(document).on('click', '.eliminar-producto-btn', function (e) {
        console.log('🗑️ === CLICK DETECTADO EN BOTÓN ELIMINAR ===');

        e.preventDefault();
        e.stopPropagation();

        const $boton = $(this);
        const productoId = $boton.data("id");
        const $fila = $boton.closest('tr');

        // ✅ MEJORAR: Buscar el nombre del producto más específicamente
        let nombreProducto = '';

        // Intentar diferentes selectores para encontrar el nombre
        const $nombreCelda = $fila.find('td:eq(2)'); // Tercera columna (índice 2)

        if ($nombreCelda.find('strong').length > 0) {
            nombreProducto = $nombreCelda.find('strong').text().trim();
        } else if ($nombreCelda.find('a').length > 0) {
            nombreProducto = $nombreCelda.find('a').text().trim();
        } else {
            nombreProducto = $nombreCelda.text().trim();
        }

        // Si aún no tenemos nombre, usar un fallback
        if (!nombreProducto) {
            nombreProducto = `Producto ID: ${productoId}`;
        }

        console.log('🗑️ Datos obtenidos:');
        console.log('   - Producto ID:', productoId);
        console.log('   - Nombre:', nombreProducto);
        console.log('   - Tipo ID:', typeof productoId);
        console.log('   - Fila encontrada:', $fila.length > 0);
        console.log('   - Celda nombre:', $nombreCelda.html());

        // Validaciones
        if (!productoId) {
            console.error('❌ No se pudo obtener el ID del producto');
            mostrarAlertaSimple("Error: No se pudo identificar el producto", "danger");
            return;
        }

        console.log('✅ Validaciones pasadas, mostrando modal...');

        // Mostrar modal de confirmación
        mostrarModalConfirmacionEliminacion(productoId, nombreProducto, $fila);
    });


    // Función para mostrar modal de confirmación de eliminación
    function mostrarModalConfirmacionEliminacion(productoId, nombreProducto, $fila) {
        const modalHtml = `
        <div class="modal fade" id="modalEliminarProducto" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Confirmar Eliminación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="bi bi-trash text-danger" style="font-size: 3rem;"></i>
                        </div>
                        <h6 class="text-center mb-3">¿Está seguro de que desea eliminar este producto?</h6>
                        <div class="alert alert-warning">
                            <strong>Producto:</strong> ${nombreProducto}<br>
                            <strong>ID:</strong> ${productoId}
                        </div>
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>¡Atención!</strong> Esta acción es <strong>irreversible</strong>. 
                            Se eliminarán todas las imágenes y datos asociados.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-lg me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" id="btnConfirmarEliminacion">
                            <span class="normal-state">
                                <i class="bi bi-trash me-2"></i>Eliminar Producto
                            </span>
                            <span class="loading-state" style="display: none;">
                                <span class="spinner-border spinner-border-sm me-2"></span>
                                Eliminando...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

        // Remover modal anterior si existe
        $('#modalEliminarProducto').remove();

        // Agregar nuevo modal al DOM
        $('body').append(modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalEliminarProducto'));
        modal.show();

        // Evento para confirmar eliminación
        $('#btnConfirmarEliminacion').off('click').on('click', function () {
            ejecutarEliminacionProducto(productoId, nombreProducto, $fila);
        });
    }

    // ========================================
    // FUNCIÓN ACTUALIZADA PARA EJECUTAR ELIMINACIÓN
    // Reemplazar la función ejecutarEliminacionProducto en inventario.js
    // ========================================

    function ejecutarEliminacionProducto(productoId, nombreProducto, $fila) {
        console.log('💥 === EJECUTANDO ELIMINACIÓN ===');
        console.log('💥 Producto ID:', productoId);
        console.log('💥 Nombre:', nombreProducto);

        const $btnConfirmar = $('#btnConfirmarEliminacion');
        const $normalState = $btnConfirmar.find('.normal-state');
        const $loadingState = $btnConfirmar.find('.loading-state');

        // Mostrar estado de carga
        $btnConfirmar.prop('disabled', true);
        $normalState.hide();
        $loadingState.show();

        // Realizar petición AJAX con manejo mejorado
        $.ajax({
            url: `/Inventario/EliminarProducto/${productoId}`,
            type: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            dataType: 'json', // ✅ NUEVO: Especificar que esperamos JSON
            success: function (response) {
                console.log('📡 === RESPUESTA RECIBIDA ===');
                console.log('📡 Response completo:', response);
                console.log('📡 Success:', response.success);
                console.log('📡 Message:', response.message);

                // Cerrar modal
                $('#modalEliminarProducto').modal('hide');

                // Verificar si la eliminación fue exitosa
                if (response.success) {
                    console.log('✅ === ELIMINACIÓN EXITOSA ===');

                    // Mostrar notificación de éxito
                    mostrarAlertaSimple(response.message || `Producto "${nombreProducto}" eliminado exitosamente`, "success");

                    // Animar y remover la fila
                    $fila.addClass('table-danger');
                    $fila.fadeOut(800, function () {
                        $fila.remove();
                        actualizarContadoresTabla();

                        // Actualizar paginación si está disponible
                        if (typeof actualizarFilasVisibles === 'function') {
                            actualizarFilasVisibles();
                            renderizarPagina(paginacionConfig.paginaActual);
                        }

                        console.log('🗑️ Fila removida del DOM');
                    });
                } else {
                    console.error('❌ El servidor reportó un error:', response.message);

                    // Rehabilitar botón
                    $btnConfirmar.prop('disabled', false);
                    $normalState.show();
                    $loadingState.hide();

                    mostrarAlertaSimple(response.message || 'Error al eliminar el producto', "danger");
                }
            },
            error: function (xhr, status, error) {
                console.error('❌ === ERROR EN PETICIÓN AJAX ===');
                console.error('❌ Status:', status);
                console.error('❌ Error:', error);
                console.error('❌ Status Code:', xhr.status);
                console.error('❌ Response Text:', xhr.responseText);

                // Rehabilitar botón
                $btnConfirmar.prop('disabled', false);
                $normalState.show();
                $loadingState.hide();

                // Manejar diferentes tipos de error
                let mensajeError = 'Error desconocido';

                if (xhr.status === 404) {
                    mensajeError = 'Función de eliminación no encontrada. Contacte al administrador.';
                } else if (xhr.status === 403) {
                    mensajeError = 'No tiene permisos para eliminar productos.';
                } else if (xhr.status === 401) {
                    mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
                } else if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        mensajeError = errorResponse.message || errorResponse.error || 'Error del servidor';
                    } catch (e) {
                        mensajeError = `Error ${xhr.status}: ${error}`;
                    }
                } else {
                    mensajeError = `Error ${xhr.status}: ${error}`;
                }

                mostrarAlertaSimple(`Error al eliminar: ${mensajeError}`, "danger");
            }
        });
    }



    // Eventos para compartir desde el modal
    $("#btnCompartirWhatsApp").click(function (e) {
        e.preventDefault();
        compartirPorWhatsApp();
    });

    $("#btnCompartirEmail").click(function (e) {
        e.preventDefault();
        compartirPorEmail();
    });



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

    // ✅ EVENTOS PARA EL MODAL DE WHATSAPP
    $("#btnEnviarWhatsApp").click(function() {
        enviarProductoPorWhatsApp();
    });

    $("#numeroWhatsApp").on('input', function() {
        // Limpiar caracteres no numéricos
        let numero = $(this).val().replace(/\D/g, '');

        // Limitar a 8 dígitos
        if (numero.length > 8) {
            numero = numero.substring(0, 8);
        }

        $(this).val(numero);

        // Validar y actualizar estado del botón
        const esValido = numero.length === 8;
        $("#btnEnviarWhatsApp").prop('disabled', !esValido);

        if (numero.length === 8) {
            $(this).removeClass('is-invalid').addClass('is-valid');
        } else if (numero.length > 0) {
            $(this).removeClass('is-valid').addClass('is-invalid');
        } else {
            $(this).removeClass('is-valid is-invalid');
        }
    });

    // Limpiar modal al cerrar
    $("#modalWhatsAppNumero").on('hidden.bs.modal', function() {
        $("#numeroWhatsApp").val('').removeClass('is-valid is-invalid');
        $("#incluirImagen").prop('checked', true);
        $("#btnEnviarWhatsApp").prop('disabled', true);
        const $btn = $("#btnEnviarWhatsApp");
        $btn.find('.normal-state').show();
        $btn.find('.loading-state').hide();
    });

    // ========================================
    // ✅ FUNCIÓN UNIFICADA DE NOTIFICACIONES
    // Reemplazar TODAS las funciones de notificación existentes
    // ========================================

    /**
     * FUNCIÓN PRINCIPAL para mostrar notificaciones con Toastr mejorado
     */
    function mostrarNotificacion(mensaje, tipo = 'info', titulo = '') {
        console.log(`🔔 [NOTIFICACIÓN] Tipo: ${tipo}, Mensaje: ${mensaje}`);

        // Prevenir múltiples notificaciones del mismo mensaje
        if (window.ultimaNotificacion === mensaje && Date.now() - window.ultimaNotificacionTiempo < 2000) {
            console.log('🚫 Notificación duplicada bloqueada');
            return;
        }

        window.ultimaNotificacion = mensaje;
        window.ultimaNotificacionTiempo = Date.now();

        // ✅ USAR SOLO TOASTR CON CONFIGURACIÓN MEJORADA
        if (typeof toastr !== 'undefined') {
            console.log('✅ Usando Toastr');

            // ✅ CONFIGURAR TOASTR CON ESTILOS COMPLETOS
            toastr.options = {
                "closeButton": true,
                "progressBar": true,
                "positionClass": "toast-top-right",
                "timeOut": tipo === 'success' ? "4000" : "6000",
                "preventDuplicates": true
            };

            // Convertir tipo 'danger' a 'error' para Toastr
            const tipoToastr = tipo === 'danger' ? 'error' : tipo;

            // Mostrar notificación
            if (titulo) {
                toastr[tipoToastr](mensaje, titulo);
            } else {
                toastr[tipoToastr](mensaje);
            }

            return;
        }

        // ✅ FALLBACK simple si no hay Toastr
        console.warn('⚠️ Toastr no disponible, usando alert');
        alert((titulo ? titulo + ': ' : '') + mensaje);
    }


    // ========================================
    // FUNCIÓN PARA ACTUALIZAR CONTADORES DE LA TABLA
    // Agregar al final de inventario.js
    // ========================================

    /**
     * Actualiza los contadores de productos en la interfaz
     * VERSIÓN CORREGIDA - Con manejo robusto de errores
     */
    function actualizarContadoresTabla() {
        console.log('📊 === INICIANDO ACTUALIZACIÓN DE CONTADORES ===');

        try {
            // ✅ VERIFICAR QUE LA TABLA EXISTE
            const $tabla = $("tbody");
            if ($tabla.length === 0) {
                console.warn('⚠️ No se encontró la tabla de productos');
                return;
            }

            // ✅ CONTAR FILAS VISIBLES DE FORMA SEGURA
            let filasVisibles = 0;
            let filasStockBajo = 0;

            try {
                // Contar todas las filas visibles
                filasVisibles = $("tbody tr:visible").length;
                console.log('📊 Filas visibles encontradas:', filasVisibles);

                // Contar filas con stock bajo (clase table-danger)
                filasStockBajo = $("tbody tr.table-danger:visible").length;
                console.log('📊 Filas con stock bajo encontradas:', filasStockBajo);

            } catch (conteoError) {
                console.error('❌ Error al contar filas:', conteoError);
                // Usar valores por defecto
                filasVisibles = $("tbody tr").length || 0;
                filasStockBajo = $("tbody tr.table-danger").length || 0;
            }

            // ✅ ACTUALIZAR CONTADOR DE PRODUCTOS (CON VERIFICACIÓN)
            try {
                const $contadorProductos = $("#contadorProductos");
                if ($contadorProductos.length > 0) {
                    $contadorProductos.text(filasVisibles);
                    console.log('✅ Contador productos actualizado:', filasVisibles);
                } else {
                    console.log('ℹ️ Elemento #contadorProductos no encontrado (normal si no existe en la página)');
                }
            } catch (contadorError) {
                console.error('❌ Error al actualizar contador de productos:', contadorError);
            }

            // ✅ ACTUALIZAR CONTADOR DE STOCK BAJO (CON VERIFICACIÓN)
            try {
                const $contadorStockBajo = $("#contadorStockBajo");
                if ($contadorStockBajo.length > 0) {
                    $contadorStockBajo.text(filasStockBajo);
                    console.log('✅ Contador stock bajo actualizado:', filasStockBajo);
                } else {
                    console.log('ℹ️ Elemento #contadorStockBajo no encontrado (normal si no existe en la página)');
                }
            } catch (stockBajoError) {
                console.error('❌ Error al actualizar contador de stock bajo:', stockBajoError);
            }

            // ✅ ACTUALIZAR PAGINACIÓN SI ESTÁ DISPONIBLE (CON VERIFICACIONES)
            try {
                // Verificar que las variables y funciones de paginación existen
                if (typeof paginacionConfig !== 'undefined' &&
                    typeof actualizarFilasVisibles === 'function' &&
                    typeof renderizarPagina === 'function') {

                    console.log('🔄 Actualizando paginación...');

                    actualizarFilasVisibles();

                    // Si estamos en una página que ya no tiene productos, ir a la anterior
                    if (paginacionConfig.paginaActual > 1 && filasVisibles === 0) {
                        const nuevaPagina = Math.max(1, paginacionConfig.paginaActual - 1);
                        console.log('📄 Página actual vacía, moviendo a página:', nuevaPagina);
                        renderizarPagina(nuevaPagina);
                    } else {
                        renderizarPagina(paginacionConfig.paginaActual);
                    }

                    console.log('✅ Paginación actualizada correctamente');
                } else {
                    console.log('ℹ️ Sistema de paginación no disponible o no inicializado');
                }
            } catch (paginacionError) {
                console.error('❌ Error al actualizar paginación:', paginacionError);
                // No es crítico, continuar sin fallar
            }

            console.log('📊 === CONTADORES ACTUALIZADOS EXITOSAMENTE ===');
            console.log(`📊 Resumen: ${filasVisibles} productos visibles, ${filasStockBajo} con stock bajo`);

            return true; // Indicar éxito

        } catch (error) {
            console.error('❌ === ERROR CRÍTICO AL ACTUALIZAR CONTADORES ===');
            console.error('❌ Error:', error);
            console.error('❌ Stack:', error.stack);

            // No lanzar el error, solo loggearlo
            return false; // Indicar fallo
        }
    }

    // ========================================
    // ✅ FUNCIÓN DE COMPATIBILIDAD
    // ========================================

    /**
     * Función alternativa que mantiene compatibilidad con nombres anteriores
     */
    function actualizarContadores() {
        return actualizarContadoresTabla();
    }
    // ✅ OPTIMIZACIÓN ADICIONAL PARA MODAL EN MÓVILES
    $("#detallesProductoModal").on('shown.bs.modal', function () {
        reorganizarBotonesModal();

        // Ajustar altura del modal en móviles
        if (window.innerWidth <= 767) {
            const modalHeight = window.innerHeight - 20;
            $(this).find('.modal-content').css('max-height', modalHeight + 'px');
        }
    });
});

// ========================================
// ✅ FUNCIONES UNIFICADAS DE COMPARTIR
// ========================================

// Variable global para almacenar el producto a compartir
let productoParaCompartir = null;

// Función principal de WhatsApp desde modal de vista rápida
function compartirPorWhatsApp() {
    try {
        const productoId = $("#btnVerDetallesCompletos").attr("href").split('/').pop();
        const fila = $(`tr[data-id="${productoId}"]`);

        if (!productoId || fila.length === 0) {
            mostrarNotificacion("No se pudo identificar el producto para compartir.", "danger");
            return;
        }

        // Cargar datos del producto
        productoParaCompartir = {
            nombre: $("#nombreProductoVistaRapida").text(),
            precio: $("#precioProductoVistaRapida").text(),
            stock: $("#stockProductoVistaRapida").text(),
            urlImagen: fila.find("td:eq(1) img").attr("src"),
            urlProducto: `${window.location.origin}/Inventario/DetalleProducto/${productoId}`
        };

        // Verificar si existe el modal de número de WhatsApp
        if ($("#modalWhatsAppNumero").length > 0) {
            // Mostrar preview del producto en el modal
            $("#productoPreview").html(`
                <div class="d-flex align-items-center">
                    <img src="${productoParaCompartir.urlImagen || '/images/no-image.png'}" 
                         alt="${productoParaCompartir.nombre}" 
                         class="me-3" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    <div>
                        <h6 class="mb-1">${productoParaCompartir.nombre}</h6>
                        <p class="mb-0 text-muted">${productoParaCompartir.precio} - ${productoParaCompartir.stock} unidades disponibles</p>
                    </div>
                </div>
            `);

            // Mostrar el modal del número de WhatsApp
            $("#modalWhatsAppNumero").modal("show");
        } else {
            // Método directo sin modal
            compartirDirectoPorWhatsApp();
        }

        console.log('✅ Función compartir WhatsApp ejecutada correctamente');

    } catch (error) {
        console.error('❌ Error al compartir por WhatsApp:', error);
        mostrarNotificacion("Error al compartir por WhatsApp: " + error.message, "danger");
    }
}

// Función para compartir directamente sin modal
function compartirDirectoPorWhatsApp() {
    try {
        const nombre = $("#nombreProductoVistaRapida").text();
        const precio = $("#precioProductoVistaRapida").text();
        const stock = $("#stockProductoVistaRapida").text();
        const productoId = $("#btnVerDetallesCompletos").attr("href").split('/').pop();

        // Obtener URL de la imagen del producto
        let urlImagen = '';
        const fila = $(`tr[data-id="${productoId}"]`);
        const imagenProducto = fila.find("td:eq(1) img").attr("src");
        if (imagenProducto && !imagenProducto.includes('no-image.png')) {
            urlImagen = `${window.location.origin}${imagenProducto}`;
        }

        // ✅ FORMATO CORRECTO Y UNIFICADO
        const baseUrl = window.location.hostname === 'localhost' ? 'https://umongegds-tucoapp.replit.app' : window.location.origin;
        let mensaje = `¡Hola! Te comparto este producto:\n\n`;
        mensaje += `${nombre}\n`;
        mensaje += `Precio: ${precio}\n`;
        mensaje += `Stock: ${stock}\n`;
        mensaje += `Más detalles: ${baseUrl}/Inventario/DetalleProducto/${productoId}\n\n`;

        if (urlImagen) {
            mensaje += `Imagen: ${baseUrl}${urlImagen}`;
        }

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

        window.open(whatsappUrl, '_blank');

        mostrarNotificacion("Producto compartido por WhatsApp exitosamente", "success");

    } catch (error) {
        console.error('❌ Error en compartir directo:', error);
        mostrarNotificacion("Error al compartir por WhatsApp", "danger");
    }
}

// Función para enviar con número específico
function enviarProductoPorWhatsApp() {
    if (!productoParaCompartir) {
        mostrarNotificacion("Error: No hay producto seleccionado para enviar.", "danger");
        return;
    }

    const numeroWhatsApp = $("#numeroWhatsApp").val().replace(/\D/g, '');
    const incluirImagen = $("#incluirImagen").is(":checked");

    if (numeroWhatsApp.length !== 8) {
        mostrarNotificacion("Por favor, ingrese un número de WhatsApp válido de 8 dígitos.", "warning");
        return;
    }

    try {
        // ✅ CONSTRUIR EL MENSAJE CON EL FORMATO UNIFICADO
        let mensaje = `¡Hola! Te comparto este producto:\n\n`;
        mensaje += `${productoParaCompartir.nombre}\n`;
        mensaje += `Precio: ${productoParaCompartir.precio}\n`;
        mensaje += `Stock: ${productoParaCompartir.stock}\n`;
        mensaje += `Más detalles: ${productoParaCompartir.urlProducto}\n\n`;

        if (incluirImagen && productoParaCompartir.urlImagen && !productoParaCompartir.urlImagen.includes('no-image.png')) {
            mensaje += `Imagen: ${productoParaCompartir.urlImagen}`;
        }

        // Construir la URL de WhatsApp con el número específico
        const urlWhatsApp = `https://wa.me/506${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

        // Abrir WhatsApp
        window.open(urlWhatsApp, '_blank');

        // Ocultar modal y mostrar notificación
        $("#modalWhatsAppNumero").modal("hide");
        mostrarNotificacion("Mensaje enviado a WhatsApp correctamente", "success");

        // Restablecer estado del botón
        const $btnEnviar = $("#btnEnviarWhatsApp");
        $btnEnviar.find('.normal-state').show();
        $btnEnviar.find('.loading-state').hide();
        $btnEnviar.prop('disabled', true);

    } catch (error) {
        console.error('❌ Error al enviar por WhatsApp:', error);
        mostrarNotificacion("Error al enviar por WhatsApp: " + error.message, "danger");
    }
}

// Función para compartir por email
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

PRODUCTO: ${nombre}
PRECIO: ${precio}
STOCK DISPONIBLE: ${stock} unidades
DESCRIPCIÓN: ${descripcion}

Ver detalles completos:
${urlProducto}

Saludos.`;

        const emailUrl = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
        window.location.href = emailUrl;

        mostrarNotificacion("Cliente de email abierto correctamente", "info");

    } catch (error) {
        console.error('❌ Error al compartir por Email:', error);
        mostrarNotificacion("Error al compartir por Email", "danger");
    }
}