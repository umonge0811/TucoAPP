using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class FixAsignacionUsuarioOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AsignacionesUsuariosInventario_Usuarios_UsuarioId",
                table: "AsignacionesUsuariosInventario");

            migrationBuilder.DropForeignKey(
                name: "FK__Clientes__Usuari__5070F446",
                table: "Clientes");

            migrationBuilder.DropForeignKey(
                name: "FK__DetalleDo__Docum__619B8048",
                table: "DetalleDocumento");

            migrationBuilder.DropForeignKey(
                name: "FK__DetallePe__Pedid__6C190EBB",
                table: "DetallePedido");

            migrationBuilder.DropForeignKey(
                name: "FK__DetallePe__Produ__6D0D32F4",
                table: "DetallePedido");

            migrationBuilder.DropForeignKey(
                name: "FK__Documento__Clien__5629CD9C",
                table: "Documentos");

            migrationBuilder.DropForeignKey(
                name: "FK__Documento__Usuar__571DF1D5",
                table: "Documentos");

            migrationBuilder.DropForeignKey(
                name: "FK__Historial__Usuar__114A936A",
                table: "HistorialAcciones");

            migrationBuilder.DropForeignKey(
                name: "FK__ImagenesP__Produ__73BA3083",
                table: "ImagenesProducto");

            migrationBuilder.DropForeignKey(
                name: "FK__Inventari__Usuar__778AC167",
                table: "Inventarios");

            migrationBuilder.DropForeignKey(
                name: "FK__Llantas__Product__6FE99F9F",
                table: "Llantas");

            migrationBuilder.DropForeignKey(
                name: "FK_Notificaciones_Usuarios_UsuarioId",
                table: "Notificaciones");

            migrationBuilder.DropForeignKey(
                name: "FK__PedidosPr__Prove__68487DD7",
                table: "PedidosProveedor");

            migrationBuilder.DropForeignKey(
                name: "FK__PedidosPr__Usuar__693CA210",
                table: "PedidosProveedor");

            migrationBuilder.DropForeignKey(
                name: "FK__RolPermis__Permi__01142BA1",
                table: "RolPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK__RolPermis__RolID__00200768",
                table: "RolPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK_RolPermiso_Permiso",
                table: "RolPermisos");

            migrationBuilder.DropForeignKey(
                name: "FK_RolPermiso_Rol",
                table: "RolPermisos");

            migrationBuilder.DropForeignKey(
                name: "FK__SesionUsu__Usuar__08B54D69",
                table: "SesionUsuario");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioPermiso_Permisos_PermisoID",
                table: "UsuarioPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioPermiso_Usuarios_UsuarioID",
                table: "UsuarioPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK__UsuarioRo__RolID__04E4BC85",
                table: "UsuarioRol");

            migrationBuilder.DropForeignKey(
                name: "FK__UsuarioRo__Usuar__03F0984C",
                table: "UsuarioRol");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioRol_Rol",
                table: "UsuarioRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioRol_Usuario",
                table: "UsuarioRoles");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "InventariosProgramados",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaAsignacion",
                table: "AsignacionesUsuariosInventario",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddForeignKey(
                name: "FK_AsignacionesUsuariosInventario_Usuarios_UsuarioId",
                table: "AsignacionesUsuariosInventario",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__Clientes__Usuari__5070F446",
                table: "Clientes",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__DetalleDo__Docum__619B8048",
                table: "DetalleDocumento",
                column: "DocumentoID",
                principalTable: "Documentos",
                principalColumn: "DocumentoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__DetallePe__Pedid__6C190EBB",
                table: "DetallePedido",
                column: "PedidoID",
                principalTable: "PedidosProveedor",
                principalColumn: "PedidoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__DetallePe__Produ__6D0D32F4",
                table: "DetallePedido",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__Documento__Clien__5629CD9C",
                table: "Documentos",
                column: "ClienteID",
                principalTable: "Clientes",
                principalColumn: "ClienteID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__Documento__Usuar__571DF1D5",
                table: "Documentos",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__Historial__Usuar__114A936A",
                table: "HistorialAcciones",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__ImagenesP__Produ__73BA3083",
                table: "ImagenesProducto",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__Inventari__Usuar__778AC167",
                table: "Inventarios",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__Llantas__Product__6FE99F9F",
                table: "Llantas",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notificaciones_Usuarios_UsuarioId",
                table: "Notificaciones",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__PedidosPr__Prove__68487DD7",
                table: "PedidosProveedor",
                column: "ProveedorID",
                principalTable: "Proveedores",
                principalColumn: "ProveedorID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__PedidosPr__Usuar__693CA210",
                table: "PedidosProveedor",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__RolPermis__Permi__01142BA1",
                table: "RolPermiso",
                column: "PermisoID",
                principalTable: "Permisos",
                principalColumn: "PermisoID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__RolPermis__RolID__00200768",
                table: "RolPermiso",
                column: "RolID",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RolPermiso_Permiso",
                table: "RolPermisos",
                column: "PermisoID",
                principalTable: "Permisos",
                principalColumn: "PermisoID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RolPermiso_Rol",
                table: "RolPermisos",
                column: "RolID",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__SesionUsu__Usuar__08B54D69",
                table: "SesionUsuario",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioPermiso_Permisos_PermisoID",
                table: "UsuarioPermiso",
                column: "PermisoID",
                principalTable: "Permisos",
                principalColumn: "PermisoID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioPermiso_Usuarios_UsuarioID",
                table: "UsuarioPermiso",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__UsuarioRo__RolID__04E4BC85",
                table: "UsuarioRol",
                column: "RolID",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK__UsuarioRo__Usuar__03F0984C",
                table: "UsuarioRol",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioRol_Rol",
                table: "UsuarioRoles",
                column: "RolId",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioRol_Usuario",
                table: "UsuarioRoles",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AsignacionesUsuariosInventario_Usuarios_UsuarioId",
                table: "AsignacionesUsuariosInventario");

            migrationBuilder.DropForeignKey(
                name: "FK__Clientes__Usuari__5070F446",
                table: "Clientes");

            migrationBuilder.DropForeignKey(
                name: "FK__DetalleDo__Docum__619B8048",
                table: "DetalleDocumento");

            migrationBuilder.DropForeignKey(
                name: "FK__DetallePe__Pedid__6C190EBB",
                table: "DetallePedido");

            migrationBuilder.DropForeignKey(
                name: "FK__DetallePe__Produ__6D0D32F4",
                table: "DetallePedido");

            migrationBuilder.DropForeignKey(
                name: "FK__Documento__Clien__5629CD9C",
                table: "Documentos");

            migrationBuilder.DropForeignKey(
                name: "FK__Documento__Usuar__571DF1D5",
                table: "Documentos");

            migrationBuilder.DropForeignKey(
                name: "FK__Historial__Usuar__114A936A",
                table: "HistorialAcciones");

            migrationBuilder.DropForeignKey(
                name: "FK__ImagenesP__Produ__73BA3083",
                table: "ImagenesProducto");

            migrationBuilder.DropForeignKey(
                name: "FK__Inventari__Usuar__778AC167",
                table: "Inventarios");

            migrationBuilder.DropForeignKey(
                name: "FK__Llantas__Product__6FE99F9F",
                table: "Llantas");

            migrationBuilder.DropForeignKey(
                name: "FK_Notificaciones_Usuarios_UsuarioId",
                table: "Notificaciones");

            migrationBuilder.DropForeignKey(
                name: "FK__PedidosPr__Prove__68487DD7",
                table: "PedidosProveedor");

            migrationBuilder.DropForeignKey(
                name: "FK__PedidosPr__Usuar__693CA210",
                table: "PedidosProveedor");

            migrationBuilder.DropForeignKey(
                name: "FK__RolPermis__Permi__01142BA1",
                table: "RolPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK__RolPermis__RolID__00200768",
                table: "RolPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK_RolPermiso_Permiso",
                table: "RolPermisos");

            migrationBuilder.DropForeignKey(
                name: "FK_RolPermiso_Rol",
                table: "RolPermisos");

            migrationBuilder.DropForeignKey(
                name: "FK__SesionUsu__Usuar__08B54D69",
                table: "SesionUsuario");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioPermiso_Permisos_PermisoID",
                table: "UsuarioPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioPermiso_Usuarios_UsuarioID",
                table: "UsuarioPermiso");

            migrationBuilder.DropForeignKey(
                name: "FK__UsuarioRo__RolID__04E4BC85",
                table: "UsuarioRol");

            migrationBuilder.DropForeignKey(
                name: "FK__UsuarioRo__Usuar__03F0984C",
                table: "UsuarioRol");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioRol_Rol",
                table: "UsuarioRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioRol_Usuario",
                table: "UsuarioRoles");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "InventariosProgramados",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaAsignacion",
                table: "AsignacionesUsuariosInventario",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AddForeignKey(
                name: "FK_AsignacionesUsuariosInventario_Usuarios_UsuarioId",
                table: "AsignacionesUsuariosInventario",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__Clientes__Usuari__5070F446",
                table: "Clientes",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID");

            migrationBuilder.AddForeignKey(
                name: "FK__DetalleDo__Docum__619B8048",
                table: "DetalleDocumento",
                column: "DocumentoID",
                principalTable: "Documentos",
                principalColumn: "DocumentoID");

            migrationBuilder.AddForeignKey(
                name: "FK__DetallePe__Pedid__6C190EBB",
                table: "DetallePedido",
                column: "PedidoID",
                principalTable: "PedidosProveedor",
                principalColumn: "PedidoID");

            migrationBuilder.AddForeignKey(
                name: "FK__DetallePe__Produ__6D0D32F4",
                table: "DetallePedido",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK__Documento__Clien__5629CD9C",
                table: "Documentos",
                column: "ClienteID",
                principalTable: "Clientes",
                principalColumn: "ClienteID");

            migrationBuilder.AddForeignKey(
                name: "FK__Documento__Usuar__571DF1D5",
                table: "Documentos",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID");

            migrationBuilder.AddForeignKey(
                name: "FK__Historial__Usuar__114A936A",
                table: "HistorialAcciones",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__ImagenesP__Produ__73BA3083",
                table: "ImagenesProducto",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK__Inventari__Usuar__778AC167",
                table: "Inventarios",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID");

            migrationBuilder.AddForeignKey(
                name: "FK__Llantas__Product__6FE99F9F",
                table: "Llantas",
                column: "ProductoID",
                principalTable: "Productos",
                principalColumn: "ProductoID");

            migrationBuilder.AddForeignKey(
                name: "FK_Notificaciones_Usuarios_UsuarioId",
                table: "Notificaciones",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__PedidosPr__Prove__68487DD7",
                table: "PedidosProveedor",
                column: "ProveedorID",
                principalTable: "Proveedores",
                principalColumn: "ProveedorID");

            migrationBuilder.AddForeignKey(
                name: "FK__PedidosPr__Usuar__693CA210",
                table: "PedidosProveedor",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID");

            migrationBuilder.AddForeignKey(
                name: "FK__RolPermis__Permi__01142BA1",
                table: "RolPermiso",
                column: "PermisoID",
                principalTable: "Permisos",
                principalColumn: "PermisoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__RolPermis__RolID__00200768",
                table: "RolPermiso",
                column: "RolID",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RolPermiso_Permiso",
                table: "RolPermisos",
                column: "PermisoID",
                principalTable: "Permisos",
                principalColumn: "PermisoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RolPermiso_Rol",
                table: "RolPermisos",
                column: "RolID",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__SesionUsu__Usuar__08B54D69",
                table: "SesionUsuario",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID");

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioPermiso_Permisos_PermisoID",
                table: "UsuarioPermiso",
                column: "PermisoID",
                principalTable: "Permisos",
                principalColumn: "PermisoID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioPermiso_Usuarios_UsuarioID",
                table: "UsuarioPermiso",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__UsuarioRo__RolID__04E4BC85",
                table: "UsuarioRol",
                column: "RolID",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK__UsuarioRo__Usuar__03F0984C",
                table: "UsuarioRol",
                column: "UsuarioID",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioRol_Rol",
                table: "UsuarioRoles",
                column: "RolId",
                principalTable: "Roles",
                principalColumn: "RolID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioRol_Usuario",
                table: "UsuarioRoles",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
