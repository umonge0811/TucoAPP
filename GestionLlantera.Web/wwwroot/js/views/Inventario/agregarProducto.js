document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado - inicializando script de agregar producto');

    // Referencias a elementos del DOM
    const form = document.getElementById('formProducto');
    const submitButton = document.getElementById('submitButton');
    const esLlantaCheckbox = document.getElementById('esLlanta');
    const llantaFields = document.getElementById('llantaFields');
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const selectImagesBtn = document.getElementById('selectImagesBtn');

    // *** ELEMENTOS PARA UTILIDAD - MEJORADOS PARA NUEVA FUNCIONALIDAD ***
    const tipoProductoInfo = document.getElementById('tipoProductoInfo');
    const textoTipoProducto = document.getElementById('textoTipoProducto');
    const modoAutomaticoRadio = document.getElementById('modoAutomatico');
    const modoManualRadio = document.getElementById('modoManual');
    const cardAutomatico = document.getElementById('cardAutomatico');
    const cardManual = document.getElementById('cardManual');
    const camposAutomaticos = document.getElementById('camposAutomaticos');
    const campoManual = document.getElementById('campoManual');
    const inputCosto = document.getElementById('inputCosto');
    const inputUtilidad = document.getElementById('inputUtilidad');
    const inputPrecioManual = document.getElementById('inputPrecioManual');
    const precioCalculado = document.getElementById('precioCalculado');
    const desglosePrecio = document.getElementById('desglosePrecio');
    const textoResumen = document.getElementById('textoResumen');

    // *** NUEVOS ELEMENTOS PARA PRECIO DE VENTA Y MARGEN ***
    const inputPrecioVenta = document.getElementById('inputPrecioVenta');
    const inputMargenPorcentaje = document.getElementById('inputMargenPorcentaje');
    const hiddenPorcentajeUtilidad = document.getElementById('hiddenPorcentajeUtilidad');
    const hiddenPrecio = document.getElementById('hiddenPrecio');

    // Verificar si los elementos críticos existen
    if (!form) {
        console.error('Error crítico: No se encontró el formulario con ID "formProducto"');
        return;
    }

    console.log('Referencias a elementos obtenidas correctamente');

    // DIAGNÓSTICO - Verificar elementos de utilidad
    console.log('=== DIAGNÓSTICO DE ELEMENTOS DE UTILIDAD ===');
    console.log('modoAutomaticoRadio:', !!modoAutomaticoRadio);
    console.log('modoManualRadio:', !!modoManualRadio);
    console.log('inputCosto:', !!inputCosto);
    console.log('inputUtilidad:', !!inputUtilidad);
    console.log('precioCalculado:', !!precioCalculado);
    console.log('desglosePrecio:', !!desglosePrecio);
    console.log('textoResumen:', !!textoResumen);

    // Configuración de toastr
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            "closeButton": true,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "timeOut": "5000"
        };
    }

    // ========================================
    // FUNCIONES AUXILIARES
    // ========================================

    function marcarCamposObligatorios() {
        const camposRequeridos = document.querySelectorAll('[required]');
        camposRequeridos.forEach(campo => {
            const formGroup = campo.closest('.mb-3');
            if (formGroup) {
                formGroup.classList.add('required');
            }
        });
    }

    function validarCampo(campo) {
        if (!campo.checkValidity) return true;

        const esValido = campo.checkValidity();

        if (esCampoVisible(campo)) {
            if (!esValido) {
                campo.classList.add('is-invalid');
                campo.classList.remove('is-valid');
            } else {
                campo.classList.remove('is-invalid');
                campo.classList.add('is-valid');
            }
        }

        return esValido;
    }

    function esCampoVisible(campo) {
        const informacionBasica = document.getElementById('informacionBasica');

        // ✅ NUEVO: Si estamos en modo llanta, ignorar TODOS los campos de información básica
        if (esLlantaCheckbox && esLlantaCheckbox.checked && informacionBasica && informacionBasica.contains(campo)) {
            console.log(`❌ Campo ${campo.name || campo.id} en Información Básica - ignorado en modo llanta`);
            return false;
        }

        // Si el campo es de llanta y el checkbox no está marcado, ignorar
        if ((!esLlantaCheckbox || !esLlantaCheckbox.checked) && llantaFields && llantaFields.contains(campo)) {
            console.log(`❌ Campo ${campo.name || campo.id} en Llanta - ignorado en modo general`);
            return false;
        }

        // Resto de validaciones...
        console.log(`✅ Campo ${campo.name || campo.id} - validación activa`);
        return true;
    }


    // ========================================
    // INICIALIZACIÓN
    // ========================================

    marcarCamposObligatorios();

    // ========================================
    // GESTIÓN DE TIPO DE PRODUCTO (LLANTA)
    // ========================================

    // NUEVA FUNCIÓN: Sincronizar campos de llanta a campos principales
    // FUNCIÓN MEJORADA: Sincronizar campos de llanta
    function sincronizarCamposLlanta() {
        console.log('🔄 Configurando sincronización de campos de llanta...');

        // ✅ NO sincronizar nombre - se generará automáticamente
        const cantidadLlanta = document.getElementById('cantidadInventarioLlanta');
        const stockLlanta = document.getElementById('stockMinimoLlanta');
        const descripcionLlanta = document.getElementById('descripcionLlanta');

        const hiddenCantidad = document.getElementById('hiddenCantidadInventario');
        const hiddenStock = document.getElementById('hiddenStockMinimo');
        const hiddenDescripcion = document.getElementById('hiddenDescripcion');

        // Sincronización en tiempo real (sin nombre)
        if (cantidadLlanta && hiddenCantidad) {
            cantidadLlanta.addEventListener('input', () => {
                hiddenCantidad.value = cantidadLlanta.value;
                console.log(`Sincronizado cantidad: ${cantidadLlanta.value}`);
            });
        }

        if (stockLlanta && hiddenStock) {
            stockLlanta.addEventListener('input', () => {
                hiddenStock.value = stockLlanta.value;
                console.log(`Sincronizado stock: ${stockLlanta.value}`);
            });
        }

        if (descripcionLlanta && hiddenDescripcion) {
            descripcionLlanta.addEventListener('input', () => {
                hiddenDescripcion.value = descripcionLlanta.value;
                console.log(`Sincronizado descripción: ${descripcionLlanta.value}`);
            });
        }

        console.log('✅ Sincronización configurada (sin nombre del producto)');
    }

    function prepararFormularioParaEnvio() {
        console.log('🔄 === PREPARANDO FORMULARIO PARA ENVÍO ===');

        // ✅ SINCRONIZAR EsLlanta
        const esLlantaHidden = document.querySelector('[name="EsLlanta"]');
        if (esLlantaHidden) {
            esLlantaHidden.value = esLlantaCheckbox && esLlantaCheckbox.checked ? 'true' : 'false';
            console.log(`🔄 EsLlanta sincronizado: ${esLlantaHidden.value}`);
        }

        if (esLlantaCheckbox && esLlantaCheckbox.checked) {
            console.log('🔄 Modo llanta detectado - procesando...');

            // ✅ LIMPIAR CAMPOS DE INFORMACIÓN BÁSICA PARA QUE NO INTERFIERAN
            const nombreBasico = document.querySelector('[name="NombreProducto"]');
            const cantidadBasica = document.querySelector('[name="CantidadEnInventario"]');
            const stockBasico = document.querySelector('[name="StockMinimo"]');
            const descripcionBasica = document.querySelector('[name="Descripcion"]');

            // ✅ OBTENER VALORES DE LLANTA ANTES DE LIMPIAR
            const cantidadLlanta = document.getElementById('cantidadInventarioLlanta');
            const stockLlanta = document.getElementById('stockMinimoLlanta');
            const descripcionLlanta = document.getElementById('descripcionLlanta');

            const valorCantidad = cantidadLlanta?.value || '0';
            const valorStock = stockLlanta?.value || '0';
            const valorDescripcion = descripcionLlanta?.value || '';

            console.log(`📊 VALORES DE LLANTA CAPTURADOS:`);
            console.log(`- Cantidad: "${valorCantidad}"`);
            console.log(`- Stock: "${valorStock}"`);
            console.log(`- Descripción: "${valorDescripcion}"`);

            // ✅ GENERAR NOMBRE AUTOMÁTICO
            const marca = document.querySelector('[name="Llanta.Marca"]')?.value || '';
            const modelo = document.querySelector('[name="Llanta.Modelo"]')?.value || '';
            let nombreGenerado = 'Llanta';
            if (marca) nombreGenerado += ` ${marca}`;
            if (modelo) nombreGenerado += ` ${modelo}`;

            // ✅ ESTABLECER VALORES EN CAMPOS PRINCIPALES (QUE VAN AL DTO)
            if (nombreBasico) {
                nombreBasico.value = nombreGenerado;
                console.log(`✅ Nombre establecido: "${nombreGenerado}"`);
            }

            if (cantidadBasica) {
                cantidadBasica.value = valorCantidad;
                console.log(`✅ Cantidad establecida: "${valorCantidad}"`);
            }

            if (stockBasico) {
                stockBasico.value = valorStock;
                console.log(`✅ Stock establecido: "${valorStock}"`);
            }

            if (descripcionBasica) {
                descripcionBasica.value = valorDescripcion;
                console.log(`✅ Descripción establecida: "${valorDescripcion}"`);
            }

            console.log('✅ Campos principales sincronizados desde llanta');
        } else {
            console.log('🔄 Modo producto general - sin cambios');
        }
    }

    // FUNCIÓN MEJORADA: Limpiar campos de llanta
    function sincronizarCamposBasicos() {
        const cantidadLlanta = document.getElementById('cantidadInventarioLlanta');
        const stockLlanta = document.getElementById('stockMinimoLlanta');
        const descripcionLlanta = document.getElementById('descripcionLlanta');

        // Limpiar valores de campos de llanta
        if (cantidadLlanta) cantidadLlanta.value = '';
        if (stockLlanta) stockLlanta.value = '';
        if (descripcionLlanta) descripcionLlanta.value = '';

        // Limpiar campos ocultos también
        const hiddenCantidad = document.getElementById('hiddenCantidadInventario');
        const hiddenStock = document.getElementById('hiddenStockMinimo');
        const hiddenDescripcion = document.getElementById('hiddenDescripcion');

        if (hiddenCantidad) hiddenCantidad.value = '';
        if (hiddenStock) hiddenStock.value = '';
        if (hiddenDescripcion) hiddenDescripcion.value = '';

        console.log('✅ Campos de llanta limpiados');
    }

    if (esLlantaCheckbox && llantaFields && tipoProductoInfo && textoTipoProducto) {
        // AGREGAR ESTA LÍNEA - Referencia al card de información básica
        const informacionBasica = document.getElementById('informacionBasica');

        function actualizarTipoProducto() {
            if (esLlantaCheckbox.checked) {

                // ✅ AGREGAR: Asegurar que EsLlanta sea true
                const esLlantaHidden = document.querySelector('[name="EsLlanta"]');
                if (esLlantaHidden) {
                    esLlantaHidden.value = 'true';
                    console.log('✅ EsLlanta establecido a: true');
                }

                // MOSTRAR campos de llanta
                llantaFields.style.display = 'block';

                // OCULTAR información básica
                if (informacionBasica) {
                    informacionBasica.style.display = 'none';

                    // REMOVER required de campos de información básica
                    const camposInformacionBasica = informacionBasica.querySelectorAll('[required]');
                    camposInformacionBasica.forEach(campo => {
                        campo.removeAttribute('required');
                        campo.classList.remove('is-invalid');
                        console.log(`❌ Required removido de: ${campo.name || campo.id}`);
                    });
                }

                // NUEVA FUNCIONALIDAD: Sincronizar campos de llanta a campos ocultos
                sincronizarCamposLlanta();

                // Actualizar el alert informativo
                tipoProductoInfo.className = 'alert alert-success d-flex align-items-center mb-0';
                textoTipoProducto.innerHTML = '<i class="bi bi-car-front-fill me-1"></i> Producto tipo Llanta - campos específicos habilitados';

                // Hacer obligatorios algunos campos de llanta (SIN perfil y SIN nombre)
                const camposObligatoriosLlanta = [
                    document.querySelector('[name="Llanta.Marca"]'),
                    document.querySelector('[name="Llanta.Ancho"]'),
                    document.querySelector('[name="Llanta.Diametro"]'),
                    // Campos de información general de llanta (SIN nombre del producto)
                    document.getElementById('cantidadInventarioLlanta'),
                    document.getElementById('stockMinimoLlanta')
                ];

                camposObligatoriosLlanta.forEach(campo => {
                    if (campo) {
                        campo.setAttribute('required', 'required');
                        const formGroup = campo.closest('.mb-3');
                        if (formGroup) formGroup.classList.add('required');
                        console.log(`✅ Required agregado a: ${campo.name || campo.id}`);
                    }
                });

                // Hacer el perfil opcional explícitamente
                const perfilField = document.querySelector('[name="Llanta.Perfil"]');
                if (perfilField) {
                    perfilField.removeAttribute('required');
                    const formGroup = perfilField.closest('.mb-3');
                    if (formGroup) formGroup.classList.remove('required');
                }

                setTimeout(() => {
                    inicializarAutocompletado();
                }, 100);

                console.log('✅ Modo llanta activado - Validaciones transferidas a campos de llanta');
            } else {

                const esLlantaHidden = document.querySelector('[name="EsLlanta"]');
                if (esLlantaHidden) {
                    esLlantaHidden.value = 'false';
                    console.log('✅ EsLlanta establecido a: false');
                }

                // OCULTAR campos de llanta
                llantaFields.style.display = 'none';

                // MOSTRAR información básica
                if (informacionBasica) {
                    informacionBasica.style.display = 'block';

                    // RESTAURAR required en campos de información básica
                    //const nombreProducto = informacionBasica.querySelector('[name="NombreProducto"]');
                    const cantidadInventario = informacionBasica.querySelector('[name="CantidadEnInventario"]');
                    const stockMinimo = informacionBasica.querySelector('[name="StockMinimo"]');

                    //if (nombreProducto) {
                    //    nombreProducto.setAttribute('required', 'required');
                    //    console.log(`✅ Required restaurado en: NombreProducto`);
                    //}
                    //if (cantidadInventario) {
                    //    cantidadInventario.setAttribute('required', 'required');
                    //    console.log(`✅ Required restaurado en: CantidadEnInventario`);
                    //}
                    //if (stockMinimo) {
                    //    stockMinimo.setAttribute('required', 'required');
                    //    console.log(`✅ Required restaurado en: StockMinimo`);
                    //}
                }

                // Actualizar el alert informativo
                tipoProductoInfo.className = 'alert alert-info d-flex align-items-center mb-0';
                textoTipoProducto.innerHTML = '<i class="bi bi-box me-1"></i> Producto general - información básica';

                // Quitar validación de campos de llanta
                const llantaInputs = llantaFields.querySelectorAll('input, select');
                llantaInputs.forEach(input => {
                    input.removeAttribute('required');
                    input.classList.remove('is-invalid');
                    const formGroup = input.closest('.mb-3');
                    if (formGroup) formGroup.classList.remove('required');
                    console.log(`❌ Required removido de campo llanta: ${input.name || input.id}`);
                });

                // NUEVA FUNCIONALIDAD: Limpiar campos de llanta
                sincronizarCamposBasicos();

                console.log('✅ Modo producto general activado - Validaciones restauradas en información básica');
            }
        }

        // ✅ ESTABLECER EL TOGGLE COMO ACTIVADO POR DEFECTO
        esLlantaCheckbox.checked = true;
        
        esLlantaCheckbox.addEventListener('change', actualizarTipoProducto);
        actualizarTipoProducto(); // Inicializar estado
    }

    // ========================================
    // GESTIÓN DE PRECIO Y UTILIDAD
    // ========================================

    if (modoAutomaticoRadio && modoManualRadio) {
        console.log('Inicializando funcionalidad de precio...');

        function actualizarEstilosTarjetas() {
            if (cardAutomatico && cardManual) {
                if (modoAutomaticoRadio.checked) {
                    cardAutomatico.classList.add('border-primary', 'bg-light');
                    cardManual.classList.remove('border-warning', 'bg-light');
                } else {
                    cardManual.classList.add('border-warning', 'bg-light');
                    cardAutomatico.classList.remove('border-primary', 'bg-light');
                }
            }
        }

        // ========================================
        // FUNCIONES DE CÁLCULO MEJORADAS
        // ========================================

        let calculandoPrecio = false; // Para evitar loops infinitos

        function calcularDesdePrecioVenta() {
            if (calculandoPrecio) return;
            calculandoPrecio = true;

            const costo = parseFloat(inputCosto.value) || 0;
            const precioVenta = parseFloat(inputPrecioVenta.value) || 0;

            console.log(`💰 Calculando desde Precio de Venta: Costo=₡${costo}, PrecioVenta=₡${precioVenta}`);

            if (costo > 0 && precioVenta > 0) {
                const utilidadDinero = precioVenta - costo;
                const margenPorcentaje = (utilidadDinero / costo) * 100;

                // Actualizar campos
                if (inputMargenPorcentaje) {
                    inputMargenPorcentaje.value = margenPorcentaje.toFixed(2);
                }

                // Sincronizar con campos ocultos para compatibilidad
                if (hiddenPorcentajeUtilidad) {
                    hiddenPorcentajeUtilidad.value = margenPorcentaje.toFixed(2);
                }
                if (hiddenPrecio) {
                    hiddenPrecio.value = precioVenta.toFixed(2);
                }

                actualizarVisualizacionPrecio(costo, precioVenta, utilidadDinero, margenPorcentaje);

                console.log(`✅ Calculado desde precio de venta: Margen=${margenPorcentaje.toFixed(2)}%`);
            } else if (costo > 0 && precioVenta === 0) {
                limpiarCalculos();
            }

            calculandoPrecio = false;
        }

        function calcularDesdeMargenPorcentaje() {
            if (calculandoPrecio) return;
            calculandoPrecio = true;

            const costo = parseFloat(inputCosto.value) || 0;
            const margenPorcentaje = parseFloat(inputMargenPorcentaje.value) || 0;

            console.log(`💰 Calculando desde Margen %: Costo=₡${costo}, Margen=${margenPorcentaje}%`);

            if (costo > 0 && margenPorcentaje >= 0) {
                const utilidadDinero = costo * (margenPorcentaje / 100);
                const precioVenta = costo + utilidadDinero;

                // Actualizar campos
                if (inputPrecioVenta) {
                    inputPrecioVenta.value = precioVenta.toFixed(2);
                }

                // Sincronizar con campos ocultos para compatibilidad
                if (hiddenPorcentajeUtilidad) {
                    hiddenPorcentajeUtilidad.value = margenPorcentaje.toFixed(2);
                }
                if (hiddenPrecio) {
                    hiddenPrecio.value = precioVenta.toFixed(2);
                }

                actualizarVisualizacionPrecio(costo, precioVenta, utilidadDinero, margenPorcentaje);

                console.log(`✅ Calculado desde margen: PrecioVenta=₡${precioVenta.toFixed(2)}`);
            } else if (costo > 0 && margenPorcentaje === 0) {
                if (inputPrecioVenta) {
                    inputPrecioVenta.value = costo.toFixed(2);
                }
                actualizarVisualizacionPrecio(costo, costo, 0, 0);
            }

            calculandoPrecio = false;
        }

        function actualizarVisualizacionPrecio(costo, precioFinal, utilidadDinero, margenPorcentaje) {
            // Animación suave
            if (precioCalculado) {
                precioCalculado.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    precioCalculado.style.transform = 'scale(1)';
                }, 200);

                precioCalculado.value = precioFinal.toLocaleString('es-CR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            if (desglosePrecio) {
                desglosePrecio.innerHTML = `
                    <i class="bi bi-calculator me-1"></i>
                    Utilidad: ₡${utilidadDinero.toLocaleString('es-CR', { minimumFractionDigits: 2 })} 
                    (${margenPorcentaje.toFixed(1)}%)
                `;
            }

            if (textoResumen) {
                const margenClass = margenPorcentaje >= 30 ? 'text-success' : margenPorcentaje >= 15 ? 'text-warning' : 'text-danger';
                textoResumen.innerHTML = `
                    <i class="bi bi-check-circle me-1 text-success"></i>
                    <strong>Precio final: ₡${precioFinal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong> 
                    <span class="${margenClass}">(${margenPorcentaje.toFixed(1)}% de margen)</span>
                `;
            }
        }

        function limpiarCalculos() {
            if (precioCalculado) {
                precioCalculado.value = '0.00';
            }

            if (desglosePrecio) {
                desglosePrecio.innerHTML = `
                    <i class="bi bi-dash-circle me-1"></i>
                    Utilidad: ₡0.00
                `;
            }

            if (textoResumen) {
                textoResumen.innerHTML = `
                    <i class="bi bi-info-circle me-1"></i>
                    Ingrese el costo y configure el precio de venta o margen de utilidad
                `;
            }

            // Limpiar campos ocultos
            if (hiddenPorcentajeUtilidad) hiddenPorcentajeUtilidad.value = '';
            if (hiddenPrecio) hiddenPrecio.value = '';
        }

        // Función de compatibilidad - mantiene la lógica antigua si se usa el campo de utilidad
        function calcularPrecio() {
            if (!modoAutomaticoRadio.checked || !inputCosto || !precioCalculado) {
                console.log('No se puede calcular precio - elementos faltantes o modo manual activo');
                return;
            }

            const costo = parseFloat(inputCosto.value) || 0;

            if (costo === 0) {
                limpiarCalculos();
                return;
            }

            // Si hay un precio de venta, calcular desde ahí
            if (inputPrecioVenta && inputPrecioVenta.value) {
                calcularDesdePrecioVenta();
            }
            // Si hay un margen, calcular desde ahí
            else if (inputMargenPorcentaje && inputMargenPorcentaje.value) {
                calcularDesdeMargenPorcentaje();
            }
            // Si hay utilidad (campo legacy), calcular desde ahí
            else if (inputUtilidad && inputUtilidad.value) {
                const porcentajeUtilidad = parseFloat(inputUtilidad.value) || 0;
                const utilidadDinero = costo * (porcentajeUtilidad / 100);
                const precioFinal = costo + utilidadDinero;

                if (inputPrecioVenta) inputPrecioVenta.value = precioFinal.toFixed(2);
                if (inputMargenPorcentaje) inputMargenPorcentaje.value = porcentajeUtilidad.toFixed(2);

                actualizarVisualizacionPrecio(costo, precioFinal, utilidadDinero, porcentajeUtilidad);
            }
            else {
                limpiarCalculos();
            }
        }

        // Eventos para cambio de modo
        modoAutomaticoRadio.addEventListener('change', function () {
            if (this.checked) {
                console.log('Cambiando a modo automático');
                if (camposAutomaticos) camposAutomaticos.style.display = 'block';
                if (campoManual) campoManual.style.display = 'none';

                if (inputCosto) inputCosto.setAttribute('required', 'required');
                if (inputUtilidad) inputUtilidad.setAttribute('required', 'required');
                if (inputPrecioManual) inputPrecioManual.removeAttribute('required');

                actualizarEstilosTarjetas();
                calcularPrecio();
            }
        });

        modoManualRadio.addEventListener('change', function () {
            if (this.checked) {
                console.log('Cambiando a modo manual');
                if (camposAutomaticos) camposAutomaticos.style.display = 'none';
                if (campoManual) campoManual.style.display = 'block';

                if (inputPrecioManual) inputPrecioManual.setAttribute('required', 'required');
                if (inputCosto) inputCosto.removeAttribute('required');
                if (inputUtilidad) inputUtilidad.removeAttribute('required');

                actualizarEstilosTarjetas();
                if (textoResumen) {
                    textoResumen.innerHTML = '<i class="bi bi-pencil me-1"></i> Precio establecido manualmente';
                }
            }
        });

        // Eventos para cálculo en tiempo real - MEJORADOS
        if (inputCosto) {
            inputCosto.addEventListener('input', function() {
                // Cuando cambia el costo, recalcular todo
                const precioVentaActual = parseFloat(inputPrecioVenta?.value) || 0;
                const margenActual = parseFloat(inputMargenPorcentaje?.value) || 0;

                if (precioVentaActual > 0) {
                    calcularDesdePrecioVenta();
                } else if (margenActual > 0) {
                    calcularDesdeMargenPorcentaje();
                } else {
                    limpiarCalculos();
                }
            });
            inputCosto.addEventListener('blur', calcularPrecio);
            console.log('✅ Event listeners agregados a inputCosto');
        }

        // Eventos para Precio de Venta
        if (inputPrecioVenta) {
            inputPrecioVenta.addEventListener('input', function() {
                // Limpiar campo de margen para evitar conflictos
                if (inputMargenPorcentaje && !calculandoPrecio) {
                    inputMargenPorcentaje.value = '';
                }
                calcularDesdePrecioVenta();
            });
            inputPrecioVenta.addEventListener('blur', calcularDesdePrecioVenta);
            console.log('✅ Event listeners agregados a inputPrecioVenta');
        }

        // Eventos para Margen %
        if (inputMargenPorcentaje) {
            inputMargenPorcentaje.addEventListener('input', function() {
                // Limpiar campo de precio de venta para evitar conflictos
                if (inputPrecioVenta && !calculandoPrecio) {
                    inputPrecioVenta.value = '';
                }
                calcularDesdeMargenPorcentaje();
            });
            inputMargenPorcentaje.addEventListener('blur', calcularDesdeMargenPorcentaje);
            console.log('✅ Event listeners agregados a inputMargenPorcentaje');
        }

        // Mantener compatibilidad con campo legacy de utilidad
        if (inputUtilidad) {
            inputUtilidad.addEventListener('input', function() {
                // Cuando se usa el campo legacy, limpiar los nuevos campos
                if (inputPrecioVenta && !calculandoPrecio) inputPrecioVenta.value = '';
                if (inputMargenPorcentaje && !calculandoPrecio) inputMargenPorcentaje.value = '';
                calcularPrecio();
            });
            inputUtilidad.addEventListener('blur', calcularPrecio);
            console.log('✅ Event listeners agregados a inputUtilidad (legacy)');
        }

        // Efectos visuales para las tarjetas
        if (cardAutomatico && cardManual) {
            [cardAutomatico, cardManual].forEach(card => {
                card.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                });

                card.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '';
                });

                card.addEventListener('click', function () {
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                });
            });
        }

        // Efectos para los inputs - ACTUALIZADO CON NUEVOS CAMPOS
        [inputCosto, inputUtilidad, inputPrecioManual, inputPrecioVenta, inputMargenPorcentaje].forEach(input => {
            if (input) {
                input.addEventListener('focus', function () {
                    this.style.transform = 'scale(1.02)';
                    this.style.boxShadow = '0 0 0 0.2rem rgba(0,123,255,0.25)';
                });

                input.addEventListener('blur', function () {
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '';
                });
            }
        });

        // ========================================
        // BOTÓN PARA LIMPIAR CAMPOS DE PRECIO
        // ========================================
        
        const btnLimpiarPrecios = document.getElementById('btnLimpiarPrecios');
        if (btnLimpiarPrecios) {
            btnLimpiarPrecios.addEventListener('click', function() {
                console.log('🧹 Limpiando campos de precio...');
                
                // Limpiar los 3 inputs principales
                if (inputCosto) {
                    inputCosto.value = '';
                    inputCosto.classList.remove('is-valid', 'is-invalid');
                }
                
                if (inputPrecioVenta) {
                    inputPrecioVenta.value = '';
                    inputPrecioVenta.classList.remove('is-valid', 'is-invalid');
                }
                
                if (inputMargenPorcentaje) {
                    inputMargenPorcentaje.value = '';
                    inputMargenPorcentaje.classList.remove('is-valid', 'is-invalid');
                }
                
                // Limpiar campos ocultos y legacy
                if (hiddenPorcentajeUtilidad) hiddenPorcentajeUtilidad.value = '';
                if (hiddenPrecio) hiddenPrecio.value = '';
                if (inputUtilidad) {
                    inputUtilidad.value = '';
                    inputUtilidad.classList.remove('is-valid', 'is-invalid');
                }
                if (inputPrecioManual) {
                    inputPrecioManual.value = '';
                    inputPrecioManual.classList.remove('is-valid', 'is-invalid');
                }
                
                // Limpiar visualización
                limpiarCalculos();
                
                // Mostrar feedback visual
                if (typeof toastr !== 'undefined') {
                    toastr.info('Campos de precio limpiados');
                }
                
                console.log('✅ Campos de precio limpiados correctamente');
            });
            
            console.log('✅ Botón limpiar precios configurado');
        }

        // Inicializar estilos y cálculo
        actualizarEstilosTarjetas();
        calcularPrecio();

        console.log('✅ Funcionalidad de precio inicializada correctamente');
    } else {
        console.error('❌ No se pudieron encontrar los elementos de precio');
        console.log('modoAutomaticoRadio existe:', !!modoAutomaticoRadio);
        console.log('modoManualRadio existe:', !!modoManualRadio);
    }

    // ========================================
    // GESTIÓN DE IMÁGENES
    // ========================================

    if (dropArea && fileInput && selectImagesBtn && previewContainer) {
        let validFiles = [];

        selectImagesBtn.addEventListener('click', function (e) {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
            handleFiles(e.target.files);
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropArea.classList.add('border-primary', 'bg-light');
        }

        function unhighlight() {
            dropArea.classList.remove('border-primary', 'bg-light');
        }

        dropArea.addEventListener('drop', function (e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        function handleFiles(files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.match('image.*')) {
                    if (typeof toastr !== 'undefined') {
                        toastr.error(`${file.name} no es un archivo de imagen válido`);
                    }
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    if (typeof toastr !== 'undefined') {
                        toastr.error(`${file.name} excede el tamaño máximo permitido (5MB)`);
                    }
                    continue;
                }

                const fileExists = validFiles.some(f => f.name === file.name && f.size === file.size);
                if (fileExists) {
                    if (typeof toastr !== 'undefined') {
                        toastr.warning(`El archivo ${file.name} ya ha sido agregado`);
                    }
                    continue;
                }

                validFiles.push(file);
                createPreview(file);
            }

            updateFileInput();
        }

        function createPreview(file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.createElement('div');
                preview.className = 'img-preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Vista previa de ${file.name}">
                    <div class="img-preview-remove" data-filename="${file.name}">
                        <i class="bi bi-x"></i>
                    </div>
                `;
                previewContainer.appendChild(preview);

                const removeBtn = preview.querySelector('.img-preview-remove');
                removeBtn.addEventListener('click', function () {
                    const filename = this.getAttribute('data-filename');
                    validFiles = validFiles.filter(f => f.name !== filename);
                    preview.remove();
                    updateFileInput();
                });
            };
            reader.readAsDataURL(file);
        }

        function updateFileInput() {
            const dataTransfer = new DataTransfer();
            validFiles.forEach(file => {
                dataTransfer.items.add(file);
            });
            fileInput.files = dataTransfer.files;
            console.log(`Archivos válidos para subir: ${validFiles.length}`);
        }
    }

    // ========================================
    // VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ========================================

    if (form && submitButton) {
        const formInputs = form.querySelectorAll('input, select, textarea');

        formInputs.forEach(input => {
            input.addEventListener('blur', function () {
                validarCampo(this);
            });

            input.addEventListener('input', function () {
                if (this.classList.contains('is-invalid') && this.checkValidity()) {
                    this.classList.remove('is-invalid');
                }
            });
        });

        function validarFormularioCompleto() {
            let esValido = true;

            // Validar solo campos visibles
            const formInputs = form.querySelectorAll('input, select, textarea');

            formInputs.forEach(input => {
                // Solo validar si el campo es visible y requerido
                if (input.hasAttribute('required') && esCampoVisible(input)) {
                    if (!validarCampo(input)) {
                        esValido = false;
                        console.log(`❌ Campo inválido: ${input.name || input.id}`);
                    } else {
                        console.log(`✅ Campo válido: ${input.name || input.id}`);
                    }
                }
            });

            // Validar precio según el modo seleccionado - MEJORADO
            if (modoAutomaticoRadio && modoAutomaticoRadio.checked) {
                // Validar costo (siempre requerido)
                if (!inputCosto || !inputCosto.value || parseFloat(inputCosto.value) <= 0) {
                    if (inputCosto) inputCosto.classList.add('is-invalid');
                    esValido = false;
                    console.log(`❌ Costo inválido`);
                }

                // Validar que al menos uno de los métodos de precio esté configurado
                const tienePrecioVenta = inputPrecioVenta && inputPrecioVenta.value && parseFloat(inputPrecioVenta.value) > 0;
                const tieneMargen = inputMargenPorcentaje && inputMargenPorcentaje.value && parseFloat(inputMargenPorcentaje.value) >= 0;
                const tieneUtilidadLegacy = inputUtilidad && inputUtilidad.value && parseFloat(inputUtilidad.value) >= 0;

                if (!tienePrecioVenta && !tieneMargen && !tieneUtilidadLegacy) {
                    // Marcar como inválidos los campos de precio
                    if (inputPrecioVenta) inputPrecioVenta.classList.add('is-invalid');
                    if (inputMargenPorcentaje) inputMargenPorcentaje.classList.add('is-invalid');
                    if (inputUtilidad) inputUtilidad.classList.add('is-invalid');
                    esValido = false;
                    console.log(`❌ Debe configurar precio de venta O margen % O utilidad legacy`);

                    if (typeof toastr !== 'undefined') {
                        toastr.error('Debe configurar el precio de venta o el margen de utilidad');
                    }
                }
            } else if (modoManualRadio && modoManualRadio.checked) {
                if (!inputPrecioManual || !inputPrecioManual.value || parseFloat(inputPrecioManual.value) <= 0) {
                    if (inputPrecioManual) inputPrecioManual.classList.add('is-invalid');
                    esValido = false;
                    console.log(`❌ Precio manual inválido`);
                }
            }

            console.log(`Validación completa: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'}`);
            return esValido;
        }

        form.onsubmit = function (e) {
            e.preventDefault();
            console.log('Formulario enviado - iniciando validación');

            // ✅ NUEVO: Preparar formulario antes de validar
            prepararFormularioParaEnvio();

            if (!validarFormularioCompleto()) {
                console.log('Formulario inválido - campos con errores');
                if (typeof toastr !== 'undefined') {
                    toastr.error('Por favor, complete todos los campos requeridos correctamente');
                }
                return false;
            }

            console.log('Formulario válido - preparando para enviar');

            // ✅ NUEVO: Preparar una vez más justo antes del envío (por seguridad)
            prepararFormularioParaEnvio();

            submitButton.disabled = true;
            const normalState = submitButton.querySelector('.normal-state');
            const loadingState = submitButton.querySelector('.loading-state');

            if (normalState) normalState.style.display = 'none';
            if (loadingState) loadingState.style.display = 'inline-flex';

            const formData = new FormData(form);

            console.log('FormData creado - revisando elementos:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }

            const formAction = form.getAttribute('action');
            console.log('Enviando formulario al controlador en:', formAction);

            fetch(formAction, {
                method: 'POST',
                body: formData
            })
                .then(async response => {
                    console.log(`Respuesta: status=${response.status}, ok=${response.ok}`);

                    const text = await response.text();
                    console.log('Contenido de la respuesta:', text);

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${text}`);
                    }

                    if (typeof toastr !== 'undefined') {
                        toastr.success('Producto guardado exitosamente');
                    }

                    setTimeout(() => {
                        window.location.href = '/Inventario/Index';
                    }, 1000);
                })
                .catch(error => {
                    console.error('Error:', error);
                    submitButton.disabled = false;
                    if (normalState) normalState.style.display = 'inline-flex';
                    if (loadingState) loadingState.style.display = 'none';

                    if (typeof toastr !== 'undefined') {
                        toastr.error('Error al guardar el producto: ' + error.message);
                    }
                });

            return false;
        };
    }

    console.log('✅ Script de agregar producto inicializado correctamente');


    // ========================================
    // AUTOCOMPLETADO INTELIGENTE DE MARCA
    // ========================================

    let timeoutBusqueda = null; // Para evitar múltiples peticiones

    // Función principal para inicializar autocompletado
    function inicializarAutocompletado() {
        console.log('🚀 Inicializando autocompletado inteligente...');
        configurarAutocompletadoMarca();
    }

    // Configurar autocompletado para marca con búsqueda en tiempo real
    function configurarAutocompletadoMarca() {
        const marcaInput = document.getElementById('marcaInput');
        const marcaSuggestions = document.getElementById('marcaSuggestions');

        if (!marcaInput || !marcaSuggestions) {
            console.warn('⚠️ Elementos de autocompletado no encontrados');
            return;
        }

        console.log('✅ Configurando autocompletado para marca');

        // Evento principal: cuando el usuario escribe
        marcaInput.addEventListener('input', function () {
            const valor = this.value.trim();
            console.log(`🔤 Usuario escribió: "${valor}"`);

            // Limpiar timeout anterior
            if (timeoutBusqueda) {
                clearTimeout(timeoutBusqueda);
            }

            // Si está vacío, ocultar sugerencias
            if (valor.length === 0) {
                ocultarSugerencias(marcaSuggestions);
                return;
            }

            // Si es muy corto, esperar más caracteres
            if (valor.length < 2) {
                mostrarMensaje(marcaSuggestions, '💡 Escriba al menos 2 caracteres...');
                return;
            }

            // Mostrar indicador de carga
            mostrarCargando(marcaSuggestions);

            // Hacer búsqueda con delay para evitar spam de peticiones
            timeoutBusqueda = setTimeout(() => {
                buscarMarcasEnTiempoReal(valor, marcaSuggestions, marcaInput);
            }, 300); // 300ms de delay
        });

        // Manejar focus - mostrar sugerencias si ya hay texto
        marcaInput.addEventListener('focus', function () {
            const valor = this.value.trim();
            if (valor.length >= 2) {
                buscarMarcasEnTiempoReal(valor, marcaSuggestions, marcaInput);
            }
        });

        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', function (e) {
            if (!marcaInput.contains(e.target) && !marcaSuggestions.contains(e.target)) {
                ocultarSugerencias(marcaSuggestions);
            }
        });

        // Manejar teclas especiales (Escape, Enter, flechas)
        marcaInput.addEventListener('keydown', function (e) {
            manejarTeclasEspeciales(e, marcaSuggestions);
        });
    }

    // Función para buscar marcas en tiempo real
    async function buscarMarcasEnTiempoReal(filtro, container, input) {
        try {
            console.log(`🔍 Buscando marcas con filtro: "${filtro}"`);

            // Realizar petición AJAX
            const response = await fetch(`/Inventario/BuscarMarcas?filtro=${encodeURIComponent(filtro)}`, {
                method: 'GET',
                credentials: 'include', // Incluir cookies de autenticación
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📡 Respuesta del servidor: ${response.status}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const marcas = await response.json();
            console.log(`✅ Marcas recibidas:`, marcas);

            // Mostrar resultados
            mostrarSugerenciasMarca(container, marcas, filtro, input);

        } catch (error) {
            console.error('❌ Error al buscar marcas:', error);
            mostrarError(container, 'Error al buscar marcas. Intente nuevamente.');
        }
    }

    // Función para mostrar las sugerencias de marca
    function mostrarSugerenciasMarca(container, marcas, valorBuscado, input) {
        console.log(`📋 Mostrando ${marcas.length} sugerencias`);

        container.innerHTML = '';

        if (marcas.length === 0) {
            // No hay resultados existentes - mostrar opción para crear nueva
            const nuevoItem = crearItemSugerencia(
                `<i class="bi bi-plus-circle me-2 text-success"></i>Crear nueva marca: "<strong>${valorBuscado}</strong>"`,
                'suggestion-new',
                () => seleccionarMarca(valorBuscado, input, container, true)
            );
            container.appendChild(nuevoItem);
        } else {
            // Mostrar marcas existentes
            marcas.forEach(marca => {
                const item = crearItemSugerencia(
                    `<i class="bi bi-tag me-2 text-primary"></i>${marca}`,
                    'suggestion-existing',
                    () => seleccionarMarca(marca, input, container, false)
                );
                container.appendChild(item);
            });

            // Agregar opción para crear nueva al final si el texto no coincide exactamente
            const coincidenciaExacta = marcas.some(m => m.toLowerCase() === valorBuscado.toLowerCase());
            if (!coincidenciaExacta) {
                const separador = document.createElement('div');
                separador.className = 'suggestion-separator';
                separador.innerHTML = '<hr class="my-1">';
                container.appendChild(separador);

                const nuevoItem = crearItemSugerencia(
                    `<i class="bi bi-plus-circle me-2 text-success"></i>Crear nueva marca: "<strong>${valorBuscado}</strong>"`,
                    'suggestion-new',
                    () => seleccionarMarca(valorBuscado, input, container, true)
                );
                container.appendChild(nuevoItem);
            }
        }

        mostrarContainer(container);
    }

    // Función auxiliar para crear elementos de sugerencia
    function crearItemSugerencia(contenidoHTML, claseCSS, onClickCallback) {
        const item = document.createElement('div');
        item.className = `suggestion-item ${claseCSS}`;
        item.innerHTML = contenidoHTML;
        item.addEventListener('click', onClickCallback);

        // Efectos hover
        item.addEventListener('mouseenter', function () {
            this.classList.add('suggestion-hover');
        });
        item.addEventListener('mouseleave', function () {
            this.classList.remove('suggestion-hover');
        });

        return item;
    }

    // Función para seleccionar una marca
    function seleccionarMarca(marca, input, container, esNueva) {
        console.log(`✅ Marca seleccionada: "${marca}" (Nueva: ${esNueva})`);

        input.value = marca;
        ocultarSugerencias(container);

        // Mostrar feedback visual
        input.classList.add('input-success');
        setTimeout(() => {
            input.classList.remove('input-success');
        }, 1000);

        // Mostrar notificación
        if (esNueva && typeof toastr !== 'undefined') {
            toastr.info(`Nueva marca "${marca}" será agregada al guardar el producto`);
        }

        // Trigger evento para que otros sistemas sepan que cambió
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Funciones auxiliares para estados del dropdown
    function mostrarCargando(container) {
        container.innerHTML = `
            <div class="suggestion-item suggestion-loading">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Buscando marcas...
            </div>
        `;
        mostrarContainer(container);
    }

    function mostrarMensaje(container, mensaje) {
        container.innerHTML = `
            <div class="suggestion-item suggestion-info">
                ${mensaje}
            </div>
        `;
        mostrarContainer(container);
    }

    function mostrarError(container, mensaje) {
        container.innerHTML = `
            <div class="suggestion-item suggestion-error">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${mensaje}
            </div>
        `;
        mostrarContainer(container);
    }

    function mostrarContainer(container) {
        container.style.display = 'block';
    }

    function ocultarSugerencias(container) {
        container.style.display = 'none';
    }

    // Manejar teclas especiales (Escape, Enter, flechas)
    function manejarTeclasEspeciales(event, container) {
        if (event.key === 'Escape') {
            ocultarSugerencias(container);
            event.preventDefault();
        }
        // Aquí podrías agregar navegación con flechas en el futuro
    }

    // ========================================
    // AUTOCOMPLETADO PARA MODELO (DEPENDIENTE DE MARCA)
    // ========================================

    function configurarAutocompletadoModelo() {
        const modeloInput = document.getElementById('modeloInput');
        const modeloSuggestions = document.getElementById('modeloSuggestions');
        const marcaInput = document.getElementById('marcaInput');

        if (!modeloInput || !modeloSuggestions) {
            console.warn('⚠️ Elementos de autocompletado para modelo no encontrados');
            return;
        }

        console.log('✅ Configurando autocompletado para modelo');

        // Evento principal: cuando el usuario escribe en modelo
        modeloInput.addEventListener('input', function () {
            const valor = this.value.trim();
            const marcaSeleccionada = marcaInput ? marcaInput.value.trim() : '';

            console.log(`🔤 Usuario escribió modelo: "${valor}", marca actual: "${marcaSeleccionada}"`);

            // Limpiar timeout anterior
            if (timeoutBusqueda) {
                clearTimeout(timeoutBusqueda);
            }

            // Si está vacío, ocultar sugerencias
            if (valor.length === 0) {
                ocultarSugerencias(modeloSuggestions);
                return;
            }

            // Si es muy corto, esperar más caracteres
            if (valor.length < 2) {
                mostrarMensaje(modeloSuggestions, '💡 Escriba al menos 2 caracteres...');
                return;
            }

            // Mostrar indicador de carga
            mostrarCargando(modeloSuggestions);

            // Hacer búsqueda con delay
            timeoutBusqueda = setTimeout(() => {
                buscarModelosEnTiempoReal(valor, marcaSeleccionada, modeloSuggestions, modeloInput);
            }, 300);
        });

        // Evento focus
        modeloInput.addEventListener('focus', function () {
            const valor = this.value.trim();
            const marcaSeleccionada = marcaInput ? marcaInput.value.trim() : '';
            if (valor.length >= 2) {
                buscarModelosEnTiempoReal(valor, marcaSeleccionada, modeloSuggestions, modeloInput);
            }
        });

        // Limpiar modelo cuando cambie la marca
        if (marcaInput) {
            marcaInput.addEventListener('change', function () {
                console.log('🔄 Marca cambió, limpiando modelo');
                modeloInput.value = '';
                ocultarSugerencias(modeloSuggestions);
            });
        }

        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', function (e) {
            if (!modeloInput.contains(e.target) && !modeloSuggestions.contains(e.target)) {
                ocultarSugerencias(modeloSuggestions);
            }
        });

        // Manejar teclas especiales
        modeloInput.addEventListener('keydown', function (e) {
            manejarTeclasEspeciales(e, modeloSuggestions);
        });
    }

    // Función para buscar modelos
    async function buscarModelosEnTiempoReal(filtro, marca, container, input) {
        try {
            console.log(`🔍 Buscando modelos con filtro: "${filtro}", marca: "${marca}"`);

            // Construir URL con parámetros
            let url = `/Inventario/BuscarModelos?filtro=${encodeURIComponent(filtro)}`;
            if (marca) {
                url += `&marca=${encodeURIComponent(marca)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📡 Respuesta modelos: ${response.status}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const modelos = await response.json();
            console.log(`✅ Modelos recibidos:`, modelos);

            // Mostrar resultados
            mostrarSugerenciasGenericas(container, modelos, filtro, input, 'modelo');

        } catch (error) {
            console.error('❌ Error al buscar modelos:', error);
            mostrarError(container, 'Error al buscar modelos. Intente nuevamente.');
        }
    }

    // ========================================
    // AUTOCOMPLETADO PARA ÍNDICE DE VELOCIDAD
    // ========================================

    function configurarAutocompletadoIndiceVelocidad() {
        const input = document.getElementById('indiceVelocidadInput');
        const suggestions = document.getElementById('indiceVelocidadSuggestions');

        if (!input || !suggestions) {
            console.warn('⚠️ Elementos de autocompletado para índice de velocidad no encontrados');
            return;
        }

        console.log('✅ Configurando autocompletado para índice de velocidad');

        configurarAutocompletadoGenerico(input, suggestions, 'indices de velocidad', '/Inventario/BuscarIndicesVelocidad');
    }

    // ========================================
    // AUTOCOMPLETADO PARA TIPO DE TERRENO
    // ========================================

    function configurarAutocompletadoTipoTerreno() {
        const input = document.getElementById('tipoTerrenoInput');
        const suggestions = document.getElementById('tipoTerrenoSuggestions');

        if (!input || !suggestions) {
            console.warn('⚠️ Elementos de autocompletado para tipo de terreno no encontrados');
            return;
        }

        console.log('✅ Configurando autocompletado para tipo de terreno');

        configurarAutocompletadoGenerico(input, suggestions, 'tipos de terreno', '/Inventario/BuscarTiposTerreno');
    }

    // ========================================
    // FUNCIÓN GENÉRICA PARA AUTOCOMPLETADO
    // ========================================

    function configurarAutocompletadoGenerico(input, suggestions, nombreCampo, url) {
        // Evento principal: cuando el usuario escribe
        input.addEventListener('input', function () {
            const valor = this.value.trim();
            console.log(`🔤 Usuario escribió ${nombreCampo}: "${valor}"`);

            // Limpiar timeout anterior
            if (timeoutBusqueda) {
                clearTimeout(timeoutBusqueda);
            }

            // Si está vacío, ocultar sugerencias
            if (valor.length === 0) {
                ocultarSugerencias(suggestions);
                return;
            }

            // Si es muy corto, esperar más caracteres
            if (valor.length < 1) {
                mostrarMensaje(suggestions, '💡 Escriba al menos 1 carácter...');
                return;
            }

            // Mostrar indicador de carga
            mostrarCargando(suggestions);

            // Hacer búsqueda con delay
            timeoutBusqueda = setTimeout(() => {
                buscarGenericoEnTiempoReal(valor, suggestions, input, nombreCampo, url);
            }, 300);
        });

        // Evento focus
        input.addEventListener('focus', function () {
            const valor = this.value.trim();
            if (valor.length >= 1) {
                buscarGenericoEnTiempoReal(valor, suggestions, input, nombreCampo, url);
            }
        });

        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !suggestions.contains(e.target)) {
                ocultarSugerencias(suggestions);
            }
        });

        // Manejar teclas especiales
        input.addEventListener('keydown', function (e) {
            manejarTeclasEspeciales(e, suggestions);
        });
    }

    // Función para búsqueda genérica
    async function buscarGenericoEnTiempoReal(filtro, container, input, nombreCampo, url) {
        try {
            console.log(`🔍 Buscando ${nombreCampo} con filtro: "${filtro}"`);

            const urlCompleta = `${url}?filtro=${encodeURIComponent(filtro)}`;

            const response = await fetch(urlCompleta, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📡 Respuesta ${nombreCampo}: ${response.status}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const resultados = await response.json();
            console.log(`✅ ${nombreCampo} recibidos:`, resultados);

            // Mostrar resultados
            mostrarSugerenciasGenericas(container, resultados, filtro, input, nombreCampo);

        } catch (error) {
            console.error(`❌ Error al buscar ${nombreCampo}:`, error);
            mostrarError(container, `Error al buscar ${nombreCampo}. Intente nuevamente.`);
        }
    }

    // ========================================
    // FUNCIÓN PARA MOSTRAR SUGERENCIAS GENÉRICAS
    // ========================================

    function mostrarSugerenciasGenericas(container, resultados, valorBuscado, input, nombreCampo) {
        console.log(`📋 Mostrando ${resultados.length} sugerencias para ${nombreCampo}`);

        container.innerHTML = '';

        if (resultados.length === 0) {
            // No hay resultados existentes - mostrar opción para crear nueva
            const nuevoItem = crearItemSugerencia(
                `<i class="bi bi-plus-circle me-2 text-success"></i>Crear nuevo ${nombreCampo}: "<strong>${valorBuscado}</strong>"`,
                'suggestion-new',
                () => seleccionarValorGenerico(valorBuscado, input, container, true, nombreCampo)
            );
            container.appendChild(nuevoItem);
        } else {
            // Mostrar resultados existentes
            resultados.forEach(resultado => {
                const icono = obtenerIconoPorTipo(nombreCampo);
                const item = crearItemSugerencia(
                    `<i class="bi ${icono} me-2 text-primary"></i>${resultado}`,
                    'suggestion-existing',
                    () => seleccionarValorGenerico(resultado, input, container, false, nombreCampo)
                );
                container.appendChild(item);
            });

            // Agregar opción para crear nueva al final si no coincide exactamente
            const coincidenciaExacta = resultados.some(r => r.toLowerCase() === valorBuscado.toLowerCase());
            if (!coincidenciaExacta) {
                const separador = document.createElement('div');
                separador.className = 'suggestion-separator';
                separador.innerHTML = '<hr class="my-1">';
                container.appendChild(separador);

                const nuevoItem = crearItemSugerencia(
                    `<i class="bi bi-plus-circle me-2 text-success"></i>Crear nuevo ${nombreCampo}: "<strong>${valorBuscado}</strong>"`,
                    'suggestion-new',
                    () => seleccionarValorGenerico(valorBuscado, input, container, true, nombreCampo)
                );
                container.appendChild(nuevoItem);
            }
        }

        mostrarContainer(container);
    }

    // Función para obtener ícono según el tipo
    function obtenerIconoPorTipo(nombreCampo) {
        switch (nombreCampo) {
            case 'modelo': return 'bi-car-front';
            case 'indices de velocidad': return 'bi-speedometer2';
            case 'tipos de terreno': return 'bi-geo-alt';
            default: return 'bi-tag';
        }
    }

    // Función para seleccionar valor genérico
    function seleccionarValorGenerico(valor, input, container, esNuevo, nombreCampo) {
        console.log(`✅ ${nombreCampo} seleccionado: "${valor}" (Nuevo: ${esNuevo})`);

        input.value = valor;
        ocultarSugerencias(container);

        // Mostrar feedback visual
        input.classList.add('input-success');
        setTimeout(() => {
            input.classList.remove('input-success');
        }, 1000);

        // Mostrar notificación
        if (esNuevo && typeof toastr !== 'undefined') {
            toastr.info(`Nuevo ${nombreCampo} "${valor}" será agregado al guardar el producto`);
        }

        // Trigger evento
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ========================================
    // ACTUALIZAR FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ========================================

    // Función principal para inicializar autocompletado (MODIFICAR LA EXISTENTE)
    function inicializarAutocompletado() {
        console.log('🚀 Inicializando autocompletado inteligente completo...');
        configurarAutocompletadoMarca();
        configurarAutocompletadoModelo();
        configurarAutocompletadoIndiceVelocidad();
        configurarAutocompletadoTipoTerreno();
    }

});