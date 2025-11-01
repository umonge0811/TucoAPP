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

    // ✅ EVENTOS PARA EL MODAL DE WHATSAPP
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

    // Evento para enviar con número específico
    $("#btnEnviarWhatsApp").off('click').on('click', function() {
        enviarConNumeroEspecifico();
    });

    // Llenar preview del producto cuando se abre el modal
    $("#modalWhatsAppNumero").on('show.bs.modal', function() {
        console.log('📱 Abriendo modal WhatsApp');

        // ✅ ASEGURAR QUE window.productoParaCompartir ESTÉ CONFIGURADO
        if (!window.productoParaCompartir && window.productoContexto) {
            console.log('🔧 Configurando producto para compartir desde contexto');
            const contexto = window.productoContexto;
            const baseUrl = window.appConfig ? window.appConfig.webBaseUrl : window.location.origin;
            window.productoParaCompartir = {
                nombre: contexto.nombre || 'Producto',
                precio: contexto.precio ? `₡${contexto.precio}` : '₡0',
                stock: contexto.stock ? `${contexto.stock} unidades` : '0 unidades',
                medida: contexto.medida || '',
                marca: contexto.marca || '',
                urlImagen: contexto.imagenPrincipal || '',
                urlProducto: `https://llantasymastc.com/Public/DetalleProducto/${productoId}`,
            };
        }

        const producto = window.productoParaCompartir;

        if (producto) {
            console.log('📦 Datos del producto para preview:', producto);

            // Configurar datos del preview
            const nombreProducto = producto.nombre || 'Producto sin nombre';
            const precioProducto = producto.precio || '₡0';
            const stockProducto = producto.stock || '0 unidades';
            const medidaProducto = producto.medida ? ` - ${producto.medida}` : '';
            const marcaProducto = producto.marca ? ` (${producto.marca})` : '';
            const imagenProducto = producto.urlImagen || '';

            $("#productoPreview").html(`
                <div class="d-flex align-items-center">
                    ${imagenProducto ? `<img src="${imagenProducto}" alt="${nombreProducto}" class="me-3" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : '<div class="me-3 bg-light d-flex align-items-center justify-content-center" style="width: 60px; height: 60px; border-radius: 8px;"><i class="bi bi-image text-muted"></i></div>'}
                    <div>
                        <h6 class="mb-1">${nombreProducto}${medidaProducto}${marcaProducto}</h6>
                        <p class="mb-0 text-muted">${precioProducto} - ${stockProducto}</p>
                    </div>
                </div>
            `);
        } else {
            console.error('❌ No hay producto disponible para mostrar');
            $("#productoPreview").html(`
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    No hay información del producto disponible
                </div>
            `);
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

    console.log('✅ Funcionalidad de detalle de producto inicializada');


});

/**
 * Función para compartir producto desde vista detalle
 * Usa la función unificada de WhatsApp
 */
function compartirProducto() {
    enviarProductoPorWhatsApp();
}

/**
 * Función de compatibilidad para mantener la interfaz existente
 * Redirige a la función unificada
 */
function compartirPorWhatsApp() {
    enviarProductoPorWhatsApp();
}

function usarMetodoTradicional() {
    const contexto = window.productoContexto;
    const nombre = contexto.nombre;
    const precio = contexto.precio || '0';
    const url = window.location.href;

    const mensaje = `*${nombre}*\n\nPrecio: ₡${precio}\n\nVer detalles:\n${url}`;

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
 * Función unificada para enviar producto por WhatsApp desde vista detalle
 * Compatible con el modal de número o envío directo
 */
function enviarProductoPorWhatsApp() {
    console.log('📤 === ENVIANDO PRODUCTO POR WHATSAPP DESDE DETALLE ===');

    try {
        // ✅ OBTENER DATOS DEL CONTEXTO DEL PRODUCTO
        const contexto = window.productoContexto;

        if (!contexto) {
            console.error('❌ No hay contexto del producto disponible');
            mostrarNotificacion('No se pudo identificar el producto para compartir.', 'danger');
            return;
        }

        // ✅ PREPARAR DATOS DEL PRODUCTO
        const nombre = contexto.nombre || 'Producto';
        const precio = contexto.precio || '0';
        const stock = contexto.stock || 0;
        const productoId = contexto.id;
        const imagenPrincipal = contexto.imagenPrincipal || '';

        console.log('📦 Datos del producto:', { nombre, precio, stock, productoId });

        // ✅ VERIFICAR SI EXISTE EL MODAL DE WHATSAPP
        if ($("#modalWhatsAppNumero").length > 0) {
            console.log('📱 Usando modal de WhatsApp');

            // Configurar el producto para compartir globalmente
            const baseUrl = window.appConfig ? window.appConfig.webBaseUrl : window.location.origin;
            window.productoParaCompartir = {
                nombre: nombre,
                precio: `₡${precio}`,
                stock: `${stock} unidades`,
                medida: contexto.medida || '',
                marca: contexto.marca || '',
                urlImagen: imagenPrincipal,
                urlProducto: `https://llantasymastc.com/Public/DetalleProducto/${productoId}`,

            };

            console.log('📦 Producto configurado para compartir:', window.productoParaCompartir);

            // Mostrar el modal primero
            $("#modalWhatsAppNumero").modal("show");

        } else {
            console.log('📱 Envío directo sin modal');

            // ✅ CONSTRUIR MENSAJE UNIFICADO - Usar configuración dinámica
            const baseUrl = window.appConfig ? window.appConfig.webBaseUrl : window.location.origin;
            let mensaje = `¡Hola! Te comparto este producto:\n\n`;
            mensaje += `${nombre}\n`;
            
            // Agregar información de llanta si está disponible
            if (contexto.medida && contexto.medida !== '-' && contexto.medida !== '') {
                mensaje += `Medida: ${contexto.medida}\n`;
            }
            if (contexto.marca && contexto.marca !== '-' && contexto.marca !== '') {
                mensaje += `Marca: ${contexto.marca}\n`;
            }
            
            mensaje += `Precio: ₡${precio}\n`;
            mensaje += `Stock: ${stock} unidades\n`;
            mensaje += `Más detalles: ${baseUrl}/Inventario/DetalleProducto/${productoId}\n\n`;

            if (imagenPrincipal && !imagenPrincipal.includes('no-image.png')) {
                mensaje += `Imagen: ${window.appConfig ? window.appConfig.apiBaseUrl : baseUrl}${imagenPrincipal}`;
            }

            // Crear URL de WhatsApp
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

            // Abrir WhatsApp
            window.open(whatsappUrl, '_blank');

            // Mostrar notificación
            mostrarNotificacion('Producto compartido por WhatsApp exitosamente', 'success');
        }

    } catch (error) {
        console.error('❌ Error al enviar por WhatsApp:', error);
        mostrarNotificacion('Error al compartir por WhatsApp: ' + error.message, 'danger');
    }
}

/**
 * Función para enviar con número específico (llamada desde el modal)
 */
function enviarConNumeroEspecifico() {
    console.log('📞 === ENVIANDO CON NÚMERO ESPECÍFICO ===');

    const numeroWhatsApp = $("#numeroWhatsApp").val().replace(/\D/g, '');
    const incluirImagen = $("#incluirImagen").is(":checked");
    const producto = window.productoParaCompartir;

    if (!producto) {
        mostrarNotificacion("Error: No hay producto seleccionado para enviar.", "danger");
        return;
    }

    if (numeroWhatsApp.length !== 8) {
        mostrarNotificacion("Por favor, ingrese un número de WhatsApp válido de 8 dígitos.", "warning");
        return;
    }

    try {
        // ✅ CONSTRUIR MENSAJE CON FORMATO UNIFICADO
        let mensaje = `¡Hola! Te comparto este producto:\n\n`;
        mensaje += `${producto.nombre}\n`;

        // Agregar información de llanta si está disponible en el producto
        if (producto.medida && producto.medida !== '-' && producto.medida !== '') {
            mensaje += `Medida: ${producto.medida}\n`;
        }
        if (producto.marca && producto.marca !== '-' && producto.marca !== '') {
            mensaje += `Marca: ${producto.marca}\n`;
        }

        mensaje += `Precio: ${producto.precio}\n`;
        mensaje += `Stock: ${producto.stock}\n`;

        // Usar URL pública para enlaces
        const baseUrl = `https://llantasymastc.com`
        // Asegurarse de que el productoId esté disponible
        const productoId = window.productoContexto?.id || 'unknown';
        mensaje += `Más detalles: ${baseUrl}/Public/DetalleProducto/${productoId}\n\n`;

        if (incluirImagen && producto.urlImagen && !producto.urlImagen.includes('no-image.png')) {
            mensaje += `Imagen: ${window.appConfig ? window.appConfig.apiBaseUrl : baseUrl}${producto.urlImagen}`;
        }

        // Construir URL de WhatsApp con número específico
        const urlWhatsApp = `https://wa.me/506${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

        // Mostrar estado de carga
        const $btnEnviar = $("#btnEnviarWhatsApp");
        $btnEnviar.find('.normal-state').hide();
        $btnEnviar.find('.loading-state').show();
        $btnEnviar.prop('disabled', true);

        // Simular envío y abrir WhatsApp
        setTimeout(() => {
            window.open(urlWhatsApp, '_blank');

            // Ocultar modal y mostrar notificación
            $("#modalWhatsAppNumero").modal("hide");
            mostrarNotificacion("Mensaje enviado a WhatsApp correctamente", "success");

            // Restablecer estado del botón
            $btnEnviar.find('.loading-state').hide();
            $btnEnviar.find('.normal-state').show();
            $btnEnviar.prop('disabled', true);

        }, 1500);

    } catch (error) {
        console.error('❌ Error al enviar por WhatsApp:', error);
        mostrarNotificacion("Error al enviar por WhatsApp: " + error.message, "danger");
    }
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