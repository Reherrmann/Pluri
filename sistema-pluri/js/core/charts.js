/**
 * PLURI OS — Mini Gráficos SVG Nativos
 * Sem dependências externas. Renderização pura.
 */
const Charts = (() => {
    /**
     * Cria gráfico de linha simples
     */
    function createSparkline(data, options = {}) {
        const {
            width = 200,
            height = 50,
            color = '#6366f1',
            strokeWidth = 2,
            fillOpacity = 0.15,
            smooth = true,
        } = options;

        if (!data || data.length < 2) return '';

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        const stepX = width / (data.length - 1);

        const points = data.map((val, i) => ({
            x: i * stepX,
            y: height - ((val - min) / range) * (height - 8) - 4,
        }));

        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            if (smooth && i < points.length - 1) {
                const cpX = (points[i].x + points[i - 1].x) / 2;
                pathD += ` Q ${points[i - 1].x} ${points[i - 1].y}, ${cpX} ${(points[i].y + points[i - 1].y) / 2}`;
                pathD += ` Q ${points[i].x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
            } else {
                pathD += ` L ${points[i].x} ${points[i].y}`;
            }
        }

        const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible">
                <defs>
                    <linearGradient id="grad-${color.slice(1)}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color}" stop-opacity="${fillOpacity}" />
                        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <path d="${areaD}" fill="url(#grad-${color.slice(1)})" />
                <path d="${pathD}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }

    /**
     * Cria gráfico de barras simples
     */
    function createBarChart(data, options = {}) {
        const {
            width = 200,
            height = 60,
            color = '#6366f1',
            barRadius = 3,
            gap = 3,
        } = options;

        if (!data || !data.length) return '';

        const max = Math.max(...data);
        const barWidth = (width - (data.length - 1) * gap) / data.length;

        let bars = '';
        data.forEach((val, i) => {
            const barHeight = max > 0 ? (val / max) * height : 0;
            const x = i * (barWidth + gap);
            const y = height - barHeight;
            bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 1)}" rx="${barRadius}" fill="${color}" opacity="0.85" />`;
        });

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                ${bars}
            </svg>
        `;
    }

    /**
     * Cria gráfico de donut simples
     */
    function createDonut(percentage, options = {}) {
        const {
            size = 80,
            strokeWidth = 8,
            color = '#6366f1',
            bgColor = '#27272a',
        } = options;

        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        const center = size / 2;

        return `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${bgColor}" stroke-width="${strokeWidth}" />
                <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                    stroke-linecap="round" transform="rotate(-90 ${center} ${center})"
                    style="transition: stroke-dashoffset 0.8s ease" />
                <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="middle"
                    fill="currentColor" font-size="14" font-weight="700" font-family="Inter, sans-serif">
                    ${Math.round(percentage)}%
                </text>
            </svg>
        `;
    }

    return { createSparkline, createBarChart, createDonut };
})();
