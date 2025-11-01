// ========================================
// DETALLE DE PRODUCTO PÚBLICO - JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Módulo de detalle de producto público cargado');

    // Verificar y corregir URLs de imágenes al cargar
    verificarImagenesProducto();

    // Inicializar funcionalidades
    inicializarGaleriaImagenes();
    inicializarModalImagen();
    inicializarAnimaciones();

    console.log('✅ Detalle de producto público inicializado correctamente');
});

// ========================================
// VERIFICACIÓN Y CORRECCIÓN DE IMÁGENES
// ========================================
function verificarImagenesProducto() {
    console.log('🖼️ Verificando imágenes del producto...');

    // Obtener todas las imágenes del producto
    const imagenPrincipal = document.getElementById('imagenPrincipal');
    const miniaturas = document.querySelectorAll('.miniatura img');

    // Verificar imagen principal
    if (imagenPrincipal) {
        console.log('🖼️ URL imagen principal original:', imagenPrincipal.src);
        const urlCorregida = construirUrlImagenCompleta(imagenPrincipal.src);
        if (urlCorregida !== imagenPrincipal.src) {
            console.log('🖼️ Corrigiendo URL imagen principal a:', urlCorregida);
            imagenPrincipal.src = urlCorregida;
        }

        imagenPrincipal.onerror = function () {
            console.warn('⚠️ Error cargando imagen principal, usando imagen por defecto');

            // Evitar bucle infinito
            this.onerror = null;

            // Asignar imagen por defecto solo una vez
            if (!this.src.includes('no-image.png')) {
                this.src = '/images/no-image.png';
            }
        };

    }

    // Verificar miniaturas
    miniaturas.forEach((miniatura, index) => {
        console.log(`🖼️ URL miniatura ${index + 1} original:`, miniatura.src);
        const urlCorregida = construirUrlImagenCompleta(miniatura.src);
        if (urlCorregida !== miniatura.src) {
            console.log(`🖼️ Corrigiendo URL miniatura ${index + 1} a:`, urlCorregida);
            miniatura.src = urlCorregida;

            // Actualizar también el data-imagen del contenedor padre
            const contenedorMiniatura = miniatura.closest('.miniatura');
            if (contenedorMiniatura) {
                contenedorMiniatura.setAttribute('data-imagen', urlCorregida);
            }
        }

        miniatura.onerror = function () {
            console.warn(`⚠️ Error cargando miniatura ${index + 1}, usando imagen por defecto`);
            this.onerror = null;
            if (!this.src.includes('no-image.png')) {
                this.src = '/images/no-image.png';
            }
        };

    });
}

// ========================================
// FUNCIÓN PARA CONSTRUIR URL COMPLETA DE IMAGEN
// ========================================
function construirUrlImagenCompleta(url) {
    if (!url || url.trim() === '' || url.includes('no-image.png')) {
        return '/images/no-image.png';
    }

    console.log('🔧 construirUrlImagenCompleta - URL recibida:', url);
    console.log('🔧 Hostname actual:', window.location.hostname);
    console.log('🔧 Protocol actual:', window.location.protocol);

    // DETECTAR ENTORNO
    const esDesarrollo = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost') ||
                       window.location.port === '5000';

    const esHTTPS = window.location.protocol === 'https:';

    // Si es una URL completa del dominio de producción en desarrollo local, convertirla
    if (esDesarrollo && url.includes('apillantasymast.somee.com')) {
        // Extraer solo la parte relativa de la URL
        const match = url.match(/\/uploads\/productos\/.+$/);
        if (match) {
            const rutaRelativa = match[0];
            // Usar la API local 
            const urlLocal = `http://localhost:5049${rutaRelativa}`;
            console.log('🔧 ✅ URL convertida para desarrollo local:', urlLocal);
            return urlLocal;
        }
    }

    // Si ya es una URL completa y estamos en desarrollo local
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // En desarrollo local con localhost, mantener la URL tal como está
        if (esDesarrollo && (url.includes('localhost') || url.includes('127.0.0.1'))) {
            return url;
        }

        // En producción, asegurar HTTPS
        if (!esDesarrollo && url.startsWith('http://')) {
            const urlHTTPS = url.replace('http://', 'https://');
            console.log('🔧 ✅ URL convertida a HTTPS:', urlHTTPS);
            return urlHTTPS;
        }

        return url;
    }

    // Si es una URL relativa que empieza con /uploads/, construir URL completa
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
        // Asegurar que la URL empiece con /
        const urlLimpia = url.startsWith('/') ? url : `/${url}`;

        // Si estamos en producción y es una URL relativa
        const esProduccionReal = window.location.hostname.includes('llantasymastc.com');

        if (esProduccionReal && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
            const urlLimpia = url.startsWith('/') ? url : `/${url}`;
            const urlProduccion = `https://apillantasymast.somee.com${urlLimpia}`;
            console.log('🔧 ✅ URL construida para producción real:', urlProduccion);
            return urlProduccion;
        }

        // Si estamos en desarrollo y es una URL relativa
        if (esDesarrollo && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
            const urlLimpia = url.startsWith('/') ? url : `/${url}`;
            const urlLocal = `http://localhost:8000${urlLimpia}`;
            console.log('🔧 ✅ URL construida para desarrollo local:', urlLocal);
            return urlLocal;
        }
    }

    // Si es otro tipo de URL relativa, usar imagen por defecto
    console.log('🔧 ⚠️ URL no reconocida, usando imagen por defecto');
    return '/images/no-image.png';
}

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

    // Construir URL correcta para la imagen
    const urlCorregida = construirUrlImagenCompleta(imagenUrl);
    console.log('🖼️ Cambiando imagen principal a:', urlCorregida);

    if (imagenPrincipal) {
        // Efecto de transición suave
        imagenPrincipal.style.opacity = '0.5';

        setTimeout(() => {
            imagenPrincipal.src = urlCorregida;
            imagenPrincipal.style.opacity = '1';

            // Verificar si la imagen se carga correctamente
            imagenPrincipal.onerror = function() {
                console.warn('⚠️ Error cargando imagen principal cambiada, usando imagen por defecto');
                this.src = '/images/no-image.png';
                this.style.opacity = '1';
            };
        }, 150);
    }

    if (imagenModal) {
        imagenModal.src = urlCorregida;

        // Verificar si la imagen del modal se carga correctamente
        imagenModal.onerror = function() {
            console.warn('⚠️ Error cargando imagen del modal, usando imagen por defecto');
            this.src = '/images/no-image.png';
        };
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