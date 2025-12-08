const { PDFDocument } = PDFLib;

// State
let mergeFiles = [];
let splitFile = null;
let splitPdfDoc = null;
let organizeFile = null;
let organizePdfDoc = null;
let organizePageCount = 0;
let organizePdfJsDoc = null; // Für Thumbnails

// Global State for "Continue Editing"
let lastGeneratedPdf = {
    bytes: null,
    name: null
};

// DOM Elements
const mergeTab = document.getElementById('merge-tab');
const splitTab = document.getElementById('split-tab');
const organizeTab = document.getElementById('organize-tab');
const tabButtons = document.querySelectorAll('.tab-button');

const mergeUploadArea = document.getElementById('merge-upload');
const mergeFileInput = document.getElementById('merge-file-input');
const mergeFilesList = document.getElementById('merge-files-list');
const mergeButton = document.getElementById('merge-button');

const splitUploadArea = document.getElementById('split-upload');
const splitFileInput = document.getElementById('split-file-input');
const splitInfo = document.getElementById('split-info');
const splitFilename = document.getElementById('split-filename');
const splitPages = document.getElementById('split-pages');
const splitAtPageInput = document.getElementById('split-at-page');
const splitButton = document.getElementById('split-button');
const extractFromInput = document.getElementById('extract-from');
const extractToInput = document.getElementById('extract-to');
const extractButton = document.getElementById('extract-button');

const organizeUploadArea = document.getElementById('organize-upload');
const organizeFileInput = document.getElementById('organize-file-input');
const organizeWorkspace = document.getElementById('organize-workspace');
const pageGrid = document.getElementById('page-grid');
const organizeDownloadBtn = document.getElementById('organize-download');

// Organize Tools
const btnMove = document.getElementById('btn-move');
const btnSwap = document.getElementById('btn-swap');
const btnRotate = document.getElementById('btn-rotate');
const btnDelete = document.getElementById('btn-delete');

const loading = document.getElementById('loading');
const status = document.getElementById('status');

// Tab Switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Switch tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// ========== MERGE FUNCTIONALITY ==========

// Upload area interactions
mergeUploadArea.addEventListener('click', () => mergeFileInput.click());
mergeFileInput.addEventListener('change', (e) => handleMergeFiles(e.target.files));

// Drag and drop
mergeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    mergeUploadArea.classList.add('dragover');
});

mergeUploadArea.addEventListener('dragleave', () => {
    mergeUploadArea.classList.remove('dragover');
});

mergeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    mergeUploadArea.classList.remove('dragover');
    handleMergeFiles(e.dataTransfer.files);
});

function handleMergeFiles(files) {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
        showStatus('Bitte nur PDF-Dateien hochladen!', true);
        return;
    }
    
    mergeFiles.push(...pdfFiles);
    renderMergeFilesList();
    mergeButton.disabled = mergeFiles.length < 2;
}

function renderMergeFilesList() {
    mergeFilesList.innerHTML = '';
    
    mergeFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.draggable = true;
        fileItem.dataset.index = index;
        
        fileItem.innerHTML = `
            <div class="file-info">
                <span class="drag-handle">☰</span>
                <span class="file-icon">📄</span>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${(file.size / 1024).toFixed(1)} KB</p>
                </div>
            </div>
            <div class="file-actions">
                <button class="remove-button" onclick="removeMergeFile(${index})">Entfernen</button>
            </div>
        `;
        
        // Drag and drop for reordering
        fileItem.addEventListener('dragstart', handleDragStart);
        fileItem.addEventListener('dragover', handleDragOver);
        fileItem.addEventListener('drop', handleDrop);
        fileItem.addEventListener('dragend', handleDragEnd);
        
        mergeFilesList.appendChild(fileItem);
    });
}

let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const dropIndex = parseInt(e.target.closest('.file-item').dataset.index);
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        const draggedFile = mergeFiles[draggedIndex];
        mergeFiles.splice(draggedIndex, 1);
        mergeFiles.splice(dropIndex, 0, draggedFile);
        renderMergeFilesList();
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedIndex = null;
}

function removeMergeFile(index) {
    mergeFiles.splice(index, 1);
    renderMergeFilesList();
    mergeButton.disabled = mergeFiles.length < 2;
}

// Merge PDFs
mergeButton.addEventListener('click', async () => {
    if (mergeFiles.length < 2) return;
    
    showLoading(true);
    
    try {
        const mergedPdf = await PDFDocument.create();
        
        for (const file of mergeFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        
        const pdfBytes = await mergedPdf.save();
        downloadPDF(pdfBytes, 'merged.pdf');
        
        showStatus(`${mergeFiles.length} PDFs erfolgreich zusammengeführt!`);
        
        // Reset
        mergeFiles = [];
        renderMergeFilesList();
        mergeButton.disabled = true;
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Zusammenführen der PDFs!', true);
    } finally {
        showLoading(false);
    }
});

// ========== SPLIT FUNCTIONALITY ==========

splitUploadArea.addEventListener('click', () => splitFileInput.click());
splitFileInput.addEventListener('change', (e) => handleSplitFile(e.target.files[0]));

splitUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    splitUploadArea.classList.add('dragover');
});

splitUploadArea.addEventListener('dragleave', () => {
    splitUploadArea.classList.remove('dragover');
});

splitUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    splitUploadArea.classList.remove('dragover');
    handleSplitFile(e.dataTransfer.files[0]);
});

async function handleSplitFile(file) {
    if (!file || file.type !== 'application/pdf') {
        showStatus('Bitte eine PDF-Datei hochladen!', true);
        return;
    }
    
    showLoading(true);
    
    try {
        splitFile = file;
        const arrayBuffer = await file.arrayBuffer();
        splitPdfDoc = await PDFDocument.load(arrayBuffer);
        
        const pageCount = splitPdfDoc.getPageCount();
        
        splitFilename.textContent = file.name;
        splitPages.textContent = `${pageCount} Seiten`;
        
        splitAtPageInput.max = pageCount - 1;
        extractFromInput.max = pageCount;
        extractToInput.max = pageCount;
        
        splitInfo.classList.remove('hidden');
        splitUploadArea.style.display = 'none';
        
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Laden der PDF!', true);
    } finally {
        showLoading(false);
    }
}

// Split PDF
splitButton.addEventListener('click', async () => {
    const splitAt = parseInt(splitAtPageInput.value);
    const pageCount = splitPdfDoc.getPageCount();
    
    if (!splitAt || splitAt < 1 || splitAt >= pageCount) {
        showStatus(`Bitte eine Seite zwischen 1 und ${pageCount - 1} eingeben!`, true);
        return;
    }
    
    showLoading(true);
    
    try {
        // First part
        const pdf1 = await PDFDocument.create();
        const pages1 = await pdf1.copyPages(splitPdfDoc, Array.from({length: splitAt}, (_, i) => i));
        pages1.forEach(page => pdf1.addPage(page));
        const pdfBytes1 = await pdf1.save();
        downloadPDF(pdfBytes1, `${splitFile.name.replace('.pdf', '')}_Teil1.pdf`);
        
        // Second part
        const pdf2 = await PDFDocument.create();
        const pages2 = await pdf2.copyPages(splitPdfDoc, Array.from({length: pageCount - splitAt}, (_, i) => i + splitAt));
        pages2.forEach(page => pdf2.addPage(page));
        const pdfBytes2 = await pdf2.save();
        downloadPDF(pdfBytes2, `${splitFile.name.replace('.pdf', '')}_Teil2.pdf`);
        
        showStatus('PDF erfolgreich geteilt!');
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Teilen der PDF!', true);
    } finally {
        showLoading(false);
    }
});

// Extract pages
extractButton.addEventListener('click', async () => {
    const from = parseInt(extractFromInput.value);
    const to = parseInt(extractToInput.value);
    const pageCount = splitPdfDoc.getPageCount();
    
    if (!from || !to || from < 1 || to > pageCount || from > to) {
        showStatus('Bitte gültige Seitenzahlen eingeben!', true);
        return;
    }
    
    showLoading(true);
    
    try {
        const extractedPdf = await PDFDocument.create();
        const pages = await extractedPdf.copyPages(
            splitPdfDoc, 
            Array.from({length: to - from + 1}, (_, i) => i + from - 1)
        );
        pages.forEach(page => extractedPdf.addPage(page));
        
        const pdfBytes = await extractedPdf.save();
        downloadPDF(pdfBytes, `${splitFile.name.replace('.pdf', '')}_Seiten${from}-${to}.pdf`);
        
        showStatus(`Seiten ${from}-${to} erfolgreich extrahiert!`);
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Extrahieren der Seiten!', true);
    } finally {
        showLoading(false);
    }
});

// ========== ORGANIZE FUNCTIONALITY ==========

organizeUploadArea.addEventListener('click', () => organizeFileInput.click());
organizeFileInput.addEventListener('change', (e) => handleOrganizeFile(e.target.files[0]));

organizeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    organizeUploadArea.classList.add('dragover');
});

organizeUploadArea.addEventListener('dragleave', () => {
    organizeUploadArea.classList.remove('dragover');
});

organizeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    organizeUploadArea.classList.remove('dragover');
    handleOrganizeFile(e.dataTransfer.files[0]);
});

async function handleOrganizeFile(file) {
    if (!file || file.type !== 'application/pdf') {
        showStatus('Bitte eine PDF-Datei hochladen!', true);
        return;
    }
    
    showLoading(true);
    
    try {
        organizeFile = file;
        const arrayBuffer = await file.arrayBuffer();
        
        // Load for manipulation (pdf-lib)
        organizePdfDoc = await PDFDocument.load(arrayBuffer);
        organizePageCount = organizePdfDoc.getPageCount();
        
        // Load for rendering (pdf.js) - Kopie des ArrayBuffers nötig, da pdf-lib ihn "konsumieren" könnte
        const loadingTask = pdfjsLib.getDocument(arrayBuffer.slice(0));
        organizePdfJsDoc = await loadingTask.promise;
        
        await renderPageGrid();
        
        organizeWorkspace.classList.remove('hidden');
        organizeUploadArea.style.display = 'none';
        
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Laden der PDF!', true);
    } finally {
        showLoading(false);
    }
}

async function renderPageGrid() {
    pageGrid.innerHTML = '';
    const pages = organizePdfDoc.getPages();
    
    // Wir müssen wissen, welche Original-Seite (Index) jetzt wo ist, um das richtige Thumbnail zu holen.
    // Da wir aber pdf-lib Objekte haben, ist es schwer, den ursprünglichen Index zu tracken, 
    // wenn wir Seiten verschieben/löschen.
    // Einfacher: Wir rendern IMMER neu basierend auf dem aktuellen PDF Zustand.
    // Das heißt: Wir müssen das aktuelle PDF (organizePdfDoc) speichern und neu in pdf.js laden.
    // Das ist performance-technisch nicht ideal, aber am sichersten für korrekte Thumbnails.
    
    // Um Performance zu sparen: Nur beim ersten Laden Thumbnails generieren? 
    // Nein, wenn wir Seiten löschen/verschieben, ändert sich die Struktur.
    
    // Bessere Strategie: Wir speichern das aktuelle PDF als Bytes und laden es in pdf.js neu.
    const pdfBytes = await organizePdfDoc.save();
    const loadingTask = pdfjsLib.getDocument(pdfBytes);
    organizePdfJsDoc = await loadingTask.promise;

    for (let i = 0; i < organizePageCount; i++) {
        const pageNum = i + 1;
        const page = pages[i];
        const rotation = page.getRotation().angle;
        
        const card = document.createElement('div');
        card.className = 'page-card';
        
        // Canvas für Thumbnail
        const canvas = document.createElement('canvas');
        card.appendChild(canvas);
        
        const numberLabel = document.createElement('span');
        numberLabel.className = 'page-number';
        numberLabel.textContent = pageNum;
        card.appendChild(numberLabel);
        
        // Render Thumbnail (async)
        renderThumbnail(i + 1, canvas, rotation);
        
        card.title = `Seite ${pageNum}`;
        pageGrid.appendChild(card);
    }
}

async function renderThumbnail(pageNum, canvas, rotation) {
    try {
        const page = await organizePdfJsDoc.getPage(pageNum);
        
        // Scale für Thumbnail (kleiner = schneller)
        const viewport = page.getViewport({ scale: 0.3, rotation: rotation }); // Rotation direkt hier anwenden!
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
    } catch (e) {
        console.error("Thumbnail Error:", e);
    }
}

// Move Pages
btnMove.addEventListener('click', async () => {
    const from = parseInt(document.getElementById('move-from').value);
    const to = parseInt(document.getElementById('move-to').value);
    const insertAt = parseInt(document.getElementById('move-insert').value);
    
    if (!from || !to || !insertAt || from > to || to > organizePageCount || insertAt > organizePageCount + 1) {
        showStatus('Ungültige Eingabe beim Verschieben!', true);
        return;
    }
    
    showLoading(true);
    try {
        // Logic: Copy pages to new doc in new order is easiest, but modifying in place is better for state
        // Actually, pdf-lib allows removing and adding.
        // But reordering in place can be tricky with indices shifting.
        // Strategy: Create a NEW document with the desired order.
        
        const newPdf = await PDFDocument.create();
        const indices = [];
        
        // 0-based indices
        const startIdx = from - 1;
        const endIdx = to - 1;
        const insertIdx = insertAt - 1;
        
        // Create array of current indices [0, 1, 2, ...]
        let currentOrder = Array.from({length: organizePageCount}, (_, i) => i);
        
        // Extract the moving chunk
        const movingChunk = currentOrder.slice(startIdx, endIdx + 1);
        
        // Remove chunk from original array
        currentOrder.splice(startIdx, movingChunk.length);
        
        // Calculate new insertion point
        let adjustedInsertIdx = insertIdx;
        
        // Insert chunk at new position
        currentOrder.splice(adjustedInsertIdx, 0, ...movingChunk);
        
        // Now copy pages in this new order
        const copiedPages = await newPdf.copyPages(organizePdfDoc, currentOrder);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        organizePdfDoc = newPdf;
        organizePageCount = organizePdfDoc.getPageCount();
        await renderPageGrid(); // Await here because rendering takes time
        showStatus(`Seiten ${from}-${to} nach Position ${insertAt} verschoben.`);
        
    } catch (e) {
        console.error(e);
        showStatus('Fehler beim Verschieben!', true);
    } finally {
        showLoading(false);
    }
});

// Swap Pages
btnSwap.addEventListener('click', async () => {
    const pageA = parseInt(document.getElementById('swap-a').value);
    const pageB = parseInt(document.getElementById('swap-b').value);
    
    if (!pageA || !pageB || pageA > organizePageCount || pageB > organizePageCount) {
        showStatus('Ungültige Seitenzahlen!', true);
        return;
    }
    
    showLoading(true);
    try {
        const newPdf = await PDFDocument.create();
        const order = Array.from({length: organizePageCount}, (_, i) => i);
        
        // Swap indices
        const idxA = pageA - 1;
        const idxB = pageB - 1;
        [order[idxA], order[idxB]] = [order[idxB], order[idxA]];
        
        const copiedPages = await newPdf.copyPages(organizePdfDoc, order);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        organizePdfDoc = newPdf;
        await renderPageGrid();
        showStatus(`Seite ${pageA} und ${pageB} getauscht.`);
    } catch (e) {
        console.error(e);
        showStatus('Fehler beim Tauschen!', true);
    } finally {
        showLoading(false);
    }
});

// Rotate Page
btnRotate.addEventListener('click', async () => {
    const pageNum = parseInt(document.getElementById('rotate-page').value);
    
    if (!pageNum || pageNum > organizePageCount) {
        showStatus('Ungültige Seitenzahl!', true);
        return;
    }
    
    const page = organizePdfDoc.getPage(pageNum - 1);
    const currentRotation = page.getRotation().angle;
    page.setRotation(PDFLib.degrees(currentRotation + 90));
    
    await renderPageGrid();
    showStatus(`Seite ${pageNum} rotiert.`);
});

// Delete Page
btnDelete.addEventListener('click', async () => {
    const pageNum = parseInt(document.getElementById('delete-page').value);
    
    if (!pageNum || pageNum > organizePageCount) {
        showStatus('Ungültige Seitenzahl!', true);
        return;
    }
    
    showLoading(true);
    try {
        organizePdfDoc.removePage(pageNum - 1);
        organizePageCount = organizePdfDoc.getPageCount();
        await renderPageGrid();
        showStatus(`Seite ${pageNum} gelöscht.`);
    } catch (e) {
        console.error(e);
        showStatus('Fehler beim Löschen!', true);
    } finally {
        showLoading(false);
    }
});

// Download Organized PDF
organizeDownloadBtn.addEventListener('click', async () => {
    if (!organizePdfDoc) return;
    
    showLoading(true);
    try {
        const pdfBytes = await organizePdfDoc.save();
        downloadPDF(pdfBytes, `organized_${organizeFile.name}`);
        showStatus('PDF gespeichert!');
    } catch (e) {
        console.error(e);
        showStatus('Fehler beim Speichern!', true);
    } finally {
        showLoading(false);
    }
});

// ========== MISC FUNCTIONALITY ==========

const miscUploadArea = document.getElementById('misc-upload');
const miscFileInput = document.getElementById('misc-file-input');
const miscWorkspace = document.getElementById('misc-workspace');

// Navigation
const miscNavBtns = document.querySelectorAll('.misc-nav-btn');
const miscTools = document.querySelectorAll('.misc-tool-content');

// Signature Tool
const signatureFileInput = document.getElementById('signature-file-input');
const addSignatureBtn = document.getElementById('add-signature-btn');
const sigPrevPageBtn = document.getElementById('sig-prev-page');
const sigNextPageBtn = document.getElementById('sig-next-page');
const sigCurrentPageDisplay = document.getElementById('sig-current-page-display');
const sigSizeSlider = document.getElementById('sig-size-slider');
const valX = document.getElementById('val-x');
const valY = document.getElementById('val-y');
const sigPreviewCanvas = document.getElementById('sig-preview-canvas');
const sigPreviewImage = document.getElementById('sig-preview-image');
const sigPreviewContainer = document.getElementById('sig-preview-container');

// Text Tool
const extractTextBtn = document.getElementById('extract-text-btn');
const textPreviewArea = document.getElementById('text-preview-area');

// Blank Pages Tool
const insertBlankBtn = document.getElementById('insert-blank-btn');
const miscPageGrid = document.getElementById('misc-page-grid');

// State
let miscFile = null;
let miscPdfDoc = null;
let miscArrayBuffer = null;
let miscPdfJsDoc = null;

// Signature State
let sigImageBytes = null;
let sigImageType = null;
let sigCurrentPage = 1;
let sigX = 50;
let sigY = 50; // PDF Coordinates (bottom-left)
let sigWidth = 150;
let sigAspectRatio = 1;

// Blank Pages State
let selectedPagesForBlank = new Set();

// --- Event Listeners ---

// Tab Navigation
miscNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        miscNavBtns.forEach(b => b.classList.remove('active'));
        miscTools.forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tool-${btn.dataset.tool}`).classList.add('active');
        
        // Refresh views if needed
        if (btn.dataset.tool === 'signature' && miscFile) renderSignaturePreview();
        if (btn.dataset.tool === 'blank' && miscFile) renderMiscPageGrid();
    });
});

miscUploadArea.addEventListener('click', () => miscFileInput.click());
miscFileInput.addEventListener('change', (e) => handleMiscFile(e.target.files[0]));

miscUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    miscUploadArea.classList.add('dragover');
});

miscUploadArea.addEventListener('dragleave', () => {
    miscUploadArea.classList.remove('dragover');
});

miscUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    miscUploadArea.classList.remove('dragover');
    handleMiscFile(e.dataTransfer.files[0]);
});

async function handleMiscFile(file) {
    if (!file || file.type !== 'application/pdf') {
        showStatus('Bitte eine PDF-Datei hochladen!', true);
        return;
    }
    
    showLoading(true);
    
    try {
        miscFile = file;
        miscArrayBuffer = await file.arrayBuffer();
        miscPdfDoc = await PDFDocument.load(miscArrayBuffer);
        
        // Load for rendering
        const loadingTask = pdfjsLib.getDocument(miscArrayBuffer.slice(0));
        miscPdfJsDoc = await loadingTask.promise;
        
        miscWorkspace.classList.remove('hidden');
        miscUploadArea.style.display = 'none';
        
        // Init Views
        renderSignaturePreview();
        renderMiscPageGrid();
        
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Laden der PDF!', true);
    } finally {
        showLoading(false);
    }
}

// --- Signature Logic ---

// Drag & Drop Logic for Signature
let isDraggingSig = false;
let dragStartX, dragStartY;

// Allow dropping files onto the canvas wrapper to load them as signature
const sigCanvasWrapper = document.getElementById('sig-canvas-wrapper');

sigCanvasWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    sigCanvasWrapper.style.boxShadow = '0 0 30px var(--primary)';
});

sigCanvasWrapper.addEventListener('dragleave', () => {
    sigCanvasWrapper.style.boxShadow = '';
});

sigCanvasWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    sigCanvasWrapper.style.boxShadow = '';
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
        // Manually trigger the file input logic
        // We can't set files on input directly easily, but we can call the handler
        handleSignatureFile(file);
    }
});

// Extract signature file handling to reusable function
async function handleSignatureFile(file) {
    sigImageBytes = await file.arrayBuffer();
    sigImageType = file.type;
    
    const url = URL.createObjectURL(file);
    sigPreviewImage.src = url;
    sigPreviewImage.classList.remove('hidden');
    
    const img = new Image();
    img.onload = () => {
        sigAspectRatio = img.width / img.height;
        updateSigPreviewPosition();
    };
    img.src = url;
}

// Update the original file input listener to use this function
signatureFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleSignatureFile(file);
});

sigPrevPageBtn.addEventListener('click', () => {
    if (sigCurrentPage > 1) {
        sigCurrentPage--;
        renderSignaturePreview();
    }
});

sigNextPageBtn.addEventListener('click', () => {
    if (miscPdfDoc && sigCurrentPage < miscPdfDoc.getPageCount()) {
        sigCurrentPage++;
        renderSignaturePreview();
    }
});

sigSizeSlider.addEventListener('input', (e) => {
    sigWidth = parseInt(e.target.value);
    updateSigPreviewPosition();
});


sigPreviewImage.addEventListener('mousedown', (e) => {
    isDraggingSig = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    sigPreviewImage.style.cursor = 'grabbing';
    e.preventDefault(); // Prevent default drag behavior
});

window.addEventListener('mousemove', (e) => {
    if (!isDraggingSig) return;
    
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    // Update visual position (HTML coordinates)
    const currentLeft = parseFloat(sigPreviewImage.style.left || 0);
    const currentTop = parseFloat(sigPreviewImage.style.top || 0);
    
    // Boundaries check
    const canvasWidth = sigPreviewCanvas.width;
    const canvasHeight = sigPreviewCanvas.height;
    const imgWidth = parseFloat(sigPreviewImage.style.width);
    const imgHeight = parseFloat(sigPreviewImage.style.height);
    
    let newLeft = currentLeft + dx;
    let newTop = currentTop + dy;
    
    // Optional: Constrain to canvas
    // newLeft = Math.max(0, Math.min(newLeft, canvasWidth - imgWidth));
    // newTop = Math.max(0, Math.min(newTop, canvasHeight - imgHeight));
    
    sigPreviewImage.style.left = `${newLeft}px`;
    sigPreviewImage.style.top = `${newTop}px`;
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
});

window.addEventListener('mouseup', () => {
    if (isDraggingSig) {
        isDraggingSig = false;
        sigPreviewImage.style.cursor = 'move';
        // Update logical coordinates (PDF coordinates)
        updatePdfCoordinatesFromVisual();
    }
});

async function renderSignaturePreview() {
    if (!miscPdfJsDoc) return;
    
    sigCurrentPageDisplay.textContent = sigCurrentPage;
    
    const page = await miscPdfJsDoc.getPage(sigCurrentPage);
    const viewport = page.getViewport({ scale: 1.0 }); // 100% scale for preview
    
    sigPreviewCanvas.width = viewport.width;
    sigPreviewCanvas.height = viewport.height;
    
    const context = sigPreviewCanvas.getContext('2d');
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    // Reset signature position to center if it's off-screen or first load
    // But try to keep relative position if possible? No, simpler to reset or keep absolute.
    // Let's keep absolute PDF coords and map to new page size.
    updateSigPreviewPosition();
}

function updateSigPreviewPosition() {
    if (!sigPreviewImage.src) return;
    
    // Map PDF coords (bottom-left) to HTML coords (top-left)
    // PDF: (x, y) -> HTML: (x, canvasHeight - y - imgHeight)
    
    const canvasHeight = sigPreviewCanvas.height;
    const imgHeight = sigWidth / sigAspectRatio;
    
    sigPreviewImage.style.width = `${sigWidth}px`;
    sigPreviewImage.style.height = `${imgHeight}px`;
    
    const htmlLeft = sigX;
    const htmlTop = canvasHeight - sigY - imgHeight;
    
    sigPreviewImage.style.left = `${htmlLeft}px`;
    sigPreviewImage.style.top = `${htmlTop}px`;
    
    valX.textContent = Math.round(sigX);
    valY.textContent = Math.round(sigY);
}

function updatePdfCoordinatesFromVisual() {
    const canvasHeight = sigPreviewCanvas.height;
    const imgHeight = sigWidth / sigAspectRatio;
    
    const htmlLeft = parseFloat(sigPreviewImage.style.left);
    const htmlTop = parseFloat(sigPreviewImage.style.top);
    
    // HTML (top-left) -> PDF (bottom-left)
    // y_pdf = canvasHeight - y_html - imgHeight
    
    sigX = htmlLeft;
    sigY = canvasHeight - htmlTop - imgHeight;
    
    valX.textContent = Math.round(sigX);
    valY.textContent = Math.round(sigY);
}

addSignatureBtn.addEventListener('click', async () => {
    if (!miscPdfDoc || !sigImageBytes) {
        showStatus('Bitte PDF und Bild laden!', true);
        return;
    }
    
    showLoading(true);
    try {
        let image;
        if (sigImageType === 'image/png') {
            image = await miscPdfDoc.embedPng(sigImageBytes);
        } else {
            image = await miscPdfDoc.embedJpg(sigImageBytes);
        }
        
        const page = miscPdfDoc.getPage(sigCurrentPage - 1);
        // We need to handle scaling. The preview was at scale 1.0 (72 DPI usually).
        // PDF-Lib uses points (1/72 inch). So 1px in canvas usually maps to 1 point in PDF.
        // However, if the PDF page is huge, we might need to check dimensions.
        // For now, we assume 1:1 mapping from our canvas preview to PDF points.
        
        const dims = image.scaleToFit(sigWidth, sigWidth); // Maintain aspect ratio
        
        page.drawImage(image, {
            x: sigX,
            y: sigY,
            width: dims.width,
            height: dims.height,
        });
        
        const pdfBytes = await miscPdfDoc.save();
        downloadPDF(pdfBytes, `signed_${miscFile.name}`);
        showStatus('Unterschrift hinzugefügt!');
        
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Speichern!', true);
    } finally {
        showLoading(false);
    }
});

// --- Text Extraction Logic (Improved) ---

extractTextBtn.addEventListener('click', async () => {
    if (!miscPdfJsDoc) return;
    
    showLoading(true);
    try {
        let fullText = '';
        
        for (let i = 1; i <= miscPdfJsDoc.numPages; i++) {
            const page = await miscPdfJsDoc.getPage(i);
            const textContent = await page.getTextContent();
            
            // Improved sorting: Sort by Y (descending), then X (ascending)
            // Note: PDF Y coordinates go from bottom to top.
            const items = textContent.items.map(item => ({
                str: item.str,
                x: item.transform[4], // transform[4] is x translation
                y: item.transform[5], // transform[5] is y translation
                height: item.height || 10 // fallback height
            }));
            
            // Sort items
            items.sort((a, b) => {
                // Group by line (allow small vertical differences)
                const lineDiff = Math.abs(a.y - b.y);
                if (lineDiff < (a.height / 2)) {
                    return a.x - b.x; // Same line: sort left to right
                }
                return b.y - a.y; // Different line: sort top to bottom
            });
            
            // Join text
            let pageText = '';
            let lastY = -1;
            
            items.forEach(item => {
                if (lastY !== -1 && Math.abs(item.y - lastY) > item.height) {
                    pageText += '\n'; // New line
                } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
                    pageText += ' '; // Space between words
                }
                pageText += item.str;
                lastY = item.y;
            });
            
            fullText += `--- Seite ${i} ---\n\n${pageText}\n\n`;
        }
        
        // Show preview
        textPreviewArea.value = fullText.substring(0, 1000) + (fullText.length > 1000 ? '...' : '');
        
        // Download
        const blob = new Blob([fullText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${miscFile.name.replace('.pdf', '')}_text.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        showStatus('Text extrahiert!');
        
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Extrahieren!', true);
    } finally {
        showLoading(false);
    }
});

// --- Blank Pages Logic ---

async function renderMiscPageGrid() {
    miscPageGrid.innerHTML = '';
    if (!miscPdfJsDoc) return;
    
    for (let i = 1; i <= miscPdfJsDoc.numPages; i++) {
        const card = document.createElement('div');
        card.className = 'page-card';
        if (selectedPagesForBlank.has(i)) card.classList.add('selected');
        
        const canvas = document.createElement('canvas');
        card.appendChild(canvas);
        
        const label = document.createElement('span');
        label.className = 'page-number';
        label.textContent = i;
        card.appendChild(label);
        
        // Click handler
        card.addEventListener('click', () => {
            if (selectedPagesForBlank.has(i)) {
                selectedPagesForBlank.delete(i);
                card.classList.remove('selected');
            } else {
                selectedPagesForBlank.add(i);
                card.classList.add('selected');
            }
        });
        
        miscPageGrid.appendChild(card);
        
        // Render thumbnail
        renderThumbnailForGrid(i, canvas);
    }
}

async function renderThumbnailForGrid(pageNum, canvas) {
    try {
        const page = await miscPdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        }).promise;
    } catch (e) { console.error(e); }
}

insertBlankBtn.addEventListener('click', async () => {
    if (!miscPdfDoc || selectedPagesForBlank.size === 0) {
        showStatus('Bitte mindestens eine Seite auswählen!', true);
        return;
    }
    
    showLoading(true);
    try {
        const newPdf = await PDFDocument.create();
        const pageCount = miscPdfDoc.getPageCount();
        
        // Copy all pages first
        const copiedPages = await newPdf.copyPages(miscPdfDoc, miscPdfDoc.getPageIndices());
        
        for (let i = 0; i < pageCount; i++) {
            const pageNum = i + 1;
            newPdf.addPage(copiedPages[i]);
            
            // If this page was selected, add a blank page after it
            if (selectedPagesForBlank.has(pageNum)) {
                const { width, height } = copiedPages[i].getSize();
                newPdf.addPage([width, height]);
            }
        }
        
        const pdfBytes = await newPdf.save();
        downloadPDF(pdfBytes, `${miscFile.name.replace('.pdf', '')}_with_blanks.pdf`);
        showStatus('Leere Seiten eingefügt!');
        
    } catch (error) {
        console.error(error);
        showStatus('Fehler beim Einfügen!', true);
    } finally {
        showLoading(false);
    }
});

// ========== QR CODE FUNCTIONALITY ==========

const qrcodeText = document.getElementById('qrcode-text');
const qrcodeColor = document.getElementById('qrcode-color');
const qrcodeBg = document.getElementById('qrcode-bg');
const generateQrcodeBtn = document.getElementById('generate-qrcode-btn');
const qrcodeDisplay = document.getElementById('qrcode-display');
const downloadQrcodeBtn = document.getElementById('download-qrcode-btn');

let qrcodeObj = null;

generateQrcodeBtn.addEventListener('click', () => {
    const text = qrcodeText.value;
    if (!text) {
        showStatus('Bitte Text oder URL eingeben!', true);
        return;
    }

    qrcodeDisplay.innerHTML = ''; // Clear previous
    downloadQrcodeBtn.classList.add('hidden');
    
    try {
        // QRCode library creates the img element inside the container
        qrcodeObj = new QRCode(qrcodeDisplay, {
            text: text,
            width: 256,
            height: 256,
            colorDark : qrcodeColor.value,
            colorLight : qrcodeBg.value,
            correctLevel : QRCode.CorrectLevel.H
        });
        
        // Wait a moment for the image to be generated
        setTimeout(() => {
            const img = qrcodeDisplay.querySelector('img');
            if (img) {
                downloadQrcodeBtn.classList.remove('hidden');
                showStatus('QR-Code generiert!');
            }
        }, 100);
        
    } catch (e) {
        console.error(e);
        showStatus('Fehler beim Generieren!', true);
    }
});

downloadQrcodeBtn.addEventListener('click', () => {
    const img = qrcodeDisplay.querySelector('img');
    if (img) {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = img.src;
        link.click();
    }
});

// ========== UTILITY FUNCTIONS ==========

function updateLastGeneratedPdf(pdfBytes, filename) {
    lastGeneratedPdf.bytes = pdfBytes;
    lastGeneratedPdf.name = filename;
    
    // Show "Use Last PDF" buttons
    document.querySelectorAll('.use-last-pdf-btn').forEach(btn => {
        btn.classList.remove('hidden');
        btn.title = `Verwende: ${filename}`;
    });
}

// Event Listeners for "Use Last PDF" buttons
document.querySelectorAll('.use-last-pdf-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering upload area click
        if (!lastGeneratedPdf.bytes) return;
        
        const file = new File([lastGeneratedPdf.bytes], lastGeneratedPdf.name, { type: 'application/pdf' });
        
        // Determine which tab we are in and call appropriate handler
        const uploadArea = btn.closest('.upload-area');
        if (uploadArea.id === 'merge-upload') {
            handleMergeFiles([file]);
        } else if (uploadArea.id === 'split-upload') {
            handleSplitFile(file);
        } else if (uploadArea.id === 'organize-upload') {
            handleOrganizeFile(file);
        } else if (uploadArea.id === 'misc-upload') {
            handleMiscFile(file);
        }
    });
});

function downloadPDF(pdfBytes, filename) {
    updateLastGeneratedPdf(pdfBytes, filename);

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function showLoading(show) {
    loading.classList.toggle('hidden', !show);
}

function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.remove('hidden', 'error');
    if (isError) status.classList.add('error');
    
    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}
