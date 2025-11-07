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

// ✅ FUNCIÓN PARA ACTUALIZAR FILTROS EN CASCADA
function actualizarFiltrosCascada() {
    console.log('🔄 Actualizando filtros en cascada...');

    // Obtener selecciones actuales
    const anchoSeleccionado = $('#filterAncho').val() || '';
    const perfilSeleccionado = $('#filterPerfil').val() || '';
    const diametroSeleccionado = $('#filterDiametro').val() || '';

    // Si no hay ningún filtro seleccionado, restaurar todos los valores originales
    if (!anchoSeleccionado && !perfilSeleccionado && !diametroSeleccionado) {
        poblarSelectoresDinamicos();
        console.log('🔄 Sin filtros activos - restaurando todas las opciones');
        return;
    }

    // Conjuntos para almacenar valores únicos de las filas que cumplen los filtros
    const valores = {
        anchos: new Set(),
        perfiles: new Set(),
        diametros: new Set(),
        tiposTerreno: new Set(),
        marcas: new Set(),
        velocidades: new Set()
    };

    // Recorrer todas las filas de llantas
    $("tbody tr").each(function () {
        const $fila = $(this);

        // Verificar si es una llanta
        const esLlanta = $fila.find("td:eq(2) .badge").text() === "Llanta";
        if (!esLlanta) return;

        // Obtener las medidas de la fila
        const medidasTexto = $fila.find("td:eq(3)").text().trim();
        if (!medidasTexto || medidasTexto === "N/A" || medidasTexto === "-") return;

        // Parsear formato: 225/45/R17
        const match = medidasTexto.match(/(\d+)\/(\d+)\/R?(\d+)/);
        if (!match) return;

        const ancho = match[1];
        const perfil = match[2];
        const diametro = match[3];

        // Verificar si la fila cumple con los filtros seleccionados
        let cumpleFiltros = true;

        if (anchoSeleccionado && ancho !== anchoSeleccionado) cumpleFiltros = false;
        if (perfilSeleccionado && perfil !== perfilSeleccionado) cumpleFiltros = false;
        if (diametroSeleccionado && diametro !== diametroSeleccionado) cumpleFiltros = false;

        // Si cumple con los filtros, agregar sus valores a los conjuntos
        if (cumpleFiltros) {
            valores.anchos.add(ancho);
            valores.perfiles.add(perfil);
            valores.diametros.add(diametro);

            // Extraer tipo de terreno (columna 5)
            const tipoTerreno = $fila.find("td:eq(4)").text().trim();
            if (tipoTerreno && tipoTerreno !== "N/A" && tipoTerreno !== "-") {
                valores.tiposTerreno.add(tipoTerreno);
            }

            // Extraer marca (columna 6)
            const marcaTexto = $fila.find("td:eq(5)").text().trim();
            if (marcaTexto && marcaTexto !== "N/A" && marcaTexto !== "Sin información") {
                // Dividir marca/modelo y agregar ambos
                const partes = marcaTexto.split('/');
                partes.forEach(parte => {
                    if (parte.trim()) {
                        valores.marcas.add(parte.trim());
                    }
                });
            }

            // Extraer velocidad si está disponible (necesitarías ajustar el índice según tu tabla)
            // const velocidad = $fila.find("td:eq(X)").text().trim();
            // if (velocidad && velocidad !== "N/A") {
            //     valores.velocidades.add(velocidad);
            // }
        }
    });

    // Actualizar select de Ancho (siempre mostrar todos los anchos disponibles originalmente)
    if (!anchoSeleccionado) {
        const anchos = Array.from(valores.anchos).sort((a, b) => parseInt(a) - parseInt(b));
        const $selectAncho = $('#filterAncho');
        const anchoActual = $selectAncho.val();
        $selectAncho.html('<option value="">Todos</option>' +
            anchos.map(a => `<option value="${a}" ${anchoActual === a ? 'selected' : ''}>${a}</option>`).join(''));
    }

    // Actualizar select de Perfil (solo las opciones válidas según ancho seleccionado)
    if (anchoSeleccionado || !perfilSeleccionado) {
        const perfiles = Array.from(valores.perfiles).sort((a, b) => parseInt(a) - parseInt(b));
        const $selectPerfil = $('#filterPerfil');
        const perfilActual = $selectPerfil.val();
        $selectPerfil.html('<option value="">Todos</option>' +
            perfiles.map(p => `<option value="${p}" ${perfilActual === p ? 'selected' : ''}>${p}</option>`).join(''));

        console.log(`✅ Perfil actualizado: ${perfiles.length} opciones disponibles`);
    }

    // Actualizar select de Diámetro (solo las opciones válidas según ancho/perfil seleccionados)
    if (anchoSeleccionado || perfilSeleccionado || !diametroSeleccionado) {
        const diametros = Array.from(valores.diametros).sort((a, b) => parseInt(a) - parseInt(b));
        const $selectDiametro = $('#filterDiametro');
        const diametroActual = $selectDiametro.val();
        $selectDiametro.html('<option value="">Todos</option>' +
            diametros.map(d => `<option value="${d}" ${diametroActual === d ? 'selected' : ''}>R${d}"</option>`).join(''));

        console.log(`✅ Diámetro actualizado: ${diametros.length} opciones disponibles`);
    }

    // Actualizar Tipo de Terreno si hay filtros activos
    if (anchoSeleccionado || perfilSeleccionado || diametroSeleccionado) {
        const tiposTerreno = Array.from(valores.tiposTerreno).sort();
        const $selectTipo = $('#filterTipoTerreno');
        const tipoActual = $selectTipo.val();
        $selectTipo.html('<option value="">Todos</option>' +
            tiposTerreno.map(t => `<option value="${t}" ${tipoActual === t ? 'selected' : ''}>${t}</option>`).join(''));

        console.log(`✅ Tipo Terreno actualizado: ${tiposTerreno.length} opciones disponibles`);
    }

    console.log('✅ Filtros en cascada actualizados correctamente');
}

// Función para configurar todos los eventos de filtros
function configurarEventosFiltros() {
    // Filtro de búsqueda de texto - solo actualiza el valor, NO aplica filtros automáticamente
    $("#searchText").on("input", function () {
        filtrosConfig.activos.texto = $(this).val().toLowerCase();
        // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
    });

    // Permitir aplicar filtros con Enter en el campo de búsqueda
    $("#searchText").on("keypress", function (e) {
        if (e.which === 13) { // Enter key
            aplicarTodosLosFiltros();
        }
    });

    // Botón limpiar búsqueda
    $("#btnLimpiarBusqueda").on("click", function () {
        $("#searchText").val('');
        filtrosConfig.activos.texto = '';
        aplicarTodosLosFiltros();
    });

    // Filtros de selección básicos - solo actualizan el valor, NO aplican filtros automáticamente
    $("#filterCategory").on("change", function () {
        filtrosConfig.activos.categoria = $(this).val();
        // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
    });

    $("#filterStock").on("change", function () {
        filtrosConfig.activos.stock = $(this).val();
        // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
    });

    // Filtro de marca - solo actualiza el valor, NO aplica filtros automáticamente
    $("#filterMarca").on("input", function () {
        const valor = $(this).val();
        filtrosConfig.activos.marca = valor.toLowerCase();

        // Mostrar/ocultar botón limpiar
        if (valor) {
            $("#btnLimpiarMarca").show();
        } else {
            $("#btnLimpiarMarca").hide();
        }

        // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
    });

    $("#btnLimpiarMarca").on("click", function () {
        $("#filterMarca").val('');
        filtrosConfig.activos.marca = '';
        $(this).hide();
        aplicarTodosLosFiltros();
    });

    // Filtros de rango - solo actualizan el valor, NO aplican filtros automáticamente
    const filtrosRango = ['#precioMin', '#precioMax', '#stockMin', '#stockMax', '#utilidadMin', '#utilidadMax'];

    filtrosRango.forEach(selector => {
        $(selector).on("input", function () {
            actualizarFiltrosRango();
            // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
        });
    });

    // ✅ Event listeners para filtros de llantas CON CASCADA
    // Filtros principales de medidas (con cascada)
    // IMPORTANTE: Solo actualizan la cascada, NO aplican filtros automáticamente
    $('#filterAncho').on("change", function () {
        const valor = $(this).val();
        console.log('🔧 Ancho cambiado:', valor);

        filtrosConfig.activos.ancho = valor;

        // Actualizar filtros en cascada (para mostrar opciones disponibles)
        actualizarFiltrosCascada();

        // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
    });

    $('#filterPerfil').on("change", function () {
        const valor = $(this).val();
        console.log('🔧 Perfil cambiado:', valor);

        filtrosConfig.activos.perfil = valor;

        // Actualizar filtros en cascada (para mostrar opciones disponibles)
        actualizarFiltrosCascada();

        // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
    });

    $('#filterDiametro').on("change", function () {
        const valor = $(this).val();
        console.log('🔧 Diámetro cambiado:', valor);

        filtrosConfig.activos.diametro = valor;

        // Actualizar filtros en cascada (para mostrar opciones disponibles)
        actualizarFiltrosCascada();

        // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
    });

    // Filtros secundarios de llantas (sin cascada)
    const filtrosLlantasSecundarios = ['#filterTipoTerreno', '#filterMarca', '#filterVelocidad'];

    filtrosLlantasSecundarios.forEach(selector => {
        $(selector).on("change", function () {
            let campo = selector.replace('#filter', '').toLowerCase();

            // ✅ Mapear correctamente
            if (campo === 'tipoterreno') {
                campo = 'tipoterreno';
            }

            const valor = $(this).val();

            console.log('🔧 Filtro cambiado:', {
                selector: selector,
                campo: campo,
                valor: valor
            });

            filtrosConfig.activos[campo] = valor;

            console.log('📊 Estado actual de filtros:', filtrosConfig.activos);

            // NO aplicar filtros automáticamente - el usuario debe hacer clic en "Filtrar"
        });
    });

    // ✅ BOTÓN FILTRAR
    $('#btnFiltrar').on('click', function () {
        console.log('🔍 Aplicando filtros desde botón Filtrar...');
        aplicarTodosLosFiltros();
    });

    // ✅ BOTÓN LIMPIAR FILTROS DE LLANTAS
    $('#btnLimpiarFiltrosLlantas').on('click', function () {
        console.log('🧹 Limpiando filtros de llantas...');

        // Limpiar selectores
        $('#filterAncho, #filterPerfil, #filterDiametro, #filterTipoTerreno, #filterMarca, #filterVelocidad').val('');

        // Limpiar filtros activos
        filtrosConfig.activos.ancho = '';
        filtrosConfig.activos.perfil = '';
        filtrosConfig.activos.diametro = '';
        filtrosConfig.activos.tipoterreno = '';
        filtrosConfig.activos.marca = '';
        filtrosConfig.activos.velocidad = '';

        // Restaurar todas las opciones originales
        poblarSelectoresDinamicos();

        // Reaplicar filtros (mostrará todos)
        aplicarTodosLosFiltros();

        // Mostrar notificación
        mostrarToast('Filtros Limpiados', 'Se han limpiado todos los filtros de llantas', 'success');
    });


    // Botón limpiar todos los filtros
    $("#btnLimpiarFiltros").on("click", function () {
        limpiarTodosLosFiltros();
    });

    console.log('🎮 Eventos de filtros configurados');
}

function mostrarToast(titulo, mensaje, tipo = 'info') {
    // Implementar toast notifications
    console.log(`${tipo.toUpperCase()}: ${titulo} - ${mensaje}`);

    // ✅ IMPLEMENTACIÓN DE TOAST VISUAL MODERNO
    try {
        // Verificar si existe un contenedor de toasts
        let toastContainer = document.getElementById('toast-container-moderno');
        if (!toastContainer) {
            // Crear contenedor de toasts moderno
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container-moderno';
            toastContainer.className = 'toast-container-moderno position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Configuración moderna para diferentes tipos
        const tipoConfiguracion = {
            'success': {
                icono: 'bi-check-circle-fill',
                gradiente: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(40, 167, 69, 0.3)'
            },
            'error': {
                icono: 'bi-exclamation-triangle-fill',
                gradiente: 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(220, 53, 69, 0.3)'
            },
            'danger': {
                icono: 'bi-exclamation-triangle-fill',
                gradiente: 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(220, 53, 69, 0.3)'
            },
            'warning': {
                icono: 'bi-exclamation-circle-fill',
                gradiente: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
                color: '#212529',
                shadow: '0 8px 32px rgba(255, 193, 7, 0.3)'
            },
            'info': {
                icono: 'bi-info-circle-fill',
                gradiente: 'linear-gradient(135deg, #17a2b8 0%, #007bff 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(23, 162, 184, 0.3)'
            }
        };

        const config = tipoConfiguracion[tipo] || tipoConfiguracion['info'];

        // Crear toast HTML moderno
        const toastId = 'toast-moderno-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast-moderno" role="alert" aria-live="assertive" aria-atomic="true" 
                 style="background: ${config.gradiente}; 
                        color: ${config.color}; 
                        box-shadow: ${config.shadow};
                        border: none;
                        border-radius: 16px;
                        backdrop-filter: blur(10px);
                        margin-bottom: 12px;
                        min-width: 350px;
                        max-width: 450px;
                        opacity: 0;
                        transform: translateX(100%);
                        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);">
                <div class="toast-moderno-content" style="display: flex; 
                                                          align-items: flex-start; 
                                                          padding: 16px 20px;
                                                          gap: 12px;">
                    <div class="toast-moderno-icon" style="display: flex;
                                                           align-items: center;
                                                           justify-content: center;
                                                           width: 24px;
                                                           height: 24px;
                                                           flex-shrink: 0;
                                                           margin-top: 2px;">
                        <i class="bi ${config.icono}" style="font-size: 20px;"></i>
                    </div>
                    <div class="toast-moderno-text" style="flex: 1; min-width: 0;">
                        <div class="toast-moderno-titulo" style="font-weight: 600;
                                                                font-size: 15px;
                                                                line-height: 1.3;
                                                                margin-bottom: 4px;
                                                                letter-spacing: -0.2px;">
                            ${titulo}
                        </div>
                        <div class="toast-moderno-mensaje" style="font-weight: 400;
                                                                  font-size: 13px;
                                                                  line-height: 1.4;
                                                                  opacity: 0.95;
                                                                  word-wrap: break-word;">
                            ${mensaje}
                        </div>
                    </div>
                    <button type="button" 
                            class="toast-moderno-close" 
                            onclick="cerrarToastModerno('${toastId}')"
                            style="background: rgba(255, 255, 255, 0.2);
                                   border: none;
                                   border-radius: 50%;
                                   width: 28px;
                                   height: 28px;
                                   display: flex;
                                   align-items: center;
                                   justify-content: center;
                                   cursor: pointer;
                                   transition: all 0.2s ease;
                                   flex-shrink: 0;
                                   color: inherit;"
                            onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='scale(1.1)'"
                            onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'">
                        <i class="bi bi-x-lg" style="font-size: 12px; font-weight: bold;"></i>
                    </button>
                </div>
                <div class="toast-moderno-progress" style="position: absolute;
                                                           bottom: 0;
                                                           left: 0;
                                                           height: 3px;
                                                           background: rgba(255, 255, 255, 0.3);
                                                           border-radius: 0 0 16px 16px;
                                                           transform-origin: left;
                                                           animation: toastProgress ${tipo === 'success' ? '5000' : '3000'}ms linear;">
                </div>
            </div>
        `;

        // Agregar estilos CSS para animaciones si no existen
        if (!document.getElementById('toast-moderno-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-moderno-styles';
            styles.innerHTML = `
                @keyframes toastProgress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                .toast-moderno.mostrar {
                    opacity: 1 !important;
                    transform: translateX(0) !important;
                }
                
                .toast-moderno.ocultar {
                    opacity: 0 !important;
                    transform: translateX(100%) scale(0.8) !important;
                }
                
                .toast-container-moderno {
                    max-height: 100vh;
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                
                .toast-container-moderno::-webkit-scrollbar {
                    width: 4px;
                }
                
                .toast-container-moderno::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .toast-container-moderno::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 2px;
                }
            `;
            document.head.appendChild(styles);
        }

        // Agregar toast al contenedor
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Mostrar toast con animación
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            // Mostrar con animación
            setTimeout(() => {
                toastElement.classList.add('mostrar');
            }, 50);

            // Auto-ocultar después del tiempo especificado
            const delay = tipo === 'success' ? 5000 : 3000;
            setTimeout(() => {
                cerrarToastModerno(toastId);
            }, delay);

            // Agregar evento de click para cerrar
            toastElement.addEventListener('click', function (e) {
                if (e.target === toastElement || e.target.closest('.toast-moderno-content')) {
                    // Solo cerrar si se hace click fuera del botón close
                    if (!e.target.closest('.toast-moderno-close')) {
                        cerrarToastModerno(toastId);
                    }
                }
            });
        }

    } catch (error) {
        console.error('❌ Error mostrando toast moderno:', error);
        // Fallback a alert si falla el toast
        alert(`${titulo}: ${mensaje}`);
    }
}
window.cerrarToastModerno = cerrarToastModerno;
// Función auxiliar para cerrar toast moderno
function cerrarToastModerno(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        toastElement.classList.add('ocultar');
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 400);
    }
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

// Filtros específicos para llantas - ÍNDICES CORRECTOS
function cumpleFiltrosLlantas($fila) {
    const esLlanta = $fila.find("td:eq(2) .badge").text().trim() === "Llanta";

    if (!esLlanta) {
        const hayFiltrosLlanta = filtrosConfig.activos.ancho || filtrosConfig.activos.perfil ||
            filtrosConfig.activos.diametro || filtrosConfig.activos.tipoterreno ||
            filtrosConfig.activos.marca || filtrosConfig.activos.velocidad;
        return !hayFiltrosLlanta;
    }

    // ✅ EXTRAER MEDIDAS (Columna 3)
    const medidasTexto = $fila.find("td:eq(3)").text().trim();
    const match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/) ||
        medidasTexto.match(/^(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);

    if (match) {
        let ancho, perfil, diametro;

        if (match.length === 4) {
            // Con perfil
            [, ancho, perfil, diametro] = match;
        } else {
            // Sin perfil
            [, ancho, diametro] = match;
            perfil = null;
        }

        // FILTRO DE ANCHO
        if (filtrosConfig.activos.ancho && ancho !== filtrosConfig.activos.ancho) {
            return false;
        }

        // FILTRO DE PERFIL
        if (filtrosConfig.activos.perfil) {
            if (!perfil) return false;

            const perfilNum = parseFloat(perfil);
            const perfilFormateado = (perfilNum % 1 === 0) ?
                perfilNum.toString() :
                perfilNum.toFixed(2);

            if (perfilFormateado !== filtrosConfig.activos.perfil) {
                return false;
            }
        }

        // FILTRO DE DIÁMETRO
        if (filtrosConfig.activos.diametro) {
            const diametroNum = parseFloat(diametro);
            const diametroFormateado = (diametroNum % 1 === 0) ?
                diametroNum.toString() :
                diametroNum.toFixed(1);

            if (diametroFormateado !== filtrosConfig.activos.diametro) {
                return false;
            }
        }
    }

    // ✅ FILTRO DE TIPO DE TERRENO (Columna 4)
    if (filtrosConfig.activos.tipoterreno) {
        const tipoTerreno = $fila.find("td:eq(4)").text().trim();

        if (!tipoTerreno || tipoTerreno === 'N/A' || tipoTerreno === '-') {
            return false;
        }

        const tipoNormalizado = String(tipoTerreno).trim().toUpperCase();
        const filtroNormalizado = String(filtrosConfig.activos.tipoterreno).trim().toUpperCase();

        if (tipoNormalizado !== filtroNormalizado) {
            return false;
        }
    }

    // ✅ FILTRO DE MARCA (Columna 5) - CON DEBUG
    if (filtrosConfig.activos.marca) {
        const marcaEnFila = $fila.find("td:eq(5)").text().trim();

        console.log('🔍 DEBUG MARCA:');
        console.log('  - Filtro activo:', filtrosConfig.activos.marca);
        console.log('  - Marca en fila:', marcaEnFila);
        console.log('  - Columna completa:', $fila.find("td:eq(5)").html());

        if (!marcaEnFila || marcaEnFila === 'N/A' || marcaEnFila === '-') {
            console.log('  ❌ Marca vacía o N/A');
            return false;
        }

        const marcaNormalizada = String(marcaEnFila).trim().toUpperCase();
        const filtroNormalizado = String(filtrosConfig.activos.marca).trim().toUpperCase();

        console.log('  - Marca normalizada:', marcaNormalizada);
        console.log('  - Filtro normalizado:', filtroNormalizado);
        console.log('  - ¿Coinciden?:', marcaNormalizada === filtroNormalizado);

        if (marcaNormalizada !== filtroNormalizado) {
            console.log('  ❌ NO COINCIDE');
            return false;
        }
        console.log('  ✅ COINCIDE');
    }


    // ✅ FILTRO DE ÍNDICE DE VELOCIDAD
    if (filtrosConfig.activos.velocidad) {
        const velocidad = $fila.data('indice-velocidad') || $fila.attr('data-indice-velocidad');

        if (!velocidad || velocidad === 'N/A' || velocidad === '-') {
            return false;
        }

        if (velocidad.toUpperCase() !== filtrosConfig.activos.velocidad.toUpperCase()) {
            return false;
        }
    }

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

// ===== POBLAR FILTROS - ÍNDICES CORRECTOS =====
function poblarFiltrosLlantas() {
    console.log('📊 Poblando filtros de llantas desde la tabla...');

    const valores = {
        anchos: new Set(),
        perfiles: new Set(),
        diametros: new Set(),
        tiposTerreno: new Set(),
        marcas: new Set(),
        velocidades: new Set()
    };

    // Recorrer todas las filas de la tabla
    $("tbody tr").each(function () {
        const $fila = $(this);
        const esLlanta = $fila.find("td:eq(2) .badge").text().trim() === "Llanta";

        if (esLlanta) {
            // ✅ EXTRAER MEDIDAS (Columna 3)
            const medidasTexto = $fila.find("td:eq(3)").text().trim();

            let ancho, perfil, diametro;

            // Parsear formato CON perfil: 175/70/R12
            let match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);

            if (match) {
                [, ancho, perfil, diametro] = match;

                if (ancho) valores.anchos.add(ancho);

                if (perfil) {
                    const perfilNum = parseFloat(perfil);
                    const perfilFormateado = (perfilNum % 1 === 0) ?
                        perfilNum.toString() :
                        perfilNum.toFixed(2);
                    valores.perfiles.add(perfilFormateado);
                }

                if (diametro) {
                    const diametroNum = parseFloat(diametro);
                    const diametroFormateado = (diametroNum % 1 === 0) ?
                        diametroNum.toString() :
                        diametroNum.toFixed(1);
                    valores.diametros.add(diametroFormateado);
                }
            } else {
                // Parsear formato SIN perfil: 700/R16
                match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);

                if (match) {
                    [, ancho, diametro] = match;

                    if (ancho) valores.anchos.add(ancho);

                    if (diametro) {
                        const diametroNum = parseFloat(diametro);
                        const diametroFormateado = (diametroNum % 1 === 0) ?
                            diametroNum.toString() :
                            diametroNum.toFixed(1);
                        valores.diametros.add(diametroFormateado);
                    }
                }
            }

            // ✅ EXTRAER TIPO DE TERRENO (Columna 4)
            let tipoTerreno = $fila.find("td:eq(4)").text().trim();

            console.log('🌍 Tipo de terreno (col 4):', tipoTerreno);

            if (tipoTerreno && tipoTerreno !== 'N/A' && tipoTerreno !== '-' && tipoTerreno !== '') {
                const tipoNormalizado = String(tipoTerreno).trim().toUpperCase();
                valores.tiposTerreno.add(tipoNormalizado);
            }

            // ✅ EXTRAER MARCA (Columna 5)
            let marca = $fila.find("td:eq(5)").text().trim();

            console.log('🏷️ Marca (col 5):', marca);

            if (marca && marca !== 'N/A' && marca !== '-' && marca !== '') {
                const marcaNormalizada = String(marca).trim().toUpperCase();
                valores.marcas.add(marcaNormalizada);
            }

            // ✅ EXTRAER ÍNDICE DE VELOCIDAD (si existe en data attribute)
            const velocidad = $fila.data('indice-velocidad') || $fila.attr('data-indice-velocidad');
            if (velocidad && velocidad !== 'N/A' && velocidad !== '-') {
                valores.velocidades.add(velocidad.toUpperCase());
            }
        }
    });

    console.log('📊 Valores únicos encontrados:', {
        anchos: Array.from(valores.anchos),
        perfiles: Array.from(valores.perfiles),
        diametros: Array.from(valores.diametros),
        tiposTerreno: Array.from(valores.tiposTerreno),
        marcas: Array.from(valores.marcas),
        velocidades: Array.from(valores.velocidades)
    });

    // ✅ POBLAR SELECTORES
    const anchos = Array.from(valores.anchos).sort((a, b) => parseFloat(a) - parseFloat(b));
    $('#filterAncho').html('<option value="">Todos</option>' +
        anchos.map(ancho => `<option value="${ancho}">${ancho} mm</option>`).join(''));

    const perfiles = Array.from(valores.perfiles).sort((a, b) => parseFloat(a) - parseFloat(b));
    $('#filterPerfil').html('<option value="">Todos</option>' +
        perfiles.map(perfil => `<option value="${perfil}">${perfil}</option>`).join(''));

    const diametros = Array.from(valores.diametros).sort((a, b) => parseFloat(a) - parseFloat(b));
    $('#filterDiametro').html('<option value="">Todos</option>' +
        diametros.map(diametro => `<option value="${diametro}">R${diametro}"</option>`).join(''));

    const tiposTerreno = Array.from(valores.tiposTerreno).sort();
    $('#filterTipoTerreno').html('<option value="">Todos</option>' +
        tiposTerreno.map(tipo => `<option value="${tipo}">${tipo}</option>`).join(''));

    const marcas = Array.from(valores.marcas).sort();
    $('#filterMarca').html('<option value="">Todas</option>' +
        marcas.map(marca => `<option value="${marca}">${marca}</option>`).join(''));

    const velocidades = Array.from(valores.velocidades).sort();
    if (velocidades.length > 0) {
        $('#filterVelocidad').html('<option value="">Todos</option>' +
            velocidades.map(vel => `<option value="${vel}">${vel}</option>`).join(''));
    }

    console.log('✅ Filtros de llantas poblados:', {
        anchos: anchos.length,
        perfiles: perfiles.length,
        diametros: diametros.length,
        tiposTerreno: tiposTerreno.length,
        marcas: marcas.length,
        velocidades: velocidades.length
    });
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

// Filtros específicos de llantas en cards - VERSIÓN MEJORADA
function cumpleFiltrosLlantasCard($card) {
    const tieneInfoLlanta = $card.find('.producto-card-llantas, .info-llanta').length > 0;

    // Si no es llanta, verificar si hay filtros de llanta activos
    if (!tieneInfoLlanta) {
        const hayFiltrosLlanta = filtrosConfig.activos.ancho || filtrosConfig.activos.perfil ||
            filtrosConfig.activos.diametro || filtrosConfig.activos.tipoterreno ||
            filtrosConfig.activos.velocidad;
        return !hayFiltrosLlanta;
    }

    // ✅ EXTRAER MEDIDAS DEL CARD (múltiples selectores para mayor compatibilidad)
    let medidasTexto = $card.find('.producto-card-medidas div:contains("Medidas:")').text();

    // Intentar otros selectores si el primero no funciona
    if (!medidasTexto) {
        medidasTexto = $card.find('.info-llanta small').first().text();
    }
    if (!medidasTexto) {
        medidasTexto = $card.find('[class*="medida"]').text();
    }

    // ✅ PARSEAR MEDIDAS (soporta formato con y sin R)
    const match = medidasTexto.match(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/R?(\d+)/);

    if (match) {
        const [, ancho, perfil, diametro] = match;

        // ✅ VERIFICAR FILTRO DE ANCHO
        if (filtrosConfig.activos.ancho && ancho !== filtrosConfig.activos.ancho) {
            return false;
        }

        // ✅ VERIFICAR FILTRO DE PERFIL (con formato correcto: 90.50 vs 20)
        if (filtrosConfig.activos.perfil) {
            const perfilNum = parseFloat(perfil);
            const perfilFormateado = (perfilNum % 1 === 0) ?
                perfilNum.toString() :
                perfilNum.toFixed(2);

            if (perfilFormateado !== filtrosConfig.activos.perfil) {
                return false;
            }
        }

        // ✅ VERIFICAR FILTRO DE DIÁMETRO
        if (filtrosConfig.activos.diametro && diametro !== filtrosConfig.activos.diametro) {
            return false;
        }
    }

    // ✅ VERIFICAR FILTRO DE TIPO DE TERRENO (normalizado)
    if (filtrosConfig.activos.tipoterreno) {
        // Intentar múltiples formas de encontrar el tipo de terreno
        let tipoTerreno = '';

        // Opción 1: Buscar en data attribute
        tipoTerreno = $card.data('tipo-terreno') || $card.attr('data-tipo-terreno');

        // Opción 2: Buscar en el DOM por emoji o texto
        if (!tipoTerreno) {
            const tipoTexto = $card.find('.info-llanta small:contains("🛞")').text();
            tipoTerreno = tipoTexto.replace('🛞', '').trim();
        }

        // Opción 3: Buscar en cualquier elemento que contenga tipo de terreno
        if (!tipoTerreno) {
            tipoTerreno = $card.find('[class*="tipo"], [class*="terreno"]').text().trim();
        }

        // Si no se encontró o es N/A, no cumple el filtro
        if (!tipoTerreno || tipoTerreno === 'N/A' || tipoTerreno === '-') {
            return false;
        }

        // Normalizar para comparación
        const tipoNormalizado = String(tipoTerreno).trim().toUpperCase();
        const filtroNormalizado = String(filtrosConfig.activos.tipoterreno).trim().toUpperCase();

        if (tipoNormalizado !== filtroNormalizado) {
            return false;
        }
    }

    // ✅ VERIFICAR FILTRO DE MARCA EN CARD
    if (filtrosConfig.activos.marca) {
        const marca = $card.data('marca') || $card.attr('data-marca') ||
            $card.find('[class*="marca"]').text().trim();

        if (!marca || marca === 'N/A' || marca === '-') return false;

        const marcaNormalizada = String(marca).trim().toUpperCase();
        const filtroNormalizado = String(filtrosConfig.activos.marca).trim().toUpperCase();

        if (marcaNormalizada !== filtroNormalizado) {
            return false;
        }
    }

    // ✅ VERIFICAR FILTRO DE ÍNDICE DE VELOCIDAD
    if (filtrosConfig.activos.velocidad) {
        // Intentar extraer del data attribute o del DOM
        let velocidad = $card.data('indice-velocidad') || $card.attr('data-indice-velocidad');

        if (!velocidad) {
            // Buscar en el DOM
            velocidad = $card.find('[class*="velocidad"]').text().trim();
        }

        if (!velocidad || velocidad === 'N/A' || velocidad === '-') {
            return false;
        }

        if (velocidad.toUpperCase() !== filtrosConfig.activos.velocidad.toUpperCase()) {
            return false;
        }
    }

    return true;
}

// ✅ INICIALIZACIÓN AL CARGAR LA PÁGINA
$(document).ready(function () {
    console.log('🔍 Cargando sistema de filtros avanzados');

    // Esperar un poco para que la tabla esté completamente cargada
    setTimeout(() => {
        inicializarFiltrosAvanzados();
        poblarFiltrosLlantas();
    }, 500);
});