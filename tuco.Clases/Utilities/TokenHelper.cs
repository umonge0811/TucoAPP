namespace Tuco.Clases.Helpers
{
    public static class TokenHelper
    {
        /// <summary>
        /// Genera un token único basado en GUID.
        /// </summary>
        /// <returns>Un string que representa el token generado.</returns>
        public static string GenerarToken()
        {
            return Guid.NewGuid().ToString();
        }
    }
}
