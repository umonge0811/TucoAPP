
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
    
    // ===== CONFIGURACIÓN DE LA EMPRESA =====
    EMPRESA: {
        nombre: 'LLANTAS Y MÁS TC',
        descripcion: 'Sistema de Facturación',
        telefono: '(506) 8916-6180',
        correo: 'info@llantasymastc.com',
        sitioWeb: 'www.llantasymastc.com',
        desarrolladoPor: 'Desarrollado por ticodevcr.com' // Opcional
    },
    
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
        detallesPago: opciones.detallesPago || null,
        ...opciones
    };

    // Determinar tipo de documento

/**
 * Construir medida completa de llanta
 */
function construirMedidaCompleta(producto) {
    try {
        // Verificar si ya tiene medida completa construida
        if (producto.medidaCompleta) return producto.medidaCompleta;
        if (producto.MedidaCompleta) return producto.MedidaCompleta;
        if (producto.medidaLlanta) return producto.medidaLlanta;
        if (producto.MedidaLlanta) return producto.MedidaLlanta;
        
        // Verificar si tiene información de llanta anidada (como viene desde la API)
        let llantaInfo = null;
        if (producto.llanta) {
            llantaInfo = producto.llanta;
        } else if (producto.Llanta && Array.isArray(producto.Llanta) && producto.Llanta.length > 0) {
            llantaInfo = producto.Llanta[0];
        }
        
        if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
            if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                // Formato completo con perfil: 215/55/R16
                return `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
            } else {
                // Formato sin perfil: 215/R16
                return `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
            }
        }
        
        // Construir desde las propiedades individuales del producto
        const ancho = producto.ancho || producto.Ancho || '';
        const perfil = producto.perfil || producto.Perfil || '';
        const aro = producto.aro || producto.Aro || producto.diametro || producto.Diametro || '';
        
        // Construir medida básica
        if (ancho && aro) {
            if (perfil && perfil > 0) {
                return `${ancho}/${perfil}/R${aro}`;
            } else {
                return `${ancho}/R${aro}`;
            }
        }
        
        return null; // No hay medida disponible
        
    } catch (error) {
        console.error('❌ Error construyendo medida completa:', error);
        return null;
    }
}


    const esProforma = datosFactura.numeroFactura && datosFactura.numeroFactura.startsWith('PROF');
    const tipoDocumento = esProforma ? 'proforma' : configuracion.tipo;

    // Procesar productos para incluir medida completa
    const productosConMedida = productos.map(producto => {
        const productoCompleto = { ...producto };
        
        // Si es una llanta, construir la medida completa si no existe
        if (producto.esLlanta || producto.EsLlanta) {
            const medidaConstruida = construirMedidaCompleta(producto);
            if (medidaConstruida) {
                productoCompleto.medidaCompleta = medidaConstruida;
            }
        }
        
        return productoCompleto;
    });

    // Generar contenido HTML
    const contenidoHTML = construirContenidoRecibo(datosFactura, productosConMedida, totales, tipoDocumento, configuracion);
    
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
    const seccionPago = construirSeccionPago(totales, configuracion.detallesPago);
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
    const empresa = CONFIG_TERMICA.EMPRESA;
    
    return `
        <div class="encabezado-termico">
            <div class="nombre-empresa-termico">${empresa.nombre}</div>
            <div class="info-empresa-termico">${empresa.descripcion}</div>
            <div class="telefono-termico">Tel: ${empresa.telefono}</div>
            <div class="info-empresa-termico">Correo: ${empresa.correo}</div>
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
        let nombreCompleto = producto.nombreProducto;
        
        // Solo agregar medida si es llanta Y no está ya incluida en el nombre
        const esLlanta = producto.esLlanta || producto.EsLlanta;
        if (esLlanta) {
            // Remover la palabra "Llanta" del nombre del producto para ahorrar espacio
            nombreCompleto = nombreCompleto.replace(/\bLlanta\b/gi, '').trim();
            
            let medidaLlanta = '';
            
            // Obtener la medida de llanta desde diferentes fuentes
            if (producto.medidaCompleta) {
                medidaLlanta = producto.medidaCompleta;
            } else if (producto.MedidaCompleta) {
                medidaLlanta = producto.MedidaCompleta;
            } else if (producto.medidaLlanta) {
                medidaLlanta = producto.medidaLlanta;
            } else if (producto.MedidaLlanta) {
                medidaLlanta = producto.MedidaLlanta;
            }
            
            // Solo agregar la medida si no está ya incluida en el nombre del producto
            if (medidaLlanta && !nombreCompleto.includes(medidaLlanta)) {
                nombreCompleto = `${medidaLlanta} ${nombreCompleto}`;
            }
        }
        
        const nombreTruncado = truncarTextoTermico(nombreCompleto, 28);
        const subtotalProducto = producto.precioUnitario * producto.cantidad;
        
        html += `
            <div class="producto-item-termico">
                <div class="producto-nombre-termico">${nombreTruncado}</div>
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
function construirSeccionPago(totales, detallesPago = null) {
    const metodoPago = totales.metodoPago || 'Efectivo';
    
    // Verificar si es pago múltiple - priorizar totales.detallesPago, luego parámetro, luego window
    const detallesPagoValidos = totales.detallesPago || detallesPago || window.detallesPagoActuales;
    
    console.log('🔍 === DEBUG SECCIÓN PAGO MEJORADO ===');
    console.log('🔍 totales completo:', totales);
    console.log('🔍 totales.metodoPago:', totales.metodoPago);
    console.log('🔍 totales.detallesPago:', totales.detallesPago);
    console.log('🔍 totales.infoPagoMultiple:', totales.infoPagoMultiple);
    console.log('🔍 detallesPago (parámetro):', detallesPago);
    console.log('🔍 window.detallesPagoActuales:', window.detallesPagoActuales);
    console.log('🔍 detallesPagoValidos:', detallesPagoValidos);
    
    // ✅ VERIFICAR TAMBIÉN EN infoPagoMultiple SI NO HAY DETALLES DIRECTOS
    let detallesPagoFinal = detallesPagoValidos;
    if (!detallesPagoFinal && totales.infoPagoMultiple && totales.infoPagoMultiple.detallesPago) {
        detallesPagoFinal = totales.infoPagoMultiple.detallesPago;
        console.log('🔍 Usando detalles desde infoPagoMultiple:', detallesPagoFinal);
    }
    
    if (detallesPagoFinal && detallesPagoFinal.length > 1) {
        console.log('✅ Construyendo sección de pago múltiple con', detallesPagoFinal.length, 'métodos');
        let html = `
            <div class="seccion-pago-termico">
                <div class="titulo-seccion-termico">DETALLE DE PAGOS MÚLTIPLES</div>
        `;
        
        detallesPagoFinal.forEach((pago, index) => {
            const metodoPagoNombre = window.CONFIGURACION_PRECIOS?.[pago.metodoPago]?.nombre || pago.metodoPago;
            console.log(`💳 Pago ${index + 1}: ${metodoPagoNombre} - ₡${pago.monto}`);
            html += `
                <div class="linea-pago-termico">
                    <div class="metodo-monto-termico">${formatearLineaTermica(metodoPagoNombre + ':', `₡${pago.monto.toFixed(0)}`)}</div>
                    ${pago.referencia ? `<div class="referencia-termico">Ref: ${truncarTextoTermico(pago.referencia, 28)}</div>` : ''}
                </div>
            `;
        });
        
        const totalPagado = detallesPagoFinal.reduce((sum, p) => sum + p.monto, 0);
        html += `
                <div class="separador-pago-termico"></div>
                <div class="total-pagado-termico">${formatearLineaTermica('Total Pagado:', `₡${totalPagado.toFixed(0)}`)}</div>
            </div>
        `;
        
        console.log('✅ Sección de pago múltiple construida correctamente');
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
            let nombreCompleto = pendiente.nombreProducto || 'Producto';
            
            // Si es una llanta, agregar la medida
            if (pendiente.medidaLlanta) {
                nombreCompleto = `${nombreCompleto} - ${pendiente.medidaLlanta}`;
            } else if (pendiente.MedidaLlanta) {
                nombreCompleto = `${nombreCompleto} - ${pendiente.MedidaLlanta}`;
            }
            
            // ✅ MOSTRAR NOMBRE COMPLETO SIN TRUNCAR
            const nombreProducto = nombreCompleto;
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
            let nombreCompleto = pendiente.nombreProducto || 'Producto';
            
            // Si es una llanta, agregar la medida
            if (pendiente.medidaLlanta) {
                nombreCompleto = `${nombreCompleto} - ${pendiente.medidaLlanta}`;
            } else if (pendiente.MedidaLlanta) {
                nombreCompleto = `${nombreCompleto} - ${pendiente.MedidaLlanta}`;
            }
            
            // ✅ MOSTRAR NOMBRE COMPLETO SIN TRUNCAR
            const nombreProducto = nombreCompleto;
            
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
            <div class="instrucciones-pendientes-completas-termico">
                <div class="titulo-instrucciones-termico">📋 INSTRUCCIONES:</div>
                <div class="instruccion-item-termico">• Conserve este recibo como</div>
                <div class="instruccion-item-termico">  comprobante de entrega</div>
                <div class="instruccion-item-termico">• La entrega se realizará cuando</div>
                <div class="instruccion-item-termico">  haya stock disponible</div>
                <div class="instruccion-item-termico">• Será contactado cuando los</div>
                <div class="instruccion-item-termico">  productos estén listos</div>
                <div class="instruccion-item-termico">• Use los códigos de seguimiento</div>
                <div class="instruccion-item-termico">  para consultar el estado</div>
                <div class="conservar-recibo-termico">🎫 CONSERVE ESTE RECIBO</div>
                <div class="respaldo-entrega-termico">como respaldo de entrega</div>
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
                    <div>validez por 15 días calendario</div>
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
    const empresa = CONFIG_TERMICA.EMPRESA;
    
    return `
        <div class="pie-pagina-termico">
            <div>¡Gracias por su compra!</div>
            <div>Vuelva pronto</div>
            <div>${empresa.sitioWeb}</div>
            ${empresa.desarrolladoPor ? `<div style="font-size: 13px; font-weight: bold; margin-top: 2mm; color: #000;">${empresa.desarrolladoPor}</div>` : ''}
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
