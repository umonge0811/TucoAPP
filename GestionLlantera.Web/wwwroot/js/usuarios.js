// Variable global para almacenar la URL base de la API
const API_URL = 'https://localhost:7273';
console.log('Archivo usuarios.js cargado');
console.log('API_URL:', API_URL);

// Variables globales
let modalRoles = null;



// Un solo event listener para la inicialización
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Cargado');

    // Inicializar modal usando getElementById
    const modalElement = document.getElementById('modalRoles');
    if (modalElement) {
        modalRoles = new bootstrap.Modal(modalElement);
    }

    // Inicializar formulario de creación
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        console.log('Formulario encontrado');
        createUserForm.addEventListener('submit', crearUsuario);
    } else {
        console.error('Formulario no encontrado');
    }
});

/**
* Función para cargar y editar roles de un usuario
* Ahora adaptada para usar el controlador web en lugar de la API directamente
*/
async function editarRoles(usuarioId) {
    try {
        // Mostrar indicador de carga con SweetAlert2
        Swal.fire({
            title: 'Cargando roles...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Petición al controlador web para obtener roles
        const response = await fetch(`/Usuarios/ObtenerRolesUsuario?id=${usuarioId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Verificar respuesta
        if (!response.ok) {
            throw new Error('Error al obtener roles');
        }

        // Procesar datos de roles recibidos
        const rolesData = await response.json();

        // Actualizar ID del usuario en el modal para referencia
        document.getElementById('usuarioId').value = usuarioId;

        // Generar HTML para los checkboxes de roles dinámicamente
        const listaRoles = document.getElementById('listaRoles');
        console.log('Roles recibidos:', rolesData.roles);

        listaRoles.innerHTML = rolesData.roles.map(rol => {
            console.log('Generando checkbox para rol:', rol);
            return `
        <div class="form-check">
            <input class="form-check-input" type="checkbox"
                   value="${rol.rolId}"
                   id="rol_${rol.rolId}"
                   ${rol.asignado ? 'checked' : ''}>
            <label class="form-check-label" for="rol_${rol.rolId}">
                ${rol.nombreRol}
            </label>
            <small class="text-muted d-block">${rol.descripcionRol || ''}</small>
        </div>
    `;
        }).join('');

        // Verificar después de generar los checkboxes
        console.log('Checkboxes generados:', document.querySelectorAll('#listaRoles input[type="checkbox"]').length);

        // Cerrar indicador de carga
        Swal.close();

        // Mostrar modal de edición de roles
        const modalRoles = new bootstrap.Modal(document.getElementById('modalRoles'));
        modalRoles.show();

    } catch (error) {
        // Manejo de errores
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los roles'
        });
    }
}

async function guardarRoles() {
    try {
        const usuarioId = document.getElementById('usuarioId').value;
        console.log('ID de usuario a guardar:', usuarioId);

        // Obtener checkboxes seleccionados
        const checkboxes = document.querySelectorAll('#listaRoles input[type="checkbox"]:checked');
        console.log('Checkboxes seleccionados encontrados:', checkboxes.length);

        // Mapear a array de IDs y mostrar cada ID procesado
        const rolesSeleccionados = Array.from(checkboxes).map(cb => {
            const id = parseInt(cb.value);
            console.log('Procesando checkbox:', {
                id: cb.id,
                value: cb.value,
                parsedValue: id
            });
            return id;
        }).filter(id => !isNaN(id) && id > 0); // Asegurar que solo se envíen IDs válidos

        console.log('Roles finales a enviar:', rolesSeleccionados);

        // Validar que haya roles seleccionados válidos
        if (rolesSeleccionados.length === 0) {
            throw new Error('Debe seleccionar al menos un rol válido');
        }

        // Enviar al servidor
        const response = await fetch(`/Usuarios/GuardarRoles?id=${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rolesSeleccionados)
        });

        console.log('Respuesta del servidor:', response.status);

        // Leer el cuerpo de la respuesta para debugging
        const responseText = await response.text();
        console.log('Respuesta completa:', responseText);

        if (!response.ok) {
            throw new Error(responseText || 'Error al guardar roles');
        }

        const result = responseText ? JSON.parse(responseText) : {};

        modalRoles.hide();

        Swal.fire({
            icon: 'success',
            title: 'Roles actualizados',
            text: result.message || 'Roles actualizados exitosamente'
        });

        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error('Error completo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudieron guardar los cambios en los roles'
        });
    }
}


// Función para activar usuario
async function activarUsuario(usuarioId) {
    try {
        const result = await Swal.fire({
            title: '¿Activar usuario?',
            text: '¿Está seguro de que desea activar este usuario?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, activar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/Usuarios/ActivarUsuario?id=${usuarioId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error al activar usuario');

            toastr.success('Usuario activado exitosamente');
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al activar el usuario');
    }
}

async function desactivarUsuario(usuarioId) {
    try {
        const result = await Swal.fire({
            title: '¿Desactivar usuario?',
            text: '¿Está seguro de que desea desactivar este usuario?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/Usuarios/DesactivarUsuario?id=${usuarioId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error al desactivar usuario');

            toastr.success('Usuario desactivado exitosamente');
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al desactivar el usuario');
    }
}

// En el evento de submit del formulario
async function crearUsuario(e) {
    e.preventDefault();

    // Obtener referencias
    const submitButton = document.querySelector('#submitButton');

    if (!submitButton) {
        console.error('El botón de submit no fue encontrado');
        return;
    }

    const normalState = submitButton.querySelector('.normal-state');
    const loadingState = submitButton.querySelector('.loading-state');

    try {
        // Deshabilitar botón y mostrar estado de carga
        submitButton.disabled = true;
        normalState.style.display = 'none';
        loadingState.style.display = 'inline-flex';

        const formData = {
            nombreUsuario: document.getElementById('NombreUsuario').value,
            email: document.getElementById('Email').value,
            rolId: parseInt(document.getElementById('RolId').value)
        };

        const response = await fetch('/Usuarios/CrearUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear usuario');
        }

        const result = await response.json();

        await Swal.fire({
            icon: 'success',
            title: 'Usuario Creado',
            text: 'El usuario ha sido creado exitosamente. Se ha enviado un correo de activación.',
            showConfirmButton: true
        });

        window.location.href = '/Usuarios/Index';
    } catch (error) {
        console.error('Error:', error);

        // Restaurar estado del botón
        submitButton.disabled = false;
        normalState.style.display = 'inline-flex';
        loadingState.style.display = 'none';

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al crear el usuario'
        });
    }
}
