
/**
 * ===== MÓDULO DE IMPRESIÓN TÉRMICA =====
 * Funciones especializadas para generar e imprimir recibos en impresoras térmicas
 */

/**
 * Configuración específica para impresoras térmicas
 */
const CONFIG_TERMICA = {
    // Anchos máximos por tipo de impresora
    ANCHO_58MM: 32,
    ANCHO_80MM: 48,
    
    // Configuración de impresión
    TIMEOUT_IMPRESION: 15000,
    DELAY_CERRAR_VENTANA: 1000,
    
    // Estilos para diferentes tipos de documento
    ESTILOS: {
        factura: {
            titulo: 'FACTURA DE VENTA',
            color_principal: '#28a745'
        },
        proforma: {
            titulo: 'PROFORMA',
            color_principal: '#17a2b8'
        },
        recibo: {
            titulo: 'RECIBO',
            color_principal: '#6c757d'
        }
    }
};

/**
 * Función principal para generar recibo térmico
 */
function generarReciboTermico(datosFactura, productos, totales, opciones = {}) {
    console.log('🖨️ === INICIANDO GENERACIÓN DE RECIBO TÉRMICO ===');
    console.log('🖨️ Datos recibidos:', { datosFactura, productos: productos.length, totales });

    const configuracion = {
        ancho: opciones.ancho || CONFIG_TERMICA.ANCHO_80MM,
        tipo: opciones.tipo || 'factura',
        ...opciones
    };

    // Determinar tipo de documento
    const esProforma = datosFactura.numeroFactura && datosFactura.numeroFactura.startsWith('PROF');
    const tipoDocumento = esProforma ? 'proforma' : configuracion.tipo;

    // Generar contenido HTML
    const contenidoHTML = construirContenidoRecibo(datosFactura, productos, totales, tipoDocumento, configuracion);
    
    // Intentar impresión con ventana emergente
    try {
        imprimirConVentanaEmergente(contenidoHTML, datosFactura.numeroFactura, tipoDocumento);
    } catch (error) {
        console.error('❌ Error con ventana emergente, usando método directo:', error);
        imprimirDirecto(contenidoHTML, datosFactura.numeroFactura);
    }
}

/**
 * Construir el contenido HTML del recibo
 */
function construirContenidoRecibo(datosFactura, productos, totales, tipoDocumento, configuracion) {
    const fecha = new Date().toLocaleDateString('es-CR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    const hora = new Date().toLocaleTimeString('es-CR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // Información del cliente
    const nombreCliente = totales.cliente?.nombre || 
                         totales.cliente?.nombreCliente || 
                         datosFactura?.nombreCliente || 
                         'Cliente General';

    const usuarioCreador = totales.usuario?.nombre || 
                          totales.usuario?.nombreUsuario || 
                          datosFactura?.usuarioCreadorNombre || 
                          'Sistema';

    // Construir secciones
    const encabezado = construirEncabezado(datosFactura.numeroFactura, tipoDocumento);
    const infoTransaccion = construirInfoTransaccion(fecha, hora, nombreCliente, usuarioCreador);
    const seccionProductos = construirSeccionProductos(productos, configuracion.ancho);
    const seccionTotales = construirSeccionTotales(totales, configuracion.ancho);
    const seccionPago = construirSeccionPago(totales);
    const seccionPendientes = construirSeccionPendientes(datosFactura.numeroFactura);
    const seccionProforma = tipoDocumento === 'proforma' ? construirSeccionProforma(datosFactura.numeroFactura) : '';
    const piePagina = construirPiePagina(fecha, hora);

    return `
        <div class="recibo-container-termico">
            ${encabezado}
            ${infoTransaccion}
            <div class="separador-termico"></div>
            ${seccionProductos}
            <div class="separador-termico"></div>
            ${seccionTotales}
            <div class="separador-termico"></div>
            ${seccionPago}
            ${seccionPendientes}
            ${seccionProforma}
            ${piePagina}
            <div class="espaciado-final-termico"></div>
        </div>
    `;
}

/**
 * Construir encabezado del recibo
 */
function construirEncabezado(numeroFactura, tipoDocumento) {
    const config = CONFIG_TERMICA.ESTILOS[tipoDocumento] || CONFIG_TERMICA.ESTILOS.factura;
    
    return `
        <div class="encabezado-termico">
            <div class="nombre-empresa-termico">GESTIÓN LLANTERA</div>
            <div class="info-empresa-termico">Sistema de Facturación</div>
            <div class="telefono-termico">Tel: (506) 0000-0000</div>
            <div class="tipo-documento-termico">${config.titulo}</div>
            <div class="numero-factura-termico">No. ${numeroFactura || 'N/A'}</div>
        </div>
    `;
}

/**
 * Construir información de transacción
 */
function construirInfoTransaccion(fecha, hora, nombreCliente, usuarioCreador) {
    return `
        <div class="info-transaccion-termico">
            <div>Fecha: ${fecha}</div>
            <div>Hora: ${hora}</div>
            <div>Cliente: ${truncarTextoTermico(nombreCliente, 25)}</div>
            <div>Cajero: ${truncarTextoTermico(usuarioCreador, 25)}</div>
        </div>
    `;
}

/**
 * Construir sección de productos
 */
function construirSeccionProductos(productos, anchoMaximo) {
    let html = `
        <div class="seccion-productos-termico">
            <div class="titulo-seccion-termico">DETALLE DE PRODUCTOS</div>
    `;

    productos.forEach(producto => {
        const nombreTruncado = truncarTextoTermico(producto.nombreProducto, 28);
        const subtotalProducto = producto.precioUnitario * producto.cantidad;
        
        // Construir información de medida de llanta
        let infoLlanta = '';
        if (producto.esLlanta || producto.EsLlanta) {
            let medidaLlanta = '';
            
            // Intentar obtener medida desde diferentes propiedades
            if (producto.medidaCompleta) {
                medidaLlanta = producto.medidaCompleta;
            } else if (producto.MedidaCompleta) {
                medidaLlanta = producto.MedidaCompleta;
            } else if (producto.llanta && producto.llanta.ancho && producto.llanta.diametro) {
                // Construir medida desde objeto llanta
                const llanta = producto.llanta;
                if (llanta.perfil && llanta.perfil > 0) {
                    medidaLlanta = `${llanta.ancho}/${llanta.perfil}/R${llanta.diametro}`;
                } else {
                    medidaLlanta = `${llanta.ancho}/R${llanta.diametro}`;
                }
            } else if (producto.Ancho && producto.Diametro) {
                // Construir medida desde propiedades directas
                if (producto.Perfil && producto.Perfil > 0) {
                    medidaLlanta = `${producto.Ancho}/${producto.Perfil}/R${producto.Diametro}`;
                } else {
                    medidaLlanta = `${producto.Ancho}/R${producto.Diametro}`;
                }
            }
            
            if (medidaLlanta) {
                infoLlanta = `<div class="producto-medida-termico">📏 ${medidaLlanta}</div>`;
            }
        }
        
        html += `
            <div class="producto-item-termico">
                <div class="producto-nombre-termico">${nombreTruncado}</div>
                ${infoLlanta}
                <div class="producto-detalle-termico">${formatearLineaTermica(
                    `${producto.cantidad} x ₡${producto.precioUnitario.toFixed(0)}`, 
                    `₡${subtotalProducto.toFixed(0)}`,
                    anchoMaximo
                )}</div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

/**
 * Construir sección de totales
 */
function construirSeccionTotales(totales, anchoMaximo) {
    return `
        <div class="seccion-totales-termico">
            <div class="linea-total-termico">${formatearLineaTermica('Subtotal:', `₡${totales.subtotal.toFixed(0)}`, anchoMaximo)}</div>
            <div class="linea-total-termico">${formatearLineaTermica('IVA (13%):', `₡${totales.iva.toFixed(0)}`, anchoMaximo)}</div>
            <div class="separador-total-termico"></div>
            <div class="total-final-termico">${formatearLineaTermica('TOTAL:', `₡${totales.total.toFixed(0)}`, anchoMaximo)}</div>
        </div>
    `;
}

/**
 * Construir sección de método de pago
 */
function construirSeccionPago(totales) {
    const metodoPago = totales.metodoPago || 'Efectivo';
    
    // Verificar si es pago múltiple
    if (window.detallesPagoActuales && window.detallesPagoActuales.length > 1) {
        let html = `
            <div class="seccion-pago-termico">
                <div class="titulo-seccion-termico">DETALLE DE PAGOS MÚLTIPLES</div>
        `;
        
        window.detallesPagoActuales.forEach(pago => {
            const metodoPagoNombre = window.CONFIGURACION_PRECIOS?.[pago.metodoPago]?.nombre || pago.metodoPago;
            html += `
                <div class="linea-pago-termico">
                    <div class="metodo-monto-termico">${formatearLineaTermica(metodoPagoNombre + ':', `₡${pago.monto.toFixed(0)}`)}</div>
                    ${pago.referencia ? `<div class="referencia-termico">Ref: ${truncarTextoTermico(pago.referencia, 28)}</div>` : ''}
                </div>
            `;
        });
        
        const totalPagado = window.detallesPagoActuales.reduce((sum, p) => sum + p.monto, 0);
        html += `
                <div class="separador-pago-termico"></div>
                <div class="total-pagado-termico">${formatearLineaTermica('Total Pagado:', `₡${totalPagado.toFixed(0)}`)}</div>
            </div>
        `;
        
        return html;
    } else {
        return `
            <div class="seccion-pago-termico">
                <div class="titulo-seccion-termico">MÉTODO DE PAGO: ${metodoPago.toUpperCase()}</div>
            </div>
        `;
    }
}

/**
 * Construir sección de productos pendientes
 */
function construirSeccionPendientes(numeroFactura) {
    const tieneProductosPendientes = window.productosPendientesEntrega && window.productosPendientesEntrega.length > 0;
    const tieneCodigosSeguimiento = window.codigosSeguimientoPendientes && window.codigosSeguimientoPendientes.length > 0;
    const facturaConPendientes = window.facturaConPendientes;
    
    if (!tieneProductosPendientes && !tieneCodigosSeguimiento && !facturaConPendientes) {
        return '';
    }

    console.log('🎫 Generando sección de pendientes para recibo térmico');

    let html = `
        <div class="separador-termico"></div>
        <div class="seccion-pendientes-termico">
            <div class="titulo-seccion-termico">⏳ PRODUCTOS PENDIENTES</div>
            <div class="info-pendientes-termico">
                <div>IMPORTANTE: Algunos productos</div>
                <div>quedan pendientes de entrega</div>
                <div>por falta de stock.</div>
            </div>
            <div class="separador-pendientes-termico"></div>
    `;

    if (tieneCodigosSeguimiento) {
        window.codigosSeguimientoPendientes.forEach(pendiente => {
            const cantidadPendiente = pendiente.cantidadPendiente || 0;
            const nombreProducto = truncarTextoTermico(pendiente.nombreProducto || 'Producto', 22);
            const codigoSeguimiento = pendiente.codigoSeguimiento || `${numeroFactura}-${pendiente.productoId}`;
            
            html += `
                <div class="producto-pendiente-termico">
                    <div class="pendiente-nombre-termico">${nombreProducto}</div>
                    <div class="pendiente-cantidad-termico">Pendiente: ${cantidadPendiente} unidad(es)</div>
                    <div class="pendiente-codigo-termico">Código: ${codigoSeguimiento}</div>
                </div>
            `;
        });
    } else if (tieneProductosPendientes) {
        window.productosPendientesEntrega.forEach(pendiente => {
            const cantidadPendiente = pendiente.cantidadPendiente || pendiente.cantidad || 0;
            const nombreProducto = truncarTextoTermico(pendiente.nombreProducto || 'Producto', 25);
            
            html += `
                <div class="producto-pendiente-termico">
                    <div class="pendiente-nombre-termico">${nombreProducto}</div>
                    <div class="pendiente-cantidad-termico">Pendiente: ${cantidadPendiente} unidad(es)</div>
                    <div class="pendiente-codigo-termico">Código: ${numeroFactura}-${pendiente.productoId || 'PEND'}</div>
                </div>
            `;
        });
    } else {
        html += `
            <div class="producto-pendiente-termico">
                <div class="pendiente-nombre-termico">Consulte detalles en caja</div>
                <div class="pendiente-codigo-termico">Código: ${numeroFactura}-PEND</div>
            </div>
        `;
    }

    html += `
            <div class="separador-pendientes-termico"></div>
            <div class="instrucciones-pendientes-termico">
                <div>📞 Le notificaremos cuando</div>
                <div>llegue el stock faltante</div>
                <div>🎫 CONSERVE ESTE RECIBO</div>
                <div>como respaldo de entrega</div>
            </div>
    `;

    if (tieneCodigosSeguimiento) {
        html += `
            <div class="codigos-seguimiento-termico">
                <div>📋 Códigos de seguimiento:</div>
                ${window.codigosSeguimientoPendientes.map(p => 
                    `<div class="codigo-recuadro-termico">${p.codigoSeguimiento}</div>`
                ).join('')}
            </div>
        `;
    } else {
        html += `
            <div class="codigo-seguimiento-termico">
                <div>📋 Código de seguimiento:</div>
                <div class="codigo-recuadro-termico">${numeroFactura}-PEND</div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

/**
 * Construir sección especial para proformas
 */
function construirSeccionProforma(numeroFactura) {
    return `
        <div class="separador-termico"></div>
        <div class="seccion-proforma-termico">
            <div class="titulo-seccion-termico">⚠️ IMPORTANTE - PROFORMA</div>
            <div class="advertencia-proforma-termico">
                <div class="info-proforma-termico">
                    <div><strong>VALIDEZ:</strong> Esta proforma tiene</div>
                    <div>validez por 30 días calendario</div>
                    <div>desde su fecha de emisión.</div>
                </div>
                <div class="separador-proforma-termico"></div>
                <div class="info-proforma-termico">
                    <div><strong>CONDICIONES:</strong></div>
                    <div>• Los precios están sujetos a</div>
                    <div>  cambios sin previo aviso</div>
                    <div>• La disponibilidad de productos</div>
                    <div>  está sujeta al stock actual</div>
                    <div>• Para facturación presente</div>
                    <div>  este documento</div>
                </div>
                <div class="separador-proforma-termico"></div>
                <div class="info-proforma-termico">
                    <div><strong>NOTA LEGAL:</strong></div>
                    <div>Este documento NO constituye</div>
                    <div>una factura fiscal. Es una</div>
                    <div>cotización formal que requiere</div>
                    <div>confirmación para proceder con</div>
                    <div>la facturación oficial.</div>
                </div>
                <div class="separador-proforma-termico"></div>
                <div class="codigo-proforma-termico">
                    <div>📋 Código de Proforma:</div>
                    <div class="codigo-recuadro-termico">${numeroFactura}</div>
                    <div class="conservar-documento-termico">🎫 CONSERVE ESTE DOCUMENTO</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Construir pie de página
 */
function construirPiePagina(fecha, hora) {
    return `
        <div class="pie-pagina-termico">
            <div>¡Gracias por su compra!</div>
            <div>Vuelva pronto</div>
            <div>www.gestionllantera.com</div>
            <div class="fecha-generacion-termico">Recibo: ${fecha} ${hora}</div>
        </div>
    `;
}

/**
 * Imprimir usando ventana emergente
 */
function imprimirConVentanaEmergente(contenidoHTML, numeroFactura, tipoDocumento) {
    console.log('🖨️ Iniciando impresión con ventana emergente');

    const ventanaImpresion = window.open('', '_blank', 'width=320,height=600,scrollbars=yes,resizable=yes');

    if (!ventanaImpresion) {
        throw new Error('No se pudo abrir ventana emergente');
    }

    const documentoCompleto = construirDocumentoCompleto(contenidoHTML, numeroFactura, tipoDocumento);
    
    ventanaImpresion.document.open();
    ventanaImpresion.document.write(documentoCompleto);
    ventanaImpresion.document.close();

    // Enfocar ventana
    setTimeout(() => {
        try {
            ventanaImpresion.focus();
        } catch (e) {
            console.log('⚠️ No se pudo enfocar la ventana');
        }
    }, 100);

    console.log('✅ Ventana de impresión creada exitosamente');
}

/**
 * Construir documento HTML completo para impresión
 */
function construirDocumentoCompleto(contenidoHTML, numeroFactura, tipoDocumento) {
    const titulo = tipoDocumento === 'proforma' ? 'Proforma' : 'Recibo Térmico';
    
    return `
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${titulo} - ${numeroFactura}</title>
                <link rel="stylesheet" href="/css/impresion-termica.css">
            </head>
            <body>
                ${contenidoHTML}
                <script src="/js/utils/impresionTermicaScript.js"></script>
            </body>
        </html>
    `;
}

/**
 * Impresión directa como fallback
 */
function imprimirDirecto(contenidoHTML, numeroFactura) {
    console.log('🖨️ === IMPRESIÓN DIRECTA DE RECIBO ===');
    
    try {
        const printDiv = document.createElement('div');
        printDiv.id = 'recibo-impresion-temporal';
        printDiv.style.position = 'fixed';
        printDiv.style.left = '-9999px';
        printDiv.style.top = '-9999px';
        printDiv.style.visibility = 'hidden';
        printDiv.innerHTML = contenidoHTML;
        
        document.body.appendChild(printDiv);
        
        const printStyles = document.createElement('style');
        printStyles.id = 'recibo-print-styles';
        printStyles.innerHTML = `
            @media print {
                * { visibility: hidden; }
                #recibo-impresion-temporal,
                #recibo-impresion-temporal * { visibility: visible; }
                #recibo-impresion-temporal {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 80mm;
                    font-family: 'Arial', sans-serif;
                    font-size: 11px;
                    line-height: 1.2;
                }
                @page {
                    size: 80mm auto;
                    margin: 2mm;
                }
            }
        `;
        
        document.head.appendChild(printStyles);
        
        window.print();
        
        setTimeout(() => {
            if (printDiv.parentNode) printDiv.parentNode.removeChild(printDiv);
            if (printStyles.parentNode) printStyles.parentNode.removeChild(printStyles);
        }, 1000);
        
        console.log('✅ Impresión directa iniciada');
        
    } catch (error) {
        console.error('❌ Error en impresión directa:', error);
        alert(`Recibo ${numeroFactura} generado. Active las ventanas emergentes para impresión automática.`);
    }
}

/**
 * Funciones auxiliares
 */
function truncarTextoTermico(texto, maxCaracteres) {
    if (!texto) return '';
    return texto.length > maxCaracteres ? texto.substring(0, maxCaracteres - 3) + '...' : texto;
}

function formatearLineaTermica(izquierda, derecha, anchoTotal = 32) {
    const espacios = anchoTotal - izquierda.length - derecha.length;
    return izquierda + ' '.repeat(Math.max(0, espacios)) + derecha;
}

/**
 * Exportar funciones principales
 */
window.generarReciboTermico = generarReciboTermico;
window.CONFIG_TERMICA = CONFIG_TERMICA;

console.log('🖨️ Módulo de impresión térmica cargado correctamente');
