
/**
 * MÓDULO DE ZOOM DE IMÁGENES
 * Gestiona la funcionalidad de zoom para imágenes de productos
 * Fecha: 2025
 */

console.log('📸 Módulo de zoom de imágenes cargado');

/**
 * Función principal para abrir modal de zoom de imagen
 * @param {string} urlImagen - URL de la imagen a mostrar
 * @param {string} nombreProducto - Nombre del producto para el alt
 */
function abrirZoomImagen(urlImagen, nombreProducto = 'Imagen del producto') {
    console.log('🔍 === ABRIENDO ZOOM DE IMAGEN ===');
    console.log('🔍 URL:', urlImagen);
    console.log('🔍 Producto:', nombreProducto);

    try {
        // Verificar que tenemos una URL válida
        if (!urlImagen || urlImagen.trim() === '') {
            console.error('❌ URL de imagen no válida');
            mostrarToast('Error', 'No se puede mostrar la imagen', 'warning');
            return;
        }

        // Crear o obtener el modal de zoom
        let modalZoom = document.getElementById('modalZoomImagen');
        
        if (!modalZoom) {
            console.log('🔍 Creando modal de zoom dinámicamente...');
            const modalHtml = `
                <div class="modal fade" id="modalZoomImagen" tabindex="-1" aria-labelledby="modalZoomImagenLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-centered">
                        <div class="modal-content bg-transparent border-0">
                            <div class="modal-header border-0 bg-dark bg-opacity-75 position-relative">
                                <h5 class="modal-title text-white" id="modalZoomImagenLabel">Vista ampliada</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body text-center p-0 bg-dark bg-opacity-75">
                                <div class="position-relative">
                                    <img id="imagenZoom" 
                                         src="" 
                                         alt="" 
                                         class="img-fluid" 
                                         style="max-height: 80vh; max-width: 100%; object-fit: contain; cursor: zoom-out;" 
                                         onclick="cerrarModalZoom()">
                                    <div id="loadingImagenZoom" class="position-absolute top-50 start-50 translate-middle text-white">
                                        <div class="spinner-border" role="status">
                                            <span class="visually-hidden">Cargando imagen...</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <small class="text-white-50">Click en la imagen o presiona ESC para cerrar</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modalZoom = document.getElementById('modalZoomImagen');
            
            // Agregar evento para cerrar con ESC
            modalZoom.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    cerrarModalZoom();
                }
            });
        }

        // Configurar la imagen
        const imagenZoom = document.getElementById('imagenZoom');
        const loadingZoom = document.getElementById('loadingImagenZoom');
        
        if (imagenZoom && loadingZoom) {
            // Mostrar loading
            loadingZoom.style.display = 'block';
            imagenZoom.style.opacity = '0';
            
            // Configurar la imagen
            imagenZoom.onload = function() {
                console.log('✅ Imagen cargada exitosamente en zoom');
                loadingZoom.style.display = 'none';
                imagenZoom.style.opacity = '1';
            };
            
            imagenZoom.onerror = function() {
                console.error('❌ Error cargando imagen en zoom');
                loadingZoom.innerHTML = '<div class="text-danger"><i class="bi bi-exclamation-triangle"></i><br>Error cargando imagen</div>';
            };
            
            imagenZoom.src = urlImagen;
            imagenZoom.alt = `Imagen ampliada de ${nombreProducto}`;
        }

        // Mostrar el modal
        const modal = new bootstrap.Modal(modalZoom, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        modal.show();
        
        // Enfocar el modal para que funcionen las teclas
        modalZoom.focus();
        
        console.log('✅ Modal de zoom mostrado correctamente');

    } catch (error) {
        console.error('❌ Error abriendo zoom de imagen:', error);
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'No se pudo abrir la imagen en zoom', 'danger');
        } else {
            alert('Error: No se pudo abrir la imagen en zoom');
        }
    }
}

/**
 * Función para cerrar el modal de zoom
 */
function cerrarModalZoom() {
    console.log('🔍 Cerrando modal de zoom...');
    const modalZoom = document.getElementById('modalZoomImagen');
    if (modalZoom) {
        const modal = bootstrap.Modal.getInstance(modalZoom);
        if (modal) {
            modal.hide();
        }
    }
}

/**
 * Función auxiliar para construir URL de imagen correcta
 * @param {string} urlOriginal - URL original de la imagen
 * @returns {string} URL construida correctamente
 */
function construirUrlImagen(urlOriginal) {
    if (!urlOriginal || urlOriginal.trim() === '') {
        return '/images/no-image.png';
    }

    const url = urlOriginal.trim();

    // Si ya es una URL completa, usarla directamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Construir URL para el servidor API
    if (url.startsWith('/uploads/productos/')) {
        return `https://localhost:7273${url}`;
    } else if (url.startsWith('uploads/productos/')) {
        return `https://localhost:7273/${url}`;
    } else if (url.startsWith('/')) {
        return `https://localhost:7273${url}`;
    } else {
        return `https://localhost:7273/${url}`;
    }
}

/**
 * Función para cargar imágenes en modal de detalles de producto
 * @param {object} producto - Objeto del producto con información de imágenes
 */
function cargarImagenesDetallesProducto(producto) {
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

        // Obtener todas las imágenes disponibles
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
                <div class="sin-imagenes text-center text-muted p-4">
                    <i class="bi bi-image-fill display-1"></i>
                    <p class="mt-2">No hay imágenes disponibles</p>
                </div>
            `);
            return;
        }

        if (imagenesArray.length === 1) {
            // Una sola imagen con zoom
            const urlImagen = construirUrlImagen(imagenesArray[0]);
            contenedor.html(`
                <div class="imagen-container text-center">
                    <img src="${urlImagen}" 
                         class="imagen-producto-detalle img-fluid rounded cursor-pointer" 
                         alt="${producto.nombreProducto}"
                         style="max-height: 300px; transition: transform 0.3s ease; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                         onclick="abrirZoomImagen('${urlImagen}', '${producto.nombreProducto}')"
                         onmouseover="this.style.transform='scale(1.05)'"
                         onmouseout="this.style.transform='scale(1)'"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes text-center text-muted p-4\\'><i class=\\'bi bi-image-fill display-1\\'></i><p class=\\'mt-2\\'>Error cargando imagen</p></div>';">
                    <p class="mt-2 small text-muted">Click para ampliar</p>
                </div>
            `);
        } else {
            // Múltiples imágenes - crear carrusel con zoom
            const carruselId = 'carruselImagenesDetalles';
            let htmlCarrusel = `
                <div id="${carruselId}" class="carousel slide" data-bs-ride="false">
                    <div class="carousel-inner">
            `;

            imagenesArray.forEach((url, index) => {
                const urlImagen = construirUrlImagen(url);
                const activa = index === 0 ? 'active' : '';
                htmlCarrusel += `
                    <div class="carousel-item ${activa}">
                        <div class="text-center">
                            <img src="${urlImagen}" 
                                 class="imagen-producto-detalle img-fluid rounded cursor-pointer" 
                                 alt="${producto.nombreProducto}"
                                 style="max-height: 300px; transition: transform 0.3s ease; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                                 onclick="abrirZoomImagen('${urlImagen}', '${producto.nombreProducto}')"
                                 onmouseover="this.style.transform='scale(1.05)'"
                                 onmouseout="this.style.transform='scale(1)'"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes text-center text-muted p-4\\'><i class=\\'bi bi-image-fill display-1\\'></i><p class=\\'mt-2\\'>Error cargando imagen</p></div>';">
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

            imagenesArray.forEach((_, index) => {
                const activa = index === 0 ? 'active' : '';
                htmlCarrusel += `
                    <button type="button" data-bs-target="#${carruselId}" data-bs-slide-to="${index}" ${activa ? 'class="active" aria-current="true"' : ''}></button>
                `;
            });

            htmlCarrusel += `
                    </div>
                    <p class="mt-2 small text-muted text-center">Click en las imágenes para ampliar</p>
                </div>
            `;

            contenedor.html(htmlCarrusel);
        }

        console.log('✅ Imágenes cargadas exitosamente en modal de detalles');

    } catch (error) {
        console.error('❌ Error cargando imágenes en modal de detalles:', error);
        $('#contenedorImagenesDetalles').html(`
            <div class="sin-imagenes text-center text-muted p-4">
                <i class="bi bi-exclamation-triangle-fill display-1 text-danger"></i>
                <p class="mt-2">Error cargando imágenes</p>
            </div>
        `);
    }
}

// Cerrar modal de zoom con tecla Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const modalZoom = document.getElementById('modalZoomImagen');
        if (modalZoom && modalZoom.classList.contains('show')) {
            cerrarModalZoom();
        }
    }
});

// Exportar funciones globalmente para uso desde HTML
window.abrirZoomImagen = abrirZoomImagen;
window.cerrarModalZoom = cerrarModalZoom;
window.cargarImagenesDetallesProducto = cargarImagenesDetallesProducto;
window.construirUrlImagen = construirUrlImagen;

console.log('✅ Módulo de zoom de imágenes inicializado correctamente');
console.log('📸 Funciones exportadas:', ['abrirZoomImagen', 'cerrarModalZoom', 'cargarImagenesDetallesProducto', 'construirUrlImagen']);
