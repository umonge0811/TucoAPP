using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http.Json; // Para enviar y recibir datos en formato JSON
using tuco.Clases.Models; // Para acceder a los modelos de datos
using Tuco.Clases.DTOs; // Para usar el DTO (Data Transfer Object) de historial

namespace tuco.Utilities
{
    // Clase estática para centralizar el registro de acciones en el historial
    public static class HistorialHelper
    {
        // Método estático y asíncrono para registrar una acción en el historial
        public static async Task RegistrarHistorial(
            HttpClient httpClient,
            int usuarioId,
            string tipoAccion,
            string modulo,
            string detalle,
            string? token = null,
            string? propositoToken = null,
            string estadoAccion = "Exito",
            string? errorDetalle = null)
        {
            try
            {
                var historial = new HistorialAccionDTO
                {
                    UsuarioID = usuarioId,
                    TipoAccion = tipoAccion,
                    Modulo = modulo,
                    Detalle = detalle,
                    Token = token,
                    PropositoToken = propositoToken,
                    EstadoAccion = estadoAccion,
                    ErrorDetalle = errorDetalle
                };

                // Verifica si la BaseAddress está configurada
                if (httpClient.BaseAddress == null)
                {
                    throw new InvalidOperationException("BaseAddress no está configurada en HttpClient.");
                }

                // Realiza la solicitud al endpoint
                var response = await httpClient.PostAsJsonAsync("api/Historial/registrar-historial", historial);

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error al registrar historial: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Excepción al registrar historial: {ex.Message}");
            }
        }
    }
}
