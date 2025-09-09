// Validación de campos numéricos para medidas de llanta
    $('#formProducto input[type="number"]').on('input', function () {
        const valor = $(this).val();

        // Permitir campo vacío
        if (valor === '') {
            $(this).removeClass('is-invalid is-valid');
            return;
        }

        const numeroValor = parseFloat(valor);
        const min = parseFloat($(this).attr('min')) || 0;
        const max = parseFloat($(this).attr('max')) || 9999;

        // Verificar si es un número válido y está en el rango permitido
        if (isNaN(numeroValor) || numeroValor < min || numeroValor > max) {
            $(this).addClass('is-invalid').removeClass('is-valid');
        } else {
            $(this).addClass('is-valid').removeClass('is-invalid');
        }
    });