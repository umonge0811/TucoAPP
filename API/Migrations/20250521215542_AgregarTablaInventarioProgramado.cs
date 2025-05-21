using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTablaInventarioProgramado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__AlertasIn__Produ__0D7A0286",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "Descripcion",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "FechaAlerta",
                table: "AlertasInventario");

            migrationBuilder.RenameColumn(
                name: "ProductoID",
                table: "AlertasInventario",
                newName: "ProductoId");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventario_ProductoID",
                table: "AlertasInventario",
                newName: "IX_AlertasInventario_ProductoId");

            migrationBuilder.AlterColumn<string>(
                name: "TipoAlerta",
                table: "AlertasInventario",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldUnicode: false,
                oldMaxLength: 50,
                oldNullable: true,
                oldDefaultValue: "Inventario Bajo");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCreacion",
                table: "AlertasInventario",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "(getdate())");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaLectura",
                table: "AlertasInventario",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InventarioProgramadoID",
                table: "AlertasInventario",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "Leida",
                table: "AlertasInventario",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Mensaje",
                table: "AlertasInventario",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "UsuarioID",
                table: "AlertasInventario",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "InventariosProgramados",
                columns: table => new
                {
                    InventarioProgramadoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoInventario = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioCreadorId = table.Column<int>(type: "int", nullable: false),
                    UbicacionEspecifica = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IncluirStockBajo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventariosProgramados", x => x.InventarioProgramadoId);
                    table.ForeignKey(
                        name: "FK_InventariosProgramados_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AsignacionesUsuariosInventario",
                columns: table => new
                {
                    AsignacionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InventarioProgramadoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    PermisoConteo = table.Column<bool>(type: "bit", nullable: false),
                    PermisoAjuste = table.Column<bool>(type: "bit", nullable: false),
                    PermisoValidacion = table.Column<bool>(type: "bit", nullable: false),
                    FechaAsignacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AsignacionesUsuariosInventario", x => x.AsignacionId);
                    table.ForeignKey(
                        name: "FK_AsignacionesUsuariosInventario_InventariosProgramados_InventarioProgramadoId",
                        column: x => x.InventarioProgramadoId,
                        principalTable: "InventariosProgramados",
                        principalColumn: "InventarioProgramadoId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AsignacionesUsuariosInventario_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UsuarioConteoId = table.Column<int>(type: "int", nullable: true),
                    FechaConteo = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetallesInventarioProgramado", x => x.DetalleId);
                    table.ForeignKey(
                        name: "FK_DetallesInventarioProgramado_InventariosProgramados_InventarioProgramadoId",
                        column: x => x.InventarioProgramadoId,
                        principalTable: "InventariosProgramados",
                        principalColumn: "InventarioProgramadoId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DetallesInventarioProgramado_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "ProductoID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DetallesInventarioProgramado_Usuarios_UsuarioConteoId",
                        column: x => x.UsuarioConteoId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInventario_InventarioProgramadoID",
                table: "AlertasInventario",
                column: "InventarioProgramadoID");

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInventario_UsuarioID",
                table: "AlertasInventario",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_AsignacionesUsuariosInventario_InventarioProgramadoId_UsuarioId",
                table: "AsignacionesUsuariosInventario",
                columns: new[] { "InventarioProgramadoId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AsignacionesUsuariosInventario_UsuarioId",
                table: "AsignacionesUsuariosInventario",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesInventarioProgramado_InventarioProgramadoId",
                table: "DetallesInventarioProgramado",
                column: "InventarioProgramadoId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesInventarioProgramado_ProductoId",
                table: "DetallesInventarioProgramado",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesInventarioProgramado_UsuarioConteoId",
                table: "DetallesInventarioProgramado",
                column: "UsuarioConteoId");

            migrationBuilder.CreateIndex(
                name: "IX_InventariosProgramados_UsuarioCreadorId",
                table: "InventariosProgramados",
                column: "UsuarioCreadorId");

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventario_InventariosProgramados",
                table: "AlertasInventario",
                column: "InventarioProgramadoID",
                principalTable: "InventariosProgramados",
                principalColumn: "InventarioProgramadoId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventario_Productos_ProductoId",
                table: "AlertasInventario",
                column: "ProductoId",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventario_Usuarios",
                table: "AlertasInventario",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventario_InventariosProgramados",
                table: "AlertasInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventario_Productos_ProductoId",
                table: "AlertasInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventario_Usuarios",
                table: "AlertasInventario");

            migrationBuilder.DropTable(
                name: "AsignacionesUsuariosInventario");

            migrationBuilder.DropTable(
                name: "DetallesInventarioProgramado");

            migrationBuilder.DropTable(
                name: "InventariosProgramados");

            migrationBuilder.DropIndex(
                name: "IX_AlertasInventario_InventarioProgramadoID",
                table: "AlertasInventario");

            migrationBuilder.DropIndex(
                name: "IX_AlertasInventario_UsuarioID",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "FechaCreacion",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "FechaLectura",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "InventarioProgramadoID",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "Leida",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "Mensaje",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "UsuarioID",
                table: "AlertasInventario");

            migrationBuilder.RenameColumn(
                name: "ProductoId",
                table: "AlertasInventario",
                newName: "ProductoID");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventario_ProductoId",
                table: "AlertasInventario",
                newName: "IX_AlertasInventario_ProductoID");

            migrationBuilder.AlterColumn<string>(
                name: "TipoAlerta",
                table: "AlertasInventario",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true,
                defaultValue: "Inventario Bajo",
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldUnicode: false,
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "Descripcion",
                table: "AlertasInventario",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAlerta",
                table: "AlertasInventario",
                type: "datetime",
                nullable: true,
                defaultValueSql: "(getdate())");

            migrationBuilder.AddForeignKey(
                name: "FK__AlertasIn__Produ__0D7A0286",
                table: "AlertasInventario",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID");
        }
    }
}
