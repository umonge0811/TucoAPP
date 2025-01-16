// Archivo: wwwroot/js/rolesPermisos.js

// Variables globales para los modales
let modalRol = null;
let modalPermiso = null;

// Variable global para almacenar la URL base de la API
const API_URL = 'https://localhost:7273';

// Esperar a que el documento esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar los modales
    modalRol = new bootstrap.Modal(document.getElementById('modalNuevoRol'));
    modalPermiso = new bootstrap.Modal(document.getElementById('modalNuevoPermiso'));

    // Cargar datos iniciales
    cargarPermisos();

    // Configurar eventos de los botones guardar
    document.getElementById('btnGuardarRol').addEventListener('click', guardarRol);
    document.getElementById('btnGuardarPermiso').addEventListener('click', guardarPermiso);
});

// wwwroot/js/rolesPermisos.js

// Función asíncrona para cargar los permisos desde la API
async function cargarPermisos() {
    try {
        // Log para debugging
        console.log('Iniciando carga de permisos...');

        // Realizar la petición GET a la API
        const response = await fetch('https://localhost:7273/api/Permisos/obtener-todos', {
            method: 'GET',
            headers: {
                // Especificar que aceptamos JSON como respuesta
                'Accept': 'application/json',
                // Especificar que enviamos JSON (aunque es GET)
                'Content-Type': 'application/json'
            },
            // Habilitar CORS explícitamente
            mode: 'cors'
        });

        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
            console.error('Error response:', await response.text());
            throw new Error('Error al cargar permisos');
        }

        // Convertir la respuesta a JSON
        const permisos = await response.json();
        console.log('Permisos cargados:', permisos);

        // Obtener la referencia a la tabla donde se mostrarán los permisos
        const tablaPermisos = document.getElementById('tablaPermisos');
        // Limpiar la tabla antes de agregar nuevos datos
        tablaPermisos.innerHTML = '';

        // Iterar sobre cada permiso y crear las filas de la tabla
        permisos.forEach(permiso => {
            const tr = document.createElement('tr');
            // Crear el HTML para cada fila con los datos del permiso
            tr.innerHTML = `
                <td>${permiso.nombrePermiso}</td>
                <td>${permiso.descripcionPermiso || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-2" onclick="editarPermiso(${permiso.permisoId})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarPermiso(${permiso.permisoId})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            // Agregar la fila a la tabla
            tablaPermisos.appendChild(tr);
        });

    } catch (error) {
        // Registrar el error en la consola para debugging
        console.error('Error detallado:', error);
        // Mostrar un mensaje de error al usuario
        mostrarNotificacion('Error al cargar los permisos: ' + error.message, 'error');
    }
}

/**
 * Función para cargar y mostrar los roles en la tabla
 * Mantiene el mismo estilo que la tabla de permisos
 */
// Función para cargar roles
async function cargarRoles() {
    try {
        console.log('Iniciando carga de roles...');

        // Primero obtenemos los roles
        const rolesResponse = await fetch(`${API_URL}/api/Roles/ObtenerTodosRoles`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!rolesResponse.ok) throw new Error('Error al cargar roles');
        const roles = await rolesResponse.json();

        // Para cada rol, obtenemos sus permisos
        const rolesConPermisos = await Promise.all(roles.map(async (rol) => {
            const permisosResponse = await fetch(`${API_URL}/api/Roles/obtener-permisos-del-rol/${rol.rolId}`);
            if (permisosResponse.ok) {
                const permisos = await permisosResponse.json();
                return { ...rol, permisos };
            }
            return rol;
        }));

        const tbody = document.querySelector('#tablaRoles tbody');
        tbody.innerHTML = '';

        // Renderizar los roles con sus permisos
        rolesConPermisos.forEach(rol => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
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
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al cargar roles:', error);
        mostrarNotificacion('Error al cargar los roles', 'error');
    }
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarPermisos();
    cargarRoles();
});


// Función para abrir el modal de nuevo rol
async function abrirModalNuevoRol() {
    try {
        console.log('Abriendo modal de nuevo rol...');

        // Cargar los permisos disponibles
        const response = await fetch(`${API_URL}/api/Permisos/obtener-todos`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar permisos');
        }

        const permisos = await response.json();
        console.log('Permisos cargados para el modal:', permisos);

        // Actualizar lista de permisos en el modal
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

        // Resetear el formulario
        document.getElementById('formRol').reset();
        document.getElementById('rolId').value = '0';
        document.querySelector('#modalNuevoRol .modal-title').textContent = 'Nuevo Rol';

        // Mostrar el modal
        modalRol.show();

    } catch (error) {
        console.error('Error al preparar modal de nuevo rol:', error);
        mostrarNotificacion('Error al cargar los permisos disponibles', 'error');
    }
}

async function editarRol(rolId) {
    try {
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
        listaPermisos.innerHTML = todosLosPermisos.map(permiso => {
            const estaAsignado = permisosRol.some(p => p.permisoId === permiso.permisoId);
            return `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" 
                           value="${permiso.permisoId}" 
                           id="permiso_${permiso.permisoId}"
                           ${estaAsignado ? 'checked' : ''}>
                    <label class="form-check-label" for="permiso_${permiso.permisoId}">
                        ${permiso.nombrePermiso}
                    </label>
                    <small class="text-muted d-block">${permiso.descripcionPermiso || ''}</small>
                </div>
            `;
        }).join('');

        // Actualizar título del modal
        document.querySelector('#modalNuevoRol .modal-title').textContent = 'Editar Rol';

        // Mostrar el modal
        modalRol.show();

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los datos del rol', 'error');
    }
}
// Función para guardar rol
// Y mejoramos la función de guardar rol
async function guardarRol() {
    try {
        const rolId = document.getElementById('rolId').value;
        const nombreRol = document.getElementById('nombreRol').value.trim();
        const descripcionRol = document.getElementById('descripcionRol').value.trim();
        const permisosSeleccionados = Array.from(
            document.querySelectorAll('#listaPermisos input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));

        // Validaciones
        if (!nombreRol) {
            mostrarNotificacion('El nombre del rol es requerido', 'warning');
            return;
        }

        // 1. Primero actualizamos la información básica del rol
        const dataRol = {
            nombreRol: nombreRol,
            descripcionRol: descripcionRol
        };

        let response;
        if (rolId === '0') {
            // Si es nuevo rol
            response = await fetch(`${API_URL}/api/Roles/CrearRoles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...dataRol,
                    permisoIds: permisosSeleccionados
                })
            });
        } else {
            // Si es actualización
            // Actualizar información básica
            response = await fetch(`${API_URL}/api/Roles/actualizarRole/${rolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataRol)
            });

            if (response.ok) {
                // 2. Luego actualizamos los permisos
                const responsePermisos = await fetch(`${API_URL}/api/Roles/actualizar-permisos-del-rol/${rolId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(permisosSeleccionados)
                });

                if (!responsePermisos.ok) {
                    throw new Error('Error al actualizar los permisos');
                }
            }
        }

        if (!response.ok) {
            throw new Error('Error al guardar el rol');
        }

        // Actualizar la vista
        await cargarRoles();

        // Cerrar modal y mostrar mensaje
        modalRol.hide();
        mostrarNotificacion(
            rolId === '0' ? 'Rol creado exitosamente' : 'Rol actualizado exitosamente',
            'success'
        );

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message || 'Error al guardar el rol', 'error');
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
}// Funciones auxiliares
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