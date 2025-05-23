-- =============================================
-- SCRIPT RESUMIDO PARA RECREAR BD TUCO LIMPIA
-- =============================================

USE [master]
GO

-- Eliminar base de datos si existe
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'DB_tuco')
    DROP DATABASE [DB_tuco]
GO

-- Crear base de datos
CREATE DATABASE [DB_tuco]
GO

USE [DB_tuco]
GO

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- Tabla Usuarios
CREATE TABLE [dbo].[Usuarios](
    [UsuarioId] [int] IDENTITY(1,1) NOT NULL,
    [NombreUsuario] [varchar](50) NOT NULL,
    [Email] [varchar](100) NOT NULL,
    [Contrasena] [varchar](255) NOT NULL,
    [FechaCreacion] [datetime] NULL DEFAULT (getdate()),
    [FechaExpiracionToken] [datetime2](7) NULL,
    [PropositoToken] [nvarchar](max) NULL,
    [Activo] [bit] NULL DEFAULT (1),
    [Token] [nvarchar](max) NULL,
    CONSTRAINT [PK_Usuarios] PRIMARY KEY ([UsuarioId]),
    CONSTRAINT [UQ_Usuarios_Email] UNIQUE ([Email])
);

-- Tabla Permisos
CREATE TABLE [dbo].[Permisos](
    [PermisoId] [int] IDENTITY(1,1) NOT NULL,
    [NombrePermiso] [varchar](100) NOT NULL,
    [DescripcionPermiso] [varchar](255) NULL,
    CONSTRAINT [PK_Permisos] PRIMARY KEY ([PermisoId])
);

-- Tabla Roles
CREATE TABLE [dbo].[Roles](
    [RolId] [int] IDENTITY(1,1) NOT NULL,
    [NombreRol] [varchar](50) NOT NULL,
    [DescripcionRol] [varchar](255) NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([RolId])
);

-- Tabla RolPermisos (UNA SOLA)
CREATE TABLE [dbo].[RolPermisos](
    [RolId] [int] NOT NULL,
    [PermisoId] [int] NOT NULL,
    CONSTRAINT [PK_RolPermisos] PRIMARY KEY ([RolId], [PermisoId]),
    CONSTRAINT [FK_RolPermisos_Rol] FOREIGN KEY([RolId]) REFERENCES [dbo].[Roles] ([RolId]) ON DELETE CASCADE,
    CONSTRAINT [FK_RolPermisos_Permiso] FOREIGN KEY([PermisoId]) REFERENCES [dbo].[Permisos] ([PermisoId]) ON DELETE CASCADE
);

-- Tabla UsuarioRoles (UNA SOLA)
CREATE TABLE [dbo].[UsuarioRoles](
    [UsuarioId] [int] NOT NULL,
    [RolId] [int] NOT NULL,
    CONSTRAINT [PK_UsuarioRoles] PRIMARY KEY ([UsuarioId], [RolId]),
    CONSTRAINT [FK_UsuarioRoles_Usuario] FOREIGN KEY([UsuarioId]) REFERENCES [dbo].[Usuarios] ([UsuarioId]) ON DELETE CASCADE,
    CONSTRAINT [FK_UsuarioRoles_Rol] FOREIGN KEY([RolId]) REFERENCES [dbo].[Roles] ([RolId]) ON DELETE CASCADE
);

-- Tabla UsuarioPermisos
CREATE TABLE [dbo].[UsuarioPermisos](
    [UsuarioId] [int] NOT NULL,
    [PermisoId] [int] NOT NULL,
    CONSTRAINT [PK_UsuarioPermisos] PRIMARY KEY ([UsuarioId], [PermisoId]),
    CONSTRAINT [FK_UsuarioPermisos_Usuario] FOREIGN KEY([UsuarioId]) REFERENCES [dbo].[Usuarios] ([UsuarioId]) ON DELETE CASCADE,
    CONSTRAINT [FK_UsuarioPermisos_Permiso] FOREIGN KEY([PermisoId]) REFERENCES [dbo].[Permisos] ([PermisoId]) ON DELETE CASCADE
);

-- =============================================
-- TABLAS DE NEGOCIO
-- =============================================

-- Tabla Productos
CREATE TABLE [dbo].[Productos](
    [ProductoId] [int] IDENTITY(1,1) NOT NULL,
    [NombreProducto] [varchar](100) NOT NULL,
    [Descripcion] [text] NULL,
    [Precio] [decimal](10, 2) NULL,
    [CantidadEnInventario] [int] NULL DEFAULT (0),
    [FechaUltimaActualizacion] [datetime] NULL DEFAULT (getdate()),
    [StockMinimo] [int] NULL DEFAULT (0),
    CONSTRAINT [PK_Productos] PRIMARY KEY ([ProductoId])
);

-- Tabla Llantas
CREATE TABLE [dbo].[Llantas](
    [LlantaId] [int] IDENTITY(1,1) NOT NULL,
    [ProductoId] [int] NULL,
    [Ancho] [int] NULL,
    [Perfil] [int] NULL,
    [Diametro] [varchar](10) NULL,
    [Marca] [varchar](50) NULL,
    [Modelo] [varchar](50) NULL,
    [Capas] [int] NULL,
    [IndiceVelocidad] [varchar](5) NULL,
    [TipoTerreno] [varchar](50) NULL,
    CONSTRAINT [PK_Llantas] PRIMARY KEY ([LlantaId]),
    CONSTRAINT [FK_Llantas_Producto] FOREIGN KEY([ProductoId]) REFERENCES [dbo].[Productos] ([ProductoId]) ON DELETE CASCADE
);

-- =============================================
-- TABLAS DE INVENTARIO PROGRAMADO
-- =============================================

-- Tabla InventariosProgramados
CREATE TABLE [dbo].[InventariosProgramados](
    [InventarioProgramadoId] [int] IDENTITY(1,1) NOT NULL,
    [Titulo] [nvarchar](100) NOT NULL,
    [Descripcion] [nvarchar](500) NULL,
    [FechaInicio] [datetime2](7) NOT NULL,
    [FechaFin] [datetime2](7) NOT NULL,
    [TipoInventario] [nvarchar](50) NOT NULL,
    [Estado] [nvarchar](50) NOT NULL,
    [FechaCreacion] [datetime2](7) NOT NULL DEFAULT (getdate()),
    [UsuarioCreadorId] [int] NOT NULL,
    [UbicacionEspecifica] [nvarchar](100) NULL,
    [IncluirStockBajo] [bit] NOT NULL DEFAULT (0),
    CONSTRAINT [PK_InventariosProgramados] PRIMARY KEY ([InventarioProgramadoId]),
    CONSTRAINT [FK_InventariosProgramados_Usuario] FOREIGN KEY([UsuarioCreadorId]) REFERENCES [dbo].[Usuarios] ([UsuarioId]) ON DELETE NO ACTION
);

-- Tabla AsignacionesUsuariosInventario
CREATE TABLE [dbo].[AsignacionesUsuariosInventario](
    [AsignacionId] [int] IDENTITY(1,1) NOT NULL,
    [InventarioProgramadoId] [int] NOT NULL,
    [UsuarioId] [int] NOT NULL,
    [PermisoConteo] [bit] NOT NULL DEFAULT (0),
    [PermisoAjuste] [bit] NOT NULL DEFAULT (0),
    [PermisoValidacion] [bit] NOT NULL DEFAULT (0),
    [FechaAsignacion] [datetime2](7) NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_AsignacionesUsuariosInventario] PRIMARY KEY ([AsignacionId]),
    CONSTRAINT [FK_AsignacionesUsuariosInventario_Inventario] FOREIGN KEY([InventarioProgramadoId]) REFERENCES [dbo].[InventariosProgramados] ([InventarioProgramadoId]) ON DELETE CASCADE,
    CONSTRAINT [FK_AsignacionesUsuariosInventario_Usuario] FOREIGN KEY([UsuarioId]) REFERENCES [dbo].[Usuarios] ([UsuarioId]) ON DELETE NO ACTION,
    CONSTRAINT [UQ_AsignacionesUsuariosInventario] UNIQUE ([InventarioProgramadoId], [UsuarioId])
);

-- Tabla DetallesInventarioProgramado
CREATE TABLE [dbo].[DetallesInventarioProgramado](
    [DetalleId] [int] IDENTITY(1,1) NOT NULL,
    [InventarioProgramadoId] [int] NOT NULL,
    [ProductoId] [int] NOT NULL,
    [CantidadSistema] [int] NOT NULL,
    [CantidadFisica] [int] NULL,
    [Diferencia] [int] NULL,
    [Observaciones] [nvarchar](500) NULL,
    [UsuarioConteoId] [int] NULL,
    [FechaConteo] [datetime2](7) NULL,
    CONSTRAINT [PK_DetallesInventarioProgramado] PRIMARY KEY ([DetalleId]),
    CONSTRAINT [FK_DetallesInventarioProgramado_Inventario] FOREIGN KEY([InventarioProgramadoId]) REFERENCES [dbo].[InventariosProgramados] ([InventarioProgramadoId]) ON DELETE CASCADE,
    CONSTRAINT [FK_DetallesInventarioProgramado_Producto] FOREIGN KEY([ProductoId]) REFERENCES [dbo].[Productos] ([ProductoId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_DetallesInventarioProgramado_UsuarioConteo] FOREIGN KEY([UsuarioConteoId]) REFERENCES [dbo].[Usuarios] ([UsuarioId]) ON DELETE SET NULL
);

-- Tabla Notificaciones
CREATE TABLE [dbo].[Notificaciones](
    [NotificacionId] [int] IDENTITY(1,1) NOT NULL,
    [UsuarioId] [int] NOT NULL,
    [Titulo] [nvarchar](200) NOT NULL,
    [Mensaje] [nvarchar](500) NOT NULL,
    [Tipo] [nvarchar](50) NOT NULL,
    [Leida] [bit] NOT NULL DEFAULT (0),
    [FechaCreacion] [datetime2](7) NOT NULL DEFAULT (getdate()),
    [FechaLectura] [datetime2](7) NULL,
    [Icono] [nvarchar](100) NULL,
    [EntidadTipo] [nvarchar](100) NULL,
    [EntidadId] [int] NULL,
    [UrlAccion] [nvarchar](500) NULL,
    CONSTRAINT [PK_Notificaciones] PRIMARY KEY ([NotificacionId]),
    CONSTRAINT [FK_Notificaciones_Usuario] FOREIGN KEY([UsuarioId]) REFERENCES [dbo].[Usuarios] ([UsuarioId]) ON DELETE NO ACTION
);

-- Tabla HistorialAcciones
CREATE TABLE [dbo].[HistorialAcciones](
    [HistorialId] [int] IDENTITY(1,1) NOT NULL,
    [UsuarioId] [int] NOT NULL,
    [FechaAccion] [datetime] NOT NULL DEFAULT (getdate()),
    [TipoAccion] [varchar](50) NOT NULL,
    [Modulo] [varchar](50) NOT NULL,
    [Detalle] [text] NOT NULL,
    [Token] [nvarchar](max) NULL,
    [PropositoToken] [nvarchar](max) NULL,
    [EstadoAccion] [nvarchar](max) NOT NULL,
    [ErrorDetalle] [nvarchar](max) NULL,
    CONSTRAINT [PK_HistorialAcciones] PRIMARY KEY ([HistorialId]),
    CONSTRAINT [FK_HistorialAcciones_Usuario] FOREIGN KEY([UsuarioId]) REFERENCES [dbo].[Usuarios] ([UsuarioId]) ON DELETE NO ACTION
);

-- =============================================
-- TABLA PARA ENTITY FRAMEWORK
-- =============================================
CREATE TABLE [dbo].[__EFMigrationsHistory](
    [MigrationId] [nvarchar](150) NOT NULL,
    [ProductVersion] [nvarchar](32) NOT NULL,
    CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
);

-- Insertar migración ficticia para que EF no se confunda
INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES ('20250523000000_BaseDatosLimpia', '9.0.0');

-- =============================================
-- ÍNDICES IMPORTANTES
-- =============================================
CREATE INDEX [IX_InventariosProgramados_UsuarioCreadorId] ON [dbo].[InventariosProgramados] ([UsuarioCreadorId]);
CREATE INDEX [IX_AsignacionesUsuariosInventario_UsuarioId] ON [dbo].[AsignacionesUsuariosInventario] ([UsuarioId]);
CREATE INDEX [IX_DetallesInventarioProgramado_InventarioProgramadoId] ON [dbo].[DetallesInventarioProgramado] ([InventarioProgramadoId]);
CREATE INDEX [IX_DetallesInventarioProgramado_ProductoId] ON [dbo].[DetallesInventarioProgramado] ([ProductoId]);
CREATE INDEX [IX_Notificaciones_UsuarioId] ON [dbo].[Notificaciones] ([UsuarioId]);
CREATE INDEX [IX_HistorialAcciones_UsuarioId] ON [dbo].[HistorialAcciones] ([UsuarioId]);

PRINT '==============================================';
PRINT 'BASE DE DATOS TUCO CREADA CORRECTAMENTE';
PRINT 'Estructura limpia y consistente';
PRINT 'Lista para usar con Entity Framework';
PRINT '==============================================';
