-- Base de datos completa actualizada con todos los cambios recientes

-- Crear la base de datos
PRINT 'Creando la base de datos...';
CREATE DATABASE GestionLlantera;
USE GestionLlantera;

-- Crear la tabla de Roles
PRINT 'Creando la tabla Roles...';
CREATE TABLE Roles (
    RolID INT PRIMARY KEY IDENTITY(1,1),
    NombreRol VARCHAR(50) NOT NULL,
    DescripcionRol VARCHAR(255)
);

-- Crear la tabla de Usuarios
PRINT 'Creando la tabla Usuarios...';
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    NombreUsuario VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Activo BIT DEFAULT 1,
    Token VARCHAR(255),
    FechaExpiracionToken DATETIME,
    PropositoToken VARCHAR(50)
);

-- Crear la tabla de Clientes
PRINT 'Creando la tabla Clientes...';
CREATE TABLE Clientes (
    ClienteID INT PRIMARY KEY IDENTITY(1,1),
    NombreCliente VARCHAR(100) NOT NULL,
    Contacto VARCHAR(100),
    Direccion VARCHAR(255),
    Email VARCHAR(100),
    Telefono VARCHAR(15),
    UsuarioID INT,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Crear la tabla de Documentos (Proformas y Facturas)
PRINT 'Creando la tabla Documentos...';
CREATE TABLE Documentos (
    DocumentoID INT PRIMARY KEY IDENTITY(1,1),
    ClienteID INT,
    EsProforma BIT DEFAULT 1, -- 1: Proforma, 0: Factura
    Estado VARCHAR(50) DEFAULT 'Activo',
    FechaDocumento DATETIME DEFAULT GETDATE(),
    FechaVencimiento DATETIME,
    Subtotal DECIMAL(10, 2),
    Impuestos DECIMAL(10, 2),
    Total DECIMAL(10, 2),
    UsuarioID INT,
    FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Crear la tabla de DetalleDocumento para relacionar productos con documentos
PRINT 'Creando la tabla DetalleDocumento...';
CREATE TABLE DetalleDocumento (
    DetalleID INT PRIMARY KEY IDENTITY(1,1),
    DocumentoID INT,
    ProductoID INT,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10, 2),
    Descuento DECIMAL(10, 2),
    FOREIGN KEY (DocumentoID) REFERENCES Documentos(DocumentoID),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Crear la tabla de Proveedores
PRINT 'Creando la tabla Proveedores...';
CREATE TABLE Proveedores (
    ProveedorID INT PRIMARY KEY IDENTITY(1,1),
    NombreProveedor VARCHAR(100) NOT NULL,
    Contacto VARCHAR(100),
    Telefono VARCHAR(15),
    Direccion VARCHAR(255)
);

-- Crear la tabla de Pedidos a Proveedores
PRINT 'Creando la tabla PedidosProveedor...';
CREATE TABLE PedidosProveedor (
    PedidoID INT PRIMARY KEY IDENTITY(1,1),
    ProveedorID INT,
    FechaPedido DATETIME DEFAULT GETDATE(),
    Estado VARCHAR(50),
    UsuarioID INT,
    FOREIGN KEY (ProveedorID) REFERENCES Proveedores(ProveedorID),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Crear la tabla de DetallePedido para los productos solicitados a proveedores
PRINT 'Creando la tabla DetallePedido...';
CREATE TABLE DetallePedido (
    DetalleID INT PRIMARY KEY IDENTITY(1,1),
    PedidoID INT,
    ProductoID INT,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10, 2),
    FOREIGN KEY (PedidoID) REFERENCES PedidosProveedor(PedidoID),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Crear la tabla de Productos
PRINT 'Creando la tabla Productos...';
CREATE TABLE Productos (
    ProductoID INT PRIMARY KEY IDENTITY(1,1),
    NombreProducto VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    Precio DECIMAL(10, 2),
    CantidadEnInventario INT,
    FechaUltimaActualizacion DATETIME DEFAULT GETDATE(),
    StockMinimo INT DEFAULT 0
);

-- Crear la tabla de Llantas (detalles específicos)
PRINT 'Creando la tabla Llantas...';
CREATE TABLE Llantas (
    LlantaID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT,
    Ancho INT,
    Perfil INT,
    Diametro VARCHAR(10),
    Marca VARCHAR(50),
    Modelo VARCHAR(50),
    Capas INT,
    IndiceVelocidad VARCHAR(5),
    TipoTerreno VARCHAR(50),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Crear la tabla de ImagenesProducto para gestionar imágenes de productos
PRINT 'Creando la tabla ImagenesProducto...';
CREATE TABLE ImagenesProducto (
    ImagenID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT,
    URLImagen VARCHAR(255) NOT NULL,
    Descripcion VARCHAR(255),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Crear la tabla de Inventarios para registrar las tomas de inventario
PRINT 'Creando la tabla Inventarios...';
CREATE TABLE Inventarios (
    InventarioID INT PRIMARY KEY IDENTITY(1,1),
    FechaProgramada DATETIME NOT NULL,
    FechaRealizacion DATETIME,
    FechaReprogramada DATETIME,
    Estado VARCHAR(20) DEFAULT 'Programado',
    UsuarioID INT,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Crear la tabla de DetalleInventario para registrar detalles de la toma de inventario
PRINT 'Creando la tabla DetalleInventario...';
CREATE TABLE DetalleInventario (
    DetalleInventarioID INT PRIMARY KEY IDENTITY(1,1),
    InventarioID INT,
    ProductoID INT,
    CantidadRegistrada INT,
    CantidadContada INT,
    Diferencia AS (CantidadContada - CantidadRegistrada),
    Comentario TEXT,
    FOREIGN KEY (InventarioID) REFERENCES Inventarios(InventarioID),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Crear la tabla de Permisos
PRINT 'Creando la tabla Permisos...';
CREATE TABLE Permisos (
    PermisoID INT PRIMARY KEY IDENTITY(1,1),
    NombrePermiso VARCHAR(100) NOT NULL,
    DescripcionPermiso VARCHAR(255) NOT NULL
);

-- Crear la tabla intermedia RolPermiso (relación muchos a muchos entre Roles y Permisos)
PRINT 'Creando la tabla RolPermiso...';
CREATE TABLE RolPermiso (
    RolID INT NOT NULL,
    PermisoID INT NOT NULL,
    PRIMARY KEY (RolID, PermisoID),
    FOREIGN KEY (RolID) REFERENCES Roles(RolID) ON DELETE CASCADE,
    FOREIGN KEY (PermisoID) REFERENCES Permisos(PermisoID) ON DELETE CASCADE
);

-- Crear la tabla intermedia UsuarioRol (relación muchos a muchos entre Usuarios y Roles)
PRINT 'Creando la tabla UsuarioRol...';
CREATE TABLE UsuarioRol (
    UsuarioID INT NOT NULL,
    RolID INT NOT NULL,
    PRIMARY KEY (UsuarioID, RolID),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE,
    FOREIGN KEY (RolID) REFERENCES Roles(RolID) ON DELETE CASCADE
);

-- Crear la tabla intermedia UsuarioPermiso
PRINT 'Creando la tabla UsuarioPermiso...';
CREATE TABLE UsuarioPermiso (
    UsuarioID INT NOT NULL,
    PermisoID INT NOT NULL,
    PRIMARY KEY (UsuarioID, PermisoID),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE,
    FOREIGN KEY (PermisoID) REFERENCES Permisos(PermisoID) ON DELETE CASCADE
);

-- Crear la tabla de SesionUsuario para registrar inicios de sesión
PRINT 'Creando la tabla SesionUsuario...';
CREATE TABLE SesionUsuario (
    SesionID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT,
    FechaHoraInicio DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Crear la tabla de AlertasInventario para registrar alertas del sistema
PRINT 'Creando la tabla AlertasInventario...';
CREATE TABLE AlertasInventario (
    AlertaID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT,
    FechaAlerta DATETIME DEFAULT GETDATE(),
    TipoAlerta VARCHAR(50) DEFAULT 'Inventario Bajo',
    Descripcion TEXT,
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Crear la tabla de Historial de Acciones para registrar actividades de los usuarios
PRINT 'Creando la tabla HistorialAcciones...';
CREATE TABLE HistorialAcciones (
    HistorialID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT,
    FechaAccion DATETIME DEFAULT GETDATE(),
    TipoAccion VARCHAR(50),
    Modulo VARCHAR(50),
    Detalle TEXT,
    Token VARCHAR(255),
    PropositoToken VARCHAR(50),
    EstadoAccion VARCHAR(50),
    ErrorDetalle TEXT,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);