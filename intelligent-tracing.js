// ============================================
// SISTEMA INTELIGENTE DE TRAZADO JERÁRQUICO
// Cumple normativa RIDAA - Conexiones por diámetro
// VERSIÓN PROFESIONAL - CORREGIDO A MILÍMETROS
// ============================================

// ================================
// CONSTANTES RIDAA Y CONFIGURACIÓN
// ================================

const RIDAA_CONFIG = {
    // Diámetros de tubería según normativa
    DIAMETROS: {
        WC: 110,
        PRINCIPAL: 110,
        SECUNDARIO: [40, 50, 75],
        COLECTOR: 160
    },
    
    // Ángulos permitidos (para implementación futura)
    ANGULOS: {
        PREFERIDOS: [15, 30, 45],
        MAXIMO_EMPALME: 45,
        MAXIMO_WC: 90,
        PROHIBIDO_COLECTOR: 90
    },
    
    // CORREGIDO: Distancias de agrupación en milímetros
    DISTANCIAS: {
        AGRUPACION_ARTEFACTOS: 40,  // mm (antes 80 píxeles)
        MAX_DERIVACION: 75,         // mm (antes 150 píxeles)
        MIN_SEPARACION_CAMARAS: 15  // mm (antes 30 píxeles)
    }
};

// ================================
// FUNCIÓN PRINCIPAL JERÁRQUICA
// ================================

function generateIntelligentHierarchicalTracing() {
    const currentPlan = plans[currentPlanIndex];
    
    if (currentPlan.tracingElements.length < 2) {
        showStatus('⚠️ Necesitas al menos 2 elementos para generar trazado jerárquico');
        return;
    }

    console.log('🎯 Iniciando trazado jerárquico PROFESIONAL RIDAA...');
    
    // Limpiar trazado anterior
    clearTracingConnections();
    currentPlan.tracingConnections = [];

    // Clasificar elementos según normativa RIDAA
    const elementos = clasificarElementosRIDAA(currentPlan.tracingElements);
    
    if (!elementos.colectorPublico) {
        showStatus('⚠️ Necesitas una Cámara Pública como colector final');
        return;
    }

    // Ejecutar secuencia jerárquica profesional
    ejecutarSecuenciaJerarquica(elementos, currentPlan);
    
    showStatus(`⚡ Trazado PROFESIONAL generado - ${currentPlan.tracingConnections.length} conexiones`);
}

// ================================
// CLASIFICACIÓN DE ELEMENTOS RIDAA
// ================================

function clasificarElementosRIDAA(tracingElements) {
    console.log('📋 Clasificando elementos según normativa RIDAA...');
    
    const elementos = {
        // Colectores principales (WC - 110mm)
        colectoresPrincipales: tracingElements.filter(el => 
            el.categoria === 'sanitario' && el.tuberia_diametro === RIDAA_CONFIG.DIAMETROS.WC
        ),
        
        // Derivaciones (artefactos menores - <110mm) 
        derivacionesSecundarias: tracingElements.filter(el => 
            el.categoria === 'sanitario' && 
            el.tuberia_diametro && 
            el.tuberia_diametro < RIDAA_CONFIG.DIAMETROS.PRINCIPAL
        ),
        
        // Cámaras domiciliarias
        camarasDomiciliarias: tracingElements.filter(el => 
            el.type === 'camara-inspeccion'
        ),
        
        // Colector público (destino final)
        colectorPublico: tracingElements.find(el => 
            el.type === 'camara-publica'
        ),
        
        // Otros elementos de infraestructura
        otrosElementos: tracingElements.filter(el => 
            el.categoria === 'infraestructura' && 
            el.type !== 'camara-inspeccion' && 
            el.type !== 'camara-publica'
        )
    };
    
    console.log(`├─ Colectores principales (⌀110mm): ${elementos.colectoresPrincipales.length}`);
    console.log(`├─ Derivaciones secundarias (<110mm): ${elementos.derivacionesSecundarias.length}`);
    console.log(`├─ Cámaras domiciliarias: ${elementos.camarasDomiciliarias.length}`);
    console.log(`├─ Colector público: ${elementos.colectorPublico ? 'SÍ' : 'NO'}`);
    console.log(`└─ Otros elementos: ${elementos.otrosElementos.length}`);
    
    return elementos;
}

// ================================
// SECUENCIA JERÁRQUICA PRINCIPAL
// ================================

function ejecutarSecuenciaJerarquica(elementos, currentPlan) {
    console.log('🔗 Ejecutando secuencia jerárquica PROFESIONAL...');
    
    // PASO 1: Conectar colectores principales (WC ⌀110mm) a cámaras más cercanas
    conectarColectoresPrincipales(elementos.colectoresPrincipales, elementos.camarasDomiciliarias, elementos.colectorPublico, currentPlan);
    
    // PASO 2: Conectar derivaciones secundarias a colectores principales más cercanos
    conectarDerivacionesSecundarias(elementos.derivacionesSecundarias, elementos.colectoresPrincipales, elementos.camarasDomiciliarias, elementos.colectorPublico, currentPlan);
    
    // PASO 3: Crear red profesional de cámaras domiciliarias hacia colector público
    conectarRedCamarasDomiciliarias(elementos.camarasDomiciliarias, elementos.colectorPublico, currentPlan);
    
    // PASO 4: Conectar elementos especiales
    conectarElementosEspeciales(elementos.otrosElementos, elementos.colectorPublico, currentPlan);
    
    console.log('✅ Secuencia jerárquica PROFESIONAL completada');
}

// ================================
// PASO 1: COLECTORES PRINCIPALES PROFESIONAL
// ================================

function conectarColectoresPrincipales(colectoresPrincipales, camarasDomiciliarias, colectorPublico, currentPlan) {
    console.log(`🚽 Conectando ${colectoresPrincipales.length} colectores principales (WC ⌀110mm)...`);
    
    if (colectoresPrincipales.length === 0) {
        console.log('└─ No hay colectores principales para conectar');
        return;
    }
    
    colectoresPrincipales.forEach((colector, index) => {
        let destino = null;
        
        if (camarasDomiciliarias.length > 0) {
            // WC van SIEMPRE a la cámara domiciliaria MÁS CERCANA (REGLA PROFESIONAL)
            destino = encontrarCamaraMasCercana(colector, camarasDomiciliarias);
            console.log(`├─ WC ${index + 1} → Cámara MÁS CERCANA ${destino.numeroCamera || destino.id}`);
        } else {
            // Sin cámaras domiciliarias: directo al colector público
            destino = colectorPublico;
            console.log(`├─ WC ${index + 1} → Colector Público (directo - sin cámaras)`);
        }
        
        if (destino) {
            crearConexionJerarquica(colector, destino, 'wc-a-cercana', currentPlan);
        }
    });
    
    console.log('└─ WC conectados a cámaras MÁS CERCANAS (criterio profesional)');
}

// ================================
// PASO 2: DERIVACIONES SECUNDARIAS  
// ================================

function conectarDerivacionesSecundarias(derivaciones, colectoresPrincipales, camarasDomiciliarias, colectorPublico, currentPlan) {
    console.log(`🚰 Conectando ${derivaciones.length} derivaciones secundarias (<110mm)...`);
    
    if (derivaciones.length === 0) {
        console.log('└─ No hay derivaciones secundarias para conectar');
        return;
    }
    
    // Agrupar derivaciones por proximidad
    const gruposDerivaciones = agruparDerivacionesPorProximidad(derivaciones, RIDAA_CONFIG.DISTANCIAS.AGRUPACION_ARTEFACTOS);
    
    gruposDerivaciones.forEach((grupo, grupoIndex) => {
        console.log(`├─ Procesando grupo ${grupoIndex + 1} (${grupo.length} artefactos):`);
        
        grupo.forEach((derivacion, index) => {
            let destino = null;
            let tipoConexion = 'secundaria';
            
            // PRIORIDAD 1: Conectar a colector principal más cercano (WC ⌀110mm)
            if (colectoresPrincipales.length > 0) {
                destino = encontrarElementoMasCercano(derivacion, colectoresPrincipales);
                const distancia = calcularDistanciaMillimetros(derivacion, destino);
                
                if (distancia <= RIDAA_CONFIG.DISTANCIAS.MAX_DERIVACION) {
                    console.log(`│  ├─ ${derivacion.type} (⌀${derivacion.tuberia_diametro}mm) → WC principal`);
                } else {
                    destino = null; // Muy lejos, buscar alternativa
                }
            }
            
            // PRIORIDAD 2: Si no hay colector principal cercano, ir a cámara domiciliaria
            if (!destino && camarasDomiciliarias.length > 0) {
                destino = encontrarCamaraMasCercana(derivacion, camarasDomiciliarias);
                tipoConexion = 'derivacion-directa';
                console.log(`│  ├─ ${derivacion.type} (⌀${derivacion.tuberia_diametro}mm) → Cámara Domiciliaria`);
            }
            
            // PRIORIDAD 3: Último recurso - colector público
            if (!destino) {
                destino = colectorPublico;
                tipoConexion = 'derivacion-publica';
                console.log(`│  ├─ ${derivacion.type} (⌀${derivacion.tuberia_diametro}mm) → Colector Público`);
            }
            
            if (destino) {
                crearConexionJerarquica(derivacion, destino, tipoConexion, currentPlan);
            }
        });
    });
    
    console.log('└─ Derivaciones secundarias conectadas');
}

// ================================
// PASO 3: RED DE CÁMARAS PROFESIONAL
// ================================

function conectarRedCamarasDomiciliarias(camarasDomiciliarias, colectorPublico, currentPlan) {
    console.log(`🏠 Conectando red de ${camarasDomiciliarias.length} cámaras domiciliarias...`);
    
    if (camarasDomiciliarias.length === 0) {
        console.log('└─ No hay cámaras domiciliarias para conectar');
        return;
    }
    
    if (camarasDomiciliarias.length === 1) {
        // Una sola cámara: va directo al colector público
        console.log(`├─ Cámara única → Colector Público`);
        crearConexionJerarquica(camarasDomiciliarias[0], colectorPublico, 'camara-unica', currentPlan);
    } else {
        // Múltiples cámaras: aplicar algoritmo profesional MST optimizado
        const conexionesProfesionales = generarTrazadoProfesional(camarasDomiciliarias, colectorPublico);
        
        console.log(`├─ Trazado profesional generado:`);
        conexionesProfesionales.forEach(conexion => {
            console.log(`│  ├─ Cámara ${conexion.desde.numeroCamera || conexion.desde.id} → ${conexion.hacia.numeroCamera || conexion.hacia.id || 'Público'}`);
            crearConexionJerarquica(conexion.desde, conexion.hacia, conexion.tipo, currentPlan);
        });
    }
    
    console.log('└─ Red de cámaras conectada con criterio profesional');
}

// ================================
// PASO 4: ELEMENTOS ESPECIALES
// ================================

function conectarElementosEspeciales(otrosElementos, colectorPublico, currentPlan) {
    console.log(`⚙️ Conectando ${otrosElementos.length} elementos especiales...`);
    
    otrosElementos.forEach(elemento => {
        console.log(`├─ ${elemento.type} → Colector Público`);
        crearConexionJerarquica(elemento, colectorPublico, 'especial', currentPlan);
    });
    
    console.log('└─ Elementos especiales conectados');
}

// ================================
// ALGORITMO PROFESIONAL MST OPTIMIZADO
// ================================

function generarTrazadoProfesional(camarasDomiciliarias, colectorPublico) {
    console.log('🎯 Generando trazado profesional con MST optimizado...');
    
    // PASO 1: Identificar cámara final (más cercana al colector público)
    const camaraFinal = camarasDomiciliarias.reduce((masCercana, camara) => {
        const distanciaActual = calcularDistanciaMillimetros(camara, colectorPublico);
        const distanciaMasCercana = calcularDistanciaMillimetros(masCercana, colectorPublico);
        return distanciaActual < distanciaMasCercana ? camara : masCercana;
    });
    
    console.log(`├─ Cámara FINAL identificada: ${camaraFinal.numeroCamera || camaraFinal.id}`);
    
    // PASO 2: Crear árbol de expansión mínima (MST)
    const conexiones = [];
    const camarasRestantes = camarasDomiciliarias.filter(c => c.id !== camaraFinal.id);
    
    if (camarasRestantes.length === 0) {
        // Solo una cámara
        conexiones.push({
            desde: camaraFinal,
            hacia: colectorPublico,
            tipo: 'final-a-publico',
            distancia: calcularDistanciaMillimetros(camaraFinal, colectorPublico)
        });
    } else {
        // Múltiples cámaras: aplicar algoritmo Prim modificado
        const mstConexiones = algoritmoMSTOptimizado(camarasRestantes, camaraFinal);
        
        // Agregar conexiones del MST
        mstConexiones.forEach(conexion => {
            conexiones.push({
                desde: conexion.desde,
                hacia: conexion.hacia,
                tipo: 'camara-a-camara',
                distancia: conexion.distancia
            });
        });
        
        // Agregar conexión final al público
        conexiones.push({
            desde: camaraFinal,
            hacia: colectorPublico,
            tipo: 'final-a-publico',
            distancia: calcularDistanciaMillimetros(camaraFinal, colectorPublico)
        });
    }
    
    console.log(`├─ ${conexiones.length} conexiones profesionales generadas`);
    return conexiones;
}

// ================================
// ALGORITMO MST MODIFICADO (PRIM)
// ================================

function algoritmoMSTOptimizado(camarasRestantes, camaraFinal) {
    console.log('🌳 Aplicando algoritmo MST optimizado...');
    
    const conexiones = [];
    const visitadas = new Set([camaraFinal.id]);
    const noVisitadas = [...camarasRestantes];
    
    while (noVisitadas.length > 0) {
        let mejorConexion = null;
        let distanciaMinima = Infinity;
        let indiceAEliminar = -1;
        
        // Encontrar la arista de menor peso que conecte el árbol con una cámara no visitada
        for (let i = 0; i < noVisitadas.length; i++) {
            const camaraNoVisitada = noVisitadas[i];
            
            // Buscar la cámara visitada más cercana a esta no visitada
            for (const camaraId of visitadas) {
                const camaraVisitada = [...camarasRestantes, camaraFinal].find(c => c.id === camaraId);
                if (!camaraVisitada) continue;
                
                const distancia = calcularDistanciaMillimetros(camaraNoVisitada, camaraVisitada);
                
                // Aplicar factor de optimización profesional
                const distanciaOptimizada = aplicarFactorOptimizacion(camaraNoVisitada, camaraVisitada, distancia);
                
                if (distanciaOptimizada < distanciaMinima) {
                    distanciaMinima = distanciaOptimizada;
                    mejorConexion = {
                        desde: camaraNoVisitada,
                        hacia: camaraVisitada,
                        distancia: distancia
                    };
                    indiceAEliminar = i;
                }
            }
        }
        
        if (mejorConexion) {
            conexiones.push(mejorConexion);
            visitadas.add(mejorConexion.desde.id);
            noVisitadas.splice(indiceAEliminar, 1);
            
            console.log(`│  ├─ MST: ${mejorConexion.desde.numeroCamera || mejorConexion.desde.id} → ${mejorConexion.hacia.numeroCamera || mejorConexion.hacia.id}`);
        } else {
            break; // Error en el algoritmo
        }
    }
    
    return conexiones;
}

// ================================
// FACTOR DE OPTIMIZACIÓN PROFESIONAL
// ================================

function aplicarFactorOptimizacion(camara1, camara2, distanciaReal) {
    // Factor 1: Penalizar cruzamientos potenciales
    let factor = 1.0;
    
    // Factor 2: Favorecer conexiones que siguen un patrón más rectilíneo
    const deltaX = Math.abs(camara2.x - camara1.x);
    const deltaY = Math.abs(camara2.y - camara1.y);
    
    // Favorecer conexiones más horizontales/verticales (menos diagonales)
    const relacionAspecto = Math.min(deltaX, deltaY) / Math.max(deltaX, deltaY);
    if (relacionAspecto < 0.3) {
        factor *= 0.8; // Favorecer conexiones más rectilíneas
    }
    
    // Factor 3: Favorecer conexiones hacia la dirección del colector público
    // (esto requeriría conocer la posición del colector, se puede implementar después)
    
    return distanciaReal * factor;
}

// ================================
// FUNCIONES AUXILIARES INTELIGENTES - CORREGIDAS A MILÍMETROS
// ================================

function agruparDerivacionesPorProximidad(derivaciones, distanciaMaxima) {
    const grupos = [];
    const procesados = new Set();
    
    derivaciones.forEach(derivacion => {
        if (procesados.has(derivacion.id)) return;
        
        const grupo = [derivacion];
        procesados.add(derivacion.id);
        
        // Buscar derivaciones cercanas para agrupar
        derivaciones.forEach(otra => {
            if (procesados.has(otra.id)) return;
            
            const distancia = calcularDistanciaMillimetros(derivacion, otra);
            if (distancia <= distanciaMaxima) {
                grupo.push(otra);
                procesados.add(otra.id);
            }
        });
        
        grupos.push(grupo);
    });
    
    return grupos;
}

function encontrarCamaraMasCercana(elemento, camaras) {
    if (camaras.length === 0) return null;
    
    let camaraMasCercana = camaras[0];
    let distanciaMinima = calcularDistanciaMillimetros(elemento, camaraMasCercana);
    
    for (let i = 1; i < camaras.length; i++) {
        const distancia = calcularDistanciaMillimetros(elemento, camaras[i]);
        if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            camaraMasCercana = camaras[i];
        }
    }
    
    console.log(`  🎯 Elemento en (${Math.round(elemento.x)},${Math.round(elemento.y)})mm → Cámara más cercana: ${camaraMasCercana.numeroCamera || camaraMasCercana.id} a ${Math.round(distanciaMinima)}mm`);
    
    return camaraMasCercana;
}

function encontrarElementoMasCercano(elemento, elementos) {
    if (elementos.length === 0) return null;
    
    let elementoMasCercano = elementos[0];
    let distanciaMinima = calcularDistanciaMillimetros(elemento, elementoMasCercano);
    
    for (let i = 1; i < elementos.length; i++) {
        const distancia = calcularDistanciaMillimetros(elemento, elementos[i]);
        if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            elementoMasCercano = elementos[i];
        }
    }
    
    return elementoMasCercano;
}

// CORREGIDO: Función de distancia específica para milímetros
function calcularDistanciaMillimetros(elemento1, elemento2) {
    return Math.sqrt(
        Math.pow(elemento2.x - elemento1.x, 2) + Math.pow(elemento2.y - elemento1.y, 2)
    );
}

function crearConexionJerarquica(desde, hacia, tipoConexion, currentPlan) {
    // Log detallado del tipo de conexión
    const tiposConexion = {
        'wc-a-cercana': '🚽→🏠',
        'camara-a-camara': '🏠→🏠',
        'final-a-publico': '🎯→🏛️',
        'camara-unica': '🏠→🏛️',
        'secundaria': '🚰→🏠',
        'derivacion-directa': '🚰→🏠',
        'derivacion-publica': '🚰→🏛️',
        'especial': '⚙️→🏛️'
    };
    
    const icono = tiposConexion[tipoConexion] || '🔗';
    const distancia = calcularDistanciaMillimetros(desde, hacia);
    console.log(`  ${icono} ${desde.type || desde.id} → ${hacia.type || hacia.id} (${Math.round(distancia)}mm)`);
    
    // Usar la función existente del sistema principal
    if (typeof createTracingConnection === 'function') {
        createTracingConnection(desde, hacia);
    } else {
        console.log(`⚠️ createTracingConnection no disponible`);
    }
}

// ================================
// FUNCIONES DE VALIDACIÓN DE ÁNGULOS 
// (Para implementación futura)
// ================================

function calculateAngleBetweenPoints(point1, point2, point3) {
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };
    
    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
    return Math.round(angle * 10) / 10;
}

function isAngleValidRIDAA(angle, tipoConexion = 'empalme') {
    switch (tipoConexion) {
        case 'empalme':
            return angle <= RIDAA_CONFIG.ANGULOS.MAXIMO_EMPALME;
        case 'wc':
            return angle <= RIDAA_CONFIG.ANGULOS.MAXIMO_WC;
        case 'colector':
            return angle < RIDAA_CONFIG.ANGULOS.PROHIBIDO_COLECTOR;
        default:
            return angle <= RIDAA_CONFIG.ANGULOS.MAXIMO_EMPALME;
    }
}

function findNearestPreferredAngle(actualAngle) {
    let closest = RIDAA_CONFIG.ANGULOS.PREFERIDOS[0];
    let minDiff = Math.abs(actualAngle - closest);
    
    RIDAA_CONFIG.ANGULOS.PREFERIDOS.forEach(preferredAngle => {
        const diff = Math.abs(actualAngle - preferredAngle);
        if (diff < minDiff) {
            minDiff = diff;
            closest = preferredAngle;
        }
    });
    
    return closest;
}

// ================================
// FUNCIÓN DE VALIDACIÓN DE CALIDAD
// ================================

function validarCalidadTrazado(conexiones) {
    console.log('🔍 Validando calidad del trazado profesional...');
    
    let cruzamientos = 0;
    let conexionesOptimas = 0;
    
    // Validar que no hay demasiados cruzamientos
    for (let i = 0; i < conexiones.length; i++) {
        for (let j = i + 1; j < conexiones.length; j++) {
            if (dosLineasSeCruzan(conexiones[i], conexiones[j])) {
                cruzamientos++;
            }
        }
    }
    
    // Calcular eficiencia
    const eficiencia = conexiones.length > 0 ? (conexionesOptimas / conexiones.length) * 100 : 0;
    
    console.log(`├─ Cruzamientos detectados: ${cruzamientos}`);
    console.log(`├─ Eficiencia del trazado: ${Math.round(eficiencia)}%`);
    console.log(`└─ Calidad: ${cruzamientos < 2 && eficiencia > 70 ? 'PROFESIONAL' : 'MEJORABLE'}`);
    
    return {
        cruzamientos,
        eficiencia,
        calidad: cruzamientos < 2 && eficiencia > 70 ? 'PROFESIONAL' : 'MEJORABLE'
    };
}

function dosLineasSeCruzan(linea1, linea2) {
    // Implementación básica para detectar cruzamientos
    // Se puede mejorar con algoritmo más sofisticado
    return false; // Placeholder
}

// ================================
// FUNCIÓN DE ACTIVACIÓN
// ================================

function activateIntelligentTracing() {
    console.log('🚀 Activando sistema inteligente de trazado jerárquico PROFESIONAL...');
    
    // Verificar que el sistema principal esté disponible
    if (typeof plans === 'undefined' || typeof currentPlanIndex === 'undefined') {
        console.error('❌ Sistema principal no encontrado. Asegúrate de cargar este archivo después de config.js');
        showStatus('❌ Error: Sistema principal no disponible');
        return false;
    }
    
    // Verificar elementos mínimos
    const currentPlan = plans[currentPlanIndex];
    if (!currentPlan || !currentPlan.tracingElements) {
        console.error('❌ Plan actual no válido o sin elementos de trazado');
        showStatus('❌ Error: Plan no válido');
        return false;
    }
    
    // Todo listo, ejecutar trazado jerárquico profesional
    generateIntelligentHierarchicalTracing();
    return true;
}

// ================================
// EXPORT PARA INTEGRACIÓN
// ================================

// Si se usa como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateIntelligentHierarchicalTracing,
        activateIntelligentTracing,
        RIDAA_CONFIG
    };
}

// ================================
// INICIALIZACIÓN AUTOMÁTICA
// ================================

// Auto-inicializar cuando el DOM esté listo (si no es módulo)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📋 Sistema jerárquico PROFESIONAL RIDAA cargado y listo');
        
        // Agregar botón de activación (opcional)
        setTimeout(() => {
            if (typeof showStatus === 'function') {
                showStatus('🎯 Sistema PROFESIONAL RIDAA disponible', 2000);
            }
        }, 1000);
    });
}

console.log('🎯 intelligent-tracing.js PROFESIONAL cargado - Sistema jerárquico RIDAA disponible');
