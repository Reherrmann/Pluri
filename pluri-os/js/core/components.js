/**
 * PLURI OS — Fábrica de Componentes Reutilizáveis
 * Gera HTML de forma programática para cards, modais, toasts, etc.
 */
const Components = (() => {
    /**
     * Card de métrica
     */
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

    /**
     * Toast notification
     */
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

    /**
     * Modal
     */
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

    /**
     * Tabela dinâmica
     */
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
            const actionBtns = actions.map(a => {
                if (a.type === 'edit') return `<button class="btn-icon btn-sm" onclick="(${a.handler.toString()})('${row[0]}')" title="Editar"><i data-lucide="pencil" class="icon-sm"></i></button>`;
                if (a.type === 'delete') return `<button class="btn-icon btn-sm" onclick="(${a.handler.toString()})('${row[0]}')" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>`;
                return '';
            }).join('');
            return `<tr>${cells}<td>${actionBtns}</td></tr>`;
        }).join('');
        const actionHeader = actions.length ? '<th style="width:80px">Ações</th>' : '';
        return `
            <div class="table-container">
                <table>
                    <thead><tr>${headerHTML}${actionHeader}</tr></thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
            </div>
        `;
    }

    /**
     * Skeleton loader
     */
    function showSkeleton(count = 6) {
        const area = document.getElementById('content-area');
        let html = '<div class="skeleton-loading">';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton-card"></div>';
        }
        html += '</div>';
        area.innerHTML = html;
    }

    /**
     * Pipeline Kanban
     */
    function renderPipeline(stages, items, onMoveItem) {
        const stageHTML = stages.map(stage => {
            const stageItems = items.filter(item => item.stage === stage.id || item.status === stage.id);
            const cardsHTML = stageItems.map(item => `
                <div class="pipeline-card" draggable="true" data-id="${item.id}" data-stage="${stage.id}"
                     ondragstart="window._dragItemId='${item.id}';window._dragSourceStage='${stage.id}'">
                    <strong>${item.name || item.company || item.title || 'Item'}</strong>
                    <div style="font-size:0.78rem;color:var(--text-tertiary);margin-top:4px">
                        ${item.value ? Utils.formatCurrency(item.value) : ''}
                        ${item.contact || ''}
                    </div>
                </div>
            `).join('');

            return `
                <div class="pipeline-column"
                     ondragover="event.preventDefault()"
                     ondrop="event.preventDefault();
                              const itemId = window._dragItemId;
                              const sourceStage = window._dragSourceStage;
                              if (itemId && sourceStage !== '${stage.id}') {
                                  (${onMoveItem.toString()})(itemId, '${stage.id}');
                              }
                              window._dragItemId = null;">
                    <div class="pipeline-column-header">${stage.name} <span style="color:var(--text-tertiary)">(${stageItems.length})</span></div>
                    ${cardsHTML || '<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:0.8rem">Arraste itens aqui</div>'}
                </div>
            `;
        }).join('');

        return `<div class="pipeline">${stageHTML}</div>`;
    }

    /**
     * Confirmação
     */
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

    return {
        metricCard,
        showToast,
        openModal,
        closeModal,
        createTable,
        showSkeleton,
        renderPipeline,
        confirmDialog,
    };
})();
