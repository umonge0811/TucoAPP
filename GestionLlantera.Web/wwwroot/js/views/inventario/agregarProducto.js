// Establecer el estado inicial como activado
        if (esLlantaCheckbox && !esLlantaCheckbox.checked) {
            esLlantaCheckbox.checked = true;
        }

        esLlantaCheckbox.addEventListener('change', actualizarTipoProducto);
        actualizarTipoProducto(); // Inicializar estado