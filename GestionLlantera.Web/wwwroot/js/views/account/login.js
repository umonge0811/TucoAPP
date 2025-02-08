document.addEventListener('DOMContentLoaded', function () {
    // Inicializar formulario
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            const submitButton = document.querySelector('#submitButton');
            const normalState = submitButton.querySelector('.normal-state');
            const loadingState = submitButton.querySelector('.loading-state');

            // Mostrar spinner
            submitButton.disabled = true;
            normalState.style.display = 'none';
            loadingState.style.display = 'inline-flex';
        });
    }

    // Toggle de contraseña
    const togglePasswordButton = document.getElementById('togglePassword');
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', function () {
            const passwordInput = document.querySelector('[asp-for="Contrasena"]');
            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.replace('bi-eye-fill', 'bi-eye-slash-fill');
            } else {
                passwordInput.type = 'password';
                icon.classList.replace('bi-eye-slash-fill', 'bi-eye-fill');
            }
        });
    }
});