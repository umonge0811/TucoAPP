
/**
 * ✅ SISTEMA DE ZOOM DE IMÁGENES PARA FACTURACIÓN
 * Módulo independiente para manejar zoom de imágenes en modales de productos
 */

console.log('📸 Iniciando módulo de zoom de imágenes...');

/**
 * ✅ FUNCIÓN PRINCIPAL: Abrir imagen en modal de zoom
 */
function abrirImagenEnModal(urlImagen, nombreProducto) {
    console.log('🔍 === ABRIENDO ZOOM DE IMAGEN ===');
    console.log('🔍 URL:', urlImagen);
    console.log('🔍 Producto:', nombreProducto);

    // Ocultar modal de detalles temporalmente
    const modalDetalles = $('#modalDetalleProducto, #modalSeleccionProducto');
    if (modalDetalles.length) {
        modalDetalles.css('opacity', '0');
    }

    // Crear modal mejorado con estructura corregida
    const modalHTML = `
        <div class="modal fade" id="modalZoomSimple" tabindex="-1" data-bs-backdrop="true" data-bs-keyboard="true">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title text-white d-flex align-items-center">
                            <i class="bi bi-zoom-in me-2" style="color: #17a2b8;"></i>
                            <span>${nombreProducto || 'Imagen Ampliada'}</span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body d-flex justify-content-center align-items-center">
                        <div class="image-container">
                            <img src="${urlImagen}" 
                                 alt="${nombreProducto}" 
                                 class="img-fluid zoom-image"
                                 onload="this.style.opacity='1'"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                                 style="opacity: 0; transition: opacity 0.3s ease;">
                            <div class="error-load-zoom text-white" style="display: none;">
                                <i class="bi bi-exclamation-triangle"></i>
                                <p>Error cargando imagen</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    $('#modalZoomSimple').remove();

    // Agregar y mostrar nuevo modal
    $('body').append(modalHTML);
    
    // Configurar eventos del modal de zoom
    $('#modalZoomSimple').on('hidden.bs.modal', function() {
        // Restaurar visibilidad del modal de detalles cuando se cierre el zoom
        const modalDetalles = $('#modalDetalleProducto, #modalSeleccionProducto');
        if (modalDetalles.length) {
            modalDetalles.css('opacity', '1');
        }
        // Remover el modal de zoom del DOM
        $(this).remove();
    });

    $('#modalZoomSimple').modal('show');
}

/**
 * ✅ FUNCIÓN: Cargar imágenes en el contenedor de detalles del producto
 */
async function cargarImagenesDetallesProducto(producto) {
    try {
        console.log('🖼️ === CARGANDO IMÁGENES EN MODAL DE DETALLES ===');
        console.log('🖼️ Producto:', producto.nombreProducto);
        console.log('🖼️ Datos del producto:', producto);

        const contenedor = $('#contenedorImagenesDetalles');

        // Mostrar loading inicial
        contenedor.html(`
            <div class="text-center text-muted">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                Cargando imágenes...
            </div>
        `);

        let imagenesArray = [];

        // Usar la misma lógica que en otros modales para obtener imágenes
        if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
            imagenesArray = producto.imagenesProductos
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
        } else if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
            imagenesArray = producto.imagenesUrls.filter(url => url && url.trim() !== '');
        } else if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
            imagenesArray = producto.imagenes
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
        }

        console.log('🖼️ Imágenes encontradas:', imagenesArray.length);

        if (imagenesArray.length === 0) {
            // No hay imágenes
            contenedor.html(`
                <div class="sin-imagenes">
                    <i class="bi bi-image-fill"></i>
                    <span>No hay imágenes disponibles</span>
                </div>
            `);
            return;
        }

        if (imagenesArray.length === 1) {
            // Una sola imagen
            const urlImagen = construirUrlImagen(imagenesArray[0]);
            contenedor.html(`
                <div class="imagen-container-zoom" onclick="abrirImagenEnModal('${urlImagen}', '${producto.nombreProducto}')">
                    <img src="${urlImagen}" 
                         class="imagen-producto-detalle-zoom" 
                         alt="${producto.nombreProducto}"
                         onload="this.style.opacity='1'"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes\\'><i class=\\'bi bi-image-fill\\'></i><span>Error cargando imagen</span></div>';">
                    <div class="overlay-zoom">
                        <i class="bi bi-zoom-in"></i>
                        <span>Click para ampliar</span>
                    </div>
                </div>
            `);
        } else {
            // Múltiples imágenes - crear carrusel
            const carruselId = 'carruselImagenesDetalles';
            let htmlCarrusel = `
                <div id="${carruselId}" class="carousel slide carousel-zoom" data-bs-ride="carousel">
                    <div class="carousel-inner">
            `;

            imagenesArray.forEach((url, index) => {
                const urlImagen = construirUrlImagen(url);
                const activa = index === 0 ? 'active' : '';
                htmlCarrusel += `
                    <div class="carousel-item ${activa}">
                        <div class="imagen-container-zoom" onclick="abrirImagenEnModal('${urlImagen}', '${producto.nombreProducto}')">
                            <img src="${urlImagen}" 
                                 class="imagen-producto-detalle-zoom" 
                                 alt="${producto.nombreProducto}"
                                 onload="this.style.opacity='1'"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes\\'><i class=\\'bi bi-image-fill\\'></i><span>Error cargando imagen</span></div>';">
                            <div class="overlay-zoom">
                                <i class="bi bi-zoom-in"></i>
                                <span>Click para ampliar</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            htmlCarrusel += `
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#${carruselId}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Anterior</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#${carruselId}" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Siguiente</span>
                    </button>
                    <div class="carousel-indicators">
            `;

            // Agregar indicadores
            imagenesArray.forEach((url, index) => {
                const activa = index === 0 ? 'active' : '';
                htmlCarrusel += `
                    <button type="button" data-bs-target="#${carruselId}" data-bs-slide-to="${index}" 
                            class="${activa}" aria-current="${activa ? 'true' : 'false'}" 
                            aria-label="Slide ${index + 1}"></button>
                `;
            });

            htmlCarrusel += `
                    </div>
                </div>
            `;

            contenedor.html(htmlCarrusel);
        }

        console.log('✅ Imágenes cargadas correctamente en modal de detalles');

    } catch (error) {
        console.error('❌ Error cargando imágenes en modal de detalles:', error);
        const contenedor = $('#contenedorImagenesDetalles');
        contenedor.html(`
            <div class="sin-imagenes">
                <i class="bi bi-exclamation-triangle text-danger"></i>
                <span>Error cargando imágenes</span>
            </div>
        `);
    }
}

/**
 * ✅ FUNCIÓN: Construir URL de imagen correcta
 */
function construirUrlImagen(urlImagen) {
    if (!urlImagen || urlImagen.trim() === '') {
        return '/images/no-image.png';
    }

    // Si ya es una URL completa, usarla directamente
    if (urlImagen.startsWith('http://') || urlImagen.startsWith('https://')) {
        return urlImagen;
    }

    // Si es una ruta relativa, construir URL completa
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

// Exportar funciones globalmente
window.abrirImagenEnModal = abrirImagenEnModal;
window.cargarImagenesDetallesProducto = cargarImagenesDetallesProducto;
window.construirUrlImagen = construirUrlImagen;

console.log('✅ Sistema de zoom de imágenes cargado correctamente');
