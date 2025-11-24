const { PDFDocument } = PDFLib;

// State
let mergeFiles = [];
let splitFile = null;
let splitPdfDoc = null;
let organizeFile = null;
let organizePdfDoc = null;
let organizePageCount = 0;
let organizePdfJsDoc = null; // Für Thumbnails

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

// ========== UTILITY FUNCTIONS ==========

function downloadPDF(pdfBytes, filename) {
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
