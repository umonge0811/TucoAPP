
// ========================================
// DETALLE DE PRODUCTO PÚBLICO - JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Módulo de detalle de producto público cargado');
    
    // Inicializar funcionalidades
    inicializarGaleriaImagenes();
    inicializarModalImagen();
    inicializarAnimaciones();
    
    console.log('✅ Detalle de producto público inicializado correctamente');
});

// ========================================
// GALERÍA DE IMÁGENES
// ========================================
function inicializarGaleriaImagenes() {
    const miniaturas = document.querySelectorAll('.miniatura');
    
    if (miniaturas.length === 0) return;
    
    miniaturas.forEach(function(miniatura) {
        miniatura.addEventListener('click', function() {
            const imagenUrl = this.getAttribute('data-imagen');
            cambiarImagenPrincipal(imagenUrl, this);
        });
    });
}

function cambiarImagenPrincipal(imagenUrl, elemento) {
    const imagenPrincipal = document.getElementById('imagenPrincipal');
    const imagenModal = document.getElementById('imagenModalGrande');
    
    if (imagenPrincipal) {
        // Efecto de transición suave
        imagenPrincipal.style.opacity = '0.5';
        
        setTimeout(() => {
            imagenPrincipal.src = imagenUrl;
            imagenPrincipal.style.opacity = '1';
        }, 150);
    }
    
    if (imagenModal) {
        imagenModal.src = imagenUrl;
    }
    
    // Actualizar estado activo de miniaturas
    document.querySelectorAll('.miniatura').forEach(function(mini) {
        mini.classList.remove('active');
    });
    
    if (elemento) {
        elemento.classList.add('active');
    }
}

// ========================================
// MODAL DE IMAGEN GRANDE
// ========================================
function inicializarModalImagen() {
    const imagenPrincipal = document.getElementById('imagenPrincipal');
    const modalImagen = document.getElementById('modalImagenGrande');
    
    if (!imagenPrincipal || !modalImagen) return;
    
    // Actualizar imagen del modal cuando se abre
    modalImagen.addEventListener('show.bs.modal', function() {
        const imagenActual = imagenPrincipal.src;
        const imagenModal = document.getElementById('imagenModalGrande');
        
        if (imagenModal) {
            imagenModal.src = imagenActual;
        }
    });
    
    // Navegación con teclado en el modal
    document.addEventListener('keydown', function(e) {
        if (modalImagen.classList.contains('show')) {
            if (e.key === 'ArrowLeft') {
                navegarImagen(-1);
            } else if (e.key === 'ArrowRight') {
                navegarImagen(1);
            }
        }
    });
}

function navegarImagen(direccion) {
    const miniaturas = document.querySelectorAll('.miniatura');
    const activa = document.querySelector('.miniatura.active');
    
    if (miniaturas.length <= 1 || !activa) return;
    
    let indiceActual = Array.from(miniaturas).indexOf(activa);
    let nuevoIndice = indiceActual + direccion;
    
    if (nuevoIndice < 0) {
        nuevoIndice = miniaturas.length - 1;
    } else if (nuevoIndice >= miniaturas.length) {
        nuevoIndice = 0;
    }
    
    const nuevaMiniatura = miniaturas[nuevoIndice];
    const nuevaImagen = nuevaMiniatura.getAttribute('data-imagen');
    
    cambiarImagenPrincipal(nuevaImagen, nuevaMiniatura);
}

// ========================================
// ANIMACIONES
// ========================================
function inicializarAnimaciones() {
    // Animación de aparición escalonada
    const elementos = document.querySelectorAll('.galeria-producto, .info-producto');
    
    elementos.forEach(function(elemento, index) {
        elemento.style.opacity = '0';
        elemento.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            elemento.style.transition = 'all 0.6s ease-out';
            elemento.style.opacity = '1';
            elemento.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Observer para animaciones al hacer scroll
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observar secciones
    const secciones = document.querySelectorAll('.especificaciones-llanta, .descripcion-producto, .acciones-producto');
    secciones.forEach(function(seccion) {
        observer.observe(seccion);
    });
}

// ========================================
// UTILIDADES
// ========================================
function copiarEnlace() {
    const url = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function() {
            mostrarNotificacion('Enlace copiado', 'El enlace del producto ha sido copiado al portapapeles', 'success');
        });
    } else {
        // Fallback para navegadores más antiguos
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        mostrarNotificacion('Enlace copiado', 'El enlace del producto ha sido copiado', 'success');
    }
}

function mostrarNotificacion(titulo, mensaje, tipo = 'info') {
    // Toast simple sin dependencias externas
    const toastContainer = document.getElementById('toast-container') || crearContainerToast();
    
    const toast = document.createElement('div');
    toast.className = `toast-publico toast-${tipo}`;
    toast.innerHTML = `
        <div class="toast-header">
            <strong>${titulo}</strong>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="toast-body">${mensaje}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

function crearContainerToast() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1050;
        max-width: 350px;
    `;
    document.body.appendChild(container);
    return container;
}

// ========================================
// FUNCIONES GLOBALES
// ========================================
window.cambiarImagenPrincipal = cambiarImagenPrincipal;
window.navegarImagen = navegarImagen;
window.copiarEnlace = copiarEnlace;
