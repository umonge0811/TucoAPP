document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 EditarProducto - Inicializando...');

    // Referencias a elementos del DOM
    const form = document.getElementById('formEditarProducto');
    const submitButton = document.getElementById('submitButton');
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const selectImagesBtn = document.getElementById('selectImagesBtn');

    // Elementos para gestión de precio
    const modoAutomaticoRadio = document.getElementById('modoAutomatico');
    const modoManualRadio = document.getElementById('modoManual');
    const cardAutomatico = document.getElementById('cardAutomatico');
    const cardManual = document.getElementById('cardManual');
    const camposAutomaticos = document.getElementById('camposAutomaticos');
    const campoManual = document.getElementById('campoManual');
    const inputCosto = document.getElementById('inputCosto');
    const inputUtilidad = document.getElementById('inputUtilidad');
    const inputPrecioManual = document.getElementById('inputPrecioManual');
    const precioCalculado = document.getElementById('precioCalculado');
    const desglosePrecio = document.getElementById('desglosePrecio');
    const textoResumen = document.getElementById('textoResumen');

    // Verificar elementos críticos
    if (!form) {
        console.error('❌ Error: No se encontró el formulario de edición');
        return;
    }

    console.log('✅ Referencias a elementos obtenidas');

    // Array para manejar nuevas imágenes
    let nuevasImagenes = [];
    // Array para tracking de imágenes a eliminar
    let imagenesAEliminar = [];

    // ========================================
    // GESTIÓN DE PRECIO Y UTILIDAD
    // ========================================

    if (modoAutomaticoRadio && modoManualRadio) {
        console.log('🧮 Inicializando funcionalidad de precio...');

        function actualizarEstilosTarjetas() {
            if (cardAutomatico && cardManual) {
                if (modoAutomaticoRadio.checked) {
                    cardAutomatico.classList.add('border-primary', 'bg-light');
                    cardManual.classList.remove('border-warning', 'bg-light');
                } else {
                    cardManual.classList.add('border-warning', 'bg-light');
                    cardAutomatico.classList.remove('border-primary', 'bg-light');
                }
            }
        }

        function calcularPrecio() {
            if (!modoAutomaticoRadio.checked || !inputCosto || !inputUtilidad || !precioCalculado) {
                return;
            }

            const costo = parseFloat(inputCosto.value) || 0;
            const porcentajeUtilidad = parseFloat(inputUtilidad.value) || 0;

            console.log(`💰 Calculando precio: Costo=₡${costo}, Utilidad=${porcentajeUtilidad}%`);

            if (costo > 0 && porcentajeUtilidad >= 0) {
                const utilidadDinero = costo * (porcentajeUtilidad / 100);
                const precioFinal = costo + utilidadDinero;

                precioCalculado.value = precioFinal.toLocaleString('es-CR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                if (desglosePrecio) {
                    desglosePrecio.innerHTML = `
                        <i class="bi bi-calculator me-1"></i>
                        Costo: ₡${costo.toLocaleString('es-CR', { minimumFractionDigits: 2 })} + 
                        Utilidad: ₡${utilidadDinero.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    `;
                }

                if (textoResumen) {
                    const margenClass = porcentajeUtilidad >= 30 ? 'text-success' :
                        porcentajeUtilidad >= 15 ? 'text-warning' : 'text-danger';
                    textoResumen.innerHTML = `
                        <i class="bi bi-check-circle me-1 text-success"></i>
                        <strong>Precio actualizado: ₡${precioFinal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong> 
                        <span class="${margenClass}">(${porcentajeUtilidad}% de utilidad)</span>
                    `;
                }
            } else {
                precioCalculado.value = '0.00';
                if (desglosePrecio) {
                    desglosePrecio.innerHTML = '<i class="bi bi-dash-circle me-1"></i>Ingrese costo y utilidad';
                }
                if (textoResumen) {
                    textoResumen.innerHTML = '<i class="bi bi-info-circle me-1"></i>Ingrese el costo y porcentaje de utilidad';
                }
            }
        }

        // Eventos para cambio de modo
        modoAutomaticoRadio.addEventListener('change', function () {
            if (this.checked) {
                console.log('🔄 Cambiando a modo automático');
                if (camposAutomaticos) camposAutomaticos.style.display = 'block';
                if (campoManual) campoManual.style.display = 'none';
                actualizarEstilosTarjetas();
                calcularPrecio();
            }
        });

        modoManualRadio.addEventListener('change', function () {
            if (this.checked) {
                console.log('🔄 Cambiando a modo manual');
                if (camposAutomaticos) camposAutomaticos.style.display = 'none';
                if (campoManual) campoManual.style.display = 'block';
                actualizarEstilosTarjetas();
                if (textoResumen) {
                    textoResumen.innerHTML = '<i class="bi bi-pencil me-1"></i>Precio establecido manualmente';
                }
            }
        });

        // Eventos para cálculo en tiempo real
        if (inputCosto) {
            inputCosto.addEventListener('input', calcularPrecio);
            inputCosto.addEventListener('blur', calcularPrecio);
        }

        if (inputUtilidad) {
            inputUtilidad.addEventListener('input', calcularPrecio);
            inputUtilidad.addEventListener('blur', calcularPrecio);
        }

        // Efectos visuales para las tarjetas
        if (cardAutomatico && cardManual) {
            [cardAutomatico, cardManual].forEach(card => {
                card.addEventListener('click', function () {
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                });
            });
        }

        // Inicializar estilos y cálculo
        actualizarEstilosTarjetas();
        calcularPrecio();
    }

    // ========================================
    // ✅ GESTIÓN DE ELIMINACIÓN DE IMÁGENES ACTUALES - CORREGIDA
    // ========================================

    /**
     * ✅ NUEVA FUNCIÓN: Modal de confirmación para eliminar imagen
     * @param {string} imagenId - ID de la imagen
     * @param {Element} boton - Botón que disparó la eliminación
     */
    function mostrarModalConfirmacionEliminacionImagen(imagenId, boton) {
        console.log('🎭 === CREANDO MODAL DE CONFIRMACIÓN PARA IMAGEN ===');

        // Obtener información de la imagen
        const contenedorImagen = boton.closest('.col-md-3');
        const imagen = contenedorImagen.querySelector('img');
        const urlImagen = imagen ? imagen.getAttribute('src') : '';
        const nombreImagen = urlImagen ? urlImagen.split('/').pop() : `Imagen ${imagenId}`;

        const modalHtml = `
        <div class="modal fade" id="modalEliminarImagen" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Confirmar Eliminación de Imagen
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-5">
                                <div class="text-center mb-3">
                                    <img src="${urlImagen}" 
                                         class="img-fluid rounded border" 
                                         style="max-height: 150px; object-fit: cover;"
                                         alt="Imagen a eliminar"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                                    <div class="text-muted" style="display: none;">
                                        <i class="bi bi-image" style="font-size: 3rem;"></i>
                                        <p>Vista previa no disponible</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-7">
                                <h6 class="mb-3">¿Está seguro de eliminar esta imagen?</h6>
                                <div class="alert alert-warning">
                                    <strong>Imagen:</strong> ${nombreImagen}<br>
                                    <strong>ID:</strong> ${imagenId}
                                </div>
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    La imagen se eliminará cuando <strong>guarde los cambios</strong> del producto.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-lg me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-warning" id="btnConfirmarEliminacionImagen">
                            <span class="normal-state">
                                <i class="bi bi-trash me-2"></i>Marcar para Eliminar
                            </span>
                            <span class="loading-state" style="display: none;">
                                <span class="spinner-border spinner-border-sm me-2"></span>
                                Procesando...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalEliminarImagen');
        if (modalAnterior) {
            modalAnterior.remove();
        }

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Crear y mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('modalEliminarImagen'));
        modal.show();

        // Evento para confirmar eliminación
        const btnConfirmar = document.getElementById('btnConfirmarEliminacionImagen');
        btnConfirmar.addEventListener('click', function () {
            ejecutarMarcadoEliminacionImagen(imagenId, boton, modal);
        });

        console.log('✅ Modal de confirmación creado y mostrado');
    }

    /**
     * ✅ NUEVA FUNCIÓN: Ejecuta el marcado de eliminación
     * @param {string} imagenId - ID de la imagen
     * @param {Element} boton - Botón original
     * @param {Object} modal - Instancia del modal
     */
    function ejecutarMarcadoEliminacionImagen(imagenId, boton, modal) {
        console.log('⚡ === EJECUTANDO MARCADO DE ELIMINACIÓN ===');

        const btnConfirmar = document.getElementById('btnConfirmarEliminacionImagen');
        const normalState = btnConfirmar.querySelector('.normal-state');
        const loadingState = btnConfirmar.querySelector('.loading-state');

        // Mostrar estado de carga
        btnConfirmar.disabled = true;
        normalState.style.display = 'none';
        loadingState.style.display = 'inline-flex';

        // Simular pequeño delay para mejor UX
        setTimeout(() => {
            try {
                // Asegurar que es un número
                const imagenIdNumero = parseInt(imagenId);

                if (isNaN(imagenIdNumero)) {
                    console.error('❌ ID de imagen no es un número válido:', imagenId);
                    mostrarNotificacion('error', 'Error: ID de imagen inválido');
                    return;
                }

                console.log('🗑️ ID convertido a número:', imagenIdNumero);

                // Agregar a lista de imágenes a eliminar
                if (!imagenesAEliminar.includes(imagenIdNumero)) {
                    imagenesAEliminar.push(imagenIdNumero);
                    console.log('✅ Imagen agregada a lista de eliminación');
                } else {
                    console.log('⚠️ Imagen ya estaba en lista de eliminación');
                }

                console.log('🗑️ Lista actual de imágenes a eliminar:', imagenesAEliminar);

                // Remover visualmente
                const contenedorImagen = boton.closest('.col-md-3');
                if (contenedorImagen) {
                    contenedorImagen.style.opacity = '0.5';
                    contenedorImagen.style.pointerEvents = 'none';

                    // Agregar indicador visual mejorado
                    const overlay = document.createElement('div');
                    overlay.className = 'position-absolute top-0 start-0 w-100 h-100 bg-warning bg-opacity-75 d-flex align-items-center justify-content-center';
                    overlay.innerHTML = `
                        <div class="text-center text-dark">
                            <i class="bi bi-clock-history" style="font-size: 2rem;"></i>
                            <br>
                            <small class="fw-bold">Pendiente de eliminar</small>
                            <br>
                            <small>Se eliminará al guardar</small>
                        </div>
                    `;
                    overlay.style.borderRadius = '0.375rem';

                    contenedorImagen.style.position = 'relative';
                    contenedorImagen.appendChild(overlay);

                    console.log('✅ Indicador visual agregado');
                } else {
                    console.error('❌ No se encontró el contenedor de la imagen');
                }

                // Cerrar modal
                modal.hide();

                // Mostrar notificación de éxito
                mostrarNotificacion('warning', 'Imagen marcada para eliminar. Se eliminará cuando guarde los cambios del producto.');

                console.log(`✅ Imagen ${imagenIdNumero} marcada para eliminación exitosamente`);

            } catch (error) {
                console.error('❌ Error al marcar imagen para eliminación:', error);

                // Restaurar botón
                btnConfirmar.disabled = false;
                normalState.style.display = 'inline-flex';
                loadingState.style.display = 'none';

                mostrarNotificacion('error', 'Error al marcar imagen para eliminación');
            }
        }, 500);
    }

    // ✅ EVENTO PRINCIPAL PARA ELIMINAR IMÁGENES (CORREGIDO)
    document.addEventListener('click', function (e) {
        if (e.target.closest('.eliminar-imagen-btn')) {
            e.preventDefault();
            const boton = e.target.closest('.eliminar-imagen-btn');
            const imagenId = boton.getAttribute('data-imagen-id');

            console.log(`🗑️ Solicitando eliminación de imagen ID: ${imagenId}`);

            // ✅ MOSTRAR MODAL EN LUGAR DE CONFIRM()
            mostrarModalConfirmacionEliminacionImagen(imagenId, boton);
        }
    });

    // ========================================
    // GESTIÓN DE NUEVAS IMÁGENES
    // ========================================

    if (dropArea && fileInput && selectImagesBtn && previewContainer) {
        selectImagesBtn.addEventListener('click', function (e) {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
            manejarArchivos(e.target.files);
        });

        // Eventos de drag & drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, prevenirDefecto, false);
        });

        function prevenirDefecto(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, resaltar, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, quitarResaltado, false);
        });

        function resaltar() {
            dropArea.classList.add('border-primary', 'bg-light');
        }

        function quitarResaltado() {
            dropArea.classList.remove('border-primary', 'bg-light');
        }

        dropArea.addEventListener('drop', function (e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            manejarArchivos(files);
        });

        function manejarArchivos(files) {
            console.log(`📁 Procesando ${files.length} archivos nuevos`);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.match('image.*')) {
                    mostrarNotificacion('error', `${file.name} no es un archivo de imagen válido`);
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    mostrarNotificacion('error', `${file.name} excede el tamaño máximo permitido (5MB)`);
                    continue;
                }

                const fileExists = nuevasImagenes.some(f => f.name === file.name && f.size === file.size);
                if (fileExists) {
                    mostrarNotificacion('warning', `El archivo ${file.name} ya ha sido agregado`);
                    continue;
                }

                nuevasImagenes.push(file);
                crearVistaPrevia(file);
            }

            actualizarInputArchivos();
        }

        function crearVistaPrevia(file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.createElement('div');
                preview.className = 'img-preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Vista previa de ${file.name}">
                    <div class="img-preview-remove" data-filename="${file.name}">
                        <i class="bi bi-x"></i>
                    </div>
                `;
                previewContainer.appendChild(preview);

                const removeBtn = preview.querySelector('.img-preview-remove');
                removeBtn.addEventListener('click', function () {
                    const filename = this.getAttribute('data-filename');
                    nuevasImagenes = nuevasImagenes.filter(f => f.name !== filename);
                    preview.remove();
                    actualizarInputArchivos();
                    console.log(`🗑️ Nueva imagen ${filename} removida de la cola`);
                });
            };
            reader.readAsDataURL(file);
        }

        function actualizarInputArchivos() {
            const dataTransfer = new DataTransfer();
            nuevasImagenes.forEach(file => {
                dataTransfer.items.add(file);
            });
            fileInput.files = dataTransfer.files;
            console.log(`📎 ${nuevasImagenes.length} nuevas imágenes preparadas para subir`);
        }
    }

    // ========================================
    // FUNCIONES AUXILIARES
    // ========================================

    function prepararDatosParaEnvio() {
        console.log('🔄 === PREPARANDO DATOS DE PRECIO ===');

        const esAutomatico = modoAutomaticoRadio && modoAutomaticoRadio.checked;
        console.log(`💰 Modo de precio: ${esAutomatico ? 'AUTOMÁTICO' : 'MANUAL'}`);

        if (esAutomatico) {
            console.log('🧮 Configurando para cálculo automático...');

            const costoValue = inputCosto ? parseFloat(inputCosto.value) || 0 : 0;
            const utilidadValue = inputUtilidad ? parseFloat(inputUtilidad.value) || 0 : 0;

            console.log(`💳 Costo: ${costoValue}`);
            console.log(`📊 Utilidad: ${utilidadValue}%`);

            if (costoValue <= 0) {
                console.error('❌ Costo debe ser mayor a 0 para cálculo automático');
                if (inputCosto) inputCosto.classList.add('is-invalid');
                return false;
            }

            if (utilidadValue < 0) {
                console.error('❌ Utilidad no puede ser negativa');
                if (inputUtilidad) inputUtilidad.classList.add('is-invalid');
                return false;
            }

            console.log('✅ Modo automático configurado correctamente');

        } else {
            console.log('📝 Configurando para precio manual...');

            const precioValue = inputPrecioManual ? parseFloat(inputPrecioManual.value) || 0 : 0;
            console.log(`💵 Precio manual: ${precioValue}`);

            if (precioValue <= 0) {
                console.error('❌ Precio manual debe ser mayor a 0');
                if (inputPrecioManual) inputPrecioManual.classList.add('is-invalid');
                return false;
            }

            if (inputCosto) {
                inputCosto.value = '';
                console.log('🔄 Costo limpiado para precio manual');
            }
            if (inputUtilidad) {
                inputUtilidad.value = '';
                console.log('🔄 Utilidad limpiada para precio manual');
            }
        }

        console.log('✅ Datos de precio preparados correctamente');
        return true;
    }

    function validarFormulario() {
        let esValido = true;
        const camposRequeridos = form.querySelectorAll('[required]');

        camposRequeridos.forEach(campo => {
            if (!campo.value.trim()) {
                campo.classList.add('is-invalid');
                esValido = false;
            } else {
                campo.classList.remove('is-invalid');
            }
        });

        if (modoAutomaticoRadio && modoAutomaticoRadio.checked) {
            if (!inputCosto || !inputCosto.value || parseFloat(inputCosto.value) <= 0) {
                if (inputCosto) inputCosto.classList.add('is-invalid');
                esValido = false;
            }
            if (!inputUtilidad || !inputUtilidad.value || parseFloat(inputUtilidad.value) < 0) {
                if (inputUtilidad) inputUtilidad.classList.add('is-invalid');
                esValido = false;
            }
        } else if (modoManualRadio && modoManualRadio.checked) {
            if (!inputPrecioManual || !inputPrecioManual.value || parseFloat(inputPrecioManual.value) <= 0) {
                if (inputPrecioManual) inputPrecioManual.classList.add('is-invalid');
                esValido = false;
            }
        }

        return esValido;
    }

    function mostrarNotificacion(tipo, mensaje) {
        if (typeof toastr !== 'undefined') {
            toastr[tipo](mensaje);
        } else {
            alert(mensaje);
        }
    }

    // ========================================
    // VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ========================================

    if (form && submitButton) {
        form.onsubmit = function (e) {
            e.preventDefault();
            console.log('💾 Iniciando actualización del producto...');

            if (!validarFormulario()) {
                console.log('❌ Formulario inválido');
                mostrarNotificacion('error', 'Por favor, complete todos los campos requeridos correctamente');
                return false;
            }

            if (!prepararDatosParaEnvio()) {
                console.log('❌ Error en preparación de datos de precio');
                mostrarNotificacion('error', 'Por favor corrija los errores en la configuración de precio');
                return false;
            }

            submitButton.disabled = true;
            const normalState = submitButton.querySelector('.normal-state');
            const loadingState = submitButton.querySelector('.loading-state');

            if (normalState) normalState.style.display = 'none';
            if (loadingState) loadingState.style.display = 'inline-flex';

            const formData = new FormData(form);

            console.log('📤 === PREPARANDO IMÁGENES PARA ELIMINACIÓN ===');
            console.log('🗑️ Total imágenes a eliminar:', imagenesAEliminar.length);
            console.log('🗑️ Lista completa:', imagenesAEliminar);

            if (imagenesAEliminar.length > 0) {
                imagenesAEliminar.forEach((id, index) => {
                    formData.append(`imagenesAEliminar[${index}]`, id.toString());
                    console.log(`📎 Agregando eliminación [${index}]: ${id}`);
                });

                imagenesAEliminar.forEach(id => {
                    formData.append('imagenesAEliminar', id.toString());
                });

                console.log('✅ Imágenes a eliminar agregadas al FormData');
            } else {
                console.log('ℹ️ No hay imágenes para eliminar');
            }

            console.log('📤 Enviando datos del formulario...');
            console.log(`🖼️ Imágenes a eliminar: ${imagenesAEliminar.length}`);
            console.log(`📷 Nuevas imágenes: ${nuevasImagenes.length}`);

            fetch(form.action, {
                method: 'POST',
                body: formData
            })
                .then(async response => {
                    const text = await response.text();
                    console.log(`📡 Respuesta del servidor: ${response.status}`);

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${text}`);
                    }

                    mostrarNotificacion('success', 'Producto actualizado exitosamente');

                    setTimeout(() => {
                        window.location.href = '/Inventario/Index';
                    }, 1500);
                })
                .catch(error => {
                    console.error('❌ Error:', error);

                    submitButton.disabled = false;
                    if (normalState) normalState.style.display = 'inline-flex';
                    if (loadingState) loadingState.style.display = 'none';

                    mostrarNotificacion('error', 'Error al actualizar el producto: ' + error.message);
                });

            return false;
        };
    }

    console.log('✅ EditarProducto - Inicialización completada');
});