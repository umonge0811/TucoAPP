
/**
 * ===== SCRIPT PARA VENTANA DE IMPRESIÓN TÉRMICA =====
 * Este script se ejecuta dentro de la ventana emergente de impresión
 */

console.log('📄 Script de impresión térmica cargado');

let impresionRealizada = false;

function ejecutarImpresion() {
    if (impresionRealizada) {
        console.log('🖨️ Impresión ya ejecutada');
        return;
    }
    
    impresionRealizada = true;
    console.log('🖨️ Ejecutando impresión automática...');
    
    // Esperar un momento para asegurar que todo esté renderizado
    setTimeout(() => {
        try {
            window.print();
            console.log('✅ Comando de impresión enviado');
        } catch (error) {
            console.error('❌ Error al imprimir:', error);
        }
    }, 500);
}

// Detectar cuando el documento esté completamente cargado
if (document.readyState === 'complete') {
    ejecutarImpresion();
} else {
    window.addEventListener('load', ejecutarImpresion);
    document.addEventListener('DOMContentLoaded', ejecutarImpresion);
}

// Cerrar ventana después de imprimir
window.addEventListener('afterprint', function() {
    console.log('🖨️ Evento afterprint detectado');
    setTimeout(() => {
        try {
            window.close();
        } catch (e) {
            console.log('⚠️ No se pudo cerrar la ventana automáticamente');
        }
    }, 1000);
});

// Cerrar ventana por timeout (fallback)
setTimeout(() => {
    if (!window.closed) {
        console.log('🖨️ Cerrando ventana por timeout');
        try {
            window.close();
        } catch (e) {
            console.log('⚠️ No se pudo cerrar por timeout');
        }
    }
}, 15000);

// Agregar información de debug
console.log('🔍 Ventana de impresión térmica inicializada');
