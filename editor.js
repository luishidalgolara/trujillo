// ================================
// INICIALIZACIÓN Y CONFIGURACIÓN
// ================================

// ✅ NUEVA VARIABLE PARA MÚLTIPLES IMÁGENES
let imageCounter = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing editor...');
    
    // Verificar elementos críticos
    const workspace = document.getElementById('workspace');
    const drawingBoard = document.getElementById('drawingBoard');
    const tracingSvg = document.getElementById('tracingSvg');
    
    if (!workspace || !drawingBoard || !tracingSvg) {
        console.error('Critical elements missing:', { workspace, drawingBoard, tracingSvg });
        return;
    }
    
    // 🔧 INICIALIZACIÓN CRÍTICA ROBUSTA: FORZAR viewBox correcto INMEDIATAMENTE
    const currentFormat = plans[currentPlanIndex].format;
    const formatData = formats[currentFormat];
    
    // PASO 1: FORZAR viewBox en el DOM
    tracingSvg.setAttribute('viewBox', `0 0 ${formatData.width} ${formatData.height}`);
    
    // PASO 2: FORZAR currentViewBox sincronizado
    currentViewBox = { 
        x: 0, 
        y: 0, 
        width: formatData.width, 
        height: formatData.height 
    };
    
    // PASO 3: VALIDAR aplicación
    const appliedViewBox = tracingSvg.getAttribute('viewBox');
    console.log(`🔧 DOM inicialización: Formato ${currentFormat} → ViewBox aplicado: "${appliedViewBox}" → Esperado: "0 0 ${formatData.width} ${formatData.height}"`);
    
    // PASO 4: Re-forzar si es necesario
    if (appliedViewBox !== `0 0 ${formatData.width} ${formatData.height}`) {
        console.warn('⚠️ ViewBox inicial incorrecto, re-forzando...');
        setTimeout(() => {
            tracingSvg.setAttribute('viewBox', `0 0 ${formatData.width} ${formatData.height}`);
            console.log(`🔧 ViewBox re-forzado: ${tracingSvg.getAttribute('viewBox')}`);
        }, 100);
    }
    
    // Inicializar configuraciones básicas
    updatePlanInfo();
    setupDragAndDrop();
    setupFileHandling();
    setupEditableTexts();
    setupDraggableElements();
    setupZoom();
    
    // Inicializar trazado (que también forzará viewBox correcto)
    initializeTracing();
    
    // Cargar plano actual
    loadCurrentPlan();
    
    // Actualizar panel de planos
    updatePlansPanel();
    
    // Configurar PDF.js si está disponible
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    console.log('✅ Editor initialization completed - ViewBox forzado y validado');
    
    // Mostrar mensaje de bienvenida
    showStatus(`✅ Editor ROBUSTO cargado - Área completa ${formatData.width}×${formatData.height}px disponible`, 3000);
});

// ================================
// FUNCIONES DE MANEJO DE ARCHIVOS
// ================================

function setupFileHandling() {
    document.getElementById('pdfFiles').addEventListener('change', function(e) {
        handlePDFFiles(e.target.files);
    });
}

// 🔧 FUNCIÓN DEFINITIVA ROBUSTA: screenToSVGCoords
function screenToSVGCoords(screenX, screenY) {
    const tracingSvg = document.getElementById('tracingSvg');
    if (!tracingSvg) return { x: 0, y: 0 };
    
    try {
        // 🔧 PASO 1: FORZAR viewBox correcto antes de CUALQUIER conversión
        if (typeof forceCorrectViewBox === 'function') {
            forceCorrectViewBox();
        }
        
        // 🔧 PASO 2: Conversión 100% precisa usando createSVGPoint
        const pt = tracingSvg.createSVGPoint();
        pt.x = screenX;
        pt.y = screenY;
        
        // Obtener la matriz de transformación actual del SVG
        const svgMatrix = tracingSvg.getScreenCTM().inverse();
        
        // Convertir las coordenadas de pantalla a coordenadas SVG EXACTAS
        const svgPoint = pt.matrixTransform(svgMatrix);
        
        return { x: svgPoint.x, y: svgPoint.y };
    } catch (error) {
        console.warn('Error converting coordinates in screenToSVGCoords:', error);
        
        // Fallback robusto con conversión manual
        const rect = tracingSvg.getBoundingClientRect();
        const viewBox = tracingSvg.viewBox.baseVal;
        
        // Conversión manual como último recurso
        const x = ((screenX - rect.left) / rect.width) * viewBox.width + viewBox.x;
        const y = ((screenY - rect.top) / rect.height) * viewBox.height + viewBox.y;
        
        return { x, y };
    }
}

function handlePDFFiles(files) {
    const file = files[0];
    if (!file) return;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            loadPDF(file);
        } else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
            loadImage(file);
        } else {
            showStatus('Formato no soportado. Use PDF o imágenes (JPG, PNG, SVG)');
        }
    } catch (error) {
        showStatus('Error al cargar archivo: ' + error.message);
    }
}

async function loadPDF(file) {
    showStatus('Cargando PDF...');
    
    try {
        if (typeof pdfjsLib === 'undefined') {
            showStatus('Error: PDF.js no está disponible');
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        
        currentPDF = pdf;
        totalPages = pdf.numPages;
        currentPage = 1;

        await renderPDFPage(1);
        showStatus(`✅ PDF cargado: ${totalPages} página(s)`);

    } catch (error) {
        showStatus('❌ Error al cargar PDF: ' + error.message);
    }
}

// ✅ FUNCIÓN CORREGIDA: renderPDFPage - Para múltiples PDFs en milímetros
async function renderPDFPage(pageNum) {
    if (!currentPDF) return;

    try {
        const page = await currentPDF.getPage(pageNum);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale: 1 });
        
        // CORREGIDO: Escalar para dimensiones en milímetros
        const currentFormat = plans[currentPlanIndex].format;
        const formatData = formats[currentFormat];
        const scale = Math.min(formatData.width / viewport.width, formatData.height / viewport.height) * 0.9;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise;

        const imageData = canvas.toDataURL('image/png');
        
        // ✅ CORREGIDO: Usar función para múltiples imágenes
        addMultiplePDFBackground(imageData, scaledViewport.width, scaledViewport.height, `PDF_Page_${pageNum}`);

    } catch (error) {
        showStatus('❌ Error al renderizar página: ' + error.message);
    }
}

// ✅ FUNCIÓN CORREGIDA: loadImage - Para múltiples imágenes en milímetros
async function loadImage(file) {
    showStatus('Cargando imagen...');
    
    try {
        const reader = new FileReader();
        
        const imagePromise = new Promise((resolve, reject) => {
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // CORREGIDO: Escalar para dimensiones en milímetros
                    const currentFormat = plans[currentPlanIndex].format;
                    const formatData = formats[currentFormat];
                    const scale = Math.min(formatData.width / img.width, formatData.height / img.height) * 0.9;
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    
                    // ✅ CORREGIDO: Usar función para múltiples imágenes
                    addMultiplePDFBackground(e.target.result, scaledWidth, scaledHeight, file.name);
                    resolve();
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
        });
        
        reader.readAsDataURL(file);
        await imagePromise;
        
        showStatus('✅ Imagen cargada correctamente');
        
    } catch (error) {
        showStatus('❌ Error al cargar imagen: ' + error.message);
    }
}

// ✅ FUNCIÓN ORIGINAL MANTENIDA (por compatibilidad) + NUEVA FUNCIÓN MÚLTIPLE
function addPDFBackground(imageData, width, height) {
    // Llamar a la nueva función múltiple para mantener compatibilidad
    addMultiplePDFBackground(imageData, width, height, 'image_legacy');
}

// ✅ NUEVA FUNCIÓN: addMultiplePDFBackground - Permite múltiples imágenes en milímetros
function addMultiplePDFBackground(imageData, width, height, fileName = 'image') {
    try {
        imageCounter++; // Incrementar contador para ID único
        
        const currentPlan = plans[currentPlanIndex];
        const tracingSvg = document.getElementById('tracingSvg');
        
        // ✅ CORREGIDO: NO eliminar imágenes anteriores
        // const existingBg = tracingSvg.querySelector('#pdfBackgroundGroup');
        // if (existingBg) existingBg.remove();
        
        let defs = tracingSvg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            tracingSvg.appendChild(defs);
        }
        
        // CORREGIDO: Escalar imagen para que quepa en el plano en milímetros
        const maxWidth = 200; // mm
        const maxHeight = 150; // mm
        const scale = Math.min(maxWidth / width, maxHeight / height);
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        
        // ✅ CREAR PATTERN CON ID ÚNICO
        const patternId = `pdfPattern_${imageCounter}`;
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', patternId);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute('width', scaledWidth);
        pattern.setAttribute('height', scaledHeight);

        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', imageData);
        image.setAttribute('width', scaledWidth);
        image.setAttribute('height', scaledHeight);
        image.setAttribute('opacity', '0.8');

        pattern.appendChild(image);
        defs.appendChild(pattern);

        // ✅ CREAR GRUPO CON ID ÚNICO
        const bgGroupId = `pdfBackgroundGroup_${imageCounter}`;
        const bgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bgGroup.setAttribute('id', bgGroupId);
        bgGroup.setAttribute('class', 'manipulable-image');
        bgGroup.setAttribute('data-image-name', fileName);

        // CORREGIDO: Posición inicial en milímetros (evitar superposición total)
        const offsetX = 50 + (imageCounter * 25); // mm
        const offsetY = 50 + (imageCounter * 15); // mm

        const bgRectId = `pdfBackground_${imageCounter}`;
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('id', bgRectId);
        bgRect.setAttribute('x', offsetX);
        bgRect.setAttribute('y', offsetY);
        bgRect.setAttribute('width', scaledWidth);
        bgRect.setAttribute('height', scaledHeight);
        bgRect.setAttribute('fill', `url(#${patternId})`);
        bgRect.setAttribute('stroke', '#3498db');
        bgRect.setAttribute('stroke-width', '2');
        bgRect.setAttribute('stroke-dasharray', '5,5');
        bgRect.setAttribute('opacity', '0.9');
        bgRect.style.cursor = 'move';

        // ✅ CREAR HANDLES CON ID ÚNICO
        const resizeHandleId = `resizeHandle_${imageCounter}`;
        const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        resizeHandle.setAttribute('id', resizeHandleId);
        resizeHandle.setAttribute('cx', offsetX + scaledWidth);
        resizeHandle.setAttribute('cy', offsetY + scaledHeight);
        resizeHandle.setAttribute('r', '8');
        resizeHandle.setAttribute('fill', '#3498db');
        resizeHandle.setAttribute('stroke', '#ffffff');
        resizeHandle.setAttribute('stroke-width', '3');
        resizeHandle.style.cursor = 'nw-resize';

        bgGroup.appendChild(bgRect);
        bgGroup.appendChild(resizeHandle);

        // Insertar después del grid si existe
        const gridRect = tracingSvg.querySelector('rect[fill="url(#grid)"]');
        if (gridRect) {
            gridRect.insertAdjacentElement('afterend', bgGroup);
        } else {
            tracingSvg.appendChild(bgGroup);
        }

        // ✅ CONFIGURAR MANIPULACIÓN CON IDs ÚNICOS
        setupMultipleImageManipulation(bgGroup, bgRect, resizeHandle, pattern, imageCounter);

        // ✅ GUARDAR EN ARRAY DE IMÁGENES DEL PLAN
        if (!currentPlan.pdfBackgrounds) {
            currentPlan.pdfBackgrounds = [];
        }
        
        currentPlan.pdfBackgrounds.push({ 
            id: imageCounter,
            imageData, 
            width: scaledWidth, 
            height: scaledHeight, 
            x: offsetX, 
            y: offsetY,
            scale: 1,
            fileName: fileName
        });

        showStatus(`✅ ${fileName} cargada. Total imágenes: ${currentPlan.pdfBackgrounds.length}`);

    } catch (error) {
        console.error('Error en addMultiplePDFBackground:', error);
        showStatus('❌ Error al cargar imagen');
    }
}

// 🔧 FUNCIÓN CORREGIDA: setupMultipleImageManipulation - MURALLA INVISIBLE ELIMINADA
function setupMultipleImageManipulation(bgGroup, bgRect, resizeHandle, pattern, imageId) {
    let isDragging = false;
    let isResizing = false;
    let startMouse = { x: 0, y: 0 };
    let startRect = { x: 0, y: 0, width: 0, height: 0 };
    let originalRatio = 1;
    let isLocked = false;
    let wasManipulating = false;
    let manipulationTimer = null;

    // Calcular ratio original
    const originalWidth = parseFloat(bgRect.getAttribute('width'));
    const originalHeight = parseFloat(bgRect.getAttribute('height'));
    originalRatio = originalWidth / originalHeight;

    // Función para marcar estado de manipulación
    function setManipulationState(state) {
        wasManipulating = state;
        if (state) {
            if (manipulationTimer) clearTimeout(manipulationTimer);
            manipulationTimer = setTimeout(() => {
                wasManipulating = false;
            }, 500);
        }
    }

    // ✅ CREAR BOTÓN DE CANDADO CON ID ÚNICO
    const lockButtonId = `lockButton_${imageId}`;
    const lockButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lockButton.setAttribute('id', lockButtonId);
    lockButton.setAttribute('class', 'lock-button');
    lockButton.style.cursor = 'pointer';

    const lockBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    lockBg.setAttribute('cx', parseFloat(bgRect.getAttribute('x')) + 15);
    lockBg.setAttribute('cy', parseFloat(bgRect.getAttribute('y')) + 15);
    lockBg.setAttribute('r', '12');
    lockBg.setAttribute('fill', '#ffffff');
    lockBg.setAttribute('stroke', '#3498db');
    lockBg.setAttribute('stroke-width', '2');

    const lockIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lockIcon.setAttribute('x', parseFloat(bgRect.getAttribute('x')) + 15);
    lockIcon.setAttribute('y', parseFloat(bgRect.getAttribute('y')) + 20);
    lockIcon.setAttribute('text-anchor', 'middle');
    lockIcon.setAttribute('font-size', '12');
    lockIcon.setAttribute('fill', '#3498db');
    lockIcon.textContent = '🔓';

    lockButton.appendChild(lockBg);
    lockButton.appendChild(lockIcon);
    bgGroup.appendChild(lockButton);

    // ✅ CREAR BOTÓN DE ELIMINAR CON ID ÚNICO
    const deleteButtonId = `deleteButton_${imageId}`;
    const deleteButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    deleteButton.setAttribute('id', deleteButtonId);
    deleteButton.setAttribute('class', 'delete-button');
    deleteButton.style.cursor = 'pointer';

    const deleteBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    deleteBg.setAttribute('cx', parseFloat(bgRect.getAttribute('x')) + parseFloat(bgRect.getAttribute('width')) - 15);
    deleteBg.setAttribute('cy', parseFloat(bgRect.getAttribute('y')) + 15);
    deleteBg.setAttribute('r', '12');
    deleteBg.setAttribute('fill', '#e74c3c');
    deleteBg.setAttribute('stroke', '#ffffff');
    deleteBg.setAttribute('stroke-width', '2');

    const deleteIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    deleteIcon.setAttribute('x', parseFloat(bgRect.getAttribute('x')) + parseFloat(bgRect.getAttribute('width')) - 15);
    deleteIcon.setAttribute('y', parseFloat(bgRect.getAttribute('y')) + 20);
    deleteIcon.setAttribute('text-anchor', 'middle');
    deleteIcon.setAttribute('font-size', '12');
    deleteIcon.setAttribute('fill', '#ffffff');
    deleteIcon.textContent = '❌';

    deleteButton.appendChild(deleteBg);
    deleteButton.appendChild(deleteIcon);
    bgGroup.appendChild(deleteButton);

    // Función para alternar el candado
    function toggleLock() {
        isLocked = !isLocked;
        lockIcon.textContent = isLocked ? '🔒' : '🔓';
        lockBg.setAttribute('fill', isLocked ? '#e74c3c' : '#ffffff');
        lockBg.setAttribute('stroke', isLocked ? '#e74c3c' : '#3498db');
        lockIcon.setAttribute('fill', isLocked ? '#ffffff' : '#3498db');
        
        bgRect.style.cursor = isLocked ? 'default' : 'move';
        resizeHandle.style.cursor = isLocked ? 'default' : 'nw-resize';
        
        showStatus(isLocked ? '🔒 Imagen bloqueada' : '🔓 Imagen desbloqueada');
    }

    // ✅ FUNCIÓN PARA ELIMINAR IMAGEN ESPECÍFICA
    function deleteImage() {
        if (confirm('¿Eliminar esta imagen?')) {
            // Eliminar del DOM
            bgGroup.remove();
            
            // Eliminar pattern del defs
            const patternToRemove = document.getElementById(`pdfPattern_${imageId}`);
            if (patternToRemove) patternToRemove.remove();
            
            // Eliminar del array del plan
            const currentPlan = plans[currentPlanIndex];
            if (currentPlan.pdfBackgrounds) {
                currentPlan.pdfBackgrounds = currentPlan.pdfBackgrounds.filter(img => img.id !== imageId);
                showStatus(`🗑️ Imagen eliminada. Quedan: ${currentPlan.pdfBackgrounds.length}`);
            }
        }
    }

    function updateLockPosition() {
        const x = parseFloat(bgRect.getAttribute('x'));
        const y = parseFloat(bgRect.getAttribute('y'));
        const width = parseFloat(bgRect.getAttribute('width'));
        
        lockBg.setAttribute('cx', x + 15);
        lockBg.setAttribute('cy', y + 15);
        lockIcon.setAttribute('x', x + 15);
        lockIcon.setAttribute('y', y + 20);
        
        deleteBg.setAttribute('cx', x + width - 15);
        deleteBg.setAttribute('cy', y + 15);
        deleteIcon.setAttribute('x', x + width - 15);
        deleteIcon.setAttribute('y', y + 20);
    }

    function updateImagePattern(x, y, width, height) {
        if (pattern) {
            pattern.setAttribute('x', x);
            pattern.setAttribute('y', y);
            pattern.setAttribute('width', width);
            pattern.setAttribute('height', height);
            
            const image = pattern.querySelector('image');
            if (image) {
                image.setAttribute('x', 0);
                image.setAttribute('y', 0);
                image.setAttribute('width', width);
                image.setAttribute('height', height);
            }
        }
    }

    // 🔧 FUNCIÓN DEFINITIVA ROBUSTA para manipulación de imágenes
    function getRelativeCoords(e) {
        const tracingSvg = document.getElementById('tracingSvg');
        if (!tracingSvg) {
            // Fallback si no hay SVG
            const drawingBoard = document.getElementById('drawingBoard');
            const rect = drawingBoard.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
        
        try {
            // 🔧 PASO 1: FORZAR viewBox correcto antes de CUALQUIER conversión
            if (typeof forceCorrectViewBox === 'function') {
                forceCorrectViewBox();
            }
            
            // 🔧 PASO 2: Conversión 100% precisa usando createSVGPoint
            const pt = tracingSvg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            
            // Obtener la matriz de transformación actual del SVG
            const svgMatrix = tracingSvg.getScreenCTM().inverse();
            
            // Convertir las coordenadas de pantalla a coordenadas SVG EXACTAS
            const svgPoint = pt.matrixTransform(svgMatrix);
            
            return { x: svgPoint.x, y: svgPoint.y };
        } catch (error) {
            console.warn('Error converting coordinates for image manipulation:', error);
            // Fallback robusto
            const tracingSvg = document.getElementById('tracingSvg');
            const rect = tracingSvg.getBoundingClientRect();
            const viewBox = tracingSvg.viewBox.baseVal;
            
            // Conversión manual como último recurso
            const x = ((e.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
            const y = ((e.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;
            
            return { x, y };
        }
    }

    // Event Listeners
    lockButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toggleLock();
    });

    deleteButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        deleteImage();
    });

    bgRect.addEventListener('mousedown', function(e) {
        if (isNavigationMode || isLocked) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        isDragging = true;
        setManipulationState(true);
        
        const coords = getRelativeCoords(e);
        startMouse.x = coords.x;
        startMouse.y = coords.y;
        
        startRect.x = parseFloat(bgRect.getAttribute('x'));
        startRect.y = parseFloat(bgRect.getAttribute('y'));
        startRect.width = parseFloat(bgRect.getAttribute('width'));
        startRect.height = parseFloat(bgRect.getAttribute('height'));
        
        document.body.style.userSelect = 'none';
        bgGroup.style.opacity = '0.7';
    });

    resizeHandle.addEventListener('mousedown', function(e) {
        if (isNavigationMode || isLocked) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        isResizing = true;
        setManipulationState(true);
        
        const coords = getRelativeCoords(e);
        startMouse.x = coords.x;
        startMouse.y = coords.y;
        
        startRect.x = parseFloat(bgRect.getAttribute('x'));
        startRect.y = parseFloat(bgRect.getAttribute('y'));
        startRect.width = parseFloat(bgRect.getAttribute('width'));
        startRect.height = parseFloat(bgRect.getAttribute('height'));
        
        document.body.style.userSelect = 'none';
        bgGroup.style.opacity = '0.7';
    });

    function handleMouseMove(e) {
        if (!isDragging && !isResizing) return;
        
        e.preventDefault();
        
        const coords = getRelativeCoords(e);
        
        if (isDragging) {
            const deltaX = coords.x - startMouse.x;
            const deltaY = coords.y - startMouse.y;
            
            // ✅ MURALLA INVISIBLE ELIMINADA COMPLETAMENTE - MOVIMIENTO TOTALMENTE LIBRE
            const newX = startRect.x + deltaX;
            const newY = startRect.y + deltaY;
            
            bgRect.setAttribute('x', newX);
            bgRect.setAttribute('y', newY);
            
            updateImagePattern(newX, newY, startRect.width, startRect.height);
            
            resizeHandle.setAttribute('cx', newX + startRect.width);
            resizeHandle.setAttribute('cy', newY + startRect.height);
            
            updateLockPosition();
            
        } else if (isResizing) {
            const deltaX = coords.x - startMouse.x;
            const deltaY = coords.y - startMouse.y;
            const delta = Math.max(deltaX, deltaY);
            
            // ✅ REDIMENSIONAMIENTO LIBRE - SOLO LÍMITE MÍNIMO RAZONABLE
            const newWidth = Math.max(30, startRect.width + delta);
            const newHeight = newWidth / originalRatio;
            
            bgRect.setAttribute('width', newWidth);
            bgRect.setAttribute('height', newHeight);
            
            updateImagePattern(startRect.x, startRect.y, newWidth, newHeight);
            
            resizeHandle.setAttribute('cx', startRect.x + newWidth);
            resizeHandle.setAttribute('cy', startRect.y + newHeight);
            
            updateLockPosition();
        }
    }

    function handleMouseUp(e) {
        const wasManipulatingNow = isDragging || isResizing;
        
        if (isDragging) {
            isDragging = false;
            showStatus('📍 Imagen reposicionada - Movimiento COMPLETAMENTE LIBRE');
        }
        if (isResizing) {
            isResizing = false;
            showStatus('📏 Imagen redimensionada');
        }
        
        if (wasManipulatingNow) {
            document.body.style.userSelect = '';
            bgGroup.style.opacity = '0.9';
            
            const currentPlan = plans[currentPlanIndex];
            currentPlan.currentTool = null;
            
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            setTimeout(() => {
                showStatus('🔧 Herramientas deseleccionadas automáticamente');
            }, 1000);
        }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    bgGroup.addEventListener('click', function(e) {
        const currentPlan = plans[currentPlanIndex];
        
        if (!isNavigationMode && currentPlan.currentTool && !wasManipulating) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    bgRect.addEventListener('click', function(e) {
        const currentPlan = plans[currentPlanIndex];
        
        if (!isNavigationMode && currentPlan.currentTool && !wasManipulating) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    resizeHandle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
    
    bgGroup.addEventListener('remove', function() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    lockButton.addEventListener('mouseenter', function() {
        lockBg.setAttribute('stroke-width', '3');
    });

    lockButton.addEventListener('mouseleave', function() {
        lockBg.setAttribute('stroke-width', '2');
    });
    
    deleteButton.addEventListener('mouseenter', function() {
        deleteBg.setAttribute('stroke-width', '3');
    });

    deleteButton.addEventListener('mouseleave', function() {
        deleteBg.setAttribute('stroke-width', '2');
    });
}

// 🔧 FUNCIÓN LEGACY CORREGIDA: setupImageManipulation - MURALLA INVISIBLE ELIMINADA
function setupImageManipulation(bgGroup, bgRect, resizeHandle, pattern) {
    let isDragging = false;
    let isResizing = false;
    let startMouse = { x: 0, y: 0 };
    let startRect = { x: 0, y: 0, width: 0, height: 0 };
    let originalRatio = 1;
    let isLocked = false;
    let wasManipulating = false;
    let manipulationTimer = null;

    // Calcular ratio original
    const originalWidth = parseFloat(bgRect.getAttribute('width'));
    const originalHeight = parseFloat(bgRect.getAttribute('height'));
    originalRatio = originalWidth / originalHeight;

    // Función para marcar estado de manipulación
    function setManipulationState(state) {
        wasManipulating = state;
        if (state) {
            if (manipulationTimer) clearTimeout(manipulationTimer);
            manipulationTimer = setTimeout(() => {
                wasManipulating = false;
            }, 500);
        }
    }

    // Crear botón de candado en la esquina superior izquierda
    const lockButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lockButton.setAttribute('id', 'lockButton');
    lockButton.setAttribute('class', 'lock-button');
    lockButton.style.cursor = 'pointer';

    const lockBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    lockBg.setAttribute('cx', parseFloat(bgRect.getAttribute('x')) + 15);
    lockBg.setAttribute('cy', parseFloat(bgRect.getAttribute('y')) + 15);
    lockBg.setAttribute('r', '12');
    lockBg.setAttribute('fill', '#ffffff');
    lockBg.setAttribute('stroke', '#3498db');
    lockBg.setAttribute('stroke-width', '2');

    const lockIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lockIcon.setAttribute('x', parseFloat(bgRect.getAttribute('x')) + 15);
    lockIcon.setAttribute('y', parseFloat(bgRect.getAttribute('y')) + 20);
    lockIcon.setAttribute('text-anchor', 'middle');
    lockIcon.setAttribute('font-size', '12');
    lockIcon.setAttribute('fill', '#3498db');
    lockIcon.textContent = '🔓';

    lockButton.appendChild(lockBg);
    lockButton.appendChild(lockIcon);
    bgGroup.appendChild(lockButton);

    // Función para alternar el candado
    function toggleLock() {
        isLocked = !isLocked;
        lockIcon.textContent = isLocked ? '🔒' : '🔓';
        lockBg.setAttribute('fill', isLocked ? '#e74c3c' : '#ffffff');
        lockBg.setAttribute('stroke', isLocked ? '#e74c3c' : '#3498db');
        lockIcon.setAttribute('fill', isLocked ? '#ffffff' : '#3498db');
        
        bgRect.style.cursor = isLocked ? 'default' : 'move';
        resizeHandle.style.cursor = isLocked ? 'default' : 'nw-resize';
        
        showStatus(isLocked ? '🔒 Imagen bloqueada' : '🔓 Imagen desbloqueada');
    }

    lockButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toggleLock();
    });

    function updateLockPosition() {
        const x = parseFloat(bgRect.getAttribute('x'));
        const y = parseFloat(bgRect.getAttribute('y'));
        lockBg.setAttribute('cx', x + 15);
        lockBg.setAttribute('cy', y + 15);
        lockIcon.setAttribute('x', x + 15);
        lockIcon.setAttribute('y', y + 20);
    }

    function updateImagePattern(x, y, width, height) {
        if (pattern) {
            pattern.setAttribute('x', x);
            pattern.setAttribute('y', y);
            pattern.setAttribute('width', width);
            pattern.setAttribute('height', height);
            
            const image = pattern.querySelector('image');
            if (image) {
                image.setAttribute('x', 0);
                image.setAttribute('y', 0);
                image.setAttribute('width', width);
                image.setAttribute('height', height);
            }
        }
    }

    // 🔧 FUNCIÓN DEFINITIVA ROBUSTA para manipulación de imágenes
    function getRelativeCoords(e) {
        const tracingSvg = document.getElementById('tracingSvg');
        if (!tracingSvg) {
            // Fallback si no hay SVG
            const drawingBoard = document.getElementById('drawingBoard');
            const rect = drawingBoard.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
        
        try {
            // 🔧 PASO 1: FORZAR viewBox correcto antes de CUALQUIER conversión
            if (typeof forceCorrectViewBox === 'function') {
                forceCorrectViewBox();
            }
            
            // 🔧 PASO 2: Conversión 100% precisa usando createSVGPoint
            const pt = tracingSvg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            
            // Obtener la matriz de transformación actual del SVG
            const svgMatrix = tracingSvg.getScreenCTM().inverse();
            
            // Convertir las coordenadas de pantalla a coordenadas SVG EXACTAS
            const svgPoint = pt.matrixTransform(svgMatrix);
            
            return { x: svgPoint.x, y: svgPoint.y };
        } catch (error) {
            console.warn('Error converting coordinates for image manipulation:', error);
            // Fallback robusto
            const tracingSvg = document.getElementById('tracingSvg');
            const rect = tracingSvg.getBoundingClientRect();
            const viewBox = tracingSvg.viewBox.baseVal;
            
            // Conversión manual como último recurso
            const x = ((e.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
            const y = ((e.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;
            
            return { x, y };
        }
    }

    bgRect.addEventListener('mousedown', function(e) {
        if (isNavigationMode || isLocked) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        isDragging = true;
        setManipulationState(true);
        
        const coords = getRelativeCoords(e);
        startMouse.x = coords.x;
        startMouse.y = coords.y;
        
        startRect.x = parseFloat(bgRect.getAttribute('x'));
        startRect.y = parseFloat(bgRect.getAttribute('y'));
        startRect.width = parseFloat(bgRect.getAttribute('width'));
        startRect.height = parseFloat(bgRect.getAttribute('height'));
        
        document.body.style.userSelect = 'none';
        bgGroup.style.opacity = '0.7';
    });

    resizeHandle.addEventListener('mousedown', function(e) {
        if (isNavigationMode || isLocked) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        isResizing = true;
        setManipulationState(true);
        
        const coords = getRelativeCoords(e);
        startMouse.x = coords.x;
        startMouse.y = coords.y;
        
        startRect.x = parseFloat(bgRect.getAttribute('x'));
        startRect.y = parseFloat(bgRect.getAttribute('y'));
        startRect.width = parseFloat(bgRect.getAttribute('width'));
        startRect.height = parseFloat(bgRect.getAttribute('height'));
        
        document.body.style.userSelect = 'none';
        bgGroup.style.opacity = '0.7';
    });

    function handleMouseMove(e) {
        if (!isDragging && !isResizing) return;
        
        e.preventDefault();
        
        const coords = getRelativeCoords(e);
        
        if (isDragging) {
            const deltaX = coords.x - startMouse.x;
            const deltaY = coords.y - startMouse.y;
            
            // ✅ MURALLA INVISIBLE ELIMINADA COMPLETAMENTE - MOVIMIENTO TOTALMENTE LIBRE
            const newX = startRect.x + deltaX;
            const newY = startRect.y + deltaY;
            
            bgRect.setAttribute('x', newX);
            bgRect.setAttribute('y', newY);
            
            updateImagePattern(newX, newY, startRect.width, startRect.height);
            
            resizeHandle.setAttribute('cx', newX + startRect.width);
            resizeHandle.setAttribute('cy', newY + startRect.height);
            
            updateLockPosition();
            
        } else if (isResizing) {
            const deltaX = coords.x - startMouse.x;
            const deltaY = coords.y - startMouse.y;
            const delta = Math.max(deltaX, deltaY);
            
            // ✅ REDIMENSIONAMIENTO LIBRE - SOLO LÍMITE MÍNIMO RAZONABLE
            const newWidth = Math.max(30, startRect.width + delta);
            const newHeight = newWidth / originalRatio;
            
            bgRect.setAttribute('width', newWidth);
            bgRect.setAttribute('height', newHeight);
            
            updateImagePattern(startRect.x, startRect.y, newWidth, newHeight);
            
            resizeHandle.setAttribute('cx', startRect.x + newWidth);
            resizeHandle.setAttribute('cy', startRect.y + newHeight);
            
            updateLockPosition();
        }
    }

    function handleMouseUp(e) {
        const wasManipulatingNow = isDragging || isResizing;
        
        if (isDragging) {
            isDragging = false;
            showStatus('📍 Imagen reposicionada - Movimiento COMPLETAMENTE LIBRE');
        }
        if (isResizing) {
            isResizing = false;
            showStatus('📏 Imagen redimensionada');
        }
        
        if (wasManipulatingNow) {
            document.body.style.userSelect = '';
            bgGroup.style.opacity = '0.9';
            
            const currentPlan = plans[currentPlanIndex];
            currentPlan.currentTool = null;
            
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            setTimeout(() => {
                showStatus('🔧 Herramientas deseleccionadas automáticamente');
            }, 1000);
        }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    bgGroup.addEventListener('click', function(e) {
        const currentPlan = plans[currentPlanIndex];
        
        if (!isNavigationMode && currentPlan.currentTool && !wasManipulating) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    bgRect.addEventListener('click', function(e) {
        const currentPlan = plans[currentPlanIndex];
        
        if (!isNavigationMode && currentPlan.currentTool && !wasManipulating) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    resizeHandle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
    
    bgGroup.addEventListener('remove', function() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    lockButton.addEventListener('mouseenter', function() {
        lockBg.setAttribute('stroke-width', '3');
    });

    lockButton.addEventListener('mouseleave', function() {
        lockBg.setAttribute('stroke-width', '2');
    });
}

function loadSVGFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const svgContent = e.target.result;
        const svgId = svgCounter++;
        addSVGToBoard(svgContent, file.name, svgId);
        loadedSVGs.push({ 
            name: file.name, 
            content: svgContent, 
            id: svgId,
            scale: 1 
        });
        updatePlanInfo();
        showStatus(`✅ ${file.name} cargado exitosamente`);
    };
    reader.readAsText(file);
}

function addSVGToBoard(svgContent, fileName, svgId) {
    const svgLayer = document.getElementById('svgLayer');
    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'svg-element';
    svgWrapper.setAttribute('data-svg-id', svgId);
    svgWrapper.title = fileName;
    
    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    svgContainer.innerHTML = svgContent;
    
    svgWrapper.appendChild(svgContainer);
    svgLayer.appendChild(svgWrapper);
}

// ================================
// FUNCIONES DE GESTIÓN DE PLANOS
// ================================

function addNewPlan() {
    const newPlanId = plans.length;
    const newPlan = {
        id: newPlanId,
        title: `Plano ${newPlanId + 1}`,
        format: currentFormat,
        mainTitle: 'NUEVO PROYECTO',
        subtitle: 'Descripción del plano',
        svgs: [],
        northRotation: 0,
        titlePosition: { x: 30, y: 30 },
        subtitlePosition: { x: 30, y: 70 },
        northPosition: { x: null, y: 30 },
        tracingElements: [],
        tracingConnections: [],
        tracingScale: 50,
        tracingMode: false,
        currentTool: null,
        pdfBackground: null
    };
    
    plans.push(newPlan);
    updatePlansPanel();
    switchToPlan(newPlanId);
    
    showStatus(`✅ Nuevo plano creado: ${newPlan.title}`);
}

function switchToPlan(planIndex) {
    if (planIndex >= 0 && planIndex < plans.length) {
        saveCurrentPlanState();
        currentPlanIndex = planIndex;
        loadCurrentPlan();
        updatePlansPanel();
        
        showStatus(`📋 Cambiado a: ${plans[planIndex].title}`);
    }
}

function saveCurrentPlanState() {
    const currentPlan = plans[currentPlanIndex];
    
    // Los títulos y rosa de vientos son ahora dinámicos
    // No hay elementos fijos que guardar
    
    currentPlan.format = currentFormat;
    currentPlan.tracingMode = isNavigationMode;
    
    const bgRect = document.getElementById('pdfBackground');
    if (bgRect && currentPlan.pdfBackground) {
        currentPlan.pdfBackground.x = parseFloat(bgRect.getAttribute('x'));
        currentPlan.pdfBackground.y = parseFloat(bgRect.getAttribute('y'));
        currentPlan.pdfBackground.width = parseFloat(bgRect.getAttribute('width'));
        currentPlan.pdfBackground.height = parseFloat(bgRect.getAttribute('height'));
    }
}

function loadCurrentPlan() {
    const currentPlan = plans[currentPlanIndex];
    
    currentFormat = currentPlan.format;
    changeFormat(currentFormat);
    
    // Los títulos y rosa de vientos son ahora dinámicos
    // No hay elementos fijos que cargar
    
    loadedSVGs = [...currentPlan.svgs];
    
    loadedSVGs.forEach(svg => {
        addSVGToBoard(svg.content, svg.name, svg.id);
    });
    
    if (typeof clearTracingSVG === 'function') {
        clearTracingSVG();
    }
    
    if (typeof createTracingSVGElement === 'function') {
        currentPlan.tracingElements.forEach(element => {
            createTracingSVGElement(element);
        });
    }
    
    if (typeof createTracingConnectionVisual === 'function') {
        currentPlan.tracingConnections.forEach(conn => {
            createTracingConnectionVisual(conn.from, conn.to);
        });
    }
    
    if (currentPlan.pdfBackground) {
        const bg = currentPlan.pdfBackground;
        addPDFBackground(bg.imageData, bg.width, bg.height);
        
        setTimeout(() => {
            const bgRect = document.getElementById('pdfBackground');
            const resizeHandle = document.getElementById('resizeHandle');
            
            if (bgRect && bg.x !== undefined && bg.y !== undefined) {
                bgRect.setAttribute('x', bg.x);
                bgRect.setAttribute('y', bg.y);
                
                if (resizeHandle) {
                    resizeHandle.setAttribute('cx', bg.x + bg.width);
                    resizeHandle.setAttribute('cy', bg.y + bg.height);
                }
            }
        }, 100);
    }
    
    isNavigationMode = currentPlan.tracingMode;
    if (typeof updateModeButton === 'function') {
        updateModeButton();
    }
    if (typeof updateScaleButton === 'function') {
        updateScaleButton(currentPlan.tracingScale);
    }
    
    zoomLevel = 1;
    const zoomContainer = document.getElementById('zoomContainer');
    if (zoomContainer) {
        zoomContainer.style.transform = `scale(${zoomLevel})`;
    }
    
    updatePlanInfo();
}

// CORREGIDO: Actualizar información del plano con dimensiones en milímetros
function updatePlanInfo() {
    const info = document.getElementById('planInfo');
    const format = formats[currentFormat];
    const fileCount = plans[currentPlanIndex].pdfBackground ? 1 : 0;
    info.textContent = `${format.name} (${format.realWidth} × ${format.realHeight} mm) | Archivos: ${fileCount}`;
}

function updatePlansPanel() {
    const plansList = document.getElementById('plansList');
    const plansCounter = document.getElementById('plansCounter');
    
    plansCounter.textContent = `Planos generados: ${plans.length}`;
    plansList.innerHTML = '';
    
    plans.forEach((plan, index) => {
        const planItem = document.createElement('div');
        planItem.className = `plan-item ${index === currentPlanIndex ? 'active' : ''}`;
        
        planItem.innerHTML = `
            <div class="plan-item-content" onclick="switchToPlan(${index})">
                <div class="plan-item-title">📄 ${plan.title}</div>
                <div class="plan-item-info">${plan.format} • ${index === currentPlanIndex ? 'Activo' : 'Inactivo'}</div>
            </div>
        `;
        
        plansList.appendChild(planItem);
    });
}

// ================================
// FUNCIONES DE INTERFAZ DE USUARIO
// ================================

function setupZoom() {
    const workspace = document.getElementById('workspace');
    
    if (!workspace) {
        console.warn('Workspace element not found');
        return;
    }
    
    let panX = 0, panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;
    
    workspace.addEventListener('wheel', function(e) {
        if (isNavigationMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
        
        if (newZoom !== zoomLevel) {
            zoomLevel = newZoom;
            const zoomContainer = document.getElementById('zoomContainer');
            if (zoomContainer) {
                // Zoom centrado con pan
                zoomContainer.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
                zoomContainer.style.transformOrigin = 'center center';
                showStatus(`🔍 Zoom: ${Math.round(zoomLevel * 100)}%`);
            }
        }
    });
    
    // Pan con botón central del mouse
    workspace.addEventListener('mousedown', function(e) {
        if (e.button === 1) { // Botón central
            e.preventDefault();
            isPanning = true;
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            workspace.style.cursor = 'move';
        }
    });
    
    workspace.addEventListener('mousemove', function(e) {
        if (isPanning) {
            e.preventDefault();
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            
            const zoomContainer = document.getElementById('zoomContainer');
            if (zoomContainer) {
                zoomContainer.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
            }
        }
    });
    
    workspace.addEventListener('mouseup', function(e) {
        if (e.button === 1) {
            isPanning = false;
            workspace.style.cursor = 'auto';
        }
    });
    
    // Evitar menú contextual con botón central
    workspace.addEventListener('contextmenu', function(e) {
        if (e.button === 1) {
            e.preventDefault();
        }
    });
    
    console.log('Zoom setup completed');
}

function setupDraggableElements() {
    // Los elementos de texto y rosa son ahora dinámicos
    // No hay elementos fijos que configurar
}

// 🔧 SISTEMA GLOBAL DE ARRASTRE (UNA SOLA VEZ PARA TODO)
let globalDragSystem = {
    initialized: false,
    currentElement: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
};

function initializeGlobalDragSystem() {
    if (globalDragSystem.initialized) return;
    
    // ✅ EVENT LISTENERS GLOBALES (SOLO UNA VEZ PARA TODO EL SISTEMA)
    document.addEventListener('mousemove', function(e) {
        if (!globalDragSystem.isDragging || !globalDragSystem.currentElement) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const deltaX = e.clientX - globalDragSystem.startX;
        const deltaY = e.clientY - globalDragSystem.startY;
        
        const newLeft = globalDragSystem.startLeft + deltaX;
        const newTop = globalDragSystem.startTop + deltaY;
        
        // Movimiento completamente libre
        globalDragSystem.currentElement.style.left = newLeft + 'px';
        globalDragSystem.currentElement.style.top = newTop + 'px';
        globalDragSystem.currentElement.style.right = 'auto';
    });

    document.addEventListener('mouseup', function(e) {
        if (!globalDragSystem.isDragging || !globalDragSystem.currentElement) return;
        
        // ✅ LIMPIAR ESTADO GLOBAL
        globalDragSystem.currentElement.classList.remove('dragging');
        globalDragSystem.currentElement.style.zIndex = 'auto';
        globalDragSystem.currentElement.style.cursor = 'move';
        
        globalDragSystem.isDragging = false;
        globalDragSystem.currentElement = null;
        
        showStatus('📍 Elemento reposicionado correctamente');
        
        e.preventDefault();
        e.stopPropagation();
    });

    globalDragSystem.initialized = true;
    console.log('✅ Sistema global de arrastre inicializado');
}

// 🔧 FUNCIÓN SIMPLIFICADA: makeDraggableElement 
function makeDraggableElement(element) {
    if (!element) {
        console.warn('Element not found for makeDraggableElement');
        return;
    }
    
    // Inicializar sistema global si no está listo
    initializeGlobalDragSystem();

    // ✅ FUNCIÓN AUXILIAR: Obtener posición actual del elemento
    function getCurrentPosition() {
        const rect = element.getBoundingClientRect();
        const boardRect = document.getElementById('drawingBoard').getBoundingClientRect();
        
        return {
            left: rect.left - boardRect.left,
            top: rect.top - boardRect.top
        };
    }

    // ✅ EVENT LISTENER PARA MOUSE DOWN (INDIVIDUAL PARA CADA ELEMENTO)
    element.addEventListener('mousedown', function(e) {
        // Ignorar si es input o botón
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // ✅ CONFIGURAR ESTADO GLOBAL PARA ESTE ELEMENTO
        globalDragSystem.currentElement = element;
        globalDragSystem.isDragging = true;
        globalDragSystem.startX = e.clientX;
        globalDragSystem.startY = e.clientY;
        
        // Obtener posición actual
        const currentPos = getCurrentPosition();
        globalDragSystem.startLeft = currentPos.left;
        globalDragSystem.startTop = currentPos.top;
        
        // Aplicar estilos temporales
        element.classList.add('dragging');
        element.style.zIndex = 1000;
        element.style.cursor = 'grabbing';
        
        showStatus(`🖱️ Arrastrando ${element.id}...`);
    });

    // ✅ CURSORES VISUALES (INDIVIDUAL PARA CADA ELEMENTO)
    element.addEventListener('mouseenter', function() {
        if (!globalDragSystem.isDragging) {
            element.style.cursor = 'move';
        }
    });

    element.addEventListener('mouseleave', function() {
        if (!globalDragSystem.isDragging) {
            element.style.cursor = 'auto';
        }
    });

    console.log(`✅ Elemento ${element.id} registrado en sistema global de arrastre`);
}

function setupEditableTexts() {
    // No hay textos editables fijos - ahora son dinámicos
}

function setupDragAndDrop() {
    const workspace = document.querySelector('.workspace');
    
    workspace.addEventListener('dragover', function(e) {
        e.preventDefault();
        workspace.style.backgroundColor = '#d5f4e6';
    });

    workspace.addEventListener('dragleave', function() {
        workspace.style.backgroundColor = '#ecf0f1';
    });

    workspace.addEventListener('drop', function(e) {
        e.preventDefault();
        workspace.style.backgroundColor = '#ecf0f1';
        handlePDFFiles(e.dataTransfer.files);
    });
}

// ================================
// FUNCIONES DE CONTROL
// ================================

// 🔧 FUNCIÓN DEFINITIVA: changeFormat ROBUSTA AL 100%
function changeFormat(format) {
    currentFormat = format;
    
    document.querySelectorAll('.format-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn${format}`).classList.add('active');
    
    const board = document.getElementById('drawingBoard');
    const externalTitle = document.getElementById('planTitle');
    
    board.className = `drawing-board format-${format.toLowerCase()}`;
    externalTitle.textContent = `PLANO PROFESIONAL - ${format}`;
    
    // 🔧 PASO 1: FORZAR configuración correcta INMEDIATA
    const tracingSvg = document.getElementById('tracingSvg');
    const formatData = formats[format];
    
    // FORZAR viewBox correcto en el DOM
    tracingSvg.setAttribute('viewBox', `0 0 ${formatData.width} ${formatData.height}`);
    
    // FORZAR currentViewBox sincronizado 
    currentViewBox = { 
        x: 0, 
        y: 0, 
        width: formatData.width, 
        height: formatData.height 
    };
    
    // 🔧 PASO 2: VALIDAR que se aplicó correctamente
    const appliedViewBox = tracingSvg.getAttribute('viewBox');
    if (appliedViewBox !== `0 0 ${formatData.width} ${formatData.height}`) {
        console.error('❌ ViewBox no se aplicó correctamente:', appliedViewBox);
        // Forzar de nuevo
        setTimeout(() => {
            tracingSvg.setAttribute('viewBox', `0 0 ${formatData.width} ${formatData.height}`);
        }, 50);
    }
    
    // 🔧 PASO 3: FORZAR función auxiliar si existe
    if (typeof forceCorrectViewBox === 'function') {
        forceCorrectViewBox();
    }
    
    // 🔧 PASO 4: ASEGURAR que updateTracingViewBox use datos correctos
    if (typeof updateTracingViewBox === 'function') {
        updateTracingViewBox();
    }
    
    updatePlanInfo();
    showStatus(`✅ Formato ${format} - ViewBox: ${formatData.width}×${formatData.height}px - ÁREA COMPLETA FORZADA`);
    
    console.log(`🔧 changeFormat DEFINITIVO: ${format} → viewBox: "${appliedViewBox}" → currentViewBox: ${formatData.width}×${formatData.height}`);
}

// ================================
// FUNCIONES DE EXPORTACIÓN
// ================================

function downloadPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const format = formats[currentFormat];
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: currentFormat === 'A1' ? 'a1' : 'a0'
        });

        const board = document.getElementById('drawingBoard');
        
        if (typeof html2canvas !== 'undefined') {
            html2canvas(board, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png', 1.0);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                
                const fileName = `Plano_${currentFormat}_${new Date().toISOString().slice(0,10)}.pdf`;
                pdf.save(fileName);
                
                showStatus(`✅ PDF descargado: ${fileName}`);
            });
        }

    } catch (error) {
        console.error('Error generating PDF:', error);
        showStatus('❌ Error al generar PDF');
    }
}

// ================================
// FUNCIONES DE EMAIL
// ================================

function showEmailModal() {
    document.getElementById('emailModal').style.display = 'block';
}

function hideEmailModal() {
    document.getElementById('emailModal').style.display = 'none';
}

function sendEmail() {
    const email = document.getElementById('emailInput').value;
    const subject = document.getElementById('subjectInput').value;
    
    if (!email) {
        alert('Por favor ingresa un email válido');
        return;
    }

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Adjunto encontrarás el plano profesional solicitado.')}`;
    window.location.href = mailtoLink;
    
    hideEmailModal();
    showStatus('✅ Cliente de email abierto');
}