document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado - inicializando script de agregar producto');

    // Referencias a elementos del DOM
    const form = document.getElementById('formProducto');
    const submitButton = document.getElementById('submitButton');
    const esLlantaCheckbox = document.getElementById('esLlanta');
    const llantaFields = document.getElementById('llantaFields');
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const selectImagesBtn = document.getElementById('selectImagesBtn');

    // *** ELEMENTOS PARA UTILIDAD - CORREGIDOS PARA TU VISTA ***
    const tipoProductoInfo = document.getElementById('tipoProductoInfo');
    const textoTipoProducto = document.getElementById('textoTipoProducto');
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

    // Verificar si los elementos críticos existen
    if (!form) {
        console.error('Error crítico: No se encontró el formulario con ID "formProducto"');
        return;
    }

    console.log('Referencias a elementos obtenidas correctamente');

    // DIAGNÓSTICO - Verificar elementos de utilidad
    console.log('=== DIAGNÓSTICO DE ELEMENTOS DE UTILIDAD ===');
    console.log('modoAutomaticoRadio:', !!modoAutomaticoRadio);
    console.log('modoManualRadio:', !!modoManualRadio);
    console.log('inputCosto:', !!inputCosto);
    console.log('inputUtilidad:', !!inputUtilidad);
    console.log('precioCalculado:', !!precioCalculado);
    console.log('desglosePrecio:', !!desglosePrecio);
    console.log('textoResumen:', !!textoResumen);

    // Configuración de toastr
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            "closeButton": true,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "timeOut": "5000"
        };
    }

    // ========================================
    // FUNCIONES AUXILIARES
    // ========================================

    function marcarCamposObligatorios() {
        const camposRequeridos = document.querySelectorAll('[required]');
        camposRequeridos.forEach(campo => {
            const formGroup = campo.closest('.mb-3');
            if (formGroup) {
                formGroup.classList.add('required');
            }
        });
    }

    function validarCampo(campo) {
        if (!campo.checkValidity) return true;

        const esValido = campo.checkValidity();

        if (esCampoVisible(campo)) {
            if (!esValido) {
                campo.classList.add('is-invalid');
                campo.classList.remove('is-valid');
            } else {
                campo.classList.remove('is-invalid');
                campo.classList.add('is-valid');
            }
        }

        return esValido;
    }

    function esCampoVisible(campo) {
        // Si el campo es de llanta y el checkbox no está marcado, ignorar
        if (!esLlantaCheckbox.checked && llantaFields && llantaFields.contains(campo)) {
            return false;
        }

        // Si es modo manual y el campo es de cálculo automático, ignorar
        if (modoManualRadio && modoManualRadio.checked && camposAutomaticos && camposAutomaticos.contains(campo)) {
            return false;
        }

        // Si es modo automático y el campo es de precio manual, ignorar
        if (modoAutomaticoRadio && modoAutomaticoRadio.checked && campoManual && campoManual.contains(campo)) {
            return false;
        }

        return true;
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    marcarCamposObligatorios();

    // ========================================
    // GESTIÓN DE TIPO DE PRODUCTO (LLANTA)
    // ========================================

    if (esLlantaCheckbox && llantaFields && tipoProductoInfo && textoTipoProducto) {
        function actualizarTipoProducto() {
            if (esLlantaCheckbox.checked) {
                llantaFields.style.display = 'block';
                tipoProductoInfo.className = 'alert alert-primary d-flex align-items-center mb-0';
                textoTipoProducto.innerHTML = '<i class="bi bi-car-front-fill me-1"></i> Producto tipo Llanta - campos específicos habilitados';

                // Hacer obligatorios algunos campos de llanta
                const camposObligatoriosLlanta = [
                    document.querySelector('[name="Llanta.Marca"]'),
                    document.querySelector('[name="Llanta.Ancho"]'),
                    document.querySelector('[name="Llanta.Perfil"]'),
                    document.querySelector('[name="Llanta.Diametro"]')
                ];

                camposObligatoriosLlanta.forEach(campo => {
                    if (campo) {
                        campo.setAttribute('required', 'required');
                        const formGroup = campo.closest('.mb-3');
                        if (formGroup) formGroup.classList.add('required');
                    }
                });
            } else {
                llantaFields.style.display = 'none';
                tipoProductoInfo.className = 'alert alert-info d-flex align-items-center mb-0';
                textoTipoProducto.innerHTML = '<i class="bi bi-box me-1"></i> Producto general - información básica';

                // Quitar validación de campos de llanta
                const llantaInputs = llantaFields.querySelectorAll('input, select');
                llantaInputs.forEach(input => {
                    input.removeAttribute('required');
                    const formGroup = input.closest('.mb-3');
                    if (formGroup) formGroup.classList.remove('required');
                });
            }
        }

        esLlantaCheckbox.addEventListener('change', actualizarTipoProducto);
        actualizarTipoProducto(); // Inicializar estado
    }

    // ========================================
    // GESTIÓN DE PRECIO Y UTILIDAD
    // ========================================

    if (modoAutomaticoRadio && modoManualRadio) {
        console.log('Inicializando funcionalidad de precio...');

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
                console.log('No se puede calcular precio - elementos faltantes o modo manual activo');
                return;
            }

            const costo = parseFloat(inputCosto.value) || 0;
            const porcentajeUtilidad = parseFloat(inputUtilidad.value) || 0;

            console.log(`Calculando precio: Costo=₡${costo}, Utilidad=${porcentajeUtilidad}%`);

            if (costo > 0 && porcentajeUtilidad >= 0) {
                const utilidadDinero = costo * (porcentajeUtilidad / 100);
                const precioFinal = costo + utilidadDinero;

                // Animación suave
                precioCalculado.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    precioCalculado.style.transform = 'scale(1)';
                }, 200);

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
                    const margenClass = porcentajeUtilidad >= 30 ? 'text-success' : porcentajeUtilidad >= 15 ? 'text-warning' : 'text-danger';
                    textoResumen.innerHTML = `
                        <i class="bi bi-check-circle me-1 text-success"></i>
                        <strong>Precio final: ₡${precioFinal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong> 
                        <span class="${margenClass}">(${porcentajeUtilidad}% de utilidad)</span>
                    `;
                }

                console.log(`✅ Precio calculado exitosamente: ₡${precioFinal.toFixed(2)}`);
            } else if (costo > 0 && porcentajeUtilidad === 0) {
                precioCalculado.value = costo.toLocaleString('es-CR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                if (desglosePrecio) {
                    desglosePrecio.innerHTML = `
                        <i class="bi bi-info-circle me-1"></i>
                        Costo: ₡${costo.toLocaleString('es-CR', { minimumFractionDigits: 2 })} + Utilidad: ₡0.00
                    `;
                }

                if (textoResumen) {
                    textoResumen.innerHTML = `
                        <i class="bi bi-exclamation-triangle me-1 text-warning"></i>
                        Precio sin utilidad: ₡${costo.toLocaleString('es-CR', { minimumFractionDigits: 2 })} (0% ganancia)
                    `;
                }
            } else {
                precioCalculado.value = '0.00';

                if (desglosePrecio) {
                    desglosePrecio.innerHTML = `
                        <i class="bi bi-dash-circle me-1"></i>
                        Costo: ₡0.00 + Utilidad: ₡0.00
                    `;
                }

                if (textoResumen) {
                    textoResumen.innerHTML = `
                        <i class="bi bi-info-circle me-1"></i>
                        Ingrese el costo y porcentaje de utilidad para calcular el precio automáticamente
                    `;
                }
            }
        }

        // Eventos para cambio de modo
        modoAutomaticoRadio.addEventListener('change', function () {
            if (this.checked) {
                console.log('Cambiando a modo automático');
                if (camposAutomaticos) camposAutomaticos.style.display = 'block';
                if (campoManual) campoManual.style.display = 'none';

                if (inputCosto) inputCosto.setAttribute('required', 'required');
                if (inputUtilidad) inputUtilidad.setAttribute('required', 'required');
                if (inputPrecioManual) inputPrecioManual.removeAttribute('required');

                actualizarEstilosTarjetas();
                calcularPrecio();
            }
        });

        modoManualRadio.addEventListener('change', function () {
            if (this.checked) {
                console.log('Cambiando a modo manual');
                if (camposAutomaticos) camposAutomaticos.style.display = 'none';
                if (campoManual) campoManual.style.display = 'block';

                if (inputPrecioManual) inputPrecioManual.setAttribute('required', 'required');
                if (inputCosto) inputCosto.removeAttribute('required');
                if (inputUtilidad) inputUtilidad.removeAttribute('required');

                actualizarEstilosTarjetas();
                if (textoResumen) {
                    textoResumen.innerHTML = '<i class="bi bi-pencil me-1"></i> Precio establecido manualmente';
                }
            }
        });

        // Eventos para cálculo en tiempo real
        if (inputCosto) {
            inputCosto.addEventListener('input', calcularPrecio);
            inputCosto.addEventListener('blur', calcularPrecio);
            console.log('✅ Event listeners agregados a inputCosto');
        }

        if (inputUtilidad) {
            inputUtilidad.addEventListener('input', calcularPrecio);
            inputUtilidad.addEventListener('blur', calcularPrecio);
            console.log('✅ Event listeners agregados a inputUtilidad');
        }

        // Efectos visuales para las tarjetas
        if (cardAutomatico && cardManual) {
            [cardAutomatico, cardManual].forEach(card => {
                card.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                });

                card.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '';
                });

                card.addEventListener('click', function () {
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                });
            });
        }

        // Efectos para los inputs
        [inputCosto, inputUtilidad, inputPrecioManual].forEach(input => {
            if (input) {
                input.addEventListener('focus', function () {
                    this.style.transform = 'scale(1.02)';
                });

                input.addEventListener('blur', function () {
                    this.style.transform = 'scale(1)';
                });
            }
        });

        // Inicializar estilos y cálculo
        actualizarEstilosTarjetas();
        calcularPrecio();

        console.log('✅ Funcionalidad de precio inicializada correctamente');
    } else {
        console.error('❌ No se pudieron encontrar los elementos de precio');
        console.log('modoAutomaticoRadio existe:', !!modoAutomaticoRadio);
        console.log('modoManualRadio existe:', !!modoManualRadio);
    }

    // ========================================
    // GESTIÓN DE IMÁGENES
    // ========================================

    if (dropArea && fileInput && selectImagesBtn && previewContainer) {
        let validFiles = [];

        selectImagesBtn.addEventListener('click', function (e) {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
            handleFiles(e.target.files);
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropArea.classList.add('border-primary', 'bg-light');
        }

        function unhighlight() {
            dropArea.classList.remove('border-primary', 'bg-light');
        }

        dropArea.addEventListener('drop', function (e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        function handleFiles(files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.match('image.*')) {
                    if (typeof toastr !== 'undefined') {
                        toastr.error(`${file.name} no es un archivo de imagen válido`);
                    }
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    if (typeof toastr !== 'undefined') {
                        toastr.error(`${file.name} excede el tamaño máximo permitido (5MB)`);
                    }
                    continue;
                }

                const fileExists = validFiles.some(f => f.name === file.name && f.size === file.size);
                if (fileExists) {
                    if (typeof toastr !== 'undefined') {
                        toastr.warning(`El archivo ${file.name} ya ha sido agregado`);
                    }
                    continue;
                }

                validFiles.push(file);
                createPreview(file);
            }

            updateFileInput();
        }

        function createPreview(file) {
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
                    validFiles = validFiles.filter(f => f.name !== filename);
                    preview.remove();
                    updateFileInput();
                });
            };
            reader.readAsDataURL(file);
        }

        function updateFileInput() {
            const dataTransfer = new DataTransfer();
            validFiles.forEach(file => {
                dataTransfer.items.add(file);
            });
            fileInput.files = dataTransfer.files;
            console.log(`Archivos válidos para subir: ${validFiles.length}`);
        }
    }

    // ========================================
    // VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ========================================

    if (form && submitButton) {
        const formInputs = form.querySelectorAll('input, select, textarea');

        formInputs.forEach(input => {
            input.addEventListener('blur', function () {
                validarCampo(this);
            });

            input.addEventListener('input', function () {
                if (this.classList.contains('is-invalid') && this.checkValidity()) {
                    this.classList.remove('is-invalid');
                }
            });
        });

        function validarFormularioCompleto() {
            let esValido = true;

            // Validar campos básicos
            formInputs.forEach(input => {
                if (!validarCampo(input)) {
                    esValido = false;
                }
            });

            // Validar precio según el modo seleccionado
            if (modoAutomaticoRadio && modoAutomaticoRadio.checked) {
                if (!inputCosto.value || parseFloat(inputCosto.value) <= 0) {
                    inputCosto.classList.add('is-invalid');
                    esValido = false;
                }
                if (!inputUtilidad.value || parseFloat(inputUtilidad.value) < 0) {
                    inputUtilidad.classList.add('is-invalid');
                    esValido = false;
                }
            } else if (modoManualRadio && modoManualRadio.checked) {
                if (!inputPrecioManual.value || parseFloat(inputPrecioManual.value) <= 0) {
                    inputPrecioManual.classList.add('is-invalid');
                    esValido = false;
                }
            }

            return esValido;
        }

        form.onsubmit = function (e) {
            e.preventDefault();
            console.log('Formulario enviado - iniciando validación');

            if (!validarFormularioCompleto()) {
                console.log('Formulario inválido - campos con errores');
                if (typeof toastr !== 'undefined') {
                    toastr.error('Por favor, complete todos los campos requeridos correctamente');
                }
                return false;
            }

            console.log('Formulario válido - preparando para enviar');

            submitButton.disabled = true;
            const normalState = submitButton.querySelector('.normal-state');
            const loadingState = submitButton.querySelector('.loading-state');

            if (normalState) normalState.style.display = 'none';
            if (loadingState) loadingState.style.display = 'inline-flex';

            const formData = new FormData(form);

            console.log('FormData creado - revisando elementos:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }

            const formAction = form.getAttribute('action');
            console.log('Enviando formulario al controlador en:', formAction);

            fetch(formAction, {
                method: 'POST',
                body: formData
            })
                .then(async response => {
                    console.log(`Respuesta: status=${response.status}, ok=${response.ok}`);

                    const text = await response.text();
                    console.log('Contenido de la respuesta:', text);

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${text}`);
                    }

                    if (typeof toastr !== 'undefined') {
                        toastr.success('Producto guardado exitosamente');
                    }

                    setTimeout(() => {
                        window.location.href = '/Inventario/Index';
                    }, 1000);
                })
                .catch(error => {
                    console.error('Error:', error);
                    submitButton.disabled = false;
                    if (normalState) normalState.style.display = 'inline-flex';
                    if (loadingState) loadingState.style.display = 'none';

                    if (typeof toastr !== 'undefined') {
                        toastr.error('Error al guardar el producto: ' + error.message);
                    }
                });

            return false;
        };
    }

    console.log('✅ Script de agregar producto inicializado correctamente');
});