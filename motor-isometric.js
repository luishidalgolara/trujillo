/**
 * MOTOR ISOMÉTRICO PROFESIONAL OPTIMIZADO
 * - Textos pequeños y legibles (6-10px)
 * - Sin leyenda (eliminada)
 * - Título sin rectángulo de fondo
 * - Solo etiquetas de tuberías/artefactos arrastrables
 * - Sistema de arrastre sin conflictos
 * - Diseño limpio y profesional
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
    
    toIsometric(x, y, z = 0) {
        const angle = Math.PI / 6;
        const cos30 = Math.cos(angle);
        const sin30 = Math.sin(angle);
        return {
            x: (x - z) * cos30,
            y: (x + z) * sin30 + y
        };
    }

    generateManhole(x, y, radius, label) {
        const scaledRadius = radius * this.currentScale;
        const fontSize = Math.max(6, 10 * this.textScale);
        
        return `<g class="manhole" data-type="manhole">
            <ellipse cx="${x}" cy="${y - 40 * this.currentScale}" rx="${scaledRadius}" ry="${scaledRadius * 0.6}" 
                fill="#f8f9fa" stroke="#2c3e50" stroke-width="${3 * this.currentScale}"/>
            <ellipse cx="${x}" cy="${y}" rx="${scaledRadius}" ry="${scaledRadius * 0.6}" 
                fill="none" stroke="#2c3e50" stroke-width="${3 * this.currentScale}"/>
            <line x1="${x - scaledRadius}" y1="${y}" x2="${x - scaledRadius}" y2="${y - 40 * this.currentScale}" 
                stroke="#2c3e50" stroke-width="${3 * this.currentScale}"/>
            <line x1="${x + scaledRadius}" y1="${y}" x2="${x + scaledRadius}" y2="${y - 40 * this.currentScale}" 
                stroke="#2c3e50" stroke-width="${3 * this.currentScale}"/>
            <ellipse cx="${x}" cy="${y - 40 * this.currentScale}" rx="${scaledRadius * 0.8}" ry="${scaledRadius * 0.5}" 
                fill="white" stroke="#34495e" stroke-width="${2 * this.currentScale}"/>
            ${label ? `<g class="fixture-label" data-label-id="manhole-${Date.now()}" transform="translate(${x}, ${y + 40 * this.currentScale})">
                <rect x="${-label.length * 3}" y="-6" width="${label.length * 6}" height="12" 
                    fill="white" stroke="#2c3e50" stroke-width="0.8" rx="2"/>
                <text x="0" y="3" text-anchor="middle" font-family="Arial" 
                    font-size="${fontSize}" font-weight="bold" fill="#2c3e50">${label}</text>
            </g>` : ''}
        </g>`;
    }

    generateWCSymbol(x, y) {
        const scale = this.currentScale;
        const fontSize = Math.max(7, 10 * this.textScale);
        const wcId = `wc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // WC CON FLECHA DEFINIDA Y SIN TEXTO DUPLICADO
        return `<g class="wc-symbol" data-type="wc" data-element-id="${wcId}">
            <!-- Línea vertical principal -->
            <line x1="${x}" y1="${y-45*scale}" x2="${x}" y2="${y+8*scale}" 
                stroke="#D2691E" stroke-width="${5*scale}" stroke-linecap="butt"/>
            
            <!-- Flecha MÁS DEFINIDA con punta más afilada -->
            <path d="M ${x},${y-48*scale} L ${x-15*scale},${y-25*scale} L ${x},${y-35*scale} L ${x+15*scale},${y-25*scale} Z" 
                fill="#D2691E" stroke="none"/>
            
            <!-- Punto de conexión -->
            <circle cx="${x}" cy="${y+8*scale}" r="${4*scale}" 
                fill="#3498db" stroke="#2c3e50" stroke-width="${1.5*scale}"/>
            
            <!-- ÚNICA etiqueta WC arriba (NO arrastrable) -->
            <g transform="translate(${x}, ${y-60*scale})">
                <rect x="-14" y="-10" width="28" height="20" fill="white" stroke="#2c3e50" stroke-width="1.5" rx="3"/>
                <text x="0" y="6" text-anchor="middle" font-family="Arial" 
                    font-size="${fontSize}" font-weight="bold" fill="#2c3e50">WC</text>
            </g>
        </g>`;
    }

    generateFixtureSymbol(x, y, type, label) {
        const scale = this.currentScale;
        const fontSize = Math.max(7, 9 * this.textScale);
        
        if (type === 'WC' || type === 'wc') {
            return this.generateWCSymbol(x, y);
        }
        
        const fixtureId = `fixture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // LAVATORIO CON FLECHA DEFINIDA Y SIN TEXTO DUPLICADO
        return `<g class="fixture-symbol" data-type="${type}" data-element-id="${fixtureId}">
            <!-- Línea vertical principal -->
            <line x1="${x}" y1="${y-40*scale}" x2="${x}" y2="${y+8*scale}" 
                stroke="#D2691E" stroke-width="${5*scale}" stroke-linecap="butt"/>
            
            <!-- Flecha MÁS DEFINIDA con punta más afilada -->
            <path d="M ${x},${y-43*scale} L ${x-14*scale},${y-22*scale} L ${x},${y-32*scale} L ${x+14*scale},${y-22*scale} Z" 
                fill="#D2691E" stroke="none"/>
            
            <!-- Punto de conexión -->
            <circle cx="${x}" cy="${y+8*scale}" r="${4*scale}" 
                fill="#3498db" stroke="#2c3e50" stroke-width="${1.5*scale}"/>
            
            <!-- ÚNICA etiqueta arriba (NO arrastrable) -->
            <g transform="translate(${x}, ${y-54*scale})">
                <rect x="${-label.length * 4}" y="-10" width="${label.length * 8}" height="20" 
                    fill="white" stroke="#2c3e50" stroke-width="1.5" rx="3"/>
                <text x="0" y="6" text-anchor="middle" font-family="Arial" 
                    font-size="${fontSize}" font-weight="bold" fill="#2c3e50">${label}</text>
            </g>
        </g>`;
    }

    generatePipeSegment(pipe, drawScale) {
        const scale = this.currentScale;
        const fontSize = Math.max(6, 9 * this.textScale);
        const smallFont = Math.max(5, 7 * this.textScale);
        
        const start = this.toIsometric(pipe.x1 * drawScale, pipe.y1 * drawScale, pipe.z1 * drawScale);
        const end = this.toIsometric(pipe.x2 * drawScale, pipe.y2 * drawScale, pipe.z2 * drawScale);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
        
        const labelX = midX + 35 * scale;
        const labelY = midY - 25 * scale;
        const pipeId = `pipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `<g class="pipe-segment" data-type="pipe" data-pipe-id="${pipeId}">
            <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" 
                stroke="#D2691E" stroke-width="${5*scale}" stroke-linecap="round"/>
            <line x1="${start.x}" y1="${start.y - 2*scale}" x2="${end.x}" y2="${end.y - 2*scale}" 
                stroke="#A0522D" stroke-width="${1.5*scale}" stroke-linecap="round"/>
            <circle cx="${start.x}" cy="${start.y}" r="${2.5*scale}" fill="#8B4513" stroke="#654321" stroke-width="${0.8*scale}"/>
            <circle cx="${end.x}" cy="${end.y}" r="${2.5*scale}" fill="#8B4513" stroke="#654321" stroke-width="${0.8*scale}"/>
            <line id="guide-line-${pipeId}" class="pipe-guide-line"
                x1="${midX}" y1="${midY}" x2="${labelX}" y2="${labelY}" 
                stroke="#000000" stroke-width="${Math.max(0.5, 0.8*scale)}" 
                stroke-dasharray="${2*scale},${1*scale}" opacity="0.6" style="pointer-events: none;"/>
            <g class="pipe-label" data-label-id="${pipeId}" 
               data-pipe-center-x="${midX}" data-pipe-center-y="${midY}"
               transform="translate(${labelX}, ${labelY})">
                <rect x="-32" y="-14" width="64" height="28" fill="white" 
                    stroke="#2c3e50" stroke-width="${Math.max(0.8, 0.8*scale)}" rx="3" opacity="0.98"/>
                <text x="0" y="-6" text-anchor="middle" font-family="Arial" 
                    font-size="${fontSize}" font-weight="bold" fill="#2c3e50">
                    ${pipe.material} ⌀${pipe.diameter}mm</text>
                <text x="0" y="2" text-anchor="middle" font-family="Arial" 
                    font-size="${smallFont}" fill="#34495e">L=${pipe.length}m</text>
                <text x="0" y="10" text-anchor="middle" font-family="Arial" 
                    font-size="${smallFont}" fill="#34495e">i=${pipe.slope}%</text>
            </g>
            <g transform="translate(${end.x - 16*scale}, ${end.y}) rotate(${angle})">
                <polygon points="0,0 ${-6*scale},${-2.5*scale} ${-6*scale},${2.5*scale}" 
                    fill="#D2691E" stroke="#8B4513" stroke-width="${0.5*scale}"/>
            </g>
        </g>`;
    }

    generateNorthIndicator(x, y) {
        const scale = this.currentScale;
        const fontSize = Math.max(6, 10 * this.textScale);
        
        return `<g class="north-indicator" transform="translate(${x}, ${y})">
            <circle cx="0" cy="0" r="${25*scale}" fill="white" stroke="#2c3e50" stroke-width="${2*scale}"/>
            <polygon points="0,${-15*scale} ${-8*scale},${12*scale} 0,${6*scale} ${8*scale},${12*scale}" fill="#e74c3c"/>
            <text x="0" y="${42*scale}" text-anchor="middle" font-family="Arial" font-size="${fontSize}" fill="#2c3e50">N</text>
        </g>`;
    }

    convertTracingToIsometric(tracingElements, tracingConnections) {
        const fixtures = tracingElements.map(element => ({
            x: element.x,
            y: 0,
            z: element.y,
            type: this.mapElementTypeToFixtureType(element.type),
            label: this.generateElementLabel(element),
            diameter: element.tuberia_diametro || 110
        }));

        const pipes = tracingConnections.map((connection) => {
            const fromElement = tracingElements.find(el => el.id === connection.from.id);
            const toElement = tracingElements.find(el => el.id === connection.to.id);
            
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
        
        return { fixtures, pipes };
    }

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

    generateIsometricFromTracing(tracingElements, tracingConnections, title = "ISOMÉTRICO DE TRAZADO", scale = "SIN ESCALA") {
        if (tracingElements.length === 0 && tracingConnections.length === 0) {
            throw new Error('No hay elementos de trazado para convertir');
        }
        const { fixtures, pipes } = this.convertTracingToIsometric(tracingElements, tracingConnections);
        return this.generateIsometricSVG(pipes, fixtures, title, scale);
    }

    generateIsometricSVG(pipes = [], fixtures = [], title = "ISOMÉTRICO A.SERVIDAS", scale = "SIN ESCALA") {
        if (pipes.length === 0 && fixtures.length === 0) {
            throw new Error('Se requiere al menos una tubería o artefacto');
        }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const scaleValue = 1.5;
        
        pipes.forEach(pipe => {
            const start = this.toIsometric(pipe.x1 * scaleValue, pipe.y1 * scaleValue, pipe.z1 * scaleValue);
            const end = this.toIsometric(pipe.x2 * scaleValue, pipe.y2 * scaleValue, pipe.z2 * scaleValue);
            minX = Math.min(minX, start.x, end.x);
            maxX = Math.max(maxX, start.x, end.x);
            minY = Math.min(minY, start.y, end.y);
            maxY = Math.max(maxY, start.y, end.y);
        });
        
        fixtures.forEach(fixture => {
            const pos = this.toIsometric(fixture.x * scaleValue, fixture.y * scaleValue, fixture.z * scaleValue);
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        });
        
        const margin = 100;
        minX -= margin;
        maxX += margin;
        minY -= margin;
        maxY += margin;
        
        if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
            minX = -200;
            maxX = 400;
            minY = -200;
            maxY = 400;
        }
        
        const finalWidth = maxX - minX;
        const finalHeight = maxY - minY;
        
        // SVG CON FONDO TRANSPARENTE
        let svg = `<svg width="${finalWidth}" height="${finalHeight + 80}" 
            viewBox="${minX} ${minY - 40} ${finalWidth} ${finalHeight + 80}" 
            xmlns="http://www.w3.org/2000/svg" id="isometricSVG" style="background: transparent;">
            <defs>
                <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.1"/>
                </filter>
            </defs>
            <g class="title-group" transform="translate(${minX + 20}, ${minY - 20})">
                <text x="0" y="0" font-family="Arial" font-size="${Math.max(10, 14 * this.textScale)}" 
                    font-weight="bold" fill="#2c3e50">${title}</text>
                <text x="0" y="14" font-family="Arial" font-size="${Math.max(6, 9 * this.textScale)}" 
                    fill="#7f8c8d">${scale}</text>
            </g>`;
        
        pipes.forEach(pipe => {
            svg += this.generatePipeSegment(pipe, scaleValue);
        });
        
        fixtures.forEach(fixture => {
            const pos = this.toIsometric(fixture.x * scaleValue, fixture.y * scaleValue, fixture.z * scaleValue);
            if (fixture.type === 'CAMARA') {
                svg += this.generateManhole(pos.x, pos.y, 20 * this.currentScale, fixture.label);
            } else {
                svg += this.generateFixtureSymbol(pos.x, pos.y, fixture.type, fixture.label);
            }
            svg += `<line x1="${pos.x}" y1="${pos.y + 15 * this.currentScale}" x2="${pos.x}" y2="${pos.y + 25 * this.currentScale}" 
                stroke="#95a5a6" stroke-width="${1 * this.currentScale}" stroke-dasharray="${2 * this.currentScale},${1.5 * this.currentScale}" 
                opacity="0.3"/>`;
        });
        
        svg += this.generateNorthIndicator(maxX - 80, minY + 60);
        svg += '</svg>';
        return svg;
    }

    setupLabelManipulation(svgElement) {
        // Solo etiquetas de tuberías son arrastrables (pipe-label)
        const labels = svgElement.querySelectorAll('.pipe-label');
        
        labels.forEach(label => {
            this.makeLabelDraggable(label);
        });
    }

    makeLabelDraggable(labelElement) {
        let isDragging = false;
        let startPoint = { x: 0, y: 0 };
        let startTransform = { x: 0, y: 0 };

        const getTransform = () => {
            const transform = labelElement.getAttribute('transform') || 'translate(0,0)';
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
        };

        const updateGuideLine = (newX, newY) => {
            const labelId = labelElement.getAttribute('data-label-id');
            const guideLine = document.getElementById(`guide-line-${labelId}`);
            if (guideLine) {
                guideLine.setAttribute('x2', newX);
                guideLine.setAttribute('y2', newY);
            }
        };

        labelElement.style.cursor = 'grab';

        const handleMouseDown = (e) => {
            // Las etiquetas SIEMPRE se pueden arrastrar, incluso si el contenedor está bloqueado
            e.preventDefault();
            e.stopPropagation();
            
            isDragging = true;
            startPoint = { x: e.clientX, y: e.clientY };
            startTransform = getTransform();
            
            labelElement.style.cursor = 'grabbing';
            labelElement.style.opacity = '0.8';
            
            const labelId = labelElement.getAttribute('data-label-id');
            const guideLine = document.getElementById(`guide-line-${labelId}`);
            if (guideLine) {
                guideLine.setAttribute('stroke', '#3498db');
                guideLine.setAttribute('stroke-width', '2');
                guideLine.setAttribute('opacity', '1');
            }
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startPoint.x;
            const deltaY = e.clientY - startPoint.y;
            
            const newX = startTransform.x + deltaX;
            const newY = startTransform.y + deltaY;
            
            labelElement.setAttribute('transform', `translate(${newX}, ${newY})`);
            updateGuideLine(newX, newY);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                labelElement.style.cursor = 'grab';
                labelElement.style.opacity = '1';
                
                const labelId = labelElement.getAttribute('data-label-id');
                const guideLine = document.getElementById(`guide-line-${labelId}`);
                if (guideLine) {
                    guideLine.setAttribute('stroke', '#000000');
                    guideLine.setAttribute('stroke-width', '1');
                    guideLine.setAttribute('opacity', '0.7');
                }
            }
        };

        const handleMouseEnter = () => {
            const labelId = labelElement.getAttribute('data-label-id');
            const guideLine = document.getElementById(`guide-line-${labelId}`);
            if (guideLine && !isDragging) {
                guideLine.setAttribute('stroke', '#3498db');
                guideLine.setAttribute('opacity', '1');
            }
        };

        const handleMouseLeave = () => {
            if (!isDragging) {
                const labelId = labelElement.getAttribute('data-label-id');
                const guideLine = document.getElementById(`guide-line-${labelId}`);
                if (guideLine) {
                    guideLine.setAttribute('stroke', '#000000');
                    guideLine.setAttribute('opacity', '0.7');
                }
            }
        };

        labelElement.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        labelElement.addEventListener('mouseenter', handleMouseEnter);
        labelElement.addEventListener('mouseleave', handleMouseLeave);
    }
}

window.isometricGenerator = new IsometricSewerGenerator();

function generateIsometric() {
    try {
        const currentPlan = plans[currentPlanIndex];
        
        if (!currentPlan.tracingElements || currentPlan.tracingElements.length === 0) {
            showStatus('⚠️ Genera primero un trazado antes de crear el isométrico');
            return;
        }
        if (!currentPlan.tracingConnections || currentPlan.tracingConnections.length === 0) {
            showStatus('⚠️ No hay conexiones en el trazado para crear isométrico');
            return;
        }

        showStatus('⚡ Generando vista isométrica profesional optimizada...');
        const isometricSVG = window.isometricGenerator.generateIsometricFromTracing(
            currentPlan.tracingElements,
            currentPlan.tracingConnections,
            `ISOMÉTRICO - ${currentPlan.title}`,
            `1:${currentPlan.tracingScale}`
        );
        showIsometricWindow(isometricSVG);
        showStatus('✅ Vista isométrica profesional generada');
    } catch (error) {
        console.error('Error generando isométrico:', error);
        showStatus('❌ Error generando isométrico: ' + error.message);
    }
}

function showIsometricWindow(svgContent) {
    if (window.isometricGenerator.isWindowOpen) {
        closeIsometricWindow();
    }

    const labelPositions = {};
    const integratedContainer = document.getElementById('integratedIsometric');
    if (integratedContainer) {
        const labels = integratedContainer.querySelectorAll('[data-label-id]');
        labels.forEach(label => {
            const labelId = label.getAttribute('data-label-id');
            const transform = label.getAttribute('transform') || 'translate(0,0)';
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match && labelId) {
                labelPositions[labelId] = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
            }
        });
    }

    const windowDiv = document.createElement('div');
    windowDiv.id = 'isometricWindow';
    windowDiv.className = 'isometric-window';
    windowDiv.innerHTML = `
        <div class="isometric-header">
            <div class="isometric-title"><span>🎯 Vista Isométrica Profesional</span></div>
            <div class="isometric-controls">
                <div class="scale-controls">
                    <button class="scale-btn" onclick="adjustIsometricScale(-0.2)">🔍-</button>
                    <span class="scale-display" id="scaleDisplay">100%</span>
                    <button class="scale-btn" onclick="adjustIsometricScale(0.2)">🔍+</button>
                </div>
                <div class="text-controls">
                    <button class="text-btn" onclick="adjustTextScale(-0.2)">T-</button>
                    <span class="text-display" id="textDisplay">100%</span>
                    <button class="text-btn" onclick="adjustTextScale(0.2)">T+</button>
                </div>
                <button class="isometric-btn" onclick="toggleIsometricIntegration()" id="integrationBtn">📌 Integrar</button>
                <button class="isometric-btn" onclick="exportIsometricSVG()">💾 Exportar</button>
                <button class="isometric-btn minimize" onclick="minimizeIsometricWindow()">➖</button>
                <button class="isometric-btn close" onclick="closeIsometricWindow()">❌</button>
            </div>
        </div>
        <div class="isometric-content" id="isometricContent">${svgContent}</div>
        <div class="isometric-resize-handle" onmousedown="startResizeIsometric(event)"></div>
    `;
    document.body.appendChild(windowDiv);
    
    setTimeout(() => {
        const svgElement = windowDiv.querySelector('#isometricSVG');
        if (svgElement) {
            window.isometricGenerator.setupLabelManipulation(svgElement);
            Object.keys(labelPositions).forEach(labelId => {
                const label = svgElement.querySelector(`[data-label-id="${labelId}"]`);
                const guideLine = svgElement.querySelector(`#guide-line-${labelId}`);
                if (label && labelPositions[labelId]) {
                    const pos = labelPositions[labelId];
                    label.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
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

function adjustIsometricScale(delta) {
    const generator = window.isometricGenerator;
    generator.currentScale = Math.max(generator.minScale, Math.min(generator.maxScale, generator.currentScale + delta));
    const scaleDisplay = document.getElementById('scaleDisplay');
    if (scaleDisplay) {
        scaleDisplay.textContent = `${Math.round(generator.currentScale * 100)}%`;
    }
    regenerateIsometric();
    showStatus(`Escala ajustada: ${Math.round(generator.currentScale * 100)}%`);
}

function adjustTextScale(delta) {
    const generator = window.isometricGenerator;
    generator.textScale = Math.max(0.5, Math.min(2.0, generator.textScale + delta));
    const textDisplay = document.getElementById('textDisplay');
    if (textDisplay) {
        textDisplay.textContent = `${Math.round(generator.textScale * 100)}%`;
    }
    regenerateIsometric();
    showStatus(`Texto ajustado: ${Math.round(generator.textScale * 100)}%`);
}

function toggleIsometricIntegration() {
    const generator = window.isometricGenerator;
    const integrationBtn = document.getElementById('integrationBtn');
    if (generator.isIntegrated) {
        showIsometricWindow(generator.currentSVG);
        generator.isIntegrated = false;
        integrationBtn.textContent = '📌 Integrar';
        showStatus('Isométrico en ventana flotante');
    } else {
        integrateIsometricIntoDrawing();
        generator.isIntegrated = true;
        integrationBtn.textContent = '🪟 Flotante';
        showStatus('Isométrico integrado en el plano');
    }
}

function integrateIsometricIntoDrawing() {
    const drawingBoard = document.getElementById('drawingBoard');
    const generator = window.isometricGenerator;
    
    const labelPositions = {};
    const labels = document.querySelectorAll('[data-label-id]');
    labels.forEach(label => {
        const labelId = label.getAttribute('data-label-id');
        const transform = label.getAttribute('transform') || 'translate(0,0)';
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        if (match && labelId) {
            labelPositions[labelId] = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
        }
    });
    
    let integratedContainer = document.getElementById('integratedIsometric');
    if (integratedContainer) integratedContainer.remove();
    
    integratedContainer = document.createElement('div');
    integratedContainer.id = 'integratedIsometric';
    integratedContainer.className = 'integrated-isometric';
    integratedContainer.setAttribute('data-locked', 'false');
    
    integratedContainer.style.cssText = `
        position: absolute;
        top: 50px;
        right: 50px;
        width: 350px;
        height: 250px;
        background: transparent;
        border: none;
        overflow: visible;
        z-index: 100;
        cursor: move;
        transition: box-shadow 0.3s ease;
    `;
    
    const svgContainer = document.createElement('div');
    svgContainer.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: transparent;
        border: none;
        transition: all 0.3s ease;
    `;
    svgContainer.innerHTML = generator.currentSVG;
    
    const controls = document.createElement('div');
    controls.style.cssText = `
        position: absolute;
        top: -30px;
        right: 0;
        display: none;
        gap: 4px;
        background: rgba(0, 0, 0, 0.8);
        padding: 4px 8px;
        border-radius: 6px;
        z-index: 101;
    `;
    controls.innerHTML = `
        <button onclick="toggleLockIntegratedIsometric()" id="lockIsometricBtn" title="Fijar posición" style="background: transparent; border: 1px solid #fff; color: #fff; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px; font-weight: bold;">🔓</button>
        <button onclick="resizeIntegratedIsometric('smaller')" style="background: transparent; border: 1px solid #fff; color: #fff; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px; font-weight: bold;">-</button>
        <button onclick="resizeIntegratedIsometric('bigger')" style="background: transparent; border: 1px solid #fff; color: #fff; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px; font-weight: bold;">+</button>
        <button onclick="removeIntegratedIsometric()" style="background: #ff4444; border: none; color: #fff; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px; font-weight: bold;">×</button>
    `;
    
    const dragHandle = document.createElement('div');
    dragHandle.id = 'isometricDragHandle';
    dragHandle.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: move;
        z-index: 99;
    `;
    
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'isometricResizeHandle';
    resizeHandle.style.cssText = `
        position: absolute;
        bottom: -5px;
        right: -5px;
        width: 20px;
        height: 20px;
        background: rgba(0, 212, 255, 0.6);
        border-radius: 50%;
        cursor: nwse-resize;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 102;
    `;
    
    integratedContainer.appendChild(svgContainer);
    integratedContainer.appendChild(controls);
    integratedContainer.appendChild(dragHandle);
    integratedContainer.appendChild(resizeHandle);
    drawingBoard.appendChild(integratedContainer);
    
    integratedContainer.addEventListener('mouseenter', () => {
        controls.style.display = 'flex';
        const isLocked = integratedContainer.getAttribute('data-locked') === 'true';
        if (!isLocked) {
            resizeHandle.style.opacity = '1';
        }
        svgContainer.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.2)';
        svgContainer.style.border = '1px dashed rgba(0, 212, 255, 0.4)';
    });
    
    integratedContainer.addEventListener('mouseleave', () => {
        controls.style.display = 'none';
        resizeHandle.style.opacity = '0';
        svgContainer.style.boxShadow = 'none';
        svgContainer.style.border = 'none';
    });
    
    makeIntegratedIsometricDraggable(integratedContainer, dragHandle);
    makeIntegratedIsometricResizable(integratedContainer, resizeHandle);
    
    closeIsometricWindow();
    
    setTimeout(() => {
        const svgElement = svgContainer.querySelector('#isometricSVG');
        if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';
            svgElement.style.width = 'auto';
            svgElement.style.height = 'auto';
            
            generator.setupLabelManipulation(svgElement);
            
            Object.keys(labelPositions).forEach(labelId => {
                const label = svgElement.querySelector(`[data-label-id="${labelId}"]`);
                const guideLine = svgElement.querySelector(`#guide-line-${labelId}`);
                if (label && labelPositions[labelId]) {
                    const pos = labelPositions[labelId];
                    label.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                    if (guideLine) {
                        guideLine.setAttribute('x2', pos.x);
                        guideLine.setAttribute('y2', pos.y);
                    }
                }
            });
        }
    }, 100);
}

function toggleLockIntegratedIsometric() {
    const container = document.getElementById('integratedIsometric');
    const lockBtn = document.getElementById('lockIsometricBtn');
    const dragHandle = document.getElementById('isometricDragHandle');
    const resizeHandle = document.getElementById('isometricResizeHandle');
    
    if (!container || !lockBtn) return;
    
    const isLocked = container.getAttribute('data-locked') === 'true';
    
    if (isLocked) {
        // Desbloquear
        container.setAttribute('data-locked', 'false');
        lockBtn.textContent = '🔓';
        lockBtn.title = 'Fijar posición';
        container.style.cursor = 'move';
        dragHandle.style.pointerEvents = 'auto';
        resizeHandle.style.pointerEvents = 'auto';
        showStatus('Isométrico desbloqueado - puede moverse');
    } else {
        // Bloquear
        container.setAttribute('data-locked', 'true');
        lockBtn.textContent = '🔒';
        lockBtn.title = 'Desbloquear posición';
        container.style.cursor = 'default';
        dragHandle.style.pointerEvents = 'none';
        resizeHandle.style.pointerEvents = 'none';
        resizeHandle.style.opacity = '0';
        showStatus('Isométrico bloqueado en posición');
    }
}

function makeIntegratedIsometricDraggable(container, handle) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    handle.addEventListener('mousedown', function(e) {
        const isLocked = container.getAttribute('data-locked') === 'true';
        if (isLocked || e.target.tagName === 'BUTTON') return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = container.getBoundingClientRect();
        const boardRect = container.parentElement.getBoundingClientRect();
        startLeft = rect.left - boardRect.left;
        startTop = rect.top - boardRect.top;
        
        container.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
        
        function handleMouseMove(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            const boardRect = container.parentElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            newLeft = Math.max(0, Math.min(newLeft, boardRect.width - containerRect.width));
            newTop = Math.max(0, Math.min(newTop, boardRect.height - containerRect.height));
            
            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
            container.style.right = 'auto';
        }
        
        function handleMouseUp() {
            isDragging = false;
            container.style.cursor = 'move';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

function makeIntegratedIsometricResizable(container, handle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    handle.addEventListener('mousedown', function(e) {
        const isLocked = container.getAttribute('data-locked') === 'true';
        if (isLocked) return;
        
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(container.style.width);
        startHeight = parseInt(container.style.height);
        
        e.preventDefault();
        e.stopPropagation();
        
        function handleMouseMove(e) {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(150, Math.min(800, startWidth + deltaX));
            const newHeight = Math.max(100, Math.min(600, startHeight + deltaY));
            
            container.style.width = newWidth + 'px';
            container.style.height = newHeight + 'px';
        }
        
        function handleMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

// Función para redimensionar el isométrico integrado con botones
function resizeIntegratedIsometric(action) {
    const container = document.getElementById('integratedIsometric');
    if (!container) return;
    
    const currentWidth = parseInt(container.style.width);
    const currentHeight = parseInt(container.style.height);
    
    if (action === 'bigger') {
        container.style.width = Math.min(800, currentWidth + 50) + 'px';
        container.style.height = Math.min(600, currentHeight + 50) + 'px';
    } else if (action === 'smaller') {
        container.style.width = Math.max(150, currentWidth - 50) + 'px';
        container.style.height = Math.max(100, currentHeight - 50) + 'px';
    }
}

// Función para eliminar el isométrico integrado
function removeIntegratedIsometric() {
    const container = document.getElementById('integratedIsometric');
    if (container) {
        container.remove();
        window.isometricGenerator.isIntegrated = false;
        showStatus('Isométrico removido del plano');
    }
}

function regenerateIsometric() {
    const currentPlan = plans[currentPlanIndex];
    const generator = window.isometricGenerator;
    try {
        const labelPositions = {};
        const labels = document.querySelectorAll('[data-label-id]');
        labels.forEach(label => {
            const labelId = label.getAttribute('data-label-id');
            const transform = label.getAttribute('transform') || 'translate(0,0)';
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match && labelId) {
                labelPositions[labelId] = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
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
                        Object.keys(labelPositions).forEach(labelId => {
                            const label = svgElement.querySelector(`[data-label-id="${labelId}"]`);
                            const guideLine = svgElement.querySelector(`#guide-line-${labelId}`);
                            if (label && labelPositions[labelId]) {
                                const pos = labelPositions[labelId];
                                label.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
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
        showStatus('Error actualizando isométrico');
    }
}

function closeIsometricWindow() {
    const window_elem = document.getElementById('isometricWindow');
    if (window_elem) window_elem.remove();
    window.isometricGenerator.isWindowOpen = false;
    window.isometricGenerator.windowElement = null;
}

function minimizeIsometricWindow() {
    const window_elem = document.getElementById('isometricWindow');
    if (window_elem) window_elem.classList.toggle('minimized');
}

function exportIsometricSVG() {
    if (!window.isometricGenerator.currentSVG) {
        showStatus('No hay contenido para exportar');
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
    showStatus('Isométrico exportado');
}

function makeIsometricWindowDraggable(windowDiv) {
    const header = windowDiv.querySelector('.isometric-header');
    let isDragging = false, startX, startY, startLeft, startTop;
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
            windowDiv.style.left = (startLeft + e.clientX - startX) + 'px';
            windowDiv.style.top = (startTop + e.clientY - startY) + 'px';
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
    const startX = e.clientX, startY = e.clientY;
    const startWidth = parseInt(document.defaultView.getComputedStyle(windowDiv).width, 10);
    const startHeight = parseInt(document.defaultView.getComputedStyle(windowDiv).height, 10);
    function handleMouseMove(e) {
        windowDiv.style.width = Math.max(500, startWidth + e.clientX - startX) + 'px';
        windowDiv.style.height = Math.max(400, startHeight + e.clientY - startY) + 'px';
    }
    function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

console.log('Motor Isométrico PROFESIONAL OPTIMIZADO cargado');
document.addEventListener('DOMContentLoaded', function() {
    console.log('Motor Isométrico iniciado correctamente');
});
