document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    const submitButton = document.getElementById('submitButton');
    const normalState = submitButton.querySelector('.normal-state');
    const loadingState = submitButton.querySelector('.loading-state');

    form.addEventListener('submit', function () {
        submitButton.disabled = true;
        normalState.style.display = 'none';
        loadingState.style.display = 'inline-flex';
    });
});

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