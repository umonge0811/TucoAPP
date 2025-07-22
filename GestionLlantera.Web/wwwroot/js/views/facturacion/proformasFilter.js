// ===== MÓDULO DE FILTROS PARA PROFORMAS =====

let filtroProformas = {
    busqueda: '',
    estado: 'todos',
    pagina: 1,
    tamano: 20
};

let timeoutBusquedaProformas = null;
let busquedaProformasEnProceso = false;
let ultimaBusquedaProformas = '';

/**
 * Inicializar filtros de proformas
 */
function inicializarFiltrosProformas() {
    console.log('🔍 === INICIALIZANDO FILTROS DE PROFORMAS ===');
    console.log('🔍 Estado DOM ready:', $(document).ready);
    console.log('🔍 Modal visible:', $('#proformasModal').is(':visible'));

    // Verificar que jQuery esté disponible
    if (typeof $ === 'undefined') {
        console.error('❌ jQuery no está disponible');
        return;
    }

    // Esperar un poco para asegurar que el DOM del modal esté completamente cargado
    setTimeout(() => {
        console.log('🔍 Buscando elementos del DOM...');
        
        // Configurar evento de búsqueda con debounce
        const $inputBusqueda = $('#busquedaProformas');
        console.log('🔍 Input de búsqueda encontrado:', $inputBusqueda.length > 0);
        console.log('🔍 Input de búsqueda elemento:', $inputBusqueda[0]);
        
        if ($inputBusqueda.length) {
            $inputBusqueda.off('input.proformasFilter keyup.proformasFilter').on('input.proformasFilter keyup.proformasFilter', function() {
                const termino = $(this).val().trim();
                console.log('🔍 *** EVENTO DE BÚSQUEDA DISPARADO ***');
                console.log('🔍 Término de búsqueda proformas:', termino);
                console.log('🔍 Elemento que disparó evento:', this);

                // Limpiar timeout anterior
                if (timeoutBusquedaProformas) {
                    clearTimeout(timeoutBusquedaProformas);
                    console.log('🔍 Timeout anterior limpiado');
                }

                // Aplicar filtro después de 300ms
                timeoutBusquedaProformas = setTimeout(() => {
                    console.log('🔍 *** EJECUTANDO BÚSQUEDA CON TIMEOUT ***');
                    filtroProformas.busqueda = termino;
                    filtroProformas.pagina = 1;
                    console.log('🔍 Filtro actualizado:', filtroProformas);
                    aplicarFiltrosProformas();
                }, 300);
            });
            console.log('✅ Evento de búsqueda configurado correctamente');
            
            // Agregar evento inmediato para testing
            $inputBusqueda.on('keypress', function(e) {
                console.log('🔍 *** KEYPRESS DETECTADO ***', e.key, $(this).val());
            });
            
            $inputBusqueda.on('change', function(e) {
                console.log('🔍 *** CHANGE DETECTADO ***', $(this).val());
            });
        } else {
            console.error('❌ No se encontró el input de búsqueda #busquedaProformas');
        }

        // Configurar evento de cambio de estado
        const $selectEstado = $('#estadoProformas');
        console.log('🔍 Select de estado encontrado:', $selectEstado.length > 0);
        
        if ($selectEstado.length) {
            $selectEstado.off('change.proformasFilter').on('change.proformasFilter', function() {
                const estado = $(this).val();
                console.log('🔍 *** CAMBIO DE ESTADO DISPARADO ***');
                console.log('🔍 Estado seleccionado:', estado);

                filtroProformas.estado = estado;
                filtroProformas.pagina = 1;
                aplicarFiltrosProformas();
            });
            console.log('✅ Evento de estado configurado');
        } else {
            console.error('❌ No se encontró el select de estado #estadoProformas');
        }

        // Configurar botón limpiar
        const $btnLimpiar = $('#btnLimpiarFiltrosProformas');
        console.log('🔍 Botón limpiar encontrado:', $btnLimpiar.length > 0);
        
        if ($btnLimpiar.length) {
            $btnLimpiar.off('click.proformasFilter').on('click.proformasFilter', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 *** BOTÓN LIMPIAR PRESIONADO ***');
                limpiarFiltrosProformas();
            });
            console.log('✅ Botón limpiar configurado');
        } else {
            console.error('❌ No se encontró el botón limpiar #btnLimpiarFiltrosProformas');
        }

        // Cargar proformas iniciales
        console.log('🔍 Cargando proformas iniciales...');
        aplicarFiltrosProformas();

        console.log('✅ Filtros de proformas inicializados correctamente');
        
    }, 100); // Pequeño delay para asegurar que el DOM esté listo
}

/**
 * Aplicar filtros y cargar proformas
 */
async function aplicarFiltrosProformas() {
    console.log('🔍 *** FUNCIÓN APLICAR FILTROS LLAMADA ***');
    console.log('🔍 Filtro actual completo:', JSON.stringify(filtroProformas, null, 2));
    console.log('🔍 busquedaProformasEnProceso:', busquedaProformasEnProceso);
    console.log('🔍 ultimaBusquedaProformas:', ultimaBusquedaProformas);
    
    // Prevenir múltiples llamadas simultáneas
    if (busquedaProformasEnProceso) {
        console.log('⏸️ Búsqueda de proformas ya en proceso, omitiendo llamada duplicada');
        return;
    }

    // Prevenir búsquedas duplicadas del mismo término
    const terminoActual = filtroProformas.busqueda + '|' + filtroProformas.estado;
    console.log('🔍 Término actual:', terminoActual);
    console.log('🔍 Última búsqueda:', ultimaBusquedaProformas);
    console.log('🔍 Página actual:', filtroProformas.pagina);
    
    if (terminoActual === ultimaBusquedaProformas && filtroProformas.pagina === 1) {
        console.log('⏸️ Búsqueda duplicada del mismo filtro omitida:', terminoActual);
        return;
    }

    try {
        console.log('🔍 === APLICANDO FILTROS DE PROFORMAS ===');
        console.log('🔍 Filtro actual:', filtroProformas);

        busquedaProformasEnProceso = true;
        ultimaBusquedaProformas = terminoActual;

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Construir URL con parámetros
        const params = new URLSearchParams();
        params.append('pagina', filtroProformas.pagina);
        params.append('tamano', filtroProformas.tamano);

        // Agregar estado si no es "todos"
        if (filtroProformas.estado && filtroProformas.estado !== 'todos') {
            params.append('estado', filtroProformas.estado);
            console.log('🔍 Agregando filtro estado:', filtroProformas.estado);
        }

        // Agregar búsqueda si existe
        if (filtroProformas.busqueda && filtroProformas.busqueda.trim() !== '') {
            params.append('busqueda', filtroProformas.busqueda.trim());
            console.log('🔍 Agregando filtro búsqueda:', filtroProformas.busqueda);
        }

        const urlCompleta = `/Facturacion/ObtenerProformas?${params.toString()}`;
        console.log('📋 URL completa de consulta:', urlCompleta);

        // Realizar petición AJAX
        const response = await fetch(urlCompleta, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('📋 Respuesta recibida, status:', response.status);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📋 Datos recibidos:', resultado);

        // Procesar resultado
        if (resultado.success) {
            let proformas = null;

            // Buscar proformas en diferentes propiedades del resultado
            if (resultado.proformas && Array.isArray(resultado.proformas)) {
                proformas = resultado.proformas;
            } else if (resultado.data && Array.isArray(resultado.data)) {
                proformas = resultado.data;
            } else if (Array.isArray(resultado)) {
                proformas = resultado;
            }

            if (proformas && proformas.length > 0) {
                console.log('✅ Proformas encontradas:', proformas.length);
                mostrarProformasEnTabla(proformas);
                $('#proformasContent').show();

                // Mostrar paginación si hay datos de paginación
                if (resultado.totalPaginas && resultado.totalPaginas > 1) {
                    mostrarPaginacionProformas(resultado.pagina || filtroProformas.pagina, resultado.totalPaginas);
                } else {
                    $('#paginacionProformas').hide();
                }
            } else {
                console.log('ℹ️ No se encontraron proformas');
                mostrarProformasVacias();
            }
        } else {
            console.log('❌ Respuesta no exitosa:', resultado.message);
            mostrarProformasVacias();
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', resultado.message || 'Error al cargar proformas', 'warning');
            }
        }

    } catch (error) {
        console.error('❌ Error aplicando filtros de proformas:', error);
        mostrarProformasVacias();
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar proformas: ' + error.message, 'danger');
        }
    } finally {
        busquedaProformasEnProceso = false;
        $('#proformasLoading').hide();
    }
}

/**
 * Mostrar proformas en la tabla
 */
function mostrarProformasEnTabla(proformas) {
    console.log('📋 === MOSTRANDO PROFORMAS EN TABLA ===');
    console.log('📋 Proformas a mostrar:', proformas.length);

    const tbody = $('#proformasTableBody');
    if (tbody.length === 0) {
        console.error('❌ No se encontró el tbody de proformas');
        return;
    }

    tbody.empty();

    proformas.forEach(proforma => {
        const fecha = new Date(proforma.fechaFactura || proforma.fechaCreacion).toLocaleDateString('es-CR');
        let estadoBadge = '';

        // Asignar badge según el estado
        switch (proforma.estado) {
            case 'Vigente':
                estadoBadge = '<span class="badge bg-success">Vigente</span>';
                break;
            case 'Facturada':
                estadoBadge = '<span class="badge bg-primary">Facturada</span>';
                break;
            case 'Expirada':
                estadoBadge = '<span class="badge bg-danger">Expirada</span>';
                break;
            default:
                estadoBadge = `<span class="badge bg-secondary">${proforma.estado || 'Sin Estado'}</span>`;
        }

        const fila = `
            <tr data-proforma-id="${proforma.facturaId || proforma.id}">
                <td>
                    <strong>${proforma.numeroFactura || 'N/A'}</strong><br>
                    <small class="text-muted">${proforma.tipoDocumento || 'Proforma'}</small>
                </td>
                <td>
                    <strong>${proforma.nombreCliente || proforma.clienteNombre || 'Cliente General'}</strong><br>
                    <small class="text-muted">${proforma.emailCliente || proforma.email || ''}</small>
                </td>
                <td>
                    <strong>${fecha}</strong><br>
                    <small class="text-muted">Por: ${proforma.usuarioCreador || proforma.nombreUsuario || 'Sistema'}</small>
                </td>
                <td>
                    <strong class="text-success">₡${Number(proforma.total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td>${estadoBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" title="Ver detalles" onclick="verDetalleProforma(${proforma.facturaId || proforma.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" title="Imprimir" onclick="imprimirProforma(${proforma.facturaId || proforma.id})">
                            <i class="bi bi-printer"></i>
                        </button>
                        ${proforma.estado === 'Vigente' ? `
                        <button type="button" class="btn btn-outline-success" title="Convertir a Factura" onclick="convertirProformaAFactura(${proforma.facturaId || proforma.id})">
                            <i class="bi bi-arrow-up-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;

        tbody.append(fila);
    });

    console.log('✅ Proformas mostradas en tabla');
}

/**
 * Mostrar paginación
 */
function mostrarPaginacionProformas(paginaActual, totalPaginas) {
    console.log('📄 === MOSTRANDO PAGINACIÓN DE PROFORMAS ===');
    console.log('📄 Página actual:', paginaActual, 'Total páginas:', totalPaginas);

    const paginacion = $('#paginacionProformas');
    if (paginacion.length === 0 || totalPaginas <= 1) {
        paginacion.hide();
        return;
    }

    let html = '<ul class="pagination justify-content-center">';

    // Botón anterior
    if (paginaActual > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaProformas(${paginaActual - 1})">Anterior</a>
                </li>`;
    }

    // Páginas (mostrar máximo 5 páginas)
    const iniciarPagina = Math.max(1, paginaActual - 2);
    const finalizarPagina = Math.min(totalPaginas, iniciarPagina + 4);

    for (let i = iniciarPagina; i <= finalizarPagina; i++) {
        if (i === paginaActual) {
            html += `<li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>`;
        } else {
            html += `<li class="page-item">
                        <a class="page-link" href="#" onclick="cambiarPaginaProformas(${i})">${i}</a>
                    </li>`;
        }
    }

    // Botón siguiente
    if (paginaActual < totalPaginas) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaProformas(${paginaActual + 1})">Siguiente</a>
                </li>`;
    }

    html += '</ul>';
    paginacion.html(html).show();
}

/**
 * Mostrar mensaje cuando no hay proformas
 */
function mostrarProformasVacias() {
    console.log('ℹ️ Mostrando mensaje de proformas vacías');
    $('#proformasEmpty').show();
    $('#proformasContent').hide();
    $('#paginacionProformas').hide();
}

/**
 * Limpiar filtros
 */
function limpiarFiltrosProformas() {
    console.log('🧹 === LIMPIANDO FILTROS DE PROFORMAS ===');

    // Resetear filtros
    filtroProformas = {
        busqueda: '',
        estado: 'todos',
        pagina: 1,
        tamano: 20
    };

    // Limpiar campos del formulario
    $('#busquedaProformas').val('');
    $('#estadoProformas').val('todos');

    // Limpiar variables de control
    ultimaBusquedaProformas = '';
    busquedaProformasEnProceso = false;

    // Recargar proformas
    aplicarFiltrosProformas();

    console.log('✅ Filtros limpiados y proformas recargadas');
}

/**
 * Cambiar página
 */
function cambiarPaginaProformas(nuevaPagina) {
    console.log('📄 === CAMBIANDO PÁGINA DE PROFORMAS ===');
    console.log('📄 Nueva página:', nuevaPagina);

    if (nuevaPagina > 0) {
        filtroProformas.pagina = nuevaPagina;
        aplicarFiltrosProformas();
    }
}

/**
 * Función de inicialización forzada para depuración
 */
function inicializarFiltrosProformasForzado() {
    console.log('🔍 *** INICIALIZACIÓN FORZADA DE FILTROS ***');
    console.log('🔍 jQuery disponible:', typeof $ !== 'undefined');
    console.log('🔍 Modal existe:', $('#proformasModal').length > 0);
    console.log('🔍 Input búsqueda existe:', $('#busquedaProformas').length > 0);
    console.log('🔍 Select estado existe:', $('#estadoProformas').length > 0);
    console.log('🔍 Tabla body existe:', $('#proformasTableBody').length > 0);
    
    // Resetear variables de control
    busquedaProformasEnProceso = false;
    ultimaBusquedaProformas = '';
    filtroProformas = {
        busqueda: '',
        estado: 'todos',
        pagina: 1,
        tamano: 20
    };
    
    console.log('🔍 Variables reseteadas, llamando inicialización normal...');
    inicializarFiltrosProformas();
}

/**
 * Test manual de búsqueda
 */
function testBusquedaManual(termino) {
    console.log('🔍 *** TEST MANUAL DE BÚSQUEDA ***');
    console.log('🔍 Término de prueba:', termino);
    
    filtroProformas.busqueda = termino;
    filtroProformas.pagina = 1;
    
    console.log('🔍 Filtro configurado:', filtroProformas);
    aplicarFiltrosProformas();
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.inicializarFiltrosProformas = inicializarFiltrosProformas;
    window.inicializarFiltrosProformasForzado = inicializarFiltrosProformasForzado;
    window.testBusquedaManual = testBusquedaManual;
    window.aplicarFiltrosProformas = aplicarFiltrosProformas;
    window.limpiarFiltrosProformas = limpiarFiltrosProformas;
    window.cambiarPaginaProformas = cambiarPaginaProformas;
    window.mostrarProformasEnTabla = mostrarProformasEnTabla;
    
    console.log('📋 Módulo de filtros de proformas cargado correctamente');
    console.log('📋 Funciones exportadas a window:', Object.keys(window).filter(k => k.includes('Proformas')));
    console.log('📋 Función inicializarFiltrosProformas disponible:', typeof window.inicializarFiltrosProformas);
} else {
    console.error('❌ Window no está disponible para exportar funciones');
}