// Archivo: wwwroot/js/views/rolesPermisos.js
console.log('ButtonUtils disponible:', typeof ButtonUtils !== 'undefined');
// Variables globales para los modales
let modalRol = null;
let modalPermiso = null;

// Variable global para almacenar la URL base de la API
const API_URL = 'https://localhost:7273';

// Event listener principal para la inicialización
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM Cargado - Inicializando componentes...');

    // Inicializar modales
    modalRol = new bootstrap.Modal(document.getElementById('modalNuevoRol'));
    modalPermiso = new bootstrap.Modal(document.getElementById('modalNuevoPermiso'));

    // Verificar que los botones existen y configurar eventos
    const btnGuardarRol = document.getElementById('btnGuardarRol');
    const btnGuardarPermiso = document.getElementById('btnGuardarPermiso');

    if (btnGuardarRol) {
        btnGuardarRol.addEventListener('click', function () {
            const rolId = document.getElementById('rolId').value;
            if (rolId === '0') {
                guardarRol();  // Para crear un nuevo rol
            } else {
                actualizarRol();  // Para actualizar un rol existente
            }
        });
    }

    if (btnGuardarPermiso) {
        btnGuardarPermiso.addEventListener('click', guardarPermiso);
    }

    // Cargar datos iniciales
    try {
        await Promise.all([cargarPermisos(), cargarRoles()]);
        console.log('Datos iniciales cargados exitosamente');
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
    }
});

// Función para refrescar todas las tablas
async function refrescarTablas() {
    try {
        console.log('Iniciando actualización de tablas...');

        // Realizar ambas operaciones en paralelo y esperar a que ambas terminen
        const [permisos, roles] = await Promise.all([
            cargarPermisos(),
            cargarRoles()
        ]);

        console.log('Tablas actualizadas exitosamente');
        return { permisos, roles };
    } catch (error) {
        console.error('Error al refrescar tablas:', error);
        toastr.error('Error al actualizar la información');
        throw error;
    }
}
// Función para cargar todos los permisos
async function cargarPermisos() {
    try {
        console.log('Iniciando carga de permisos...');

        // Usar la nueva ruta del controlador
        const response = await fetch('/Configuracion/permisos');

        if (!response.ok) {
            throw new Error('Error al cargar permisos');
        }

        const permisos = await response.json();
        console.log('Permisos cargados:', permisos);

        // Actualizar la tabla de permisos
        actualizarTablaPermisos(permisos);

        return permisos;
    } catch (error) {
        console.error('Error al cargar permisos:', error);
        toastr.error('Error al cargar los permisos');
        throw error;
    }
}

// Función para cargar todos los roles
async function cargarRoles() {
    try {
        console.log('Iniciando carga de roles...');

        // Usar la nueva ruta del controlador
        const response = await fetch('/Configuracion/roles');

        if (!response.ok) {
            throw new Error('Error al cargar roles');
        }

        const roles = await response.json();
        console.log('Roles recibidos:', roles); // Verificar la estructura de los datos

        // Usar la función auxiliar para actualizar la tabla
        actualizarTablaRoles(roles);

        return roles;
    } catch (error) {
        console.error('Error al cargar roles:', error);
        toastr.error('Error al cargar los roles');
        throw error;
    }
}



// Función auxiliar para actualizar la tabla de roles
function actualizarTablaRoles(roles) {
    const tbody = document.querySelector('#roles table tbody');
    if (!tbody) {
        console.error('No se encontró la tabla de roles');
        return;
    }

    // Función para obtener el módulo del permiso usando el campo modulo de la BD
    const obtenerModulo = (permiso) => {
        console.log('Obteniendo módulo para permiso:', permiso);
        if (permiso.modulo && permiso.modulo.trim() !== '') {
            return permiso.modulo.trim();
        }
        // Si no hay módulo específico, clasificar por nombre del permiso
        const nombrePermiso = permiso.nombrePermiso.toLowerCase();
        if (nombrePermiso.includes('inventario') || nombrePermiso.includes('stock') || nombrePermiso.includes('producto')) {
            return 'Inventario';
        }
        if (nombrePermiso.includes('factur') || nombrePermiso.includes('venta')) {
            return 'Facturación';
        }
        if (nombrePermiso.includes('cliente')) {
            return 'Clientes';
        }
        if (nombrePermiso.includes('reporte')) {
            return 'Reportes';
        }
        if (nombrePermiso.includes('usuario') || nombrePermiso.includes('rol') || nombrePermiso.includes('permiso') || nombrePermiso.includes('gestion') || nombrePermiso.includes('administr') || nombrePermiso.includes('configuracion')) {
            return 'Administración';
        }
        if (nombrePermiso.includes('costo') || nombrePermiso.includes('utilidad')) {
            return 'Costos y Utilidades';
        }
        return 'General';
    };

    tbody.innerHTML = roles.map(rol => `
        <tr>
            <td class="fw-semibold">${rol.nombreRol}</td>
            <td>${rol.descripcionRol || '-'}</td>
            <td>
                ${rol.permisos && rol.permisos.length > 0
            ? (() => {
                // Agrupar permisos por módulo usando el campo Modulo de la BD
                const permisosPorModulo = rol.permisos.reduce((grupos, permiso) => {
                    const modulo = obtenerModulo(permiso);
                    if (!grupos[modulo]) {
                        grupos[modulo] = [];
                    }
                    grupos[modulo].push(permiso);
                    return grupos;
                }, {});

                // Orden específico para los módulos
                const ordenModulos = ['Administración', 'Inventario', 'Facturación', 'Clientes', 'Reportes', 'Configuración', 'General'];
                const modulosOrdenados = ordenModulos.filter(modulo => permisosPorModulo[modulo]);

                // Vista Desktop - Acordeones
                const vistaDesktop = `
                    <div class="d-none d-md-block permisos-modulos-container">
                        <div class="accordion" id="accordion-permisos-rol-${rol.rolId}">
                            ${modulosOrdenados.map((modulo, index) => `
                                <div class="accordion-item mb-1">
                                    <h2 class="accordion-header" id="heading-${rol.rolId}-${index}">
                                        <button class="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#collapse-${rol.rolId}-${index}" 
                                                aria-expanded="false" aria-controls="collapse-${rol.rolId}-${index}"
                                                style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                                            <i class="${obtenerIconoModulo(modulo)} me-2"></i>
                                            <strong>${modulo}</strong>
                                            <span class="badge bg-primary ms-2">${permisosPorModulo[modulo].length}</span>
                                        </button>
                                    </h2>
                                    <div id="collapse-${rol.rolId}-${index}" class="accordion-collapse collapse" 
                                         aria-labelledby="heading-${rol.rolId}-${index}" data-bs-parent="#accordion-permisos-rol-${rol.rolId}">
                                        <div class="accordion-body p-2">
                                            <div class="permisos-list">
                                                ${permisosPorModulo[modulo]
                                                    .sort((a, b) => a.nombrePermiso.localeCompare(b.nombrePermiso))
                                                    .map(permiso => `
                                                        <span class="permission-tag ${obtenerClaseModulo(modulo)}">
                                                            <i class="bi bi-check2 me-1"></i>
                                                            ${permiso.nombrePermiso}
                                                        </span>
                                                    `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

                // Vista Móvil - Acordeones agrupados por módulo igual que desktop
                const vistaMobile = `
                    <div class="d-md-none permisos-modulos-container">
                        <div class="accordion" id="accordion-permisos-rol-mobile-${rol.rolId}">
                            ${modulosOrdenados.map((modulo, index) => `
                                <div class="accordion-item mb-1">
                                    <h2 class="accordion-header" id="heading-mobile-${rol.rolId}-${index}">
                                        <button class="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#collapse-mobile-${rol.rolId}-${index}" 
                                                aria-expanded="false" aria-controls="collapse-mobile-${rol.rolId}-${index}"
                                                style="padding: 0.375rem 0.5rem; font-size: 0.75rem;">
                                            <i class="${obtenerIconoModulo(modulo)} me-1" style="font-size: 0.8rem;"></i>
                                            <strong>${modulo}</strong>
                                            <span class="badge bg-primary ms-2" style="font-size: 0.65rem;">${permisosPorModulo[modulo].length}</span>
                                        </button>
                                    </h2>
                                    <div id="collapse-mobile-${rol.rolId}-${index}" class="accordion-collapse collapse" 
                                         aria-labelledby="heading-mobile-${rol.rolId}-${index}" data-bs-parent="#accordion-permisos-rol-mobile-${rol.rolId}">
                                        <div class="accordion-body p-2">
                                            <div class="permisos-list">
                                                ${permisosPorModulo[modulo]
                                                    .sort((a, b) => a.nombrePermiso.localeCompare(b.nombrePermiso))
                                                    .map(permiso => `
                                                        <span class="permission-tag ${obtenerClaseModulo(modulo)}" style="font-size: 0.65rem; padding: 0.125rem 0.375rem;">
                                                            <i class="bi bi-check2 me-1" style="font-size: 0.6rem;"></i>
                                                            ${permiso.nombrePermiso}
                                                        </span>
                                                    `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

                return vistaDesktop + vistaMobile;
            })()
            : '<span class="text-muted">Sin permisos asignados</span>'
        }
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="editarRol(${rol.rolId})">
                        <i class="bi bi-pencil me-1"></i>
                        Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarRol(${rol.rolId})">
                        <i class="bi bi-trash me-1"></i>
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Función auxiliar para obtener el icono del módulo
function obtenerIconoModulo(modulo) {
    const iconos = {
        'Administración': 'bi bi-gear',
        'Inventario': 'bi bi-boxes',
        'Facturación': 'bi bi-receipt',
        'Clientes': 'bi bi-people',
        'Reportes': 'bi bi-graph-up',
        'Configuración': 'bi bi-sliders',
        'General': 'bi bi-layers'
    };
    return iconos[modulo] || 'bi bi-layers';
}

// Función auxiliar para obtener la clase CSS del módulo
function obtenerClaseModulo(modulo) {
    const clases = {
        'Administración': 'tag-administracion',
        'Inventario': 'tag-inventario',
        'Facturación': 'tag-facturacion',
        'Clientes': 'tag-clientes',
        'Reportes': 'tag-reportes',
        'Configuración': 'tag-configuracion',
        'General': 'tag-general'
    };
    return clases[modulo] || 'tag-general';
}


// Función auxiliar para actualizar la tabla de permisos
function actualizarTablaPermisos(permisos) {
    console.log('Actualizando acordeón de permisos con:', permisos);

    const accordionContainer = document.getElementById('accordionPermisos');
    if (!accordionContainer) {
        console.error('No se encontró el contenedor del acordeón de permisos');
        return;
    }

    // Función para obtener el módulo del permiso usando el campo modulo de la BD
    const obtenerModulo = (permiso) => {
        console.log('Obteniendo módulo para permiso en acordeón:', permiso);
        if (permiso.modulo && permiso.modulo.trim() !== '') {
            return permiso.modulo.trim();
        }
        // Si no hay módulo específico, clasificar por nombre del permiso
        const nombrePermiso = permiso.nombrePermiso.toLowerCase();
        if (nombrePermiso.includes('inventario') || nombrePermiso.includes('stock') || nombrePermiso.includes('producto')) {
            return 'Inventario';
        }
        if (nombrePermiso.includes('factur') || nombrePermiso.includes('venta')) {
            return 'Facturación';
        }
        if (nombrePermiso.includes('cliente')) {
            return 'Clientes';
        }
        if (nombrePermiso.includes('reporte')) {
            return 'Reportes';
        }
        if (nombrePermiso.includes('usuario') || nombrePermiso.includes('rol') || nombrePermiso.includes('permiso') || nombrePermiso.includes('gestion') || nombrePermiso.includes('administr') || nombrePermiso.includes('configuracion')) {
            return 'Administración';
        }
        if (nombrePermiso.includes('costo') || nombrePermiso.includes('utilidad')) {
            return 'Costos y Utilidades';
        }
        return 'General';
    };

    // Agrupar permisos por módulo usando el campo Modulo de la BD
    const permisosPorModulo = permisos.reduce((grupos, permiso) => {
        const modulo = obtenerModulo(permiso);
        if (!grupos[modulo]) {
            grupos[modulo] = [];
        }
        grupos[modulo].push(permiso);
        return grupos;
    }, {});

    let html = '';
    let accordionIndex = 0;

    // Generar HTML del acordeón agrupado por módulo
    Object.keys(permisosPorModulo).sort().forEach(modulo => {
        const collapseId = `collapse${accordionIndex}`;
        const headingId = `heading${accordionIndex}`;
        const isFirstItem = accordionIndex === 0;
        const permisosDelModulo = permisosPorModulo[modulo];

        html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headingId}">
                    <button class="accordion-button ${isFirstItem ? '' : 'collapsed'}" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}" 
                            aria-expanded="${isFirstItem ? 'true' : 'false'}" aria-controls="${collapseId}">
                        <i class="bi bi-layers me-2"></i>
                        <strong>${modulo}</strong>
                        <span class="badge bg-primary ms-2">${permisosDelModulo.length}</span>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${isFirstItem ? 'show' : ''}" 
                     aria-labelledby="${headingId}" data-bs-parent="#accordionPermisos">
                    <div class="accordion-body">
                        <!-- Vista Desktop -->
                        <div class="d-none d-md-block">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Descripción</th>
                                            <th width="150">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${permisosDelModulo.map(permiso => `
                                            <tr>
                                                <td class="fw-semibold">
                                                    <div class="d-flex align-items-center gap-2">
                                                        <i class="bi bi-key-fill text-primary"></i>
                                                        ${permiso.nombrePermiso}
                                                    </div>
                                                </td>
                                                <td class="text-muted">${permiso.descripcionPermiso || '-'}</td>
                                                <td>
                                                    <div class="btn-group">
                                                        <button class="btn btn-sm btn-outline-primary" onclick="editarPermiso(${permiso.permisoId})" title="Editar">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarPermiso(${permiso.permisoId})" title="Eliminar">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Vista Móvil -->
                        <div class="d-md-none">
                            <div class="row g-3">
                                ${permisosDelModulo.map(permiso => `
                                    <div class="col-12">
                                        <div class="card border-0 shadow-sm">
                                            <div class="card-body p-3">
                                                <div class="d-flex align-items-start gap-3">
                                                    <i class="bi bi-key-fill text-primary fs-5 mt-1"></i>
                                                    <div class="flex-grow-1">
                                                        <h6 class="card-title mb-1">${permiso.nombrePermiso}</h6>
                                                        <p class="card-text text-muted small mb-2">${permiso.descripcionPermiso || '-'}</p>
                                                        <div class="d-flex gap-2">
                                                            <button class="btn btn-sm btn-primary" onclick="editarPermiso(${permiso.permisoId})">
                                                                <i class="bi bi-pencil me-1"></i>
                                                                Editar
                                                            </button>
                                                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarPermiso(${permiso.permisoId})">
                                                                <i class="bi bi-trash"></i>
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        accordionIndex++;
    });

    // Si no hay permisos, mostrar mensaje
    if (Object.keys(permisosPorModulo).length === 0) {
        html = `
            <div class="text-center py-5">
                <i class="bi bi-key display-1 text-muted"></i>
                <h5 class="text-muted mt-3">No hay permisos configurados</h5>
                <p class="text-muted">Comienza creando tu primer permiso</p>
            </div>
        `;
    }

    accordionContainer.innerHTML = html;
}

// Función para abrir el modal de nuevo rol
window.abrirModalNuevoRol = async function abrirModalNuevoRol() {
    const submitButton = document.querySelector('.btn-primary-custom');

    try {
        console.log('Iniciando apertura de modal nuevo rol...');

        if (submitButton) {
            ButtonUtils.startLoading(submitButton);
        }

        // 1. Cargar los permisos primero - usar la nueva ruta
        const response = await fetch('/Configuracion/permisos');
        if (!response.ok) {
            throw new Error('Error al cargar permisos');
        }

        const permisos = await response.json();
        console.log('Permisos cargados:', permisos);

        // 2. Preparar el modal
        const listaPermisos = document.getElementById('listaPermisos');
        if (!listaPermisos) {
            throw new Error('No se encontró el elemento listaPermisos');
        }

        // Los permisos ya están cargados arriba, no necesitamos hacer otra llamada
        console.log('Usando permisos ya cargados para crear acordeón');

        // Función para obtener el módulo del permiso usando el campo modulo de la BD
        const obtenerModuloModal = (permiso) => {
        console.log('Obteniendo módulo para permiso:', permiso);
        if (permiso.modulo && permiso.modulo.trim() !== '') {
            return permiso.modulo.trim();
        }
        // Si no hay módulo específico, clasificar por nombre del permiso
        const nombrePermiso = permiso.nombrePermiso.toLowerCase();
        if (nombrePermiso.includes('inventario') || nombrePermiso.includes('stock') || nombrePermiso.includes('producto')) {
            return 'Inventario';
        }
        if (nombrePermiso.includes('factur') || nombrePermiso.includes('venta')) {
            return 'Facturación';
        }
        if (nombrePermiso.includes('cliente')) {
            return 'Clientes';
        }
        if (nombrePermiso.includes('reporte')) {
            return 'Reportes';
        }
        if (nombrePermiso.includes('usuario') || nombrePermiso.includes('rol') || nombrePermiso.includes('permiso') || nombrePermiso.includes('gestion') || nombrePermiso.includes('administr') || nombrePermiso.includes('configuracion')) {
            return 'Administración';
        }
        if (nombrePermiso.includes('costo') || nombrePermiso.includes('utilidad')) {
            return 'Costos y Utilidades';
        }
        return 'General';
    };

        // Agrupar permisos por módulo usando el campo Modulo de la BD
        const permisosPorModulo = permisos.reduce((grupos, permiso) => {
            const modulo = obtenerModuloModal(permiso);
            if (!grupos[modulo]) {
                grupos[modulo] = [];
            }
            grupos[modulo].push(permiso);
            return grupos;
        }, {});

        console.log('Permisos por módulo:', permisosPorModulo);

        // Definir las dependencias entre permisos basado en los datos reales
        const dependenciasPermisos = {
            11: [6],  // Gestion Usuarios depende de Gestion Completa
            8: [7],   // Eliminar Productos depende de Editar Productos
            9: [7],   // Ajustar Stock depende de Editar Productos
            4: [3]    // Ver Utilidades depende de Ver Costos
        };

        // Función para activar las dependencias de un permiso
        function activarDependencias(permisoId, isChecked) {
            console.log(`🔄 Activando dependencias para permiso ${permisoId}, checked: ${isChecked}`);

            // CASO ESPECIAL: Gestión Completa (1032) - Marcar/desmarcar TODOS los permisos
            if (permisoId === 1032) {
                const todosLosCheckboxes = document.querySelectorAll('.permiso-checkbox');
                todosLosCheckboxes.forEach(checkbox => {
                    const checkboxPermisoId = parseInt(checkbox.getAttribute('data-permiso-id'));
                    if (checkboxPermisoId !== 1032) { // No marcarse a sí mismo
                        checkbox.checked = isChecked;
                        if (isChecked) {
                            console.log(`✅ [GESTIÓN COMPLETA] Activando permiso: ${checkboxPermisoId}`);
                        } else {
                            console.log(`❌ [GESTIÓN COMPLETA] Desactivando permiso: ${checkboxPermisoId}`);
                        }
                    }
                });
                return; // Salir de la función para evitar procesamiento adicional
            }

            if (isChecked && dependenciasPermisos[permisoId]) {
                // Si se marca el permiso, marcar también sus dependencias
                dependenciasPermisos[permisoId].forEach(dependenciaId => {
                    const checkboxDependencia = document.getElementById(`permiso_${dependenciaId}`);
                    if (checkboxDependencia && !checkboxDependencia.checked) {
                        console.log(`✅ Activando dependencia: permiso ${dependenciaId}`);
                        checkboxDependencia.checked = true;
                    }
                });
            } else if (!isChecked) {
                // Si se desmarca el permiso, desmarcar los que dependen de él
                Object.keys(dependenciasPermisos).forEach(permisoIdStr => {
                    const permisoIdNum = parseInt(permisoIdStr);
                    if (dependenciasPermisos[permisoIdNum].includes(permisoId)) {
                        const checkboxDependiente = document.getElementById(`permiso_${permisoIdNum}`);
                        if (checkboxDependiente && checkboxDependiente.checked) {
                            console.log(`❌ Desactivando permiso dependiente: ${permisoIdNum}`);
                            checkboxDependiente.checked = false;
                        }
                    }
                });
            }
        }
        // Generar HTML para acordeón de permisos categorizados por módulo
        let html = '<div class="accordion" id="accordionPermisosModal">';
        let accordionIndex = 0;

        Object.keys(permisosPorModulo).sort().forEach(modulo => {
            const collapseId = `collapseModal${accordionIndex}`;
            const headingId = `headingModal${accordionIndex}`;
            const isFirstItem = accordionIndex === 0;
            const permisosDelModulo = permisosPorModulo[modulo];

            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button collapsed" type="button" 
                                data-bs-toggle="collapse" data-bs-target="#${collapseId}" 
                                aria-expanded="false" aria-controls="${collapseId}">
                            <i class="bi bi-layers me-2"></i>
                            <strong>${modulo}</strong>
                            <span class="badge bg-primary ms-2">${permisosDelModulo.length}</span>
                        </button>
                    </h2>
                    <div id="${collapseId}" class="accordion-collapse collapse" 
                         aria-labelledby="${headingId}" data-bs-parent="#accordionPermisosModal">
                        <div class="accordion-body p-3">
                            <div class="row g-2">
                                ${permisosDelModulo.map(permiso => {
                                    // 🏷️ Determinar si es un permiso especial para mostrar badge
                                    let badgeHtml = '';
                                    if (permiso.permisoId === 6) {
                                        badgeHtml = '<span class="badge bg-warning text-dark ms-2">ADMINISTRACIÓN COMPLETA</span>';
                                    } else if (dependenciasPermisos[permiso.permisoId] && dependenciasPermisos[permiso.permisoId].length > 0) {
                                        const dependencias = dependenciasPermisos[permiso.permisoId];
                                        const nombresDependencias = dependencias.map(id => {
                                            const permisoRequerido = permisos.find(p => p.permisoId === id);
                                            return permisoRequerido ? permisoRequerido.nombrePermiso : `ID ${id}`;
                                        }).join(', ');
                                        badgeHtml = `<span class="badge bg-info ms-2" title="Requiere: ${nombresDependencias}">REQUIERE DEPENDENCIAS</span>`;
                                    }

                                    return `
                                    <div class="col-12">
                                        <div class="form-check p-2 border rounded bg-light">
                                            <input class="form-check-input permiso-checkbox" 
                                                   type="checkbox" 
                                                   value="${permiso.permisoId}" 
                                                   id="permiso_${permiso.permisoId}"
                                                   data-permiso-id="${permiso.permisoId}">
                                            <label class="form-check-label fw-semibold" for="permiso_${permiso.permisoId}">
                                                <i class="bi bi-key-fill me-1 text-primary"></i>
                                                ${permiso.nombrePermiso}${badgeHtml}
                                            </label>
                                            ${permiso.descripcionPermiso ? `<div class="text-muted small mt-1">${permiso.descripcionPermiso}</div>` : ''}
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            accordionIndex++;
        });

        html += '</div>';

        listaPermisos.innerHTML = html;

        // 🔄 CONFIGURAR EVENT LISTENERS PARA DEPENDENCIAS AUTOMÁTICAS
        setTimeout(() => {
            console.log('⚙️ Configurando event listeners para dependencias de permisos...');
            document.querySelectorAll('.permiso-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const permisoId = parseInt(this.getAttribute('data-permiso-id'));
                    const isChecked = this.checked;

                    console.log(`🔄 Cambio detectado en permiso ID: ${permisoId}, checked: ${isChecked}`);

                    // Aplicar dependencias automáticas
                    activarDependencias(permisoId, isChecked);
                });
            });

            console.log('✅ Event listeners de dependencias configurados correctamente');
        }, 100);

        // 4. Resetear el formulario
        document.getElementById('formRol').reset();
        document.getElementById('rolId').value = '0';
        document.querySelector('#modalNuevoRol .modal-title').textContent = 'Nuevo Rol';

        // 5. Solo después de todo lo anterior, mostrar el modal
        modalRol.show();

    } catch (error) {
        console.error('Error al preparar modal de nuevo rol:', error);
        toastr.error('Error al cargar los permisos disponibles');
    } finally {
        if (submitButton) {
            ButtonUtils.stopLoading(submitButton);
        }
    }
}

// Función para abrir el modal de nuevo permiso
window.abrirModalNuevoPermiso = async function abrirModalNuevoPermiso() {
    try {
        // Resetear el formulario
        document.getElementById('formPermiso').reset();
        document.getElementById('permisoId').value = '0';
        document.querySelector('#modalNuevoPermiso .modal-title').textContent = 'Nuevo Permiso';

        // Mostrar el modal
        modalPermiso.show();
    } catch (error) {
        console.error('Error al preparar modal de nuevo permiso:', error);
        toastr.error('Error al abrir el formulario');
    }
}

window.editarRol = async function editarRol(rolId) {
    try {
        console.log(`Editando rol con ID: ${rolId}`);

        // 1. Obtener los datos del rol - usar la nueva ruta
        const response = await fetch(`/Configuracion/rol/${rolId}`);
        if (!response.ok) {
            throw new Error('Error al obtener rol');
        }

        const rol = await response.json();
        console.log('Datos del rol obtenidos:', rol);

        // 2. Llenar el formulario con los datos
        document.getElementById('rolId').value = rol.rolId;
        document.getElementById('nombreRol').value = rol.nombreRol;
        document.getElementById('descripcionRol').value = rol.descripcionRol || '';

        // 3. Cambiar el título del modal
        document.querySelector('#modalNuevoRol .modal-title').textContent = 'Editar Rol';

        // 4. Cargar y marcar los permisos del rol
        await cargarPermisosParaRol(rolId);

        // 5. Mostrar el modal
        modalRol.show();
    } catch (error) {
        console.error('Error al editar rol:', error);
        toastr.error('Error al cargar los datos del rol');
    }
}

// Función auxiliar para cargar los permisos de un rol
async function cargarPermisosParaRol(rolId) {
    try {
        // Cargar todos los permisos disponibles - usar la nueva ruta
        const responsePermisos = await fetch('/Configuracion/permisos');
        if (!responsePermisos.ok) {
            throw new Error('Error al cargar permisos');
        }

        const permisos = await responsePermisos.json();
        console.log('Permisos disponibles:', permisos);

        // Función para obtener el módulo del permiso usando el campo modulo de la BD
        const obtenerModuloEditar = (permiso) => {
        console.log('Obteniendo módulo para permiso:', permiso);
        if (permiso.modulo && permiso.modulo.trim() !== '') {
            return permiso.modulo.trim();
        }
        // Si no hay módulo específico, clasificar por nombre del permiso
        const nombrePermiso = permiso.nombrePermiso.toLowerCase();
        if (nombrePermiso.includes('inventario') || nombrePermiso.includes('stock') || nombrePermiso.includes('producto')) {
            return 'Inventario';
        }
        if (nombrePermiso.includes('factur') || nombrePermiso.includes('venta')) {
            return 'Facturación';
        }
        if (nombrePermiso.includes('cliente')) {
            return 'Clientes';
        }
        if (nombrePermiso.includes('reporte')) {
            return 'Reportes';
        }
        if (nombrePermiso.includes('usuario') || nombrePermiso.includes('rol') || nombrePermiso.includes('permiso') || nombrePermiso.includes('gestion') || nombrePermiso.includes('administr') || nombrePermiso.includes('configuracion')) {
            return 'Administración';
        }
        if (nombrePermiso.includes('costo') || nombrePermiso.includes('utilidad')) {
            return 'Costos y Utilidades';
        }
        return 'General';
    };

        // Agrupar permisos por módulo usando el campo Modulo de la BD
        const permisosPorModulo = permisos.reduce((grupos, permiso) => {
            const modulo = obtenerModuloEditar(permiso);
            if (!grupos[modulo]) {
                grupos[modulo] = [];
            }
            grupos[modulo].push(permiso);
            return grupos;
        }, {});

        // Definir las dependencias entre permisos según estructura confirmada
        const dependenciasPermisosEditar = {
            // GRUPO 1 (Amarillo) - Cadena Principal
            1033: [1032],   // 1033 depende de 1032 (base)
            1020: [1033],   // 1020 depende de 1033
            1071: [1020],   // 1071 depende de 1020
            7: [1020],      // 7 depende de 1020
            8: [7],         // 8 depende de 7
            9: [7],         // 9 depende de 7

            // GRUPO 2 (Naranja) - Cadena Independiente
            1034: [1032],   // 1034 depende de 1032 (se activa con permiso 7)
            1035: [1032],   // 1035 depende de 1032
            5: [1035],      // 5 depende de 1035
            16: [1035],     // 16 depende de 1035

            // GRUPO 3 (Verde) - Cadena Simple
            1036: [1032],   // 1036 depende de 1032
            1070: [1036],   // 1070 depende de 1036
            1021: [1036],   // 1021 depende de 1036

            // GRUPO 4 (Azul Claro) - Cadena Compleja
            1038: [1037],   // 1038 depende de 1037 (base)
            1026: [1038],   // 1026 depende de 1038
            1019: [1026],   // 1019 depende de 1026
            1025: [1019],   // 1025 depende de 1019
            1027: [1019],   // 1027 depende de 1019

            // GRUPO 5 (Azul Medio) - Cadena con Bifurcación
            1039: [1037],       // 1039 depende de 1037
            1018: [1039],   // 1018 depende de 1039 (base)
            2: [1018],      // 2 depende de 1018
            1023: [1018],   // 1023 depende de 1018
            1024: [1023],   // 1024 depende de 1023
            1022: [1023],   // 1022 depende de 1023

            // GRUPO 6 (Verde Claro) - Cadena Simple
            1041: [1037],   // 1041 depende de 1037 (inter-grupo)
            1028: [1041],   // 1028 depende de 1041

            // GRUPO 7 (Azul Oscuro) - Cadenas con "CREAR PERMISO"
            1043: [1042],   // 1043 depende de 1042 (base)
            1044: [1042],   // 1044 depende de 1042

            // GRUPO 8 (Gris) - Cadena Larga
            1046: [1045],   // 1046 depende de 1045 (base)
            1047: [1045],   // 1047 depende de 1045
            1040: [1045],   // 1040 depende de 1045
            10: [1046, 1047, 1040],    // 10 depende de 1046, 1047, 1040
            1017: [1046, 1047, 1040],  // 1017 depende de 1046, 1047, 1040

            // GRUPO 9 - Cadena Adicional
            1052: [1051],   // 1052 depende de 1051 (base)
            1053: [1051],   // 1053 depende de 1051

            // GRUPO 10 (Azul Final) - Cadena Final
            1049: [1048],   // 1049 depende de 1048 (base)
            1050: [1048],   // 1050 depende de 1048
            1072: [1049],   // 1072 depende de 1049
            11: [1050]      // 11 depende de 1050
        };

        // Función para activar las dependencias de un permiso (en edición)
        function activarDependenciasEditar(permisoId, isChecked) {
            console.log(`🔄 [EDITAR] Activando dependencias para permiso ${permisoId}, checked: ${isChecked}`);

            // CASO ESPECIAL: Gestión Completa (1032) - Marcar/desmarcar TODOS los permisos
            if (permisoId === 1032) {
                const todosLosCheckboxes = document.querySelectorAll('.permiso-checkbox-editar');
                todosLosCheckboxes.forEach(checkbox => {
                    const checkboxPermisoId = parseInt(checkbox.getAttribute('data-permiso-id'));
                    if (checkboxPermisoId !== 1032) { // No marcarse a sí mismo
                        checkbox.checked = isChecked;
                        if (isChecked) {
                            console.log(`✅ [EDITAR - GESTIÓN COMPLETA] Activando permiso: ${checkboxPermisoId}`);
                            // Efecto visual para mostrar que se activó automáticamente
                            checkbox.classList.add('permiso-activado-automaticamente');
                            setTimeout(() => {
                                checkbox.classList.remove('permiso-activado-automaticamente');
                            }, 1000);
                        } else {
                            console.log(`❌ [EDITAR - GESTIÓN COMPLETA] Desactivando permiso: ${checkboxPermisoId}`);
                        }
                    }
                });
                return; // Salir de la función para evitar procesamiento adicional
            }

            if (isChecked && dependenciasPermisosEditar[permisoId]) {
                // Si se marca el permiso, marcar también sus dependencias
                const dependencias = dependenciasPermisosEditar[permisoId];
                const dependenciasArray = Array.isArray(dependencias) ? dependencias : [dependencias];

                dependenciasArray.forEach(dependenciaId => {
                    const checkboxDependencia = document.getElementById(`permiso_${dependenciaId}`);
                    if (checkboxDependencia && !checkboxDependencia.checked) {
                        console.log(`✅ [EDITAR] Activando dependencia: permiso ${dependenciaId}`);
                        checkboxDependencia.checked = true;
                        // Efecto visual para mostrar que se activó automáticamente
                        checkboxDependencia.classList.add('permiso-activado-automaticamente');
                        setTimeout(() => {
                            checkboxDependencia.classList.remove('permiso-activado-automaticamente');
                        }, 1000);

                        // Recursivamente activar dependencias de la dependencia
                        activarDependenciasEditar(dependenciaId, true);
                    }
                });
            } else if (!isChecked) {
                // Si se desmarca el permiso, desmarcar los que dependen de él
                Object.keys(dependenciasPermisosEditar).forEach(permisoIdStr => {
                    const permisoIdNum = parseInt(permisoIdStr);
                    const dependencias = dependenciasPermisosEditar[permisoIdNum];
                    const dependenciasArray = Array.isArray(dependencias) ? dependencias : [dependencias];

                    if (dependenciasArray.includes(permisoId)) {
                        const checkboxDependiente = document.getElementById(`permiso_${permisoIdNum}`);
                        if (checkboxDependiente && checkboxDependiente.checked) {
                            console.log(`❌ [EDITAR] Desactivando permiso dependiente: ${permisoIdNum}`);
                            checkboxDependiente.checked = false;
                            // Recursivamente desactivar dependientes
                            activarDependenciasEditar(permisoIdNum, false);
                        }
                    }
                });
            }
        }

        // Generar HTML para acordeón de permisos
        const listaPermisos = document.getElementById('listaPermisos');
        let html = '<div class="accordion" id="accordionPermisosModalEditar">';
        let accordionIndex = 0;

        Object.keys(permisosPorModulo).sort().forEach(modulo => {
            const collapseId = `collapseModalEditar${accordionIndex}`;
            const headingId = `headingModalEditar${accordionIndex}`;
            const isFirstItem = accordionIndex === 0;
            const permisosDelModulo = permisosPorModulo[modulo];

            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button collapsed" type="button" 
                                data-bs-toggle="collapse" data-bs-target="#${collapseId}" 
                                aria-expanded="false" aria-controls="${collapseId}">
                            <i class="bi bi-layers me-2"></i>
                            <strong>${modulo}</strong>
                            <span class="badge bg-primary ms-2">${permisosDelModulo.length}</span>
                        </button>
                    </h2>
                    <div id="${collapseId}" class="accordion-collapse collapse" 
                         aria-labelledby="${headingId}" data-bs-parent="#accordionPermisosModalEditar">
                        <div class="accordion-body p-3">
                            <div class="row g-2">
                                ${permisosDelModulo.map(permiso => {
                                    // 🏷️ Determinar si es un permiso especial para mostrar badge
                                    let badgeHtml = '';
                                    if (permiso.permisoId === 6) {
                                        badgeHtml = '<span class="badge bg-warning text-dark ms-2">ADMINISTRACIÓN COMPLETA</span>';
                                    } else if (dependenciasPermisosEditar[permiso.permisoId] && dependenciasPermisosEditar[permiso.permisoId].length > 0) {
                                        const dependencias = dependenciasPermisosEditar[permiso.permisoId];
                                        const nombresDependencias = dependencias.map(id => {
                                            const permisoRequerido = permisos.find(p => p.permisoId === id);
                                            return permisoRequerido ? permisoRequerido.nombrePermiso : `ID ${id}`;
                                        }).join(', ');
                                        badgeHtml = `<span class="badge bg-info ms-2" title="Requiere: ${nombresDependencias}">REQUIERE DEPENDENCIAS</span>`;
                                    }

                                    return `
                                    <div class="col-12">
                                        <div class="form-check p-2 border rounded bg-light">
                                            <input class="form-check-input permiso-checkbox-editar" 
                                                   type="checkbox" 
                                                   value="${permiso.permisoId}" 
                                                   id="permiso_${permiso.permisoId}"
                                                   data-permiso-id="${permiso.permisoId}">
                                            <label class="form-check-label fw-semibold" for="permiso_${permiso.permisoId}">
                                                <i class="bi bi-key-fill me-1 text-primary"></i>
                                                ${permiso.nombrePermiso}${badgeHtml}
                                            </label>
                                            ${permiso.descripcionPermiso ? `<div class="text-muted small mt-1">${permiso.descripcionPermiso}</div>` : ''}
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            accordionIndex++;
        });

        html += '</div>';
        listaPermisos.innerHTML = html;

        // Obtener los permisos del rol - usar la nueva ruta
        const responseRolPermisos = await fetch(`/Configuracion/permisos-rol/${rolId}`);
        if (!responseRolPermisos.ok) {
            throw new Error('Error al cargar permisos del rol');
        }

        const permisosDelRol = await responseRolPermisos.json();
        console.log('Permisos del rol:', permisosDelRol);

        // Marcar los permisos que tiene el rol
         permisosDelRol.forEach(permiso => {
            const checkbox = document.getElementById(`permiso_${permiso.permisoId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        // 🔄 CONFIGURAR EVENT LISTENERS PARA DEPENDENCIAS EN EDICIÓN
        setTimeout(() => {
            console.log('⚙️ [EDITAR] Configurando event listeners para dependencias de permisos...');
            document.querySelectorAll('.permiso-checkbox-editar').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const permisoId = parseInt(this.getAttribute('data-permiso-id'));
                    const isChecked = this.checked;

                    console.log(`🔄 [EDITAR] Cambio detectado en permiso ID: ${permisoId}, checked: ${isChecked}`);

                    // Aplicar dependencias automáticas
                    activarDependenciasEditar(permisoId, isChecked);
                });
            });

            console.log('✅ [EDITAR] Event listeners de dependencias configurados correctamente');
        }, 100);
    } catch (error) {
        console.error('Error al cargar permisos para rol:', error);
        throw error;
    }
}

// Función para guardar un nuevo rol
async function guardarRol() {
    const submitButton = document.getElementById('btnGuardarRol');

    try {
        console.log('Iniciando proceso de guardado de rol');
        ButtonUtils.startLoading(submitButton);

        // Obtener los datos del formulario  
        const nombreRol = document.getElementById('nombreRol').value.trim();
        const descripcionRol = document.getElementById('descripcionRol').value.trim();

        // Validaciones  
        if (!nombreRol) {
            console.warn('Nombre de rol vacío');
            toastr.warning('El nombre del rol es requerido');
            ButtonUtils.stopLoading(submitButton);
            return;
        }

        // Obtener permisos seleccionados  
        const checkboxes = document.querySelectorAll('#listaPermisos input[type="checkbox"]:checked');
        const permisoIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

        console.log('Permisos seleccionados:', permisoIds);

        // Preparar los datos para la creación  
        const dataRol = {
            nombreRol: nombreRol,
            descripcionRol: descripcionRol,
            permisoIds: permisoIds
        };

        console.log('Enviando petición POST a /Configuracion/crear-rol');
        console.log('Datos a enviar:', dataRol);

        // Usar la nueva ruta del controlador
        const response = await fetch('/Configuracion/crear-rol', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
            },
            body: JSON.stringify(dataRol)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Error al guardar el rol');
        }

        // ✅ Cerrar el modal
        modalRol.hide();

        // ✅ Actualizar las tablas
        await refrescarTablas();

        // ✅ NUEVO: Notificar al monitor de permisos sobre el cambio
        if (window.permisosMonitor) {
            console.log('🔄 Notificando cambio de roles al monitor de permisos...');
            window.permisosMonitor.notificarCambioRoles();
        }

        // ✅ NUEVO: Invalidar caché global de permisos
        try {
            await fetch('/Permisos/InvalidarCacheGlobal', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            console.log('✅ Caché global de permisos invalidado');
        } catch (error) {
            console.warn('⚠️ No se pudo invalidar el caché global:', error);
        }

        console.log('✅ Rol guardado exitosamente');
        return response;

    } catch (error) {
        console.error('Error detallado en guardarRol:', error);
        toastr.error(error.message || 'Error al guardar el rol');
    } finally {
        ButtonUtils.stopLoading(submitButton);
    }
}

// Función para actualizar un rol existente
async function actualizarRol() {
    const submitButton = document.getElementById('btnGuardarRol');

    try {
        console.log('Iniciando proceso de actualización de rol');
        ButtonUtils.startLoading(submitButton);

        // Obtener los datos del formulario  
        const rolId = document.getElementById('rolId').value;
        const nombreRol = document.getElementById('nombreRol').value.trim();
        const descripcionRol = document.getElementById('descripcionRol').value.trim();

        // Validaciones  
        if (!nombreRol) {
            console.warn('Nombre de rol vacío');
            toastr.warning('El nombre del rol es requerido');
            ButtonUtils.stopLoading(submitButton);
            return;        }

        // Obtener permisos seleccionados  
        const checkboxes = document.querySelectorAll('#listaPermisos input[type="checkbox"]:checked');
        const permisoIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

        console.log('Permisos seleccionados:', permisoIds);

        // Preparar los datos para la actualización  
        const dataRol = {
            rolId: parseInt(rolId),
            nombreRol: nombreRol,
            descripcionRol: descripcionRol,
            permisoIds: permisoIds
        };

        // Usar la nueva ruta del controlador
        const url = `/Configuracion/actualizar-rol/${rolId}`;
        console.log(`Enviando petición PUT a ${url}`);
        console.log('Datos a enviar:', dataRol);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
            },
            body: JSON.stringify(dataRol)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Error al actualizar el rol');
        }

        // ✅ Cerrar el modal
        modalRol.hide();

        // ✅ Actualizar las tablas
        await refrescarTablas();

        // ✅ NUEVO: Notificar al monitor de permisos sobre el cambio
        if (window.permisosMonitor) {
            console.log('🔄 Notificando cambio de roles al monitor de permisos...');
            window.permisosMonitor.notificarCambioRoles();
        }

        // ✅ NUEVO: Invalidar caché global de permisos
        try {
            await fetch('/Permisos/InvalidarCacheGlobal', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            console.log('✅ Caché global de permisos invalidado');
        } catch (error) {
            console.warn('⚠️ No se pudo invalidar el caché global:', error);
        }

        // Mostrar mensaje de éxito
        toastr.success('Rol actualizado exitosamente');

    } catch (error) {
        console.error('Error detallado en actualizarRol:', error);
        toastr.error(error.message || 'Error al actualizar el rol');
    } finally {
        ButtonUtils.stopLoading(submitButton);
    }
}


// Función para eliminar rol
window.eliminarRol = async function eliminarRol(rolId) {
    // Mostrar confirmación con SweetAlert2
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            // Usar la nueva ruta del controlador
            const response = await fetch(`/Configuracion/eliminar-rol/${rolId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el rol');
            }

            // Refrescar tablas
            await refrescarTablas();

            // Mostrar mensaje de éxito con SweetAlert2
            await Swal.fire(
                '¡Eliminado!',
                'El rol ha sido eliminado.',
                'success'
            );

        } catch (error) {
            console.error('Error:', error);
            Swal.fire(
                'Error',
                error.message || 'Error al eliminar el rol',
                'error'
            );
        }
    }
}

// Función para guardar permiso
async function guardarPermiso() {
    console.log('Iniciando guardarPermiso');
    const submitButton = document.getElementById('btnGuardarPermiso');

    if (!submitButton) {
        console.error('Botón guardarPermiso no encontrado');
        return;
    }

    try {
        console.log('Iniciando proceso de guardado de permiso');
        ButtonUtils.startLoading(submitButton);

        // Obtener valores del formulario
        const permisoId = document.getElementById('permisoId').value;
        const nombrePermiso = document.getElementById('nombrePermiso').value.trim();
        const descripcionPermiso = document.getElementById('descripcionPermiso').value.trim();
        const moduloPermiso = document.getElementById('moduloPermiso').value.trim();

        // Validaciones básicas
        if (!nombrePermiso) {
            console.warn('Nombre de permiso vacío');
            toastr.warning('El nombre del permiso es requerido');
            ButtonUtils.stopLoading(submitButton);
            return;
        }

        // Preparar datos
        const data = {
            nombrePermiso: nombrePermiso,
            descripcionPermiso: descripcionPermiso,
            modulo: moduloPermiso
        };

        console.log('Datos a enviar:', data);

        // Determinar si es creación o actualización
        const url = permisoId === '0' ?
            `${API_URL}/api/Permisos/crear-permiso` :
            `${API_URL}/api/Permisos/actualizar/${permisoId}`;

        const response = await fetch(url, {
            method: permisoId === '0' ? 'POST' : 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Error al guardar el permiso');
        }

        console.log('Permiso guardado exitosamente');

        // Cerrar modal y refrescar tablas
        modalPermiso.hide();
        await refrescarTablas();
        toastr.success('Permiso guardado exitosamente');

    } catch (error) {
        console.error('Error en guardarPermiso:', error);
        toastr.error(error.message || 'Error al guardar el permiso');
    } finally {
        console.log('Finalizando guardarPermiso');
        ButtonUtils.stopLoading(submitButton);
    }
}

// Función para editar permiso
window.editarPermiso = async function editarPermiso(permisoId) {
    try {
        // Obtener datos del permiso - ahora usando ruta del controlador
        const response = await fetch(`/Configuracion/permiso/${permisoId}`);
        if (!response.ok) throw new Error('Error al obtener permiso');

        const permiso = await response.json();

        // Llenar el formulario
        document.getElementById('permisoId').value = permisoId;
        document.getElementById('nombrePermiso').value = permiso.nombrePermiso;
        document.getElementById('descripcionPermiso').value = permiso.descripcionPermiso || '';
        document.getElementById('moduloPermiso').value = permiso.modulo || '';

        // Actualizar título del modal
        document.querySelector('#modalNuevoPermiso .modal-title').textContent = 'Editar Permiso';

        // Mostrar modal
        modalPermiso.show();

    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al cargar el permiso');
    }
}

// Función para eliminar permiso
window.eliminarPermiso = async function eliminarPermiso(permisoId) {
    try {
        // Confirmar eliminación con SweetAlert2
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede revertir",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Usar la ruta del controlador
            const response = await fetch(`/Configuracion/eliminar-permiso/${permisoId}`, {
                method: 'DELETE',
                headers: {
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el permiso');
            }

            // Refrescar tablas
            await refrescarTablas();

            await Swal.fire(
                '¡Eliminado!',
                'El permiso ha sido eliminado.',
                'success'
            );
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', error.message || 'Error al eliminar el permiso', 'error');
    }
}


// Función auxiliar para mostrar notificaciones al usuario
function mostrarNotificacion(mensaje, tipo) {
    // Verificar si toastr está disponible
    if (typeof toastr !== 'undefined') {
        // Mostrar notificación usando toastr
        toastr[tipo](mensaje);
    } else {
        // Fallback a alert si toastr no está disponible
        alert(mensaje);
    }
}

// Limpiar formularios al cerrar modales
document.getElementById('modalNuevoRol').addEventListener('hidden.bs.modal', function () {
    document.getElementById('formRol').reset();
    document.getElementById('rolId').value = '0';
    document.querySelector('#modalNuevoRol .modal-title').textContent = 'Nuevo Rol';
});

document.getElementById('modalNuevoPermiso').addEventListener('hidden.bs.modal', function () {
    document.getElementById('formPermiso').reset();
    document.getElementById('permisoId').value = '0';
    document.querySelector('#modalNuevoPermiso .modal-title').textContent = 'Nuevo Permiso';
});