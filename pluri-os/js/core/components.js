/**
 * PLURI OS — Fábrica de Componentes Reutilizáveis
 */
const Components = (() => {
    // ==================== CARDS ====================
    function metricCard({ title, value, icon, trend, trendValue, subtitle, color = 'accent' }) {
        const trendHTML = trend
            ? `<span class="card-trend ${trend === 'up' ? 'up' : 'down'}">
                 <i data-lucide="${trend === 'up' ? 'trending-up' : 'trending-down'}" class="icon-sm"></i>
                 ${trendValue || ''}
               </span>`
            : '';
        return `
            <div class="card fade-in">
                <div class="card-header">
                    <span class="card-title">${title}</span>
                    <span class="card-icon" style="background:var(--${color}-subtle);color:var(--${color})">
                        <i data-lucide="${icon || 'bar-chart-3'}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="card-value">${value}</div>
                <div class="card-subtitle">${subtitle || ''} ${trendHTML}</div>
            </div>
        `;
    }

    // ==================== TOAST ====================
    function showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'check-circle', error: 'alert-circle', warning: 'alert-triangle', info: 'info' };
        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="icon-sm"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(120%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ==================== MODAL ====================
    function openModal({ title, bodyHTML, footerHTML, onClose, size = 'default' }) {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-footer').innerHTML = footerHTML || '';
        if (size === 'large') container.style.maxWidth = '800px';
        else container.style.maxWidth = '560px';
        overlay.classList.remove('hidden');
        lucide.createIcons();

        const closeHandler = () => {
            overlay.classList.add('hidden');
            if (onClose) onClose();
        };

        document.getElementById('modal-close').onclick = closeHandler;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeHandler();
        };
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    // ==================== TABELA ====================
    function createTable({ headers, rows, actions = [], emptyMessage = 'Nenhum registro encontrado' }) {
        if (!rows || !rows.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>${emptyMessage}</h3>
                    <p>Os dados aparecerão aqui quando forem cadastrados.</p>
                </div>
            `;
        }
        const headerHTML = headers.map(h => `<th>${h}</th>`).join('');
        const rowsHTML = rows.map((row, i) => {
            const cells = headers.map((h, j) => `<td>${row[j] ?? ''}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        return `
            <div class="table-container">
                <table>
                    <thead><tr>${headerHTML}</tr></thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
            </div>
        `;
    }

    // ==================== PIPELINE KANBAN (NOVA VERSÃO) ====================
    function renderPipeline(stages, items, onMoveItem) {
        const stageHTML = stages.map(stage => {
            const stageItems = items.filter(item => item.stage === stage.id || item.status === stage.id);
            const totalValue = stageItems.reduce((sum, item) => sum + (parseFloat(item.value || 0)), 0);

            const cardsHTML = stageItems.map(item => `
                <div class="pipeline-card" draggable="true"
                     data-id="${item.id}" data-stage="${stage.id}"
                     ondragstart="event.dataTransfer.setData('text/plain', '${item.id}'); this.classList.add('dragging')"
                     ondragend="this.classList.remove('dragging')">
                    <div style="display:flex;justify-content:space-between;align-items:start">
                        <strong>${item.company || item.name || item.title || 'Item'}</strong>
                        <div style="display:flex;gap:4px">
                            <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CRM.editCompany('${item.id}')" title="Editar">
                                <i data-lucide="pencil" class="icon-sm"></i>
                            </button>
                            <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CRM.deleteCompany('${item.id}')" title="Excluir">
                                <i data-lucide="trash-2" class="icon-sm"></i>
                            </button>
                        </div>
                    </div>
                    <div style="font-size:0.78rem;color:var(--text-tertiary);margin-top:4px">
                        ${item.value ? Utils.formatCurrency(item.value) : ''}
                        ${item.responsible ? '· ' + item.responsible : ''}
                    </div>
                </div>
            `).join('');

            return `
                <div class="pipeline-column"
                     ondragover="event.preventDefault()"
                     ondragenter="event.currentTarget.classList.add('drag-over')"
                     ondragleave="event.currentTarget.classList.remove('drag-over')"
                     ondrop="event.preventDefault();
                              event.currentTarget.classList.remove('drag-over');
                              const itemId = event.dataTransfer.getData('text/plain');
                              const sourceStage = document.querySelector('.pipeline-card.dragging')?.dataset.stage;
                              if (itemId && sourceStage !== '${stage.id}') {
                                  (${onMoveItem.toString()})(itemId, '${stage.id}');
                              }">
                    <div class="pipeline-column-header">
                        <span>${stage.name}</span>
                        <div style="display:flex;gap:6px;align-items:center">
                            <span class="badge-tag neutral">${stageItems.length}</span>
                            <span style="font-size:0.7rem;color:var(--text-tertiary)">${Utils.formatCurrency(totalValue)}</span>
                        </div>
                    </div>
                    ${cardsHTML || '<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:0.8rem">Arraste itens aqui</div>'}
                </div>
            `;
        }).join('');

        return `<div class="pipeline">${stageHTML}</div>`;
    }

    // ==================== CONFIRM DIALOG ====================
    function confirmDialog({ title, message, onConfirm, onCancel }) {
        openModal({
            title: title || 'Confirmação',
            bodyHTML: `<p style="color:var(--text-secondary)">${message}</p>`,
            footerHTML: `
                <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                <button class="btn-primary btn-danger" id="btn-confirm-action">Confirmar</button>
            `,
            onClose: onCancel,
        });
        setTimeout(() => {
            const btn = document.getElementById('btn-confirm-action');
            if (btn) {
                btn.onclick = () => {
                    closeModal();
                    if (onConfirm) onConfirm();
                };
            }
        }, 100);
    }

    // ==================== SKELETON ====================
    function showSkeleton(count = 6) {
        const area = document.getElementById('content-area');
        let html = '<div class="skeleton-loading">';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton-card"></div>';
        }
        html += '</div>';
        area.innerHTML = html;
    }

    // ==================== EXPORTAÇÃO ====================
    return {
        metricCard,
        showToast,
        openModal,
        closeModal,
        createTable,
        renderPipeline,
        confirmDialog,
        showSkeleton
    };
})();
