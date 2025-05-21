/**
 * Funcionalidad para exportar inventario a Excel y PDF
 */
$(document).ready(function () {
    console.log('Script de exportación de inventario cargado');

    // Mostrar modal de exportación al hacer clic en el botón "Exportar"
    $("#btnExportar").click(function (e) {
        e.preventDefault();
        console.log('Botón de exportación clickeado');

        // Por defecto seleccionar Excel 
        $("#formatoExcel").prop("checked", true);

        // Establecer fecha límite por defecto (7 días a partir de hoy)
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 7);
        $("#fechaLimite").val(fechaLimite.toISOString().split('T')[0]);

        // Mostrar el modal
        $("#modalExportarInventario").modal("show");
    });

    // Manejar el evento de clic en el botón de iniciar exportación
    $("#btnIniciarExportacion").click(function () {
        console.log('Iniciando exportación...');

        // Obtener los datos del formulario
        const responsable = $("#responsable").val();
        const solicitante = $("#solicitante").val();
        const fechaLimite = $("#fechaLimite").val();
        const formato = $('input[name="formatoExport"]:checked').val();

        console.log('Datos de exportación:', {
            responsable,
            solicitante,
            fechaLimite,
            formato
        });

        // Construir URL con parámetros
        let url = '';
        if (formato === 'excel') {
            url = `/Inventario/ExportarExcel?responsable=${encodeURIComponent(responsable)}&solicitante=${encodeURIComponent(solicitante)}&fechaLimite=${encodeURIComponent(fechaLimite)}`;
        } else {
            url = `/Inventario/ExportarPDF?responsable=${encodeURIComponent(responsable)}&solicitante=${encodeURIComponent(solicitante)}&fechaLimite=${encodeURIComponent(fechaLimite)}`;
        }

        console.log('URL de exportación:', url);

        // Ocultar el modal
        $("#modalExportarInventario").modal("hide");

        // Mostrar un indicador de carga
        mostrarIndicadorCarga(`Generando ${formato === 'excel' ? 'Excel' : 'PDF'}...`);

        // Iniciar la descarga usando una ventana nueva para evitar problemas con la navegación
        // Usamos timeout para dar tiempo a que se cierre el modal
        setTimeout(function () {
            // Intenta descargar el archivo directamente
            window.location.href = url;

            // Ocultar el indicador de carga después de un tiempo
            setTimeout(function () {
                ocultarIndicadorCarga();
            }, 3000);
        }, 500);
    });

    // Añadir un efecto visual al seleccionar el formato
    $('input[name="formatoExport"]').change(function () {
        // Eliminar clases activas de todos los contenedores
        $('.form-check').removeClass('active-format');

        // Añadir clase activa al formato seleccionado
        $(this).closest('.form-check').addClass('active-format');
    });

    // Funciones auxiliares para mostrar/ocultar indicador de carga
    function mostrarIndicadorCarga(mensaje) {
        // Verificar si ya existe un indicador de carga
        if ($("#indicadorCarga").length === 0) {
            // Crear el elemento HTML del indicador
            const indicadorHTML = `
            <div id="indicadorCarga" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <div class="card p-4 text-center" style="max-width: 300px;">
                    <div class="d-flex justify-content-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                    <h5 id="mensajeCarga" class="text-center">${mensaje}</h5>
                </div>
            </div>
        `;

            // Agregar el indicador al body
            $("body").append(indicadorHTML);
        } else {
            // Actualizar el mensaje si ya existe el indicador
            $("#mensajeCarga").text(mensaje);
            $("#indicadorCarga").show();
        }
    }

    function ocultarIndicadorCarga() {
        $("#indicadorCarga").fadeOut(300, function () {
            $(this).remove();
        });
    }

    // Inicializar fecha límite al cargar la página
    const fechaHoy = new Date();
    fechaHoy.setDate(fechaHoy.getDate() + 7);
    $("#fechaLimite").val(fechaHoy.toISOString().split('T')[0]);
});