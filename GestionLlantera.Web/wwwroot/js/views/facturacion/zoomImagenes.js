// ===== SISTEMA DE ZOOM DE IMÁGENES SIMPLIFICADO =====

/**
 * ✅ FUNCIÓN SIMPLE: Abrir zoom de imagen
 */
function abrirZoomImagen(urlImagen, nombreProducto) {
    console.log('🔍 Abriendo zoom:', urlImagen);

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
                                 class="img-fluid zoom-image">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior
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
 * ✅ FUNCIÓN SIMPLE: Cargar imágenes del producto
 */
function cargarImagenesDetallesProducto(producto) {
    console.log('🖼️ Cargando imágenes de:', producto.nombreProducto);

    const contenedor = $('#contenedorImagenesDetalles');
    if (!contenedor.length) return;

    // Obtener imágenes del producto
    let imagenesArray = [];

    if (producto.imagenesProductos && producto.imagenesProductos.length > 0) {
        imagenesArray = producto.imagenesProductos.map(img => img.Urlimagen || img.urlImagen).filter(url => url);
    } else if (producto.imagenesUrls && producto.imagenesUrls.length > 0) {
        imagenesArray = producto.imagenesUrls.filter(url => url);
    }

    if (imagenesArray.length === 0) {
        contenedor.html('<div class="text-center text-muted p-4"><i class="bi bi-image display-1"></i><p>Sin imágenes</p></div>');
        return;
    }

    // Construir URL completa
    function construirUrl(url) {
        if (url.startsWith('http')) return url;
        return url.startsWith('/') ? `https://localhost:7273${url}` : `https://localhost:7273/${url}`;
    }

    // Función para escapar caracteres especiales
    function escaparTexto(texto) {
        return texto.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    // Generar HTML para las imágenes
    let htmlImagenes = '';

    if (imagenesArray.length === 1) {
        const urlCompleta = construirUrl(imagenesArray[0]);
        const nombreEscapado = escaparTexto(producto.nombreProducto);
        
        htmlImagenes = `
            <div class="text-center">
                <div class="imagen-container" style="width: 100%; height: 320px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;">
                    <img src="${urlCompleta}" 
                         class="img-fluid" 
                         alt="${producto.nombreProducto}"
                         style="width: 100%; height: 100%; object-fit: contain; cursor: pointer; transition: transform 0.3s ease;"
                         data-url="${urlCompleta}" 
                         data-nombre="${nombreEscapado}"
                         onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))"
                         onmouseover="this.style.transform='scale(1.02)'"
                         onmouseout="this.style.transform='scale(1)'">
                </div>
                <button type="button" 
                        class="btn btn-primary btn-sm"
                        data-url="${urlCompleta}" 
                        data-nombre="${nombreEscapado}"
                        onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))"
                        style="padding: 0.5rem 1rem; border-radius: 8px; font-weight: 500;">
                    <i class="bi bi-zoom-in me-1"></i>Ampliar Imagen
                </button>
            </div>
        `;
    } else {
        // Múltiples imágenes - carrusel simple
        let slides = '';
        let indicators = '';

        imagenesArray.forEach((url, index) => {
            const urlCompleta = construirUrl(url);
            const nombreEscapado = escaparTexto(producto.nombreProducto);
            const activa = index === 0 ? 'active' : '';

            indicators += `<button type="button" data-bs-target="#carruselProducto" data-bs-slide-to="${index}" class="${activa}"></button>`;

            slides += `
                <div class="carousel-item ${activa}">
                    <div class="text-center">
                        <div class="imagen-container" style="width: 100%; height: 320px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;">
                            <img src="${urlCompleta}" 
                                 class="img-fluid" 
                                 alt="${producto.nombreProducto}"
                                 style="width: 100%; height: 100%; object-fit: contain; cursor: pointer; transition: transform 0.3s ease;"
                                 data-url="${urlCompleta}" 
                                 data-nombre="${nombreEscapado}"
                                 onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))"
                                 onmouseover="this.style.transform='scale(1.02)'"
                                 onmouseout="this.style.transform='scale(1)'">
                        </div>
                        <button type="button" 
                                class="btn btn-primary btn-sm"
                                data-url="${urlCompleta}" 
                                data-nombre="${nombreEscapado}"
                                onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))"
                                style="padding: 0.5rem 1rem; border-radius: 8px; font-weight: 500;">
                            <i class="bi bi-zoom-in me-1"></i>Ampliar Imagen
                        </button>
                    </div>
                </div>
            `;
        });

        htmlImagenes = `
            <div id="carruselProducto" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">${indicators}</div>
                <div class="carousel-inner">${slides}</div>
                <button class="carousel-control-prev" type="button" data-bs-target="#carruselProducto" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#carruselProducto" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </button>
            </div>
        `;
    }

    contenedor.html(htmlImagenes);
}

// Exportar funciones globalmente
window.abrirZoomImagen = abrirZoomImagen;
window.cargarImagenesDetallesProducto = cargarImagenesDetallesProducto;

console.log('✅ Sistema de zoom simplificado cargado');