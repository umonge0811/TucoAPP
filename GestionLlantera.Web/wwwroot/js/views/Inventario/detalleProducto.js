/**
 * Funcionalidad específica para la vista de detalle de producto
 * Maneja el ajuste de stock desde la página de detalle
 */

console.log('🔧 Cargando detalleProducto.js');

/**
 * Carga información del producto específicamente desde la vista de detalle
 * No depende de filas de tabla como el inventario principal
 * @param {number} productoId - ID del producto
 * @param {string} nombreProducto - Nombre del producto desde el modelo
 * @param {number} stockActual - Stock actual desde el modelo
 */
function cargarInformacionProductoDesdeDetalle(productoId, nombreProducto, stockActual) {
    console.log('📋 Cargando información desde vista de detalle...');

    // Limpiar formulario si la función existe
    if (typeof limpiarFormularioAjuste === 'function') {
        limpiarFormularioAjuste();
    }

    // Establecer ID del producto
    $("#productoId").val(productoId);

    console.log('📋 Datos del modelo:', { nombreProducto, stockActual });

    // Mostrar información en el modal
    $("#nombreProductoAjuste").text(nombreProducto);
    $("#stockActualAjuste").text(stockActual);
    $("#infoProductoAjuste").show();

    // Guardar stock actual para validaciones
    $("#ajusteStockForm").data('stock-actual', stockActual);

    console.log('✅ Información del producto cargada desde detalle');
}

/**
 * Actualiza la interfaz de la vista detalle después de un ajuste exitoso
 * @param {Object} datos - Datos de la respuesta del servidor
 */
function actualizarVistaDetallePostAjuste(datos) {
    console.log('🔄 === ACTUALIZANDO VISTA DETALLE ===');
    console.log('🔄 Datos recibidos:', datos);

    try {
        const {
            stockNuevo = 0,
            stockBajo = false,
            stockMinimo = 0
        } = datos;

        // ✅ ACTUALIZAR INFORMACIÓN DE STOCK EN LA VISTA
        const $stockInfo = $('.stock-info');
        const $stockSpan = $stockInfo.find('span');
        const $stockIcon = $stockInfo.find('i');

        // Actualizar texto y clases
        if (stockBajo) {
            $stockSpan.html(`Stock bajo: ${stockNuevo} unidades`);
            $stockInfo.removeClass('text-success').addClass('text-danger');
            $stockIcon.removeClass('bi-check-circle').addClass('bi-exclamation-triangle');
        } else {
            $stockSpan.html(`Disponible: ${stockNuevo} unidades`);
            $stockInfo.removeClass('text-danger').addClass('text-success');
            $stockIcon.removeClass('bi-exclamation-triangle').addClass('bi-check-circle');
        }

        // ✅ ACTUALIZAR INFORMACIÓN ADICIONAL EN LA LISTA
        const $listaInfo = $('.list-group-flush li');
        $listaInfo.each(function () {
            const $li = $(this);
            if ($li.text().includes('Stock Mínimo:')) {
                $li.find('span:last').text(`${stockMinimo} unidades`);
            }
        });

        // ✅ EFECTO VISUAL DE ACTUALIZACIÓN
        $stockInfo.addClass('bg-success text-white')
            .animate({ opacity: 0.8 }, 300)
            .animate({ opacity: 1 }, 300, function () {
                setTimeout(() => {
                    $stockInfo.removeClass('bg-success text-white');
                }, 1500);
            });

        console.log('✅ Vista detalle actualizada correctamente');

    } catch (error) {
        console.error('❌ Error al actualizar vista detalle:', error);
    }
}

/**
 * Ejecuta el ajuste de stock específicamente desde la vista de detalle
 * Versión personalizada que actualiza la interfaz local
 */
function ejecutarAjusteStockDetalle(productoId, tipoAjuste, cantidad, comentario) {
    console.log('🚀 === EJECUTANDO AJUSTE DESDE VISTA DETALLE ===');

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

    console.log('📡 Enviando desde vista detalle...');
    console.log('📡 Datos:', datosAjuste);

    // Obtener token anti-forgery
    const token = $('input[name="__RequestVerificationToken"]').val();

    // ✅ PETICIÓN AJAX PERSONALIZADA PARA VISTA DETALLE
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
            console.log('📡 === RESPUESTA RECIBIDA EN DETALLE ===');
            console.log('📡 Response:', response);

            // Rehabilitar botón
            $btnGuardar.prop('disabled', false);
            $normalState.show();
            $loadingState.hide();

            if (response.success) {
                console.log('✅ Ajuste exitoso desde detalle');

                // ✅ MOSTRAR NOTIFICACIÓN
                if (typeof mostrarNotificacion === 'function') {
                    const signo = response.data.diferencia >= 0 ? '+' : '';
                    const mensaje = `Stock actualizado: ${response.data.stockAnterior} → ${response.data.stockNuevo} (${signo}${response.data.diferencia})`;
                    mostrarNotificacion(mensaje, 'success');
                } else if (typeof mostrarAlertaSimple === 'function') {
                    mostrarAlertaSimple('Stock actualizado exitosamente', 'success');
                }

                // ✅ ACTUALIZAR VISTA DETALLE
                actualizarVistaDetallePostAjuste(response.data);

                // Cerrar modal
                $("#ajusteStockModal").modal("hide");

            } else {
                console.error('❌ Error en ajuste:', response.message);

                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion(response.message || 'Error al ajustar stock', 'danger');
                } else if (typeof mostrarAlertaSimple === 'function') {
                    mostrarAlertaSimple(response.message || 'Error al ajustar stock', 'danger');
                }
            }
        },
        error: function (xhr, status, error) {
            console.error('❌ === ERROR EN PETICIÓN DESDE DETALLE ===');
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

            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion(mensajeError, 'danger');
            } else if (typeof mostrarAlertaSimple === 'function') {
                mostrarAlertaSimple(mensajeError, 'danger');
            } else {
                alert(mensajeError);
            }
        }
    });
}

/**
 * Inicialización cuando el DOM está listo
 */
$(document).ready(function () {
    console.log('🚀 Inicializando funcionalidad de detalle de producto');
    // ✅ ACTIVAR INTERCEPTACIÓN DE ELIMINACIÓN PARA REDIRECCIÓN
    interceptarEliminacionParaDetalle();

    // ✅ EVENTO PARA ABRIR MODAL DE AJUSTE
    $(document).on('click', '.ajuste-stock-btn', function (e) {
        console.log('📦 === ABRIENDO MODAL DESDE VISTA DETALLE ===');

        e.preventDefault();
        e.stopPropagation();

        const productoId = $(this).data("id");
        console.log('📦 Producto ID:', productoId);

        if (!productoId) {
            console.error('❌ No se pudo obtener el ProductoId');
            if (typeof mostrarAlertaSimple === 'function') {
                mostrarAlertaSimple("Error: No se pudo identificar el producto", "danger");
            } else {
                alert("Error: No se pudo identificar el producto");
            }
            return;
        }

        // ✅ OBTENER DATOS DEL CONTEXTO DE LA PÁGINA
        // Estos valores serán inyectados desde la vista Razor
        const nombreProducto = window.productoContexto?.nombre || 'Producto';
        const stockActual = window.productoContexto?.stock || 0;

        // ✅ CARGAR INFORMACIÓN ESPECÍFICA PARA VISTA DETALLE
        cargarInformacionProductoDesdeDetalle(productoId, nombreProducto, stockActual);

        // Mostrar el modal
        $("#ajusteStockModal").modal("show");
    });

    // ✅ EVENTOS PARA ACTUALIZAR VISTA PREVIA
    $("#tipoAjuste, #cantidad").on('change input', function () {
        if (typeof actualizarVistaPrevia === 'function') {
            actualizarVistaPrevia();
        }
    });

    // ✅ EVENTO PARA GUARDAR AJUSTE
    $("#guardarAjusteBtn").off('click').on('click', function () {
        console.log('💾 === INICIANDO GUARDADO DESDE DETALLE ===');

        // Validar formulario
        if (typeof validarFormularioAjusteCompleto === 'function' &&
            !validarFormularioAjusteCompleto()) {
            console.log('❌ Validación del formulario falló');
            return;
        }

        // Obtener datos del formulario
        const productoId = $("#productoId").val();
        const tipoAjuste = $("#tipoAjuste").val();
        const cantidad = parseInt($("#cantidad").val());
        const comentario = $("#comentario").val().trim();

        console.log('📦 Datos a enviar:', { productoId, tipoAjuste, cantidad, comentario });

        // ✅ EJECUTAR AJUSTE CON FUNCIÓN PERSONALIZADA
        ejecutarAjusteStockDetalle(productoId, tipoAjuste, cantidad, comentario);
    });

    // ✅ LIMPIAR MODAL CUANDO SE CIERRA
    $("#ajusteStockModal").on('hidden.bs.modal', function () {
        console.log('🧹 Limpiando modal desde detalle...');
        if (typeof limpiarFormularioAjuste === 'function') {
            limpiarFormularioAjuste();
        }
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

    console.log('✅ Funcionalidad de detalle de producto inicializada');
});

/**
 * Función para compartir producto desde vista detalle
 * Usa los datos del contexto del producto
 */
function compartirProducto() {
    console.log('📤 Compartiendo producto...');

    const contexto = window.productoContexto;
    if (!contexto) {
        console.error('❌ No hay contexto del producto disponible');
        return;
    }

    const nombre = contexto.nombre;
    const precio = contexto.precio || '0';
    const url = window.location.href;

    const mensaje = `🛞 *${nombre}*\n\n💰 Precio: ₡${precio}\n\n🔗 Ver detalles:\n${url}`;

    if (navigator.share) {
        // API Web Share (móviles modernos)
        navigator.share({
            title: nombre,
            text: `Producto: ${nombre} - Precio: ₡${precio}`,
            url: url
        }).then(() => {
            console.log('✅ Compartido exitosamente');
        }).catch(err => {
            console.warn('⚠️ Error sharing:', err);
            // Fallback al portapapeles
            copiarAlPortapapeles(mensaje);
        });
    } else {
        // Fallback: copiar al portapapeles
        copiarAlPortapapeles(mensaje);
    }
}

/**
 * Función auxiliar para copiar al portapapeles
 * @param {string} mensaje - Mensaje a copiar
 */
function copiarAlPortapapeles(mensaje) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mensaje).then(() => {
            mostrarToastExito('¡Información copiada al portapapeles!');
        }).catch(err => {
            console.error('❌ Error al copiar:', err);
            // Fallback manual
            copiarTextoManual(mensaje);
        });
    } else {
        // Fallback para navegadores antiguos
        copiarTextoManual(mensaje);
    }
}

/**
 * Función de fallback para copiar texto manualmente
 * @param {string} texto - Texto a copiar
 */
function copiarTextoManual(texto) {
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const exitoso = document.execCommand('copy');
        if (exitoso) {
            mostrarToastExito('¡Información copiada al portapapeles!');
        } else {
            mostrarToastError('No se pudo copiar automáticamente. Copia manualmente el texto.');
        }
    } catch (err) {
        console.error('❌ Error al copiar manualmente:', err);
        mostrarToastError('No se pudo copiar. Intente manualmente.');
    } finally {
        document.body.removeChild(textArea);
    }
}

/**
 * Muestra un toast de éxito
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarToastExito(mensaje) {
    mostrarToast(mensaje, 'success', 'bi-check-circle');
}

/**
 * Muestra un toast de error
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarToastError(mensaje) {
    mostrarToast(mensaje, 'danger', 'bi-exclamation-triangle');
}

/**
 * Función genérica para mostrar toasts
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de toast (success, danger, warning, info)
 * @param {string} icono - Clase del icono Bootstrap
 */
function mostrarToast(mensaje, tipo = 'info', icono = 'bi-info-circle') {
    const toastId = 'toast-' + Date.now();
    const toast = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${tipo} border-0 position-fixed top-0 end-0 m-3" 
             role="alert" style="z-index: 9999;" data-bs-autohide="true" data-bs-delay="4000">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="${icono} me-2"></i>
                    ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;

    $('body').append(toast);

    // Inicializar y mostrar el toast
    const $toast = $(`#${toastId}`);
    const bsToast = new bootstrap.Toast($toast[0]);
    bsToast.show();

    // Limpiar después de que se oculte
    $toast.on('hidden.bs.toast', function () {
        $(this).remove();
    });
}

/**
 * Inicializar tooltips en la página
 */
function inicializarTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    console.log(`✅ ${tooltipList.length} tooltips inicializados`);
}

/**
* Sobrescribe el comportamiento de eliminación exitosa para redirigir al inventario
*/
function interceptarEliminacionParaDetalle() {
    // ✅ INTERCEPTAR AJAX DE ELIMINACIÓN
    const originalAjax = $.ajax;

    $.ajax = function (options) {
        // Si es una petición de eliminación
        if (options.url && options.url.includes('/EliminarProducto/') && options.type === 'DELETE') {
            console.log('🔄 Interceptando eliminación desde vista detalle');

            // Guardar el success original
            const originalSuccess = options.success;

            // Sobrescribir el success
            options.success = function (response) {
                console.log('📡 Respuesta de eliminación interceptada:', response);

                // Ejecutar el success original primero
                if (originalSuccess) {
                    originalSuccess.call(this, response);
                }

                // Si fue exitoso, redirigir al inventario
                if (response && response.success) {
                    console.log('✅ Eliminación exitosa, redirigiendo...');

                    setTimeout(() => {
                        console.log('🔄 Redirigiendo al inventario...');
                        window.location.href = '/Inventario';
                    }, 2000); // 2 segundos de delay
                }
            };
        }

        // Ejecutar la petición original
        return originalAjax.call(this, options);
    };
}