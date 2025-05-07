using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Permisos",
                columns: table => new
                {
                    PermisoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombrePermiso = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    DescripcionPermiso = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Permisos__96E0C7039B9EC879", x => x.PermisoID);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    ProductoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreProducto = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: true),
                    Precio = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    CantidadEnInventario = table.Column<int>(type: "int", nullable: true),
                    FechaUltimaActualizacion = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    StockMinimo = table.Column<int>(type: "int", nullable: true, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Producto__A430AE83EF23006D", x => x.ProductoID);
                });

            migrationBuilder.CreateTable(
                name: "Proveedores",
                columns: table => new
                {
                    ProveedorID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreProveedor = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    Contacto = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "varchar(15)", unicode: false, maxLength: 15, nullable: true),
                    Direccion = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Proveedo__61266BB9FB5386BA", x => x.ProveedorID);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RolID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreRol = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    DescripcionRol = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Roles__F92302D1A69BD34A", x => x.RolID);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    UsuarioID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreUsuario = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    Contrasena = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    FechaExpiracionToken = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PropositoToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: true, defaultValue: true),
                    Token = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Usuarios__2B3DE79898DC7E39", x => x.UsuarioID);
                });

            migrationBuilder.CreateTable(
                name: "AlertasInventario",
                columns: table => new
                {
                    AlertaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductoID = table.Column<int>(type: "int", nullable: true),
                    FechaAlerta = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    TipoAlerta = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true, defaultValue: "Inventario Bajo"),
                    Descripcion = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AlertasI__D9EF47E5A95249BE", x => x.AlertaID);
                    table.ForeignKey(
                        name: "FK__AlertasIn__Produ__0D7A0286",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                });

            migrationBuilder.CreateTable(
                name: "ImagenesProducto",
                columns: table => new
                {
                    ImagenID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductoID = table.Column<int>(type: "int", nullable: true),
                    URLImagen = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    Descripcion = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Imagenes__0C7D20D7D167D268", x => x.ImagenID);
                    table.ForeignKey(
                        name: "FK__ImagenesP__Produ__73BA3083",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                });

            migrationBuilder.CreateTable(
                name: "Llantas",
                columns: table => new
                {
                    LlantaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductoID = table.Column<int>(type: "int", nullable: true),
                    Ancho = table.Column<int>(type: "int", nullable: true),
                    Perfil = table.Column<int>(type: "int", nullable: true),
                    Diametro = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    Marca = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    Modelo = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    Capas = table.Column<int>(type: "int", nullable: true),
                    IndiceVelocidad = table.Column<string>(type: "varchar(5)", unicode: false, maxLength: 5, nullable: true),
                    TipoTerreno = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Llantas__921046DE2E400DE2", x => x.LlantaID);
                    table.ForeignKey(
                        name: "FK__Llantas__Product__6FE99F9F",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                });

            migrationBuilder.CreateTable(
                name: "RolPermiso",
                columns: table => new
                {
                    RolID = table.Column<int>(type: "int", nullable: false),
                    PermisoID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RolPermi__D04D0EA1C1E00D6C", x => new { x.RolID, x.PermisoID });
                    table.ForeignKey(
                        name: "FK__RolPermis__Permi__01142BA1",
                        column: x => x.PermisoID,
                        principalTable: "Permisos",
                        principalColumn: "PermisoID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__RolPermis__RolID__00200768",
                        column: x => x.RolID,
                        principalTable: "Roles",
                        principalColumn: "RolID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RolPermisos",
                columns: table => new
                {
                    RolID = table.Column<int>(type: "int", nullable: false),
                    PermisoID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolPermiso", x => new { x.RolID, x.PermisoID });
                    table.ForeignKey(
                        name: "FK_RolPermiso_Permiso",
                        column: x => x.PermisoID,
                        principalTable: "Permisos",
                        principalColumn: "PermisoID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolPermiso_Rol",
                        column: x => x.RolID,
                        principalTable: "Roles",
                        principalColumn: "RolID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    ClienteID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreCliente = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    Contacto = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    Direccion = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    Email = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "varchar(15)", unicode: false, maxLength: 15, nullable: true),
                    UsuarioID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Clientes__71ABD0A797637CA5", x => x.ClienteID);
                    table.ForeignKey(
                        name: "FK__Clientes__Usuari__5070F446",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID");
                });

            migrationBuilder.CreateTable(
                name: "HistorialAcciones",
                columns: table => new
                {
                    HistorialID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    FechaAccion = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    TipoAccion = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    Modulo = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    Detalle = table.Column<string>(type: "text", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PropositoToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstadoAccion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ErrorDetalle = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Historia__975206EFBF27118C", x => x.HistorialID);
                    table.ForeignKey(
                        name: "FK__Historial__Usuar__114A936A",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Inventarios",
                columns: table => new
                {
                    InventarioID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaProgramada = table.Column<DateTime>(type: "datetime", nullable: false),
                    FechaRealizacion = table.Column<DateTime>(type: "datetime", nullable: true),
                    FechaReprogramada = table.Column<DateTime>(type: "datetime", nullable: true),
                    Estado = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true, defaultValue: "Programado"),
                    UsuarioID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Inventar__FB8A24B76FBF2391", x => x.InventarioID);
                    table.ForeignKey(
                        name: "FK__Inventari__Usuar__778AC167",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID");
                });

            migrationBuilder.CreateTable(
                name: "PedidosProveedor",
                columns: table => new
                {
                    PedidoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProveedorID = table.Column<int>(type: "int", nullable: true),
                    FechaPedido = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    Estado = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    UsuarioID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__PedidosP__09BA1410FD24CC54", x => x.PedidoID);
                    table.ForeignKey(
                        name: "FK__PedidosPr__Prove__68487DD7",
                        column: x => x.ProveedorID,
                        principalTable: "Proveedores",
                        principalColumn: "ProveedorID");
                    table.ForeignKey(
                        name: "FK__PedidosPr__Usuar__693CA210",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID");
                });

            migrationBuilder.CreateTable(
                name: "SesionUsuario",
                columns: table => new
                {
                    SesionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioID = table.Column<int>(type: "int", nullable: true),
                    FechaHoraInicio = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__SesionUs__52FD7C064728ED7A", x => x.SesionID);
                    table.ForeignKey(
                        name: "FK__SesionUsu__Usuar__08B54D69",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID");
                });

            migrationBuilder.CreateTable(
                name: "UsuarioPermiso",
                columns: table => new
                {
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    PermisoID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioPermiso", x => new { x.UsuarioID, x.PermisoID });
                    table.ForeignKey(
                        name: "FK_UsuarioPermiso_Permisos_PermisoID",
                        column: x => x.PermisoID,
                        principalTable: "Permisos",
                        principalColumn: "PermisoID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioPermiso_Usuarios_UsuarioID",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioRol",
                columns: table => new
                {
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    RolID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__UsuarioR__24AFD7B5C119E3DC", x => new { x.UsuarioID, x.RolID });
                    table.ForeignKey(
                        name: "FK__UsuarioRo__RolID__04E4BC85",
                        column: x => x.RolID,
                        principalTable: "Roles",
                        principalColumn: "RolID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__UsuarioRo__Usuar__03F0984C",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioRoles",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    RolId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioRol", x => new { x.UsuarioId, x.RolId });
                    table.ForeignKey(
                        name: "FK_UsuarioRol_Rol",
                        column: x => x.RolId,
                        principalTable: "Roles",
                        principalColumn: "RolID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioRol_Usuario",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Documentos",
                columns: table => new
                {
                    DocumentoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteID = table.Column<int>(type: "int", nullable: true),
                    EsProforma = table.Column<bool>(type: "bit", nullable: true, defaultValue: true),
                    Estado = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true, defaultValue: "Activo"),
                    FechaDocumento = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime", nullable: true),
                    Subtotal = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Impuestos = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Total = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    UsuarioID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Document__5DDBFF96B142C5D1", x => x.DocumentoID);
                    table.ForeignKey(
                        name: "FK__Documento__Clien__5629CD9C",
                        column: x => x.ClienteID,
                        principalTable: "Clientes",
                        principalColumn: "ClienteID");
                    table.ForeignKey(
                        name: "FK__Documento__Usuar__571DF1D5",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID");
                });

            migrationBuilder.CreateTable(
                name: "DetalleInventario",
                columns: table => new
                {
                    DetalleInventarioID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InventarioID = table.Column<int>(type: "int", nullable: true),
                    ProductoID = table.Column<int>(type: "int", nullable: true),
                    CantidadRegistrada = table.Column<int>(type: "int", nullable: true),
                    CantidadContada = table.Column<int>(type: "int", nullable: true),
                    Diferencia = table.Column<int>(type: "int", nullable: true, computedColumnSql: "([CantidadContada]-[CantidadRegistrada])", stored: false),
                    Comentario = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DetalleI__C8A00126F5F24ACE", x => x.DetalleInventarioID);
                    table.ForeignKey(
                        name: "FK__DetalleIn__Inven__7A672E12",
                        column: x => x.InventarioID,
                        principalTable: "Inventarios",
                        principalColumn: "InventarioID");
                    table.ForeignKey(
                        name: "FK__DetalleIn__Produ__7B5B524B",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                });

            migrationBuilder.CreateTable(
                name: "DetallePedido",
                columns: table => new
                {
                    DetalleID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoID = table.Column<int>(type: "int", nullable: true),
                    ProductoID = table.Column<int>(type: "int", nullable: true),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(10,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DetalleP__6E19D6FA14200334", x => x.DetalleID);
                    table.ForeignKey(
                        name: "FK__DetallePe__Pedid__6C190EBB",
                        column: x => x.PedidoID,
                        principalTable: "PedidosProveedor",
                        principalColumn: "PedidoID");
                    table.ForeignKey(
                        name: "FK__DetallePe__Produ__6D0D32F4",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                });

            migrationBuilder.CreateTable(
                name: "DetalleDocumento",
                columns: table => new
                {
                    DetalleID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentoID = table.Column<int>(type: "int", nullable: true),
                    ProductoID = table.Column<int>(type: "int", nullable: true),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Descuento = table.Column<decimal>(type: "decimal(10,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DetalleD__6E19D6FA7BF4A9E6", x => x.DetalleID);
                    table.ForeignKey(
                        name: "FK__DetalleDo__Docum__619B8048",
                        column: x => x.DocumentoID,
                        principalTable: "Documentos",
                        principalColumn: "DocumentoID");
                    table.ForeignKey(
                        name: "FK__DetalleDo__Produ__628FA481",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlertasInventario_ProductoID",
                table: "AlertasInventario",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_UsuarioID",
                table: "Clientes",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_DetalleDocumento_DocumentoID",
                table: "DetalleDocumento",
                column: "DocumentoID");

            migrationBuilder.CreateIndex(
                name: "IX_DetalleDocumento_ProductoID",
                table: "DetalleDocumento",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_DetalleInventario_InventarioID",
                table: "DetalleInventario",
                column: "InventarioID");

            migrationBuilder.CreateIndex(
                name: "IX_DetalleInventario_ProductoID",
                table: "DetalleInventario",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_DetallePedido_PedidoID",
                table: "DetallePedido",
                column: "PedidoID");

            migrationBuilder.CreateIndex(
                name: "IX_DetallePedido_ProductoID",
                table: "DetallePedido",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_Documentos_ClienteID",
                table: "Documentos",
                column: "ClienteID");

            migrationBuilder.CreateIndex(
                name: "IX_Documentos_UsuarioID",
                table: "Documentos",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_HistorialAcciones_UsuarioID",
                table: "HistorialAcciones",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_ImagenesProducto_ProductoID",
                table: "ImagenesProducto",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_Inventarios_UsuarioID",
                table: "Inventarios",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_Llantas_ProductoID",
                table: "Llantas",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_PedidosProveedor_ProveedorID",
                table: "PedidosProveedor",
                column: "ProveedorID");

            migrationBuilder.CreateIndex(
                name: "IX_PedidosProveedor_UsuarioID",
                table: "PedidosProveedor",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_RolPermiso_PermisoID",
                table: "RolPermiso",
                column: "PermisoID");

            migrationBuilder.CreateIndex(
                name: "IX_RolPermisos_PermisoID",
                table: "RolPermisos",
                column: "PermisoID");

            migrationBuilder.CreateIndex(
                name: "IX_SesionUsuario_UsuarioID",
                table: "SesionUsuario",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioPermiso_PermisoID",
                table: "UsuarioPermiso",
                column: "PermisoID");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioRol_RolID",
                table: "UsuarioRol",
                column: "RolID");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioRoles_RolId",
                table: "UsuarioRoles",
                column: "RolId");

            migrationBuilder.CreateIndex(
                name: "UQ__Usuarios__A9D105346078450B",
                table: "Usuarios",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertasInventario");

            migrationBuilder.DropTable(
                name: "DetalleDocumento");

            migrationBuilder.DropTable(
                name: "DetalleInventario");

            migrationBuilder.DropTable(
                name: "DetallePedido");

            migrationBuilder.DropTable(
                name: "HistorialAcciones");

            migrationBuilder.DropTable(
                name: "ImagenesProducto");

            migrationBuilder.DropTable(
                name: "Llantas");

            migrationBuilder.DropTable(
                name: "RolPermiso");

            migrationBuilder.DropTable(
                name: "RolPermisos");

            migrationBuilder.DropTable(
                name: "SesionUsuario");

            migrationBuilder.DropTable(
                name: "UsuarioPermiso");

            migrationBuilder.DropTable(
                name: "UsuarioRol");

            migrationBuilder.DropTable(
                name: "UsuarioRoles");

            migrationBuilder.DropTable(
                name: "Documentos");

            migrationBuilder.DropTable(
                name: "Inventarios");

            migrationBuilder.DropTable(
                name: "PedidosProveedor");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Permisos");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "Proveedores");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
