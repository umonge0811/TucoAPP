using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class CrearInventarioProgramadoManual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Crear tabla InventariosProgramados
            migrationBuilder.CreateTable(
                name: "InventariosProgramados",
                columns: table => new
                {
                    InventarioProgramadoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoInventario = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UsuarioCreadorId = table.Column<int>(type: "int", nullable: false),
                    UbicacionEspecifica = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IncluirStockBajo = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventariosProgramados", x => x.InventarioProgramadoId);
                });

            // 2. Crear tabla AsignacionesUsuariosInventario
            migrationBuilder.CreateTable(
                name: "AsignacionesUsuariosInventario",
                columns: table => new
                {
                    AsignacionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InventarioProgramadoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    PermisoConteo = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    PermisoAjuste = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    PermisoValidacion = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    FechaAsignacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AsignacionesUsuariosInventario", x => x.AsignacionId);
                });

            // 3. Crear tabla DetallesInventarioProgramado
            migrationBuilder.CreateTable(
                name: "DetallesInventarioProgramado",
                columns: table => new
                {
                    DetalleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InventarioProgramadoId = table.Column<int>(type: "int", nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: false),
                    CantidadSistema = table.Column<int>(type: "int", nullable: false),
                    CantidadFisica = table.Column<int>(type: "int", nullable: true),
                    Diferencia = table.Column<int>(type: "int", nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UsuarioConteoId = table.Column<int>(type: "int", nullable: true),
                    FechaConteo = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetallesInventarioProgramado", x => x.DetalleId);
                });

            // 4. Crear tabla Notificaciones
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
                    Leida = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    FechaLectura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Icono = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EntidadTipo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EntidadId = table.Column<int>(type: "int", nullable: true),
                    UrlAccion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.NotificacionId);
                });

            // 5. Crear índices
            migrationBuilder.CreateIndex(
                name: "IX_AsignacionesUsuariosInventario_InventarioProgramadoId_UsuarioId",
                table: "AsignacionesUsuariosInventario",
                columns: new[] { "InventarioProgramadoId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AsignacionesUsuariosInventario_UsuarioId",
                table: "AsignacionesUsuariosInventario",
                column: "UsuarioId");

            // 6. Agregar Foreign Keys con NO ACTION
            migrationBuilder.AddForeignKey(
                name: "FK_InventariosProgramados_Usuarios_UsuarioCreadorId",
                table: "InventariosProgramados",
                column: "UsuarioCreadorId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_AsignacionesUsuariosInventario_InventariosProgramados_InventarioProgramadoId",
                table: "AsignacionesUsuariosInventario",
                column: "InventarioProgramadoId",
                principalTable: "InventariosProgramados",
                principalColumn: "InventarioProgramadoId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AsignacionesUsuariosInventario_Usuarios_UsuarioId",
                table: "AsignacionesUsuariosInventario",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_DetallesInventarioProgramado_InventariosProgramados_InventarioProgramadoId",
                table: "DetallesInventarioProgramado",
                column: "InventarioProgramadoId",
                principalTable: "InventariosProgramados",
                principalColumn: "InventarioProgramadoId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DetallesInventarioProgramado_Productos_ProductoId",
                table: "DetallesInventarioProgramado",
                column: "ProductoId",
                principalTable: "Productos",
                principalColumn: "ProductoID",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Notificaciones_Usuarios_UsuarioId",
                table: "Notificaciones",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Notificaciones");
            migrationBuilder.DropTable(name: "DetallesInventarioProgramado");
            migrationBuilder.DropTable(name: "AsignacionesUsuariosInventario");
            migrationBuilder.DropTable(name: "InventariosProgramados");
        }
    }
}