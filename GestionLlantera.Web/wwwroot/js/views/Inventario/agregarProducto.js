/**
 * Script para la vista de agregar producto
 */

document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const esLlantaCheckbox = document.getElementById('esLlanta');
    const llantaFields = document.getElementById('llantaFields');
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const selectImagesBtn = document.getElementById('selectImagesBtn');
    const form = document.getElementById('formProducto');
    const submitButton = document.getElementById('submitButton');

    // Configuración de toastr
    toastr.options = {
        "closeButton": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "timeOut": "5000"
    };

    // Inicializar campos obligatorios
    marcarCamposObligatorios();

    // Mostrar/ocultar campos de llanta dependiendo del checkbox
    if (esLlantaCheckbox && llantaFields) {
        esLlantaCheckbox.addEventListener('change', function () {
            if (this.checked) {
                llantaFields.style.display = 'block';

                // Hacer que los campos principales de llanta sean obligatorios
                const camposObligatorios = [
                    document.querySelector('[name="Llanta.Marca"]'),
                    document.querySelector('[name="Llanta.Modelo"]'),
                    document.querySelector('[name="Llanta.Diametro"]')
                ];

                camposObligatorios.forEach(campo => {
                    if (campo) {
                        campo.setAttribute('required', 'required');
                        campo.closest('.mb-3').classList.add('required');
                    }
                });
            } else {
                llantaFields.style.display = 'none';

                // Quitar validación de campos de llanta
                const llantaInputs = llantaFields.querySelectorAll('input, select');
                llantaInputs.forEach(input => {
                    input.removeAttribute('required');
                    input.closest('.mb-3').classList.remove('required');
                });
            }
        });
    }

    // Eventos para la carga de imágenes
    if (dropArea && fileInput && selectImagesBtn) {
        // Abrir el selector de archivos al hacer clic en el botón
        selectImagesBtn.addEventListener('click', function (e) {
            e.preventDefault();
            fileInput.click();
        });

        // Selección de archivos mediante el input
        fileInput.addEventListener('change', function (e) {
            handleFiles(e.target.files);
        });

        // Eventos de arrastrar y soltar
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
            dropArea.classList.add('border-primary');
            dropArea.classList.add('bg-light');
        }

        function unhighlight() {
            dropArea.classList.remove('border-primary');
            dropArea.classList.remove('bg-light');
        }

        dropArea.addEventListener('drop', function (e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        // Array para mantener una lista de archivos válidos
        let validFiles = [];

        function handleFiles(files) {
            // Validar tipos de archivo y tamaño
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validar tipo de archivo
                if (!file.type.match('image.*')) {
                    toastr.error(`${file.name} no es un archivo de imagen válido`);
                    continue;
                }

                // Validar tamaño (5MB máximo)
                if (file.size > 5 * 1024 * 1024) {
                    toastr.error(`${file.name} excede el tamaño máximo permitido (5MB)`);
                    continue;
                }

                // Verificar si el archivo ya está en la lista por nombre
                const fileExists = validFiles.some(f => f.name === file.name && f.size === file.size);
                if (fileExists) {
                    toastr.warning(`El archivo ${file.name} ya ha sido agregado`);
                    continue;
                }

                // Agregar a la lista de archivos válidos
                validFiles.push(file);

                // Crear previsualización
                createPreview(file);
            }

            // Actualizar el campo de archivos con los archivos válidos
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

                // Agregar evento para eliminar la previsualización
                const removeBtn = preview.querySelector('.img-preview-remove');
                removeBtn.addEventListener('click', function () {
                    // Eliminar archivo de la lista
                    const filename = this.getAttribute('data-filename');
                    validFiles = validFiles.filter(f => f.name !== filename);

                    // Eliminar previsualización
                    preview.remove();

                    // Actualizar input
                    updateFileInput();
                });
            };
            reader.readAsDataURL(file);
        }

        function updateFileInput() {
            // Crear un nuevo FileList (no es posible directamente, así que usamos FormData)
            // En una implementación real, esto se maneja al enviar el formulario
            console.log(`Archivos válidos: ${validFiles.length}`);
        }
    }

    // Validación y envío del formulario
    if (form && submitButton) {
        // Mejorar la validación de campos al perder el foco
        const formInputs = form.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', function () {
                validarCampo(this);
            });

            input.addEventListener('input', function () {
                // Si el campo tenía error y se corrigió, quitar el error
                if (this.classList.contains('is-invalid') && this.checkValidity()) {
                    this.classList.remove('is-invalid');
                }
            });
        });

        // Manejar el envío del formulario
        form.addEventListener('submit', function (e) {
            // Validar todos los campos primero
            let formValido = true;
            formInputs.forEach(input => {
                if (!validarCampo(input)) {
                    formValido = false;
                }
            });

            if (!formValido) {
                e.preventDefault();
                e.stopPropagation();

                // Mostrar mensaje de error
                toastr.error('Por favor, complete todos los campos requeridos correctamente');

                // Scroll al primer campo con error
                const primerCampoError = form.querySelector('.is-invalid');
                if (primerCampoError) {
                    primerCampoError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                return;
            }

            // Si el formulario es válido, mostrar spinner
            const normalState = submitButton.querySelector('.normal-state');
            const loadingState = submitButton.querySelector('.loading-state');

            submitButton.disabled = true;
            normalState.style.display = 'none';
            loadingState.style.display = 'inline-flex';

            // Si es una llanta y el checkbox no está marcado, limpiar los campos de llanta
            if (esLlantaCheckbox && !esLlantaCheckbox.checked) {
                const llantaInputs = llantaFields.querySelectorAll('input, select');
                llantaInputs.forEach(input => {
                    input.value = '';
                });
            }

            // El formulario se enviará normalmente
        });
    }

    // Funciones auxiliares

    // Marcar visualmente los campos obligatorios
    function marcarCamposObligatorios() {
        const camposRequeridos = document.querySelectorAll('[required]');
        camposRequeridos.forEach(campo => {
            const formGroup = campo.closest('.mb-3');
            if (formGroup) {
                formGroup.classList.add('required');
            }
        });
    }

    // Validar un campo específico
    function validarCampo(campo) {
        // Si el campo no tiene validación, considerarlo válido
        if (!campo.checkValidity) return true;

        const esValido = campo.checkValidity();

        // Solo aplicar estilos si el campo es visible (evitar validar campos ocultos)
        if (esCampoVisible(campo)) {
            if (!esValido) {
                campo.classList.add('is-invalid');
            } else {
                campo.classList.remove('is-invalid');
            }
        }

        return esValido;
    }

    // Verificar si un campo está visible (no está en un contenedor oculto)
    function esCampoVisible(campo) {
        // Si el campo es de llanta y el checkbox no está marcado, ignorar
        if (esLlantaCheckbox && !esLlantaCheckbox.checked) {
            if (llantaFields.contains(campo)) {
                return false;
            }
        }

        return true;
    }
});