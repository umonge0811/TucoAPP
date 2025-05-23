namespace GestionLlantera.Web.Models.DTOs
{
    public class NotificacionDTO
    {
        public int NotificacionId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public string? Icono { get; set; }
        public bool Leida { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaLectura { get; set; }
        public string? UrlAccion { get; set; }
        public string? EntidadTipo { get; set; }
        public int? EntidadId { get; set; }

        // Propiedades calculadas para la vista
        public string TiempoTranscurrido => CalcularTiempoTranscurrido();
        public string ClaseTipo => ObtenerClaseTipo();

        private string CalcularTiempoTranscurrido()
        {
            var diferencia = DateTime.Now - FechaCreacion;

            if (diferencia.TotalMinutes < 1)
                return "Hace un momento";
            if (diferencia.TotalMinutes < 60)
                return $"Hace {(int)diferencia.TotalMinutes} min";
            if (diferencia.TotalHours < 24)
                return $"Hace {(int)diferencia.TotalHours} h";
            if (diferencia.TotalDays < 7)
                return $"Hace {(int)diferencia.TotalDays} días";

            return FechaCreacion.ToString("dd/MM/yyyy");
        }

        private string ObtenerClaseTipo()
        {
            return Tipo switch
            {
                "success" => "text-success",
                "warning" => "text-warning",
                "danger" => "text-danger",
                "info" => "text-info",
                _ => "text-secondary"
            };
        }
    }
}