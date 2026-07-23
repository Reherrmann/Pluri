/**
 * PLURI OS V2 — Módulo Financeiro V2
 * Visual premium estilo Stripe, filtros rápidos, gráficos modernos.
 * Mantém toda a lógica de negócio, sincronização com Google Sheets.
 */
const Finance = (() => {
    const SHEET_NAME = 'PLURI_Financeiro_2026';
    let isSyncing = false;
    let activeFilter = 'month'; // 'month', 'quarter', 'year'

    // ==================== SINCRONIZAÇÃO (INALTERADA) ====================
    async function syncFromSheet() {
        if (isSyncing) return;
        isSyncing = true;
        try {
            const sheetData = await GoogleSheets.readSheet(SHEET_NAME);
            if (!sheetData) { isSyncing = false; return; }
            const transactionsFromSheet = sheetData.map(row => ({
                id: row['ID'] || Utils.generateId(),
                description: row['Descrição'] || row['Descricao'] || '',
                type: row['Tipo'] || 'despesa',
                category: row['Categoria'] || 'unico',
                amount: parseFloat(row['Valor']) || 0,
                date: row['Data'] || new Date().toISOString().slice(0,10),
                createdAt: new Date().toISOString(),
                source: 'planilha'
            }));
            const local = Storage.loadData('finance_transactions', []);
            const manual = local.filter(t => t.source !== 'planilha');
            const merged = [...manual, ...transactionsFromSheet];
            Storage.saveData('finance_transactions', merged);
            if (PLURI.getState().currentModule === 'finance') {
                const area = document.getElementById('content-area');
                if (area) {
                    area.innerHTML = renderInternal();
                    lucide.createIcons();
                }
            }
        } catch (error) {
            console.error('[Finance] Erro na sincronização:', error);
        } finally {
            isSyncing = false;
        }
    }

    function render() {
        syncFromSheet();
        return renderInternal();
    }

    // ==================== RENDER INTERNO ====================
    function renderInternal() {
        const allTransactions = Storage.loadData('finance_transactions', []);
        const implantations = Storage.loadData('finance_implantations', []);
        const filtered = applyPeriodFilter(allTransactions, activeFilter);

        const receitas = filtered.filter(t => t.type === 'receita' || t.type === 'mensalidade');
        const despesas = filtered.filter(t => t.type === 'despesa' || t.type === 'custo' || t.type === 'imposto' || t.type === 'comissao');
        const totalReceitas = receitas.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const totalDespesas = despesas.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const lucroBruto = totalReceitas - totalDespesas;
        const mrr = filtered.filter(t => t.category === 'recorrente' || t.type === 'mensalidade')
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const arr = mrr * 12;
        const totalImplantacoes = implantations.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

        // Dados para gráfico de barras (receita vs despesa)
        const barData = [totalReceitas, totalDespesas];

        return `
            <div class="fade-in">
                <!-- HEADER -->
                <div class="dv-header">
                    <div>
                        <h2 class="dv-greeting">Financeiro</h2>
                        <p class="dv-date">Visão geral das finanças</p>
                    </div>
                    <div style="display:flex;gap:8px">
                        <button class="btn-primary" onclick="Finance.openTransactionForm()" style="background:var(--dv-accent);color:#0a0e17;border:none;font-weight:600">
                            <i data-lucide="plus" class="icon-sm"></i> Nova Transação
                        </button>
                    </div>
                </div>

                <!-- MÉTRICAS PRINCIPAIS -->
                <div class="dv-section-title">
                    <i data-lucide="bar-chart-3" class="icon-sm" style="color:var(--dv-accent)"></i> Indicadores Financeiros
                </div>
                <div class="dv-finance-metrics">
                    ${metricCard('Receitas', Utils.formatCurrency(totalReceitas), 'arrow-up-circle', '#10b981')}
                    ${metricCard('Despesas', Utils.formatCurrency(totalDespesas), 'arrow-down-circle', '#ef4444')}
                    ${metricCard('Lucro Bruto', Utils.formatCurrency(lucroBruto), 'dollar-sign', lucroBruto >= 0 ? '#10b981' : '#ef4444')}
                    ${metricCard('MRR', Utils.formatCurrency(mrr), 'repeat', '#6366f1', `ARR: ${Utils.formatCurrency(arr)}`)}
                    ${metricCard('Implantações', Utils.formatCurrency(totalImplantacoes), 'rocket', '#f59e0b')}
                    ${metricCard('Ticket Médio', receitas.length ? Utils.formatCurrency(totalReceitas / receitas.length) : 'R$ 0,00', 'receipt', '#3b82f6')}
                </div>

                <!-- GRÁFICO DE BARRAS -->
                <div class="dv-section-title">
                    <i data-lucide="bar-chart-2" class="icon-sm" style="color:var(--dv-accent)"></i> Receita vs Despesa (período)
                </div>
                <div class="dv-finance-chart">
                    <div style="display:flex;align-items:flex-end;gap:40px;height:120px;padding:0 20px">
                        <div style="text-align:center;flex:1">
                            <div style="height:${(totalReceitas / Math.max(totalReceitas, totalDespesas, 1)) * 100}px;background:#10b981;border-radius:6px 6px 0 0;transition:height 0.5s"></div>
                            <div style="margin-top:8px;font-weight:600;color:var(--dv-text-primary)">${Utils.formatCurrency(totalReceitas)}</div>
                            <div style="font-size:0.7rem;color:var(--dv-text-tertiary)">Receitas</div>
                        </div>
                        <div style="text-align:center;flex:1">
                            <div style="height:${(totalDespesas / Math.max(totalReceitas, totalDespesas, 1)) * 100}px;background:#ef4444;border-radius:6px 6px 0 0;transition:height 0.5s"></div>
                            <div style="margin-top:8px;font-weight:600;color:var(--dv-text-primary)">${Utils.formatCurrency(totalDespesas)}</div>
                            <div style="font-size:0.7rem;color:var(--dv-text-tertiary)">Despesas</div>
                        </div>
                    </div>
                </div>

                <!-- FILTROS E TABELA -->
                <div class="dv-section-title">
                    <i data-lucide="list" class="icon-sm" style="color:var(--dv-accent)"></i> Transações (${filtered.length})
                </div>
                <div class="dv-finance-filter-bar">
                    <span class="dv-finance-filter-chip ${activeFilter === 'month' ? 'active' : ''}" onclick="Finance.setFilter('month')">Este mês</span>
                    <span class="dv-finance-filter-chip ${activeFilter === 'quarter' ? 'active' : ''}" onclick="Finance.setFilter('quarter')">Trimestre</span>
                    <span class="dv-finance-filter-chip ${activeFilter === 'year' ? 'active' : ''}" onclick="Finance.setFilter('year')">Ano</span>
                </div>
                ${renderTransactionTable(filtered)}
            </div>
        `;
    }

    // ==================== COMPONENTES ====================
    function metricCard(title, value, icon, color, subtitle = '') {
        return `
            <div class="dv-finance-metric-card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <span class="dv-kpi-label">${title}</span>
                    <span style="background:${color}20;color:${color};padding:4px 8px;border-radius:6px;font-size:0.7rem">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="dv-kpi-value" style="margin:8px 0">${value}</div>
                ${subtitle ? `<div style="font-size:0.75rem;color:var(--dv-text-tertiary)">${subtitle}</div>` : ''}
            </div>
        `;
    }

    function renderTransactionTable(transactions) {
        if (!transactions || !transactions.length) {
            return `<div class="dv-card" style="text-align:center;padding:40px">Nenhuma transação no período.</div>`;
        }
        const rows = transactions.map(t => `
            <tr>
                <td>${t.description || '-'}</td>
                <td><span class="badge-tag ${t.type === 'receita' || t.type === 'mensalidade' ? 'success' : 'danger'}">${t.type}</span></td>
                <td>${t.category || '-'}</td>
                <td>${Utils.formatCurrency(t.amount)}</td>
                <td>${Utils.formatDate(t.date || t.createdAt)}</td>
                <td>
                    <button class="btn-icon btn-sm" onclick="Finance.deleteTransaction('${t.id}')" title="Excluir" style="color:var(--dv-danger)">
                        <i data-lucide="trash-2" class="icon-sm"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        return `
            <div class="dv-card" style="overflow-x:auto;padding:0">
                <table class="dv-finance-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th style="width:60px">Ações</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    // ==================== FILTRO DE PERÍODO ====================
    function applyPeriodFilter(transactions, period) {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let startDate;

        if (period === 'month') {
            startDate = new Date(thisYear, thisMonth, 1);
        } else if (period === 'quarter') {
            const quarterMonth = Math.floor(thisMonth / 3) * 3;
            startDate = new Date(thisYear, quarterMonth, 1);
        } else if (period === 'year') {
            startDate = new Date(thisYear, 0, 1);
        } else {
            return transactions; // sem filtro
        }

        return transactions.filter(t => {
            const d = new Date(t.date || t.createdAt);
            return d >= startDate;
        });
    }

    function setFilter(period) {
        activeFilter = period;
        const area = document.getElementById('content-area');
        if (area) {
            area.innerHTML = renderInternal();
            lucide.createIcons();
        }
    }

    // ==================== FORMULÁRIO (INALTERADO) ====================
    function openTransactionForm(editId = null) {
        const transactions = Storage.loadData('finance_transactions', []);
        const existing = editId ? transactions.find(t => t.id === editId) : null;
        Components.openModal({
            title: existing ? 'Editar Transação' : 'Nova Transação',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Descrição</label><input type="text" id="fin-desc" class="form-input" value="${existing?.description || ''}"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Tipo</label><select id="fin-type" class="form-select">
                        <option value="receita" ${existing?.type === 'receita' ? 'selected' : ''}>Receita</option>
                        <option value="despesa" ${existing?.type === 'despesa' ? 'selected' : ''}>Despesa</option>
                        <option value="custo" ${existing?.type === 'custo' ? 'selected' : ''}>Custo</option>
                        <option value="mensalidade" ${existing?.type === 'mensalidade' ? 'selected' : ''}>Mensalidade</option>
                        <option value="imposto" ${existing?.type === 'imposto' ? 'selected' : ''}>Imposto</option>
                        <option value="comissao" ${existing?.type === 'comissao' ? 'selected' : ''}>Comissão</option>
                    </select></div>
                    <div class="form-group"><label class="form-label">Categoria</label><select id="fin-category" class="form-select">
                        <option value="unico">Único</option>
                        <option value="recorrente" ${existing?.category === 'recorrente' ? 'selected' : ''}>Recorrente</option>
                    </select></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Valor (R$)</label><input type="number" id="fin-amount" class="form-input" step="0.01" value="${existing?.amount || ''}"></div>
                    <div class="form-group"><label class="form-label">Data</label><input type="date" id="fin-date" class="form-input" value="${existing?.date?.slice(0,10) || new Date().toISOString().slice(0,10)}"></div>
                </div>
                <input type="hidden" id="fin-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button><button class="btn-primary" onclick="Finance.saveTransaction()">Salvar</button>`,
        });
    }

    async function saveTransaction() {
        const transactions = Storage.loadData('finance_transactions', []);
        const editId = document.getElementById('fin-edit-id').value;
        const data = {
            id: editId || Utils.generateId(),
            description: document.getElementById('fin-desc').value.trim(),
            type: document.getElementById('fin-type').value,
            category: document.getElementById('fin-category').value,
            amount: parseFloat(document.getElementById('fin-amount').value) || 0,
            date: document.getElementById('fin-date').value,
            createdAt: editId ? (transactions.find(t => t.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            source: 'manual'
        };
        if (!data.description || !data.amount) { Components.showToast('Preencha descrição e valor', 'error'); return; }
        if (editId) {
            const index = transactions.findIndex(t => t.id === editId);
            if (index >= 0) transactions[index] = data;
        } else {
            transactions.push(data);
        }
        Storage.saveData('finance_transactions', transactions);
        const row = [data.id, data.date, data.description, data.type, data.category, data.amount];
        const success = await GoogleSheets.appendRow(SHEET_NAME, row);
        Components.closeModal();
        Components.showToast(success ? 'Transação salva na planilha!' : 'Salva localmente.', success ? 'success' : 'warning');
        const area = document.getElementById('content-area');
        if (area) { area.innerHTML = renderInternal(); lucide.createIcons(); }
    }

    async function deleteTransaction(id) {
        const transactions = Storage.loadData('finance_transactions', []);
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        Components.confirmDialog({
            title: 'Excluir transação',
            message: `Tem certeza que deseja excluir "${transaction.description}"?`,
            onConfirm: async () => {
                const updated = transactions.filter(t => t.id !== id);
                Storage.saveData('finance_transactions', updated);
                if (transaction.source === 'planilha' || transaction.id) await GoogleSheets.deleteRow(SHEET_NAME, transaction.id);
                Components.showToast('Transação excluída!', 'success');
                const area = document.getElementById('content-area');
                if (area) { area.innerHTML = renderInternal(); lucide.createIcons(); }
            },
        });
    }

    window.Finance = { render, openTransactionForm, saveTransaction, deleteTransaction, setFilter };
    return { render, openTransactionForm, saveTransaction, deleteTransaction, setFilter };
})();
