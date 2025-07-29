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
    const permisoCompletar = document.getElementById('permisoCompletar');
    const usuariosAsignados = document.getElementById('usuariosAsignados');
    const noUsuariosMsg = document.getElementById('noUsuariosMsg');

    // Referencias para acciones en inventarios
    const iniciarInventarioBtns = document.querySelectorAll('.iniciar-inventario-btn');
    const cancelarInventarioBtns = document.querySelectorAll('.cancelar-inventario-btn');
    const completarInventarioBtns = document.querySelectorAll('.completar-inventario-btn');
    const exportarInventarioBtns = document.querySelectorAll('.exportar-inventario-btn');

    let inventarioIdSeleccionado = 0;
    let contadorUsuarios = 0;

    // Inicializar tooltips de Bootstrap (solo en dispositivos no táctiles)
    function initializeTooltips() {
        // Detectar si es un dispositivo táctil
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (!isTouchDevice) {
            // Solo inicializar tooltips en dispositivos de escritorio
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        } else {
            // En dispositivos móviles, remover el atributo data-bs-toggle
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                el.removeAttribute('data-bs-toggle');
                el.removeAttribute('title');
            });
        }
    }

    // Llamar la función
    initializeTooltips();
    // Abrir modal para agregar usuario
    if (btnAgregarUsuario) {
        btnAgregarUsuario.addEventListener('click', function () {
            // Resetear selecciones en el modal
            selectUsuario.value = '';
            permisoConteo.checked = true;
            permisoAjuste.checked = false;
            permisoValidacion.checked = false;
            permisoCompletar.checked = false;
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
                permisoValidacion.checked,
                permisoCompletar.checked
            );

            modalAgregarUsuario.hide();
        });
    }

    // Función para agregar un usuario asignado al DOM
    function agregarUsuarioAsignado(usuarioId, nombreUsuario, tienePermisoConteo, tienePermisoAjuste, tienePermisoValidacion, tienePermisoCompletar) {
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
        if (tienePermisoCompletar) {
            nuevoUsuario.querySelector('.badge-completar').style.display = 'inline-block';
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

        nuevoUsuario.querySelector('.permiso-completar-input').name = `NuevoInventario.UsuariosAsignados[${indexActual}].PermisoCompletar`;
        nuevoUsuario.querySelector('.permiso-completar-input').value = tienePermisoCompletar;

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
            card.querySelector('.permiso-completar-input').name = `NuevoInventario.UsuariosAsignados[${index}].PermisoCompletar`;
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
                    permisoValidacion: card.querySelector('.permiso-validacion-input')?.value === 'true',
                    permisoCompletar: card.querySelector('.permiso-completar-input')?.value === 'true'
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

    // Función para mostrar toast (notificación) - Versión móvil mejorada
    function showToast(title, message, type) {
        // Verificar si ya existe un contenedor de toasts
        let toastContainer = document.querySelector('.toast-container');

        if (!toastContainer) {
            toastContainer = document.createElement('div');
            // Posición diferente según el tamaño de pantalla
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
                toastContainer.style.zIndex = '9999';
            } else {
                toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            }
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

        // Contenido del toast adaptado para móviles
        const isMobile = window.innerWidth <= 768;
        const toastContent = isMobile ?
            `<div class="d-flex">
            <div class="toast-body text-center w-100">
                <div><strong>${title}</strong></div>
                <div class="small">${message}</div>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>` :
            `<div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;

        toast.innerHTML = toastContent;

        // Agregar el toast al contenedor
        toastContainer.appendChild(toast);

        // Inicializar y mostrar el toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: isMobile ? 4000 : 5000 // Menos tiempo en móviles
        });

        bsToast.show();

        // Eliminar el toast del DOM después de que se oculte
        toast.addEventListener('hidden.bs.toast', function () {
            this.remove();
            // Si no hay más toasts, eliminar el contenedor
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
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
    // Función para mejorar la experiencia en móviles
    function optimizeForMobile() {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mejorar scrolling en modales
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('shown.bs.modal', function () {
                    // Prevenir scroll del body cuando modal está abierto
                    document.body.style.overflow = 'hidden';
                });

                modal.addEventListener('hidden.bs.modal', function () {
                    // Restaurar scroll del body
                    document.body.style.overflow = '';
                });
            });

            // Mejorar experiencia de botones en cards móviles
            document.querySelectorAll('.inventario-card-mobile .btn').forEach(btn => {
                btn.addEventListener('touchstart', function () {
                    this.style.transform = 'scale(0.95)';
                    this.style.transition = 'transform 0.1s ease';
                });

                btn.addEventListener('touchend', function () {
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 100);
                });
            });

            // Agregar haptic feedback si está disponible
            if (navigator.vibrate) {
                document.querySelectorAll('.btn-success, .btn-danger').forEach(btn => {
                    btn.addEventListener('click', function () {
                        navigator.vibrate(50); // Vibración suave
                    });
                });
            }

            // Mejorar experiencia de botones en general
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('touchstart', function (e) {
                    // Agregar clase para feedback visual
                    this.classList.add('btn-pressed');
                });

                btn.addEventListener('touchend', function (e) {
                    // Remover clase después de un momento
                    setTimeout(() => {
                        this.classList.remove('btn-pressed');
                    }, 150);
                });
            });
        }
    }

    // Función para manejar cambios de orientación
    function handleOrientationChange() {
        setTimeout(() => {
            // Reinicializar tooltips si es necesario
            initializeTooltips();

            // Optimizar para la nueva orientación
            optimizeForMobile();

            // Ajustar altura de modales si están abiertos
            document.querySelectorAll('.modal.show').forEach(modal => {
                const modalDialog = modal.querySelector('.modal-dialog');
                if (modalDialog) {
                    modalDialog.style.maxHeight = (window.innerHeight - 20) + 'px';
                }
            });

            // Reposicionar toasts si los hay
            const toastContainer = document.querySelector('.toast-container');
            if (toastContainer) {
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
                    toastContainer.style.zIndex = '9999';
                } else {
                    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                }
            }
        }, 100);
    }

    // Event listeners para optimización móvil
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Ejecutar optimización inicial
    optimizeForMobile();

    // Prevenir zoom en inputs en iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('focus', function () {
                this.style.fontSize = '16px';
            });

            element.addEventListener('blur', function () {
                this.style.fontSize = '';
            });
        });
    }

    // Mejorar experiencia de swipe en cards móviles (opcional)
    let startX = 0;
    let startY = 0;

    document.querySelectorAll('.inventario-card-mobile').forEach(card => {
        card.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        card.addEventListener('touchmove', function (e) {
            if (!startX || !startY) {
                return;
            }

            let diffX = startX - e.touches[0].clientX;
            let diffY = startY - e.touches[0].clientY;

            // Si el swipe es más horizontal que vertical
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 50) { // Threshold de 50px
                    // Agregar efecto visual de swipe
                    this.style.transform = `translateX(${-diffX / 10}px)`;
                    this.style.transition = 'transform 0.2s ease';
                }
            }
        });

        card.addEventListener('touchend', function (e) {
            // Restaurar posición
            this.style.transform = '';
            startX = 0;
            startY = 0;
        });
    });

    // Función para optimizar layout de botones dinámicamente
    function optimizeButtonLayout() {
        document.querySelectorAll('.botones-accion-secundarios').forEach(container => {
            const buttons = container.querySelectorAll('.btn');
            const buttonCount = buttons.length;

            // Remover clases existentes
            container.classList.remove('un-boton', 'dos-botones', 'tres-botones');

            // Agregar clase según cantidad de botones
            if (buttonCount === 1) {
                container.classList.add('un-boton');
            } else if (buttonCount === 2) {
                container.classList.add('dos-botones');
            } else if (buttonCount >= 3) {
                container.classList.add('tres-botones');
            }
        });
    }

    // Ejecutar al cargar la página
    optimizeButtonLayout();

    // ========================================
    // JAVASCRIPT MEJORADO PARA INICIAR INVENTARIOS
    // Ubicación: Agregar al final de programar-inventario.js
    // ========================================

    /**
     * 🚀 FUNCIÓN MEJORADA PARA INICIAR INVENTARIOS
     * 
     * FUNCIONA EN:
     * - ProgramarInventario.cshtml (lista de inventarios)
     * - DetalleInventarioProgramado.cshtml (vista de detalle)
     * 
     * FLUJO:
     * 1. Usuario hace clic en "Iniciar Inventario"
     * 2. Se confirma la acción con modal
     * 3. Se inicia el inventario vía API
     * 4. Se redirige automáticamente a la toma de inventario
     */

    // Función para configurar botones de iniciar inventario (mejorada)
    function configurarBotonesIniciarInventario() {
        console.log('🔧 Configurando botones de iniciar inventario...');

        // Encontrar todos los botones de iniciar inventario
        const iniciarInventarioBtns = document.querySelectorAll('.iniciar-inventario-btn');

        console.log(`📋 Se encontraron ${iniciarInventarioBtns.length} botones de iniciar inventario`);

        iniciarInventarioBtns.forEach((btn, index) => {
            console.log(`🔘 Configurando botón ${index + 1}:`, btn);

            // Remover eventos anteriores para evitar duplicados
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            // Agregar evento click
            newBtn.addEventListener('click', function () {
                const inventarioId = this.dataset.id;
                console.log(`🚀 Iniciando inventario ID: ${inventarioId}`);

                if (!inventarioId) {
                    console.error('❌ No se encontró ID del inventario');
                    mostrarToast('Error', 'No se pudo identificar el inventario', 'danger');
                    return;
                }

                iniciarInventarioConConfirmacion(inventarioId);
            });
        });
    }

    // Función principal para iniciar inventario con confirmación usando SweetAlert2
    function iniciarInventarioConConfirmacion(inventarioId) {
        console.log(`🎯 Iniciando proceso para inventario ${inventarioId}`);

        // Mostrar SweetAlert2 de confirmación
        Swal.fire({
            title: '<i class="bi bi-play-circle me-2"></i>Iniciar Inventario',
            html: `
                <div class="text-start">
                    <div class="alert alert-info mb-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>¿Está seguro de que desea iniciar este inventario?</strong>
                    </div>
                    <p class="mb-2">Al iniciar el inventario:</p>
                    <ul class="text-start">
                        <li>Se notificará por correo electrónico a todos los usuarios asignados</li>
                        <li>Los usuarios podrán comenzar inmediatamente con el conteo físico</li>
                        <li>El estado del inventario cambiará a "En Progreso"</li>
                        <li>Se abrirá automáticamente la interfaz de toma de inventario</li>
                    </ul>
                    
                    <div class="form-check mt-3">
                        <input class="form-check-input" type="checkbox" id="abrirTomaAutomatica" checked>
                        <label class="form-check-label" for="abrirTomaAutomatica">
                            <i class="bi bi-tablet me-1"></i>
                            Abrir interfaz de toma de inventario automáticamente
                        </label>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-play-fill me-2"></i>Iniciar Inventario',
            cancelButtonText: '<i class="bi bi-x-lg me-1"></i>Cancelar',
            width: '600px',
            customClass: {
                popup: 'swal-inventario-popup',
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-secondary'
            },
            showLoaderOnConfirm: true,
            preConfirm: () => {
                const abrirTomaAutomatica = document.getElementById('abrirTomaAutomatica').checked;
                return ejecutarInicioInventarioSwal(inventarioId, abrirTomaAutomatica);
            },
            allowOutsideClick: () => !Swal.isLoading()
        });
    }

    // Crear modal de confirmación dinámicamente
    function crearModalIniciarInventario() {
        console.log('🏗️ Creando modal de confirmación...');

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'modalIniciarInventarioDinamico';
        modal.tabIndex = -1;
        modal.setAttribute('aria-labelledby', 'modalIniciarInventarioLabel');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalIniciarInventarioLabel">
                        <i class="bi bi-play-circle me-2"></i>
                        Iniciar Inventario
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>¿Está seguro de que desea iniciar este inventario?</strong>
                    </div>
                    <p>Al iniciar el inventario:</p>
                    <ul>
                        <li>Se notificará por correo electrónico a todos los usuarios asignados</li>
                        <li>Los usuarios podrán comenzar inmediatamente con el conteo físico</li>
                        <li>El estado del inventario cambiará a "En Progreso"</li>
                        <li>Se abrirá automáticamente la interfaz de toma de inventario</li>
                    </ul>
                    
                    <div class="form-check mt-3">
                        <input class="form-check-input" type="checkbox" id="abrirTomaAutomatica" checked>
                        <label class="form-check-label" for="abrirTomaAutomatica">
                            <i class="bi bi-tablet me-1"></i>
                            Abrir interfaz de toma de inventario automáticamente
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="bi bi-x-lg me-1"></i>
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-success" id="btnConfirmarIniciarDinamico">
                        <span class="normal-state">
                            <i class="bi bi-play-fill me-2"></i>
                            Iniciar Inventario
                        </span>
                        <span class="loading-state" style="display: none;">
                            <span class="spinner-border spinner-border-sm me-2"></span>
                            Iniciando...
                        </span>
                    </button>
                </div>
            </div>
        </div>
    `;

        return modal;
    }

    // Configurar el modal para un inventario específico
    function configurarModalIniciarInventario(modal, inventarioId) {
        const btnConfirmar = modal.querySelector('#btnConfirmarIniciarDinamico');

        // Remover eventos anteriores
        const newBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);

        // Agregar evento para este inventario específico
        newBtn.addEventListener('click', function () {
            ejecutarInicioInventario(inventarioId, modal);
        });
    }

    // Función que ejecuta el inicio de inventario con SweetAlert2
    async function ejecutarInicioInventarioSwal(inventarioId, abrirTomaAutomatica) {
        console.log(`⚡ Ejecutando inicio de inventario ${inventarioId} con SweetAlert2`);

        try {
            console.log('📡 Enviando petición para iniciar inventario...');

            // Obtener token CSRF
            const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';

            // Decidir qué endpoint usar según dónde estemos
            let endpoint;

            // Verificar si tenemos TomaInventarioController disponible
            if (typeof window.tomaInventarioManager !== 'undefined') {
                // Estamos en la vista de toma de inventario
                endpoint = `/TomaInventario/IniciarInventario/${inventarioId}`;
            } else {
                // Estamos en las vistas de gestión de inventarios
                endpoint = `/Inventario/IniciarInventario/${inventarioId}`;
            }

            console.log(`🎯 Usando endpoint: ${endpoint}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                }
            });

            console.log(`📡 Respuesta recibida: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en respuesta:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Resultado:', result);

            if (result.success) {
                // Mostrar mensaje de éxito con SweetAlert2
                await Swal.fire({
                    icon: 'success',
                    title: '¡Inventario Iniciado!',
                    text: result.message || 'Inventario iniciado exitosamente',
                    confirmButtonColor: '#198754',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Vibración en dispositivos móviles
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }

                // Determinar próximo paso
                if (abrirTomaAutomatica) {
                    console.log('🚀 Redirigiendo a toma de inventario...');
                    window.location.href = `/TomaInventario/Ejecutar/${inventarioId}`;
                } else {
                    console.log('🔄 Recargando página actual...');
                    window.location.reload();
                }

            } else {
                throw new Error(result.message || 'Error desconocido al iniciar inventario');
            }

        } catch (error) {
            console.error('💥 Error al iniciar inventario:', error);

            // Mostrar error con SweetAlert2
            Swal.fire({
                icon: 'error',
                title: 'Error al Iniciar Inventario',
                text: error.message,
                confirmButtonColor: '#dc3545'
            });

            throw error; // Re-lanzar para que SweetAlert2 maneje el estado de loading
        }
    }

    // Función que ejecuta el inicio de inventario (versión original para compatibilidad)
    async function ejecutarInicioInventario(inventarioId, modal) {
        console.log(`⚡ Ejecutando inicio de inventario ${inventarioId}`);

        const btnConfirmar = modal.querySelector('#btnConfirmarIniciarDinamico');
        const abrirTomaAutomatica = modal.querySelector('#abrirTomaAutomatica').checked;

        try {
            // Mostrar estado de carga
            btnConfirmar.querySelector('.normal-state').style.display = 'none';
            btnConfirmar.querySelector('.loading-state').style.display = 'inline-block';
            btnConfirmar.disabled = true;

            console.log('📡 Enviando petición para iniciar inventario...');

            // Obtener token CSRF
            const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';

            // Decidir qué endpoint usar según dónde estemos
            let endpoint;

            // Verificar si tenemos TomaInventarioController disponible
            if (typeof window.tomaInventarioManager !== 'undefined') {
                // Estamos en la vista de toma de inventario
                endpoint = `/TomaInventario/IniciarInventario/${inventarioId}`;
            } else {
                // Estamos en las vistas de gestión de inventarios
                endpoint = `/Inventario/IniciarInventario/${inventarioId}`;
            }

            console.log(`🎯 Usando endpoint: ${endpoint}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                }
            });

            console.log(`📡 Respuesta recibida: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en respuesta:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Resultado:', result);

            if (result.success) {
                // Cerrar modal
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();

                // Mostrar mensaje de éxito
                mostrarToast('Éxito',
                    result.message || 'Inventario iniciado exitosamente',
                    'success'
                );

                // Vibración en dispositivos móviles
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }

                // Determinar próximo paso
                if (abrirTomaAutomatica) {
                    console.log('🚀 Redirigiendo a toma de inventario...');

                    // Pequeña pausa para que el usuario vea el mensaje de éxito
                    setTimeout(() => {
                        // Redireccionar a la interfaz de toma
                        window.location.href = `/TomaInventario/Ejecutar/${inventarioId}`;
                    }, 1500);

                } else {
                    console.log('🔄 Recargando página actual...');

                    // Solo recargar la página
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }

            } else {
                throw new Error(result.message || 'Error desconocido al iniciar inventario');
            }

        } catch (error) {
            console.error('💥 Error al iniciar inventario:', error);

            // Restaurar botón
            btnConfirmar.querySelector('.normal-state').style.display = 'inline-block';
            btnConfirmar.querySelector('.loading-state').style.display = 'none';
            btnConfirmar.disabled = false;

            // Mostrar error
            mostrarToast('Error',
                `Error al iniciar inventario: ${error.message}`,
                'danger'
            );
        }
    }

    // Función mejorada para mostrar toasts (compatible con móviles)
    function mostrarToast(titulo, mensaje, tipo) {
        console.log(`📢 Toast: ${tipo} - ${titulo}: ${mensaje}`);

        // Verificar si ya existe un contenedor de toasts
        let toastContainer = document.querySelector('.toast-container');

        if (!toastContainer) {
            toastContainer = document.createElement('div');

            // Posición diferente según el tamaño de pantalla
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
                toastContainer.style.zIndex = '9999';
            } else {
                toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            }
            document.body.appendChild(toastContainer);
        }

        // Crear un nuevo toast
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        // Contenido del toast adaptado para móviles
        const isMobile = window.innerWidth <= 768;
        const toastContent = isMobile ?
            `<div class="d-flex">
            <div class="toast-body text-center w-100">
                <div><strong>${titulo}</strong></div>
                <div class="small">${mensaje}</div>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>` :
            `<div class="d-flex">
            <div class="toast-body">
                <strong>${titulo}</strong>: ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;

        toast.innerHTML = toastContent;

        // Agregar el toast al contenedor
        toastContainer.appendChild(toast);

        // Inicializar y mostrar el toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: isMobile ? 4000 : 5000
        });

        bsToast.show();

        // Eliminar el toast del DOM después de que se oculte
        toast.addEventListener('hidden.bs.toast', function () {
            this.remove();
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        });
    }

    // =====================================
    // 🔄 INICIALIZACIÓN AUTOMÁTICA
    // =====================================

    // Configurar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function () {
        console.log('🎯 Configurando sistema de inicio de inventarios...');

        // Configurar botones de iniciar inventario
        configurarBotonesIniciarInventario();

        // Reconfigurar después de cambios dinámicos en el DOM
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasIniciarButton = addedNodes.some(node =>
                        node.nodeType === 1 &&
                        (node.classList?.contains('iniciar-inventario-btn') ||
                            node.querySelector?.('.iniciar-inventario-btn'))
                    );

                    if (hasIniciarButton) {
                        console.log('🔄 Reconfiguración automática de botones de iniciar inventario');
                        setTimeout(configurarBotonesIniciarInventario, 100);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ Sistema de inicio de inventarios configurado');
    });

    // Hacer disponible globalmente para debug
    window.iniciarInventarioConConfirmacion = iniciarInventarioConConfirmacion;
    window.configurarBotonesIniciarInventario = configurarBotonesIniciarInventario;
});