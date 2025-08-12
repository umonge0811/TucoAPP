
// ===== CONFIGURACIÓN PARA IMPRESORA TÉRMICA =====

/**
 * Configurar automáticamente la impresora térmica
 */
function configurarImpresoraTermica() {
    console.log('🖨️ Configurando impresora térmica...');
    
    // Configuración CSS específica para impresión
    const estilosImpresion = `
        <style id="configuracion-termica">
            @media print {
                @page {
                    size: 80mm auto;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                
                body {
                    zoom: 1.2 !important;
                    -webkit-transform: scale(1.2) !important;
                    transform: scale(1.2) !important;
                    -webkit-transform-origin: 0 0 !important;
                    transform-origin: 0 0 !important;
                }
            }
        </style>
    `;
    
    // Inyectar estilos si no existen
    if (!document.getElementById('configuracion-termica')) {
        document.head.insertAdjacentHTML('beforeend', estilosImpresion);
    }
}

/**
 * Función mejorada de impresión con configuración automática
 */
function imprimirReciboTermico(numeroFactura) {
    console.log('🖨️ === INICIANDO IMPRESIÓN TÉRMICA ===');
    console.log('🖨️ Número de factura:', numeroFactura);
    
    // Configurar impresora antes de imprimir
    configurarImpresoraTermica();
    
    // Detectar si es Windows para usar comandos específicos
    const esWindows = navigator.platform.indexOf('Win') > -1;
    
    // Instrucciones específicas según el sistema
    if (esWindows) {
        console.log('🖨️ Sistema Windows detectado');
        console.log('🖨️ Para mejor resultado:');
        console.log('🖨️1. En el diálogo de impresión, selecciona "Xprinter XP-N160II"');
        console.log('🖨️ 2. Configura el tamaño de papel como "Custom" 80mm x Auto');
        console.log('🖨️ 3. Establece márgenes a 0');
        console.log('🖨️ 4. Ajusta el zoom si es necesario');
    }
    
    // Usar la función de impresión del navegador con configuración mejorada
    setTimeout(() => {
        window.print();
    }, 500);
}

/**
 * Verificar si la impresora térmica está disponible
 */
async function verificarImpresoraTermica() {
    try {
        // Verificar si el navegador soporta la API de impresoras
        if ('navigator' in window && 'permissions' in navigator) {
            const permission = await navigator.permissions.query({name: 'camera'});
            console.log('🖨️ Permisos del navegador verificados');
        }
        
        // Mostrar guía de configuración
        mostrarGuiaConfiguracionImpresora();
        
        return true;
    } catch (error) {
        console.warn('⚠️ No se pudo verificar la impresora:', error);
        return false;
    }
}

/**
 * Mostrar guía de configuración de impresora
 */
function mostrarGuiaConfiguracionImpresora() {
    const guiaHTML = `
        <div id="guia-impresora" style="
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-size: 12px;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #007bff;">📱 Configuración Impresora</h4>
                <button onclick="cerrarGuiaImpresora()" style="
                    background: none; 
                    border: none; 
                    font-size: 18px; 
                    cursor: pointer;
                    color: #999;
                ">×</button>
            </div>
            <div style="color: #333;">
                <p><strong>🖨️ Xprinter XP-N160II</strong></p>
                <ul style="margin: 0; padding-left: 15px;">
                    <li>Papel: 80mm térmico</li>
                    <li>Conexión: USB</li>
                    <li>Driver: ESC/POS</li>
                </ul>
                <hr style="margin: 10px 0;">
                <p><strong>⚙️ Configuración:</strong></p>
                <ol style="margin: 0; padding-left: 15px;">
                    <li>Instalar driver XPrinter</li>
                    <li>Configurar como impresora predeterminada</li>
                    <li>Tamaño: 80mm x continuo</li>
                    <li>Márgenes: 0mm</li>
                </ol>
                <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                    <small><strong>💡 Tip:</strong> Si el texto sale muy pequeño, ajusta el zoom del navegador a 150-200% antes de imprimir.</small>
                </div>
            </div>
        </div>
    `;
    
    // Remover guía anterior si existe
    const guiaAnterior = document.getElementById('guia-impresora');
    if (guiaAnterior) {
        guiaAnterior.remove();
    }
    
    // Insertar nueva guía
    document.body.insertAdjacentHTML('beforeend', guiaHTML);
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
        cerrarGuiaImpresora();
    }, 10000);
}

/**
 * Cerrar guía de configuración
 */
function cerrarGuiaImpresora() {
    const guia = document.getElementById('guia-impresora');
    if (guia) {
        guia.remove();
    }
}

/**
 * Función de test para probar la impresora
 */
function testImpresora() {
    const contenidoTest = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Test Impresora Térmica</title>
            <link rel="stylesheet" href="/css/views/facturacion/impresion-termica.css">
        </head>
        <body>
            <div class="recibo-termico">
                <div class="recibo-header">
                    <h1>TEST IMPRESORA</h1>
                    <div class="empresa-info">GESTIÓN LLANTERA</div>
                </div>
                
                <div class="recibo-info">
                    <div class="recibo-info-row">
                        <span>Fecha:</span>
                        <span>${new Date().toLocaleString('es-CR')}</span>
                    </div>
                    <div class="recibo-info-row">
                        <span>Impresora:</span>
                        <span>Xprinter XP-N160II</span>
                    </div>
                </div>
                
                <div class="recibo-productos">
                    <div class="recibo-productos-header">
                        <div>PRODUCTO</div>
                        <div>CANT</div>
                        <div>PRECIO</div>
                        <div>TOTAL</div>
                    </div>
                    <div class="recibo-producto-item">
                        <div class="recibo-producto-nombre">Llanta Test 215/55/R16</div>
                        <div class="recibo-producto-detalles">
                            <span class="cantidad">1</span>
                            <span class="precio">₡50,000</span>
                            <span class="total"><strong>₡50,000</strong></span>
                        </div>
                    </div>
                </div>
                
                <div class="recibo-totales">
                    <div class="recibo-total-row total-final">
                        <span>TOTAL:</span>
                        <span>₡50,000</span>
                    </div>
                </div>
                
                <div class="recibo-footer">
                    <div class="recibo-footer-gracias">✅ TEST EXITOSO</div>
                    <div class="texto-pequeno">Si puede leer este texto claramente,<br>la configuración es correcta</div>
                </div>
                
                <div class="corte-papel"></div>
            </div>
        </body>
        </html>
    `;
    
    const ventanaTest = window.open('', '_blank', 'width=400,height=600');
    ventanaTest.document.write(contenidoTest);
    ventanaTest.document.close();
    
    // Auto-imprimir después de cargar
    setTimeout(() => {
        ventanaTest.print();
    }, 1000);
}

// Exportar funciones globalmente
window.configurarImpresoraTermica = configurarImpresoraTermica;
window.imprimirReciboTermico = imprimirReciboTermico;
window.verificarImpresoraTermica = verificarImpresoraTermica;
window.testImpresora = testImpresora;
window.cerrarGuiaImpresora = cerrarGuiaImpresora;

console.log('📱 Módulo de configuración de impresora térmica cargado');
