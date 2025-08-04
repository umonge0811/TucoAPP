// Variable global para almacenar la URL base de la API
const API_URL = 'https://localhost:7273';

// Configuración de Toastr
toastr.options = {
    "closeButton": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "timeOut": "3000"
};

// Variables globales
let modalRoles = null;

// Un solo event listener para la inicialización
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Cargado');
    console.log('Función editarRoles disponible:', typeof editarRoles);

    // Inicializar modal usando getElementById
    const modalElement = document.getElementById('modalRoles');
    if (modalElement) {
        modalRoles = new bootstrap.Modal(modalElement);
    }

    // Inicializar DataTables en desktop
    const tablaUsuarios = $('#tablaUsuarios');
    if (tablaUsuarios.length) {
        tablaUsuarios.DataTable({
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
            },
            dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            order: [[0, 'asc']],
            columnDefs: [
                { targets: -1, orderable: false } // Deshabilitar ordenamiento en columna de acciones
            ]
        });
    }

    // Filtrado en móvil
    $('#mobileBuscar').on('keyup', function () {
        const searchTerm = $(this).val().toLowerCase();
        filterMobileCards(searchTerm, $('#mobileEstado').val());
    });

    $('#mobileEstado').on('change', function () {
        const estado = $(this).val();
        filterMobileCards($('#mobileBuscar').val().toLowerCase(), estado);
    });

    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Inicializar formulario de creación
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        console.log('Formulario encontrado');
        createUserForm.addEventListener('submit', crearUsuario);
    }
});

// Función para filtrar tarjetas en móvil
function filterMobileCards(searchTerm, estado) {
    $('.user-card').each(function () {
        const card = $(this);
        const text = card.text().toLowerCase();
        const cardEstado = card.data('estado');

        const matchSearch = text.includes(searchTerm);
        const matchEstado = !estado || cardEstado === estado;

        if (matchSearch && matchEstado) {
            card.show();
        } else {
            card.hide();
        }
    });
}

/**
* Función para cargar y editar roles de un usuario
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

        if (!response.ok) {
            throw new Error('Error al obtener roles');
        }

        const rolesData = await response.json();
        document.getElementById('usuarioId').value = usuarioId;

        const listaRoles = document.getElementById('listaRoles');
        listaRoles.innerHTML = rolesData.roles.map(rol => `
            <div class="role-checkbox">
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

        Swal.close();
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

async function guardarRoles() {
    try {
        const usuarioId = document.getElementById('usuarioId').value;
        const checkboxes = document.querySelectorAll('#listaRoles input[type="checkbox"]:checked');
        const rolesSeleccionados = Array.from(checkboxes)
            .map(cb => parseInt(cb.value))
            .filter(id => !isNaN(id) && id > 0);

        if (rolesSeleccionados.length === 0) {
            throw new Error('Debe seleccionar al menos un rol válido');
        }

        const response = await fetch(`/Usuarios/GuardarRoles?id=${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rolesSeleccionados)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al guardar roles');
        }

        modalRoles.hide();

        await Swal.fire({
            icon: 'success',
            title: 'Roles actualizados',
            text: 'Los roles se han actualizado exitosamente',
            timer: 1500
        });

        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
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
            text: 'El usuario podrá acceder al sistema nuevamente',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, activar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Activando usuario...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch(`/Usuarios/ActivarUsuario?id=${usuarioId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error al activar usuario');

            await Swal.fire({
                icon: 'success',
                title: '¡Usuario activado!',
                text: 'El usuario ha sido activado correctamente',
                timer: 1500
            });

            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al activar el usuario'
        });
    }
}

async function desactivarUsuario(usuarioId) {
    try {
        const result = await Swal.fire({
            title: '¿Desactivar usuario?',
            text: 'El usuario no podrá acceder al sistema hasta que sea reactivado',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Desactivando usuario...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch(`/Usuarios/DesactivarUsuario?id=${usuarioId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error al desactivar usuario');

            await Swal.fire({
                icon: 'success',
                title: '¡Usuario desactivado!',
                text: 'El usuario ha sido desactivado correctamente',
                timer: 1500
            });

            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al desactivar el usuario'
        });
    }
}

// Función para manejar la creación de usuario
async function crearUsuario(e) {
    e.preventDefault();

    // Obtener referencias al botón y sus estados
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
        if (normalState) normalState.style.display = 'none';
        if (loadingState) loadingState.style.display = 'inline-flex';

        // Preparar datos del formulario
        const formData = {
            nombreUsuario: document.getElementById('NombreUsuario').value,
            email: document.getElementById('Email').value,
            rolId: parseInt(document.getElementById('RolId').value),
            esTopVendedor: document.getElementById('EsTopVendedor').checked
        };

        // Llamada a la API para crear usuario
        const response = await fetch('/Usuarios/CrearUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const data = await response.json();
            showSuccess(data.message); // Asumiendo que existe una función showSuccess

            // Limpiar formulario
            const userForm = document.getElementById('userForm');
            if (userForm) {
                userForm.reset();
            }

        } else {
            const errorData = await response.json();

            // Manejar errores específicos
            if (errorData.errorType === 'DuplicateEmail') {
                // Resaltar el campo de email
                const emailField = document.getElementById('Email');
                if (emailField) {
                    emailField.classList.add('is-invalid');

                    // Crear o actualizar mensaje de error específico
                    let feedbackDiv = emailField.parentNode.querySelector('.invalid-feedback');
                    if (!feedbackDiv) {
                        feedbackDiv = document.createElement('div');
                        feedbackDiv.className = 'invalid-feedback';
                        emailField.parentNode.appendChild(feedbackDiv);
                    }
                    feedbackDiv.textContent = errorData.message;

                    // Remover la clase de error después de 5 segundos
                    setTimeout(() => {
                        emailField.classList.remove('is-invalid');
                        if (feedbackDiv) feedbackDiv.remove();
                    }, 5000);
                }

                // Mostrar SweetAlert específico para email duplicado
                Swal.fire({
                    icon: 'warning',
                    title: 'Email ya registrado',
                    text: errorData.message,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#f59e0b'
                });
                return; // Salir sin lanzar excepción para evitar el catch
            }

            throw new Error(errorData.message || 'Error al crear usuario');
        }

        // Redirigir después de un éxito
        window.location.href = '/Usuarios/Index';

    } catch (error) {
        console.error('Error:', error);

        // Restaurar estado del botón en caso de error
        if (submitButton) {
            submitButton.disabled = false;
            if (normalState) normalState.style.display = 'inline-flex';
            if (loadingState) loadingState.style.display = 'none';
        }

        // Mostrar mensaje de error con SweetAlert
        Swal.fire({
            icon: 'error',
            title: 'Error al crear usuario',
            text: error.message || 'No se pudo crear el usuario. Por favor, intente nuevamente.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc3545'
        });
    }
}

// Función auxiliar para mostrar mensajes de éxito (si no existe globalmente)
function showSuccess(message) {
    if (typeof toastr !== 'undefined') {
        toastr.success(message);
    } else {
        console.log('Éxito:', message);
    }
}

// Función para manejar errores de AJAX globalmente
$(document).ajaxError(function (event, jqXHR) {
    if (jqXHR.status === 401) {
        window.location.href = '/Account/Login';
    } else if (jqXHR.status === 403) {
        toastr.error('No tiene permisos para realizar esta acción');
    }
});