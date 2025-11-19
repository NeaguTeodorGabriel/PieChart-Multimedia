// Canvas drawing and export service — centralizes all Canvas API usage
// This makes it explicit where we use the Canvas API in the project.
export function drawToContext(ctx, slices, w, h, options = {}) {
    // options: { transparentBackground: boolean, export: boolean }
    const DPR = window.devicePixelRatio || 1;
    // device pixel ratio is already accounted for by setTransform upstream but keep DPI safe
    ctx.clearRect(0, 0, w, h);
    if (!slices || slices.length === 0) {
        const cx = w * 0.68; // slightly moved to the right
        const cy = h * 0.48;
        const margin = Math.max(6, Math.min(w, h) * 0.01); // small margin --> larger pie
        const radius = Math.max(0, Math.min(cx, w - cx, cy, h - cy) - margin);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(6, radius * 0.12);
        ctx.strokeStyle = '#e6e6e6';
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!options.transparentBackground) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();
        }
        return { cx, cy, radius };
    }

    const cx = w * 0.68; // move right
    const cy = h * 0.48; // slightly above center
    const margin = Math.max(6, Math.min(w, h) * 0.01); // smaller margin => larger pie
    const radius = Math.max(0, Math.min(cx, w - cx, cy, h - cy) - margin);

    const total = slices.reduce((acc, s) => acc + s.value, 0);
    let startAngle = -Math.PI / 2; // start at top

    ctx.imageSmoothingEnabled = true;

    slices.forEach((s) => {
        const sliceAngle = (s.value / total) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // label
        const mid = (startAngle + endAngle) / 2;
        const labelRadius = radius + 46; // keep far from pie so labels don't overlap
        const labelX = cx + Math.cos(mid) * (labelRadius);
        const labelY = cy + Math.sin(mid) * (labelRadius);
        const pct = Math.round((s.value / total) * 100);
        const text = `${s.label} (${pct}%)`;
        let fontSize = 14;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = mid > Math.PI/2 || mid < -Math.PI/2 ? 'end' : 'start';

        // leader line
        const leaderX = cx + Math.cos(mid) * radius;
        const leaderY = cy + Math.sin(mid) * radius;
        ctx.beginPath();
        ctx.moveTo(leaderX, leaderY);
        ctx.lineTo(labelX - (ctx.textAlign === 'end' ? 8 : -8), labelY);
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // dynamic font shrink to keep words visible
        const pad = 12;
        const minFont = 10;
        let metrics = ctx.measureText(text);
        const available = ctx.textAlign === 'start' ? (w - (labelX + pad)) : (labelX - pad);
        while (metrics.width > available && fontSize > minFont) {
            fontSize -= 1;
            ctx.font = `${fontSize}px sans-serif`;
            metrics = ctx.measureText(text);
        }

        // clamp X coordinate to keep text in canvas
        let drawX = labelX;
        const finalWidth = metrics.width;
        if (ctx.textAlign === 'start') {
            if (labelX + finalWidth > w - pad) drawX = w - pad - finalWidth;
        } else {
            if (labelX - finalWidth < pad) drawX = pad + finalWidth;
        }

        // subtle stroke + fill for better contrast instead of a white box
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.strokeText(text, drawX, labelY);
        ctx.fillStyle = '#222';
        ctx.fillText(text, drawX, labelY);
        ctx.shadowBlur = 0;

        startAngle = endAngle;
    });

    return { cx, cy, radius };
}

// export functions
export function downloadURL(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function downloadSVG(slices, w, h, suffix = 'svg') {
    const cx = w * 0.68;
    const cy = h * 0.48;
    const margin = Math.max(6, Math.min(w, h) * 0.01);
    const radius = Math.max(0, Math.min(cx, w - cx, cy, h - cy) - margin);
    const total = slices.reduce((acc, s) => acc + s.value, 0);
    let startAngle = -Math.PI/2;
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
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        sliceParts.push(`<path d="${path}" fill="${s.color}" stroke="#fff" stroke-width="2"/>`);
        const mid = (startAngle + endAngle) / 2;
        const labelRadius = radius + 46;
        const lx = cx + Math.cos(mid) * labelRadius;
        const ly = cy + Math.sin(mid) * labelRadius;
        const pct = Math.round((s.value / total) * 100);
        const anchor = (mid > Math.PI/2 || mid < -Math.PI/2) ? 'end' : 'start';
        labelParts.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-family="sans-serif" font-size="16" fill="#222">${s.label} (${pct}%)</text>`);
        startAngle = endAngle;
    }
    const svg = `<?xml version="1.0" encoding="utf-8"?>` + `\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` + sliceParts.join('\n') + labelParts.join('\n') + '</svg>';
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadURL(url, `piechart.${suffix}`);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function exportCanvas(canvas, slices, { format = 'png', size = 1 } = {}) {
    // For PNG: draw into temporary canvas with scale and transparent background
    if (format === 'svg') {
        downloadSVG(slices, canvas.clientWidth * size, canvas.clientHeight * size);
        return;
    }
    const DPR = window.devicePixelRatio || 1;
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

export function posToSlice(x, y, canvas, slices) {
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