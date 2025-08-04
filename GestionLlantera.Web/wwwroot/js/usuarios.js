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
let modalEditarUsuario = null; // Declaración de la variable para el modal de edición

// Un solo event listener para la inicialización
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Cargado');
    console.log('Función editarRoles disponible:', typeof editarRoles);

    // Inicializar modal de roles usando getElementById
    const modalRolesElement = document.getElementById('modalRoles');
    if (modalRolesElement) {
        modalRoles = new bootstrap.Modal(modalRolesElement);
    }

    // Inicializar modal de edición de usuario
    const modalEditarUsuarioElement = document.getElementById('modalEditarUsuario');
    if (modalEditarUsuarioElement) {
        modalEditarUsuario = new bootstrap.Modal(modalEditarUsuarioElement);
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

    // Asignar eventos a los botones de editar usuario (se cargarán dinámicamente o se asocian aquí)
    // Se usa delegación de eventos para los botones dentro de la tabla
    $('#tablaUsuarios tbody').on('click', '.btn-editar-usuario', function () {
        const usuarioId = $(this).data('usuario-id');
        console.log('Boton editar clickeado', usuarioId);
        editarUsuario(usuarioId);
    });

    // Asociar evento al botón de guardar del modal de edición
    const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
    if (btnGuardarEdicion) {
        btnGuardarEdicion.addEventListener('click', guardarEdicionUsuario);
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

// ===== FUNCIONES DE EDICIÓN DE USUARIO =====

// Función para abrir el modal de editar usuario
async function editarUsuario(usuarioId) {
    try {
        console.log('Editando usuario:', usuarioId);

        // Obtener datos del usuario
        const response = await fetch(`/Usuarios/ObtenerUsuario/${usuarioId}`);

        if (!response.ok) {
            throw new Error('Error al obtener datos del usuario');
        }

        const usuario = await response.json();

        // Llenar el formulario
        document.getElementById('editUsuarioId').value = usuario.usuarioId;
        document.getElementById('editNombreUsuario').value = usuario.nombreUsuario;
        document.getElementById('editEmail').value = usuario.email;
        document.getElementById('editEsTopVendedor').checked = usuario.esTopVendedor;

        // Si hay roles, llenar el select de roles (esto puede requerir una llamada adicional o que los roles vengan en la respuesta principal)
        // Suponiendo que 'usuario.rolId' contiene el ID del rol actual
        const selectRol = document.getElementById('editRolId');
        if (selectRol) {
            selectRol.value = usuario.rolId;
        }


        // Mostrar modal
        if (modalEditarUsuario) {
            modalEditarUsuario.show();
        }

    } catch (error) {
        console.error('Error al cargar usuario:', error);
        mostrarMensaje('Error al cargar los datos del usuario', 'error');
    }
}

// Función para guardar los cambios del usuario
async function guardarEdicionUsuario() {
    const botonGuardar = document.querySelector('#modalEditarUsuario .btn-primary');
    if (!botonGuardar) return; // Salir si el botón no existe

    const normalState = botonGuardar.querySelector('.normal-state');
    const loadingState = botonGuardar.querySelector('.loading-state');

    try {
        // Mostrar estado de carga
        if (normalState) normalState.style.display = 'none';
        if (loadingState) loadingState.style.display = 'inline-flex';
        botonGuardar.disabled = true;

        const usuarioId = document.getElementById('editUsuarioId').value;
        const datosUsuario = {
            usuarioId: parseInt(usuarioId), // Asegurarse que sea un número
            nombreUsuario: document.getElementById('editNombreUsuario').value,
            email: document.getElementById('editEmail').value,
            rolId: parseInt(document.getElementById('editRolId').value), // Asegurarse que sea un número
            esTopVendedor: document.getElementById('editEsTopVendedor').checked
        };

        const response = await fetch(`/Usuarios/EditarUsuario/${usuarioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosUsuario)
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarMensaje(resultado.message || 'Usuario actualizado exitosamente', 'success');
            if (modalEditarUsuario) {
                modalEditarUsuario.hide();
            }
            // Recargar la página para mostrar los cambios
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            // Manejar errores de validación o del servidor
            let errorMessage = resultado.message || 'Error al actualizar usuario';
            if (resultado.errors) {
                // Si hay errores de validación, mostrarlos de forma más específica
                errorMessage = Object.values(resultado.errors).flat().join(' ');
            }
            mostrarMensaje(errorMessage, 'error');
        }

    } catch (error) {
        console.error('Error al guardar usuario:', error);
        mostrarMensaje('Error de red o del servidor al guardar los cambios', 'error');
    } finally {
        // Restaurar estado normal del botón
        if (normalState) normalState.style.display = 'inline-flex';
        if (loadingState) loadingState.style.display = 'none';
        botonGuardar.disabled = false;
    }
}

// Función auxiliar para mostrar mensajes (reemplaza toastr o Swal.fire para mensajes simples)
function mostrarMensaje(mensaje, tipo) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: tipo,
            title: tipo.charAt(0).toUpperCase() + tipo.slice(1), // Capitaliza el tipo (success, error, etc.)
            text: mensaje,
            timer: tipo === 'success' ? 1500 : null,
            confirmButtonColor: tipo === 'success' ? '#10b981' : '#dc3545'
        });
    } else if (typeof toastr !== 'undefined') {
        if (tipo === 'success') {
            toastr.success(mensaje);
        } else if (tipo === 'error') {
            toastr.error(mensaje);
        } else if (tipo === 'warning') {
            toastr.warning(mensaje);
        }
    } else {
        console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    }
}


// Función para mostrar errores de validación en el formulario de edición
function mostrarErroresEdicion(errores) {
    // Limpiar errores previos
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());

    for (const campo in errores) {
        const inputElement = document.querySelector(`#modalEditarUsuario input[name="${campo}"], #modalEditarUsuario select[name="${campo}"]`);
        if (inputElement) {
            inputElement.classList.add('is-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = errores[campo].join(' ');
            inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
        }
    }
}


// Función para aplicar filtros en móvil