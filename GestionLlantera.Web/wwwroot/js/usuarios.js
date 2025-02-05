// Variable global para almacenar la URL base de la API
const API_URL = 'https://localhost:7273';
console.log('Archivo usuarios.js cargado');
console.log('API_URL:', API_URL);

// Variables globales
let modalRoles = null;

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar modal de roles
    modalRoles = new bootstrap.Modal(document.getElementById('modalRoles'));

    // Configurar toastr
    toastr.options = {
        "closeButton": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "timeOut": "3000"
    };
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
        listaRoles.innerHTML = rolesData.roles.map(rol => `
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
       `).join('');

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

// Función para guardar roles en desde la vista de todos los usuarios
async function guardarRoles() {
    try {
        const usuarioId = document.getElementById('usuarioId').value;
        const rolesSeleccionados = Array.from(
            document.querySelectorAll('#listaRoles input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));

        const response = await fetch(`/Usuarios/GuardarRoles?id=${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rolesSeleccionados)
        });

        if (!response.ok) throw new Error('Error al guardar roles');

        const result = await response.json();

        modalRoles.hide();

        Swal.fire({
            icon: 'success',
            title: 'Roles actualizados',
            text: result.message
        });

        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron guardar los cambios en los roles'
        });
    }
}
    

