// Variable global para almacenar la URL base de la API
const API_URL = 'https://localhost:7273';

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

// Función para editar roles
async function editarRoles(usuarioId) {
    try {
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Cargando roles...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Realizar la petición para obtener roles del usuario
        const response = await fetch(`${API_URL}/api/Usuarios/usuarios/${usuarioId}/roles`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener roles');
        }

        const rolesData = await response.json();

        // Actualizar el ID del usuario en el modal
        document.getElementById('usuarioId').value = usuarioId;

        // Generar HTML para los checkboxes de roles
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

        // Cerrar el indicador de carga
        Swal.close();

        // Mostrar el modal
        const modalRoles = new bootstrap.Modal(document.getElementById('modalRoles'));
        modalRoles.show();

    } catch (error) {
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
            const response = await fetch(`${API_URL}/api/Usuarios/usuarios/${usuarioId}/activar`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al activar usuario');
            }

            toastr.success('Usuario activado exitosamente');
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al activar el usuario');
    }
}

// Función para desactivar usuario
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
            const response = await fetch(`${API_URL}/api/Usuarios/usuarios/${usuarioId}/desactivar`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al desactivar usuario');
            }

            toastr.success('Usuario desactivado exitosamente');
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al desactivar el usuario');
    }
}

// Función para guardar roles
async function guardarRoles() {
    try {
        const usuarioId = document.getElementById('usuarioId').value;
        const rolesSeleccionados = Array.from(
            document.querySelectorAll('#listaRoles input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));

        const response = await fetch(`${API_URL}/api/Usuarios/usuarios/${usuarioId}/roles`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rolesSeleccionados)
        });

        if (!response.ok) {
            throw new Error('Error al guardar roles');
        }

        // Cerrar el modal
        const modalRoles = bootstrap.Modal.getInstance(document.getElementById('modalRoles'));
        modalRoles.hide();

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Roles actualizados',
            text: 'Los roles se han actualizado correctamente'
        });

        // Recargar la página después de un breve momento
        setTimeout(() => location.reload(), 1500);

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron guardar los cambios en los roles'
        });
    }

    const response = await fetch('@Url.Action("CrearUsuario", "Usuarios")', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    // Evento para crear usuario
    document.addEventListener('DOMContentLoaded', function () {
        const createUserForm = document.getElementById('createUserForm');
        if (createUserForm) {
            createUserForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                try {
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

                    if (response.ok) {
                        toastr.success('Usuario creado exitosamente. Se ha enviado un correo para activar la cuenta.');
                        setTimeout(() => {
                            window.location.href = '/Usuarios';
                        }, 3000);
                    } else {
                        const error = await response.json();
                        toastr.error(error.message || 'Error al crear el usuario');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    toastr.error('Error al procesar la solicitud');
                }
            });
        }
    });
}
