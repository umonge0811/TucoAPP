// Script para manejar la vista de agregar productos
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

    // Mostrar/ocultar campos de llanta dependiendo del checkbox
    if (esLlantaCheckbox) {
        esLlantaCheckbox.addEventListener('change', function () {
            if (this.checked) {
                llantaFields.style.display = 'block';
            } else {
                llantaFields.style.display = 'none';
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
        fileInput.addEventListener('change', handleFiles);

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
            dropArea.classList.add('highlight');
        }

        function unhighlight() {
            dropArea.classList.remove('highlight');
        }

        dropArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        function handleFiles(e) {
            let files;
            if (e.dataTransfer) {
                files = e.dataTransfer.files;
            } else if (e.target) {
                files = e.target.files;
            } else {
                files = e;
            }

            // Validar tipos de archivo
            const validFiles = Array.from(files).filter(file => {
                if (!file.type.match('image.*')) {
                    toastr.error(`${file.name} no es un archivo de imagen válido.`);
                    return false;
                }
                return true;
            });

            validFiles.forEach(uploadFile);
        }

        function uploadFile(file) {
            // Crear la previsualización
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.createElement('div');
                preview.className = 'img-preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Vista previa">
                    <div class="img-preview-remove" data-filename="${file.name}">
                        <i class="bi bi-x"></i>
                    </div>
                `;
                previewContainer.appendChild(preview);

                // Agregar evento para eliminar la previsualización
                const removeBtn = preview.querySelector('.img-preview-remove');
                removeBtn.addEventListener('click', function () {
                    preview.remove();
                    // Actualizar el input de archivos
                    updateFileInput();
                });
            };
            reader.readAsDataURL(file);
        }

        function updateFileInput() {
            // Esta función es un poco más compleja debido a que no se puede modificar directamente 
            // el valor de un input file por seguridad. En una implementación real, 
            // se usaría FormData para manejar los archivos.
            console.log('Actualización de archivos');
        }
    }

    // Manejar el envío del formulario
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validación básica
            if (!form.checkValidity()) {
                e.stopPropagation();
                form.classList.add('was-validated');
                return;
            }

            try {
                // Cambiar estado del botón
                const normalState = submitButton.querySelector('.normal-state');
                const loadingState = submitButton.querySelector('.loading-state');
                submitButton.disabled = true;
                normalState.style.display = 'none';
                loadingState.style.display = 'inline-flex';

                // Enviar el formulario normalmente (ya que incluye archivos)
                form.submit();
            } catch (error) {
                console.error('Error:', error);
                toastr.error('Ocurrió un error al guardar el producto');

                // Restaurar botón
                const normalState = submitButton.querySelector('.normal-state');
                const loadingState = submitButton.querySelector('.loading-state');
                submitButton.disabled = false;
                normalState.style.display = 'inline-flex';
                loadingState.style.display = 'none';
            }
        });
    }
});