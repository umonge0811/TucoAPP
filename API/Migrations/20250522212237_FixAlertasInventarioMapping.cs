using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class FixAlertasInventarioMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropForeignKey(
                name: "FK__DetalleDo__Produ__628FA481",
                table: "DetalleDocumento");

            migrationBuilder.DropForeignKey(
                name: "FK__DetalleIn__Inven__7A672E12",
                table: "DetalleInventario");

            migrationBuilder.DropForeignKey(
                name: "FK__DetalleIn__Produ__7B5B524B",
                table: "DetalleInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_DetallesInventarioProgramado_Productos_ProductoId",
                table: "DetallesInventarioProgramado");

            migrationBuilder.DropForeignKey(
                name: "FK_DetallesInventarioProgramado_Usuarios_UsuarioConteoId",
                table: "DetallesInventarioProgramado");

            migrationBuilder.DropPrimaryKey(
                name: "PK__DetalleI__C8A00126F5F24ACE",
                table: "DetalleInventario");

            migrationBuilder.DropPrimaryKey(
                name: "PK__AlertasI__D9EF47E5A95249BE",
                table: "AlertasInventario");

            migrationBuilder.RenameTable(
                name: "DetalleInventario",
                newName: "DetalleInventarios");

            migrationBuilder.RenameTable(
                name: "AlertasInventario",
                newName: "AlertasInventarioProgramado");

            migrationBuilder.RenameColumn(
                name: "ProductoID",
                table: "DetalleInventarios",
                newName: "ProductoId");

            migrationBuilder.RenameColumn(
                name: "InventarioID",
                table: "DetalleInventarios",
                newName: "InventarioId");

            migrationBuilder.RenameColumn(
                name: "DetalleInventarioID",
                table: "DetalleInventarios",
                newName: "DetalleInventarioId");

            migrationBuilder.RenameIndex(
                name: "IX_DetalleInventario_ProductoID",
                table: "DetalleInventarios",
                newName: "IX_DetalleInventarios_ProductoId");

            migrationBuilder.RenameIndex(
                name: "IX_DetalleInventario_InventarioID",
                table: "DetalleInventarios",
                newName: "IX_DetalleInventarios_InventarioId");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventario_UsuarioID",
                table: "AlertasInventarioProgramado",
                newName: "IX_AlertasInventarioProgramado_UsuarioID");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventario_ProductoId",
                table: "AlertasInventarioProgramado",
                newName: "IX_AlertasInventarioProgramado_ProductoId");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventario_InventarioProgramadoID",
                table: "AlertasInventarioProgramado",
                newName: "IX_AlertasInventarioProgramado_InventarioProgramadoID");

            migrationBuilder.AlterColumn<int>(
                name: "Diferencia",
                table: "DetalleInventarios",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true,
                oldComputedColumnSql: "([CantidadContada]-[CantidadRegistrada])");

            migrationBuilder.AlterColumn<string>(
                name: "Comentario",
                table: "DetalleInventarios",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TipoAlerta",
                table: "AlertasInventarioProgramado",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldUnicode: false,
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaLectura",
                table: "AlertasInventarioProgramado",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "AlertasInventarioProgramado",
                type: "datetime",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DetalleInventarios",
                table: "DetalleInventarios",
                column: "DetalleInventarioId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AlertasInventarioProgramado",
                table: "AlertasInventarioProgramado",
                column: "AlertaID");

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventarioProgramado_InventariosProgramados_InventarioProgramadoID",
                table: "AlertasInventarioProgramado",
                column: "InventarioProgramadoID",
                principalTable: "InventariosProgramados",
                principalColumn: "InventarioProgramadoId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventarioProgramado_Productos_ProductoId",
                table: "AlertasInventarioProgramado",
                column: "ProductoId",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventarioProgramado_Usuarios_UsuarioID",
                table: "AlertasInventarioProgramado",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DetalleDocumento_Productos_ProductoID",
                table: "DetalleDocumento",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK_DetalleInventarios_Inventarios_InventarioId",
                table: "DetalleInventarios",
                column: "InventarioId",
                principalTable: "Inventarios",
                principalColumn: "InventarioID");

            migrationBuilder.AddForeignKey(
                name: "FK_DetalleInventarios_Productos_ProductoId",
                table: "DetalleInventarios",
                column: "ProductoId",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK_DetallesInventarioProgramado_Productos_ProductoId",
                table: "DetallesInventarioProgramado",
                column: "ProductoId",
                principalTable: "Productos",
                principalColumn: "ProductoID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DetallesInventarioProgramado_Usuarios_UsuarioConteoId",
                table: "DetallesInventarioProgramado",
                column: "UsuarioConteoId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventarioProgramado_InventariosProgramados_InventarioProgramadoID",
                table: "AlertasInventarioProgramado");

            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventarioProgramado_Productos_ProductoId",
                table: "AlertasInventarioProgramado");

            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventarioProgramado_Usuarios_UsuarioID",
                table: "AlertasInventarioProgramado");

            migrationBuilder.DropForeignKey(
                name: "FK_DetalleDocumento_Productos_ProductoID",
                table: "DetalleDocumento");

            migrationBuilder.DropForeignKey(
                name: "FK_DetalleInventarios_Inventarios_InventarioId",
                table: "DetalleInventarios");

            migrationBuilder.DropForeignKey(
                name: "FK_DetalleInventarios_Productos_ProductoId",
                table: "DetalleInventarios");

            migrationBuilder.DropForeignKey(
                name: "FK_DetallesInventarioProgramado_Productos_ProductoId",
                table: "DetallesInventarioProgramado");

            migrationBuilder.DropForeignKey(
                name: "FK_DetallesInventarioProgramado_Usuarios_UsuarioConteoId",
                table: "DetallesInventarioProgramado");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DetalleInventarios",
                table: "DetalleInventarios");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AlertasInventarioProgramado",
                table: "AlertasInventarioProgramado");

            migrationBuilder.RenameTable(
                name: "DetalleInventarios",
                newName: "DetalleInventario");

            migrationBuilder.RenameTable(
                name: "AlertasInventarioProgramado",
                newName: "AlertasInventario");

            migrationBuilder.RenameColumn(
                name: "ProductoId",
                table: "DetalleInventario",
                newName: "ProductoID");

            migrationBuilder.RenameColumn(
                name: "InventarioId",
                table: "DetalleInventario",
                newName: "InventarioID");

            migrationBuilder.RenameColumn(
                name: "DetalleInventarioId",
                table: "DetalleInventario",
                newName: "DetalleInventarioID");

            migrationBuilder.RenameIndex(
                name: "IX_DetalleInventarios_ProductoId",
                table: "DetalleInventario",
                newName: "IX_DetalleInventario_ProductoID");

            migrationBuilder.RenameIndex(
                name: "IX_DetalleInventarios_InventarioId",
                table: "DetalleInventario",
                newName: "IX_DetalleInventario_InventarioID");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventarioProgramado_UsuarioID",
                table: "AlertasInventario",
                newName: "IX_AlertasInventario_UsuarioID");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventarioProgramado_ProductoId",
                table: "AlertasInventario",
                newName: "IX_AlertasInventario_ProductoId");

            migrationBuilder.RenameIndex(
                name: "IX_AlertasInventarioProgramado_InventarioProgramadoID",
                table: "AlertasInventario",
                newName: "IX_AlertasInventario_InventarioProgramadoID");

            migrationBuilder.AlterColumn<string>(
                name: "Comentario",
                table: "DetalleInventario",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TipoAlerta",
                table: "AlertasInventario",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaLectura",
                table: "AlertasInventario",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "AlertasInventario",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AlterColumn<int>(
                name: "Diferencia",
                table: "DetalleInventario",
                type: "int",
                nullable: true,
                computedColumnSql: "([CantidadContada]-[CantidadRegistrada])",
                stored: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK__DetalleI__C8A00126F5F24ACE",
                table: "DetalleInventario",
                column: "DetalleInventarioID");

            migrationBuilder.AddPrimaryKey(
                name: "PK__AlertasI__D9EF47E5A95249BE",
                table: "AlertasInventario",
                column: "AlertaID");

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

            migrationBuilder.AddForeignKey(
                name: "FK__DetalleDo__Produ__628FA481",
                table: "DetalleDocumento",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK__DetalleIn__Inven__7A672E12",
                table: "DetalleInventario",
                column: "InventarioID",
                principalTable: "Inventarios",
                principalColumn: "InventarioID");

            migrationBuilder.AddForeignKey(
                name: "FK__DetalleIn__Produ__7B5B524B",
                table: "DetalleInventario",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK_DetallesInventarioProgramado_Productos_ProductoId",
                table: "DetallesInventarioProgramado",
                column: "ProductoId",
                principalTable: "Productos",
                principalColumn: "ProductoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DetallesInventarioProgramado_Usuarios_UsuarioConteoId",
                table: "DetallesInventarioProgramado",
                column: "UsuarioConteoId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID");
        }
    }
}
