function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = event.currentTarget;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('bi-eye-fill', 'bi-eye-slash-fill');
    } else {
        input.type = 'password';
        icon.classList.replace('bi-eye-slash-fill', 'bi-eye-fill');
    }
}

// Función para inicializar el formulario de Olvide Contraseña
function initOlvideContrasenaForm() {
    const form = document.getElementById('recuperarForm');
    if (!form) return;

    const submitButton = form.querySelector('#submitButton');
    const normalState = submitButton.querySelector('.normal-state');
    const loadingState = submitButton.querySelector('.loading-state');
    const emailInput = form.querySelector('#Email');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validar email
        if (!emailInput.value || !emailInput.checkValidity()) {
            alert('Por favor ingrese un correo válido');
            return;
        }

        // Mostrar spinner
        normalState.style.display = 'none';
        loadingState.style.display = 'inline-flex';
        submitButton.disabled = true;

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.text();
                if (result.includes('success')) {
                    alert('Se han enviado las instrucciones a tu correo electrónico');
                    form.reset();
                } else {
                    alert('No se pudo procesar la solicitud');
                }
            } else {
                alert('Error en la solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al procesar la solicitud');
        } finally {
            // Restaurar estado del botón
            normalState.style.display = 'inline-flex';
            loadingState.style.display = 'none';
            submitButton.disabled = false;
        }
    });

    // Validación en tiempo real del email
    emailInput?.addEventListener('input', function () {
        submitButton.disabled = !emailInput.value || !emailInput.checkValidity();
    });
}

// Función para inicializar el formulario de Restablecer Contraseña
function initRestablecerContrasenaForm() {
    const form = document.getElementById('restablecerForm');
    if (!form) return;

    const submitButton = form.querySelector('#submitButton');
    const normalState = submitButton.querySelector('.normal-state');
    const loadingState = submitButton.querySelector('.loading-state');
    const password = form.querySelector('#NuevaContrasena');
    const confirmPassword = form.querySelector('#ConfirmarContrasena');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validar contraseñas
        if (!password.value || !confirmPassword.value) {
            alert('Por favor complete todos los campos');
            return;
        }

        if (password.value !== confirmPassword.value) {
            alert('Las contraseñas no coinciden');
            return;
        }

        // Mostrar spinner
        normalState.style.display = 'none';
        loadingState.style.display = 'inline-flex';
        submitButton.disabled = true;

        // Enviar el formulario
        form.submit();
    });

    // Validación en tiempo real de las contraseñas
    const inputs = [password, confirmPassword];
    inputs.forEach(input => {
        input?.addEventListener('input', function () {
            const isValid = password.value &&
                confirmPassword.value &&
                password.value === confirmPassword.value;
            submitButton.disabled = !isValid;
        });
    });
}

// Inicializar los formularios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    initOlvideContrasenaForm();
    initRestablecerContrasenaForm();
});