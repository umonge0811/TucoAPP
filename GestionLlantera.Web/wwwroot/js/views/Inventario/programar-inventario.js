/**
 * Script para la gestión de programación de inventarios
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log('Script de programación de inventario cargado');

    // Referencias a elementos del DOM
    const formNuevoInventario = document.getElementById('formNuevoInventario');
    const btnAgregarUsuario = document.getElementById('btnAgregarUsuario');
    const modalAgregarUsuario = document.getElementById('modalAgregarUsuario');
    const selectUsuario = document.getElementById('selectUsuario');
    const permisoConteo = document.getElementById('permisoConteo');
    const permisoAjuste = document.getElementById('permisoAjuste');
    const permisoValidacion = document.getElementById('permisoValidacion');
    const btnConfirmarAgregarUsuario = document.getElementById('btnConfirmarAgregarUsuario');
    const usuariosAsignados = document.getElementById('usuariosAsignados');
    const noUsuariosMsg = document.getElementById('noUsuariosMsg');
    const submitButton = document.getElementById('submitButton');

    // Modales de confirmación
    const modalIniciarInventario = document.getElementById('modalIniciarInventario');
    const modalCancelarInventario = document.getElementById('modalCancelarInventario');
    const modalCompletarInventario = document.getElementById('modalCompletarInventario');
    const btnConfirmarIniciar = document.getElementById('btnConfirmarIniciar');
    const btnConfirmarCancelar = document.getElementById('btnConfirmarCancelar');
    const btnConfirmarCompletar = document.getElementById('btnConfirmarCompletar');

    // Variables para el manejo de datos
    let usuariosAgregados = [];
    let idInventarioActual = null;

    // Mostrar el modal para agregar usuario
    if (btnAgregarUsuario) {
        btnAgregarUsuario.addEventListener('click', function () {
            // Limpiar selecciones previas
            selectUsuario.value = '';
            permisoConteo.checked = true;
            permisoAjuste.checked = false;
            permisoValidacion.checked = false;

            // Mostrar el modal
            const modal = new bootstrap.Modal(modalAgregarUsuario);
            modal.show();
        });
    }

    // Manejar la confirmación de agregar usuario
    if (btnConfirmarAgregarUsuario) {
        btnConfirmarAgregarUsuario.addEventListener('click', function () {
            const usuarioId = selectUsuario.value;
            const nombreUsuario = selectUsuario.options[selectUsuario.selectedIndex].getAttribute('data-nombre');

            if (!usuarioId) {
                mostrarNotificacion('Por favor, seleccione un usuario', 'warning');
                return;
            }

            // Verificar si el usuario ya está agregado
            if (usuariosAgregados.includes(parseInt(usuarioId))) {
                mostrarNotificacion('Este usuario ya está asignado al inventario', 'warning');
                return;
            }

            // Agregar a la lista de usuarios
            agregarUsuarioAlFormulario(
                usuarioId,
                nombreUsuario,
                permisoConteo.checked,
                permisoAjuste.checked,
                permisoValidacion.checked
            );

            // Cerrar el modal
            bootstrap.Modal.getInstance(modalAgregarUsuario).hide();

            // Mostrar notificación
            mostrarNotificacion(`Usuario ${nombreUsuario} agregado al inventario`, 'success');
        });
    }

    // Función para agregar un usuario al formulario
    function agregarUsuarioAlFormulario(usuarioId, nombreUsuario, tienePermisoConteo, tienePermisoAjuste, tienePermisoValidacion) {
        // Ocultar el mensaje de "no hay usuarios"
        if (noUsuariosMsg) {
            noUsuariosMsg.style.display = 'none';
        }

        // Agregar a la lista de usuarios agregados
        usuariosAgregados.push(parseInt(usuarioId));

        // Obtener la plantilla y clonarla
        const template = document.getElementById('template-usuario-asignado');
        const nuevoUsuario = document.importNode(template.content, true).querySelector('.usuario-asignado');

        // Asignar los valores
        nuevoUsuario.querySelector('.usuario-nombre').textContent = nombreUsuario;

        // Mostrar u ocultar las insignias de permisos
        nuevoUsuario.querySelector('.badge-conteo').style.display = tienePermisoConteo ? 'inline-flex' : 'none';
        nuevoUsuario.querySelector('.badge-ajuste').style.display = tienePermisoAjuste ? 'inline-flex' : 'none';
        nuevoUsuario.querySelector('.badge-validacion').style.display = tienePermisoValidacion ? 'inline-flex' : 'none';

        // Configurar valores de los campos ocultos
        const indice = usuariosAgregados.length - 1;
        const usuarioIdInput = nuevoUsuario.querySelector('.usuario-id-input');
        const usuarioNombreInput = nuevoUsuario.querySelector('.usuario-nombre-input');
        const permisoConteoInput = nuevoUsuario.querySelector('.permiso-conteo-input');
        const permisoAjusteInput = nuevoUsuario.querySelector('.permiso-ajuste-input');
        const permisoValidacionInput = nuevoUsuario.querySelector('.permiso-validacion-input');

        usuarioIdInput.value = usuarioId;
        usuarioIdInput.name = `NuevoInventario.UsuariosAsignados[${indice}].UsuarioId`;

        usuarioNombreInput.value = nombreUsuario;
        usuarioNombreInput.name = `NuevoInventario.UsuariosAsignados[${indice}].NombreUsuario`;

        permisoConteoInput.value = tienePermisoConteo;
        permisoConteoInput.name = `NuevoInventario.UsuariosAsignados[${indice}].PermisoConteo`;

        permisoAjusteInput.value = tienePermisoAjuste;
        permisoAjusteInput.name = `NuevoInventario.UsuariosAsignados[${indice}].PermisoAjuste`;

        permisoValidacionInput.value = tienePermisoValidacion;
        permisoValidacionInput.name = `NuevoInventario.UsuariosAsignados[${indice}].PermisoValidacion`;

        // Configurar botón de eliminar
        const btnEliminar = nuevoUsuario.querySelector('.btn-eliminar-usuario');
        btnEliminar.addEventListener('click', function () {
            eliminarUsuario(nuevoUsuario, usuarioId);
        });

        // Agregar al DOM
        usuariosAsignados.appendChild(nuevoUsuario);
    }

    // Función para eliminar un usuario del formulario
    function eliminarUsuario(elementoUsuario, usuarioId) {
        // Eliminar del DOM
        elementoUsuario.remove();

        // Eliminar de la lista de usuarios agregados
        const index = usuariosAgregados.indexOf(parseInt(usuarioId));
        if (index !== -1) {
            usuariosAgregados.splice(index, 1);
        }

        // Actualizar los índices de los elementos restantes
        const usuariosRestantes = usuariosAsignados.querySelectorAll('.usuario-asignado');
        usuariosRestantes.forEach((usuario, nuevoIndice) => {
            // Actualizar los nombres de los campos
            actualizarIndicesCampos(usuario, nuevoIndice);
        });

        // Mostrar el mensaje de "no hay usuarios" si no quedan usuarios
        if (usuariosAgregados.length === 0 && noUsuariosMsg) {
            noUsuariosMsg.style.display = 'block';
        }

        // Mostrar notificación
        mostrarNotificacion('Usuario eliminado del inventario', 'info');
    }

    // Función para actualizar los índices de los campos de un usuario
    function actualizarIndicesCampos(elementoUsuario, nuevoIndice) {
        const usuarioIdInput = elementoUsuario.querySelector('.usuario-id-input');
        const usuarioNombreInput = elementoUsuario.querySelector('.usuario-nombre-input');
        const permisoConteoInput = elementoUsuario.querySelector('.permiso-conteo-input');
        const permisoAjusteInput = elementoUsuario.querySelector('.permiso-ajuste-input');
        const permisoValidacionInput = elementoUsuario.querySelector('.permiso-validacion-input');

        usuarioIdInput.name = `NuevoInventario.UsuariosAsignados[${nuevoIndice}].UsuarioId`;
        usuarioNombreInput.name = `NuevoInventario.UsuariosAsignados[${nuevoIndice}].NombreUsuario`;
        permisoConteoInput.name = `NuevoInventario.UsuariosAsignados[${nuevoIndice}].PermisoConteo`;
        permisoAjusteInput.name = `NuevoInventario.UsuariosAsignados[${nuevoIndice}].PermisoAjuste`;
        permisoValidacionInput.name = `NuevoInventario.UsuariosAsignados[${nuevoIndice}].PermisoValidacion`;
    }

    // Validación del formulario antes de enviar
    if (formNuevoInventario) {
        formNuevoInventario.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validar que haya al menos un usuario asignado
            if (usuariosAgregados.length === 0) {
                mostrarNotificacion('Debe asignar al menos un usuario al inventario', 'warning');
                return;
            }

            // Validar las fechas
            const fechaInicio = new Date(document.getElementById('NuevoInventario_FechaInicio').value);
            const fechaFin = new Date(document.getElementById('NuevoInventario_FechaFin').value);

            if (fechaInicio > fechaFin) {
                mostrarNotificacion('La fecha de inicio no puede ser posterior a la fecha de fin', 'warning');
                return;
            }

            // Cambiar estado del botón
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.querySelector('.normal-state').style.display = 'none';
                submitButton.querySelector('.loading-state').style.display = 'block';
            }

            // Enviar el formulario
            this.submit();
        });
    }

    // Manejar eventos de botones para inventarios programados
    document.querySelectorAll('.iniciar-inventario-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            idInventarioActual = this.getAttribute('data-id');
            const modal = new bootstrap.Modal(modalIniciarInventario);
            modal.show();
        });
    });

    document.querySelectorAll('.cancelar-inventario-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            idInventarioActual = this.getAttribute('data-id');
            const modal = new bootstrap.Modal(modalCancelarInventario);
            modal.show();
        });
    });

    document.querySelectorAll('.completar-inventario-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            idInventarioActual = this.getAttribute('data-id');
            const modal = new bootstrap.Modal(modalCompletarInventario);
            modal.show();
        });
    });

    document.querySelectorAll('.exportar-inventario-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const inventarioId = this.getAttribute('data-id');
            window.location.href = `/Inventario/ExportarResultadosInventario/${inventarioId}`;
        });
    });

    // Manejar confirmaciones de modales
    if (btnConfirmarIniciar) {
        btnConfirmarIniciar.addEventListener('click', function () {
            if (!idInventarioActual) return;

            // Hacer la petición AJAX para iniciar el inventario
            fetch(`/Inventario/IniciarInventario/${idInventarioActual}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        mostrarNotificacion('Inventario iniciado correctamente', 'success');
                        // Recargar la página para ver los cambios
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        mostrarNotificacion(`Error: ${data.message}`, 'error');
                    }

                    // Cerrar el modal
                    bootstrap.Modal.getInstance(modalIniciarInventario).hide();
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al iniciar el inventario', 'error');
                    bootstrap.Modal.getInstance(modalIniciarInventario).hide();
                });
        });
    }

    if (btnConfirmarCancelar) {
        btnConfirmarCancelar.addEventListener('click', function () {
            if (!idInventarioActual) return;

            // Hacer la petición AJAX para cancelar el inventario
            fetch(`/Inventario/CancelarInventario/${idInventarioActual}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        mostrarNotificacion('Inventario cancelado correctamente', 'success');
                        // Recargar la página para ver los cambios
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        mostrarNotificacion(`Error: ${data.message}`, 'error');
                    }

                    // Cerrar el modal
                    bootstrap.Modal.getInstance(modalCancelarInventario).hide();
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al cancelar el inventario', 'error');
                    bootstrap.Modal.getInstance(modalCancelarInventario).hide();
                });
        });
    }

    if (btnConfirmarCompletar) {
        btnConfirmarCompletar.addEventListener('click', function () {
            if (!idInventarioActual) return;

            // Hacer la petición AJAX para completar el inventario
            fetch(`/Inventario/CompletarInventario/${idInventarioActual}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        mostrarNotificacion('Inventario completado correctamente', 'success');
                        // Recargar la página para ver los cambios
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        mostrarNotificacion(`Error: ${data.message}`, 'error');
                    }

                    // Cerrar el modal
                    bootstrap.Modal.getInstance(modalCompletarInventario).hide();
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al completar el inventario', 'error');
                    bootstrap.Modal.getInstance(modalCompletarInventario).hide();
                });
        });
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo) {
        // Si existe toastr (librería de notificaciones), usarlo
        if (typeof toastr !== 'undefined') {
            toastr[tipo](mensaje);
        } else {
            // Si no, usar alert básico
            alert(mensaje);
        }
    }

    // Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});