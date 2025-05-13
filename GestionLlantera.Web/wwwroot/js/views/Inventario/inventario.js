// Corregir función para inventario.js

document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const searchInput = document.getElementById('searchText');
    const filterStock = document.getElementById('filterStock');
    const sortBy = document.getElementById('sortBy');
    const productosGrid = document.querySelector('.productos-grid');

    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    if (tooltipTriggerList.length) {
        Array.from(tooltipTriggerList).map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Funcionalidad de búsqueda y filtrado
    if (searchInput && filterStock && sortBy && productosGrid) {
        // Guardar todos los productos originales
        const productos = Array.from(productosGrid.querySelectorAll('.producto-card'));

        // Función para aplicar filtros y ordenar productos
        function actualizarVistaProductos() {
            // Código de filtrado y ordenamiento...
            // (mantener este código igual)
        }

        // Eventos para actualizar la vista
        searchInput.addEventListener('input', actualizarVistaProductos);
        filterStock.addEventListener('change', actualizarVistaProductos);
        sortBy.addEventListener('change', actualizarVistaProductos);
    }

    // Inicializar vista de tarjetas vs vista de lista
    const btnVistaLista = document.getElementById('btnVistaLista');
    const btnVistaTarjetas = document.getElementById('btnVistaTarjetas');
    const productosContenedor = document.querySelector('.productos-contenedor');

    if (btnVistaLista && btnVistaTarjetas && productosContenedor) {
        btnVistaLista.addEventListener('click', function () {
            productosContenedor.classList.remove('vista-tarjetas');
            productosContenedor.classList.add('vista-lista');
            btnVistaLista.classList.add('active');
            btnVistaTarjetas.classList.remove('active');
            localStorage.setItem('inventarioVista', 'lista');
        });

        btnVistaTarjetas.addEventListener('click', function () {
            productosContenedor.classList.remove('vista-lista');
            productosContenedor.classList.add('vista-tarjetas');
            btnVistaTarjetas.classList.add('active');
            btnVistaLista.classList.remove('active');
            localStorage.setItem('inventarioVista', 'tarjetas');
        });

        // Cargar preferencia guardada
        const vistaGuardada = localStorage.getItem('inventarioVista');
        if (vistaGuardada === 'lista') {
            btnVistaLista.click();
        } else {
            btnVistaTarjetas.click();
        }
    }
});

// Función para marcar producto como favorito
function toggleFavorito(button, productoId) {
    if (!button) return;

    button.disabled = true;
    const icon = button.querySelector('i');
    if (!icon) {
        button.disabled = false;
        return;
    }

    const esFavorito = icon.classList.contains('bi-star-fill');

    // Cambiar visualmente mientras se procesa
    icon.className = 'bi bi-hourglass-split';

    // Simular petición al servidor (reemplazar con AJAX real)
    setTimeout(function () {
        if (esFavorito) {
            icon.className = 'bi bi-star';
            toastr.info('Producto eliminado de favoritos');
        } else {
            icon.className = 'bi bi-star-fill';
            toastr.success('Producto añadido a favoritos');
        }
        button.disabled = false;
    }, 700);
}

// Función para vista rápida de producto
function vistaRapida(productoId) {
    // Mostrar loading
    Swal.fire({
        title: 'Cargando detalles...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Simular carga de datos (reemplazar con AJAX real)
    setTimeout(function () {
        // Aquí obtendrías los datos reales del producto desde el servidor
        const productoDemo = {
            nombre: 'Llanta Continental ExtremeContact',
            precio: '₡125,000',
            stock: 15,
            descripcion: 'Llanta de alto rendimiento para SUVs y sedanes deportivos.',
            imagenUrl: 'https://via.placeholder.com/400x300'
        };

        Swal.fire({
            title: productoDemo.nombre,
            html: `
                <div class="vista-rapida-contenido">
                    <img src="${productoDemo.imagenUrl}" class="img-fluid rounded mb-3" alt="${productoDemo.nombre}">
                    <div class="precio-stock d-flex justify-content-between mb-3">
                        <div class="precio fw-bold fs-5">${productoDemo.precio}</div>
                        <div class="stock ${productoDemo.stock < 10 ? 'text-danger' : 'text-success'}">
                            Stock: ${productoDemo.stock} unidades
                        </div>
                    </div>
                    <p>${productoDemo.descripcion}</p>
                </div>
            `,
            width: 600,
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Ver detalle completo',
            cancelButtonText: 'Cerrar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = `/Inventario/DetalleProducto/${productoId}`;
            }
        });
    }, 1000);
}