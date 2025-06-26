[StringLength(255, ErrorMessage = "La descripción no puede exceder los 255 caracteres.")]
            public string? DescripcionPermiso { get; set; }

            [StringLength(100, ErrorMessage = "La categoría no puede exceder los 100 caracteres.")]
            public string? Categoria { get; set; }
        }