// js/utils.js
function getEl(id) {
    return document.getElementById(id);
}

// =====================================================
// LOADING GLOBAL
// =====================================================

let _loadingCount = 0;

function showLoading(message = 'Carregando...') {

    const loading =
        document.getElementById('globalLoading');

    const text =
        document.getElementById('globalLoadingText');

    if (!loading) return;

    _loadingCount++;

    if (text) {
        text.textContent = message;
    }

    loading.classList.add('show');
}


function hideLoading() {

    _loadingCount--;

    if (_loadingCount < 0) {
        _loadingCount = 0;
    }

    // Só fecha quando todas as operações terminaram
    if (_loadingCount > 0) {
        return;
    }

    const loading =
        document.getElementById('globalLoading');

    if (loading) {
        loading.classList.remove('show');
    }
}

function getInitials(name) {
    const parts = String(name || '').split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function showToast(msg) {
    const container = getEl('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function refreshIcons() {
    if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

function statusBadge(status) {
    let cls = '';
    if (status === 'Confirmado' || status === 'Concluído' || status === 'Ativo' || status === 'Resolvido') cls = 'confirmed';
    else if (status === 'Pendente' || status === 'Aguardando' || status === 'Novo') cls = 'pending';
    else cls = 'cancelled';
    const dotColor = cls === 'confirmed' ? 'green' : 'amber';
    return `<span class="status-badge ${cls}"><span class="status-dot ${dotColor}"></span>${status}</span>`;
}

function statusDotOnly(status) {
    if (status === 'Confirmado' || status === 'Concluído' || status === 'Ativo' || status === 'Resolvido') {
        return '<span class="agenda-week-appointment-dot" style="background:var(--green);"></span>';
    } else if (status === 'Pendente' || status === 'Aguardando' || status === 'Novo') {
        return '<span class="agenda-week-appointment-dot" style="background:#F59E0B;"></span>';
    } else {
        return '<span class="agenda-week-appointment-dot" style="background:#EF4444;"></span>';
    }
}

// Cor do status, usada na bolinha do canto do card e no grid do mês
function statusColor(status) {
    if (status === 'Confirmado' || status === 'Concluído' || status === 'Ativo' || status === 'Resolvido') return '#22C55E';
    if (status === 'Pendente' || status === 'Aguardando' || status === 'Novo') return '#F59E0B';
    return '#EF4444'; // Cancelado e afins
}

// Bolinha de status no canto superior direito do card de agendamento
function statusDotCorner(status) {
    return `<span class="agenda-status-corner" style="background:${statusColor(status)};" title="${status}"></span>`;
}

// Converte um objeto Date em string yyyy-MM-dd (fuso local, sem UTC shift)
function toDateStr(d) {
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function renderBarChart(values, labels, highlightIdx = -1) {
    const max = Math.max(...values, 1);
    return values.map((v, i) => {
        const pct = (v / max) * 100;
        return `<div class="bar-col">
            <span class="bar-value">${v}</span>
            <div class="bar-fill${i === highlightIdx ? ' today' : ''}" style="height:${pct}%"></div>
            <span class="bar-label">${labels[i] || ''}</span>
        </div>`;
    }).join('');
}
