
// Servicio para gestionar información de permisos
class PermisosInfoService {
    constructor() {
        this.modal = null;
        this.funciones = {};
        this.permisosUsuario = [];
        this.init();
    }

    async init() {
        this.modal = new bootstrap.Modal(document.getElementById('modalPermisosInfo'));
        await this.cargarFunciones();
        await this.cargarPermisosUsuario();
        this.configurarEventos();
    }

    async cargarFunciones() {
        try {
            const response = await fetch('/api/permisos/funciones');
            if (response.ok) {
                this.funciones = await response.json();
                this.poblarSelectFunciones();
            }
        } catch (error) {
            console.error('Error al cargar funciones:', error);
        }
    }

    async cargarPermisosUsuario() {
        try {
            const response = await fetch('/DiagnosticoPermisos/mis-permisos');
            if (response.ok) {
                this.permisosUsuario = await response.json();
                console.log('Permisos del usuario cargados:', this.permisosUsuario);
            }
        } catch (error) {
            console.error('Error al cargar permisos del usuario:', error);
        }
    }

    poblarSelectFunciones() {
        const select = document.getElementById('selectFuncion');
        select.innerHTML = '<option value="">-- Selecciona una función --</option>';
        
        Object.keys(this.funciones).forEach(funcion => {
            const option = document.createElement('option');
            option.value = funcion;
            option.textContent = funcion;
            select.appendChild(option);
        });
    }

    configurarEventos() {
        const selectFuncion = document.getElementById('selectFuncion');
        const btnSolicitar = document.getElementById('btnSolicitarPermisos');

        selectFuncion.addEventListener('change', (e) => {
            if (e.target.value) {
                this.mostrarDetallePermisos(e.target.value);
            } else {
                document.getElementById('detallePermisos').style.display = 'none';
            }
        });

        btnSolicitar.addEventListener('click', () => {
            this.solicitarPermisos();
        });
    }

    async mostrarDetallePermisos(funcion) {
        try {
            // Obtener permisos requeridos para la función
            const response = await fetch(`/api/permisos/funcion/${encodeURIComponent(funcion)}`);
            if (!response.ok) return;

            const permisosRequeridos = await response.json();
            const detalleDiv = document.getElementById('detallePermisos');
            const listaDiv = document.getElementById('listaPermisosRequeridos');
            const accionesDiv = document.getElementById('accionesPermisos');

            let html = '';
            let tienePermisosCompletos = true;

            permisosRequeridos.forEach(permiso => {
                const tienePermiso = this.permisosUsuario.includes(permiso);
                if (!tienePermiso) tienePermisosCompletos = false;

                html += `
                    <div class="permiso-item mb-2">
                        <i class="bi ${tienePermiso ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'} me-2"></i>
                        <span class="${tienePermiso ? 'text-success' : 'text-danger'}">${permiso}</span>
                        <span class="estado-permiso ${tienePermiso ? 'permiso-disponible' : 'permiso-faltante'}">
                            ${tienePermiso ? 'Disponible' : 'Faltante'}
                        </span>
                    </div>
                `;
            });

            listaDiv.innerHTML = html;
            accionesDiv.style.display = tienePermisosCompletos ? 'none' : 'block';
            detalleDiv.style.display = 'block';

            if (tienePermisosCompletos) {
                listaDiv.innerHTML += `
                    <div class="alert alert-success mt-3">
                        <i class="bi bi-check-circle me-2"></i>
                        ¡Tienes todos los permisos necesarios para esta función!
                    </div>
                `;
            }

            // Agregar descripción de la función
            if (this.funciones[funcion]) {
                listaDiv.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>${funcion}:</strong> ${this.funciones[funcion]}
                    </div>
                ` + listaDiv.innerHTML;
            }

        } catch (error) {
            console.error('Error al mostrar detalle de permisos:', error);
        }
    }

    async solicitarPermisos() {
        const funcion = document.getElementById('selectFuncion').value;
        const justificacion = document.getElementById('justificacionSolicitud').value;

        if (!justificacion.trim()) {
            toastr.warning('Por favor, proporciona una justificación para la solicitud');
            return;
        }

        try {
            const response = await fetch('/api/permisos/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    funcion: funcion,
                    justificacion: justificacion
                })
            });

            if (response.ok) {
                toastr.success('Solicitud enviada al administrador exitosamente');
                this.modal.hide();
                document.getElementById('justificacionSolicitud').value = '';
            } else {
                toastr.error('Error al enviar la solicitud');
            }
        } catch (error) {
            console.error('Error al solicitar permisos:', error);
            toastr.error('Error al enviar la solicitud');
        }
    }
}

// Inicializar el servicio cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new PermisosInfoService();
});
