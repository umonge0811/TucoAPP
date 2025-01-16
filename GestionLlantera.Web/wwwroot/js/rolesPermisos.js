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

// Función para editar rol
async function editarRol(rolId) {
    try {
        const response = await fetch(`/api/roles/obtener-rol-id/${rolId}`);
        if (!response.ok) throw new Error('Error al obtener rol');

        const rol = await response.json();

        // Llenar el formulario
        document.getElementById('rolId').value = rol.rolId;
        document.getElementById('nombreRol').value = rol.nombreRol;
        document.getElementById('descripcionRol').value = rol.descripcionRol || '';

        // Marcar los permisos asignados
        const permisosAsignados = rol.permisos.map(p => p.permisoId);
        document.querySelectorAll('#listaPermisos input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = permisosAsignados.includes(parseInt(checkbox.value));
        });

        // Cambiar título del modal
        document.querySelector('#modalNuevoRol .modal-title').textContent = 'Editar Rol';

        // Mostrar modal
        modalRol.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar el rol', 'error');
    }
}

// Función para guardar rol
async function guardarRol() {
    try {
        // Obtener los valores del formulario
        const rolId = document.getElementById('rolId').value;
        const nombreRol = document.getElementById('nombreRol').value.trim();
        const descripcionRol = document.getElementById('descripcionRol').value.trim();

        // Validaciones básicas
        if (!nombreRol) {
            mostrarNotificacion('El nombre del rol es requerido', 'warning');
            return;
        }

        // Obtener permisos seleccionados
        const permisosSeleccionados = Array.from(
            document.querySelectorAll('#listaPermisos input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));

        const data = {
            nombreRol: nombreRol,
            descripcionRol: descripcionRol,
            permisoIds: permisosSeleccionados
        };

        // Si es edición, agregar el ID
        if (rolId !== '0') {
            data.rolId = parseInt(rolId);
        }

        const url = rolId === '0' ?
            `${API_URL}/api/Roles/CrearRoles` :
            `${API_URL}/api/Roles/actualizarRole/${rolId}`;

        const response = await fetch(url, {
            method: rolId === '0' ? 'POST' : 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el rol');
        }

        // Cerrar modal y actualizar la tabla
        modalRol.hide();
        await cargarRoles();

        // Mostrar mensaje de éxito
        mostrarNotificacion(
            rolId === '0' ? 'Rol creado exitosamente' : 'Rol actualizado exitosamente',
            'success'
        );
    } catch (error) {
        console.error('Error al guardar rol:', error);
        mostrarNotificacion(error.message || 'Error al guardar el rol', 'error');
    }
}
// Función para eliminar rol
async function eliminarRol(rolId) {
    if (!confirm('¿Está seguro de eliminar este rol?')) return;

    try {
        const response = await fetch(`/api/roles/${rolId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar rol');

        mostrarNotificacion('Rol eliminado exitosamente', 'success');
        location.reload();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar el rol', 'error');
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