using MailKit.Net.Smtp;
using MimeKit;
using MimeKit.Text;
using Microsoft.Extensions.Options;
using Tuco.Clases.Models.Emails;

namespace API.Services
{
    public class EmailService
    {
        private readonly EmailSettings _emailSettings;

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        /// <summary>
        /// Envía un correo electrónico.
        /// </summary>
        /// <param name="toEmail">Correo del destinatario</param>
        /// <param name="subject">Asunto del correo</param>
        /// <param name="htmlContent">Contenido en HTML</param>
        public async Task EnviarCorreoAsync(string toEmail, string subject, string htmlContent)
        {
            // Crear el mensaje de correo
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new TextPart(TextFormat.Html) { Text = htmlContent };

            // Configurar el cliente SMTP
            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, _emailSettings.EnableSSL);
                await client.AuthenticateAsync(_emailSettings.SenderEmail, _emailSettings.SenderPassword);
                await client.SendAsync(message);
            }
            catch (Exception ex)
            {
                // Manejar errores
                throw new InvalidOperationException($"Error enviando correo: {ex.Message}");
            }
            finally
            {
                await client.DisconnectAsync(true);
            }
        }
    }
}
