
// ========================================
// FUNCIONALIDAD DE GALERÍA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar galería
    initializeGallery();
});

function initializeGallery() {
    console.log('🎨 Inicializando galería...');
    
    // Manejar clicks en imágenes de la galería
    const galleryImages = document.querySelectorAll('.gallery-image');
    console.log(`📷 Encontradas ${galleryImages.length} imágenes de galería`);
    
    galleryImages.forEach(function(image, index) {
        console.log(`🖼️ Configurando imagen ${index + 1}:`, image.getAttribute('data-title'));
        
        image.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👆 Click en imagen de galería');
            openGalleryModal(this);
        });
        
        // Agregar cursor pointer
        image.style.cursor = 'pointer';
    });
    
    // Agregar efecto de hover suave
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(function(item) {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.transition = 'transform 0.3s ease';
        });
    });
    
    console.log('✅ Galería inicializada correctamente');
}

function openGalleryModal(imageElement) {
    console.log('🖼️ Abriendo modal de galería');
    
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('galleryModalImage');
    const modalTitle = document.getElementById('galleryModalTitle');
    const modalDescription = document.getElementById('galleryModalDescription');
    
    if (!modal || !modalImage || !modalTitle || !modalDescription) {
        console.error('❌ No se encontraron elementos del modal');
        return;
    }
    
    // Obtener datos de la imagen
    const imageSrc = imageElement.getAttribute('data-image');
    const title = imageElement.getAttribute('data-title');
    const description = imageElement.getAttribute('data-description');
    
    console.log('📸 Datos de imagen:', { imageSrc, title, description });
    
    // Actualizar contenido del modal
    modalImage.src = imageSrc;
    modalImage.alt = title || 'Imagen de galería';
    modalTitle.textContent = title || 'Imagen de galería';
    modalDescription.textContent = description || '';
    
    // Agregar efecto de carga
    modalImage.style.opacity = '0.5';
    modalImage.style.transform = 'scale(0.9)';
    
    modalImage.onload = function() {
        this.style.opacity = '1';
        this.style.transform = 'scale(1)';
        this.style.transition = 'all 0.3s ease';
    };
    
    // Mostrar el modal usando Bootstrap
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Funciones de utilidad para la galería
function addImageToGallery(imageSrc, title, description) {
    // Función para agregar dinámicamente más imágenes a la galería
    const galleryContainer = document.querySelector('#galeria .row');
    
    const galleryItem = document.createElement('div');
    galleryItem.className = 'col-lg-4 col-md-6';
    
    galleryItem.innerHTML = `
        <div class="gallery-item">
            <img src="${imageSrc}" 
                 alt="${title}" 
                 class="w-100 rounded shadow gallery-image"
                 data-bs-toggle="modal" 
                 data-bs-target="#galleryModal"
                 data-image="${imageSrc}"
                 data-title="${title}"
                 data-description="${description}">
            <div class="gallery-overlay">
                <i class="bi bi-zoom-in text-white fs-2"></i>
            </div>
        </div>
    `;
    
    galleryContainer.appendChild(galleryItem);
    
    // Re-inicializar eventos para la nueva imagen
    const newImage = galleryItem.querySelector('.gallery-image');
    newImage.addEventListener('click', function() {
        openGalleryModal(this);
    });
}

// Función para crear slideshow automático (opcional)
function startGallerySlideshow() {
    const images = document.querySelectorAll('.gallery-image');
    let currentIndex = 0;
    
    setInterval(function() {
        // Destacar imagen actual
        images.forEach(img => img.style.border = 'none');
        images[currentIndex].style.border = '3px solid #3498db';
        
        currentIndex = (currentIndex + 1) % images.length;
    }, 3000);
}

// Función para filtrar galería por categoría (para futuras extensiones)
function filterGallery(category) {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(function(item) {
        const image = item.querySelector('.gallery-image');
        const imageCategory = image.getAttribute('data-category');
        
        if (category === 'all' || imageCategory === category) {
            item.style.display = 'block';
            item.style.animation = 'fadeIn 0.5s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

// Animaciones CSS adicionales
const galleryStyles = `
    @keyframes fadeIn {
        from { 
            opacity: 0; 
            transform: translateY(20px); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0); 
        }
    }
    
    .gallery-item {
        animation: fadeIn 0.6s ease forwards;
    }
    
    .gallery-item:nth-child(1) { animation-delay: 0.1s; }
    .gallery-item:nth-child(2) { animation-delay: 0.2s; }
    .gallery-item:nth-child(3) { animation-delay: 0.3s; }
    .gallery-item:nth-child(4) { animation-delay: 0.4s; }
    .gallery-item:nth-child(5) { animation-delay: 0.5s; }
    .gallery-item:nth-child(6) { animation-delay: 0.6s; }
`;

// Inyectar estilos adicionales
const styleSheet = document.createElement('style');
styleSheet.textContent = galleryStyles;
document.head.appendChild(styleSheet);

console.log('Módulo de galería cargado correctamente');
