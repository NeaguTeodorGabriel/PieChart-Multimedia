// Pie Chart Application - Combined Script (no ES modules for file:// compatibility)
(function () {
    'use strict';

    // ============================================
    // DATA SERVICE
    // ============================================
    function addSlice(slices, label, value, color) {
        slices.push({ label, value: Number(value), color });
    }

    function removeSlice(slices, index) {
        if (index >= 0 && index < slices.length) slices.splice(index, 1);
    }

    function updateSliceValue(slices, index, value) {
        if (index >= 0 && index < slices.length) slices[index].value = Number(value);
    }

    function totalValue(slices) {
        return slices.reduce((acc, s) => acc + s.value, 0);
    }

    // ============================================
    // CANVAS SERVICE
    // ============================================
    function drawToContext(ctx, slices, w, h, options = {}) {
        ctx.clearRect(0, 0, w, h);

        // "Empty" state
        if (!slices || slices.length === 0) {
            const cx = w * 0.68;
            const cy = h * 0.48;
            const margin = Math.max(6, Math.min(w, h) * 0.01);
            const radius = Math.max(0, Math.min(cx, w - cx, cy, h - cy) - margin);

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#cccccc';
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.restore();

            // Add a friendly text
            ctx.font = 'bold 16px "Nunito", sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Add some slices!', cx, cy);

            return { cx, cy, radius };
        }

        const cx = w * 0.68;
        const cy = h * 0.48;
        const margin = Math.max(10, Math.min(w, h) * 0.02); // Tighter margin -> Bigger Pie
        const radius = Math.max(0, Math.min(cx, w - cx, cy, h - cy) - margin);

        const total = slices.reduce((acc, s) => acc + s.value, 0);
        let startAngle = -Math.PI / 2;

        ctx.imageSmoothingEnabled = true;

        // Shadow for the whole pie to give it a "pop" from the background
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        // Draw slices
        slices.forEach((s) => {
            const sliceAngle = (s.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = s.color;
            ctx.fill();

            // Thick cartoonish border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.stroke();

            startAngle = endAngle;
        });
        ctx.restore(); // End shadow

        // Second pass for highlights (Glossy effect)
        startAngle = -Math.PI / 2;
        slices.forEach((s) => {
            const sliceAngle = (s.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            // Inner highlight (gloss)
            if (sliceAngle > 0.1) {
                ctx.save();
                ctx.clip(); // Clip to the slice shape if we matched it, but simpler to just draw an overlay

                // Re-trace slice for clipping
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.clip();

                // Gradient shine
                const mid = (startAngle + endAngle) / 2;
                const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
                grad.addColorStop(0, 'rgba(255,255,255,0.15)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = grad;
                ctx.fill();

                // Top rim highlight
                ctx.beginPath();
                ctx.arc(cx, cy, radius * 0.95, startAngle, endAngle);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            }
            startAngle = endAngle;
        });

        // Labels
        startAngle = -Math.PI / 2;
        slices.forEach((s) => {
            const sliceAngle = (s.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            const mid = (startAngle + endAngle) / 2;

            // Position
            const labelRadius = radius + 30;
            const labelX = cx + Math.cos(mid) * labelRadius;
            const labelY = cy + Math.sin(mid) * labelRadius;

            const pct = Math.round((s.value / total) * 100);
            const text = `${s.label} (${pct}%)`;

            // Cartoon style text
            ctx.font = 'bold 16px "Nunito", sans-serif';
            ctx.textBaseline = 'middle';
            ctx.textAlign = mid > Math.PI / 2 || mid < -Math.PI / 2 ? 'end' : 'start';

            // Adjust position if it's too close to edge
            const pad = 15;
            let drawX = labelX;
            const metrics = ctx.measureText(text);
            if (ctx.textAlign === 'start') {
                if (drawX + metrics.width > w - pad) drawX = w - pad - metrics.width;
            } else {
                if (drawX - metrics.width < pad) drawX = pad + metrics.width;
            }

            // Connection line (curved or straight?) -> Straight thick
            const leaderX = cx + Math.cos(mid) * (radius - 5);
            const leaderY = cy + Math.sin(mid) * (radius - 5);

            ctx.beginPath();
            ctx.moveTo(leaderX, leaderY);
            ctx.lineTo(drawX + (ctx.textAlign === 'start' ? -5 : 5), labelY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#555'; // Dark grey connector
            ctx.stroke();

            // Dot at the end of leader
            ctx.beginPath();
            ctx.arc(leaderX, leaderY, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.stroke();

            // Text "Sticker" effect
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(255,255,255, 0.9)'; // White halo
            ctx.strokeText(text, drawX, labelY);

            ctx.fillStyle = '#333'; // Dark text
            ctx.fillText(text, drawX, labelY);

            startAngle = endAngle;
        });

        return { cx, cy, radius };
    }

    function downloadURL(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function downloadSVG(slices, w, h, suffix = 'svg') {
        // Simple SVG export (keeps it simple, might not match canvas exactly but good enough for download)
        const cx = w * 0.68;
        const cy = h * 0.48;
        const margin = Math.max(6, Math.min(w, h) * 0.01);
        const radius = Math.max(0, Math.min(cx, w - cx, cy, h - cy) - margin);
        const total = slices.reduce((acc, s) => acc + s.value, 0);
        let startAngle = -Math.PI / 2;
        const sliceParts = [];
        const labelParts = [];
        for (let s of slices) {
            const sliceAngle = (s.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            const x1 = cx + Math.cos(startAngle) * radius;
            const y1 = cy + Math.sin(startAngle) * radius;
            const x2 = cx + Math.cos(endAngle) * radius;
            const y2 = cy + Math.sin(endAngle) * radius;
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            // SVG Path
            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            sliceParts.push(`<path d="${path}" fill="${s.color}" stroke="#fff" stroke-width="3"/>`);

            // Label
            const mid = (startAngle + endAngle) / 2;
            const labelRadius = radius + 35;
            const lx = cx + Math.cos(mid) * labelRadius;
            const ly = cy + Math.sin(mid) * labelRadius;
            const pct = Math.round((s.value / total) * 100);
            const anchor = (mid > Math.PI / 2 || mid < -Math.PI / 2) ? 'end' : 'start';
            // Simple text for SVG
            labelParts.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-family="Nunito, sans-serif" font-weight="bold" font-size="16" fill="#333">${s.label} (${pct}%)</text>`);
            startAngle = endAngle;
        }
        const svg = `<?xml version="1.0" encoding="utf-8"?>` + `\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` + sliceParts.join('\n') + labelParts.join('\n') + '</svg>';
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        downloadURL(url, `piechart.${suffix}`);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    function exportCanvas(canvas, slices, { format = 'png', size = 1 } = {}) {
        if (format === 'svg') {
            downloadSVG(slices, canvas.clientWidth * size, canvas.clientHeight * size);
            return;
        }
        const DPR = Math.max(window.devicePixelRatio || 1, 2); // Force 2x or higher
        const w = canvas.clientWidth * size;
        const h = canvas.clientHeight * size;
        const tmp = document.createElement('canvas');
        tmp.width = Math.round(w * DPR);
        tmp.height = Math.round(h * DPR);
        tmp.style.width = w + 'px';
        tmp.style.height = h + 'px';
        const tctx = tmp.getContext('2d');
        tctx.setTransform(DPR * size, 0, 0, DPR * size, 0, 0);
        drawToContext(tctx, slices, w, h, { export: true, transparentBackground: true });
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpg' ? 0.95 : undefined;
        if (tmp.toBlob) {
            tmp.toBlob((blob) => {
                if (!blob) {
                    const url = tmp.toDataURL(mime, quality);
                    downloadURL(url, `piechart.${format}`);
                    return;
                }
                const url = URL.createObjectURL(blob);
                downloadURL(url, `piechart.${format}`);
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }, mime, quality);
        } else {
            const url = tmp.toDataURL(mime, quality);
            downloadURL(url, `piechart.${format}`);
        }
    }

    function posToSlice(x, y, canvas, slices) {
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width * 0.68;
        const cy = rect.height * 0.48;
        const dx = x - rect.left - cx;
        const dy = y - rect.top - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const margin = Math.max(6, Math.min(rect.width, rect.height) * 0.01);
        const radius = Math.max(0, Math.min(cx, rect.width - cx, cy, rect.height - cy) - margin);
        if (dist > radius) return -1;
        let angle = Math.atan2(dy, dx);
        angle += Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        const total = slices.reduce((acc, s) => acc + s.value, 0);
        let running = 0;
        for (let i = 0; i < slices.length; i++) {
            const sliceAngle = (slices[i].value / total) * Math.PI * 2;
            if (angle >= running && angle < running + sliceAngle) return i;
            running += sliceAngle;
        }
        return -1;
    }

    // ============================================
    // AUDIO SERVICE (Web Speech API)
    // ============================================
    const AudioService = {
        synth: window.speechSynthesis,
        currentUtterance: null,

        speakChartData: function (slices) {
            // Stop any ongoing speech first
            this.stopSpeaking();

            if (!slices || slices.length === 0) {
                this.speak("The pie chart is empty. Add some slices to get started.");
                return;
            }

            const total = slices.reduce((acc, s) => acc + s.value, 0);
            let text = `This pie chart has ${slices.length} ${slices.length === 1 ? 'slice' : 'slices'}. `;

            slices.forEach((slice, index) => {
                const percentage = Math.round((slice.value / total) * 100);
                text += `${slice.label}: ${percentage} percent. `;
            });

            this.speak(text);
        },

        speak: function (text) {
            if (!this.synth) {
                console.warn('Speech synthesis not supported');
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            // Try to use a nice English voice
            const voices = this.synth.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            this.currentUtterance = utterance;
            this.synth.speak(utterance);
        },

        stopSpeaking: function () {
            if (this.synth) {
                this.synth.cancel();
            }
            this.currentUtterance = null;
        },

        isSpeaking: function () {
            return this.synth && this.synth.speaking;
        }
    };

    // ============================================
    // MAIN PIE CHART LOGIC
    // ============================================
    const canvas = document.getElementById('pie-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let DPR = Math.max(window.devicePixelRatio || 1, 2); // Force minimum 2x DPI

    // Vibrant "Cartoony" Palette
    const cartoonColors = [
        '#FF5F5F', // Bright Red
        '#3FA0FF', // Bright Blue
        '#FFD93D', // Bright Yellow
        '#6DFF83', // Bright Green
        '#C26DFF', // Bright Purple
        '#FF9F43'  // Bright Orange
    ];
    let colorIndex = 0;

    function getNextColor() {
        const color = cartoonColors[colorIndex % cartoonColors.length];
        colorIndex += 1;
        return color;
    }

    const slices = [];
    let hoveredIndex = -1;

    const form = document.getElementById('pie-form');
    const dataList = document.getElementById('data-list');
    const tooltip = document.getElementById('pie-tooltip');

    function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        // Force re-read of DPR in case it changed (zooming)
        DPR = Math.max(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(rect.width * DPR);
        canvas.height = Math.round(rect.height * DPR);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        draw();
    }

    function addSliceHandler(label, value, color) {
        addSlice(slices, label, value, color);
        updateList();
        draw();
    }

    // Handle form submit
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
            addSliceHandler(label, value, color);
            form.reset();
            try { if (colorInput) colorInput.value = getNextColor(); } catch (e) { }
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
            dataList.insertBefore(li, dataList.firstChild);
        });
    }

    // Handle list actions
    dataList.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        const idx = Number(btn.dataset.index);
        if (action === 'edit') {
            const li = btn.closest('li');
            if (!li) return;
            const valSpan = li.querySelector('.slice-value');
            const origVal = valSpan ? valSpan.textContent : '';
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.value = origVal;
            input.className = 'edit-value-input';
            valSpan.replaceWith(input);
            btn.dataset.action = 'save';
            btn.textContent = 'Save';
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
            if (!Number.isFinite(newVal) || newVal < 0) return;
            updateSliceValue(slices, idx, newVal);
            updateList();
            draw();
        } else if (action === 'cancel') {
            updateList();
        } else if (btn.classList.contains('remove-btn')) {
            const i = Number(btn.dataset.index);
            removeSlice(slices, i);
            updateList();
            draw();
        }
    });

    function draw() {
        drawToContext(ctx, slices, canvas.clientWidth, canvas.clientHeight, { export: false, transparentBackground: false });
    }

    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Export modal setup
    try {
        const icon = document.getElementById('download-icon');
        const overlay = document.getElementById('download-overlay');
        const formatSelect = document.getElementById('export-format');
        const scaleSelect = document.getElementById('export-scale');
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
            overlay.addEventListener('click', (ev) => {
                if (ev.target === overlay) closeOverlay();
            });
            document.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
                    closeOverlay();
                }
            });

            exportBtn && exportBtn.addEventListener('click', () => {
                const fmt = formatSelect ? formatSelect.value : 'png';
                let size = scaleSelect ? Number(scaleSelect.value) : 1;
                exportCanvas(canvas, slices, { format: fmt, size });
                closeOverlay();
            });
        }
    } catch (e) { console.warn(e); }

    // Audio button setup
    const audioBtn = document.getElementById('audio-icon');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            if (AudioService.isSpeaking()) {
                AudioService.stopSpeaking();
                audioBtn.classList.remove('speaking');
                audioBtn.title = 'Read Chart Aloud';
            } else {
                AudioService.speakChartData(slices);
                audioBtn.classList.add('speaking');
                audioBtn.title = 'Stop Reading';

                // Remove speaking class when done
                if (AudioService.currentUtterance) {
                    AudioService.currentUtterance.onend = () => {
                        audioBtn.classList.remove('speaking');
                        audioBtn.title = 'Read Chart Aloud';
                    };
                }
            }
        });
    }

    // Set initial pastel color
    try {
        const colorInput = document.getElementById('color');
        if (colorInput) colorInput.value = getNextColor();
    } catch (e) { }
})();
