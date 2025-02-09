// Utilidades para manejar estados de botones
const ButtonUtils = {
    // Inicia el estado de carga del botón
    startLoading: function (button) {
        if (!button) return;

        const normalState = button.querySelector('.normal-state');
        const loadingState = button.querySelector('.loading-state');

        if (normalState && loadingState) {
            button.disabled = true;
            normalState.classList.remove('d-inline-flex');
            normalState.classList.add('d-none');
            loadingState.classList.remove('d-none');
            loadingState.classList.add('d-flex');
        }
    },

    // Restaura el estado normal del botón
    stopLoading: function (button) {
        if (!button) return;

        const normalState = button.querySelector('.normal-state');
        const loadingState = button.querySelector('.loading-state');

        if (normalState && loadingState) {
            button.disabled = false;
            normalState.classList.remove('d-none');
            normalState.classList.add('d-inline-flex');
            loadingState.classList.remove('d-flex');
            loadingState.classList.add('d-none');
        }
    }
};