// ===== SISTEMA DE ZOOM DE IMÁGENES SIMPLIFICADO =====

/**
 * ✅ FUNCIÓN SIMPLE: Abrir zoom de imagen
 */
function abrirZoomImagen(urlImagen, nombreProducto) {
    console.log('🔍 Abriendo zoom:', urlImagen);

    // Crear modal simple
    const modalHTML = `
        <div class="modal fade" id="modalZoomSimple" tabindex="-1" style="z-index: 9999;">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content bg-dark">
                    <div class="modal-header border-0">
                        <h5 class="modal-title text-white">
                            <i class="bi bi-zoom-in me-2"></i>${nombreProducto || 'Imagen Ampliada'}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body d-flex justify-content-center align-items-center p-0">
                        <img src="${urlImagen}" 
                             alt="${nombreProducto}" 
                             class="img-fluid" 
                             style="max-height: 95vh; max-width: 95vw; object-fit: contain; min-height: 70vh; min-width: 70vw;">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior
    $('#modalZoomSimple').remove();

    // Agregar y mostrar nuevo modal
    $('body').append(modalHTML);
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
                <img src="${urlCompleta}" 
                     class="img-fluid rounded mb-3" 
                     alt="${producto.nombreProducto}"
                     style="max-height: 300px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                     data-url="${urlCompleta}" 
                     data-nombre="${nombreEscapado}"
                     onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))">
                <br>
                <button type="button" 
                        class="btn btn-primary btn-sm"
                        data-url="${urlCompleta}" 
                        data-nombre="${nombreEscapado}"
                        onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))">
                    <i class="bi bi-zoom-in me-1"></i>Ampliar
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
                        <img src="${urlCompleta}" 
                             class="img-fluid rounded" 
                             alt="${producto.nombreProducto}"
                             style="max-height: 300px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                             data-url="${urlCompleta}" 
                             data-nombre="${nombreEscapado}"
                             onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))">
                        <br><br>
                        <button type="button" 
                                class="btn btn-primary btn-sm"
                                data-url="${urlCompleta}" 
                                data-nombre="${nombreEscapado}"
                                onclick="window.abrirZoomImagen(this.getAttribute('data-url'), this.getAttribute('data-nombre'))">
                            <i class="bi bi-zoom-in me-1"></i>Ampliar
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