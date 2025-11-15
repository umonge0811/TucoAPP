using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AgregarMovimientoPostCorteIdAAlertas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MovimientoPostCorteId",
                table: "AlertasInventario",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInventario_MovimientoPostCorteId",
                table: "AlertasInventario",
                column: "MovimientoPostCorteId");

            migrationBuilder.AddForeignKey(
                name: "FK_AlertasInventario_MovimientosPostCorte_MovimientoPostCorteId",
                table: "AlertasInventario",
                column: "MovimientoPostCorteId",
                principalTable: "MovimientosPostCorte",
                principalColumn: "MovimientoPostCorteId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AlertasInventario_MovimientosPostCorte_MovimientoPostCorteId",
                table: "AlertasInventario");

            migrationBuilder.DropIndex(
                name: "IX_AlertasInventario_MovimientoPostCorteId",
                table: "AlertasInventario");

            migrationBuilder.DropColumn(
                name: "MovimientoPostCorteId",
                table: "AlertasInventario");
        }
    }
}
