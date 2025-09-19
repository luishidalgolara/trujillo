/**
 * MOTOR ISOMÉTRICO PROFESIONAL MEJORADO
 * - Escala ajustable con controles
 * - Texto manipulable (drag & drop)
 * - Integración al plano principal
 * - Calidad de impresión preservada
 * - Fuentes responsivas
 * CORREGIDO: Sistema en milímetros
 */

class IsometricSewerGenerator {
    
    constructor() {
        this.isWindowOpen = false;
        this.currentSVG = null;
        this.windowElement = null;
        this.isIntegrated = false;
        this.currentScale = 1.0;
        this.textScale = 1.0;
        this.minScale = 0.3;
        this.maxScale = 3.0;
        this.isDraggingLabel = false;
    }
    
    /**
     * Convierte coordenadas 2D a proyección isométrica 3D
     */
    toIsometric(x, y, z = 0) {
        const angle = Math.PI / 6; // 30 grados
        const cos30 = Math.cos(angle);
        const sin30 = Math.sin(angle);
        return {
            x: (x - z) * cos30,
            y: (x + z) * sin30 + y
        };
    }

    /**
     * Genera una cámara de registro isométrica - ESCALA AJUSTABLE
     */
    generateManhole(x, y, radius, label) {
        const scaledRadius = radius * this.currentScale;
        const fontSize = Math.max(8, 16 * this.textScale);
        
        return `<g class="manhole" data-type="manhole">
            <ellipse cx="${x}" cy="${y - 40 * this.currentScale}" rx="${scaledRadius}" ry="${scaledRadius * 0.6}" 
                fill="#f8f9fa" stroke="#2c3e50" stroke-width="${4 * this.currentScale}"/>
            <ellipse cx="${x}" cy="${y}" rx="${scaledRadius}" ry="${scaledRadius * 0.6}" 
                fill="none" stroke="#2c3e50" stroke-width="${4 * this.currentScale}"/>
            <line x1="${x - scaledRadius}" y1="${y}" x2="${x - scaledRadius}" y2="${y - 40 * this.currentScale}" 
                stroke="#2c3e50" stroke-width="${4 * this.currentScale}"/>
            <line x1="${x + scaledRadius}" y1="${y}" x2="${x + scaledRadius}" y2="${y - 40 * this.currentScale}" 
                stroke="#2c3e50" stroke-width="${4 * this.currentScale}"/>
            <ellipse cx="${x}" cy="${y - 40 * this.currentScale}" rx="${scaledRadius * 0.8}" ry="${scaledRadius * 0.5}" 
                fill="white" stroke="#34495e" stroke-width="${3 * this.currentScale}"/>
            ${label ? `<g class="draggable-label" data-label-id="manhole-${Date.now()}" transform="translate(${x}, ${y + 50 * this.currentScale})">
                <rect x="${-label.length * 4}" y="-8" width="${label.length * 8}" height="16" 
                    fill="white" stroke="#2c3e50" stroke-width="1" rx="3"/>
                <text x="0" y="4" text-anchor="middle" font-family="Arial" 
                    font-size="${fontSize}" font-weight="bold" fill="#2c3e50">${label}</text>
            </g>` : ''}
        </g>`;
    }

    /**
     * Genera símbolo de WC isométrico PROFESIONAL (como imagen 2) - SOLO LÍNEAS
     */
    generateWCSymbol(x, y) {
        const scale = this.currentScale;
        const fontSize = Math.max(8, 16 * this.textScale);
        
        // Posición inicial de la etiqueta
        const labelX = x + 40 * scale;
        const labelY = y + 50 * scale;
        
        const wcId = `wc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `<g class="wc-symbol" data-type="wc" data-element-id="${wcId}">
            <!-- Símbolo WC profesional - solo líneas -->
            <!-- Base rectangular del WC -->
            <rect x="${x-15*scale}" y="${y-10*scale}" width="${30*scale}" height="${20*scale}" 
                fill="none" stroke="#2c3e50" stroke-width="${3*scale}"/>
            
            <!-- Línea central vertical -->
            <line x1="${x}" y1="${y-10*scale}" x2="${x}" y2="${y+10*scale}" 
                stroke="#2c3e50" stroke-width="${2*scale}"/>
            
            <!-- Pequeña línea superior (tanque) -->
            <rect x="${x-8*scale}" y="${y-20*scale}" width="${16*scale}" height="${8*scale}" 
                fill="none" stroke="#2c3e50" stroke-width="${2*scale}"/>
            
            <!-- Conexión al sistema -->
            <circle cx="${x}" cy="${y+15*scale}" r="${3*scale}" fill="none" 
                stroke="#e74c3c" stroke-width="${2*scale}"/>
            
            <!-- LÍNEA GUÍA para etiqueta de artefacto -->
            <line id="guide-line-${wcId}" class="fixture-guide-line"
                x1="${x}" y1="${y + 15*scale}" x2="${labelX}" y2="${labelY}" 
                stroke="#7f8c8d" stroke-width="${Math.max(1, 1*scale)}" 
                stroke-dasharray="${3*scale},${2*scale}" opacity="0.5"/>
            
            <g class="draggable-label fixture-label" data-label-id="${wcId}" 
               data-fixture-center-x="${x}" data-fixture-center-y="${y + 15*scale}"
               transform="translate(${labelX}, ${labelY})">
                <rect x="-12" y="-8" width="24" height="16" fill="white" stroke="#2c3e50" stroke-width="1" rx="3"/>
                <text x="0" y="4" text-anchor="middle" font-family="Arial" 
                    font-size="${fontSize}" font-weight="bold" fill="#2c3e50">WC</text>
            </g>
        </g>`;
    }

    /**
     * Genera símbolos de artefactos isométricos PROFESIONALES (como imagen 2) - SOLO LÍNEAS
     */
    generateFixtureSymbol(x, y, type, label) {
        const scale = this.currentScale;
        const fontSize = Math.max(8, 14 * this.textScale);
        
        if (type === 'WC' || type === 'wc') {
            return this.generateWCSymbol(x, y);
        } else {
            // Posición inicial de la etiqueta
            const labelX = x + 35 * scale;
            const labelY = y + 40 * scale;
            
            const fixtureId = `fixture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            return `<g class="fixture-symbol" data-type="${type}" data-element-id="${fixtureId}">
                <!-- Símbolo de artefacto profesional - solo líneas -->
                <!-- Base rectangular del artefacto -->
                <rect x="${x-20*scale}" y="${y-8*scale}" width="${40*scale}" height="${16*scale}" 
                    fill="none" stroke="#2980b9" stroke-width="${3*scale}"/>
                
                <!-- Línea central para simular desagüe -->
                <circle cx="${x}" cy="${y}" r="${3*scale}" fill="none" 
                    stroke="#3498db" stroke-width="${2*scale}"/>
                
                <!-- Pequeñas líneas decorativas para indicar tipo de artefacto -->
                <line x1="${x-15*scale}" y1="${y-5*scale}" x2="${x-15*scale}" y2="${y+5*scale}" 
                    stroke="#34495e" stroke-width="${1*scale}"/>
                <line x1="${x+15*scale}" y1="${y-5*scale}" x2="${x+15*scale}" y2="${y+5*scale}" 
                    stroke="#34495e" stroke-width="${1*scale}"/>
                
                <!-- Conexión al sistema -->
                <circle cx="${x}" cy="${y+12*scale}" r="${2*scale}" fill="none" 
                    stroke="#3498db" stroke-width="${2*scale}"/>
                
                <!-- LÍNEA GUÍA para etiqueta de artefacto -->
                <line id="guide-line-${fixtureId}" class="fixture-guide-line"
                    x1="${x}" y1="${y + 12*scale}" x2="${labelX}" y2="${labelY}" 
                    stroke="#7f8c8d" stroke-width="${Math.max(1, 1*scale)}" 
                    stroke-dasharray="${3*scale},${2*scale}" opacity="0.5"/>
                
                <g class="draggable-label fixture-label" data-label-id="${fixtureId}" 
                   data-fixture-center-x="${x}" data-fixture-center-y="${y + 12*scale}"
                   transform="translate(${labelX}, ${labelY})">
                    <rect x="${-label.length * 3}" y="-8" width="${label.length * 6}" height="16" 
                        fill="white" stroke="#2c3e50" stroke-width="1" rx="3"/>
                    <text x="0" y="4" text-anchor="middle" font-family="Arial" 
                        font-size="${fontSize}" font-weight="bold" fill="#2c3e50">${label}</text>
                </g>
            </g>`;
        }
    }

    /**
     * Genera segmento de tubería isométrica PROFESIONAL (como imagen 2)
     */
    generatePipeSegment(pipe, drawScale) {
        const scale = this.currentScale;
        const fontSize = Math.max(6, 12 * this.textScale); // Texto más pequeño y profesional
        const start = this.toIsometric(pipe.x1 * drawScale, pipe.y1 * drawScale, pipe.z1 * drawScale);
        const end = this.toIsometric(pipe.x2 * drawScale, pipe.y2 * drawScale, pipe.z2 * drawScale);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
        
        // Posición inicial de la etiqueta (más cerca de la tubería)
        const labelX = midX + 40 * scale;
        const labelY = midY - 30 * scale;
        
        const pipeId = `pipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `<g class="pipe-segment" data-type="pipe" data-pipe-id="${pipeId}">
            <!-- Línea principal de tubería - color profesional -->
            <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" 
                stroke="#D2691E" stroke-width="${6*scale}" stroke-linecap="round"/>
            
            <!-- Línea de contorno superior para efecto 3D -->
            <line x1="${start.x}" y1="${start.y - 3*scale}" x2="${end.x}" y2="${end.y - 3*scale}" 
                stroke="#A0522D" stroke-width="${2*scale}" stroke-linecap="round"/>
            
            <!-- Puntos de conexión más discretos -->
            <circle cx="${start.x}" cy="${start.y}" r="${3*scale}" fill="#8B4513" stroke="#654321" stroke-width="${1*scale}"/>
            <circle cx="${end.x}" cy="${end.y}" r="${3*scale}" fill="#8B4513" stroke="#654321" stroke-width="${1*scale}"/>
            
            <!-- LÍNEA GUÍA que conecta tubería con etiqueta -->
            <line id="guide-line-${pipeId}" class="pipe-guide-line"
                x1="${midX}" y1="${midY}" x2="${labelX}" y2="${labelY}" 
                stroke="#000000" stroke-width="${Math.max(1, 1*scale)}" 
                stroke-dasharray="${2*scale},${1*scale}" opacity="0.6"/>
            
            <!-- Etiqueta PROFESIONAL CON INFORMACIÓN DETALLADA -->
            <g class="draggable-label pipe-label" data-label-id="${pipeId}" 
               data-pipe-center-x="${midX}" data-pipe-center-y="${midY}"
               transform="translate(${labelX}, ${labelY})">
                <rect x="-45" y="-20" width="90" height="40" fill="white" 
                    stroke="#2c3e50" stroke-width="${Math.max(1, 1*scale)}" rx="4" opacity="0.98"/>
                
                <!-- Línea 1: Material y diámetro -->
                <text x="0" y="-8" text-anchor="middle" font-family="Arial" 
                    font-size="${fontSize}" font-weight="bold" fill="#2c3e50">
                    ${pipe.material} ⌀${pipe.diameter}mm</text>
                    
                <!-- Línea 2: Longitud -->
                <text x="0" y="2" text-anchor="middle" font-family="Arial" 
                    font-size="${Math.max(5, 10 * this.textScale)}" fill="#34495e">L=${pipe.length}m</text>
                    
                <!-- Línea 3: Pendiente -->
                <text x="0" y="12" text-anchor="middle" font-family="Arial" 
                    font-size="${Math.max(5, 10 * this.textScale)}" fill="#34495e">i=${pipe.slope}%</text>
            </g>
            
            <!-- Flecha de dirección de flujo mejorada -->
            <g transform="translate(${end.x - 20*scale}, ${end.y}) rotate(${angle})">
                <polygon points="0,0 ${-8*scale},${-3*scale} ${-8*scale},${3*scale}" 
                    fill="#D2691E" stroke="#8B4513" stroke-width="${0.5*scale}"/>
            </g>
        </g>`;
    }

    /**
     * Genera la leyenda isométrica PROFESIONAL (como imagen 2)
     */
    generateLegend(x, y) {
        const scale = this.currentScale;
        const fontSize = Math.max(8, 16 * this.textScale);
        const smallFont = Math.max(6, 12 * this.textScale);
        
        return `<g class="draggable-label" data-label-id="legend-${Date.now()}" transform="translate(${x}, ${y})">
            <rect x="0" y="0" width="${300*scale}" height="${140*scale}" fill="white" 
                stroke="#2c3e50" stroke-width="${Math.max(1, 2*scale)}" rx="8"/>
            <text x="15" y="25" font-family="Arial" font-size="${fontSize}" font-weight="bold" fill="#2c3e50">LEYENDA</text>
            
            <!-- Tubería -->
            <line x1="15" y1="45" x2="45" y2="45" stroke="#e67e22" stroke-width="${6*scale}"/>
            <text x="55" y="50" font-family="Arial" font-size="${smallFont}" fill="#2c3e50">Tubería PVC alcantarillado</text>
            
            <!-- Cámara cilíndrica -->
            <ellipse cx="30" cy="70" rx="${15*scale}" ry="${5*scale}" fill="none" stroke="#2c3e50" stroke-width="${2*scale}"/>
            <ellipse cx="30" cy="80" rx="${15*scale}" ry="${5*scale}" fill="none" stroke="#2c3e50" stroke-width="${2*scale}"/>
            <line x1="15" y1="80" x2="15" y2="70" stroke="#2c3e50" stroke-width="${2*scale}"/>
            <line x1="45" y1="80" x2="45" y2="70" stroke="#2c3e50" stroke-width="${2*scale}"/>
            <text x="55" y="78" font-family="Arial" font-size="${smallFont}" fill="#2c3e50">Cámara de registro</text>
            
            <!-- WC -->
            <rect x="22" y="92" width="${16*scale}" height="${8*scale}" fill="none" stroke="#2c3e50" stroke-width="${2*scale}"/>
            <line x1="30" y1="92" x2="30" y2="100" stroke="#2c3e50" stroke-width="${1*scale}"/>
            <text x="55" y="98" font-family="Arial" font-size="${smallFont}" fill="#2c3e50">Artefacto WC</text>
            
            <!-- Otros artefactos -->
            <rect x="20" y="108" width="${20*scale}" height="${8*scale}" fill="none" stroke="#2980b9" stroke-width="${2*scale}"/>
            <circle cx="30" cy="112" r="${2*scale}" fill="none" stroke="#3498db" stroke-width="${1*scale}"/>
            <text x="55" y="115" font-family="Arial" font-size="${smallFont}" fill="#2c3e50">Otros artefactos sanitarios</text>
        </g>`;
    }

    /**
     * Genera el indicador de norte - ESCALA AJUSTABLE
     */
    generateNorthIndicator(x, y) {
        const scale = this.currentScale;
        const fontSize = Math.max(8, 14 * this.textScale);
        
        return `<g class="draggable-label" data-label-id="north-${Date.now()}" transform="translate(${x}, ${y})">
            <circle cx="0" cy="0" r="${35*scale}" fill="white" stroke="#2c3e50" stroke-width="${4*scale}"/>
            <polygon points="0,${-20*scale} ${-12*scale},${15*scale} 0,${8*scale} ${12*scale},${15*scale}" fill="#e74c3c"/>
            <text x="0" y="${60*scale}" text-anchor="middle" font-family="Arial" font-size="${fontSize}" fill="#2c3e50">N</text>
        </g>`;
    }

    /**
     * FUNCIÓN PRINCIPAL: Convertir trazado 2D a isométrico 3D - OPTIMIZADA PARA MILÍMETROS
     */
    convertTracingToIsometric(tracingElements, tracingConnections) {
        console.log('🎯 Convirtiendo trazado a isométrico PROFESIONAL...');
        console.log(`├─ Elementos: ${tracingElements.length}`);
        console.log(`└─ Conexiones: ${tracingConnections.length}`);

        const fixtures = tracingElements.map(element => {
            console.log(`  📍 Elemento ${element.type} en: (${element.x}mm, ${element.y}mm)`);
            return {
                x: element.x,
                y: 0,
                z: element.y,
                type: this.mapElementTypeToFixtureType(element.type),
                label: this.generateElementLabel(element),
                diameter: element.tuberia_diametro || 110
            };
        });

        const pipes = tracingConnections.map((connection, index) => {
            const fromElement = tracingElements.find(el => el.id === connection.from.id);
            const toElement = tracingElements.find(el => el.id === connection.to.id);
            
            console.log(`  🔗 Tubería ${index + 1}: (${fromElement.x}mm,${fromElement.y}mm) → (${toElement.x}mm,${toElement.y}mm)`);
            
            return {
                x1: fromElement.x,
                y1: 0,
                z1: fromElement.y,
                x2: toElement.x,
                y2: 0,
                z2: toElement.y,
                diameter: connection.diameter || 110,
                material: 'PVC',
                slope: 2.0,
                length: (connection.distance || 10).toFixed(1)
            };
        });

        console.log(`✅ Conversión completada: ${fixtures.length} artefactos, ${pipes.length} tuberías`);
        
        return { fixtures, pipes };
    }

    /**
     * Mapea tipos de elementos del trazado a tipos de artefactos isométricos
     */
    mapElementTypeToFixtureType(elementType) {
        const mapping = {
            'wc': 'WC',
            'lavatorio': 'LAVATORIO',
            'bano-tina': 'LAVATORIO',
            'ducha': 'LAVATORIO',
            'bidet': 'LAVATORIO',
            'urinario': 'LAVATORIO',
            'lavaplatos': 'LAVATORIO',
            'lavacopas': 'LAVATORIO',
            'lavadora': 'LAVATORIO',
            'lavadero': 'LAVATORIO',
            'camara-inspeccion': 'CAMARA',
            'camara-publica': 'CAMARA',
            'caja-registro': 'CAMARA',
            'punto-descarga': 'DESCARGA'
        };
        
        return mapping[elementType] || 'LAVATORIO';
    }

    /**
     * Genera etiqueta para elemento
     */
    generateElementLabel(element) {
        if (element.type === 'wc') return 'WC';
        if (element.type === 'camara-inspeccion') return element.etiqueta || `C${element.numeroCamera || element.id}`;
        if (element.type === 'camara-publica') return 'CP';
        
        const labels = {
            'lavatorio': 'LAV',
            'bano-tina': 'TIN',
            'ducha': 'DUC',
            'bidet': 'BID',
            'urinario': 'URI',
            'lavaplatos': 'LPL',
            'lavacopas': 'LCP',
            'lavadora': 'LAV',
            'lavadero': 'LAD'
        };
        
        return labels[element.type] || 'ARF';
    }

    /**
     * Genera SVG isométrico completo desde datos del trazado - VERSIÓN MEJORADA PARA MILÍMETROS
     */
    generateIsometricFromTracing(tracingElements, tracingConnections, title = "ISOMÉTRICO DE TRAZADO", scale = "SIN ESCALA") {
        
        if (tracingElements.length === 0 && tracingConnections.length === 0) {
            throw new Error('No hay elementos de trazado para convertir');
        }

        const { fixtures, pipes } = this.convertTracingToIsometric(tracingElements, tracingConnections);
        return this.generateIsometricSVG(pipes, fixtures, title, scale);
    }

    /**
     * Motor base de generación isométrica - VERSIÓN MEJORADA PARA MILÍMETROS
     */
    generateIsometricSVG(pipes = [], fixtures = [], title = "ISOMÉTRICO A.SERVIDAS", scale = "SIN ESCALA") {
        if (pipes.length === 0 && fixtures.length === 0) {
            throw new Error('Se requiere al menos una tubería o artefacto');
        }

        // CORREGIDO: Calcular límites del dibujo - ESCALA OPTIMIZADA PARA MILÍMETROS
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const scaleValue = 0.3; // CORREGIDO: Escala reducida para coordenadas en mm
        
        // Procesar tuberías
        pipes.forEach(pipe => {
            const start = this.toIsometric(pipe.x1 * scaleValue, pipe.y1 * scaleValue, pipe.z1 * scaleValue);
            const end = this.toIsometric(pipe.x2 * scaleValue, pipe.y2 * scaleValue, pipe.z2 * scaleValue);
            minX = Math.min(minX, start.x, end.x);
            maxX = Math.max(maxX, start.x, end.x);
            minY = Math.min(minY, start.y, end.y);
            maxY = Math.max(maxY, start.y, end.y);
        });
        
        // Procesar artefactos
        fixtures.forEach(fixture => {
            const pos = this.toIsometric(fixture.x * scaleValue, fixture.y * scaleValue, fixture.z * scaleValue);
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        });
        
        // Aplicar márgenes optimizados
        const margin = 100;
        minX -= margin;
        maxX += margin;
        minY -= margin;
        maxY += margin;
        
        // Validación de coordenadas
        if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
            console.warn('⚠️ No se encontraron coordenadas válidas, usando dimensiones por defecto');
            minX = -200;
            maxX = 400;
            minY = -200;
            maxY = 400;
        }
        
        const finalWidth = maxX - minX;
        const finalHeight = maxY - minY;
        
        // SVG con estructura profesional
        let svg = `<svg width="${finalWidth}" height="${finalHeight + 120}" 
            viewBox="${minX} ${minY - 60} ${finalWidth} ${finalHeight + 120}" 
            xmlns="http://www.w3.org/2000/svg" id="isometricSVG">
            
            <!-- Definiciones para mejores efectos -->
            <defs>
                <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.1"/>
                </filter>
            </defs>
            
            <!-- Título del proyecto PROFESIONAL -->
            <g class="draggable-label title-label" data-label-id="title-${Date.now()}" transform="translate(${minX + 30}, ${minY - 30})">
                <rect x="-10" y="-25" width="${Math.max(200, title.length * 10)}" height="50" 
                    fill="white" stroke="#2c3e50" stroke-width="1" rx="3" opacity="0.95"/>
                <text x="0" y="-5" font-family="Arial" font-size="${Math.max(14, 20 * this.textScale)}" 
                    font-weight="bold" fill="#2c3e50">${title}</text>
                <text x="0" y="15" font-family="Arial" font-size="${Math.max(8, 12 * this.textScale)}" 
                    fill="#7f8c8d">${scale}</text>
            </g>`;
        
        // Generar tuberías
        pipes.forEach(pipe => {
            svg += this.generatePipeSegment(pipe, scaleValue);
        });
        
        // Generar cámaras cilíndricas profesionales para elementos tipo cámara
        fixtures.forEach(fixture => {
            const pos = this.toIsometric(fixture.x * scaleValue, fixture.y * scaleValue, fixture.z * scaleValue);
            
            if (fixture.type === 'CAMARA') {
                // Generar cámara cilíndrica 3D profesional
                svg += this.generateManhole(pos.x, pos.y, 25 * this.currentScale, fixture.label);
            } else {
                // Generar artefactos profesionales
                svg += this.generateFixtureSymbol(pos.x, pos.y, fixture.type, fixture.label);
            }
            
            // Línea de conexión al sistema (más sutil)
            svg += `<line x1="${pos.x}" y1="${pos.y + 20 * this.currentScale}" x2="${pos.x}" y2="${pos.y + 35 * this.currentScale}" 
                stroke="#95a5a6" stroke-width="${1.5 * this.currentScale}" stroke-dasharray="${3 * this.currentScale},${2 * this.currentScale}" 
                opacity="0.4"/>`;
        });
        
        // Indicador de norte
        svg += this.generateNorthIndicator(maxX - 120, minY + 80);
        
        // Leyenda
        svg += this.generateLegend(minX + 30, maxY - 140);
        
        svg += '</svg>';
        
        return svg;
    }

    /**
     * Configurar manipulación de etiquetas en el SVG
     */
    setupLabelManipulation(svgElement) {
        const labels = svgElement.querySelectorAll('.draggable-label');
        
        labels.forEach(label => {
            this.makeLabelDraggable(label);
        });
    }

    /**
     * Hacer etiqueta arrastrable CON LÍNEA GUÍA CONECTADA
     */
    makeLabelDraggable(labelElement) {
        let isDragging = false;
        let startPoint = { x: 0, y: 0 };
        let startTransform = { x: 0, y: 0 };

        const getTransform = () => {
            const transform = labelElement.getAttribute('transform') || 'translate(0,0)';
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
        };

        // Función para actualizar línea guía (para tuberías Y artefactos, NO para títulos)
        const updateGuideLine = (newX, newY) => {
            if (labelElement.classList.contains('title-label')) return; // Los títulos no tienen líneas guía
            
            const labelId = labelElement.getAttribute('data-label-id');
            const guideLine = document.getElementById(`guide-line-${labelId}`);
            
            if (guideLine) {
                // Actualizar posición final de la línea guía
                guideLine.setAttribute('x2', newX);
                guideLine.setAttribute('y2', newY);
            }
        };

        labelElement.addEventListener('mousedown', (e) => {
            if (this.isIntegrated) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            isDragging = true;
            startPoint = { x: e.clientX, y: e.clientY };
            startTransform = getTransform();
            
            labelElement.style.cursor = 'grabbing';
            labelElement.style.opacity = '0.8';
            
            // Resaltar línea guía durante el arrastre (NO para títulos)
            if (!labelElement.classList.contains('title-label')) {
                const labelId = labelElement.getAttribute('data-label-id');
                const guideLine = document.getElementById(`guide-line-${labelId}`);
                if (guideLine) {
                    guideLine.setAttribute('stroke', '#3498db');
                    guideLine.setAttribute('stroke-width', '2');
                    guideLine.setAttribute('opacity', '1');
                }
            }
        });

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startPoint.x;
            const deltaY = e.clientY - startPoint.y;
            
            const newX = startTransform.x + deltaX;
            const newY = startTransform.y + deltaY;
            
            labelElement.setAttribute('transform', `translate(${newX}, ${newY})`);
            
            // Actualizar línea guía en tiempo real
            updateGuideLine(newX, newY);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                labelElement.style.cursor = 'grab';
                labelElement.style.opacity = '1';
                
                // Restaurar estilo de línea guía (NO para títulos)
                if (!labelElement.classList.contains('title-label')) {
                    const labelId = labelElement.getAttribute('data-label-id');
                    const guideLine = document.getElementById(`guide-line-${labelId}`);
                    if (guideLine) {
                        // Restaurar color según el tipo
                        const strokeColor = labelElement.classList.contains('pipe-label') ? '#000000' : '#7f8c8d';
                        guideLine.setAttribute('stroke', strokeColor);
                        guideLine.setAttribute('stroke-width', '1');
                        guideLine.setAttribute('opacity', labelElement.classList.contains('pipe-label') ? '0.7' : '0.5');
                    }
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        labelElement.style.cursor = 'grab';
        
        // Efecto hover para etiquetas con líneas guía (NO para títulos)
        if ((labelElement.classList.contains('pipe-label') || labelElement.classList.contains('fixture-label')) 
            && !labelElement.classList.contains('title-label')) {
            labelElement.addEventListener('mouseenter', () => {
                const labelId = labelElement.getAttribute('data-label-id');
                const guideLine = document.getElementById(`guide-line-${labelId}`);
                if (guideLine) {
                    guideLine.setAttribute('stroke', '#3498db');
                    guideLine.setAttribute('opacity', '1');
                }
            });
            
            labelElement.addEventListener('mouseleave', () => {
                if (!isDragging) {
                    const labelId = labelElement.getAttribute('data-label-id');
                    const guideLine = document.getElementById(`guide-line-${labelId}`);
                    if (guideLine) {
                        const strokeColor = labelElement.classList.contains('pipe-label') ? '#000000' : '#7f8c8d';
                        guideLine.setAttribute('stroke', strokeColor);
                        guideLine.setAttribute('opacity', labelElement.classList.contains('pipe-label') ? '0.7' : '0.5');
                    }
                }
            });
        }
    }
}

// ================================
// INTEGRACIÓN MEJORADA CON EL SISTEMA PRINCIPAL
// ================================

window.isometricGenerator = new IsometricSewerGenerator();

/**
 * FUNCIÓN PRINCIPAL MEJORADA
 */
function generateIsometric() {
    try {
        const currentPlan = plans[currentPlanIndex];
        
        console.log('🔍 Plan actual:', currentPlan.title);
        console.log('🔍 Elementos en plan:', currentPlan.tracingElements.length);
        console.log('🔍 Conexiones en plan:', currentPlan.tracingConnections.length);
        
        if (!currentPlan.tracingElements || currentPlan.tracingElements.length === 0) {
            showStatus('⚠️ Genera primero un trazado antes de crear el isométrico');
            return;
        }

        if (!currentPlan.tracingConnections || currentPlan.tracingConnections.length === 0) {
            showStatus('⚠️ No hay conexiones en el trazado para crear isométrico');
            return;
        }

        console.log('🎯 Generando isométrico PROFESIONAL desde trazado...');
        showStatus('⚡ Generando vista isométrica PROFESIONAL con cilindros 3D...');

        const isometricSVG = window.isometricGenerator.generateIsometricFromTracing(
            currentPlan.tracingElements,
            currentPlan.tracingConnections,
            `ISOMÉTRICO - ${currentPlan.title}`,
            `1:${currentPlan.tracingScale}`
        );

        showIsometricWindow(isometricSVG);
        showStatus('✅ Vista isométrica PROFESIONAL generada - Cilindros 3D y símbolos técnicos listos');

    } catch (error) {
        console.error('Error generando isométrico:', error);
        showStatus('❌ Error generando isométrico: ' + error.message);
    }
}

/**
 * Muestra la ventana flotante MEJORADA con controles Y PRESERVA POSICIONES
 */
function showIsometricWindow(svgContent) {
    if (window.isometricGenerator.isWindowOpen) {
        closeIsometricWindow();
    }

    // Guardar posiciones actuales si viene del integrado
    const labelPositions = {};
    const integratedContainer = document.getElementById('integratedIsometric');
    if (integratedContainer) {
        const labels = integratedContainer.querySelectorAll('.draggable-label[data-label-id]');
        labels.forEach(label => {
            const labelId = label.getAttribute('data-label-id');
            const transform = label.getAttribute('transform') || 'translate(0,0)';
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match && labelId) {
                labelPositions[labelId] = {
                    x: parseFloat(match[1]),
                    y: parseFloat(match[2])
                };
            }
        });
    }

    const windowDiv = document.createElement('div');
    windowDiv.id = 'isometricWindow';
    windowDiv.className = 'isometric-window';
    
    windowDiv.innerHTML = `
        <div class="isometric-header">
            <div class="isometric-title">
                <span>🎯 Vista Isométrica Profesional</span>
            </div>
            <div class="isometric-controls">
                <!-- NUEVOS CONTROLES DE ESCALA -->
                <div class="scale-controls">
                    <button class="scale-btn" onclick="adjustIsometricScale(-0.2)" title="Reducir escala">🔍-</button>
                    <span class="scale-display" id="scaleDisplay">100%</span>
                    <button class="scale-btn" onclick="adjustIsometricScale(0.2)" title="Aumentar escala">🔍+</button>
                </div>
                
                <!-- CONTROLES DE TEXTO -->
                <div class="text-controls">
                    <button class="text-btn" onclick="adjustTextScale(-0.2)" title="Texto más pequeño">T-</button>
                    <span class="text-display" id="textDisplay">100%</span>
                    <button class="text-btn" onclick="adjustTextScale(0.2)" title="Texto más grande">T+</button>
                </div>
                
                <!-- BOTÓN DE INTEGRACIÓN -->
                <button class="isometric-btn" onclick="toggleIsometricIntegration()" id="integrationBtn" title="Integrar en plano">
                    📌 Integrar
                </button>
                
                <button class="isometric-btn" onclick="exportIsometricSVG()" title="Exportar SVG">
                    💾 Exportar
                </button>
                <button class="isometric-btn minimize" onclick="minimizeIsometricWindow()" title="Minimizar">
                    ➖
                </button>
                <button class="isometric-btn close" onclick="closeIsometricWindow()" title="Cerrar">
                    ❌
                </button>
            </div>
        </div>
        <div class="isometric-content" id="isometricContent">
            ${svgContent}
        </div>
        <div class="isometric-resize-handle" onmousedown="startResizeIsometric(event)"></div>
    `;

    document.body.appendChild(windowDiv);
    
    // Configurar manipulación de etiquetas Y RESTAURAR POSICIONES
    setTimeout(() => {
        const svgElement = windowDiv.querySelector('#isometricSVG');
        if (svgElement) {
            window.isometricGenerator.setupLabelManipulation(svgElement);
            
            // Restaurar posiciones guardadas
            Object.keys(labelPositions).forEach(labelId => {
                const label = svgElement.querySelector(`[data-label-id="${labelId}"]`);
                const guideLine = svgElement.querySelector(`#guide-line-${labelId}`);
                
                if (label && labelPositions[labelId]) {
                    const pos = labelPositions[labelId];
                    label.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                    
                    // Actualizar línea guía correspondiente
                    if (guideLine) {
                        guideLine.setAttribute('x2', pos.x);
                        guideLine.setAttribute('y2', pos.y);
                    }
                }
            });
        }
    }, 100);
    
    makeIsometricWindowDraggable(windowDiv);
    
    window.isometricGenerator.isWindowOpen = true;
    window.isometricGenerator.windowElement = windowDiv;
    window.isometricGenerator.currentSVG = svgContent;
}

/**
 * NUEVAS FUNCIONES DE CONTROL
 */
function adjustIsometricScale(delta) {
    const generator = window.isometricGenerator;
    generator.currentScale = Math.max(generator.minScale, Math.min(generator.maxScale, generator.currentScale + delta));
    
    const scaleDisplay = document.getElementById('scaleDisplay');
    if (scaleDisplay) {
        scaleDisplay.textContent = `${Math.round(generator.currentScale * 100)}%`;
    }
    
    regenerateIsometric();
    showStatus(`🔍 Escala profesional ajustada: ${Math.round(generator.currentScale * 100)}% - Cilindros y líneas guía actualizados`);
}

function adjustTextScale(delta) {
    const generator = window.isometricGenerator;
    generator.textScale = Math.max(0.5, Math.min(2.0, generator.textScale + delta));
    
    const textDisplay = document.getElementById('textDisplay');
    if (textDisplay) {
        textDisplay.textContent = `${Math.round(generator.textScale * 100)}%`;
    }
    
    regenerateIsometric();
    showStatus(`📝 Texto profesional ajustado: ${Math.round(generator.textScale * 100)}% - Etiquetas técnicas redimensionadas`);
}

function toggleIsometricIntegration() {
    const generator = window.isometricGenerator;
    const integrationBtn = document.getElementById('integrationBtn');
    
    if (generator.isIntegrated) {
        // Desintegrar - volver a ventana flotante
        showIsometricWindow(generator.currentSVG);
        generator.isIntegrated = false;
        integrationBtn.textContent = '📌 Integrar';
        showStatus('🪟 Isométrico PROFESIONAL en ventana flotante - Cilindros 3D manipulables');
    } else {
        // Integrar en el plano principal
        integrateIsometricIntoDrawing();
        generator.isIntegrated = true;
        integrationBtn.textContent = '🪟 Flotante';
        showStatus('📌 Isométrico PROFESIONAL integrado en el plano - Cilindros 3D y etiquetas técnicas');
    }
}

function integrateIsometricIntoDrawing() {
    const drawingBoard = document.getElementById('drawingBoard');
    const generator = window.isometricGenerator;
    
    // Guardar posiciones actuales de etiquetas
    const labelPositions = {};
    const labels = document.querySelectorAll('.draggable-label[data-label-id]');
    labels.forEach(label => {
        const labelId = label.getAttribute('data-label-id');
        const transform = label.getAttribute('transform') || 'translate(0,0)';
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        if (match && labelId) {
            labelPositions[labelId] = {
                x: parseFloat(match[1]),
                y: parseFloat(match[2])
            };
        }
    });
    
    // Crear contenedor para el isométrico integrado
    let integratedContainer = document.getElementById('integratedIsometric');
    if (integratedContainer) {
        integratedContainer.remove();
    }
    
    integratedContainer = document.createElement('div');
    integratedContainer.id = 'integratedIsometric';
    integratedContainer.className = 'integrated-isometric';
    integratedContainer.innerHTML = generator.currentSVG;
    
    // Posicionar en esquina del plano
    integratedContainer.style.position = 'absolute';
    integratedContainer.style.top = '20px';
    integratedContainer.style.right = '20px';
    integratedContainer.style.width = '300px';
    integratedContainer.style.height = '200px';
    integratedContainer.style.background = 'white';
    integratedContainer.style.border = '2px solid #2c3e50';
    integratedContainer.style.borderRadius = '8px';
    integratedContainer.style.overflow = 'hidden';
    integratedContainer.style.zIndex = '100';
    integratedContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    
    drawingBoard.appendChild(integratedContainer);
    
    // Cerrar ventana flotante
    closeIsometricWindow();
    
    // Configurar etiquetas en el isométrico integrado y restaurar posiciones
    setTimeout(() => {
        const svgElement = integratedContainer.querySelector('#isometricSVG');
        if (svgElement) {
            generator.setupLabelManipulation(svgElement);
            
            // Restaurar posiciones guardadas
            Object.keys(labelPositions).forEach(labelId => {
                const label = svgElement.querySelector(`[data-label-id="${labelId}"]`);
                const guideLine = svgElement.querySelector(`#guide-line-${labelId}`);
                
                if (label && labelPositions[labelId]) {
                    const pos = labelPositions[labelId];
                    label.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                    
                    // Actualizar línea guía correspondiente
                    if (guideLine) {
                        guideLine.setAttribute('x2', pos.x);
                        guideLine.setAttribute('y2', pos.y);
                    }
                }
            });
        }
    }, 100);
}

function regenerateIsometric() {
    const currentPlan = plans[currentPlanIndex];
    const generator = window.isometricGenerator;
    
    try {
        // Guardar posiciones de etiquetas antes de regenerar
        const labelPositions = {};
        const labels = document.querySelectorAll('.draggable-label[data-label-id]');
        labels.forEach(label => {
            const labelId = label.getAttribute('data-label-id');
            const transform = label.getAttribute('transform') || 'translate(0,0)';
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match && labelId) {
                labelPositions[labelId] = {
                    x: parseFloat(match[1]),
                    y: parseFloat(match[2])
                };
            }
        });
        
        const newSVG = generator.generateIsometricFromTracing(
            currentPlan.tracingElements,
            currentPlan.tracingConnections,
            `ISOMÉTRICO - ${currentPlan.title}`,
            `1:${currentPlan.tracingScale}`
        );
        
        generator.currentSVG = newSVG;
        
        const updateContainer = (container) => {
            if (container) {
                container.innerHTML = newSVG;
                setTimeout(() => {
                    const svgElement = container.querySelector('#isometricSVG');
                    if (svgElement) {
                        generator.setupLabelManipulation(svgElement);
                        
                        // Restaurar posiciones de etiquetas guardadas
                        Object.keys(labelPositions).forEach(labelId => {
                            const label = svgElement.querySelector(`[data-label-id="${labelId}"]`);
                            const guideLine = svgElement.querySelector(`#guide-line-${labelId}`);
                            
                            if (label && labelPositions[labelId]) {
                                const pos = labelPositions[labelId];
                                label.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                                
                                // Actualizar línea guía correspondiente
                                if (guideLine) {
                                    guideLine.setAttribute('x2', pos.x);
                                    guideLine.setAttribute('y2', pos.y);
                                }
                            }
                        });
                    }
                }, 100);
            }
        };
        
        if (generator.isIntegrated) {
            updateContainer(document.getElementById('integratedIsometric'));
        } else {
            updateContainer(document.getElementById('isometricContent'));
        }
        
    } catch (error) {
        console.error('Error regenerando isométrico:', error);
        showStatus('❌ Error actualizando isométrico');
    }
}

// Funciones originales mantenidas
function closeIsometricWindow() {
    const window_elem = document.getElementById('isometricWindow');
    if (window_elem) {
        window_elem.remove();
    }
    window.isometricGenerator.isWindowOpen = false;
    window.isometricGenerator.windowElement = null;
}

function minimizeIsometricWindow() {
    const window_elem = document.getElementById('isometricWindow');
    if (window_elem) {
        window_elem.classList.toggle('minimized');
    }
}

function exportIsometricSVG() {
    if (!window.isometricGenerator.currentSVG) {
        showStatus('❌ No hay contenido para exportar');
        return;
    }
    
    const blob = new Blob([window.isometricGenerator.currentSVG], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `isometrico_profesional_${new Date().toISOString().slice(0,10)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('✅ Isométrico PROFESIONAL exportado como SVG - Cilindros 3D y símbolos técnicos');
}

function makeIsometricWindowDraggable(windowDiv) {
    const header = windowDiv.querySelector('.isometric-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', function(e) {
        if (e.target.closest('.isometric-controls')) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = windowDiv.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        header.style.cursor = 'grabbing';
        
        function handleMouseMove(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            windowDiv.style.left = (startLeft + deltaX) + 'px';
            windowDiv.style.top = (startTop + deltaY) + 'px';
        }
        
        function handleMouseUp() {
            isDragging = false;
            header.style.cursor = 'grab';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

function startResizeIsometric(e) {
    e.preventDefault();
    const windowDiv = document.getElementById('isometricWindow');
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseInt(document.defaultView.getComputedStyle(windowDiv).width, 10);
    const startHeight = parseInt(document.defaultView.getComputedStyle(windowDiv).height, 10);

    function handleMouseMove(e) {
        const newWidth = startWidth + e.clientX - startX;
        const newHeight = startHeight + e.clientY - startY;
        
        windowDiv.style.width = Math.max(500, newWidth) + 'px';
        windowDiv.style.height = Math.max(400, newHeight) + 'px';
    }

    function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

console.log('🎯 Motor Isométrico PROFESIONAL MEJORADO cargado - Cilindros 3D y símbolos técnicos');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Motor Isométrico PROFESIONAL iniciado correctamente - Cilindros 3D listos');
    
    if (typeof generateIsometric === 'function') {
        console.log('✅ Función generateIsometric disponible');
    }
    
    if (typeof plans !== 'undefined' && typeof currentPlanIndex !== 'undefined') {
        console.log('✅ Integración con sistema principal exitosa');
    }
});