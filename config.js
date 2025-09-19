// ================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ================================

// Variables principales del editor
let currentFormat = 'A1';
let loadedSVGs = []; // Mantenido por compatibilidad pero no se usa
let svgCounter = 0;  // Mantenido por compatibilidad pero no se usa
let selectedElement = null;
let northRotation = 0;

// Variables para múltiples planos
let plans = [
    {
        id: 0,
        title: 'Plano Principal',
        format: 'A1',
        mainTitle: 'PROYECTO ARQUITECTÓNICO',
        subtitle: 'Planta General - Escala 1:100',
        svgs: [],
        northRotation: 0,
        titlePosition: { x: 30, y: 30 },
        subtitlePosition: { x: 30, y: 70 },
        northPosition: { x: null, y: 30 },
        // Variables de trazado
        tracingElements: [],
        tracingConnections: [],
        tracingScale: 50,
        tracingMode: false,
        currentTool: null,
        pdfBackground: null,
        selectedElement: null
    }
];
let currentPlanIndex = 0;

// Variables para zoom
let zoomLevel = 1;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

// Variables para trazado inteligente
let isNavigationMode = false;
let isPanning = false;
let startPanPoint = { x: 0, y: 0 };
// 🔧 CORRECCIÓN CRÍTICA: currentViewBox inicial sincronizado con área visual CSS
let currentViewBox = { x: 0, y: 0, width: 900, height: 630 };
let elementCounter = 0;
let camaraCounter = 0;

// Variables para manipulación de imágenes
let isDraggingImage = false;
let isResizingImage = false;
let imageStartPos = { x: 0, y: 0 };
let imageStartSize = { width: 0, height: 0 };

// Variables para PDF
let currentPDF = null;
let currentPage = 1;
let totalPages = 0;

// ================================
// CONSTANTES DE CONFIGURACIÓN
// ================================

// 🔧 CORRECCIÓN DEFINITIVA: Formatos sincronizados con área visual CSS
const formats = {
    A1: { 
        width: 900,      // ← CORREGIDO: Coincide con CSS (.format-a1)
        height: 630,     // ← CORREGIDO: Coincide con CSS (.format-a1)  
        name: 'A1', 
        realWidth: 594,  // ← MANTENER: Referencia real en mm
        realHeight: 841  // ← MANTENER: Referencia real en mm
    },
    A0: { 
        width: 1300,     // ← CORREGIDO: Coincide con CSS (.format-a0)
        height: 920,     // ← CORREGIDO: Coincide con CSS (.format-a0)
        name: 'A0', 
        realWidth: 841,  // ← MANTENER: Referencia real en mm
        realHeight: 1189 // ← MANTENER: Referencia real en mm
    }
};

// Constantes para elementos de trazado (escaladas para mm)
const BASE_CIRCLE_RADIUS = {
    sanitario: 5,     // CORREGIDO: Proporción para mm
    infraestructura: 8 // CORREGIDO: Proporción para mm
};

const BASE_STROKE_WIDTH = {
    element: 1,  // CORREGIDO: Proporción para mm
    pipe: 2     // CORREGIDO: Proporción para mm
};

const BASE_FONT_SIZE = {
    element: 8,      // CORREGIDO: Proporción para mm
    elementLarge: 10, // CORREGIDO: Proporción para mm
    connection: 6    // CORREGIDO: Proporción para mm
};

// Normativa de descargas sanitarias
const NORMATIVA_DESCARGAS = {
    'wc': { tuberia_diametro: 110, symbol: '🚽', color: '#ef4444' },
    'lavatorio': { tuberia_diametro: 40, symbol: '🚰', color: '#3b82f6' },
    'bano-tina': { tuberia_diametro: 50, symbol: '🛁', color: '#8b5cf6' },
    'ducha': { tuberia_diametro: 50, symbol: '🚿', color: '#06b6d4' },
    'bidet': { tuberia_diametro: 40, symbol: '🪑', color: '#f59e0b' },
    'urinario': { tuberia_diametro: 50, symbol: '🚹', color: '#10b981' },
    'lavaplatos': { tuberia_diametro: 50, symbol: '🍽️', color: '#f97316' },
    'lavacopas': { tuberia_diametro: 40, symbol: '🍷', color: '#ec4899' },
    'lavadora': { tuberia_diametro: 50, symbol: '🧺', color: '#6366f1' },
    'lavadero': { tuberia_diametro: 50, symbol: '🧽', color: '#84cc16' }
};

// Símbolos de infraestructura
const INFRAESTRUCTURA_SYMBOLS = {
    'camara-inspeccion': { symbol: '⚫', color: '#1f2937' },
    'camara-publica': { symbol: '🔴', color: '#dc2626' },
    'caja-registro': { symbol: '▣', color: '#374151' },
    'punto-descarga': { symbol: '💧', color: '#fbbf24' }
};

// ================================
// FUNCIONES COMPARTIDAS
// ================================

function showStatus(message, duration = 3000) {
    const statusBar = document.getElementById('statusBar');
    statusBar.textContent = message;
    statusBar.style.display = 'block';
    
    setTimeout(() => {
        statusBar.style.display = 'none';
    }, duration);
}

// 🔧 NUEVA FUNCIÓN: Sincronizar currentViewBox con formato actual
function syncCurrentViewBox() {
    const formatData = formats[currentFormat];
    currentViewBox = { 
        x: 0, 
        y: 0, 
        width: formatData.width, 
        height: formatData.height 
    };
    console.log(`🔧 currentViewBox sincronizado con ${currentFormat}: ${formatData.width}×${formatData.height}px`);
}

// 🔧 FUNCIÓN DEFINITIVA: FUERZA VIEWBOX CORRECTO SIEMPRE (DISPONIBLE GLOBALMENTE)
function forceCorrectViewBox() {
    const tracingSvg = document.getElementById('tracingSvg');
    if (!tracingSvg) {
        console.warn('TracingSvg not found in forceCorrectViewBox');
        return { width: 900, height: 630 }; // Default A1 CORREGIDO
    }
    
    const currentFormat = plans[currentPlanIndex].format;
    const formatData = formats[currentFormat];
    
    // FORZAR viewBox correcto SIEMPRE en el DOM
    tracingSvg.setAttribute('viewBox', `0 0 ${formatData.width} ${formatData.height}`);
    
    // FORZAR currentViewBox sincronizado SIEMPRE
    currentViewBox = { 
        x: 0, 
        y: 0, 
        width: formatData.width, 
        height: formatData.height 
    };
    
    // Validar que se aplicó
    const appliedViewBox = tracingSvg.getAttribute('viewBox');
    const expectedViewBox = `0 0 ${formatData.width} ${formatData.height}`;
    
    if (appliedViewBox !== expectedViewBox) {
        console.error(`❌ forceCorrectViewBox FALLÓ: Aplicado="${appliedViewBox}" vs Esperado="${expectedViewBox}"`);
        // Re-intentar inmediatamente
        tracingSvg.setAttribute('viewBox', expectedViewBox);
    }
    
    return { width: formatData.width, height: formatData.height };
}