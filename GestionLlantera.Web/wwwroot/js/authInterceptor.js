
// Interceptor global para manejar respuestas de autenticación
(function() {
    'use strict';

    // Sobrescribir fetch para interceptar respuestas 401
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch.apply(this, args);
            
            // Verificar si es una respuesta 401 (Unauthorized)
            if (response.status === 401) {
                try {
                    const data = await response.clone().json();
                    
                    // Si el token fue invalidado específicamente
                    if (data.code === 'TOKEN_INVALIDATED') {
                        console.log('🔒 Token invalidado detectado - manejando logout automático');
                        
                        // Limpiar tokens locales
                        localStorage.removeItem('authToken');
                        sessionStorage.removeItem('authToken');
                        
                        // Mostrar mensaje
                        mostrarAlertaSesionInvalidada(data.message);
                        
                        // Redirigir al login después de un breve delay
                        setTimeout(() => {
                            window.location.href = '/Account/Login';
                        }, 3000);
                        
                        return response;
                    }
                } catch (parseError) {
                    console.log('No se pudo parsear respuesta 401:', parseError);
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error en interceptor fetch:', error);
            throw error;
        }
    };

    // Función para mostrar alerta de sesión invalidada
    function mostrarAlertaSesionInvalidada(mensaje) {
        // Remover alertas previas
        const alertasPrevias = document.querySelectorAll('.alerta-sesion-invalidada');
        alertasPrevias.forEach(alerta => alerta.remove());
        
        // Crear nueva alerta
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-warning alert-dismissible fade show position-fixed alerta-sesion-invalidada';
        alerta.style.cssText = `
            top: 20px; 
            left: 50%; 
            transform: translateX(-50%); 
            z-index: 9999; 
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        alerta.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                <div>
                    <strong>Sesión Invalidada</strong><br>
                    <small>${mensaje || 'Sus permisos han sido modificados. Redirigiendo al login...'}</small>
                </div>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(alerta);
        
        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 10000);
    }

    console.log('🔐 Auth interceptor cargado - monitoreando tokens invalidados');
})();
</alerta.remove();
        }, 10000);
    }

    console.log('🔐 Auth interceptor cargado - monitoreando tokens invalidados');
})();
