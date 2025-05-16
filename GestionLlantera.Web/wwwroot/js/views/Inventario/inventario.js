// Archivo: wwwroot/js/views/inventario/inventario.js
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado - inicializando vista de inventario');

    // Inicializar controles de vista
    const btnVistaLista = document.getElementById('btnVistaLista');
    const btnVistaTarjetas = document.getElementById('btnVistaTarjetas');
    const productosContenedor = document.querySelector('.productos-contenedor');

    // Configurar cambio de vista
    if (btnVistaLista && btnVistaTarjetas && productosContenedor) {
        console.log('Configurando cambio de vista');

        btnVistaLista.addEventListener('click', function () {
            btnVistaTarjetas.classList.remove('active');
            btnVistaLista.classList.add('active');
            productosContenedor.classList.remove('vista-tarjetas');
            productosContenedor.classList.add('vista-lista');
        });

        btnVistaTarjetas.addEventListener('click', function () {
            btnVistaLista.classList.remove('active');
            btnVistaTarjetas.classList.add('active');
            productosContenedor.classList.remove('vista-lista');
            productosContenedor.classList.add('vista-tarjetas');
        });
    }

    // Configurar filtros de búsqueda
    const searchText = document.getElementById('searchText');
    const filterStock = document.getElementById('filterStock');
    const filterCategory = document.getElementById('filterCategory');
    const sortBy = document.getElementById('sortBy');

    if (searchText) {
        searchText.addEventListener('input', aplicarFiltros);
    }

    if (filterStock) {
        filterStock.addEventListener('change', aplicarFiltros);
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', aplicarFiltros);
    }

    if (sortBy) {
        sortBy.addEventListener('change', aplicarFiltros);
    }

    // Inicializar contadores
    actualizarContadores();
});

// Función para filtrar y ordenar productos
function aplicarFiltros() {
    console.log('Aplicando filtros');

    const searchText = document.getElementById('searchText').value.toLowerCase();
    const filterStock = document.getElementById('filterStock').value;
    const filterCategory = document.getElementById('filterCategory').value;
    const sortBy = document.getElementById('sortBy').value;

    const productosCards = document.querySelectorAll('.producto-card');
    const productosFilas = document.querySelectorAll('.productos-lista tbody tr');

    let productosVisibles = 0;
    let productosStockBajo = 0;

    // Aplicar filtros a las tarjetas
    productosCards.forEach(card => {
        const nombre = card.querySelector('.producto-title').textContent.toLowerCase();
        const descripcion = card.querySelector('.producto-description').textContent.toLowerCase();
        const categoria = card.getAttribute('data-categoria');
        const stockElement = card.querySelector('.producto-stock');
        const esStockBajo = stockElement.classList.contains('low');

        // Verificar filtro de texto
        const pasaTexto = searchText === '' ||
            nombre.includes(searchText) ||
            descripcion.includes(searchText);

        // Verificar filtro de stock
        let pasaStock = true;
        if (filterStock === 'low') {
            pasaStock = esStockBajo;
        } else if (filterStock === 'normal') {
            pasaStock = !esStockBajo;
        }

        // Verificar filtro de categoría
        let pasaCategoria = true;
        if (filterCategory !== '' && filterCategory !== categoria) {
            pasaCategoria = false;
        }

        // Mostrar u ocultar tarjeta según filtros
        if (pasaTexto && pasaStock && pasaCategoria) {
            card.style.display = '';
            productosVisibles++;
            if (esStockBajo) productosStockBajo++;
        } else {
            card.style.display = 'none';
        }
    });

    // Aplicar filtros a las filas de la lista
    // (código similar para la vista de lista)

    // Actualizar contadores
    document.getElementById('contadorProductos').textContent = productosVisibles;
    document.getElementById('contadorStockBajo').textContent = productosStockBajo;
}

// Función para actualizar contadores iniciales
function actualizarContadores() {
    const productosCards = document.querySelectorAll('.producto-card');
    const stockBajoElements = document.querySelectorAll('.producto-stock.low');

    document.getElementById('contadorProductos').textContent = productosCards.length;
    document.getElementById('contadorStockBajo').textContent = stockBajoElements.length;
}

// Funciones para interactuar con productos
function vistaRapida(productoId) {
    console.log(`Vista rápida de producto ${productoId}`);
    // Implementar vista rápida (modal) si es necesario
}

function toggleFavorito(button, productoId) {
    console.log(`Toggle favorito para producto ${productoId}`);
    button.querySelector('i').classList.toggle('bi-star');
    button.querySelector('i').classList.toggle('bi-star-fill');
    // Implementar lógica de favoritos si es necesario
}