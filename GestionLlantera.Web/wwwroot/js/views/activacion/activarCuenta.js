// Funciones específicas para la vista de activación
document.addEventListener('DOMContentLoaded', function () {
    // Inicializaciones específicas para esta vista
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