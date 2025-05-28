/**
 * Sistema de Filtros Avanzados para Inventario
 * Filtros múltiples, rangos, autocompletado y persistencia
 */

// ✅ VARIABLES GLOBALES DE FILTROS
let filtrosConfig = {
    activos: {
        texto: '',
        categoria: '',
        stock: '',
        marca: '',
        precioMin: null,
        precioMax: null,
        stockMin: null,
        stockMax: null,
        utilidadMin: null,
        utilidadMax: null,
        // Filtros específicos de llantas
        ancho: '',
        perfil: '',
        diametro: '',
        tipoTerreno: '',
        velocidad: ''
    },
    marcasDisponibles: [],
    medidasDisponibles: {
        anchos: [],
        perfiles: [],
        diametros: []
    }
};

// ✅ FUNCIONES GLOBALES DE FILTROS

// Función principal para inicializar el sistema de filtros
function inicializarFiltrosAvanzados() {
    console.log('🔍 Inicializando sistema de filtros avanzados');

    // Extraer datos únicos de la tabla
    extraerDatosUnicos();

    // Poblar selectores con datos únicos
    poblarSelectoresDinamicos();

    // Configurar eventos de todos los filtros
    configurarEventosFiltros();

    // Configurar colapso de filtros
    configurarColapsarFiltros();

    console.log('✅ Filtros avanzados inicializados correctamente');
}

// Función para extraer datos únicos de todos los productos
function extraerDatosUnicos() {
    console.log('📊 Extrayendo datos únicos de productos');

    const marcasSet = new Set();
    const anchosSet = new Set();
    const perfilesSet = new Set();
    const diametrosSet = new Set();

    // Recorrer todas las filas de productos
    $("tbody tr").each(function () {
        const $fila = $(this);

        // Extraer marca/modelo
        const marcaTexto = $fila.find("td:eq(4)").text().trim();
        if (marcaTexto && marcaTexto !== "N/A" && marcaTexto !== "Sin información") {
            // Dividir marca/modelo y agregar ambos
            const partes = marcaTexto.split('/');
            partes.forEach(parte => {
                if (parte.trim()) {
                    marcasSet.add(parte.trim());
                }
            });
        }

        // Extraer medidas de llantas si es una llanta
        const esLlanta = $fila.find("td:eq(2) .badge").text() === "Llanta";
        if (esLlanta) {
            const medidasTexto = $fila.find("td:eq(3)").text().trim();
            if (medidasTexto && medidasTexto !== "N/A" && medidasTexto !== "-") {
                // Parsear formato: 225/45/R17
                const match = medidasTexto.match(/(\d+)\/(\d+)\/R?(\d+)/);
                if (match) {
                    anchosSet.add(match[1]);
                    perfilesSet.add(match[2]);
                    diametrosSet.add(match[3]);
                }
            }
        }
    });

    // Convertir sets a arrays ordenados
    filtrosConfig.marcasDisponibles = Array.from(marcasSet).sort();
    filtrosConfig.medidasDisponibles.anchos = Array.from(anchosSet).sort((a, b) => parseInt(a) - parseInt(b));
    filtrosConfig.medidasDisponibles.perfiles = Array.from(perfilesSet).sort((a, b) => parseInt(a) - parseInt(b));
    filtrosConfig.medidasDisponibles.diametros = Array.from(diametrosSet).sort((a, b) => parseInt(a) - parseInt(b));

    console.log('📈 Datos extraídos:', {
        marcas: filtrosConfig.marcasDisponibles.length,
        anchos: filtrosConfig.medidasDisponibles.anchos.length,
        perfiles: filtrosConfig.medidasDisponibles.perfiles.length,
        diametros: filtrosConfig.medidasDisponibles.diametros.length
    });
}

// Función para poblar selectores con datos dinámicos
function poblarSelectoresDinamicos() {
    // Poblar datalist de marcas
    const $listaMarcas = $("#listaMarcas");
    $listaMarcas.empty();
    filtrosConfig.marcasDisponibles.forEach(marca => {
        $listaMarcas.append(`<option value="${marca}">`);
    });

    // Poblar selectores de medidas de llantas
    const selectores = [
        { id: '#filterAncho', datos: filtrosConfig.medidasDisponibles.anchos },
        { id: '#filterPerfil', datos: filtrosConfig.medidasDisponibles.perfiles },
        { id: '#filterDiametro', datos: filtrosConfig.medidasDisponibles.diametros }
    ];

    selectores.forEach(({ id, datos }) => {
        const $selector = $(id);
        // Mantener la opción "Todos"
        const optionTodos = $selector.find('option[value=""]');
        $selector.empty().append(optionTodos);

        datos.forEach(valor => {
            $selector.append(`<option value="${valor}">${valor}</option>`);
        });
    });

    console.log('🎯 Selectores dinámicos poblados');
}

// Función para configurar todos los eventos de filtros
function configurarEventosFiltros() {
    // Filtro de búsqueda de texto con debounce
    let timeoutBusqueda;
    $("#searchText").on("input", function () {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            filtrosConfig.activos.texto = $(this).val().toLowerCase();
            aplicarTodosLosFiltros();
        }, 300); // Esperar 300ms después de que el usuario deje de escribir
    });

    // Botón limpiar búsqueda
    $("#btnLimpiarBusqueda").on("click", function () {
        $("#searchText").val('');
        filtrosConfig.activos.texto = '';
        aplicarTodosLosFiltros();
    });

    // Filtros de selección básicos
    $("#filterCategory").on("change", function () {
        filtrosConfig.activos.categoria = $(this).val();
        aplicarTodosLosFiltros();
    });

    $("#filterStock").on("change", function () {
        filtrosConfig.activos.stock = $(this).val();
        aplicarTodosLosFiltros();
    });

    // Filtro de marca con autocompletado
    $("#filterMarca").on("input", function () {
        const valor = $(this).val();
        filtrosConfig.activos.marca = valor.toLowerCase();

        // Mostrar/ocultar botón limpiar
        if (valor) {
            $("#btnLimpiarMarca").show();
        } else {
            $("#btnLimpiarMarca").hide();
        }

        aplicarTodosLosFiltros();
    });

    $("#btnLimpiarMarca").on("click", function () {
        $("#filterMarca").val('');
        filtrosConfig.activos.marca = '';
        $(this).hide();
        aplicarTodosLosFiltros();
    });

    // Filtros de rango con debounce
    let timeoutRangos;
    const filtrosRango = ['#precioMin', '#precioMax', '#stockMin', '#stockMax', '#utilidadMin', '#utilidadMax'];

    filtrosRango.forEach(selector => {
        $(selector).on("input", function () {
            clearTimeout(timeoutRangos);
            timeoutRangos = setTimeout(() => {
                actualizarFiltrosRango();
                aplicarTodosLosFiltros();
            }, 500);
        });
    });

    // Filtros específicos de llantas
    const filtrosLlantas = ['#filterAncho', '#filterPerfil', '#filterDiametro', '#filterTipoTerreno', '#filterVelocidad'];
    filtrosLlantas.forEach(selector => {
        $(selector).on("change", function () {
            const campo = selector.replace('#filter', '').toLowerCase();
            filtrosConfig.activos[campo] = $(this).val();
            aplicarTodosLosFiltros();
        });
    });

    // Botón limpiar todos los filtros
    $("#btnLimpiarFiltros").on("click", function () {
        limpiarTodosLosFiltros();
    });

    console.log('🎮 Eventos de filtros configurados');
}

// Función para actualizar filtros de rango
function actualizarFiltrosRango() {
    filtrosConfig.activos.precioMin = parseFloat($("#precioMin").val()) || null;
    filtrosConfig.activos.precioMax = parseFloat($("#precioMax").val()) || null;
    filtrosConfig.activos.stockMin = parseInt($("#stockMin").val()) || null;
    filtrosConfig.activos.stockMax = parseInt($("#stockMax").val()) || null;
    filtrosConfig.activos.utilidadMin = parseFloat($("#utilidadMin").val()) || null;
    filtrosConfig.activos.utilidadMax = parseFloat($("#utilidadMax").val()) || null;
}

// Función principal para aplicar todos los filtros - VERSIÓN MEJORADA
function aplicarTodosLosFiltros() {
    console.log('🔄 Aplicando filtros en tabla y cards:', filtrosConfig.activos);

    let productosVisibles = 0;

    // ✅ FILTRAR TABLA (Vista Desktop)
    $("tbody tr").each(function () {
        const $fila = $(this);
        let cumpleTodosLosFiltros = true;

        // Aplicar cada filtro
        if (!cumpleFiltroTexto($fila)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltroCategoria($fila)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltroStock($fila)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltroMarca($fila)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltrosPrecio($fila)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltrosStockRango($fila)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltrosUtilidad($fila)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltrosLlantas($fila)) cumpleTodosLosFiltros = false;

        // Mostrar/ocultar fila
        if (cumpleTodosLosFiltros) {
            $fila.show();
            productosVisibles++;
        } else {
            $fila.hide();
        }
    });

    // ✅ FILTRAR CARDS (Vista Móvil) - NUEVO
    $(".producto-card").each(function () {
        const $card = $(this);
        let cumpleTodosLosFiltros = true;

        // Aplicar cada filtro al card
        if (!cumpleFiltroTextoCard($card)) cumpleTodosLosFiltros = false;
        if (!cumpleFiltroCategoríaCard($card)) cumpleTodosLosFiltros = false;
    if (!cumpleFiltroStockCard($card)) cumpleTodosLosFiltros = false;
    if (!cumpleFiltroMarcaCard($card)) cumpleTodosLosFiltros = false;
    if (!cumpleFiltrosPrecioCard($card)) cumpleTodosLosFiltros = false;
    if (!cumpleFiltrosStockRangoCard($card)) cumpleTodosLosFiltros = false;
    if (!cumpleFiltrosUtilidadCard($card)) cumpleTodosLosFiltros = false;
    if (!cumpleFiltrosLlantasCard($card)) cumpleTodosLosFiltros = false;

    // Mostrar/ocultar card
    if (cumpleTodosLosFiltros) {
        $card.show();
    } else {
        $card.hide();
    }
});

// Actualizar indicadores visuales
actualizarIndicadoresFiltros();

// Integrar con paginación
if (typeof actualizarFilasVisibles === 'function') {
    actualizarFilasVisibles();
    renderizarPagina(1);
}

console.log(`✅ Filtros aplicados. Productos visibles: ${productosVisibles}`);
}


// ✅ FUNCIONES INDIVIDUALES DE FILTROS

// Filtro por texto de búsqueda
function cumpleFiltroTexto($fila) {
    if (!filtrosConfig.activos.texto) return true;

    const textoFila = $fila.text().toLowerCase();
    return textoFila.indexOf(filtrosConfig.activos.texto) !== -1;
}

// Filtro por categoría
function cumpleFiltroCategoria($fila) {
    if (!filtrosConfig.activos.categoria) return true;

    const tieneTextoLlanta = $fila.text().indexOf('Llanta') !== -1;

    if (filtrosConfig.activos.categoria === "llantas") {
        return tieneTextoLlanta;
    } else if (filtrosConfig.activos.categoria === "accesorios" || filtrosConfig.activos.categoria === "herramientas") {
        return !tieneTextoLlanta; // Por ahora, todo lo que no es llanta se considera accesorio/herramienta
    }

    return true;
}

// Filtro por nivel de stock
function cumpleFiltroStock($fila) {
    if (!filtrosConfig.activos.stock) return true;

    const stock = parseInt($fila.find("td:eq(8)").text().trim());
    const minStock = parseInt($fila.find("td:eq(9)").text().trim());
    const esStockBajo = $fila.hasClass("table-danger");

    switch (filtrosConfig.activos.stock) {
        case "low":
            return esStockBajo;
        case "normal":
            return !esStockBajo && stock < minStock * 2;
        case "high":
            return stock >= minStock * 2;
        default:
            return true;
    }
}

// Filtro por marca/modelo
function cumpleFiltroMarca($fila) {
    if (!filtrosConfig.activos.marca) return true;

    const marcaTexto = $fila.find("td:eq(4)").text().toLowerCase();
    return marcaTexto.indexOf(filtrosConfig.activos.marca) !== -1;
}

// Filtros por rango de precio
function cumpleFiltrosPrecio($fila) {
    const precioTexto = $fila.find("td:eq(7)").text().trim();
    const match = precioTexto.match(/₡([\d,]+)/);

    if (!match) return true; // Si no hay precio, no filtrar

    const precio = parseFloat(match[1].replace(/,/g, ''));

    // Verificar precio mínimo
    if (filtrosConfig.activos.precioMin !== null && precio < filtrosConfig.activos.precioMin) {
        return false;
    }

    // Verificar precio máximo
    if (filtrosConfig.activos.precioMax !== null && precio > filtrosConfig.activos.precioMax) {
        return false;
    }

    return true;
}

// Filtros por rango de stock
function cumpleFiltrosStockRango($fila) {
    const stock = parseInt($fila.find("td:eq(8)").text().trim());

    // Verificar stock mínimo
    if (filtrosConfig.activos.stockMin !== null && stock < filtrosConfig.activos.stockMin) {
        return false;
    }

    // Verificar stock máximo
    if (filtrosConfig.activos.stockMax !== null && stock > filtrosConfig.activos.stockMax) {
        return false;
    }

    return true;
}

// Filtros por rango de utilidad
function cumpleFiltrosUtilidad($fila) {
    const badgeTexto = $fila.find("td:eq(6) .badge").text().trim();

    if (!badgeTexto || badgeTexto === "-") {
        // Si no hay utilidad, solo pasa si no hay filtros de utilidad activos
        return filtrosConfig.activos.utilidadMin === null && filtrosConfig.activos.utilidadMax === null;
    }

    const utilidad = parseFloat(badgeTexto.replace('%', ''));

    // Verificar utilidad mínima
    if (filtrosConfig.activos.utilidadMin !== null && utilidad < filtrosConfig.activos.utilidadMin) {
        return false;
    }

    // Verificar utilidad máxima
    if (filtrosConfig.activos.utilidadMax !== null && utilidad > filtrosConfig.activos.utilidadMax) {
        return false;
    }

    return true;
}

// Filtros específicos para llantas
function cumpleFiltrosLlantas($fila) {
    const esLlanta = $fila.find("td:eq(2) .badge").text() === "Llanta";

    // Si no es llanta, no aplicar filtros de llanta
    if (!esLlanta) {
        // Pero si hay filtros de llanta activos, ocultar productos que no son llantas
        const hayFiltrosLlanta = filtrosConfig.activos.ancho || filtrosConfig.activos.perfil ||
            filtrosConfig.activos.diametro || filtrosConfig.activos.tipoTerreno ||
            filtrosConfig.activos.velocidad;
        return !hayFiltrosLlanta;
    }

    // Extraer medidas de la llanta
    const medidasTexto = $fila.find("td:eq(3)").text().trim();
    const match = medidasTexto.match(/(\d+)\/(\d+)\/R?(\d+)/);

    if (match) {
        const [, ancho, perfil, diametro] = match;

        // Verificar filtros de medidas
        if (filtrosConfig.activos.ancho && ancho !== filtrosConfig.activos.ancho) return false;
        if (filtrosConfig.activos.perfil && perfil !== filtrosConfig.activos.perfil) return false;
        if (filtrosConfig.activos.diametro && diametro !== filtrosConfig.activos.diametro) return false;
    }

    // Verificar otros filtros de llanta (estos requerirían más datos en el HTML)
    // Por ahora los dejamos como placeholder para futuras implementaciones

    return true;
}

// Función para actualizar indicadores visuales de filtros activos
function actualizarIndicadoresFiltros() {
    const filtrosActivos = [];

    // Contar y describir filtros activos con mejores etiquetas
    if (filtrosConfig.activos.texto) {
        filtrosActivos.push(`🔍 "${filtrosConfig.activos.texto}"`);
    }

    if (filtrosConfig.activos.categoria) {
        const categorias = { llantas: '🛞 Llantas', accesorios: '🔧 Accesorios', herramientas: '🛠️ Herramientas' };
        filtrosActivos.push(categorias[filtrosConfig.activos.categoria] || filtrosConfig.activos.categoria);
    }

    if (filtrosConfig.activos.stock) {
        const stocks = { low: '📉 Stock Bajo', normal: '📊 Stock Normal', high: '📈 Stock Alto' };
        filtrosActivos.push(stocks[filtrosConfig.activos.stock]);
    }

    if (filtrosConfig.activos.marca) {
        filtrosActivos.push(`🏷️ "${filtrosConfig.activos.marca}"`);
    }

    if (filtrosConfig.activos.precioMin !== null || filtrosConfig.activos.precioMax !== null) {
        const min = filtrosConfig.activos.precioMin ? `₡${filtrosConfig.activos.precioMin.toLocaleString()}` : '₡0';
        const max = filtrosConfig.activos.precioMax ? `₡${filtrosConfig.activos.precioMax.toLocaleString()}` : '∞';
        filtrosActivos.push(`💰 ${min} - ${max}`);
    }

    if (filtrosConfig.activos.stockMin !== null || filtrosConfig.activos.stockMax !== null) {
        const min = filtrosConfig.activos.stockMin || 0;
        const max = filtrosConfig.activos.stockMax || '∞';
        filtrosActivos.push(`📦 ${min} - ${max} unidades`);
    }

    if (filtrosConfig.activos.utilidadMin !== null || filtrosConfig.activos.utilidadMax !== null) {
        const min = filtrosConfig.activos.utilidadMin || 0;
        const max = filtrosConfig.activos.utilidadMax || '∞';
        filtrosActivos.push(`📊 ${min}% - ${max}%`);
    }

    // Filtros de llantas con iconos
    const iconosLlantas = { ancho: '↔️', perfil: '📏', diametro: '⭕', tipoTerreno: '🌍', velocidad: '⚡' };
    ['ancho', 'perfil', 'diametro', 'tipoTerreno', 'velocidad'].forEach(campo => {
        if (filtrosConfig.activos[campo]) {
            const nombres = { ancho: 'Ancho', perfil: 'Perfil', diametro: 'Diámetro', tipoTerreno: 'Terreno', velocidad: 'Velocidad' };
            filtrosActivos.push(`${iconosLlantas[campo]} ${nombres[campo]}: ${filtrosConfig.activos[campo]}`);
        }
    });

    // Actualizar contador y controles
    const $contador = $("#contadorFiltrosActivos");
    const $btnLimpiar = $("#btnLimpiarFiltros");

    if (filtrosActivos.length > 0) {
        $contador.text(`${filtrosActivos.length} activos`).show();
        $btnLimpiar.prop('disabled', false).removeClass('btn-outline-secondary').addClass('btn-outline-danger');
        $("#indicadoresFiltros").show();

        // Generar tags mejorados
        const $contenedorTags = $("#tagsFilttrosActivos");
        $contenedorTags.empty();

        filtrosActivos.forEach((filtro, index) => {
            const $tag = $('<span class="badge"></span>').text(filtro);
            // Agregar pequeño delay para animación escalonada
            setTimeout(() => {
                $contenedorTags.append($tag);
            }, index * 50);
        });
    } else {
        $contador.hide();
        $btnLimpiar.prop('disabled', true).removeClass('btn-outline-danger').addClass('btn-outline-secondary');
        $("#indicadoresFiltros").hide();
    }
}
// Función para limpiar todos los filtros
function limpiarTodosLosFiltros() {
    console.log('🧹 Limpiando todos los filtros');

    // Limpiar inputs y selects
    $("#searchText").val('');
    $("#filterCategory").val('');
    $("#filterStock").val('');
    $("#filterMarca").val('');
    $("#precioMin, #precioMax, #stockMin, #stockMax, #utilidadMin, #utilidadMax").val('');
    $("#filterAncho, #filterPerfil, #filterDiametro, #filterTipoTerreno, #filterVelocidad").val('');

    // Ocultar botones de limpiar
    $("#btnLimpiarMarca").hide();

    // Resetear configuración de filtros
    filtrosConfig.activos = {
        texto: '',
        categoria: '',
        stock: '',
        marca: '',
        precioMin: null,
        precioMax: null,
        stockMin: null,
        stockMax: null,
        utilidadMin: null,
        utilidadMax: null,
        ancho: '',
        perfil: '',
        diametro: '',
        tipoTerreno: '',
        velocidad: ''
    };

    // Aplicar filtros (esto mostrará todos los productos)
    aplicarTodosLosFiltros();

    console.log('✅ Todos los filtros limpiados');
}

// Función para configurar el colapso de filtros
function configurarColapsarFiltros() {
    $("#filtrosAvanzados").on('shown.bs.collapse', function () {
        $("#iconoColapsarFiltros").removeClass('bi-chevron-down').addClass('bi-chevron-up');
    });

    $("#filtrosAvanzados").on('hidden.bs.collapse', function () {
        $("#iconoColapsarFiltros").removeClass('bi-chevron-up').addClass('bi-chevron-down');
    });
}


// ✅ NUEVAS FUNCIONES DE FILTROS PARA CARDS MÓVIL

// Filtro por texto en cards
function cumpleFiltroTextoCard($card) {
    if (!filtrosConfig.activos.texto) return true;
    
    const textoCard = $card.text().toLowerCase();
    return textoCard.indexOf(filtrosConfig.activos.texto) !== -1;
}

// Filtro por categoría en cards
function cumpleFiltroCategoríaCard($card) {
    if (!filtrosConfig.activos.categoria) return true;
    
    const tieneTextoLlanta = $card.find('.badge:contains("Llanta")').length > 0;
    
    if (filtrosConfig.activos.categoria === "llantas") {
        return tieneTextoLlanta;
    } else if (filtrosConfig.activos.categoria === "accesorios" || filtrosConfig.activos.categoria === "herramientas") {
        return !tieneTextoLlanta;
    }
    
    return true;
}

// Filtro por stock en cards
function cumpleFiltroStockCard($card) {
    if (!filtrosConfig.activos.stock) return true;
    
    const esStockBajo = $card.hasClass("stock-bajo");
    const stockTexto = $card.find('.producto-detalle-valor').filter(function() {
        return $(this).hasClass('stock-bajo') || $(this).hasClass('stock-normal') || 
               $(this).parent().find('.producto-detalle-label:contains("Stock")').length > 0;
    }).first().text().trim();
    
    const stock = parseInt(stockTexto);
    
    // Extraer stock mínimo del texto "Mín: X"
    const stockMinTexto = $card.find('small:contains("Mín:")').text();
    const stockMinMatch = stockMinTexto.match(/Mín:\s*(\d+)/);
    const stockMin = stockMinMatch ? parseInt(stockMinMatch[1]) : 0;
    
    switch (filtrosConfig.activos.stock) {
        case "low":
            return esStockBajo;
        case "normal":
            return !esStockBajo && stock < stockMin * 2;
        case "high":
            return stock >= stockMin * 2;
        default:
            return true;
    }
}

// Filtro por marca en cards
function cumpleFiltroMarcaCard($card) {
    if (!filtrosConfig.activos.marca) return true;
    
    const marcaTexto = $card.find('.producto-card-medidas div:contains("Marca:")').text().toLowerCase();
    const tituloTexto = $card.find('.producto-card-titulo').text().toLowerCase();
    
    return marcaTexto.indexOf(filtrosConfig.activos.marca) !== -1 || 
           tituloTexto.indexOf(filtrosConfig.activos.marca) !== -1;
}

// Filtro por precio en cards
function cumpleFiltrosPrecioCard($card) {
    const precioTexto = $card.find('.producto-detalle-valor.precio span').first().text().trim();
    const match = precioTexto.match(/₡([\d,]+)/);
    
    if (!match) return true;
    
    const precio = parseFloat(match[1].replace(/,/g, ''));
    
    if (filtrosConfig.activos.precioMin !== null && precio < filtrosConfig.activos.precioMin) {
        return false;
    }
    
    if (filtrosConfig.activos.precioMax !== null && precio > filtrosConfig.activos.precioMax) {
        return false;
    }
    
    return true;
}

// Filtro por rango de stock en cards
function cumpleFiltrosStockRangoCard($card) {
    const stockTexto = $card.find('.producto-detalle-valor').filter(function() {
        return $(this).hasClass('stock-bajo') || $(this).hasClass('stock-normal') || 
               $(this).parent().find('.producto-detalle-label:contains("Stock")').length > 0;
    }).first().text().trim();
    
    const stock = parseInt(stockTexto);
    
    if (filtrosConfig.activos.stockMin !== null && stock < filtrosConfig.activos.stockMin) {
        return false;
    }
    
    if (filtrosConfig.activos.stockMax !== null && stock > filtrosConfig.activos.stockMax) {
        return false;
    }
    
    return true;
}

// Filtro por utilidad en cards (si existe información)
function cumpleFiltrosUtilidadCard($card) {
    // Por ahora, los cards no muestran utilidad detallada, así que retornamos true
    // Se puede implementar cuando agregues esta info a los cards
    return true;
}

// Filtros específicos de llantas en cards
function cumpleFiltrosLlantasCard($card) {
    const tieneInfoLlanta = $card.find('.producto-card-llantas').length > 0;
    
    // Si no es llanta, verificar si hay filtros de llanta activos
    if (!tieneInfoLlanta) {
        const hayFiltrosLlanta = filtrosConfig.activos.ancho || filtrosConfig.activos.perfil || 
                                filtrosConfig.activos.diametro || filtrosConfig.activos.tipoTerreno || 
                                filtrosConfig.activos.velocidad;
        return !hayFiltrosLlanta;
    }
    
    // Extraer medidas del card
    const medidasTexto = $card.find('.producto-card-medidas div:contains("Medidas:")').text();
    const match = medidasTexto.match(/(\d+)\/(\d+)\/R?(\d+)/);
    
    if (match) {
        const [, ancho, perfil, diametro] = match;
        
        if (filtrosConfig.activos.ancho && ancho !== filtrosConfig.activos.ancho) return false;
        if (filtrosConfig.activos.perfil && perfil !== filtrosConfig.activos.perfil) return false;
        if (filtrosConfig.activos.diametro && diametro !== filtrosConfig.activos.diametro) return false;
    }
    
    return true;
}

// ✅ INICIALIZACIÓN AL CARGAR LA PÁGINA
$(document).ready(function () {
    console.log('🔍 Cargando sistema de filtros avanzados');

    // Esperar un poco para que la tabla esté completamente cargada
    setTimeout(() => {
        inicializarFiltrosAvanzados();
    }, 500);
});