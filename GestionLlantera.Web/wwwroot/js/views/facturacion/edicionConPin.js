// ===== EDICIÓN DE FACTURAS CON PIN =====

let facturaIdParaEditar = null;

/**
 * Abre el modal de PIN para desbloquear una factura
 */
function solicitarPinParaEditar(facturaId, numeroFactura) {
    console.log('🔐 Solicitando PIN para editar factura:', numeroFactura);

    facturaIdParaEditar = facturaId;

    // Limpiar el campo de PIN
    $('#pinEdicionFactura').val('').removeClass('is-invalid');

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalPinEdicion'));
    modal.show();

    // Focus en el campo de PIN
    setTimeout(() => {
        $('#pinEdicionFactura').focus();
    }, 500);
}

/**
 * Valida el PIN y desbloquea la factura
 */
async function validarPinYDesbloquear() {
    const pin = $('#pinEdicionFactura').val();
    const $btnValidar = $('#btnValidarPin');

    if (!pin) {
        $('#pinEdicionFactura').addClass('is-invalid');
        return;
    }

    try {
        // Mostrar estado de carga
        $btnValidar.prop('disabled', true);
        $btnValidar.find('.normal-state').hide();
        $btnValidar.find('.loading-state').show();

        console.log('🔐 Validando PIN...');

        const response = await fetch('/Facturacion/ValidarPinEdicion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin: pin })
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log('✅ PIN validado correctamente');

            // Desbloquear la factura
            await desbloquearFactura(facturaIdParaEditar, pin);

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalPinEdicion'));
            modal.hide();

        } else {
            console.log('❌ PIN incorrecto');
            $('#pinEdicionFactura').addClass('is-invalid').val('').focus();

            Swal.fire({
                icon: 'error',
                title: 'PIN Incorrecto',
                text: 'El PIN ingresado no es correcto. Intente nuevamente.',
                confirmButtonColor: '#dc3545'
            });
        }

    } catch (error) {
        console.error('❌ Error validando PIN:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al validar el PIN. Intente nuevamente.',
            confirmButtonColor: '#dc3545'
        });

    } finally {
        // Restaurar botón
        $btnValidar.prop('disabled', false);
        $btnValidar.find('.normal-state').show();
        $btnValidar.find('.loading-state').hide();
    }
}

/**
 * Desbloquea la factura en el backend
 */
async function desbloquearFactura(facturaId, pin) {
    try {
        const response = await fetch(`/Facturacion/DesbloquearFacturaParaEdicion?facturaId=${facturaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin: pin })
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log('✅ Factura desbloqueada exitosamente');

            Swal.fire({
                icon: 'success',
                title: 'Factura Desbloqueada',
                html: `
                    <p>La factura <strong>${resultado.numeroFactura}</strong> ha sido desbloqueada para edición.</p>
                    <p class="small text-muted">Estado anterior: ${resultado.estadoAnterior} → Actual: ${resultado.estadoActual}</p>
                `,
                confirmButtonColor: '#28a745'
            }).then(() => {
                // Recargar la lista de facturas
                if (typeof cargarFacturasPendientes === 'function') {
                    cargarFacturasPendientes();
                }

                // Redirigir a la pantalla de edición si existe
                // window.location.href = `/Facturacion/Editar/${facturaId}`;
            });

        } else {
            throw new Error(resultado.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('❌ Error desbloqueando factura:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo desbloquear la factura. ' + error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

// ===== EVENTOS =====
$(document).ready(function() {
    // Validar al presionar Enter en el campo de PIN
    $('#pinEdicionFactura').on('keypress', function(e) {
        if (e.which === 13) {
            validarPinYDesbloquear();
        }
    });

    // Botón de validar PIN
    $('#btnValidarPin').on('click', function() {
        validarPinYDesbloquear();
    });

    // Limpiar validación al escribir
    $('#pinEdicionFactura').on('input', function() {
        $(this).removeClass('is-invalid');
    });
});

// Exportar funciones globalmente
window.solicitarPinParaEditar = solicitarPinParaEditar;
window.validarPinYDesbloquear = validarPinYDesbloquear;

console.log('✅ Módulo de edición con PIN cargado');
