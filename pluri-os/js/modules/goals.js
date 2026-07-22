/**
 * PLURI OS — Módulo de Metas
 */
const Goals = (() => {
    function render() {
        const goals = Storage.loadData('goals', []);
        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3 style="font-size:1rem;font-weight:600">Metas (${goals.length})</h3>
                    <button class="btn-primary" onclick="Goals.openGoalForm()">
                        <i data-lucide="plus" class="icon-sm"></i> Nova Meta
                    </button>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    ${goals.length ? goals.map(g => renderGoalCard(g)).join('') : `
                        <div class="empty-state">
                            <div class="empty-state-icon">🎯</div>
                            <h3>Nenhuma meta definida</h3>
                            <p>Crie metas para acompanhar o progresso da PLURI.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    function renderGoalCard(goal) {
        const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
        const periodLabels = {
            daily: 'Diária',
            weekly: 'Semanal',
            monthly: 'Mensal',
            quarterly: 'Trimestral',
            annual: 'Anual',
        };
        return `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
                    <div style="flex:1;min-width:200px">
                        <strong>${goal.description || 'Meta sem descrição'}</strong>
                        <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:4px">
                            ${periodLabels[goal.period] || goal.period} • ${goal.category || 'Geral'}
                            ${goal.responsible ? ` • ${goal.responsible}` : ''}
                        </div>
                    </div>
                    <div style="text-align:right">
                        <span class="badge-tag ${getPriorityClass(goal.priority)}">${goal.priority || 'Média'}</span>
                    </div>
                </div>
                <div style="margin-top:12px">
                    <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px">
                        <span>${Utils.formatCurrency(goal.current)} / ${Utils.formatCurrency(goal.target)}</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progress >= 100 ? 'success' : progress >= 50 ? 'warning' : 'danger'}"
                             style="width:${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function openGoalForm(editId = null) {
        const goals = Storage.loadData('goals', []);
        const existing = editId ? goals.find(g => g.id === editId) : null;

        Components.openModal({
            title: existing ? 'Editar Meta' : 'Nova Meta',
            bodyHTML: `
                <div class="form-group">
                    <label class="form-label">Descrição</label>
                    <input type="text" id="goal-desc" class="form-input" value="${existing?.description || ''}" placeholder="Ex: Atingir R$ 50K em receita">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Período</label>
                        <select id="goal-period" class="form-select">
                            ${['daily','weekly','monthly','quarterly','annual'].map(p =>
                                `<option value="${p}" ${existing?.period === p ? 'selected' : ''}>${p === 'daily' ? 'Diária' : p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensal' : p === 'quarterly' ? 'Trimestral' : 'Anual'}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoria</label>
                        <input type="text" id="goal-category" class="form-input" value="${existing?.category || ''}" placeholder="Ex: Receita">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Valor Alvo</label>
                        <input type="number" id="goal-target" class="form-input" step="0.01" value="${existing?.target || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Valor Atual</label>
                        <input type="number" id="goal-current" class="form-input" step="0.01" value="${existing?.current || 0}">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Prioridade</label>
                        <select id="goal-priority" class="form-select">
                            <option value="Baixa">Baixa</option>
                            <option value="Média" ${existing?.priority === 'Média' ? 'selected' : ''}>Média</option>
                            <option value="Alta" ${existing?.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                            <option value="Crítica" ${existing?.priority === 'Crítica' ? 'selected' : ''}>Crítica</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Responsável</label>
                        <input type="text" id="goal-responsible" class="form-input" value="${existing?.responsible || ''}">
                    </div>
                </div>
                <input type="hidden" id="goal-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `
                <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                <button class="btn-primary" onclick="Goals.saveGoal()">Salvar</button>
            `,
        });
    }

    function saveGoal() {
        const goals = Storage.loadData('goals', []);
        const editId = document.getElementById('goal-edit-id').value;
        const data = {
            id: editId || Utils.generateId(),
            description: document.getElementById('goal-desc').value.trim(),
            period: document.getElementById('goal-period').value,
            category: document.getElementById('goal-category').value.trim(),
            target: parseFloat(document.getElementById('goal-target').value) || 0,
            current: parseFloat(document.getElementById('goal-current').value) || 0,
            priority: document.getElementById('goal-priority').value,
            responsible: document.getElementById('goal-responsible').value.trim(),
            createdAt: editId ? (goals.find(g => g.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        };

        if (!data.description) {
            Components.showToast('Descrição é obrigatória', 'error');
            return;
        }

        if (editId) {
            const index = goals.findIndex(g => g.id === editId);
            if (index >= 0) goals[index] = data;
        } else {
            goals.push(data);
        }

        Storage.saveData('goals', goals);
        Components.closeModal();
        Components.showToast('Meta salva!', 'success');
        PLURI.navigateTo('goals');
    }

    function getPriorityClass(priority) {
        const map = { Baixa: 'info', Média: 'warning', Alta: 'danger', Crítica: 'danger' };
        return map[priority] || 'neutral';
    }

    window.Goals = { render, openGoalForm, saveGoal };
    return { render, openGoalForm, saveGoal };
})();
