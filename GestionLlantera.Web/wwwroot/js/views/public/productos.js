
// ========================================
// VISTA PÚBLICA DE PRODUCTOS - JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Módulo de productos públicos cargado');
    
    // Inicializar funcionalidades
    inicializarBusqueda();
    inicializarFiltros();
    inicializarAnimaciones();
    
    console.log('✅ Vista pública de productos inicializada correctamente');
});

// ========================================
// BÚSQUEDA DE PRODUCTOS
// ========================================
function inicializarBusqueda() {
    const inputBusqueda = document.getElementById('busquedaProductos');
    
    if (!inputBusqueda) return;
    
    inputBusqueda.addEventListener('input', function() {
        const termino = this.value.toLowerCase().trim();
        filtrarProductos();
    });
}

// ========================================
// FILTROS POR CATEGORÍA
// ========================================
function inicializarFiltros() {
    const selectCategoria = document.getElementById('filtroCategoria');
    
    if (!selectCategoria) return;
    
    selectCategoria.addEventListener('change', function() {
        filtrarProductos();
    });
}

// ========================================
// FUNCIÓN PRINCIPAL DE FILTRADO
// ========================================
function filtrarProductos() {
    const termino = document.getElementById('busquedaProductos')?.value.toLowerCase().trim() || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    
    const productos = document.querySelectorAll('.producto-item');
    const noResultados = document.getElementById('noResultados');
    let productosVisibles = 0;
    
    productos.forEach(function(producto) {
        const nombre = producto.getAttribute('data-nombre') || '';
        const categoriaProducto = producto.getAttribute('data-categoria') || '';
        
        let mostrar = true;
        
        // Filtro por término de búsqueda
        if (termino && !nombre.includes(termino)) {
            mostrar = false;
        }
        
        // Filtro por categoría
        if (categoria && categoriaProducto !== categoria) {
            mostrar = false;
        }
        
        if (mostrar) {
            producto.style.display = 'block';
            productosVisibles++;
            
            // Agregar animación escalonada
            setTimeout(() => {
                producto.style.opacity = '1';
                producto.style.transform = 'translateY(0)';
            }, productosVisibles * 50);
            
        } else {
            producto.style.display = 'none';
        }
    });
    
    // Mostrar/ocultar mensaje de no resultados
    if (noResultados) {
        if (productosVisibles === 0) {
            noResultados.style.display = 'block';
        } else {
            noResultados.style.display = 'none';
        }
    }
    
    console.log(`🔍 Filtros aplicados: ${productosVisibles} productos visibles`);
}

// ========================================
// ANIMACIONES AL CARGAR
// ========================================
function inicializarAnimaciones() {
    // Animar elementos al hacer scroll
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
    
    // Observar todas las cards de productos
    const productos = document.querySelectorAll('.producto-item');
    productos.forEach(function(producto) {
        observer.observe(producto);
    });
}

// ========================================
// UTILIDADES
// ========================================
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function limpiarFiltros() {
    const inputBusqueda = document.getElementById('busquedaProductos');
    const selectCategoria = document.getElementById('filtroCategoria');
    
    if (inputBusqueda) inputBusqueda.value = '';
    if (selectCategoria) selectCategoria.value = '';
    
    filtrarProductos();
}

// ========================================
// FUNCIONES GLOBALES
// ========================================
window.filtrarProductos = filtrarProductos;
window.limpiarFiltros = limpiarFiltros;
