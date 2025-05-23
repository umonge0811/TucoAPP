using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class RepAlertas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventarioProgramado_Usuarios",
                table: "AlertasInventarioProgramado");

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventarioProgramado_Usuarios",
                table: "AlertasInventarioProgramado",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventarioProgramado_Usuarios",
                table: "AlertasInventarioProgramado");

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventarioProgramado_Usuarios",
                table: "AlertasInventarioProgramado",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
