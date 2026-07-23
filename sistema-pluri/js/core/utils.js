/**
 * PLURI OS — Utilitários
 * Funções puras reutilizáveis em todo o sistema
 */
const Utils = (() => {
    /**
     * Gera ID único (timestamp + random)
     */
    function generateId() {
        return 'pl_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }

    /**
     * Formata valor monetário em BRL
     */
    function formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(num);
    }

    /**
     * Formata número compacto (1.2K, 3.5M)
     */
    function formatCompact(value) {
        const num = parseFloat(value) || 0;
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    /**
     * Formata data para pt-BR
     */
    function formatDate(date, options = {}) {
        const d = new Date(date);
        const defaultOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return d.toLocaleDateString('pt-BR', { ...defaultOptions, ...options });
    }

    /**
     * Formata data e hora
     */
    function formatDateTime(date) {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    /**
     * Retorna data relativa (há 5 min, há 3 dias)
     */
    function timeAgo(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `há ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `há ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `há ${days} dias`;
        return formatDate(date);
    }

    /**
     * Debounce para inputs
     */
    function debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Deep clone de objetos
     */
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Calcula variação percentual
     */
    function percentChange(current, previous) {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / Math.abs(previous)) * 100;
    }

    /**
     * Formata percentual
     */
    function formatPercent(value, decimals = 1) {
        return (parseFloat(value) || 0).toFixed(decimals) + '%';
    }

    /**
     * Trunca texto
     */
    function truncate(text, max = 60) {
        if (!text) return '';
        return text.length > max ? text.substring(0, max) + '...' : text;
    }

    /**
     * Slugify
     */
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    /**
     * Exporta CSV
     */
    function exportCSV(data, filename = 'export.csv') {
        if (!data || !data.length) return;
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row =>
                headers.map(h => {
                    const val = row[h] ?? '';
                    const str = String(val).replace(/"/g, '""');
                    return `"${str}"`;
                }).join(',')
            ),
        ].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Dispara evento customizado
     */
    function emit(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Escuta evento customizado
     */
    function on(eventName, callback) {
        window.addEventListener(eventName, callback);
    }

    return {
        generateId,
        formatCurrency,
        formatCompact,
        formatDate,
        formatDateTime,
        timeAgo,
        debounce,
        deepClone,
        percentChange,
        formatPercent,
        truncate,
        slugify,
        exportCSV,
        emit,
        on,
    };
})();
