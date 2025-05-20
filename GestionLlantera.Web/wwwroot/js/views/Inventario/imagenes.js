/**
 * Script para mejorar la funcionalidad del carrusel de imágenes de productos
 */
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar todos los carruseles cuando se carga la modal
    function inicializarCarruseles() {
        const carruseles = document.querySelectorAll('.carrusel-productos .carousel');

        carruseles.forEach(carrusel => {
            // Crear una instancia de Bootstrap Carousel con opciones personalizadas
            const carousel = new bootstrap.Carousel(carrusel, {
                interval: 5000, // Tiempo entre transiciones automáticas (5 segundos)
                wrap: true,     // Permitir volver al inicio cuando llega al final
                keyboard: true  // Permitir navegación con teclado
            });

            // Agregar la instancia al elemento para acceder a ella más tarde
            carrusel.carouselInstance = carousel;

            // Añadir navegación con teclado para accesibilidad
            carrusel.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowLeft') {
                    carousel.prev();
                } else if (e.key === 'ArrowRight') {
                    carousel.next();
                }
            });

            // Pausar rotación automática cuando el cursor está sobre el carrusel
            carrusel.addEventListener('mouseenter', function () {
                carousel.pause();
            });

            // Reanudar rotación automática cuando el cursor sale del carrusel
            carrusel.addEventListener('mouseleave', function () {
                carousel.cycle();
            });

            // Mejorar contraste de botones según la imagen actual
            carrusel.addEventListener('slid.bs.carousel', function () {
                ajustarColorControles(carrusel);
            });

            // Detección inicial de contraste
            ajustarColorControles(carrusel);
        });
    }

    // Función para ajustar los controles según el brillo de la imagen
    function ajustarColorControles(carrusel) {
        const imagenActiva = carrusel.querySelector('.carousel-item.active img');

        if (imagenActiva) {
            // Detectar si la imagen tiene fondo claro basado en su URL
            // Esto es una aproximación - una solución más avanzada requeriría
            // analizar el color real de la imagen con un canvas
            const urlImagen = imagenActiva.src.toLowerCase();
            const posibleFondoClaro =
                urlImagen.includes('white') ||
                urlImagen.includes('light') ||
                urlImagen.includes('bright') ||
                urlImagen.includes('blanco');

            // Si creemos que la imagen tiene fondo claro, aumentamos el contraste de los controles
            if (posibleFondoClaro) {
                carrusel.querySelectorAll('.carousel-control-prev, .carousel-control-next')
                    .forEach(control => {
                        control.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    });

                carrusel.querySelectorAll('.carousel-control-prev-icon, .carousel-control-next-icon')
                    .forEach(icon => {
                        icon.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                        icon.style.borderWidth = '3px';
                    });
            } else {
                // Restaurar valores predeterminados
                carrusel.querySelectorAll('.carousel-control-prev, .carousel-control-next')
                    .forEach(control => {
                        control.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    });

                carrusel.querySelectorAll('.carousel-control-prev-icon, .carousel-control-next-icon')
                    .forEach(icon => {
                        icon.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                        icon.style.borderWidth = '2px';
                    });
            }
        }
    }

    // Inicializar carruseles cuando se abre una modal
    document.body.addEventListener('shown.bs.modal', function (event) {
        const modal = event.target;
        if (modal.querySelector('.carrusel-productos')) {
            inicializarCarruseles();
        }
    });

    // Si hay carruseles ya presentes en la página al cargar (fuera de modales)
    inicializarCarruseles();

    // Detectar cambios de tamaño de ventana para ajustar elementos responsive
    window.addEventListener('resize', function () {
        const carruseles = document.querySelectorAll('.carrusel-productos .carousel');
        carruseles.forEach(carrusel => {
            // Ajustar altura de contenedor según tamaño de ventana
            const alturaVentana = window.innerHeight;
            const alturaMaxima = Math.min(500, alturaVentana * 0.7); // 70% de altura de ventana o 500px máximo

            const imagenes = carrusel.querySelectorAll('.carousel-item img');
            imagenes.forEach(img => {
                img.style.maxHeight = alturaMaxima + 'px';
            });
        });
    });

    // Añadir soporte para gestos táctiles en dispositivos móviles
    document.querySelectorAll('.carrusel-productos .carousel').forEach(carrusel => {
        let touchStartX = 0;
        let touchEndX = 0;

        carrusel.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        carrusel.addEventListener('touchend', function (e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(carrusel);
        }, false);

        function handleSwipe(carrusel) {
            if (touchEndX < touchStartX - 50) {
                // Deslizar a la izquierda - siguiente imagen
                carrusel.carouselInstance.next();
            } else if (touchEndX > touchStartX + 50) {
                // Deslizar a la derecha - imagen anterior
                carrusel.carouselInstance.prev();
            }
        }
    });
});

/**
 * Función para precargar imágenes cuando se abre la modal para mejorar la experiencia de usuario
 * @param {string} productId - ID del producto
 */
function precargarImagenesProducto(productId) {
    // Esta función puede ser llamada antes de abrir la modal para precargar las imágenes
    // Requiere implementación backend para obtener URLs de imágenes por AJAX

    fetch(`/api/productos/${productId}/imagenes`)
        .then(response => response.json())
        .then(imagenes => {
            imagenes.forEach(imagen => {
                const img = new Image();
                img.src = imagen.urlImagen;
            });
        })
        .catch(error => console.error('Error al precargar imágenes:', error));
}