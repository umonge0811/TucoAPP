// Variables globales
let modalRoles = null;

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', function () {
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
        console.log('Obteniendo roles para usuario:', usuarioId);

        const response = await fetch(`/Usuarios/roles/${usuarioId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al obtener roles');
        }

        const data = await response.json();
        console.log('Roles obtenidos:', data);

        document.getElementById('usuarioId').value = usuarioId;

        const listaRoles = document.getElementById('listaRoles');
        listaRoles.innerHTML = data.roles.map(rol => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" 
                       value="${rol.rolId}" id="rol_${rol.rolId}"
                       ${rol.asignado ? 'checked' : ''}>
                <label class="form-check-label" for="rol_${rol.rolId}">
                    ${rol.nombreRol}
                </label>
            </div>
        `).join('');

        const modalRoles = new bootstrap.Modal(document.getElementById('modalRoles'));
        modalRoles.show();
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al cargar los roles');
    }
}

// Función para guardar roles
async function guardarRoles() {
    try {
        const usuarioId = document.getElementById('usuarioId').value;
        const rolesSeleccionados = Array.from(
            document.querySelectorAll('#listaRoles input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));

        console.log('Guardando roles para usuario:', usuarioId, rolesSeleccionados);

        const response = await fetch(`/Usuarios/roles/${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(rolesSeleccionados)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al guardar roles');
        }

        const modalRoles = bootstrap.Modal.getInstance(document.getElementById('modalRoles'));
        modalRoles.hide();

        toastr.success('Roles actualizados exitosamente');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al guardar los roles');
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
            console.log('Activando usuario:', usuarioId);

            const response = await fetch(`/Usuarios/${usuarioId}/activar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al activar usuario');
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
            console.log('Desactivando usuario:', usuarioId);

            const response = await fetch(`/Usuarios/${usuarioId}/desactivar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al desactivar usuario');
            }

            toastr.success('Usuario desactivado exitosamente');
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error al desactivar el usuario');
    }
}