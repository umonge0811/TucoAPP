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

async function buscarProductos(termino) {
    try {
        console.log('🔍 === INICIO buscarProductos (Vista Pública) ===');
        console.log('🔍 Término recibido:', `"${termino}"`);

        // Mostrar loading solo si es necesario
        mostrarLoading();

        // ✅ USAR LA MISMA URL Y LÓGICA QUE EL ENDPOINT EXITOSO
        const response = await fetch('/Public/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📋 Respuesta del servidor recibida');

        if (data && data.productos) {
            console.log(`✅ Se encontraron ${data.productos.length} productos disponibles`);

            // ✅ FILTRAR PRODUCTOS SEGÚN EL TÉRMINO DE BÚSQUEDA (igual que facturación)
            let productosFiltrados = data.productos;
            if (termino && termino.length >= 2) {
                const terminoBusqueda = termino.toLowerCase();
                productosFiltrados = data.productos.filter(producto => {
                    const nombre = (producto.nombreProducto || producto.nombre || '').toLowerCase();
                    const descripcion = (producto.descripcion || producto.Descripcion || '').toLowerCase();

                    // ✅ BUSCAR EN NOMBRE Y DESCRIPCIÓN
                    let cumpleBusqueda = nombre.includes(terminoBusqueda) || descripcion.includes(terminoBusqueda);

                    // ✅ BUSCAR EN MEDIDAS DE LLANTAS (MISMA LÓGICA QUE FACTURACIÓN)
                    if (!cumpleBusqueda && (producto.llanta || (producto.Llanta && producto.Llanta.length > 0))) {
                        try {
                            const llantaInfo = producto.llanta || producto.Llanta[0];

                            if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                                const ancho = llantaInfo.ancho;
                                const perfil = llantaInfo.perfil || '';
                                const diametro = llantaInfo.diametro;

                                // Crear TODOS los formatos de medida para búsqueda
                                const formatosBusqueda = [
                                    `${ancho}/${perfil}/R${diametro}`,
                                    `${ancho}/R${diametro}`,
                                    `${ancho}/${perfil}/${diametro}`,
                                    `${ancho}-${perfil}-${diametro}`,
                                    `${ancho}-${perfil}/${diametro}`,
                                    `${ancho}x${perfil}x${diametro}`,
                                    `${ancho} ${perfil} ${diametro}`,
                                    `${ancho}/${diametro}`,
                                    `${ancho}-${diametro}`,
                                    `${ancho}x${diametro}`,
                                    `${ancho} ${diametro}`,
                                    `${ancho}`,
                                    `${perfil}`,
                                    `${diametro}`,
                                    `R${diametro}`
                                ];

                                const textoBusquedaLlanta = formatosBusqueda
                                    .filter(formato => formato && formato.trim() !== '')
                                    .join(' ')
                                    .toLowerCase();

                                cumpleBusqueda = textoBusquedaLlanta.includes(terminoBusqueda);
                            }
                        } catch (error) {
                            console.warn('⚠️ Error procesando medida de llanta para búsqueda:', error);
                        }
                    }

                    return cumpleBusqueda;
                });
                console.log(`🔍 Productos filtrados por término "${termino}": ${productosFiltrados.length}`);
            }

            mostrarResultados(productosFiltrados);
            console.log('📦 Productos mostrados exitosamente en vista pública');
        } else {
            const errorMessage = data.message || 'Error desconocido al obtener productos';
            console.error('❌ Error en la respuesta:', errorMessage);
            mostrarSinResultados();
        }

    } catch (error) {
        console.error('❌ Error buscando productos:', error);
        mostrarError('Error al buscar productos: ' + error.message);
    }
    console.log('🔍 === FIN buscarProductos (Vista Pública) ===');
}

// Placeholder functions for missing dependencies (mostrarLoading, mostrarResultados, mostrarSinResultados, mostrarError)
// These would typically be defined elsewhere or provided by a framework.
function mostrarLoading() {
    console.log("Simulando mostrar loading...");
    // Implement actual loading indicator logic here
}

function mostrarResultados(productos) {
    console.log("Simulando mostrar resultados:", productos);
    // Implement actual display logic for products here
    // Example: Clear existing products, append new ones, update counts
    const listaProductos = document.getElementById('listaProductos'); // Assuming an element with this ID exists
    if (listaProductos) {
        listaProductos.innerHTML = ''; // Clear current products
        if (productos.length > 0) {
            productos.forEach(producto => {
                const productoDiv = document.createElement('div');
                productoDiv.className = 'producto-item';
                productoDiv.setAttribute('data-nombre', producto.nombreProducto || producto.nombre || '');
                productoDiv.setAttribute('data-categoria', producto.categoria || '');
                productoDiv.innerHTML = `
                    <h3>${producto.nombreProducto || producto.nombre}</h3>
                    <p>${producto.descripcion || ''}</p>
                    <p>Precio: ${formatearPrecio(producto.precio || 0)}</p>
                `;
                listaProductos.appendChild(productoDiv);
            });
        } else {
            const noResultadosDiv = document.getElementById('noResultados');
            if (noResultadosDiv) noResultadosDiv.style.display = 'block';
        }
    }
}

function mostrarSinResultados() {
    console.log("Simulando mostrar sin resultados...");
    // Implement actual logic to display "no results" message
    const listaProductos = document.getElementById('listaProductos');
    if (listaProductos) {
        listaProductos.innerHTML = ''; // Clear current products
        const noResultadosDiv = document.getElementById('noResultados');
        if (noResultadosDiv) noResultadosDiv.style.display = 'block';
    }
}

function mostrarError(mensaje) {
    console.error("Simulando mostrar error:", mensaje);
    // Implement actual error display logic here
    alert(`Error: ${mensaje}`); // Simple alert for demonstration
}