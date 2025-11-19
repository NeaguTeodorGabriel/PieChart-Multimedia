// Pie chart module — uses a thin service layer for Canvas API
let drawToContext, serviceExportCanvas, serviceDownloadSVG, servicePosToSlice;
let addSliceToData, removeSliceFromData, updateSliceValue;

(async () => {
    try {
        const canvasModule = await import('../../services/pieCanvasService.js');
        drawToContext = canvasModule.drawToContext;
        serviceExportCanvas = canvasModule.exportCanvas;
        serviceDownloadSVG = canvasModule.downloadSVG;
        servicePosToSlice = canvasModule.posToSlice;
    } catch (e) {
        console.error('Failed to load pieCanvasService', e);
    }
    try {
        const dataModule = await import('../../services/dataService.js');
        addSliceToData = dataModule.addSlice;
        removeSliceFromData = dataModule.removeSlice;
        updateSliceValue = dataModule.updateSliceValue;
    } catch (e) {
        console.error('Failed to load dataService', e);
    }
    // now that services are available (or failed) call draw once so UI updates
    try { draw(); } catch (e) {}

    const canvas = document.getElementById('pie-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let DPR = window.devicePixelRatio || 1;
    // pastel, low-contrast palette (eye-pleasing) — we'll cycle through these when user adds slices
    const pastelColors = [
        '#ffd6e0', // soft pink
        '#fbe7c6', // soft peach
        '#e7f9d9', // light green
        '#d8f0ff', // light sky
        '#e8dffb', // lavender
        '#fff3d6'  // light yellow
    ];
    let colorIndex = 0;

    function getNextColor() {
        const color = pastelColors[colorIndex % pastelColors.length];
        colorIndex += 1;
        return color;
    }

    // internal data
    const slices = [];
    let hoveredIndex = -1;

    const form = document.getElementById('pie-form');
    const dataList = document.getElementById('data-list');
    const tooltip = document.getElementById('pie-tooltip');

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.round(rect.width * DPR);
        canvas.height = Math.round(rect.height * DPR);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        draw();
    }

    function addSlice(label, value, color) {
        if (typeof addSliceToData === 'function') {
            addSliceToData(slices, label, value, color);
        } else {
            // fallback: push directly
            slices.push({ label, value: Number(value), color });
            console.warn('addSliceToData not loaded — falling back to direct push');
        }
        updateList();
        draw();
        // don't touch DOM inputs here; advancing the color is handled from form submit
    }

    // handle form submit for adding slices
    if (form) {
        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const labelInput = document.getElementById('label');
            const valueInput = document.getElementById('value');
            const colorInput = document.getElementById('color');
            if (!labelInput || !valueInput) return;
            const label = labelInput.value.trim();
            const value = Number(valueInput.value);
            if (!label || !Number.isFinite(value) || value <= 0) return;
            const color = colorInput ? colorInput.value : getNextColor();
            addSlice(label, value, color);
            // reset form then advance the color input so users see the next pastel
            form.reset();
            try { if (colorInput) colorInput.value = getNextColor(); } catch (e) {}
            // ensure newest item is visible at top of the list
            try { dataList.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { dataList.scrollTop = 0; }
            labelInput.focus();
        });
    }

    function updateList() {
        dataList.innerHTML = '';
        slices.forEach((s, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="slice-info">
                    <div class="color-box" style="background:${s.color}"></div>
                    <span class="slice-label">${s.label}</span>
                    <span class="slice-value">${s.value}</span>
                </div>
                <div>
                    <button data-index="${i}" data-action="edit" class="edit-btn">Edit</button>
                    <button data-index="${i}" class="remove-btn">Remove</button>
                </div>`;
                // Add newest slice to the top so left panel doesn't need to scroll
                dataList.insertBefore(li, dataList.firstChild);
        });
    }

    // handle list actions (edit/save/cancel/remove)
    dataList.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        const idx = Number(btn.dataset.index);
        if (action === 'edit') {
            // switch list item into edit mode for value only
            const li = btn.closest('li');
            if (!li) return;
            const valSpan = li.querySelector('.slice-value');
            const origVal = valSpan ? valSpan.textContent : '';
            // replace value span with number input and save/cancel
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.value = origVal;
            input.className = 'edit-value-input';
            valSpan.replaceWith(input);
            btn.dataset.action = 'save';
            btn.textContent = 'Save';
            // add a cancel button next to it
            const cancel = document.createElement('button');
            cancel.dataset.index = idx;
            cancel.dataset.action = 'cancel';
            cancel.className = 'cancel-btn';
            cancel.textContent = 'Cancel';
            btn.insertAdjacentElement('afterend', cancel);
        } else if (action === 'save') {
            const li = btn.closest('li');
            const input = li.querySelector('.edit-value-input');
            const newVal = Number(input.value);
            if (!Number.isFinite(newVal) || newVal < 0) return; // ignore invalid
            // update the model
            if (typeof updateSliceValue === 'function') {
                updateSliceValue(slices, idx, newVal);
            } else {
                slices[idx].value = newVal;
            }
            updateList();
            draw();
        } else if (action === 'cancel') {
            // restore layout by re-rendering list
            updateList();
        } else if (btn.classList.contains('remove-btn')) {
            const i = Number(btn.dataset.index);
            if (typeof removeSliceFromData === 'function') {
                removeSliceFromData(slices, i);
            } else {
                slices.splice(i, 1);
            }
            updateList();
            draw();
        }
    });

    // The canvas drawing logic is now handled inside `pieCanvasService.js` and
    // pulled into this module via `drawToContext()` so that the canvas API
    // usage is centralized and easier to unit test / modify.

        function draw() {
            // delegating to canvas service ensures Canvas API use is centralized
            if (typeof drawToContext === 'function') {
                drawToContext(canvas.getContext('2d'), slices, canvas.clientWidth, canvas.clientHeight, { export: false, transparentBackground: false });
            } else {
                // service not loaded — use local fallback immediately so UI appears
                localDrawToContext(canvas.getContext('2d'), slices, canvas.clientWidth, canvas.clientHeight, { export: false, transparentBackground: false });
            }
        }

        // Export utilities
        function downloadSVG(suffix = 'svg') {
            serviceDownloadSVG(slices, canvas.clientWidth, canvas.clientHeight, suffix);
        }

        function exportCanvas(opts = { format: 'png', size: 1 }) {
            // forward to canvas service which produces the final file
            const { format = 'png', size = 1 } = opts;
            if (format === 'svg') {
                serviceDownloadSVG(slices, canvas.clientWidth * size, canvas.clientHeight * size, 'svg');
                return;
            }
            if (typeof serviceExportCanvas === 'function') {
                serviceExportCanvas(canvas, slices, { format, size });
            } else {
                // fallback: use temporary canvas and export via toBlob
                const DPR = window.devicePixelRatio || 1;
                const w = canvas.clientWidth * size;
                const h = canvas.clientHeight * size;
                const tmp = document.createElement('canvas');
                tmp.width = Math.round(w * DPR); tmp.height = Math.round(h * DPR);
                tmp.style.width = w + 'px'; tmp.style.height = h + 'px';
                const tctx = tmp.getContext('2d');
                tctx.setTransform(DPR * size,0,0,DPR * size,0,0);
                localDrawToContext(tctx, slices, w, h, { export: true, transparentBackground: true });
                const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
                if (tmp.toBlob) tmp.toBlob((blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `piechart.${format}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000); }, mime);
                else { const url = tmp.toDataURL(mime); const a = document.createElement('a'); a.href = url; a.download = `piechart.${format}`; document.body.appendChild(a); a.click(); a.remove(); }
            }
        }

        
        
        // (legacy block removed - drawing is handled by drawToContext)

    // posToSlice checks using service if needed.
    function lookupSliceIndex(x, y) {
        if (typeof servicePosToSlice === 'function') return servicePosToSlice(x, y, canvas, slices);
        return localPosToSlice(x, y, canvas, slices);
    }

    // Local fallback for drawing if the Canvas service can't be dynamically loaded.
    function localDrawToContext(ctx, slicesArr, w, h, options = {}) {
        const w0 = w || canvas.clientWidth;
        const h0 = h || canvas.clientHeight;
        ctx.clearRect(0,0,w0,h0);
        if (!slicesArr || slicesArr.length === 0) {
            const cx = w0 * 0.68;
            const cy = h0 * 0.48;
            const margin = Math.max(8, Math.min(w0,h0) * 0.02);
            const radius = Math.max(0, Math.min(cx, w0-cx, cy, h0-cy) - margin);
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI*2);
            ctx.lineWidth = Math.max(6, radius * 0.12);
            ctx.strokeStyle = '#e6e6e6';
            ctx.stroke();
            return { cx, cy, radius };
        }
        const cx = w0 * 0.68;
        const cy = h0 * 0.48;
        const margin = Math.max(6, Math.min(w0,h0) * 0.02);
        const radius = Math.max(0, Math.min(cx, w0-cx, cy, h0-cy) - margin);
        const total = slicesArr.reduce((acc, s) => acc + s.value, 0);
        let startAngle = -Math.PI/2;
        slicesArr.forEach((s) => {
            const sliceAngle = (s.value/total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath(); ctx.fillStyle = s.color; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            // leader & label
            const mid = (startAngle + endAngle)/2;
            const labelRadius = radius + 46;
            const labelX = cx + Math.cos(mid) * labelRadius;
            const labelY = cy + Math.sin(mid) * labelRadius;
            const leaderX = cx + Math.cos(mid) * radius;
            const leaderY = cy + Math.sin(mid) * radius;
            ctx.beginPath(); ctx.moveTo(leaderX, leaderY);
            ctx.lineTo(labelX - ((mid > Math.PI/2 || mid < -Math.PI/2) ? 8 : -8), labelY);
            ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2.2; ctx.stroke();
            const pct = Math.round((s.value / total) * 100);
            let text = `${s.label} (${pct}%)`;
            let fontSize = 14; ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = 'middle'; ctx.textAlign = (mid > Math.PI/2 || mid < -Math.PI/2) ? 'end' : 'start';
            let metrics = ctx.measureText(text);
            const pad = 12; const minFont = 10;
            const available = ctx.textAlign === 'start' ? (w0 - (labelX + pad)) : (labelX - pad);
            while (metrics.width > available && fontSize > minFont) {
                fontSize -= 1; ctx.font = `${fontSize}px sans-serif`; metrics = ctx.measureText(text);
            }
            const finalWidth = metrics.width; let drawX = labelX;
            if (ctx.textAlign === 'start') { if (labelX + finalWidth > w0 - pad) drawX = w0 - pad - finalWidth; }
            else { if (labelX - finalWidth < pad) drawX = pad + finalWidth; }
            ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.strokeText(text, drawX, labelY);
            ctx.fillStyle = '#222'; ctx.fillText(text, drawX, labelY);
            startAngle = endAngle;
        });
        return { cx, cy, radius };
    }

    function localPosToSlice(x, y, canvasEl, slicesArr) {
        const rect = canvasEl.getBoundingClientRect();
        const cx = rect.width * 0.68; const cy = rect.height * 0.48;
        const dx = x - rect.left - cx; const dy = y - rect.top - cy; const dist = Math.sqrt(dx*dx + dy*dy);
        const margin = Math.max(6, Math.min(rect.width, rect.height) * 0.02);
        const radius = Math.max(0, Math.min(cx, rect.width - cx, cy, rect.height - cy) - margin);
        if (dist > radius) return -1;
        let angle = Math.atan2(dy, dx); angle += Math.PI/2; if (angle < 0) angle += Math.PI*2;
        const total = slicesArr.reduce((acc, s) => acc + s.value, 0);
        let running = 0;
        for (let i = 0; i < slicesArr.length; i++) {
            const sliceAngle = (slicesArr[i].value / total) * Math.PI * 2;
            if (angle >= running && angle < running + sliceAngle) return i;
            running += sliceAngle;
        }
        return -1;
    }
    // initial
    // if the canvas service hasn't loaded, wait briefly then call resize
    resizeCanvas();
    // setup export modal interactions (open/close overlay, trigger export)
    try {
        const icon = document.getElementById('download-icon');
        const overlay = document.getElementById('download-overlay');
        const formatSelect = document.getElementById('export-format');
        const scaleSelect = document.getElementById('export-scale');
        // pxInput and bgSelect removed — exports always transparent and px width removed
        const exportBtn = document.getElementById('export-download');
        const closeBtn = overlay ? overlay.querySelector('.download-close') : null;

        function openOverlay() {
            if (!overlay) return;
            overlay.setAttribute('aria-hidden', 'false');
            overlay.classList.add('show');
            if (icon) icon.setAttribute('aria-expanded', 'true');
        }
        function closeOverlay() {
            if (!overlay) return;
            overlay.setAttribute('aria-hidden', 'true');
            overlay.classList.remove('show');
            if (icon) icon.setAttribute('aria-expanded', 'false');
        }

        if (icon && overlay) {
            icon.addEventListener('click', () => openOverlay());
            closeBtn && closeBtn.addEventListener('click', () => closeOverlay());
            // click outside the panel closes the overlay
            overlay.addEventListener('click', (ev) => {
                if (ev.target === overlay) closeOverlay();
            });
            // escape closes
            document.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
                    closeOverlay();
                }
            });

            exportBtn && exportBtn.addEventListener('click', () => {
                const fmt = formatSelect ? formatSelect.value : 'png';
                let size = scaleSelect ? Number(scaleSelect.value) : 1;
                        // ignore px, always use scale select. Exact px option removed.
                // always export with transparent background
                exportCanvas({ format: fmt, size });
                closeOverlay();
            });
        }
    } catch (e) { console.warn(e) }

    // close overlay on outside click
    document.addEventListener('click', (ev) => {
        const overlay = document.getElementById('download-overlay');
        const icon = document.getElementById('download-icon');
        if (!overlay || !icon) return;
        if (overlay.getAttribute('aria-hidden') === 'true') return;
        const panel = overlay.querySelector('.download-panel');
        if (!panel) return;
        if (panel.contains(ev.target) || icon.contains(ev.target)) return;
        overlay.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('show');
        icon.setAttribute('aria-expanded', 'false');
    });
    // set initial pastel color on color input for a pleasing default
    try {
        const colorInput = document.getElementById('color');
        if (colorInput) colorInput.value = getNextColor();
    } catch (e) {}
})();
