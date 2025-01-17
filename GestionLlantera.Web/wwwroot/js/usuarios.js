// Variables globales
let modalRoles;

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    modalRoles = new bootstrap.Modal(document.getElementById('modalRoles'));
});

// Función para editar roles
async function editarRoles(usuarioId) {
    try {
        const response = await fetch(`/Usuarios/ObtenerRoles/${usuarioId}`);
        if (!response.ok) throw new Error('Error al obtener roles');

        const data = await response.json();
        document.getElementById('usuarioId').value = usuarioId;

        const listaRoles = document.getElementById('listaRoles');
        listaRoles.innerHTML = data.roles.map(rol => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" 
                       value="${rol.rolId}" id="rol_${rol.rolId}"
                       ${rol.asignado ? 'checked' : ''}>
                <label class="form-check-label" for="rol_${rol.rolId}">
                    ${rol.nombreRol}
                </label>
            </div>
        `).join('');

        modalRoles.show();
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
    }
}

// Función para guardar roles
async function guardarRoles() {
    try {
        const usuarioId = document.getElementById('usuarioId').value;
        const rolesSeleccionados = Array.from(
            document.querySelectorAll('#listaRoles input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));

        const response = await fetch(`/Usuarios/GuardarRoles/${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rolesSeleccionados)
        });

        if (!response.ok) throw new Error('Error al guardar roles');

        modalRoles.hide();
        location.reload();
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudieron guardar los roles', 'error');
    }
}

// Funciones para activar/desactivar usuarios
async function activarUsuario(usuarioId) {
    await cambiarEstadoUsuario(usuarioId, true);
}

async function desactivarUsuario(usuarioId) {
    await cambiarEstadoUsuario(usuarioId, false);
}

async function cambiarEstadoUsuario(usuarioId, activar) {
    try {
        const result = await Swal.fire({
            title: `¿${activar ? 'Activar' : 'Desactivar'} usuario?`,
            text: `¿Estás seguro de que deseas ${activar ? 'activar' : 'desactivar'} este usuario?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/Usuarios/${activar ? 'Activar' : 'Desactivar'}/${usuarioId}`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Error al cambiar estado');

            location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', `No se pudo ${activar ? 'activar' : 'desactivar'} el usuario`, 'error');
    }
}