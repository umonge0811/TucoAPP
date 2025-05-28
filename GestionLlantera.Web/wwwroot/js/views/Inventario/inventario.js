/**
 * Funcionalidad para la gestión de inventario - VERSIÓN CORREGIDA COMPLETA
 * Imagen miniatura -> Modal | Botón ojo -> Página de detalles
 */

// ✅ FUNCIONES GLOBALES (fuera del document.ready)

// Función para cargar los detalles del producto desde la tabla
function cargarDetallesProducto(productoId) {
    resetFormularioDetalles();

    // Configurar el ID para el ajuste de stock
    $("#productoId").val(productoId);

    // Buscar la fila del producto en la tabla
    const fila = $(`button.ver-detalles-btn[data-id="${productoId}"]`).closest("tr");

    if (fila.length === 0) {
        mostrarNotificacion("Error", "No se encontró el producto en la tabla", "danger");
        return;
    }

    // ✅ DATOS BÁSICOS DEL PRODUCTO
    const nombre = fila.find("td:eq(2) strong").text();
    const descripcion = fila.find("td:eq(2) .small").text() || "Sin descripción adicional";
    const stock = parseInt(fila.find("td:eq(8)").text().trim().split(' ')[0].replace(/[^\d]/g, '')) || 0;
    const stockMin = parseInt(fila.find("td:eq(9)").text().trim()) || 0;

    // ✅ DATOS DE PRECIOS
    const precioFinalTexto = fila.find("td:eq(7)").text().trim();
    const tipoPrecioTexto = fila.find("td:eq(7) small").text().trim();

    // ✅ CARGAR INFORMACIÓN BÁSICA EN EL MODAL
    $("#nombreProductoVistaRapida").text(nombre);
    $("#descripcionVistaRapida").text(descripcion);
    $("#stockProductoVistaRapida").text(stock);
    $("#stockMinimoVistaRapida").text(stockMin);
    $("#precioProductoVistaRapida").text(precioFinalTexto.split('\n')[0] || "₡0");
    $("#tipoPrecioVistaRapida").text(tipoPrecioTexto || "Precio manual");

    // ✅ CONFIGURAR COLORES DEL PRECIO
    if (tipoPrecioTexto === "Calculado") {
        $("#precioProductoVistaRapida").removeClass("text-primary").addClass("text-success");
    } else {
        $("#precioProductoVistaRapida").removeClass("text-success").addClass("text-primary");
    }

    // ✅ CONFIGURAR INDICADOR VISUAL DE STOCK
    configurarIndicadorStock(stock, stockMin);

    // ✅ CARGAR IMÁGENES DEL PRODUCTO
    cargarImagenesEnModal(fila, productoId);

    // ✅ VERIFICAR SI ES UNA LLANTA Y MOSTRAR INFO ESPECÍFICA
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

    // ✅ CONFIGURAR BOTONES
    $("#btnVerDetallesCompletos").attr("href", `/Inventario/DetalleProducto/${productoId}`);
    $("#btnAjustarStockVistaRapida").data("id", productoId);

    // ✅ MOSTRAR EL MODAL
    $("#detallesProductoModal").modal("show");
}

// ✅ NUEVA FUNCIÓN: Configurar indicador visual de stock
function configurarIndicadorStock(stock, stockMin) {
    const porcentajeStock = stockMin > 0 ? Math.min((stock / (stockMin * 2)) * 100, 100) : 50;

    // Configurar barra de progreso
    $("#barraProgresoStock").css("width", `${porcentajeStock}%`);

    // Configurar colores según el nivel de stock
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

// ✅ NUEVA FUNCIÓN: Cargar imágenes en el modal con soporte para carrusel
function cargarImagenesEnModal(fila, productoId) {
    const $contenedorImagenes = $("#contenedorImagenesModal");
    const $indicadores = $("#indicadoresModal");
    const $btnPrev = $("#btnPrevModal");
    const $btnNext = $("#btnNextModal");

    // Limpiar contenido anterior
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
            console.warn('⚠️ Error al cargar imágenes desde servidor, usando imagen de tabla:', error);
            // Fallback: usar la imagen de la tabla si falla
            const imagenDeTabla = fila.find("td:eq(1) img").attr("src");
            const imagenesFallback = imagenDeTabla ? [imagenDeTabla] : [];
            procesarImagenesDelProducto(imagenesFallback);
        }
    });
}

// ✅ FUNCIÓN SEPARADA: Procesar imágenes del producto
function procesarImagenesDelProducto(imagenes) {
    const $contenedorImagenes = $("#contenedorImagenesModal");
    const $indicadores = $("#indicadoresModal");
    const $btnPrev = $("#btnPrevModal");
    const $btnNext = $("#btnNextModal");

    if (imagenes.length === 0) {
        // Sin imágenes - mostrar placeholder
        $contenedorImagenes.html(`
            <div class="carousel-item active d-flex align-items-center justify-content-center" style="min-height: 400px;">
                <div class="text-center">
                    <i class="bi bi-image text-muted" style="font-size: 4rem;"></i>
                    <p class="text-muted mt-3">No hay imágenes disponibles</p>
                </div>
            </div>
        `);
    } else if (imagenes.length === 1) {
        // Una sola imagen
        $contenedorImagenes.html(`
            <div class="carousel-item active d-flex align-items-center justify-content-center" style="min-height: 400px;">
                <img src="${imagenes[0]}" 
                     class="img-fluid" 
                     style="max-height: 400px; max-width: 100%; object-fit: contain;"
                     alt="Imagen del producto"
                     onerror="console.log('Error cargando imagen:', this.src); this.style.display='none';">
            </div>
        `);
    } else {
        // Múltiples imágenes - configurar carrusel completo
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
                 alt="Imagen del producto ${index + 1}"
                 onerror="console.log('Error cargando imagen:', this.src); this.style.display='none';">
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

    // Resetear carrusel
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

// ✅ DOCUMENT READY - NUEVOS COMPORTAMIENTOS
$(document).ready(function () {
    console.log('🚀 Inventario - Configuración iniciada con nuevos comportamientos');

    // ✅ LIMPIAR TODOS LOS EVENTOS PREVIOS PARA EVITAR CONFLICTOS
    $(document).off('click', '.producto-img-mini');
    $(document).off('click', '.producto-img-link');
    $(document).off('click', '.producto-img-mini img');
    $(document).off('click', '.ver-detalles-btn');

    // ✅ NUEVO COMPORTAMIENTO 1: IMAGEN MINIATURA -> ABRE MODAL
    $(document).on('click', 'td:has(.producto-img-container)', function (e) {
        // Solo actuar si no se hizo click en un botón u otro elemento interactivo
        if ($(e.target).closest('button, .btn').length === 0) {
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

    // ✅ NUEVO COMPORTAMIENTO 2: BOTÓN OJO -> NAVEGA A PÁGINA DE DETALLES
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

    // ✅ INICIALIZAR TOOLTIPS
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // ✅ EVENTOS DE AJUSTE DE STOCK
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

    // ✅ EVENTO PARA EL NUEVO BOTÓN DE AJUSTAR STOCK EN VISTA RÁPIDA
    $("#btnAjustarStockVistaRapida").click(function () {
        const productoId = $(this).data("id");
        $("#productoId").val(productoId);
        $("#detallesProductoModal").modal("hide");
        setTimeout(() => {
            $("#ajusteStockModal").modal("show");
        }, 500);
    });

    // ✅ EVENTOS PARA COMPARTIR DESDE EL MODAL
    $("#btnCompartirWhatsApp").click(function (e) {
        e.preventDefault();
        compartirPorWhatsApp();
    });

    $("#btnCompartirEmail").click(function (e) {
        e.preventDefault();
        compartirPorEmail();
    });

    // ✅ GUARDAR AJUSTE DE STOCK
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

    // ✅ FUNCIONES DE COMPARTIR
    function compartirPorWhatsApp() {
        try {
            const nombre = $("#nombreProductoVistaRapida").text();
            const precio = $("#precioProductoVistaRapida").text();
            const stock = $("#stockProductoVistaRapida").text();
            const productoId = $("#btnVerDetallesCompletos").attr("href").split('/').pop();

            // Construir URL del producto
            const urlProducto = `${window.location.origin}/Inventario/DetalleProducto/${productoId}`;

            // Mensaje para WhatsApp
            const mensaje = `🛞 *${nombre}*\n\n💰 Precio: ${precio}\n📦 Stock disponible: ${stock} unidades\n\n🔗 Ver más detalles:\n${urlProducto}`;

            // URL de WhatsApp
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

            // Abrir WhatsApp
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

            // Construir URL del producto
            const urlProducto = `${window.location.origin}/Inventario/DetalleProducto/${productoId}`;

            // Asunto y cuerpo del email
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

            // URL de mailto
            const emailUrl = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

            // Abrir cliente de email
            window.location.href = emailUrl;

            console.log('✅ Compartido por Email');
        } catch (error) {
            console.error('❌ Error al compartir por Email:', error);
            mostrarNotificacion("Error", "No se pudo compartir por Email", "danger");
        }
    }

    // ✅ FUNCIONES DE VALIDACIÓN
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

    // ✅ FILTROS Y BÚSQUEDA
    $("#searchText").on("keyup", function () {
        const valor = $(this).val().toLowerCase();
        $("tbody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(valor) > -1);
        });
        actualizarContadores();
    });

    $("#filterStock").on("change", function () {
        const valor = $(this).val();

        if (valor === "") {
            $("tbody tr").show();
        } else if (valor === "low") {
            $("tbody tr").hide();
            $("tbody tr.table-danger").show();
        } else if (valor === "normal") {
            $("tbody tr").hide();
            $("tbody tr").not(".table-danger").filter(function () {
                const stock = parseInt($(this).find("td:eq(8)").text().trim());
                const minStock = parseInt($(this).find("td:eq(9)").text().trim());
                return stock > minStock && stock < minStock * 2;
            }).show();
        } else if (valor === "high") {
            $("tbody tr").hide();
            $("tbody tr").filter(function () {
                const stock = parseInt($(this).find("td:eq(8)").text().trim());
                const minStock = parseInt($(this).find("td:eq(9)").text().trim());
                return stock >= minStock * 2;
            }).show();
        }

        actualizarContadores();
    });

    $("#filterCategory").on("change", function () {
        const valor = $(this).val();

        if (valor === "") {
            $("tbody tr").show();
        } else if (valor === "llantas") {
            $("tbody tr").hide();
            $("tbody tr:contains('Llanta')").show();
        } else {
            $("tbody tr").hide();
            $("tbody tr").not(":contains('Llanta')").show();
        }

        actualizarContadores();
    });

    // ✅ ORDENAMIENTO
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
    });

    // ✅ FUNCIÓN PARA ACTUALIZAR CONTADORES
    function actualizarContadores() {
        const filasVisibles = $("tbody tr:visible").length;
        const filasStockBajo = $("tbody tr.table-danger:visible").length;

        $("#contadorProductos").text(filasVisibles);
        $("#contadorStockBajo").text(filasStockBajo);
    }

    // ✅ LIMPIAR MODAL AL CERRAR
    $("#detallesProductoModal").on("hidden.bs.modal", function () {
        resetFormularioDetalles();
    });

    console.log('✅ Inventario - Configuración completada con nuevos comportamientos');
});