/**
 * Funcionalidad para la gestión de inventario - CORREGIDO
 * Solución para el problema de navegación en imágenes
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

    // Obtener datos básicos
    const nombre = fila.find("td:eq(2) strong").text();
    const descripcion = fila.find("td:eq(2) .small").text() || "Sin descripción";
    const precio = fila.find("td:eq(5)").text();
    const stock = fila.find("td:eq(6)").text().trim().split(' ')[0].replace(/[^\d]/g, '');
    const stockMin = fila.find("td:eq(7)").text().trim();

    // Establecer datos básicos en el modal
    $("#nombreProductoDetalle").text(nombre);
    $("#descripcionProductoDetalle").text(descripcion);
    $("#stockProductoDetalle").text(stock);
    $("#minStockProductoDetalle").text(stockMin);

    // Obtener datos de precios de las celdas de la tabla
    const costoTexto = fila.find("td:eq(5)").text().trim();
    const utilidadTexto = fila.find("td:eq(6)").text().trim();
    const precioFinalTexto = fila.find("td:eq(7)").text().trim();
    const tipoPrecioTexto = fila.find("td:eq(7) small").text().trim();

    // Establecer información de precios
    $("#costoProductoDetalle").text(costoTexto !== "-" ? costoTexto : "No especificado");
    $("#utilidadProductoDetalle").text(utilidadTexto !== "-" ? utilidadTexto : "-");
    $("#precioProductoDetalle").text(precioFinalTexto.split('\n')[0] || precio);
    $("#tipoPrecioDetalle").text(tipoPrecioTexto || "Manual");

    // Ajustar colores según el tipo de precio
    if (tipoPrecioTexto === "Calculado") {
        $("#precioProductoDetalle").removeClass("text-primary").addClass("text-success");
    } else {
        $("#precioProductoDetalle").removeClass("text-success").addClass("text-primary");
    }

    // Obtener la URL de la imagen
    const imagenUrl = fila.find("td:eq(1) img").attr("src");
    if (imagenUrl) {
        $("#imagenProductoDetalle").html(`<img src="${imagenUrl}" style="max-width: 100%; max-height: 200px; border-radius: 8px; pointer-events: none;">`);
    }

    // Configurar el enlace para editar
    $("#btnEditarProductoDetalle").attr("href", `/Inventario/EditarProducto/${productoId}`);

    // Verificar si es una llanta
    const esLlanta = fila.find("td:eq(2) .badge").text() === "Llanta";
    if (esLlanta) {
        $("#detallesLlanta").show();
        const medidas = fila.find("td:eq(3) .medida-llanta").text().trim();
        const marcaModelo = fila.find("td:eq(4) .marca-modelo").text().trim();
        const tipoTerreno = fila.find("td:eq(4) .text-muted").text().trim();

        $("#medidasLlantaDetalle").text(medidas !== "N/A" ? medidas : "No disponible");
        $("#marcaModeloLlantaDetalle").text(marcaModelo !== "N/A" ? marcaModelo : "No disponible");
        $("#tipoTerrenoLlantaDetalle").text(tipoTerreno !== "N/A" ? tipoTerreno : "No disponible");
        $("#indiceVelocidadLlantaDetalle").text("No disponible en vista de tabla");

        $(".ajuste-stock-detalle-btn").data("id", productoId);
    } else {
        $("#detallesLlanta").hide();
    }

    // Mostrar el modal
    $("#detallesProductoModal").modal("show");
}

// Función para resetear el formulario de detalles
function resetFormularioDetalles() {
    $("#nombreProductoDetalle").text("Cargando...");
    $("#descripcionProductoDetalle").text("Cargando...");
    $("#precioProductoDetalle").text("₡0");
    $("#stockProductoDetalle").text("0");
    $("#minStockProductoDetalle").text("0");
    $("#medidasLlantaDetalle").text("-");
    $("#marcaModeloLlantaDetalle").text("-");
    $("#indiceVelocidadLlantaDetalle").text("-");
    $("#tipoTerrenoLlantaDetalle").text("-");
    $("#imagenProductoDetalle").html('<i class="bi bi-image" style="font-size: 3rem; color: #aaa;"></i>');
    $("#galeriaMiniaturas").empty();
    $("#costoProductoDetalle").text("-");
    $("#utilidadProductoDetalle").text("-");
    $("#tipoPrecioDetalle").text("-");
    $("#precioProductoDetalle").removeClass("text-success text-primary");
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

// ✅ DOCUMENT READY - SOLUCIÓN CORREGIDA
$(document).ready(function () {
    console.log('🚀 Inventario - Configuración iniciada');

    // ✅ LIMPIAR TODOS LOS EVENTOS PREVIOS PARA EVITAR CONFLICTOS
    $(document).off('click', '.producto-img-mini');
    $(document).off('click', '.producto-img-link');
    $(document).off('click', '.producto-img-mini img');

    // ✅ SOLUCIÓN: Usar un SOLO manejador de eventos con delegación
    // Interceptar clicks en toda la celda de imagen
    $(document).on('click', 'td:has(.producto-img-link)', function (e) {
        // Solo actuar si no se hizo click en un botón u otro elemento interactivo
        if ($(e.target).closest('button, .btn').length === 0) {
            e.preventDefault();
            e.stopPropagation();

            const $fila = $(this).closest('tr[data-id]');
            const productoId = $fila.attr('data-id');

            console.log('🖼️ Click en imagen - Producto ID:', productoId);

            if (productoId) {
                const url = `/Inventario/DetalleProducto/${productoId}`;
                console.log('🌐 Navegando a:', url);
                window.location.href = url;
            }
        }
    });

    // ✅ EVENTOS DE BOTONES "VER DETALLES" - Abrir modal
    $(document).on('click', '.ver-detalles-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const productoId = $(this).data("id");
        if (typeof cargarDetallesProducto === 'function') {
            cargarDetallesProducto(productoId);
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
                const stock = parseInt($(this).find("td:eq(6)").text().trim());
                const minStock = parseInt($(this).find("td:eq(7)").text().trim());
                return stock > minStock && stock < minStock * 2;
            }).show();
        } else if (valor === "high") {
            $("tbody tr").hide();
            $("tbody tr").filter(function () {
                const stock = parseInt($(this).find("td:eq(6)").text().trim());
                const minStock = parseInt($(this).find("td:eq(7)").text().trim());
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
                valorA = parseFloat($(a).find("td:eq(5)").text().replace(/[^\d.]/g, ''));
                valorB = parseFloat($(b).find("td:eq(5)").text().replace(/[^\d.]/g, ''));
                return valorA - valorB;
            } else if (valor === "price_desc") {
                valorA = parseFloat($(a).find("td:eq(5)").text().replace(/[^\d.]/g, ''));
                valorB = parseFloat($(b).find("td:eq(5)").text().replace(/[^\d.]/g, ''));
                return valorB - valorA;
            } else if (valor === "stock") {
                valorA = parseInt($(a).find("td:eq(6)").text().trim());
                valorB = parseInt($(b).find("td:eq(6)").text().trim());
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

    console.log('✅ Inventario - Configuración completada');
});