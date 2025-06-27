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

        const tbody = document.querySelector('#roles table tbody');
        if (!tbody) {
            console.error('No se encontró el elemento tbody de la tabla de roles');
            return;
        }

        tbody.innerHTML = roles.map(rol => {
            console.log('Procesando rol:', rol); // Ver cada rol individual
            console.log('Permisos del rol:', rol.permisos); // Ver los permisos de cada rol

            return `
                <tr>
                    <td class="fw-semibold">${rol.nombreRol}</td>
                    <td>${rol.descripcionRol || '-'}</td>
                    <td>
                        <div class="d-flex flex-wrap gap-1">
                            ${Array.isArray(rol.permisos) && rol.permisos.length > 0
                    ? rol.permisos.map(permiso =>
                        `<span class="badge bg-light text-dark">
                        <i class="bi bi-key-fill me-1 text-primary"></i>
                        ${permiso.nombrePermiso}
                    </span>`
                    ).join('')
                    : '<span class="text-muted">Sin permisos</span>'
                }
                        </div>
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
            `;
        }).join('');

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

    tbody.innerHTML = roles.map(rol => `
        <tr>
            <td class="fw-semibold">${rol.nombreRol}</td>
            <td>${rol.descripcionRol || '-'}</td>
            <td>
                <div class="d-flex flex-wrap gap-1">
                    ${rol.permisos && rol.permisos.length > 0
            ? rol.permisos.map(permiso =>
                `<span class="badge bg-light text-dark">
                    <i class="bi bi-key-fill me-1 text-primary"></i>
                    ${permiso.nombrePermiso}
                </span>`
            ).join('')
            : '<span class="text-muted">Sin permisos</span>'
        }
                </div>
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


// Función auxiliar para actualizar la tabla de permisos
function actualizarTablaPermisos(permisos) {
    const tbody = document.querySelector('#permisos table tbody');
    if (!tbody) {
        console.error('No se encontró el elemento tabla de permisos');
        return;
    }

    tbody.innerHTML = permisos.map(permiso => `
        <tr>
            <td>${permiso.nombrePermiso}</td>
            <td>${permiso.descripcionPermiso || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editarPermiso(${permiso.permisoId})" title="Editar">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarPermiso(${permiso.permisoId})" title="Eliminar">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para abrir el modal de nuevo rol
async function abrirModalNuevoRol() {
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

        // Obtener permisos por categoría
        const responsePermisos = await fetch(`/api/Permisos/por-categoria`);
        if (!responsePermisos.ok) {
            throw new Error('Error al cargar permisos disponibles');
        }

        const permisosPorCategoria = await responsePermisos.json();
        console.log('Permisos por categoría:', permisosPorCategoria);

        // Generar HTML para lista de permisos categorizados
        const listaPermisos = document.getElementById('listaPermisos');
        let html = '';

        Object.keys(permisosPorCategoria).forEach(categoria => {
            html += `
                <div class="categoria-group">
                    <div class="categoria-header">
                        <i class="bi bi-folder me-2"></i>
                        ${categoria}
                    </div>
                    <div class="categoria-permisos">
                        ${permisosPorCategoria[categoria].map(permiso => `
                            <div class="permiso-item">
                                <input class="form-check-input" type="checkbox" value="${permiso.permisoId}" id="permiso_${permiso.permisoId}">
                                <div class="permiso-label">
                                    <label class="form-check-label" for="permiso_${permiso.permisoId}">
                                        ${permiso.nombrePermiso}
                                    </label>
                                    ${permiso.descripcionPermiso ? `<div class="permiso-description">${permiso.descripcionPermiso}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        listaPermisos.innerHTML = html;

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
async function abrirModalNuevoPermiso() {
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

async function editarRol(rolId) {
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

        // Generar los checkboxes
        const listaPermisos = document.getElementById('listaPermisos');
        listaPermisos.innerHTML = permisos.map(permiso => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" 
                       value="${permiso.permisoId}" 
                       id="permiso_${permiso.permisoId}">
                <label class="form-check-label" for="permiso_${permiso.permisoId}">
                    ${permiso.nombrePermiso}
                </label>
                <small class="text-muted d-block">${permiso.descripcionPermiso || ''}</small>
            </div>
        `).join('');

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

        // Cerrar el modal y refrescar tablas
        modalRol.hide();
        await refrescarTablas();
        toastr.success('Rol creado exitosamente');

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
            return;
        }

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

        // Cerrar el modal primero
        modalRol.hide();

        // Asegurar que la tabla se actualice completamente con los datos nuevos
        await refrescarTablas();

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
async function eliminarRol(rolId) {
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
            descripcionPermiso: descripcionPermiso
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
async function editarPermiso(permisoId) {
    try {
        // Obtener datos del permiso - ahora usando ruta del controlador
        const response = await fetch(`/Configuracion/permiso/${permisoId}`);
        if (!response.ok) throw new Error('Error al obtener permiso');

        const permiso = await response.json();

        // Llenar el formulario
        document.getElementById('permisoId').value = permisoId;
        document.getElementById('nombrePermiso').value = permiso.nombrePermiso;
        document.getElementById('descripcionPermiso').value = permiso.descripcionPermiso || '';

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
async function eliminarPermiso(permisoId) {
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