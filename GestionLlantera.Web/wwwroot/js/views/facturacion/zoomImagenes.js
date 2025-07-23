// ===== MÓDULO DE ZOOM DE IMÁGENES PARA FACTURACIÓN =====

/**
 * ✅ FUNCIÓN: Abrir modal de zoom para imagen
 */
function abrirZoomImagen(urlImagen, nombreProducto) {
    console.log('🔍 === ABRIENDO ZOOM DE IMAGEN ===');
    console.log('🔍 URL:', urlImagen);
    console.log('🔍 Producto:', nombreProducto);

    try {
        // Verificar si el modal de zoom ya existe, si no, crearlo.
        let modalZoom = document.getElementById('modalZoomImagen');
        if (!modalZoom) {
            const modalHtml = `
                <div class="modal fade" id="modalZoomImagen" tabindex="-1" aria-labelledby="modalZoomImagenLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-centered">
                        <div class="modal-content bg-transparent border-0">
                            <div class="modal-header border-0 bg-dark bg-opacity-75">
                                <h5 class="modal-title text-white" id="modalZoomImagenLabel">
                                    <i class="bi bi-zoom-in me-2"></i>Vista Ampliada
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body text-center p-0" style="background: rgba(0,0,0,0.8);">
                                <img id="imagenZoomDetalle" 
                                     src="" 
                                     alt="" 
                                     class="img-fluid" 
                                     style="max-height: 85vh; max-width: 100%; object-fit: contain;">
                                <div class="p-3">
                                    <h6 class="text-white mb-0" id="nombreProductoZoom"></h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modalZoom = document.getElementById('modalZoomImagen');
        }

        // Actualizar contenido del modal
        const imagenZoom = document.getElementById('imagenZoomDetalle');
        const nombreZoom = document.getElementById('nombreProductoZoom');
        const tituloModal = document.getElementById('modalZoomImagenLabel');

        if (imagenZoom) {
            imagenZoom.src = urlImagen;
            imagenZoom.alt = nombreProducto || 'Imagen del producto';
        }

        if (nombreZoom) {
            nombreZoom.textContent = nombreProducto || 'Producto';
        }

        if (tituloModal) {
            tituloModal.innerHTML = `<i class="bi bi-zoom-in me-2"></i>${nombreProducto || 'Vista Ampliada'}`;
        }

        // Mostrar modal
        const bsModal = new bootstrap.Modal(modalZoom);
        bsModal.show();

        console.log('✅ Modal de zoom mostrado correctamente');

    } catch (error) {
        console.error('❌ Error abriendo zoom de imagen:', error);
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'No se pudo abrir la imagen ampliada', 'danger');
        } else {
            alert('Error: No se pudo abrir la imagen ampliada');
        }
    }
}

/**
 * ✅ FUNCIÓN: Cerrar modal de zoom
 */
function cerrarModalZoom() {
    console.log('❌ Cerrando modal de zoom');
    const modalZoom = document.getElementById('modalZoomImagen');
    if (modalZoom) {
        const bsModal = bootstrap.Modal.getInstance(modalZoom);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

/**
 * ✅ FUNCIÓN: Cargar imágenes en modal de detalles del producto
 */
function cargarImagenesDetallesProducto(producto) {
    console.log('🖼️ === CARGANDO IMÁGENES DE PRODUCTO ===');
    console.log('🖼️ Producto recibido:', producto);

    const contenedor = $('#contenedorImagenesDetalles');
    if (!contenedor.length) {
        console.error('❌ Contenedor de imágenes no encontrado');
        return;
    }

    try {
        let imagenesArray = [];

        // Verificar diferentes fuentes de imágenes
        if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
            imagenesArray = producto.imagenesProductos
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
            console.log('🖼️ Imágenes desde imagenesProductos:', imagenesArray);
        } else if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
            imagenesArray = producto.imagenesUrls.filter(url => url && url.trim() !== '');
            console.log('🖼️ Imágenes desde imagenesUrls:', imagenesArray);
        } else if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
            imagenesArray = producto.imagenes
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
            console.log('🖼️ Imágenes desde imagenes:', imagenesArray);
        }

        if (imagenesArray.length === 0) {
            console.log('🖼️ No se encontraron imágenes, mostrando imagen por defecto');
            contenedor.html(`
                <div class="text-center">
                    <div class="sin-imagenes p-4">
                        <i class="bi bi-image-fill display-1 text-muted"></i>
                        <p class="mt-2 text-muted">Sin imágenes disponibles</p>
                    </div>
                </div>
            `);
            return;
        }

        if (imagenesArray.length === 1) {
            // Una sola imagen
            const urlImagen = imagenesArray[0];
            const imagenCompleta = construirUrlCompleta(urlImagen);

            contenedor.html(`
                <div class="imagen-container text-center">
                    <img src="${imagenCompleta}" 
                         class="imagen-producto-detalle img-fluid rounded cursor-pointer" 
                         alt="${producto.nombreProducto}"
                         style="max-height: 300px; transition: transform 0.3s ease; box-shadow: 0 4px 8px rgba(0,0,0,0.1); cursor: pointer;"
                         onclick="abrirZoomImagen('${imagenCompleta}', '${producto.nombreProducto}')"
                         onmouseover="this.style.transform='scale(1.05)'"
                         onmouseout="this.style.transform='scale(1)'"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes text-center text-muted p-4\\'><i class=\\'bi bi-image-fill display-1\\'></i><p class=\\'mt-2\\'>Error cargando imagen</p></div>';">
                    <div class="mt-2">
                        <button type="button" 
                                class="btn btn-primary btn-sm" 
                                onclick="abrirZoomImagen('${imagenCompleta}', '${producto.nombreProducto}')"
                                title="Ver imagen ampliada">
                            <i class="bi bi-zoom-in me-1"></i>
                            Ampliar Imagen
                        </button>
                    </div>
                </div>
            `);
        } else {
            // Múltiples imágenes con carrusel
            let htmlCarrusel = '';
            let indicadores = '';

            imagenesArray.forEach((urlImagen, index) => {
                const imagenCompleta = construirUrlCompleta(urlImagen);
                const activa = index === 0 ? 'active' : '';

                indicadores += `
                    <button type="button" 
                            data-bs-target="#carruselImagenesProducto" 
                            data-bs-slide-to="${index}" 
                            class="${activa}" 
                            aria-label="Imagen ${index + 1}"></button>
                `;

                htmlCarrusel += `
                    <div class="carousel-item ${activa}">
                        <div class="text-center">
                            <img src="${imagenCompleta}" 
                                 class="imagen-producto-detalle img-fluid rounded cursor-pointer" 
                                 alt="${producto.nombreProducto}"
                                 style="max-height: 300px; transition: transform 0.3s ease; box-shadow: 0 4px 8px rgba(0,0,0,0.1); cursor: pointer;"
                                 onclick="abrirZoomImagen('${imagenCompleta}', '${producto.nombreProducto}')"
                                 onmouseover="this.style.transform='scale(1.05)'"
                                 onmouseout="this.style.transform='scale(1)'"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes text-center text-muted p-4\\'><i class=\\'bi bi-image-fill display-1\\'></i><p class=\\'mt-2\\'>Error cargando imagen</p></div>';">
                            <div class="mt-2">
                                <button type="button" 
                                        class="btn btn-primary btn-sm" 
                                        onclick="abrirZoomImagen('${imagenCompleta}', '${producto.nombreProducto}')"
                                        title="Ver imagen ampliada">
                                    <i class="bi bi-zoom-in me-1"></i>
                                    Ampliar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            contenedor.html(`
                <div id="carruselImagenesProducto" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-indicators">
                        ${indicadores}
                    </div>
                    <div class="carousel-inner">
                        ${htmlCarrusel}
                    </div>
                    ${imagenesArray.length > 1 ? `
                        <button class="carousel-control-prev" type="button" data-bs-target="#carruselImagenesProducto" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Anterior</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#carruselImagenesProducto" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Siguiente</span>
                        </button>
                    ` : ''}
                </div>
            `);
        }

        console.log('✅ Imágenes cargadas exitosamente');

    } catch (error) {
        console.error('❌ Error cargando imágenes:', error);
        contenedor.html(`
            <div class="text-center">
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error cargando imágenes del producto
                </div>
            </div>
        `);
    }
}

/**
 * ✅ FUNCIÓN AUXILIAR: Construir URL completa para imágenes
 */
function construirUrlCompleta(urlImagen) {
    if (!urlImagen) return '/images/no-image.png';

    // Si ya es una URL completa, devolverla tal como está
    if (urlImagen.startsWith('http://') || urlImagen.startsWith('https://')) {
        return urlImagen;
    }

    // Construir URL completa para el servidor API
    if (urlImagen.startsWith('/uploads/productos/')) {
        return `https://localhost:7273${urlImagen}`;
    } else if (urlImagen.startsWith('uploads/productos/')) {
        return `https://localhost:7273/${urlImagen}`;
    } else if (urlImagen.startsWith('/')) {
        return `https://localhost:7273${urlImagen}`;
    } else {
        return `https://localhost:7273/${urlImagen}`;
    }
}

/**
 * ✅ FUNCIÓN: Configurar eventos de zoom para imágenes
 */
function configurarEventosZoomImagenes() {
    console.log('🔧 === CONFIGURANDO EVENTOS DE ZOOM ===');

    // Limpiar eventos anteriores
    $(document).off('click.zoom', '.imagen-zoom-click');

    // Configurar eventos con delegación
    $(document).on('click.zoom', '.imagen-zoom-click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🖱️ Click detectado en imagen para zoom');

        const urlImagen = $(this).attr('data-url-imagen') || $(this).attr('src');
        const nombreProducto = $(this).attr('data-nombre-producto') || $(this).attr('alt') || 'Producto';

        console.log('🔍 Abriendo zoom:', { urlImagen, nombreProducto });

        if (urlImagen && urlImagen !== '/images/no-image.png') {
            abrirZoomImagen(urlImagen, nombreProducto);
        } else {
            console.warn('⚠️ URL de imagen no válida para zoom:', urlImagen);
        }
    });

    console.log('✅ Eventos de zoom configurados correctamente');
}

// Inicializar eventos cuando el DOM esté listo
$(document).ready(function() {
    console.log('🖼️ === INICIALIZANDO MÓDULO DE ZOOM DE IMÁGENES ===');
    configurarEventosZoomImagenes();
    console.log('✅ Módulo de zoom de imágenes inicializado');
});

// Exportar funciones globalmente para uso desde HTML
window.abrirZoomImagen = abrirZoomImagen;
window.cerrarModalZoom = cerrarModalZoom;
window.cargarImagenesDetallesProducto = cargarImagenesDetallesProducto;
window.construirUrlCompleta = construirUrlCompleta;
window.configurarEventosZoomImagenes = configurarEventosZoomImagenes;

console.log('📦 Módulo zoomImagenes.js cargado correctamente');