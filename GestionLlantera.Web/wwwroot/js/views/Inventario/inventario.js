 /**
 * Funcionalidad para la gestión de inventario
 */
$(document).ready(function () {
    // Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Configuración del botón para programar inventario
    $("#btnProgramarInventario").click(function (e) {
        e.preventDefault();
        $("#programarInventarioModal").modal("show");
    });

    // Configuración de los botones de ajuste de stock
    $(".ajuste-stock-btn").click(function () {
        const productoId = $(this).data("id");
        $("#productoId").val(productoId);
        $("#ajusteStockModal").modal("show");
    });

    // Configuración del botón de ajuste de stock en el modal de detalles
    $(".ajuste-stock-detalle-btn").click(function () {
        // Ocultar el modal de detalles y mostrar el modal de ajuste de stock
        $("#detallesProductoModal").modal("hide");
        setTimeout(() => {
            $("#ajusteStockModal").modal("show");
        }, 500);
    });

    // Configuración de los botones para ver detalles
    $(".ver-detalles-btn").click(function () {
        const productoId = $(this).data("id");
        cargarDetallesProducto(productoId);
    });

    // Función para cargar los detalles del producto
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
        const stock = fila.find("td:eq(6)").text().trim().split(' ')[0].replace(/[^\d]/g, ''); // Extraer solo el número
        const stockMin = fila.find("td:eq(7)").text().trim();

        // Establecer datos básicos en el modal
        $("#nombreProductoDetalle").text(nombre);
        $("#descripcionProductoDetalle").text(descripcion);
        $("#precioProductoDetalle").text(precio);
        $("#stockProductoDetalle").text(stock);
        $("#minStockProductoDetalle").text(stockMin);

        // Obtener la URL de la imagen
        const imagenUrl = fila.find("td:eq(1) img").attr("src");
        if (imagenUrl) {
            $("#imagenProductoDetalle").html(`<img src="${imagenUrl}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`);
        }

        // Configurar el enlace para editar
        $("#btnEditarProductoDetalle").attr("href", `/Inventario/EditarProducto/${productoId}`);

        // Verificar si es una llanta
        const esLlanta = fila.find("td:eq(2) .badge").text() === "Llanta";
        if (esLlanta) {
            // Mostrar sección de detalles de llanta
            $("#detallesLlanta").show();

            // Obtener datos específicos de la llanta
            const medidas = fila.find("td:eq(3) .medida-llanta").text().trim();
            const marcaModelo = fila.find("td:eq(4) .marca-modelo").text().trim();
            const tipoTerreno = fila.find("td:eq(4) .text-muted").text().trim();

            // Establecer datos de la llanta en el modal
            $("#medidasLlantaDetalle").text(medidas !== "N/A" ? medidas : "No disponible");
            $("#marcaModeloLlantaDetalle").text(marcaModelo !== "N/A" ? marcaModelo : "No disponible");
            $("#tipoTerrenoLlantaDetalle").text(tipoTerreno !== "N/A" ? tipoTerreno : "No disponible");
            $("#indiceVelocidadLlantaDetalle").text("No disponible en vista de tabla"); // Este dato no aparece en la tabla

            // Configurar el botón de ajuste de stock en el modal
            $(".ajuste-stock-detalle-btn").data("id", productoId);
        } else {
            // Ocultar sección de detalles de llanta
            $("#detallesLlanta").hide();
        }

        // Mostrar el modal
        $("#detallesProductoModal").modal("show");
    }

    // Función para cargar detalles desde la tabla (método alternativo)
    function cargarDetallesDesdeLaTabla(productoId) {
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
        const stock = fila.find("td:eq(6)").text().trim().split(' ')[0]; // Extraer solo el número
        const stockMin = fila.find("td:eq(7)").text().trim();

        // Establecer datos básicos en el modal
        $("#nombreProductoDetalle").text(nombre);
        $("#descripcionProductoDetalle").text(descripcion);
        $("#precioProductoDetalle").text(precio);
        $("#stockProductoDetalle").text(stock);
        $("#minStockProductoDetalle").text(stockMin);

        // Obtener la URL de la imagen
        const imagenUrl = fila.find("td:eq(1) img").attr("src");
        if (imagenUrl) {
            $("#imagenProductoDetalle").html(`<img src="${imagenUrl}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`);
        }

        // Configurar el enlace para editar
        $("#btnEditarProductoDetalle").attr("href", `/Inventario/EditarProducto/${productoId}`);

        // Verificar si es una llanta
        const esLlanta = fila.find("td:eq(2) .badge").text() === "Llanta";
        if (esLlanta) {
            // Mostrar sección de detalles de llanta
            $("#detallesLlanta").show();

            // Obtener datos específicos de la llanta
            const medidas = fila.find("td:eq(3)").text().trim();
            const marcaModelo = fila.find("td:eq(4)").text().trim();

            // Establecer datos de la llanta en el modal
            $("#medidasLlantaDetalle").text(medidas !== "N/A" ? medidas : "No disponible");
            $("#marcaModeloLlantaDetalle").text(marcaModelo !== "N/A" ? marcaModelo : "No disponible");
            $("#tipoTerrenoLlantaDetalle").text("No disponible en vista de tabla");
            $("#indiceVelocidadLlantaDetalle").text("No disponible en vista de tabla");

            // Configuración adicional para el botón de ajuste de stock en el modal
            $(".ajuste-stock-detalle-btn").data("id", productoId);
        } else {
            // Ocultar sección de detalles de llanta
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
    }

    // Guardar ajuste de stock
    $("#guardarAjusteBtn").click(function () {
        if (!validarFormularioAjuste()) {
            return;
        }

        const productoId = $("#productoId").val();
        const tipoAjuste = $("#tipoAjuste").val();
        const cantidad = $("#cantidad").val();
        const comentario = $("#comentario").val();

        // Objeto con los datos a enviar
        const datos = {
            cantidad: parseInt(cantidad),
            tipoAjuste: tipoAjuste
        };

        // Envío de la solicitud AJAX
        $.ajax({
            url: `/api/Inventario/productos/${productoId}/ajuste-stock`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(datos),
            success: function (respuesta) {
                mostrarNotificacion("Éxito", "Stock ajustado correctamente", "success");
                $("#ajusteStockModal").modal("hide");
                // Recargar la página para mostrar los datos actualizados
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

    // Validación del formulario de ajuste de stock
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

    // Guardar programación de inventario
    $("#guardarInventarioBtn").click(function () {
        if (!validarFormularioInventario()) {
            return;
        }

        const fechaInventario = $("#fechaInventario").val();
        const tipoInventario = $("#tipoInventario").val();
        const comentario = $("#comentarioInventario").val();

        // Objeto con los datos a enviar
        const datos = {
            fechaProgramada: fechaInventario,
            tipoInventario: tipoInventario,
            comentario: comentario
        };

        // Aquí se implementaría la lógica para enviar los datos al servidor
        // Por ahora solo mostramos una notificación
        mostrarNotificacion("Éxito", "Inventario programado correctamente", "success");
        $("#programarInventarioModal").modal("hide");
    });

    // Validación del formulario de programación de inventario
    function validarFormularioInventario() {
        let esValido = true;

        if ($("#fechaInventario").val() === "") {
            $("#fechaInventario").addClass("is-invalid");
            esValido = false;
        } else {
            $("#fechaInventario").removeClass("is-invalid");
        }

        if ($("#tipoInventario").val() === "") {
            $("#tipoInventario").addClass("is-invalid");
            esValido = false;
        } else {
            $("#tipoInventario").removeClass("is-invalid");
        }

        return esValido;
    }

    // Filtrado de productos
    $("#searchText").on("keyup", function () {
        const valor = $(this).val().toLowerCase();
        $("tbody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(valor) > -1);
        });
        actualizarContadores();
    });

    // Filtrado por stock
    $("#filterStock").on("change", function () {
        const valor = $(this).val();

        if (valor === "") {
            // Mostrar todos
            $("tbody tr").show();
        } else if (valor === "low") {
            // Mostrar solo stock bajo
            $("tbody tr").hide();
            $("tbody tr.table-danger").show();
        } else if (valor === "normal") {
            // Mostrar stock normal (no bajo ni alto)
            $("tbody tr").hide();
            $("tbody tr").not(".table-danger").filter(function () {
                const stock = parseInt($(this).find("td:eq(6)").text().trim());
                const minStock = parseInt($(this).find("td:eq(7)").text().trim());
                return stock > minStock && stock < minStock * 2;
            }).show();
        } else if (valor === "high") {
            // Mostrar stock alto
            $("tbody tr").hide();
            $("tbody tr").filter(function () {
                const stock = parseInt($(this).find("td:eq(6)").text().trim());
                const minStock = parseInt($(this).find("td:eq(7)").text().trim());
                return stock >= minStock * 2;
            }).show();
        }

        actualizarContadores();
    });

    // Filtrado por categoría
    $("#filterCategory").on("change", function () {
        const valor = $(this).val();

        if (valor === "") {
            // Mostrar todos
            $("tbody tr").show();
        } else if (valor === "llantas") {
            // Mostrar solo llantas
            $("tbody tr").hide();
            $("tbody tr:contains('Llanta')").show();
        } else {
            // Mostrar otras categorías
            $("tbody tr").hide();
            $("tbody tr").not(":contains('Llanta')").show();
        }

        actualizarContadores();
    });

    // Ordenar productos
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

    // Función para actualizar contadores
    function actualizarContadores() {
        const filasVisibles = $("tbody tr:visible").length;
        const filasStockBajo = $("tbody tr.table-danger:visible").length;

        $("#contadorProductos").text(filasVisibles);
        $("#contadorStockBajo").text(filasStockBajo);
    }
        

    // Función para mostrar notificaciones
    function mostrarNotificacion(titulo, mensaje, tipo) {
        // Esta función se puede implementar con toastr, SweetAlert2, o alerts de Bootstrap

        // Implementación sencilla con alert de Bootstrap
        const alertHtml = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                <strong>${titulo}:</strong> ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Crear un contenedor para alertas si no existe
        if ($("#alertContainer").length === 0) {
            $("body").prepend('<div id="alertContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>');
        }

        // Agregar la alerta
        const $alert = $(alertHtml).appendTo("#alertContainer");

        // Eliminar automáticamente después de 5 segundos
        setTimeout(() => {
            $alert.alert('close');
        }, 5000);
    }

    // Inicializar el modal de detalles
    $("#detallesProductoModal").on("hidden.bs.modal", function () {
        resetFormularioDetalles();
    });
});