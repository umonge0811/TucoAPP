// /wwwroot/js/views/inventario/programar-inventario.js

document.addEventListener('DOMContentLoaded', function () {
    // Referencias a los modales
    const modalAgregarUsuario = new bootstrap.Modal(document.getElementById('modalAgregarUsuario'));
    const modalIniciarInventario = new bootstrap.Modal(document.getElementById('modalIniciarInventario'));
    const modalCancelarInventario = new bootstrap.Modal(document.getElementById('modalCancelarInventario'));
    const modalCompletarInventario = new bootstrap.Modal(document.getElementById('modalCompletarInventario'));

    // Referencias a elementos del DOM para agregar usuarios
    const btnAgregarUsuario = document.getElementById('btnAgregarUsuario');
    const btnConfirmarAgregarUsuario = document.getElementById('btnConfirmarAgregarUsuario');
    const selectUsuario = document.getElementById('selectUsuario');
    const permisoConteo = document.getElementById('permisoConteo');
    const permisoAjuste = document.getElementById('permisoAjuste');
    const permisoValidacion = document.getElementById('permisoValidacion');
    const usuariosAsignados = document.getElementById('usuariosAsignados');
    const noUsuariosMsg = document.getElementById('noUsuariosMsg');

    // Referencias para acciones en inventarios
    const iniciarInventarioBtns = document.querySelectorAll('.iniciar-inventario-btn');
    const cancelarInventarioBtns = document.querySelectorAll('.cancelar-inventario-btn');
    const completarInventarioBtns = document.querySelectorAll('.completar-inventario-btn');
    const exportarInventarioBtns = document.querySelectorAll('.exportar-inventario-btn');

    let inventarioIdSeleccionado = 0;
    let contadorUsuarios = 0;

    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Abrir modal para agregar usuario
    if (btnAgregarUsuario) {
        btnAgregarUsuario.addEventListener('click', function () {
            // Resetear selecciones en el modal
            selectUsuario.value = '';
            permisoConteo.checked = true;
            permisoAjuste.checked = false;
            permisoValidacion.checked = false;

            modalAgregarUsuario.show();
        });
    }

    // Confirmar agregar usuario al inventario
    if (btnConfirmarAgregarUsuario) {
        btnConfirmarAgregarUsuario.addEventListener('click', function () {
            const usuarioId = selectUsuario.value;
            if (!usuarioId) {
                alert('Por favor seleccione un usuario');
                return;
            }

            // Verificar si el usuario ya está agregado
            const usuarioExistente = document.querySelector(`.usuario-asignado input.usuario-id-input[value="${usuarioId}"]`);
            if (usuarioExistente) {
                alert('Este usuario ya está asignado al inventario');
                return;
            }

            // Obtener nombre del usuario
            const nombreUsuario = selectUsuario.options[selectUsuario.selectedIndex].dataset.nombre;

            // Crear nuevo elemento de usuario asignado
            agregarUsuarioAsignado(
                usuarioId,
                nombreUsuario,
                permisoConteo.checked,
                permisoAjuste.checked,
                permisoValidacion.checked
            );

            modalAgregarUsuario.hide();
        });
    }

    // Función para agregar un usuario asignado al DOM
    function agregarUsuarioAsignado(usuarioId, nombreUsuario, tienePermisoConteo, tienePermisoAjuste, tienePermisoValidacion) {
        // Ocultar mensaje de "no hay usuarios"
        if (noUsuariosMsg) {
            noUsuariosMsg.style.display = 'none';
        }

        // Clonar la plantilla
        const template = document.getElementById('template-usuario-asignado');
        const nuevoUsuario = template.content.cloneNode(true);

        // Establecer datos en el elemento
        nuevoUsuario.querySelector('.usuario-nombre').textContent = nombreUsuario;

        // Mostrar/ocultar badges según permisos
        if (!tienePermisoConteo) {
            nuevoUsuario.querySelector('.badge-conteo').style.display = 'none';
        }
        if (tienePermisoAjuste) {
            nuevoUsuario.querySelector('.badge-ajuste').style.display = 'inline-block';
        }
        if (tienePermisoValidacion) {
            nuevoUsuario.querySelector('.badge-validacion').style.display = 'inline-block';
        }

        // Actualizar campos ocultos
        const indexActual = contadorUsuarios;
        nuevoUsuario.querySelector('.usuario-id-input').name = `NuevoInventario.UsuariosAsignados[${indexActual}].UsuarioId`;
        nuevoUsuario.querySelector('.usuario-id-input').value = usuarioId;

        nuevoUsuario.querySelector('.usuario-nombre-input').name = `NuevoInventario.UsuariosAsignados[${indexActual}].NombreUsuario`;
        nuevoUsuario.querySelector('.usuario-nombre-input').value = nombreUsuario;

        nuevoUsuario.querySelector('.permiso-conteo-input').name = `NuevoInventario.UsuariosAsignados[${indexActual}].PermisoConteo`;
        nuevoUsuario.querySelector('.permiso-conteo-input').value = tienePermisoConteo;

        nuevoUsuario.querySelector('.permiso-ajuste-input').name = `NuevoInventario.UsuariosAsignados[${indexActual}].PermisoAjuste`;
        nuevoUsuario.querySelector('.permiso-ajuste-input').value = tienePermisoAjuste;

        nuevoUsuario.querySelector('.permiso-validacion-input').name = `NuevoInventario.UsuariosAsignados[${indexActual}].PermisoValidacion`;
        nuevoUsuario.querySelector('.permiso-validacion-input').value = tienePermisoValidacion;

        // Configurar botón para eliminar usuario
        const btnEliminar = nuevoUsuario.querySelector('.btn-eliminar-usuario');
        btnEliminar.addEventListener('click', function () {
            const card = this.closest('.usuario-asignado');
            card.remove();

            // Mostrar mensaje de "no hay usuarios" si no quedan usuarios
            if (usuariosAsignados.querySelectorAll('.usuario-asignado').length === 0) {
                noUsuariosMsg.style.display = 'block';
            }

            // Reordenar índices (importante para que el formulario funcione correctamente)
            reordenarIndicesUsuarios();
        });

        // Agregar al contenedor
        usuariosAsignados.appendChild(nuevoUsuario);

        // Incrementar contador
        contadorUsuarios++;
    }

    // Función para reordenar los índices de los usuarios asignados (después de eliminar uno)
    function reordenarIndicesUsuarios() {
        const cards = usuariosAsignados.querySelectorAll('.usuario-asignado');

        cards.forEach((card, index) => {
            card.querySelector('.usuario-id-input').name = `NuevoInventario.UsuariosAsignados[${index}].UsuarioId`;
            card.querySelector('.usuario-nombre-input').name = `NuevoInventario.UsuariosAsignados[${index}].NombreUsuario`;
            card.querySelector('.permiso-conteo-input').name = `NuevoInventario.UsuariosAsignados[${index}].PermisoConteo`;
            card.querySelector('.permiso-ajuste-input').name = `NuevoInventario.UsuariosAsignados[${index}].PermisoAjuste`;
            card.querySelector('.permiso-validacion-input').name = `NuevoInventario.UsuariosAsignados[${index}].PermisoValidacion`;
        });
    }

    // Evento de submit del formulario
    const formNuevoInventario = document.getElementById('formNuevoInventario');
    if (formNuevoInventario) {
        console.log('Formulario encontrado:', formNuevoInventario);

        formNuevoInventario.addEventListener('submit', function (e) {
            e.preventDefault(); // IMPORTANTE: Prevenir el envío tradicional

            console.log('=== SUBMIT EJECUTADO ===');

            // Validaciones existentes (mantener tal como están)
            const fechaInicioInput = document.querySelector('input[name="NuevoInventario.FechaInicio"]');
            const fechaFinInput = document.querySelector('input[name="NuevoInventario.FechaFin"]');

            if (!fechaInicioInput || !fechaFinInput) {
                console.error('No se encontraron los campos de fecha');
                return;
            }

            const fechaInicio = new Date(fechaInicioInput.value);
            const fechaFin = new Date(fechaFinInput.value);

            // Validar fechas
            if (fechaFin < fechaInicio) {
                alert('La fecha de finalización no puede ser anterior a la fecha de inicio');
                resetSubmitButton();
                return;
            }

            // Validar que haya al menos un usuario asignado
            const usuariosCount = usuariosAsignados.querySelectorAll('.usuario-asignado').length;
            if (usuariosCount === 0) {
                alert('Debe asignar al menos un usuario al inventario');
                resetSubmitButton();
                return;
            }

            console.log('=== VALIDACIONES PASADAS ===');

            // ✅ CREAR OBJETO JSON CORREGIDO
            const inventarioData = {
                titulo: document.querySelector('input[name="NuevoInventario.Titulo"]')?.value || '',
                descripcion: document.querySelector('textarea[name="NuevoInventario.Descripcion"]')?.value || '',
                fechaInicio: fechaInicioInput.value,
                fechaFin: fechaFinInput.value,
                tipoInventario: document.querySelector('select[name="NuevoInventario.TipoInventario"]')?.value || 'Completo',
                ubicacionEspecifica: document.querySelector('select[name="NuevoInventario.UbicacionEspecifica"]')?.value || '', // ✅ CORREGIDO: Agregada coma
                incluirStockBajo: document.querySelector('input[name="NuevoInventario.IncluirStockBajo"]')?.checked || false, // ✅ CORREGIDO: Agregado ?. y ||
                usuarioCreadorId: parseInt(document.querySelector('input[name="NuevoInventario.UsuarioId"]')?.value || '1'),
                usuarioCreadorNombre: "Usuario Actual",
                asignacionesUsuarios: []
            };

            // ✅ CONSTRUIR ARRAY DE USUARIOS ASIGNADOS
            const usuariosCards = usuariosAsignados.querySelectorAll('.usuario-asignado');
            usuariosCards.forEach((card, index) => {
                const usuarioId = parseInt(card.querySelector('.usuario-id-input')?.value || '0');
                const nombreUsuario = card.querySelector('.usuario-nombre-input')?.value || '';

                // ✅ OBTENER EMAIL DEL USUARIO desde el select
                const selectUsuario = document.getElementById('selectUsuario');
                let emailUsuario = `usuario${usuarioId}@tuco.com`; // Fallback por defecto

                // Buscar el email en las opciones del select
                if (selectUsuario) {
                    Array.from(selectUsuario.options).forEach(option => {
                        if (option.value == usuarioId) {
                            emailUsuario = option.dataset.email || emailUsuario;
                        }
                    });
                }

                inventarioData.asignacionesUsuarios.push({
                    usuarioId: usuarioId,
                    nombreUsuario: nombreUsuario,
                    emailUsuario: emailUsuario,
                    permisoConteo: card.querySelector('.permiso-conteo-input')?.value === 'true',
                    permisoAjuste: card.querySelector('.permiso-ajuste-input')?.value === 'true',
                    permisoValidacion: card.querySelector('.permiso-validacion-input')?.value === 'true'
                });
            });

            // ✅ LOGGING PARA DEPURACIÓN
            console.log('=== DATOS QUE SE ENVÍAN AL SERVIDOR ===');
            console.log(JSON.stringify(inventarioData, null, 2));
            console.log('=== FIN DATOS ===');

            // Mostrar estado de carga
            const submitButton = document.getElementById('submitButton');
            if (submitButton) {
                submitButton.querySelector('.normal-state').style.display = 'none';
                submitButton.querySelector('.loading-state').style.display = 'inline-block';
                submitButton.disabled = true;
            }

            // ✅ ENVIAR COMO JSON
            fetch('/Inventario/ProgramarInventarioJson', {  // ← NUEVA URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value || ''
                },
                body: JSON.stringify(inventarioData)
            })
                .then(async response => {
                    console.log(`Respuesta: status=${response.status}, ok=${response.ok}`);

                    if (!response.ok) {
                        const text = await response.text();
                        console.log('Contenido de error:', text);
                        throw new Error(`Error ${response.status}: ${text}`);
                    }

                    // Intentar parsear JSON
                    let result;
                    try {
                        const text = await response.text();
                        result = JSON.parse(text);
                        console.log('Respuesta exitosa:', result);
                    } catch {
                        console.log('Respuesta no es JSON, pero fue exitosa');
                        result = { success: true, message: 'Inventario programado exitosamente' };
                    }

                    showToast('Éxito', result.message || 'Inventario programado exitosamente', 'success');

                    // Recargar la página después de un momento
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                })
                .catch(error => {
                    console.error('Error:', error);
                    resetSubmitButton();
                    showToast('Error', 'Error al programar el inventario: ' + error.message, 'danger');
                });
        });
    }

    // ✅ FUNCIÓN PARA RESETEAR EL BOTÓN
    function resetSubmitButton() {
        const submitButton = document.getElementById('submitButton');
        if (submitButton) {
            submitButton.querySelector('.normal-state').style.display = 'inline-block';
            submitButton.querySelector('.loading-state').style.display = 'none';
            submitButton.disabled = false;
        }
    }
    // Configurar botones de iniciar inventario
    iniciarInventarioBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            inventarioIdSeleccionado = this.dataset.id;
            modalIniciarInventario.show();
        });
    });

    // Configurar botones de cancelar inventario
    cancelarInventarioBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            inventarioIdSeleccionado = this.dataset.id;
            modalCancelarInventario.show();
        });
    });

    // Configurar botones de completar inventario
    completarInventarioBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            inventarioIdSeleccionado = this.dataset.id;
            modalCompletarInventario.show();
        });
    });

    // Configurar botones de exportar resultados
    exportarInventarioBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            // Mostrar menú contextual para seleccionar formato
            const menu = document.createElement('div');
            menu.className = 'dropdown-menu show export-menu';
            menu.style.position = 'absolute';
            menu.style.top = (this.offsetTop + this.offsetHeight) + 'px';
            menu.style.left = this.offsetLeft + 'px';

            menu.innerHTML = `
                <a class="dropdown-item" href="/Inventario/ExportarResultadosInventario/${id}?formato=excel">
                    <i class="bi bi-file-earmark-excel me-2"></i>Exportar a Excel
                </a>
                <a class="dropdown-item" href="/Inventario/ExportarResultadosInventario/${id}?formato=pdf">
                    <i class="bi bi-file-earmark-pdf me-2"></i>Exportar a PDF
                </a>
            `;

            document.body.appendChild(menu);

            // Cerrar el menú cuando se hace clic fuera
            document.addEventListener('click', function closeMenu() {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }, { once: true });

            // Evitar que el clic en el menú cierre el menú
            menu.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        });
    });

    // Evento para confirmar inicio de inventario
    const btnConfirmarIniciar = document.getElementById('btnConfirmarIniciar');
    if (btnConfirmarIniciar) {
        btnConfirmarIniciar.addEventListener('click', function () {
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando...';

            // Enviar solicitud AJAX
            fetch(`/Inventario/IniciarInventario/${inventarioIdSeleccionado}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
                }
            })
                .then(response => response.json())
                .then(data => {
                    modalIniciarInventario.hide();

                    if (data.success) {
                        // Mostrar mensaje de éxito y recargar la página
                        showToast('Éxito', data.message, 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        // Mostrar mensaje de error
                        showToast('Error', data.message, 'danger');
                        this.disabled = false;
                        this.innerHTML = 'Iniciar Inventario';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Error', 'Ocurrió un error al procesar la solicitud', 'danger');
                    this.disabled = false;
                    this.innerHTML = 'Iniciar Inventario';
                    modalIniciarInventario.hide();
                });
        });
    }

    // Evento para confirmar cancelación de inventario
    const btnConfirmarCancelar = document.getElementById('btnConfirmarCancelar');
    if (btnConfirmarCancelar) {
        btnConfirmarCancelar.addEventListener('click', function () {
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cancelando...';

            // Enviar solicitud AJAX
            fetch(`/Inventario/CancelarInventario/${inventarioIdSeleccionado}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
                }
            })
                .then(response => response.json())
                .then(data => {
                    modalCancelarInventario.hide();

                    if (data.success) {
                        // Mostrar mensaje de éxito y recargar la página
                        showToast('Éxito', data.message, 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        // Mostrar mensaje de error
                        showToast('Error', data.message, 'danger');
                        this.disabled = false;
                        this.innerHTML = 'Sí, cancelar inventario';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Error', 'Ocurrió un error al procesar la solicitud', 'danger');
                    this.disabled = false;
                    this.innerHTML = 'Sí, cancelar inventario';
                    modalCancelarInventario.hide();
                });
        });
    }

    // Evento para confirmar completar inventario
    const btnConfirmarCompletar = document.getElementById('btnConfirmarCompletar');
    if (btnConfirmarCompletar) {
        btnConfirmarCompletar.addEventListener('click', function () {
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Completando...';

            // Enviar solicitud AJAX
            fetch(`/Inventario/CompletarInventario/${inventarioIdSeleccionado}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
                }
            })
                .then(response => response.json())
                .then(data => {
                    modalCompletarInventario.hide();

                    if (data.success) {
                        // Mostrar mensaje de éxito y recargar la página
                        showToast('Éxito', data.message, 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        // Mostrar mensaje de error
                        showToast('Error', data.message, 'danger');
                        this.disabled = false;
                        this.innerHTML = 'Completar Inventario';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Error', 'Ocurrió un error al procesar la solicitud', 'danger');
                    this.disabled = false;
                    this.innerHTML = 'Completar Inventario';
                    modalCompletarInventario.hide();
                });
        });
    }

    // Función para mostrar toast (notificación)
    function showToast(title, message, type) {
        // Verificar si ya existe un contenedor de toasts
        let toastContainer = document.querySelector('.toast-container');

        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }

        // Crear un nuevo toast
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        // Contenido del toast
        toast.innerHTML = `
           <div class="d-flex">
               <div class="toast-body">
                   <strong>${title}</strong>: ${message}
               </div>
               <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
           </div>
       `;

        // Agregar el toast al contenedor
        toastContainer.appendChild(toast);

        // Inicializar y mostrar el toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });

        bsToast.show();

        // Eliminar el toast del DOM después de que se oculte
        toast.addEventListener('hidden.bs.toast', function () {
            this.remove();
        });
    }

    // Validación para fechas
    const fechaInicio = document.getElementById('NuevoInventario_FechaInicio');
    const fechaFin = document.getElementById('NuevoInventario_FechaFin');

    if (fechaInicio && fechaFin) {
        // Establecer la fecha mínima para inicio (hoy)
        const today = new Date().toISOString().split('T')[0];
        fechaInicio.min = today;

        // Actualizar fecha mínima para fin cuando cambia inicio
        fechaInicio.addEventListener('change', function () {
            fechaFin.min = fechaInicio.value;

            // Si la fecha de fin es anterior a la de inicio, actualizarla
            if (fechaFin.value && fechaFin.value < fechaInicio.value) {
                fechaFin.value = fechaInicio.value;
            }
        });
    }
});