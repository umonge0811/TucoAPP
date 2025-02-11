// Archivo: wwwroot/js/rolesPermisos.js
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
        btnGuardarRol.addEventListener('click', guardarRol);
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


// Función para cargar todos los permisos
async function cargarPermisos() {
    try {
        console.log('Iniciando carga de permisos...');

        // Llamada al nuevo endpoint del controlador
        const response = await fetch('/Configuracion/ObtenerPermisos');

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


/**
 * Función para cargar y mostrar los roles en la tabla
 * Mantiene el mismo estilo que la tabla de permisos
 */
// Función para cargar todos los roles
async function cargarRoles() {
    try {
        console.log('Iniciando carga de roles...');

        const response = await fetch('/Configuracion/ObtenerRoles');

        if (!response.ok) {
            throw new Error('Error al cargar roles');
        }

        const roles = await response.json();
        console.log('Roles recibidos:', roles); // Verificar la estructura de los datos

        const tbody = document.querySelector('#tablaRoles tbody');
        if (!tbody) {
            console.error('No se encontró el elemento tbody de la tabla de roles');
            return;
        }

        tbody.innerHTML = roles.map(rol => {
            console.log('Procesando rol:', rol); // Ver cada rol individual
            console.log('Permisos del rol:', rol.permisos); // Ver los permisos de cada rol

            return `
                <tr>
                    <td>${rol.nombreRol}</td>
                    <td>${rol.descripcionRol || '-'}</td>
                    <td>
                        ${Array.isArray(rol.permisos) && rol.permisos.length > 0
                    ? rol.permisos.map(permiso =>
                        `<span class="badge bg-primary me-1">${permiso.nombrePermiso}</span>`
                    ).join('')
                    : '<span class="text-muted">Sin permisos</span>'
                }
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary me-2" onclick="editarRol(${rol.rolId})" title="Editar">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarRol(${rol.rolId})" title="Eliminar">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar roles:', error);
        toastr.error('Error al cargar los roles');
    }
}


// Función auxiliar para actualizar la tabla de roles
function actualizarTablaRoles(roles) {
    const tbody = document.querySelector('#tablaRoles tbody');
    if (!tbody) {
        console.error('No se encontró la tabla de roles');
        return;
    }

    tbody.innerHTML = roles.map(rol => `
        <tr>
            <td>${rol.nombreRol}</td>
            <td>${rol.descripcionRol || '-'}</td>
            <td>
                ${rol.permisos && rol.permisos.length > 0
            ? rol.permisos.map(permiso =>
                `<span class="badge bg-primary me-1">${permiso.nombrePermiso}</span>`
            ).join('')
            : '<span class="text-muted">Sin permisos</span>'
        }
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editarRol(${rol.rolId})" title="Editar">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarRol(${rol.rolId})" title="Eliminar">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        </tr>
    `).join('');
}


// Función auxiliar para actualizar la tabla de permisos
function actualizarTablaPermisos(permisos) {
    const tbody = document.getElementById('tablaPermisos');
    if (!tbody) {
        console.error('No se encontró el elemento tablaPermisos');
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

/**
 * Función auxiliar para formatear los permisos de un rol
 * @param {Array} permisos - Array de permisos asociados al rol
 * @returns {string} HTML formateado con los permisos
 */
function formatearPermisos(permisos) {
    if (!Array.isArray(permisos) || permisos.length === 0) {
        return '<span class="text-muted">Sin permisos</span>';
    }

    return permisos
        .map(rp => {
            if (!rp || !rp.permiso) return '';
            return `<span class="badge bg-primary me-1">
                ${escapeHtml(rp.permiso.nombrePermiso || '')}
            </span>`;
        })
        .join('');
}

/**
 * Función de utilidad para escapar HTML y prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para abrir el modal de nuevo rol
async function abrirModalNuevoRol() {
    try {
        console.log('Abriendo modal de nuevo rol...');

        // Obtener permisos usando el controlador
        const response = await fetch('/Configuracion/ObtenerPermisos');

        if (!response.ok) {
            throw new Error('Error al cargar permisos');
        }

        const permisos = await response.json();
        console.log('Permisos cargados para el modal:', permisos);

        // Actualizar lista de permisos en el modal
        const listaPermisos = document.getElementById('listaPermisos');
        if (!listaPermisos) {
            throw new Error('No se encontró el elemento listaPermisos');
        }

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

        // Resetear el formulario
        document.getElementById('formRol').reset();
        document.getElementById('rolId').value = '0';
        document.querySelector('#modalNuevoRol .modal-title').textContent = 'Nuevo Rol';

        // Mostrar el modal
        modalRol.show();

    } catch (error) {
        console.error('Error al preparar modal de nuevo rol:', error);
        toastr.error('Error al cargar los permisos disponibles');
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
        mostrarNotificacion('Error al abrir el formulario', 'error');
    }
}

async function editarRol(rolId) {
    const submitButton = document.querySelector(`button[onclick="editarRol(${rolId})"]`);

    try {
        // Mostrar estado de carga en el botón
        if (submitButton) {
            ButtonUtils.startLoading(submitButton);
        }

        // 1. Obtener la información del rol
        const rolResponse = await fetch(`${API_URL}/api/Roles/obtener-rol-id/${rolId}`);
        if (!rolResponse.ok) throw new Error('Error al obtener rol');
        const rol = await rolResponse.json();

        // 2. Obtener los permisos del rol
        const permisosRolResponse = await fetch(`${API_URL}/api/Roles/obtener-permisos-del-rol/${rolId}`);
        if (!permisosRolResponse.ok) throw new Error('Error al obtener permisos del rol');
        const permisosRol = await permisosRolResponse.json();

        // 3. Obtener todos los permisos disponibles
        const permisosResponse = await fetch(`${API_URL}/api/Permisos/obtener-todos`);
        if (!permisosResponse.ok) throw new Error('Error al obtener permisos');
        const todosLosPermisos = await permisosResponse.json();

        // Llenar el formulario con los datos del rol
        document.getElementById('rolId').value = rol.rolId;
        document.getElementById('nombreRol').value = rol.nombreRol;
        document.getElementById('descripcionRol').value = rol.descripcionRol || '';

        // Generar lista de permisos y marcar los que ya tiene asignados
        const listaPermisos = document.getElementById('listaPermisos');
        listaPermisos.innerHTML = todosLosPermisos.map(permiso => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox"
                       value="${permiso.permisoId}"
                       id="permiso_${permiso.permisoId}"
                       ${permisosRol.some(p => p.permisoId === permiso.permisoId) ? 'checked' : ''}>
                <label class="form-check-label" for="permiso_${permiso.permisoId}">
                    ${permiso.nombrePermiso}
                </label>
                <small class="text-muted d-block">${permiso.descripcionPermiso || ''}</small>
            </div>
        `).join('');

        // Actualizar título del modal
        document.querySelector('#modalNuevoRol .modal-title').textContent = 'Editar Rol';

        // Mostrar el modal
        modalRol.show();

    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al cargar los datos del rol');
    } finally {
        // Restaurar estado del botón
        if (submitButton) {
            ButtonUtils.stopLoading(submitButton);
        }
    }
}


// Función para guardar rol
async function guardarRol() {
    console.log('Iniciando guardarRol');
    const submitButton = document.getElementById('btnGuardarRol');

    if (!submitButton) {
        console.error('Botón guardarRol no encontrado');
        return;
    }

    try {
        console.log('Iniciando proceso de guardado de rol');
        ButtonUtils.startLoading(submitButton);

        // Obtener los datos del formulario
        const rolId = document.getElementById('rolId').value;
        const nombreRol = document.getElementById('nombreRol').value.trim();
        const descripcionRol = document.getElementById('descripcionRol').value.trim();

        // Obtener permisos seleccionados
        const checkboxes = document.querySelectorAll('#listaPermisos input[type="checkbox"]:checked');
        const permisoIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

        console.log('PermisoIds seleccionados:', permisoIds);

        // Validaciones
        if (!nombreRol) {
            console.warn('Nombre de rol vacío');
            toastr.warning('El nombre del rol es requerido');
            ButtonUtils.stopLoading(submitButton);
            return;
        }

        const isEditing = rolId !== '0';

        if (isEditing) {
            // 1. Primero actualizamos la información básica del rol
            const dataRol = {
                id: parseInt(rolId),
                nombreRol: nombreRol,
                descripcionRol: descripcionRol
            };

            const updateResponse = await fetch(`${API_URL}/api/Roles/actualizarRole/${rolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(dataRol)
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(errorData.message || 'Error al actualizar el rol');
            }

            // 2. Luego actualizamos los permisos usando el endpoint correcto
            const permisosResponse = await fetch(`${API_URL}/api/Roles/actualizar-permisos-del-rol/${rolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(permisoIds)
            });

            if (!permisosResponse.ok) {
                const errorData = await permisosResponse.json();
                throw new Error(errorData.message || 'Error al actualizar los permisos del rol');
            }
        } else {
            // Si es un nuevo rol, usamos el endpoint de creación que maneja todo junto
            const dataRol = {
                nombreRol: nombreRol,
                descripcionRol: descripcionRol,
                permisoIds: permisoIds
            };

            const response = await fetch(`${API_URL}/api/Roles/CrearRoles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(dataRol)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear el rol');
            }
        }

        console.log('Rol guardado exitosamente');
        await cargarRoles();
        modalRol.hide();
        toastr.success(isEditing ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente');

    } catch (error) {
        console.error('Error en guardarRol:', error);
        toastr.error(error.message || 'Error al guardar el rol');
    } finally {
        console.log('Finalizando guardarRol');
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

            //HAY QUE MODIFICAR PORQUE SE ESTA COMUNICANDO DIRECTO CON LA API
            const response = await fetch(`${API_URL}/api/Roles/${rolId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el rol');
            }

            await cargarRoles();

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
        mostrarNotificacion('Error al abrir el formulario', 'error');
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
        modalPermiso.hide();
        await Promise.all([cargarPermisos(), cargarRoles()]);
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
        // Obtener datos del permiso
        const response = await fetch(`${API_URL}/api/Permisos/obtener-por-id/${permisoId}`); //HAY QUE MODIFICAR PORQUE SE ESTA COMUNICANDO DIRECTO CON LA API
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
        mostrarNotificacion('Error al cargar el permiso', 'error');
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
            //HAY QUE MODIFICAR PORQUE SE ESTA COMUNICANDO DIRECTO CON LA API
            const response = await fetch(`${API_URL}/api/Permisos/eliminar/${permisoId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el permiso');
            }

            // Recargar ambas tablas
            await Promise.all([
                cargarPermisos(),
                cargarRoles()
            ]);

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

// Funciones auxiliares
function actualizarListaPermisosModal(permisos) {
    const listaPermisos = document.getElementById('listaPermisos');
    listaPermisos.innerHTML = permisos.map(permiso => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${permiso.permisoId}" id="permiso${permiso.permisoId}">
            <label class="form-check-label" for="permiso${permiso.permisoId}">
                ${permiso.nombrePermiso}
            </label>
        </div>
    `).join('');
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