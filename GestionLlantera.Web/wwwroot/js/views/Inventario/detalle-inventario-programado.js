
// /wwwroot/js/views/inventario/detalle-inventario-programado.js

document.addEventListener('DOMContentLoaded', function () {
    console.log('🔧 JavaScript cargado para detalle inventario programado');
    
    // Configurar botón de iniciar inventario
    configurarBotonIniciarInventario();
});

function configurarBotonIniciarInventario() {
    const iniciarInventarioBtn = document.querySelector('.iniciar-inventario-btn');
    console.log('🔧 Botón encontrado:', iniciarInventarioBtn);
    
    if (iniciarInventarioBtn) {
        console.log('🔧 Agregando event listener al botón');
        iniciarInventarioBtn.addEventListener('click', function() {
            console.log('🔧 ¡CLICK DETECTADO!');
            const inventarioId = this.getAttribute('data-id');
            console.log('🔧 ID del inventario:', inventarioId);
            
            // Mostrar SweetAlert de confirmación
            mostrarConfirmacionIniciarInventario(inventarioId);
        });
    } else {
        console.log('❌ NO se encontró el botón con clase .iniciar-inventario-btn');
    }
}

function mostrarConfirmacionIniciarInventario(inventarioId) {
    Swal.fire({
        title: '¿Está seguro de que desea iniciar este inventario?',
        html: `
            <div class="text-start">
                <p><strong>Al iniciar el inventario:</strong></p>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>Se notificará a todos los usuarios asignados</li>
                    <li>Podrán comenzar el conteo físico</li>
                    <li>El estado cambiará a "En Progreso"</li>
                </ul>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-play me-1"></i> Iniciar Inventario',
        cancelButtonText: '<i class="fas fa-times me-1"></i> Cancelar',
        customClass: {
            popup: 'swal-wide'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            iniciarInventario(inventarioId);
        }
    });
}

// Función para iniciar el inventario
async function iniciarInventario(inventarioId) {
    try {
        console.log('🚀 Iniciando inventario:', inventarioId);
        
        // Mostrar loading
        Swal.fire({
            title: 'Iniciando inventario...',
            html: 'Por favor espere mientras se procesa la solicitud',
            timerProgressBar: true,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Llamar al controlador para iniciar el inventario
        const response = await fetch(`/TomaInventario/IniciarInventario/${inventarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const resultado = await response.json();
        console.log('📡 Respuesta del servidor:', resultado);
        
        if (resultado.success) {
            console.log('✅ Inventario iniciado exitosamente');
            
            // Mostrar mensaje de éxito con opción de redirección
            Swal.fire({
                title: '¡Éxito!',
                text: resultado.message || 'Inventario iniciado exitosamente',
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="fas fa-tablet me-1"></i> Ir a Toma de Inventario',
                cancelButtonText: '<i class="fas fa-refresh me-1"></i> Recargar Página'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Redirigir a la vista de ejecución
                    window.location.href = `/TomaInventario/Ejecutar/${inventarioId}`;
                } else {
                    // Recargar la página actual
                    window.location.reload();
                }
            });
        } else {
            console.error('❌ Error al iniciar inventario:', resultado.message);
            
            // Mostrar error
            Swal.fire({
                title: 'Error',
                text: resultado.message || 'No se pudo iniciar el inventario',
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        }
        
    } catch (error) {
        console.error('💥 Error crítico:', error);
        
        // Mostrar error crítico
        Swal.fire({
            title: 'Error de Conexión',
            text: 'Error de conexión. Inténtelo nuevamente.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}
