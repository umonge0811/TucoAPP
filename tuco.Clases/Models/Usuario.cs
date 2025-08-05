using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using Tuco.Clases.Enums;
using Tuco.Clases.Models;

namespace tuco.Clases.Models;

public partial class Usuario
{
    public int UsuarioId { get; set; }

    public string NombreUsuario { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Contrasena { get; set; } = null!;
    
    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaExpiracionToken { get; set; }

    public PropositoTokenEnum? PropositoToken { get; set; }

    public bool? Activo { get; set; }

    // Nuevo campo para el token de activación
    public string? Token { get; set; }

    // Campo para marcar si el usuario puede ser considerado para top vendedor
    public bool EsTopVendedor { get; set; } = false;

    public virtual ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();

    public virtual ICollection<Documento> Documentos { get; set; } = new List<Documento>();

    public virtual ICollection<HistorialAcciones> HistorialAcciones { get; set; } = new List<HistorialAcciones>();

    public virtual ICollection<Inventario> Inventarios { get; set; } = new List<Inventario>();

    public virtual ICollection<PedidosProveedor> PedidosProveedors { get; set; } = new List<PedidosProveedor>();

    public virtual ICollection<SesionUsuario> SesionUsuarios { get; set; } = new List<SesionUsuario>();

    public virtual ICollection<Role> Rols { get; set; } = new List<Role>();

    public virtual ICollection<UsuarioRolRE> UsuarioRoles { get; set; } = new List<UsuarioRolRE>();

    // Propiedad de navegación para la relación muchos a muchos con Permisos
    public virtual ICollection<UsuarioPermisoRE> UsuarioPermiso { get; set; } = new List<UsuarioPermisoRE>();

    public virtual ICollection<AlertasInvProgramado> AlertasRecibidas { get; set; } = new List<AlertasInvProgramado>();



}
