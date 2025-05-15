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

    // Verificar si los elementos críticos existen
    if (!form) {
        console.error('Error crítico: No se encontró el formulario con ID "formProducto"');
        return; // Detener ejecución
    }

    console.log('Formulario encontrado:', form);

    // *** DEPURACIÓN ADICIONAL ***
    // Imprimir todos los atributos del formulario
    console.log('Atributos del formulario:');
    Array.from(form.attributes).forEach(attr => {
        console.log(`${attr.name}: ${attr.value}`);
    });

    // Verificar si hay otros formularios en la página
    const todosLosFormularios = document.querySelectorAll('form');
    console.log(`Total de formularios en la página: ${todosLosFormularios.length}`);

    // Añadir un ID único temporal para depuración
    const idTemporal = 'form_' + Date.now();
    form.setAttribute('data-debug-id', idTemporal);
    console.log(`ID de depuración asignado al formulario: ${idTemporal}`);

    // *** FIN DE DEPURACIÓN ADICIONAL ***

    if (!submitButton) {
        console.error('Error: No se encontró el botón de envío con ID "submitButton"');
    }

    console.log('Referencias a elementos obtenidas correctamente', {
        form: !!form,
        submitButton: !!submitButton,
        esLlantaCheckbox: !!esLlantaCheckbox,
        llantaFields: !!llantaFields,
        fileInput: !!fileInput
    });

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
            // Crear un DataTransfer para simular una nueva selección de archivos
            const dataTransfer = new DataTransfer();

            // Agregar cada archivo válido al DataTransfer
            validFiles.forEach(file => {
                dataTransfer.items.add(file);
            });

            // Asignar los archivos al fileInput
            fileInput.files = dataTransfer.files;

            console.log(`Archivos válidos para subir: ${validFiles.length}`);
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

        // IMPORTANTE: Asegurarnos de capturar correctamente el evento submit
        console.log('Configurando captura de evento submit para el formulario...');

        // Añadir evento submit de forma directa
        form.onsubmit = function (e) {
            console.log('EVENTO SUBMIT CAPTURADO - Formulario:', this.getAttribute('data-debug-id'));
            debugger; // Esto detendrá la ejecución justo aquí

            // Prevenir el envío por defecto
            e.preventDefault();

            console.log('Formulario enviado - iniciando validación');

            // Validar todos los campos primero
            let formValido = true;
            formInputs.forEach(input => {
                if (!validarCampo(input)) {
                    formValido = false;
                }
            });

            if (!formValido) {
                console.log('Formulario inválido - campos con errores');
                // Mostrar mensaje de error
                toastr.error('Por favor, complete todos los campos requeridos correctamente');

                // Scroll al primer campo con error
                const primerCampoError = form.querySelector('.is-invalid');
                if (primerCampoError) {
                    primerCampoError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                return false;
            }

            console.log('Formulario válido - preparando para enviar');

            // Si el formulario es válido, mostrar spinner
            const normalState = submitButton.querySelector('.normal-state');
            const loadingState = submitButton.querySelector('.loading-state');

            submitButton.disabled = true;
            normalState.style.display = 'none';
            loadingState.style.display = 'inline-flex';

            // Crear FormData para enviar los datos del formulario
            const formData = new FormData(form);

            console.log('FormData creado - revisando elementos:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }

            // Si no es una llanta, eliminar los datos de llanta del FormData
            if (esLlantaCheckbox && !esLlantaCheckbox.checked) {
                console.log('No es una llanta - eliminando campos de llanta');
                for (let key of [...formData.keys()]) {
                    if (key.startsWith('Llanta.')) {
                        formData.delete(key);
                    }
                }
            }

            // Añadir las imágenes seleccionadas al FormData
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                console.log(`Agregando ${fileInput.files.length} imágenes al FormData`);

                // Verificar el nombre actual del campo de imágenes
                const inputName = fileInput.getAttribute('name') || 'imagenes';
                console.log(`Nombre del campo de imágenes: ${inputName}`);

                // Agregar cada archivo con el nombre correcto
                for (let i = 0; i < fileInput.files.length; i++) {
                    console.log(`Añadiendo imagen: ${fileInput.files[i].name} (${fileInput.files[i].size} bytes)`);
                    formData.append(inputName, fileInput.files[i]);
                }
            }

            // IMPORTANTE: Asegurar que la URL del formulario sea relativa
            const formAction = '/Inventario/AgregarProducto'; // URL FIJA relativa
            console.log('Enviando formulario al controlador en:', formAction);

            // Enviar usando fetch para tener más control
            fetch(formAction, {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    console.log(`Respuesta recibida - status: ${response.status}`);
                    if (!response.ok) {
                        return response.text().then(text => {
                            console.error('Error en la respuesta:', text);
                            throw new Error(`Error ${response.status}: ${text || 'Error al guardar el producto'}`);
                        });
                    }
                    return response.text().then(text => {
                        try {
                            // Intentar analizar como JSON
                            return text ? JSON.parse(text) : {};
                        } catch (e) {
                            // Si no es JSON, devolver el texto como respuesta
                            return { message: text };
                        }
                    });
                })
                .then(data => {
                    console.log('Producto guardado exitosamente:', data);
                    // Mostrar mensaje de éxito
                    toastr.success('Producto guardado exitosamente');

                    // Redireccionar después de un breve retraso
                    setTimeout(() => {
                        window.location.href = '/Inventario/Index';
                    }, 1000);
                })
                .catch(error => {
                    console.error('Error al guardar producto:', error);
                    submitButton.disabled = false;
                    normalState.style.display = 'inline-flex';
                    loadingState.style.display = 'none';
                    toastr.error('Error al guardar el producto: ' + error.message);
                });

            return false; // Impedir envío normal del formulario
        };
    }

    // IMPORTANTE: Añadir monitoreo de clics para depurar problemas con botones de submit
    document.body.addEventListener('click', function (e) {
        if (e.target.type === 'submit' || e.target.closest('button[type="submit"]')) {
            const boton = e.target.type === 'submit' ? e.target : e.target.closest('button[type="submit"]');
            console.log('Botón submit clickeado:', boton);
            console.log('Formulario asociado:', boton.form);
        }
    });

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