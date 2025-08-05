using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Org.BouncyCastle.Security;
using System;
using System.Collections.Generic;
using tuco.Clases.Models;
using Tuco.Clases.Enums;
using Tuco.Clases.Models;
using static iTextSharp.text.pdf.events.IndexEvents;

namespace API.Data;

public partial class TucoContext : DbContext
{

    private IConfiguration _configuration;


    public TucoContext(DbContextOptions<TucoContext> options, IConfiguration configuration)
        : base(options)
    {
        _configuration = configuration;
    }
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            optionsBuilder.UseSqlServer(connectionString);
        }
    }

    // Agregar esta línea donde están los otros DbSet
    public virtual DbSet<AjusteInventarioPendiente> AjustesInventarioPendientes { get; set; }

    public virtual DbSet<InventarioProgramado> InventariosProgramados { get; set; }

    public virtual DbSet<AsignacionUsuarioInventario> AsignacionesUsuariosInventario { get; set; }

    public virtual DbSet<DetalleInventarioProgramado> DetallesInventarioProgramado { get; set; }

    public virtual DbSet<Notificacion> Notificaciones { get; set; }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<DetalleDocumento> DetalleDocumentos { get; set; }

    public virtual DbSet<DetalleInventario> DetalleInventarios { get; set; }

    public virtual DbSet<DetallePedido> DetallePedidos { get; set; }

    public virtual DbSet<Documento> Documentos { get; set; }

    public DbSet<Factura> Facturas { get; set; }
    public DbSet<DetalleFactura> DetallesFactura { get; set; }
    public DbSet<DetallePago> DetallesPago { get; set; }

    public virtual DbSet<HistorialAcciones> HistorialAcciones { get; set; }

    public virtual DbSet<ImagenesProducto> ImagenesProductos { get; set; }

    public virtual DbSet<Inventario> Inventarios { get; set; }

    public virtual DbSet<Llanta> Llantas { get; set; }

    public virtual DbSet<PedidosProveedor> PedidosProveedores { get; set; }

    public virtual DbSet<Permiso> Permisos { get; set; }

    public virtual DbSet<Producto> Productos { get; set; }

    public virtual DbSet<Proveedore> Proveedores { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<SesionUsuario> SesionUsuario { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public DbSet<RolPermisoRE> RolPermisos { get; set; }

    public DbSet<UsuarioRolRE> UsuarioRoles { get; set; }

    public DbSet<UsuarioPermisoRE> UsuarioPermiso { get; set; }

    public DbSet<PendientesEntrega> PendientesEntrega { get; set; }

    public DbSet<NotaRapida> NotasRapidas { get; set; }

    public DbSet<Anuncio> Anuncios { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        // ✅ CONFIGURACIÓN DE AjustesInventarioPendientesd
        modelBuilder.Entity<AjusteInventarioPendiente>(entity =>
        {
            entity.HasKey(e => e.AjusteId);

            entity.ToTable("AjustesInventarioPendientes");

            entity.Property(e => e.TipoAjuste)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.MotivoAjuste)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Estado)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Pendiente");

            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("(getdate())");

            // Relaciones
            entity.HasOne(d => d.InventarioProgramado)
                .WithMany()
                .HasForeignKey(d => d.InventarioProgramadoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Usuario)
                .WithMany()
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        modelBuilder.Entity<Notificacion>(entity =>
        {
            entity.HasKey(e => e.NotificacionId);

            entity.Property(e => e.Titulo)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Mensaje)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Tipo)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Icono)
                .HasMaxLength(100);

            entity.Property(e => e.EntidadTipo)
                .HasMaxLength(100);

            entity.Property(e => e.UrlAccion)
                .HasMaxLength(500);

            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("(getdate())");

            // Relación con Usuario - CAMBIAR A Restrict para evitar cascadas múltiples
            entity.HasOne(d => d.Usuario)
                .WithMany()
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.ClienteId).HasName("PK__Clientes__71ABD0A797637CA5");

            entity.Property(e => e.ClienteId).HasColumnName("ClienteID");
            entity.Property(e => e.Contacto)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Direccion)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.NombreCliente)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Telefono)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Clientes)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__Clientes__Usuari__5070F446");
        });

        modelBuilder.Entity<DetalleDocumento>(entity =>
        {
            entity.HasKey(e => e.DetalleId).HasName("PK__DetalleD__6E19D6FA7BF4A9E6");

            entity.ToTable("DetalleDocumento");

            entity.Property(e => e.DetalleId).HasColumnName("DetalleID");
            entity.Property(e => e.Descuento).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.DocumentoId).HasColumnName("DocumentoID");
            entity.Property(e => e.PrecioUnitario).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.ProductoId).HasColumnName("ProductoID");

            entity.HasOne(d => d.Documento).WithMany(p => p.DetalleDocumentos)
                .HasForeignKey(d => d.DocumentoId)
                .OnDelete(DeleteBehavior.Cascade) // Esta puede mantenerse en Cascade
                .HasConstraintName("FK__DetalleDo__Docum__619B8048");
        });

        // Configuración para DetalleInventarioProgramado
        modelBuilder.Entity<DetalleInventarioProgramado>(entity =>
        {
            entity.ToTable("DetallesInventarioProgramado");

            entity.HasKey(e => e.DetalleId);

            entity.Property(e => e.DetalleId)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.InventarioProgramadoId)
                .IsRequired();

            entity.Property(e => e.ProductoId)
                .IsRequired();

            entity.Property(e => e.CantidadSistema)
                .IsRequired();

            entity.Property(e => e.Observaciones)
                .HasMaxLength(500);

            // Configurar relaciones
            entity.HasOne(d => d.InventarioProgramado)
                .WithMany(p => p.DetallesInventario)
                .HasForeignKey(d => d.InventarioProgramadoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.UsuarioConteo)
                .WithMany()
                .HasForeignKey(d => d.UsuarioConteoId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DetallePedido>(entity =>
        {
            entity.HasKey(e => e.DetalleId).HasName("PK__DetalleP__6E19D6FA14200334");

            entity.ToTable("DetallePedido");

            entity.Property(e => e.DetalleId).HasColumnName("DetalleID");
            entity.Property(e => e.PedidoId).HasColumnName("PedidoID");
            entity.Property(e => e.PrecioUnitario).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.ProductoId).HasColumnName("ProductoID");

            entity.HasOne(d => d.Pedido).WithMany(p => p.DetallePedidos)
                .HasForeignKey(d => d.PedidoId)
                .OnDelete(DeleteBehavior.Cascade) // Esta puede mantenerse
                .HasConstraintName("FK__DetallePe__Pedid__6C190EBB");

            entity.HasOne(d => d.Producto).WithMany(p => p.DetallePedidos)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__DetallePe__Produ__6D0D32F4");
        });

        modelBuilder.Entity<Documento>(entity =>
        {
            entity.HasKey(e => e.DocumentoId).HasName("PK__Document__5DDBFF96B142C5D1");

            entity.Property(e => e.DocumentoId).HasColumnName("DocumentoID");
            entity.Property(e => e.ClienteId).HasColumnName("ClienteID");
            entity.Property(e => e.EsProforma).HasDefaultValue(true);
            entity.Property(e => e.Estado)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("Activo");
            entity.Property(e => e.FechaDocumento)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.FechaVencimiento).HasColumnType("datetime");
            entity.Property(e => e.Impuestos).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Subtotal).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Total).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");

            entity.HasOne(d => d.Cliente).WithMany(p => p.Documentos)
                .HasForeignKey(d => d.ClienteId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__Documento__Clien__5629CD9C");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Documentos)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__Documento__Usuar__571DF1D5");
        });

        modelBuilder.Entity<HistorialAcciones>(entity =>
        {
            entity.HasKey(e => e.HistorialId).HasName("PK__Historia__975206EFBF27118C");

            entity.Property(e => e.HistorialId).HasColumnName("HistorialID");
            entity.Property(e => e.Detalle).HasColumnType("text");
            entity.Property(e => e.FechaAccion)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Modulo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.TipoAccion)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");

            entity.HasOne(d => d.Usuario).WithMany(p => p.HistorialAcciones)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__Historial__Usuar__114A936A");
        });

        modelBuilder.Entity<ImagenesProducto>(entity =>
        {
            entity.HasKey(e => e.ImagenId).HasName("PK__Imagenes__0C7D20D7D167D268");

            entity.ToTable("ImagenesProducto");

            entity.Property(e => e.ImagenId).HasColumnName("ImagenID");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ProductoId).HasColumnName("ProductoID");
            entity.Property(e => e.Urlimagen)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("URLImagen");

            entity.HasOne(d => d.Producto).WithMany(p => p.ImagenesProductos)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Cascade) // Esta puede mantenerse
                .HasConstraintName("FK__ImagenesP__Produ__73BA3083");
        });

        modelBuilder.Entity<Inventario>(entity =>
        {
            entity.HasKey(e => e.InventarioId).HasName("PK__Inventar__FB8A24B76FBF2391");

            entity.Property(e => e.InventarioId).HasColumnName("InventarioID");
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Programado");
            entity.Property(e => e.FechaProgramada).HasColumnType("datetime");
            entity.Property(e => e.FechaRealizacion).HasColumnType("datetime");
            entity.Property(e => e.FechaReprogramada).HasColumnType("datetime");
            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Inventarios)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__Inventari__Usuar__778AC167");
        });

        modelBuilder.Entity<Llanta>(entity =>
        {
            entity.HasKey(e => e.LlantaId).HasName("PK__Llantas__921046DE2E400DE2");

            entity.Property(e => e.LlantaId).HasColumnName("LlantaID");
            entity.Property(e => e.Diametro)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.IndiceVelocidad)
                .HasMaxLength(5)
                .IsUnicode(false);
            entity.Property(e => e.Marca)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Modelo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ProductoId).HasColumnName("ProductoID");
            entity.Property(e => e.TipoTerreno)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Producto).WithMany(p => p.Llanta)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Cascade) // Esta puede mantenerse
                .HasConstraintName("FK__Llantas__Product__6FE99F9F");
        });

        modelBuilder.Entity<PedidosProveedor>(entity =>
        {
            entity.HasKey(e => e.PedidoId).HasName("PK__PedidosP__09BA1410FD24CC54");

            entity.ToTable("PedidosProveedor");

            entity.Property(e => e.PedidoId).HasColumnName("PedidoID");
            entity.Property(e => e.Estado)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.FechaPedido)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ProveedorId).HasColumnName("ProveedorID");
            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");

            entity.HasOne(d => d.Proveedor).WithMany(p => p.PedidosProveedors)
                .HasForeignKey(d => d.ProveedorId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__PedidosPr__Prove__68487DD7");

            entity.HasOne(d => d.Usuario).WithMany(p => p.PedidosProveedors)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__PedidosPr__Usuar__693CA210");
        });

        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.HasKey(e => e.PermisoId).HasName("PK__Permisos__96E0C7039B9EC879");

            entity.Property(e => e.PermisoId).HasColumnName("PermisoID");
            entity.Property(e => e.DescripcionPermiso)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.NombrePermiso)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Modulo)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.ProductoId).HasName("PK__Producto__A430AE83EF23006D");

            entity.Property(e => e.ProductoId).HasColumnName("ProductoID");

            entity.Property(e => e.Descripcion).HasColumnType("text");

            entity.Property(e => e.FechaUltimaActualizacion)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.Property(e => e.NombreProducto)
                .HasMaxLength(100)
                .IsUnicode(false);

            // ✅ NUEVO: Configuración para Costo
            entity.Property(e => e.Costo)
                .HasColumnType("decimal(10, 2)")
                .HasComment("Precio de compra del producto");

            // ✅ NUEVO: Configuración para PorcentajeUtilidad
            entity.Property(e => e.PorcentajeUtilidad)
                .HasColumnType("decimal(5, 2)")
                .HasComment("Porcentaje de utilidad (ej: 30.50 para 30.5%)");

            // Configuración existente para Precio
            entity.Property(e => e.Precio).HasColumnType("decimal(10, 2)");

            entity.Property(e => e.StockMinimo).HasDefaultValue(0);

            // ✅ NUEVO: Ignorar propiedades calculadas (no se guardan en BD)
            entity.Ignore(e => e.UtilidadEnDinero);
            entity.Ignore(e => e.PrecioCalculado);
        });


        modelBuilder.Entity<Proveedore>(entity =>
        {
            entity.HasKey(e => e.ProveedorId).HasName("PK__Proveedo__61266BB9FB5386BA");

            entity.Property(e => e.ProveedorId).HasColumnName("ProveedorID");
            entity.Property(e => e.Contacto)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Direccion)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.NombreProveedor)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Telefono)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Activo)
                .HasDefaultValue(true);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RolId).HasName("PK__Roles__F92302D1A69BD34A");

            entity.Property(e => e.RolId).HasColumnName("RolID");
            entity.Property(e => e.DescripcionRol)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.NombreRol)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasMany(d => d.Permisos).WithMany(p => p.Rols)
                .UsingEntity<Dictionary<string, object>>(
                    "RolPermiso",
                    r => r.HasOne<Permiso>().WithMany()
                        .HasForeignKey("PermisoId")
                        .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                        .HasConstraintName("FK__RolPermis__Permi__01142BA1"),
                    l => l.HasOne<Role>().WithMany()
                        .HasForeignKey("RolId")
                        .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                        .HasConstraintName("FK__RolPermis__RolID__00200768"),
                    j =>
                    {
                        j.HasKey("RolId", "PermisoId").HasName("PK__RolPermi__D04D0EA1C1E00D6C");
                        j.ToTable("RolPermiso");
                        j.IndexerProperty<int>("RolId").HasColumnName("RolID");
                        j.IndexerProperty<int>("PermisoId").HasColumnName("PermisoID");
                    });
        });

        modelBuilder.Entity<SesionUsuario>(entity =>
        {
            entity.HasKey(e => e.SesionId).HasName("PK__SesionUs__52FD7C064728ED7A");

            entity.ToTable("SesionUsuario");

            entity.Property(e => e.SesionId).HasColumnName("SesionID");
            entity.Property(e => e.FechaHoraInicio)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");

            // ✅ CONFIGURACIÓN DE NUEVAS PROPIEDADES
            entity.Property(e => e.TokenHash)
                .HasMaxLength(255)
                .IsRequired(false);

            entity.Property(e => e.EstaActiva)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(e => e.FechaInvalidacion)
                .HasColumnType("datetime")
                .IsRequired(false);

            entity.HasOne(d => d.Usuario).WithMany(p => p.SesionUsuarios)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                .HasConstraintName("FK__SesionUsu__Usuar__08B54D69");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.UsuarioId).HasName("PK__Usuarios__2B3DE79898DC7E39");

            entity.HasIndex(e => e.Email, "UQ__Usuarios__A9D105346078450B").IsUnique();

            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");
            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.Contrasena)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.NombreUsuario)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.PropositoToken)
            .HasConversion(
                v => v.ToString(), // De enum a string
                v => (PropositoTokenEnum)Enum.Parse(typeof(PropositoTokenEnum), v) // De string a enum
            );

            entity.Property(e => e.EsTopVendedor)
                .HasDefaultValue(false)
                .HasComment("Indica si el usuario puede ser considerado para el ranking de top vendedor");

            entity.HasMany(d => d.Rols).WithMany(p => p.Usuarios)
                .UsingEntity<Dictionary<string, object>>(
                    "UsuarioRol",
                    r => r.HasOne<Role>().WithMany()
                        .HasForeignKey("RolId")
                        .OnDelete(DeleteBehavior.NoAction) // CAMBIAR A NoAction
                        .HasConstraintName("FK__UsuarioRo__RolID__04E4BC85"),
                    l => l.HasOne<Usuario>().WithMany()
                        .HasForeignKey("UsuarioId")
                        .OnDelete(DeleteBehavior.NoAction) // CAMBIAR A NoAction
                        .HasConstraintName("FK__UsuarioRo__Usuar__03F0984C"),
                    j =>
                    {
                        j.HasKey("UsuarioId", "RolId").HasName("PK__UsuarioR__24AFD7B5C119E3DC");
                        j.ToTable("UsuarioRol");
                        j.IndexerProperty<int>("UsuarioId").HasColumnName("UsuarioID");
                        j.IndexerProperty<int>("RolId").HasColumnName("RolID");
                    });
        });

        modelBuilder.Entity<UsuarioRolRE>(entity =>
        {
            entity.HasKey(ur => new { ur.UsuarioId, ur.RolId }).HasName("PK_UsuarioRol");

            entity.HasOne(ur => ur.Usuario)
                .WithMany(u => u.UsuarioRoles)
                .HasForeignKey(ur => ur.UsuarioId)
                .OnDelete(DeleteBehavior.NoAction) // CAMBIAR A NoAction
                .HasConstraintName("FK_UsuarioRol_Usuario");

            entity.HasOne(ur => ur.Rol)
                .WithMany(r => r.UsuarioRoles)
                .HasForeignKey(ur => ur.RolId)
                .OnDelete(DeleteBehavior.NoAction) // CAMBIAR A NoAction
                .HasConstraintName("FK_UsuarioRol_Rol");
        });

        modelBuilder.Entity<UsuarioPermisoRE>(entity =>
        {
            // Configuración de la clave compuesta
            entity.HasKey(up => new { up.UsuarioID, up.PermisoID })
                  .HasName("PK_UsuarioPermiso");

            // Relación con Usuario
            entity.HasOne(up => up.Usuario)
                  .WithMany(u => u.UsuarioPermiso)
                  .HasForeignKey(up => up.UsuarioID)
                  .OnDelete(DeleteBehavior.NoAction); // CAMBIAR A NoAction

            // Relación con Permiso
            entity.HasOne(up => up.Permiso)
                  .WithMany(p => p.UsuarioPermiso)
                  .HasForeignKey(up => up.PermisoID)
                  .OnDelete(DeleteBehavior.NoAction); // CAMBIAR A NoAction
        });

        modelBuilder.Entity<RolPermisoRE>(entity =>
        {
            // Configuración de la clave compuesta
            entity.HasKey(rp => new { rp.RolID, rp.PermisoID })
                  .HasName("PK_RolPermiso");

            // Relación con Rol
            entity.HasOne(rp => rp.Rol)
                  .WithMany(r => r.RolPermiso)
                  .HasForeignKey(rp => rp.RolID)
                  .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                  .HasConstraintName("FK_RolPermiso_Rol");

            // Relación con Permiso
            entity.HasOne(rp => rp.Permiso)
                  .WithMany(r => r.RolPermiso)
                  .HasForeignKey(rp => rp.PermisoID)
                  .OnDelete(DeleteBehavior.Restrict) // CAMBIAR A Restrict
                  .HasConstraintName("FK_RolPermiso_Permiso");
        });

        // ✅ CONFIGURACIÓN DE InventarioProgramado PRIMERO
        modelBuilder.Entity<InventarioProgramado>(entity =>
        {
            entity.HasKey(e => e.InventarioProgramadoId);

            // Configurar otras propiedades si es necesario
            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("(getdate())");

            // Relación con AsignacionUsuarioInventario
            entity.HasMany(ip => ip.AsignacionesUsuarios)
                .WithOne(a => a.InventarioProgramado)
                .HasForeignKey(a => a.InventarioProgramadoId)
                .OnDelete(DeleteBehavior.Cascade); // Esta puede ser Cascade
        });

        // ✅ CONFIGURACIÓN DE AsignacionUsuarioInventario DESPUÉS
        modelBuilder.Entity<AsignacionUsuarioInventario>(entity =>
        {
            entity.HasKey(e => e.AsignacionId);

            entity.Property(e => e.FechaAsignacion)
                .HasDefaultValueSql("(getdate())");

            // ✅ Relación con Usuario usando NoAction
            entity.HasOne(d => d.Usuario)
                .WithMany()
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.NoAction); // CAMBIAR A NoAction

            // Índice único
            entity.HasIndex(e => new { e.InventarioProgramadoId, e.UsuarioId })
                .IsUnique();

            // NO configurar la relación con InventarioProgramado aquí
            // Ya está configurada arriba
        });

        // Configuración para Factura
        modelBuilder.Entity<Factura>(entity =>
        {
            entity.HasKey(e => e.FacturaId).HasName("PK_Facturas");

            entity.ToTable("Facturas");

            entity.Property(e => e.NumeroFactura)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.NombreCliente)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.IdentificacionCliente)
                .HasMaxLength(50);

            entity.Property(e => e.TelefonoCliente)
                .HasMaxLength(20);

            entity.Property(e => e.EmailCliente)
                .HasMaxLength(200);

            entity.Property(e => e.DireccionCliente)
                .HasMaxLength(300);

            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(e => e.TipoDocumento)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(e => e.MetodoPago)
                .HasMaxLength(50);

            entity.Property(e => e.Observaciones)
                .HasMaxLength(500);

            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(18,2)");

            entity.Property(e => e.DescuentoGeneral)
                .HasColumnType("decimal(5,2)");

            entity.Property(e => e.PorcentajeImpuesto)
                .HasColumnType("decimal(5,2)");

            entity.Property(e => e.MontoImpuesto)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(d => d.Cliente)
                .WithMany()
                .HasForeignKey(d => d.ClienteId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.UsuarioCreador)
                .WithMany()
                .HasForeignKey(d => d.UsuarioCreadorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuración para DetalleFactura
        modelBuilder.Entity<DetalleFactura>(entity =>
        {
            entity.HasKey(e => e.DetalleFacturaId);

            entity.ToTable("DetallesFactura");

            entity.Property(e => e.NombreProducto)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.DescripcionProducto)                .HasMaxLength(500);

            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(18,2)");

            entity.Property(e => e.PorcentajeDescuento)
                .HasColumnType("decimal(5,2)");

            entity.Property(e => e.MontoDescuento)
                .HasColumnType("decimal(18,2)");

            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(d => d.Factura)
                .WithMany(p => p.DetallesFactura)
                .HasForeignKey(d => d.FacturaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

            modelBuilder.Entity<DetallePago>(entity =>
            {
                entity.HasKey(e => e.DetallePagoId);

                entity.ToTable("DetallesPago");

                entity.Property(e => e.MetodoPago)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Monto).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.Referencia).HasMaxLength(200);

                entity.Property(e => e.Observaciones).HasMaxLength(300);

                entity.Property(e => e.FechaPago)
                    .IsRequired()
                    .HasDefaultValueSql("GETDATE()");

                entity.HasOne(d => d.Factura).WithMany(p => p.DetallesPago)
                    .HasForeignKey(d => d.FacturaId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_DetallesPago_Facturas");
            });

        // Configuración para PendientesEntrega
        modelBuilder.Entity<PendientesEntrega>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.ToTable("PendientesEntrega");

            entity.Property(e => e.CantidadSolicitada)
                .IsRequired();

            entity.Property(e => e.CantidadPendiente)
                .IsRequired();

            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.Estado)
                .HasMaxLength(50)
                .HasDefaultValue("Pendiente");

            entity.Property(e => e.Observaciones)
                .HasMaxLength(500);

            entity.Property(e => e.CodigoSeguimiento)
                .HasMaxLength(20)
                .IsRequired(false);

            entity.HasOne(d => d.Factura)
                .WithMany()
                .HasForeignKey(d => d.FacturaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.UsuarioCreacionNavigation)
                .WithMany()
                .HasForeignKey(d => d.UsuarioCreacion)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.UsuarioEntregaNavigation)
                .WithMany()
                .HasForeignKey(d => d.UsuarioEntrega)
                .OnDelete(DeleteBehavior.SetNull);

            // Índice para búsquedas por código de seguimiento
            entity.HasIndex(e => e.CodigoSeguimiento)
                .HasDatabaseName("IX_PendientesEntrega_CodigoSeguimiento");
        });

        // ✅ CONFIGURACIÓN DE LA TABLA NOTAS RAPIDAS
        modelBuilder.Entity<NotaRapida>(entity =>
        {
            entity.HasKey(e => e.NotaId);

            entity.ToTable("NotasRapidas");

            entity.Property(e => e.Titulo)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Contenido)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.Color)
                .HasDefaultValue("#ffd700");

            entity.Property(e => e.FechaModificacion)
                .IsRequired(false);

            entity.HasOne(d => d.Usuario)
                .WithMany()
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_NotasRapidas_Usuario");

            // Índices para optimización
            entity.HasIndex(e => e.UsuarioId)
                .HasDatabaseName("IX_NotasRapidas_UsuarioId");

            entity.HasIndex(e => e.EsFavorita)
                .HasDatabaseName("IX_NotasRapidas_EsFavorita");

            entity.HasIndex(e => e.FechaModificacion)
                .HasDatabaseName("IX_NotasRapidas_FechaModificacion");

            // Nueva propiedad de la tabla
            entity.Property(e => e.EsFavorita)
                .HasDefaultValue(false);

            entity.Property(e => e.Eliminada)
                .HasDefaultValue(false)
                .HasColumnName("Eliminada");
        });

        // ✅ CONFIGURACIÓN DE LA TABLA ANUNCIOS
        modelBuilder.Entity<Anuncio>(entity =>
        {
            entity.HasKey(e => e.AnuncioId);

            entity.ToTable("Anuncios");

            entity.Property(e => e.Titulo)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Contenido)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(e => e.TipoAnuncio)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("General");

            entity.Property(e => e.Prioridad)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Normal");

            entity.Property(e => e.EsImportante)
                .HasDefaultValue(false);

            entity.Property(e => e.Activo)
                .HasDefaultValue(true);

            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.FechaModificacion)
                .IsRequired(false);

            entity.Property(e => e.FechaVencimiento)
                .IsRequired(false);

            entity.HasOne(d => d.UsuarioCreador)
                .WithMany()
                .HasForeignKey(d => d.UsuarioCreadorId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Anuncios_Usuario");

            // Índices para optimización
            entity.HasIndex(e => e.UsuarioCreadorId)
                .HasDatabaseName("IX_Anuncios_UsuarioCreadorId");

            entity.HasIndex(e => e.Activo)
                .HasDatabaseName("IX_Anuncios_Activo");

            entity.HasIndex(e => e.EsImportante)
                .HasDatabaseName("IX_Anuncios_EsImportante");

            entity.HasIndex(e => e.FechaCreacion)
                .HasDatabaseName("IX_Anuncios_FechaCreacion");

            entity.HasIndex(e => e.FechaVencimiento)
                .HasDatabaseName("IX_Anuncios_FechaVencimiento");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}