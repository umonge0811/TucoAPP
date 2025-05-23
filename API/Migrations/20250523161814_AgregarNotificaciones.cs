using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AgregarNotificaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertasInventarioProgramado");

            migrationBuilder.CreateTable(
                name: "AlertasInvProgramado",
                columns: table => new
                {
                    AlertaId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InventarioProgramadoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    TipoAlerta = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Mensaje = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Leida = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaLectura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProductoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertasInvProgramado", x => x.AlertaId);
                    table.ForeignKey(
                        name: "FK_AlertasInvProgramado_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                    table.ForeignKey(
                        name: "FK_AlertasInvProgramado_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notificaciones",
                columns: table => new
                {
                    NotificacionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Mensaje = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Icono = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Leida = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    FechaLectura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EntidadTipo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EntidadId = table.Column<int>(type: "int", nullable: true),
                    UrlAccion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.NotificacionId);
                    table.ForeignKey(
                        name: "FK_Notificaciones_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInvProgramado_ProductoId",
                table: "AlertasInvProgramado",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInvProgramado_UsuarioId",
                table: "AlertasInvProgramado",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_UsuarioId",
                table: "Notificaciones",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertasInvProgramado");

            migrationBuilder.DropTable(
                name: "Notificaciones");

            migrationBuilder.CreateTable(
                name: "AlertasInventarioProgramado",
                columns: table => new
                {
                    AlertaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InventarioProgramadoID = table.Column<int>(type: "int", nullable: false),
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    FechaLectura = table.Column<DateTime>(type: "datetime", nullable: true),
                    Leida = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Mensaje = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: true),
                    TipoAlerta = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertasInventarioProgramado", x => x.AlertaID);
                    table.ForeignKey(
                        name: "FK_AlertasInventarioProgramado_InventariosProgramados",
                        column: x => x.InventarioProgramadoID,
                        principalTable: "InventariosProgramados",
                        principalColumn: "InventarioProgramadoId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AlertasInventarioProgramado_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                    table.ForeignKey(
                        name: "FK_AlertasInventarioProgramado_Usuarios",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInventarioProgramado_InventarioProgramadoID",
                table: "AlertasInventarioProgramado",
                column: "InventarioProgramadoID");

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInventarioProgramado_ProductoId",
                table: "AlertasInventarioProgramado",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInventarioProgramado_UsuarioID",
                table: "AlertasInventarioProgramado",
                column: "UsuarioID");
        }
    }
}
