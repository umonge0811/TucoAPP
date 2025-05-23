// tuco.Clases.Models/AlertaInventario.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace tuco.Clases.Models;

[Table("AlertasInventarioProgramado")]
public partial class AlertasInventarioProgramado
{
    [Key]
    public int AlertaId { get; set; }

    [Required]
    public int InventarioProgramadoId { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    [Required]
    [StringLength(50)]
    public string TipoAlerta { get; set; } // 'Asignación', 'Inicio', 'Finalización', 'Discrepancia'

    [Required]
    [StringLength(500)]
    public string Mensaje { get; set; }

    [Required]
    public bool Leida { get; set; } = false;

    [Required]
    public DateTime FechaCreacion { get; set; }

    public DateTime? FechaLectura { get; set; }

    // Relaciones
    [ForeignKey("InventarioProgramadoId")]
    public virtual InventarioProgramado InventarioProgramado { get; set; }

    [ForeignKey("UsuarioId")]
    public virtual Usuario Usuario { get; set; }

    public AlertasInventarioProgramado()
    {
        FechaCreacion = DateTime.Now;
    }
}