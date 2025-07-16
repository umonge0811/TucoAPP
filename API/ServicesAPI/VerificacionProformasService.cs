
using API.Data;
using Microsoft.EntityFrameworkCore;

namespace API.ServicesAPI
{
    public class VerificacionProformasService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<VerificacionProformasService> _logger;
        private readonly TimeSpan _periodo = TimeSpan.FromHours(24); // Ejecutar cada 24 horas

        public VerificacionProformasService(
            IServiceProvider serviceProvider, 
            ILogger<VerificacionProformasService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📅 Servicio de verificación de proformas iniciado");

            // Calcular el tiempo hasta las 2:00 AM del próximo día
            var proximaEjecucion = CalcularProximaEjecucion();
            var tiempoEspera = proximaEjecucion - DateTime.Now;

            if (tiempoEspera > TimeSpan.Zero)
            {
                _logger.LogInformation("📅 Primera verificación programada para: {Fecha}", proximaEjecucion);
                await Task.Delay(tiempoEspera, stoppingToken);
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await VerificarVencimientoProformas();
                    
                    // Esperar hasta la próxima ejecución (24 horas)
                    await Task.Delay(_periodo, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("📅 Servicio de verificación de proformas cancelado");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error en el servicio de verificación de proformas");
                    
                    // En caso de error, esperar 1 hora antes de reintentar
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task VerificarVencimientoProformas()
        {
            _logger.LogInformation("📅 === INICIANDO VERIFICACIÓN AUTOMÁTICA DE PROFORMAS ===");
            
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<TucoContext>();

            try
            {
                var proformasExpiradas = await context.Facturas
                    .Where(f => f.TipoDocumento == "Proforma" && 
                               f.Estado == "Vigente" && 
                               f.FechaVencimiento < DateTime.Now)
                    .ToListAsync();

                var cantidadActualizadas = 0;

                foreach (var proforma in proformasExpiradas)
                {
                    var diasVencida = (DateTime.Now - proforma.FechaVencimiento.Value).Days;
                    
                    proforma.Estado = "Expirada";
                    proforma.FechaActualizacion = DateTime.Now;
                    proforma.Observaciones = (proforma.Observaciones ?? "") + 
                        $" | EXPIRADA AUTOMÁTICAMENTE: {DateTime.Now:dd/MM/yyyy HH:mm} ({diasVencida} días de vencimiento)";
                    
                    cantidadActualizadas++;

                    _logger.LogInformation("📅 Proforma expirada automáticamente: {NumeroFactura} - Vencía: {FechaVencimiento} ({Dias} días)", 
                        proforma.NumeroFactura, proforma.FechaVencimiento, diasVencida);
                }

                if (cantidadActualizadas > 0)
                {
                    await context.SaveChangesAsync();
                    _logger.LogInformation("✅ Verificación automática completada: {Cantidad} proformas marcadas como expiradas", 
                        cantidadActualizadas);
                }
                else
                {
                    _logger.LogInformation("✅ Verificación automática completada: No hay proformas por expirar");
                }

                // Registrar estadísticas en log
                var estadisticas = await ObtenerEstadisticasProformas(context);
                _logger.LogInformation("📊 Estadísticas de proformas: Vigentes: {Vigentes}, Expiradas: {Expiradas}, Convertidas: {Convertidas}, Facturadas: {Facturadas}", 
                    estadisticas.Vigentes, estadisticas.Expiradas, estadisticas.Convertidas, estadisticas.Facturadas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error durante la verificación automática de proformas");
                throw;
            }
        }

        private async Task<(int Vigentes, int Expiradas, int Convertidas, int Facturadas)> ObtenerEstadisticasProformas(TucoContext context)
        {
            var estadisticas = await context.Facturas
                .Where(f => f.TipoDocumento == "Proforma")
                .GroupBy(f => f.Estado)
                .Select(g => new { Estado = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            return (
                Vigentes: estadisticas.FirstOrDefault(e => e.Estado == "Vigente")?.Cantidad ?? 0,
                Expiradas: estadisticas.FirstOrDefault(e => e.Estado == "Expirada")?.Cantidad ?? 0,
                Convertidas: estadisticas.FirstOrDefault(e => e.Estado == "Convertida")?.Cantidad ?? 0,
                Facturadas: estadisticas.FirstOrDefault(e => e.Estado == "Facturada")?.Cantidad ?? 0
            );
        }

        private DateTime CalcularProximaEjecucion()
        {
            var ahora = DateTime.Now;
            var proximaEjecucion = new DateTime(ahora.Year, ahora.Month, ahora.Day, 2, 0, 0); // 2:00 AM

            // Si ya pasaron las 2:00 AM de hoy, programar para mañana
            if (ahora.Hour >= 2)
            {
                proximaEjecucion = proximaEjecucion.AddDays(1);
            }

            return proximaEjecucion;
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📅 Deteniendo servicio de verificación de proformas...");
            await base.StopAsync(stoppingToken);
        }
    }
}
