// Funciones específicas para la vista de activación
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('activationForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault(); // Prevenir el envío por defecto del formulario

            const submitButton = document.getElementById('submitButton');
            if (submitButton) {
                try {
                    ButtonUtils.startLoading(submitButton);

                    // Aquí esperamos a que el formulario se envíe
                    await form.submit();

                } catch (error) {
                    console.error('Error:', error);
                    ButtonUtils.stopLoading(submitButton);
                }
            }
        });
    }
});

// Las funciones de contraseña pueden ir aquí si son específicas de esta vista
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}