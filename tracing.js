// ================================
// FUNCIONES DE TRAZADO INTELIGENTE CON SELECCIÓN RECTANGULAR
// ================================

// 🆕 VARIABLES PARA SELECCIÓN RECTANGULAR
let isRectangularSelecting = false;
let selectionStartPoint = { x: 0, y: 0 };
let selectionCurrentPoint = { x: 0, y: 0 };
let selectionRectangle = null;
let selectedElements = new Set(); // Para múltiples elementos seleccionados

function setupTracingEvents() {
    const tracingSvg = document.getElementById('tracingSvg');
    
    if (!tracingSvg) {
        console.warn('TracingSvg element not found, retrying...');
        setTimeout(setupTracingEvents, 100);
        return;
    }
    
    tracingSvg.addEventListener('click', handleTracingClick);
    tracingSvg.addEventListener('wheel', handleTracingZoom, { passive: false });
    tracingSvg.addEventListener('mousedown', handleTracingPanStart);
    tracingSvg.addEventListener('mousemove', handleTracingPanMove);
    tracingSvg.addEventListener('mouseup', handleTracingPanEnd);
    tracingSvg.addEventListener('mouseleave', handleTracingPanEnd);
    
    console.log('Tracing events setup completed');
}

// 🔧 FUNCIÓN DEFINITIVA: FUERZA VIEWBOX CORRECTO SIEMPRE
function forceCorrectViewBox() {
    const tracingSvg = document.getElementById('tracingSvg');
    const currentFormat = plans[currentPlanIndex].format;
    const formatData = formats[currentFormat];
    
    // FORZAR viewBox correcto SIEMPRE
    tracingSvg.setAttribute('viewBox', `0 0 ${formatData.width} ${formatData.height}`);
    
    // FORZAR currentViewBox sincronizado SIEMPRE
    currentViewBox = { 
        x: 0, 
        y: 0, 
        width: formatData.width, 
        height: formatData.height 
    };
    
    return { width: formatData.width, height: formatData.height };
}

function toggleMode() {
    const currentPlan = plans[currentPlanIndex];
    currentPlan.tracingMode = !currentPlan.tracingMode;
    isNavigationMode = currentPlan.tracingMode;
    
    const modeButton = document.getElementById('modeToggle');
    const drawingBoard = document.getElementById('drawingBoard');
    
    if (isNavigationMode) {
        modeButton.textContent = '🔍 Navegación';
        modeButton.classList.add('navigation');
        drawingBoard.classList.add('navigation-mode');
        
        // Deseleccionar herramientas
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        currentPlan.currentTool = null;
        
        // Deseleccionar elementos
        deselectAllElements();
        
        showStatus('🔍 Modo Navegación: Usa rueda para zoom, clic y arrastra para pan');
    } else {
        modeButton.textContent = '🖱️ Edición';
        modeButton.classList.remove('navigation');
        drawingBoard.classList.remove('navigation-mode');
        
        // 🔧 CORRECCIÓN DEFINITIVA: FORZAR viewBox correcto
        zoomLevel = 1;
        forceCorrectViewBox();
        updateTracingViewBox();
        updateTracingElementSizes();
        
        showStatus('✏️ Modo Edición: Selecciona herramientas, elementos individuales o arrastra para selección rectangular');
    }
}

function selectScale(scale) {
    document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('active'));
    
    const scaleValue = scale.replace('1:', '');
    const clickedButton = document.querySelector(`[data-scale="${scaleValue}"]`);
    
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    const currentPlan = plans[currentPlanIndex];
    currentPlan.tracingScale = parseInt(scaleValue);
    
    showStatus(`📐 Escala cambiada a ${scale}`);
}

function selectTool(tool) {
    if (isNavigationMode) {
        showStatus('⚠️ Cambia a modo Edición para seleccionar herramientas');
        return;
    }
    
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const currentPlan = plans[currentPlanIndex];
    
    // Herramientas especiales que abren modales
    if (tool === 'texto') {
        showTextModal();
        return;
    }
    
    if (tool === 'rosa-norte') {
        createNorthRose();
        return;
    }
    
    currentPlan.currentTool = tool;
    
    let info = `🔧 ${tool.toUpperCase()} seleccionado`;
    if (NORMATIVA_DESCARGAS[tool]) {
        info += ` - PVC ⌀${NORMATIVA_DESCARGAS[tool].tuberia_diametro}mm`;
    }
    
    showStatus(info);
}

// 🔧 FUNCIÓN DEFINITIVA: ROBUSTA AL 100% CON SELECCIÓN RECTANGULAR
function handleTracingClick(e) {
    if (isNavigationMode) return;
    
    const currentPlan = plans[currentPlanIndex];
    
    // Verificar si se hizo click en una etiqueta movible - BLOQUEAR COMPLETAMENTE
    const clickedLabel = e.target.closest('.movable-label');
    if (clickedLabel) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
    }
    
    // Verificar si se hizo click en un elemento existente para seleccionarlo
    const clickedElement = e.target.closest('g[id^="tracing-element-"]');
    
    if (clickedElement) {
        // 🆕 SELECCIÓN CON CTRL para múltiples elementos
        if (e.ctrlKey || e.metaKey) {
            toggleElementSelection(clickedElement);
        } else {
            // Selección individual (deseleccionar otros)
            clearSelection();
            selectTracingElement(clickedElement);
        }
        e.stopPropagation();
        return;
    }
    
    // 🆕 Si no hay herramienta seleccionada, iniciar selección rectangular
    if (!currentPlan.currentTool) {
        startRectangularSelection(e);
        return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // 🔧 PASO 1: FORZAR VIEWBOX CORRECTO ANTES DE CUALQUIER CONVERSIÓN
    const areaData = forceCorrectViewBox();
    
    // 🔧 PASO 2: CONVERSIÓN DE COORDENADAS 100% PRECISA
    const tracingSvg = document.getElementById('tracingSvg');
    
    // Crear un punto SVG para conversión exacta
    const pt = tracingSvg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    // Obtener la matriz de transformación actual del SVG
    const svgMatrix = tracingSvg.getScreenCTM().inverse();
    
    // Convertir las coordenadas de pantalla a coordenadas SVG EXACTAS
    const svgPoint = pt.matrixTransform(svgMatrix);
    
    // 🔧 PASO 3: VALIDACIÓN CONTRA ÁREA REAL (NO viewBox)
    if (svgPoint.x >= 0 && svgPoint.x <= areaData.width && 
        svgPoint.y >= 0 && svgPoint.y <= areaData.height) {
        
        addTracingElement(currentPlan.currentTool, svgPoint.x, svgPoint.y);
        showStatus(`✅ ${currentPlan.currentTool.toUpperCase()} colocado en (${Math.round(svgPoint.x)}, ${Math.round(svgPoint.y)}) px - ÁREA COMPLETA`);
    } else {
        showStatus(`⚠️ Fuera del área (${Math.round(svgPoint.x)}, ${Math.round(svgPoint.y)}) - Área válida: ${areaData.width}×${areaData.height}px`);
    }
}

// 🆕 NUEVA FUNCIÓN: Iniciar selección rectangular
function startRectangularSelection(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // No iniciar selección si ya hay una en curso
    if (isRectangularSelecting) return;
    
    const tracingSvg = document.getElementById('tracingSvg');
    const svgPoint = screenToSVGCoords(e.clientX, e.clientY);
    
    isRectangularSelecting = true;
    selectionStartPoint = { x: svgPoint.x, y: svgPoint.y };
    selectionCurrentPoint = { x: svgPoint.x, y: svgPoint.y };
    
    // Crear rectángulo de selección temporal
    createSelectionRectangle();
    
    // Event listeners temporales para la selección
    const handleMouseMove = (e) => updateRectangularSelection(e);
    const handleMouseUp = (e) => finishRectangularSelection(e, handleMouseMove, handleMouseUp);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    showStatus('🔲 Selección rectangular: Izq→Der = Window (azul), Der←Izq = Crossing (verde)');
}

// 🆕 NUEVA FUNCIÓN: Actualizar selección rectangular
function updateRectangularSelection(e) {
    if (!isRectangularSelecting) return;
    
    const svgPoint = screenToSVGCoords(e.clientX, e.clientY);
    selectionCurrentPoint = { x: svgPoint.x, y: svgPoint.y };
    
    updateSelectionRectangle();
}

// 🆕 NUEVA FUNCIÓN: Finalizar selección rectangular
function finishRectangularSelection(e, mouseMoveHandler, mouseUpHandler) {
    if (!isRectangularSelecting) return;
    
    // Limpiar event listeners temporales
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    
    // Calcular rectángulo final
    const rect = getSelectionRectangle();
    
    // Determinar tipo de selección basado en dirección
    const isWindowSelection = selectionCurrentPoint.x > selectionStartPoint.x;
    
    // Seleccionar elementos
    if (rect.width > 5 && rect.height > 5) { // Mínimo tamaño para evitar clicks accidentales
        selectElementsInRectangle(rect, isWindowSelection);
        
        const selectionType = isWindowSelection ? 'Window (completos)' : 'Crossing (tocando)';
        const selectedCount = selectedElements.size;
        showStatus(`✅ Selección ${selectionType}: ${selectedCount} elemento(s) seleccionado(s)`);
    }
    
    // Limpiar
    removeSelectionRectangle();
    isRectangularSelecting = false;
}

// 🆕 NUEVA FUNCIÓN: Crear rectángulo de selección visual
function createSelectionRectangle() {
    const tracingSvg = document.getElementById('tracingSvg');
    
    selectionRectangle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selectionRectangle.setAttribute('id', 'selection-rectangle');
    selectionRectangle.setAttribute('fill', 'rgba(52, 152, 219, 0.1)'); // Azul por defecto
    selectionRectangle.setAttribute('stroke', '#3498db');
    selectionRectangle.setAttribute('stroke-width', '2');
    selectionRectangle.setAttribute('stroke-dasharray', '5,5');
    selectionRectangle.style.pointerEvents = 'none';
    
    tracingSvg.appendChild(selectionRectangle);
}

// 🆕 NUEVA FUNCIÓN: Actualizar rectángulo de selección visual
function updateSelectionRectangle() {
    if (!selectionRectangle) return;
    
    const rect = getSelectionRectangle();
    const isWindowSelection = selectionCurrentPoint.x > selectionStartPoint.x;
    
    // Actualizar posición y tamaño
    selectionRectangle.setAttribute('x', rect.x);
    selectionRectangle.setAttribute('y', rect.y);
    selectionRectangle.setAttribute('width', rect.width);
    selectionRectangle.setAttribute('height', rect.height);
    
    // Cambiar color según dirección
    if (isWindowSelection) {
        // Window Selection: Azul
        selectionRectangle.setAttribute('fill', 'rgba(52, 152, 219, 0.15)');
        selectionRectangle.setAttribute('stroke', '#3498db');
    } else {
        // Crossing Selection: Verde
        selectionRectangle.setAttribute('fill', 'rgba(39, 174, 96, 0.15)');
        selectionRectangle.setAttribute('stroke', '#27ae60');
    }
}

// 🆕 NUEVA FUNCIÓN: Obtener rectángulo de selección normalizado
function getSelectionRectangle() {
    const x1 = selectionStartPoint.x;
    const y1 = selectionStartPoint.y;
    const x2 = selectionCurrentPoint.x;
    const y2 = selectionCurrentPoint.y;
    
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
    };
}

// 🆕 NUEVA FUNCIÓN: Remover rectángulo de selección
function removeSelectionRectangle() {
    if (selectionRectangle) {
        selectionRectangle.remove();
        selectionRectangle = null;
    }
}

// 🆕 NUEVA FUNCIÓN: Seleccionar elementos en rectángulo
function selectElementsInRectangle(rect, isWindowSelection) {
    const currentPlan = plans[currentPlanIndex];
    
    // Limpiar selección anterior si no se mantiene Ctrl
    if (!event || (!event.ctrlKey && !event.metaKey)) {
        clearSelection();
    }
    
    // Evaluar cada elemento
    currentPlan.tracingElements.forEach(element => {
        const elementGroup = document.querySelector(`#tracing-element-${element.id}`);
        if (!elementGroup) return;
        
        // Obtener bounds del elemento (círculo)
        const circle = elementGroup.querySelector('circle');
        if (!circle) return;
        
        const elementBounds = {
            x: parseFloat(circle.getAttribute('cx')) - parseFloat(circle.getAttribute('r')),
            y: parseFloat(circle.getAttribute('cy')) - parseFloat(circle.getAttribute('r')),
            width: parseFloat(circle.getAttribute('r')) * 2,
            height: parseFloat(circle.getAttribute('r')) * 2,
            centerX: parseFloat(circle.getAttribute('cx')),
            centerY: parseFloat(circle.getAttribute('cy')),
            radius: parseFloat(circle.getAttribute('r'))
        };
        
        let shouldSelect = false;
        
        if (isWindowSelection) {
            // 🔷 Window Selection: Solo elementos completamente dentro
            shouldSelect = (
                elementBounds.x >= rect.x &&
                elementBounds.y >= rect.y &&
                elementBounds.x + elementBounds.width <= rect.x + rect.width &&
                elementBounds.y + elementBounds.height <= rect.y + rect.height
            );
        } else {
            // 🔷 Crossing Selection: Elementos dentro o tocando (intersección)
            shouldSelect = rectangleCircleIntersect(rect, elementBounds);
        }
        
        if (shouldSelect) {
            selectTracingElement(elementGroup, true); // true = mantener selección múltiple
        }
    });
}

// 🆕 NUEVA FUNCIÓN: Detectar intersección rectángulo-círculo
function rectangleCircleIntersect(rect, circleBounds) {
    const cx = circleBounds.centerX;
    const cy = circleBounds.centerY;
    const r = circleBounds.radius;
    
    // Encontrar el punto más cercano del rectángulo al centro del círculo
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
    
    // Calcular distancia del centro del círculo al punto más cercano
    const distanceX = cx - closestX;
    const distanceY = cy - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    // Intersecta si la distancia es menor o igual al radio
    return distanceSquared <= (r * r);
}

// 🆕 NUEVA FUNCIÓN: Alternar selección de elemento individual
function toggleElementSelection(elementGroup) {
    const elementId = elementGroup.id;
    
    if (selectedElements.has(elementId)) {
        // Deseleccionar
        removeElementFromSelection(elementGroup);
    } else {
        // Seleccionar
        selectTracingElement(elementGroup, true);
    }
}

// 🆕 NUEVA FUNCIÓN: Remover elemento de selección
function removeElementFromSelection(elementGroup) {
    const elementId = elementGroup.id;
    
    selectedElements.delete(elementId);
    elementGroup.classList.remove('selected');
    
    const circle = elementGroup.querySelector('circle');
    if (circle) {
        circle.style.stroke = '#f9fafb';
        circle.style.strokeWidth = BASE_STROKE_WIDTH.element.toString();
        circle.style.filter = 'none';
    }
}

// 🔧 FUNCIÓN EXPANDIDA: selectTracingElement con soporte múltiple
function selectTracingElement(elementGroup, keepMultipleSelection = false) {
    const currentPlan = plans[currentPlanIndex];
    const elementId = elementGroup.id;
    
    // Si no se mantiene selección múltiple, limpiar selección anterior
    if (!keepMultipleSelection) {
        clearSelection();
    }
    
    // Agregar a selección
    selectedElements.add(elementId);
    elementGroup.classList.add('selected');
    
    // Aplicar efecto visual de selección
    const circle = elementGroup.querySelector('circle');
    if (circle) {
        circle.style.stroke = '#fbbf24';
        circle.style.strokeWidth = '3';
        circle.style.filter = 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))';
    }
    
    // Actualizar selección en el plan (para compatibilidad)
    currentPlan.selectedElement = elementId;
    
    const count = selectedElements.size;
    if (count === 1) {
        showStatus('✅ Elemento seleccionado. Presiona SUPRIMIR para eliminar');
    } else {
        showStatus(`✅ ${count} elementos seleccionados. Presiona SUPRIMIR para eliminar todos`);
    }
}

// 🆕 NUEVA FUNCIÓN: Limpiar todas las selecciones
function clearSelection() {
    selectedElements.forEach(elementId => {
        const elementGroup = document.getElementById(elementId);
        if (elementGroup) {
            removeElementFromSelection(elementGroup);
        }
    });
    selectedElements.clear();
    
    const currentPlan = plans[currentPlanIndex];
    currentPlan.selectedElement = null;
}

// 🔧 FUNCIÓN AUXILIAR ROBUSTA
function screenToSVGCoords(screenX, screenY) {
    const tracingSvg = document.getElementById('tracingSvg');
    if (!tracingSvg) return { x: 0, y: 0 };
    
    try {
        // FORZAR viewBox correcto antes de conversión
        forceCorrectViewBox();
        
        // Usar el mismo método preciso que handleTracingClick
        const pt = tracingSvg.createSVGPoint();
        pt.x = screenX;
        pt.y = screenY;
        
        const svgMatrix = tracingSvg.getScreenCTM().inverse();
        const svgPoint = pt.matrixTransform(svgMatrix);
        
        return { x: svgPoint.x, y: svgPoint.y };
    } catch (error) {
        console.warn('Error converting coordinates:', error);
        return { x: screenX, y: screenY };
    }
}

function addTracingElement(type, x, y) {
    const currentPlan = plans[currentPlanIndex];
    elementCounter++;
    
    let elementData;
    if (NORMATIVA_DESCARGAS[type]) {
        elementData = {
            id: elementCounter,
            type: type,
            x: x,
            y: y,
            symbol: NORMATIVA_DESCARGAS[type].symbol,
            categoria: 'sanitario',
            tuberia_diametro: NORMATIVA_DESCARGAS[type].tuberia_diametro,
            color: NORMATIVA_DESCARGAS[type].color
        };
    } else if (INFRAESTRUCTURA_SYMBOLS[type]) {
        elementData = {
            id: elementCounter,
            type: type,
            x: x,
            y: y,
            symbol: INFRAESTRUCTURA_SYMBOLS[type].symbol,
            categoria: 'infraestructura',
            color: INFRAESTRUCTURA_SYMBOLS[type].color
        };
        
        if (type === 'camara-inspeccion') {
            camaraCounter++;
            elementData.numeroCamera = camaraCounter;
            elementData.etiqueta = `C.I DOM N°${camaraCounter}`;
        } else if (type === 'camara-publica') {
            elementData.etiqueta = 'CAMARA PUBLICA';
        }
    }

    currentPlan.tracingElements.push(elementData);
    createTracingSVGElement(elementData);
    
    showStatus(`✅ ${type.toUpperCase()} agregado en (${Math.round(x)}px, ${Math.round(y)}px)`);
}

function createTracingSVGElement(element) {
    const tracingSvg = document.getElementById('tracingSvg');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', `tracing-element-${element.id}`);
    g.setAttribute('class', `element-${element.type}`);
    g.style.cursor = 'pointer';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', element.x);
    circle.setAttribute('cy', element.y);
    
    const radius = element.categoria === 'infraestructura' ? BASE_CIRCLE_RADIUS.infraestructura : BASE_CIRCLE_RADIUS.sanitario;
    circle.setAttribute('r', radius);
    
    // 🔧 CORRECCIÓN: Cámaras solo con círculo negro sin relleno
    if (element.type === 'camara-inspeccion' || element.type === 'camara-publica') {
        circle.setAttribute('fill', 'none');           // Sin relleno
        circle.setAttribute('stroke', '#000000');      // Línea negra
        circle.setAttribute('stroke-width', '2');      // Línea más gruesa para visibilidad
    } else {
        // Sanitarios mantienen su color original
        circle.setAttribute('fill', element.color);
        circle.setAttribute('stroke', '#f9fafb');
        circle.setAttribute('stroke-width', BASE_STROKE_WIDTH.element);
    }
    
    circle.setAttribute('class', 'connection-point');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', element.x);
    text.setAttribute('y', element.y + 3);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', radius > 10 ? BASE_FONT_SIZE.elementLarge : BASE_FONT_SIZE.element);
    
    // 🔧 CORRECCIÓN: Texto de cámaras en negro para mejor contraste
    if (element.type === 'camara-inspeccion' || element.type === 'camara-publica') {
        text.setAttribute('fill', '#000000');          // Texto negro
        text.setAttribute('font-weight', 'bold');
    } else {
        text.setAttribute('fill', '#f9fafb');          // Texto blanco para sanitarios
        text.setAttribute('font-weight', 'bold');
    }
    
    text.textContent = element.symbol;
    text.style.pointerEvents = 'none';

    g.appendChild(circle);
    g.appendChild(text);
    
    // Agregar etiqueta para cámaras (más pequeña)
    if (element.etiqueta) {
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', element.x);
        labelText.setAttribute('y', element.y - 20);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('font-size', '8');
        labelText.setAttribute('font-weight', 'bold');
        labelText.setAttribute('fill', element.type === 'camara-publica' ? '#000000' : '#000000'); // Ambas en negro
        labelText.setAttribute('stroke', 'none'); // Sin borde en texto
        labelText.textContent = element.etiqueta;
        labelText.style.pointerEvents = 'none';
        
        g.appendChild(labelText);
    }
    
    tracingSvg.appendChild(g);
    
    // Aplicar zoom actual
    updateTracingElementSizes();
}

function generateTracing() {
    const currentPlan = plans[currentPlanIndex];
    
    if (currentPlan.tracingElements.length < 2) {
        showStatus('⚠️ Necesitas al menos 2 elementos para generar trazado');
        return;
    }

    // Usar el nuevo sistema jerárquico RIDAA
    generateIntelligentHierarchicalTracing();
}

function createTracingConnection(desde, hacia) {
    const currentPlan = plans[currentPlanIndex];
    const tracingSvg = document.getElementById('tracingSvg');
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', desde.x);
    line.setAttribute('y1', desde.y);
    line.setAttribute('x2', hacia.x);
    line.setAttribute('y2', hacia.y);
    line.setAttribute('stroke', '#ef4444');
    line.setAttribute('stroke-width', '4');
    line.setAttribute('class', 'pipe-line');
    line.setAttribute('data-from', desde.id);
    line.setAttribute('data-to', hacia.id);

    tracingSvg.appendChild(line);

    // Crear flecha direccional
    createTracingArrow(desde, hacia);

    const distanceMillimeters = calcularDistancia(desde, hacia);
    const distanceMeters = convertMillimetersToRealMeters(distanceMillimeters, currentPlan.tracingScale);

    // Obtener diámetro de tubería según el elemento origen
    const diameter = desde.tuberia_diametro || 110;

    // AGREGAR ETIQUETA DE CAÑERÍA con diámetro, longitud y material
    createPipeLabel(desde, hacia, diameter, distanceMeters);

    currentPlan.tracingConnections.push({
        from: desde,
        to: hacia,
        distance: distanceMeters,
        diameter: diameter
    });

    // Aplicar zoom actual
    updateTracingElementSizes();
}

function createPipeLabel(desde, hacia, diameter, lengthMeters) {
    const tracingSvg = document.getElementById('tracingSvg');
    
    // Calcular punto medio de la línea (punto fijo)
    const midX = (desde.x + hacia.x) / 2;
    const midY = (desde.y + hacia.y) / 2;
    
    // Posición inicial de la etiqueta (desplazada del punto medio)
    const labelX = midX + 30;
    const labelY = midY - 20;
    
    // ID único para esta conexión
    const connectionId = `${desde.id}-${hacia.id}`;
    
    // Crear grupo para toda la etiqueta (línea guía + texto)
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('class', 'pipe-label-group');
    labelGroup.setAttribute('data-connection', connectionId);
    
    // Crear línea guía (NO movible, siempre apunta al punto medio de la tubería)
    const guideLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    guideLine.setAttribute('id', `guide-line-${connectionId}`);
    guideLine.setAttribute('x1', midX);
    guideLine.setAttribute('y1', midY);
    guideLine.setAttribute('x2', labelX);
    guideLine.setAttribute('y2', labelY);
    guideLine.setAttribute('stroke', '#000000');
    guideLine.setAttribute('stroke-width', '1');
    guideLine.setAttribute('stroke-dasharray', '2,2');
    guideLine.setAttribute('class', 'guide-line');
    
    // Crear grupo movible para el contenedor de texto
    const movableGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    movableGroup.setAttribute('id', `movable-label-${connectionId}`);
    movableGroup.setAttribute('class', 'movable-label');
    movableGroup.setAttribute('transform', `translate(${labelX}, ${labelY})`);
    movableGroup.style.cursor = 'move';
    
    // Crear fondo blanco para la etiqueta (más simple)
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', -35);
    bg.setAttribute('y', -12);
    bg.setAttribute('width', '70');
    bg.setAttribute('height', '24');
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', '#000000');
    bg.setAttribute('stroke-width', '1');
    bg.setAttribute('rx', '2');
    
    // Crear texto línea 1: PVC ⌀110mm (TEXTO NEGRO SIN EFECTOS)
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    line1.setAttribute('x', 0);
    line1.setAttribute('y', -2);
    line1.setAttribute('text-anchor', 'middle');
    line1.setAttribute('font-size', '8');
    line1.setAttribute('font-weight', 'normal');
    line1.setAttribute('fill', '#000000'); // Negro simple
    line1.textContent = `PVC ⌀${diameter}mm`;
    line1.style.pointerEvents = 'none';
    
    // Crear texto línea 2: L=2.0m (TEXTO NEGRO SIN EFECTOS)
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    line2.setAttribute('x', 0);
    line2.setAttribute('y', 8);
    line2.setAttribute('text-anchor', 'middle');
    line2.setAttribute('font-size', '8');
    line2.setAttribute('font-weight', 'normal');
    line2.setAttribute('fill', '#000000'); // Negro simple
    line2.textContent = `L=${lengthMeters.toFixed(1)}m`;
    line2.style.pointerEvents = 'none';
    
    // Ensamblar el grupo movible
    movableGroup.appendChild(bg);
    movableGroup.appendChild(line1);
    movableGroup.appendChild(line2);
    
    // Ensamblar el grupo principal
    labelGroup.appendChild(guideLine);
    labelGroup.appendChild(movableGroup);
    
    // Agregar funcionalidad de arrastre SOLO al contenedor de texto
    setupLabelDrag(movableGroup, guideLine, midX, midY, connectionId);
    
    tracingSvg.appendChild(labelGroup);
}

// 🔧 FUNCIÓN DE ARRASTRE ROBUSTA
function setupLabelDrag(movableGroup, guideLine, fixedX, fixedY, connectionId) {
    let isDragging = false;
    let startMouse = { x: 0, y: 0 };
    let startTransform = { x: 0, y: 0 };

    // Función para obtener la transformación actual
    function getCurrentTransform() {
        const transform = movableGroup.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        if (match) {
            return {
                x: parseFloat(match[1]),
                y: parseFloat(match[2])
            };
        }
        return { x: 0, y: 0 };
    }

    // 🔧 FUNCIÓN ROBUSTA: Conversión precisa de coordenadas
    function getRelativeCoords(e) {
        const tracingSvg = document.getElementById('tracingSvg');
        
        // FORZAR viewBox correcto antes de conversión
        forceCorrectViewBox();
        
        // Usar el mismo método preciso que handleTracingClick
        const pt = tracingSvg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        
        const svgMatrix = tracingSvg.getScreenCTM().inverse();
        const svgPoint = pt.matrixTransform(svgMatrix);
        
        return { x: svgPoint.x, y: svgPoint.y };
    }

    // Función para actualizar la línea guía
    function updateGuideLine(newX, newY) {
        guideLine.setAttribute('x2', newX);
        guideLine.setAttribute('y2', newY);
    }

    // Evento mousedown en el contenedor de texto
    movableGroup.addEventListener('mousedown', function(e) {
        if (isNavigationMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        isDragging = true;
        
        const coords = getRelativeCoords(e);
        startMouse.x = coords.x;
        startMouse.y = coords.y;
        
        startTransform = getCurrentTransform();
        
        document.body.style.userSelect = 'none';
        movableGroup.style.opacity = '0.7';
    });

    // BLOQUEAR TODOS los eventos de click en las etiquetas
    movableGroup.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    // Eventos globales para el arrastre
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const coords = getRelativeCoords(e);
        const deltaX = coords.x - startMouse.x;
        const deltaY = coords.y - startMouse.y;
        
        const newX = startTransform.x + deltaX;
        const newY = startTransform.y + deltaY;
        
        // Actualizar posición del contenedor de texto
        movableGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
        
        // Actualizar línea guía para que siga apuntando al punto fijo
        updateGuideLine(newX, newY);
    }

    function handleMouseUp(e) {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            movableGroup.style.opacity = '1';
            showStatus('📍 Etiqueta reposicionada');
            
            // BLOQUEAR COMPLETAMENTE la propagación cuando se termina de mover etiqueta
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }

    // Agregar listeners globales para este label específico
    const mouseMoveHandler = handleMouseMove;
    const mouseUpHandler = handleMouseUp;
    
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    
    // Limpiar listeners cuando se elimine el elemento
    movableGroup.addEventListener('remove', function() {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    });
}

function createTracingArrow(desde, hacia) {
    const tracingSvg = document.getElementById('tracingSvg');
    const deltaX = hacia.x - desde.x;
    const deltaY = hacia.y - desde.y;
    
    const arrowX = desde.x + (deltaX * 0.75);
    const arrowY = desde.y + (deltaY * 0.75);
    
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    arrowGroup.setAttribute('class', 'flow-arrow');
    arrowGroup.setAttribute('data-connection', `${desde.id}-${hacia.id}`);
    
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', '0,-4 8,0 0,4');
    arrow.setAttribute('fill', '#ef4444');
    arrow.setAttribute('stroke', '#ffffff');
    arrow.setAttribute('stroke-width', '1');
    
    arrowGroup.setAttribute('transform', `translate(${arrowX}, ${arrowY}) rotate(${angle})`);
    arrowGroup.appendChild(arrow);
    tracingSvg.appendChild(arrowGroup);
}

function calcularDistancia(elemento1, elemento2) {
    return Math.sqrt(
        Math.pow(elemento2.x - elemento1.x, 2) + Math.pow(elemento2.y - elemento1.y, 2)
    );
}

// CORREGIDO: Función de conversión para milímetros
function convertMillimetersToRealMeters(distanceMillimeters, scale) {
    // Distancia en mm dividida por la escala da metros reales
    // Ejemplo: 100mm a escala 1:50 = 100 * 50 / 1000 = 5.0m reales
    return (distanceMillimeters * scale) / 1000;
}

function clearTracingConnections() {
    const tracingSvg = document.getElementById('tracingSvg');
    const lines = tracingSvg.querySelectorAll('.pipe-line');
    const arrows = tracingSvg.querySelectorAll('.flow-arrow');
    const labels = tracingSvg.querySelectorAll('.pipe-label-group'); // Actualizado
    
    lines.forEach(line => line.remove());
    arrows.forEach(arrow => arrow.remove());
    labels.forEach(label => label.remove());
}

function clearTracing() {
    const currentPlan = plans[currentPlanIndex];
    const tracingSvg = document.getElementById('tracingSvg');
    
    // Limpiar elementos
    const elements = tracingSvg.querySelectorAll('g[id^="tracing-element-"]');
    elements.forEach(element => element.remove());
    
    // Limpiar conexiones
    clearTracingConnections();
    
    // 🆕 Limpiar selección rectangular si está activa
    if (isRectangularSelecting) {
        removeSelectionRectangle();
        isRectangularSelecting = false;
    }
    
    // 🆕 Limpiar selecciones múltiples
    clearSelection();
    
    // Resetear datos
    currentPlan.tracingElements = [];
    currentPlan.tracingConnections = [];
    currentPlan.selectedElement = null;
    elementCounter = 0;
    camaraCounter = 0;
    
    // Deseleccionar herramientas
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    currentPlan.currentTool = null;
    
    showStatus('🗑️ Trazado limpiado');
}

// ================================
// FUNCIONES DE NAVEGACIÓN Y ZOOM - ROBUSTAS
// ================================

// 🔧 FUNCIÓN ZOOM ROBUSTA
function handleTracingZoom(e) {
    if (!isNavigationMode) return;
    
    // No aplicar zoom si se está manipulando una imagen
    const target = e.target;
    if (target.id === 'pdfBackground' || target.id === 'resizeHandle' || 
        target.closest('#pdfBackgroundGroup')) {
        return;
    }
    
    e.preventDefault();
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoomLevel = zoomLevel * zoomFactor;
    
    if (newZoomLevel < MIN_ZOOM || newZoomLevel > MAX_ZOOM) return;
    
    zoomLevel = newZoomLevel;
    
    const tracingSvg = document.getElementById('tracingSvg');
    const rect = tracingSvg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 🔧 FORZAR datos correctos antes de calcular zoom
    const areaData = forceCorrectViewBox();
    const newWidth = areaData.width / zoomLevel;
    const newHeight = areaData.height / zoomLevel;
    
    currentViewBox.x = (mouseX / rect.width) * areaData.width - (mouseX / rect.width) * newWidth;
    currentViewBox.y = (mouseY / rect.height) * areaData.height - (mouseY / rect.height) * newHeight;
    currentViewBox.width = newWidth;
    currentViewBox.height = newHeight;
    
    updateTracingViewBox();
    updateTracingElementSizes();
    
    showStatus(`🔍 Zoom: ${Math.round(zoomLevel * 100)}%`);
}

function handleTracingPanStart(e) {
    if (!isNavigationMode) return;
    
    // No iniciar pan si se está haciendo click en una imagen
    const target = e.target;
    if (target.id === 'pdfBackground' || target.id === 'resizeHandle' || 
        target.closest('#pdfBackgroundGroup')) {
        return;
    }
    
    isPanning = true;
    const rect = e.target.getBoundingClientRect();
    startPanPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function handleTracingPanMove(e) {
    if (!isNavigationMode || !isPanning) return;
    
    e.preventDefault();
    
    const rect = e.target.getBoundingClientRect();
    const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    const deltaX = (startPanPoint.x - currentPoint.x) * (currentViewBox.width / rect.width);
    const deltaY = (startPanPoint.y - currentPoint.y) * (currentViewBox.height / rect.height);
    
    currentViewBox.x += deltaX;
    currentViewBox.y += deltaY;
    
    updateTracingViewBox();
    startPanPoint = currentPoint;
}

function handleTracingPanEnd(e) {
    if (!isNavigationMode) return;
    isPanning = false;
}

// 🔧 FUNCIÓN ROBUSTA: updateTracingViewBox
function updateTracingViewBox() {
    const tracingSvg = document.getElementById('tracingSvg');
    
    // Si estamos en zoom/pan, usar currentViewBox
    if (zoomLevel !== 1 || isPanning) {
        tracingSvg.setAttribute('viewBox', 
            `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`
        );
    } else {
        // Si estamos en zoom normal, forzar viewBox correcto
        forceCorrectViewBox();
    }
}

function updateTracingElementSizes() {
    const zoomFactor = 1 / zoomLevel;
    const currentPlan = plans[currentPlanIndex];
    
    // Actualizar círculos de elementos
    currentPlan.tracingElements.forEach(element => {
        const group = document.querySelector(`#tracing-element-${element.id}`);
        if (group) {
            const circle = group.querySelector('circle');
            const text = group.querySelector('text');
            
            if (circle) {
                const baseRadius = element.categoria === 'infraestructura' 
                    ? BASE_CIRCLE_RADIUS.infraestructura 
                    : BASE_CIRCLE_RADIUS.sanitario;
                
                circle.setAttribute('r', baseRadius * zoomFactor);
                
                // Mantener stroke-width diferenciado para cámaras
                if (element.type === 'camara-inspeccion' || element.type === 'camara-publica') {
                    circle.setAttribute('stroke-width', 2 * zoomFactor);
                } else {
                    circle.setAttribute('stroke-width', BASE_STROKE_WIDTH.element * zoomFactor);
                }
            }
            
            if (text) {
                const baseFontSize = element.categoria === 'infraestructura' 
                    ? BASE_FONT_SIZE.elementLarge 
                    : BASE_FONT_SIZE.element;
                
                text.setAttribute('font-size', baseFontSize * zoomFactor);
            }
        }
    });
    
    // Actualizar líneas
    const tracingSvg = document.getElementById('tracingSvg');
    const pipeLines = tracingSvg.querySelectorAll('.pipe-line');
    pipeLines.forEach(line => {
        line.setAttribute('stroke-width', BASE_STROKE_WIDTH.pipe * zoomFactor);
    });
    
    // Actualizar etiquetas de cañerías (nuevo sistema)
    const pipeLabels = tracingSvg.querySelectorAll('.pipe-label-group');
    pipeLabels.forEach(labelGroup => {
        // Actualizar líneas guía
        const guideLine = labelGroup.querySelector('.guide-line');
        if (guideLine) {
            guideLine.setAttribute('stroke-width', Math.max(0.5, 1 * zoomFactor));
        }
        
        // Actualizar textos
        const texts = labelGroup.querySelectorAll('text');
        texts.forEach(text => {
            const currentSize = parseFloat(text.getAttribute('font-size')) || 8;
            text.setAttribute('font-size', Math.max(6, currentSize * zoomFactor));
        });
        
        // Actualizar rectángulos de fondo
        const rects = labelGroup.querySelectorAll('rect');
        rects.forEach(rect => {
            const currentStroke = parseFloat(rect.getAttribute('stroke-width')) || 1;
            rect.setAttribute('stroke-width', Math.max(0.5, currentStroke * zoomFactor));
        });
    });
}

// ================================
// FUNCIONES DE UTILIDAD PARA TRAZADO
// ================================

function clearTracingSVG() {
    const tracingSvg = document.getElementById('tracingSvg');
    if (!tracingSvg) return;
    
    const elements = tracingSvg.querySelectorAll('g[id^="tracing-element-"]');
    const lines = tracingSvg.querySelectorAll('.pipe-line');
    const arrows = tracingSvg.querySelectorAll('.flow-arrow');
    const labels = tracingSvg.querySelectorAll('.pipe-label-group'); // Actualizado
    
    elements.forEach(el => el.remove());
    lines.forEach(el => el.remove());
    arrows.forEach(el => el.remove());
    labels.forEach(el => el.remove());
    
    // 🆕 Limpiar rectángulo de selección si existe
    removeSelectionRectangle();
    clearSelection();
}

function createTracingConnectionVisual(desde, hacia) {
    const tracingSvg = document.getElementById('tracingSvg');
    if (!tracingSvg) return;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', desde.x);
    line.setAttribute('y1', desde.y);
    line.setAttribute('x2', hacia.x);
    line.setAttribute('y2', hacia.y);
    line.setAttribute('stroke', '#ef4444');
    line.setAttribute('stroke-width', '4');
    line.setAttribute('class', 'pipe-line');
    line.setAttribute('data-from', desde.id);
    line.setAttribute('data-to', hacia.id);

    tracingSvg.appendChild(line);
    createTracingArrow(desde, hacia);
    
    // Agregar etiqueta con el nuevo sistema
    const distanceMillimeters = calcularDistancia(desde, hacia);
    const currentPlan = plans[currentPlanIndex];
    const distanceMeters = convertMillimetersToRealMeters(distanceMillimeters, currentPlan.tracingScale);
    const diameter = desde.tuberia_diametro || 110;
    createPipeLabel(desde, hacia, diameter, distanceMeters);
}

function updateModeButton() {
    const modeButton = document.getElementById('modeToggle');
    const drawingBoard = document.getElementById('drawingBoard');
    
    if (!modeButton || !drawingBoard) return;
    
    if (isNavigationMode) {
        modeButton.textContent = '🔍 Navegación';
        modeButton.classList.add('navigation');
        drawingBoard.classList.add('navigation-mode');
    } else {
        modeButton.textContent = '🖱️ Edición';
        modeButton.classList.remove('navigation');
        drawingBoard.classList.remove('navigation-mode');
    }
}

function updateScaleButton(scale) {
    document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`[data-scale="${scale}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// ================================
// FUNCIONES DE INICIALIZACIÓN DE TRAZADO
// ================================

function initializeTracing() {
    // Verificar que el DOM esté listo
    const tracingSvg = document.getElementById('tracingSvg');
    if (tracingSvg) {
        // 🔧 FORZAR viewBox correcto al inicializar
        forceCorrectViewBox();
        
        setupTracingEvents();
        setupKeyboardEvents();
    } else {
        // Reintentar después de un breve delay
        setTimeout(initializeTracing, 100);
    }
}

// 🔧 FUNCIÓN EXPANDIDA: setupKeyboardEvents con RESET COMPLETO
function setupKeyboardEvents() {
    document.addEventListener('keydown', function(e) {
        // Eliminar elemento(s) seleccionado(s) con tecla SUPRIMIR o DELETE
        if (e.key === 'Delete' || e.key === 'Suprimir') {
            deleteSelectedElements();
        }
        
        // 🚀 ESC = RESET COMPLETO DE TODO
        if (e.key === 'Escape') {
            resetAllActiveCommands();
        }
        
        // 🆕 Seleccionar todo con Ctrl+A
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selectAllElements();
        }
    });
}

// 🚀 NUEVA FUNCIÓN: RESET COMPLETO DE TODOS LOS COMANDOS ACTIVOS
function resetAllActiveCommands() {
    const currentPlan = plans[currentPlanIndex];
    let resetActions = [];
    
    // 1. ✅ DESACTIVAR HERRAMIENTA ACTUAL
    if (currentPlan.currentTool) {
        currentPlan.currentTool = null;
        resetActions.push('herramienta');
    }
    
    // 2. ✅ QUITAR CLASE ACTIVE DE TODOS LOS BOTONES DE HERRAMIENTAS
    const activeButtons = document.querySelectorAll('.tool-btn.active');
    if (activeButtons.length > 0) {
        activeButtons.forEach(btn => btn.classList.remove('active'));
        resetActions.push('botones');
    }
    
    // 3. ✅ CANCELAR SELECCIÓN RECTANGULAR EN CURSO
    if (isRectangularSelecting) {
        removeSelectionRectangle();
        isRectangularSelecting = false;
        resetActions.push('selección rectangular');
    }
    
    // 4. ✅ DESELECCIONAR ELEMENTOS
    if (selectedElements.size > 0) {
        clearSelection();
        resetActions.push('elementos seleccionados');
    }
    
    // 5. ✅ LIMPIAR CUALQUIER ESTADO DE ARRASTRE
    if (typeof globalDragSystem !== 'undefined' && globalDragSystem.isDragging) {
        globalDragSystem.isDragging = false;
        globalDragSystem.currentElement = null;
        resetActions.push('arrastre');
    }
    
    // 6. ✅ ASEGURAR CURSOR NORMAL
    const drawingBoard = document.getElementById('drawingBoard');
    if (drawingBoard) {
        drawingBoard.style.cursor = 'crosshair';
    }
    
    // 7. ✅ MENSAJE DE CONFIRMACIÓN
    if (resetActions.length > 0) {
        showStatus(`🔄 ESC: Desactivado → ${resetActions.join(', ')} | Listo para selección libre`);
    } else {
        showStatus('🔄 ESC: Ya en modo selección libre');
    }
    
    console.log('🚀 RESET COMPLETO ejecutado:', resetActions);
}

// 🆕 NUEVA FUNCIÓN: Eliminar elementos seleccionados múltiples
function deleteSelectedElements() {
    const currentPlan = plans[currentPlanIndex];
    
    if (selectedElements.size === 0) {
        showStatus('⚠️ No hay elementos seleccionados para eliminar');
        return;
    }
    
    const elementsToDelete = Array.from(selectedElements);
    let deletedCount = 0;
    
    elementsToDelete.forEach(elementId => {
        const elementGroup = document.getElementById(elementId);
        if (!elementGroup) return;
        
        // Obtener ID numérico del elemento
        const numericId = parseInt(elementId.replace('tracing-element-', ''));
        
        // Eliminar del DOM
        elementGroup.remove();
        
        // Eliminar conexiones relacionadas
        const relatedConnections = currentPlan.tracingConnections.filter(conn => 
            conn.from.id === numericId || conn.to.id === numericId
        );
        
        relatedConnections.forEach(conn => {
            // Eliminar líneas, flechas y etiquetas del DOM
            const lines = document.querySelectorAll(`[data-from="${conn.from.id}"][data-to="${conn.to.id}"]`);
            const arrows = document.querySelectorAll(`[data-connection="${conn.from.id}-${conn.to.id}"]`);
            const labels = document.querySelectorAll(`.pipe-label-group[data-connection="${conn.from.id}-${conn.to.id}"]`);
            
            lines.forEach(line => line.remove());
            arrows.forEach(arrow => arrow.remove());
            labels.forEach(label => label.remove());
        });
        
        // Eliminar de los datos
        currentPlan.tracingElements = currentPlan.tracingElements.filter(el => el.id !== numericId);
        currentPlan.tracingConnections = currentPlan.tracingConnections.filter(conn => 
            conn.from.id !== numericId && conn.to.id !== numericId
        );
        
        deletedCount++;
    });
    
    // Limpiar selección
    clearSelection();
    
    showStatus(`🗑️ ${deletedCount} elemento(s) eliminado(s) correctamente`);
}

// 🆕 NUEVA FUNCIÓN: Seleccionar todos los elementos
function selectAllElements() {
    const currentPlan = plans[currentPlanIndex];
    
    if (currentPlan.tracingElements.length === 0) {
        showStatus('⚠️ No hay elementos para seleccionar');
        return;
    }
    
    clearSelection();
    
    currentPlan.tracingElements.forEach(element => {
        const elementGroup = document.querySelector(`#tracing-element-${element.id}`);
        if (elementGroup) {
            selectTracingElement(elementGroup, true);
        }
    });
    
    showStatus(`✅ Todos los elementos seleccionados (${selectedElements.size})`);
}

// 🔧 FUNCIÓN EXPANDIDA: deselectAllElements con alias
function deselectAllElements() {
    clearSelection();
    showStatus('🔄 Elementos deseleccionados');
}

// ================================
// FUNCIONES PARA TEXTO Y ROSA DE VIENTOS
// ================================

function showTextModal() {
    document.getElementById('textModal').style.display = 'block';
}

function hideTextModal() {
    document.getElementById('textModal').style.display = 'none';
    // Deseleccionar botón
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
}

function createTextElement() {
    const content = document.getElementById('textContent').value || 'TEXTO';
    const font = document.getElementById('textFont').value;
    const size = document.getElementById('textSize').value;
    
    hideTextModal();
    
    const tracingSvg = document.getElementById('tracingSvg');
    const textId = 'text-' + Date.now();
    
    // Crear grupo para el texto
    const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    textGroup.setAttribute('id', textId);
    textGroup.setAttribute('class', 'dynamic-text');
    textGroup.style.cursor = 'move';
    
    // Crear elemento de texto
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', 100);
    textElement.setAttribute('y', 100);
    textElement.setAttribute('font-family', font);
    textElement.setAttribute('font-size', size);
    textElement.setAttribute('fill', '#000000');
    textElement.setAttribute('font-weight', 'normal');
    textElement.textContent = content;
    
    textGroup.appendChild(textElement);
    tracingSvg.appendChild(textGroup);
    
    // Hacer arrastrable
    makeTextDraggable(textGroup, textElement);
    
    showStatus(`✅ Texto "${content}" creado - Doble click para editar`);
}

function createNorthRose() {
    const tracingSvg = document.getElementById('tracingSvg');
    const roseId = 'rose-' + Date.now();
    
    // Crear grupo para la rosa
    const roseGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    roseGroup.setAttribute('id', roseId);
    roseGroup.setAttribute('class', 'dynamic-rose');
    roseGroup.style.cursor = 'move';
    roseGroup.setAttribute('transform', 'translate(200,100)');
    
    // Crear círculo base
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', 0);
    circle.setAttribute('cy', 0);
    circle.setAttribute('r', 25);
    circle.setAttribute('fill', 'white');
    circle.setAttribute('stroke', '#000000');
    circle.setAttribute('stroke-width', '2');
    
    // Crear flecha
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', '0,-20 -5,-10 5,-10');
    arrow.setAttribute('fill', '#000000');
    
    // Crear texto N
    const nText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nText.setAttribute('x', 0);
    nText.setAttribute('y', 5);
    nText.setAttribute('text-anchor', 'middle');
    nText.setAttribute('font-family', 'Arial');
    nText.setAttribute('font-size', '14');
    nText.setAttribute('font-weight', 'bold');
    nText.setAttribute('fill', '#000000');
    nText.textContent = 'N';
    
    // Crear handle de redimensión
    const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    resizeHandle.setAttribute('cx', 25);
    resizeHandle.setAttribute('cy', 25);
    resizeHandle.setAttribute('r', 4);
    resizeHandle.setAttribute('fill', '#3498db');
    resizeHandle.setAttribute('stroke', '#ffffff');
    resizeHandle.setAttribute('stroke-width', '2');
    resizeHandle.style.cursor = 'nw-resize';
    
    roseGroup.appendChild(circle);
    roseGroup.appendChild(arrow);
    roseGroup.appendChild(nText);
    roseGroup.appendChild(resizeHandle);
    
    tracingSvg.appendChild(roseGroup);
    
    // Hacer manipulable
    makeRoseManipulable(roseGroup);
    
    // Deseleccionar botón
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    
    showStatus('✅ Rosa de vientos creada - Arrastra para mover, click en handle para redimensionar');
}

function makeTextDraggable(textGroup, textElement) {
    let isDragging = false;
    let startX, startY, startTextX, startTextY;
    
    textGroup.addEventListener('mousedown', function(e) {
        if (isNavigationMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startTextX = parseFloat(textElement.getAttribute('x'));
        startTextY = parseFloat(textElement.getAttribute('y'));
        
        textGroup.style.opacity = '0.7';
    });
    
    // Doble click para editar
    textGroup.addEventListener('dblclick', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const newText = prompt('Editar texto:', textElement.textContent);
        if (newText !== null) {
            textElement.textContent = newText;
            showStatus('✅ Texto actualizado');
        }
    });
    
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        textElement.setAttribute('x', startTextX + deltaX);
        textElement.setAttribute('y', startTextY + deltaY);
    }
    
    function handleMouseUp() {
        if (isDragging) {
            isDragging = false;
            textGroup.style.opacity = '1';
        }
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function makeRoseManipulable(roseGroup) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startTransform;
    let currentScale = 1;
    
    const resizeHandle = roseGroup.querySelector('circle[r="4"]');
    
    roseGroup.addEventListener('mousedown', function(e) {
        if (isNavigationMode || e.target === resizeHandle) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const transform = roseGroup.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        startTransform = match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
        
        roseGroup.style.opacity = '0.7';
    });
    
    resizeHandle.addEventListener('mousedown', function(e) {
        if (isNavigationMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
    });
    
    function handleMouseMove(e) {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newX = startTransform.x + deltaX;
            const newY = startTransform.y + deltaY;
            
            roseGroup.setAttribute('transform', `translate(${newX},${newY}) scale(${currentScale})`);
        }
        
        if (isResizing) {
            const deltaX = e.clientX - startX;
            const factor = 1 + (deltaX / 100);
            currentScale = Math.max(0.5, Math.min(3, factor));
            
            const transform = roseGroup.getAttribute('transform');
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            const pos = match ? `translate(${match[1]},${match[2]})` : 'translate(200,100)';
            
            roseGroup.setAttribute('transform', `${pos} scale(${currentScale})`);
        }
    }
    
    function handleMouseUp() {
        if (isDragging) {
            isDragging = false;
            roseGroup.style.opacity = '1';
        }
        if (isResizing) {
            isResizing = false;
        }
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}