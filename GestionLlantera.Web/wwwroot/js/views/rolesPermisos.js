The code has been modified to improve the dependency activation functions for both normal and edit modes, ensuring recursive activation and deactivation of dependent permissions.
```

```javascript
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

        // Función para activar las dependencias de un permiso (mejorada para múltiples dependencias)
        function activarDependencias(permisoId, isChecked) {
            console.log(`🔄 Activando dependencias para permiso ${permisoId}, checked: ${isChecked}`);

            if (isChecked && dependenciasPermisos[permisoId]) {
                // Si se marca el permiso, marcar también TODAS sus dependencias
                dependenciasPermisos[permisoId].forEach(dependenciaId => {
                    const checkboxDependencia = document.getElementById(`permiso_${dependenciaId}`);
                    if (checkboxDependencia && !checkboxDependencia.checked) {
                        console.log(`✅ Activando dependencia: permiso ${dependenciaId}`);
                        checkboxDependencia.checked = true;
                        // Activar recursivamente las dependencias de la dependencia
                        activarDependencias(dependenciaId, true);
                    }
                });
            } else if (!isChecked) {
                // Si se desmarca el permiso, desmarcar los que dependen de él
                Object.keys(dependenciasPermisos).forEach(permisoIdStr => {
                    const permisoIdNum = parseInt(permisoIdStr);
                    if (dependenciasPermisos[permisoIdNum] && dependenciasPermisos[permisoIdNum].includes(permisoId)) {
                        const checkboxDependiente = document.getElementById(`permiso_${permisoIdNum}`);
                        if (checkboxDependiente && checkboxDependiente.checked) {
                            console.log(`❌ Desactivando permiso dependiente: ${permisoIdNum}`);
                            checkboxDependiente.checked = false;
                            // Recursivamente desactivar los que dependen de este
                            activarDependencias(permisoIdNum, false);
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

        // Definir las dependencias entre permisos (para la edición) - DATOS REALES
        const dependenciasPermisosEditar = {
            11: [6],  // Gestion Usuarios depende de Gestion Completa
            8: [7],   // Eliminar Productos depende de Editar Productos
            9: [7],   // Ajustar Stock depende de Editar Productos
            4: [3]    // Ver Utilidades depende de Ver Costos
        };

        // Función para activar las dependencias de un permiso (en edición - mejorada para múltiples dependencias)
        function activarDependenciasEditar(permisoId, isChecked) {