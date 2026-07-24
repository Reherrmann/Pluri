/**
 * PLURI OS V2 — Módulo Financeiro
 * Visual original, com filtros rápidos e gráfico de barras.
 * Integração com Google Sheets preservada.
 */
const Finance = (() => {
    const SHEET_NAME = 'PLURI_Financeiro_2026';
    let isSyncing = false;
    let activeFilter = 'month'; // 'month', 'quarter', 'year'

    // ==================== SINCRONIZAÇÃO ====================
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

        return `
            <div class="fade-in">
                <!-- Cabeçalho com filtros -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
                    <h3 style="font-size:1.1rem;font-weight:600">Financeiro</h3>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <span class="badge-tag ${activeFilter === 'month' ? 'info' : 'neutral'}" style="cursor:pointer" onclick="Finance.setFilter('month')">Este mês</span>
                        <span class="badge-tag ${activeFilter === 'quarter' ? 'info' : 'neutral'}" style="cursor:pointer" onclick="Finance.setFilter('quarter')">Trimestre</span>
                        <span class="badge-tag ${activeFilter === 'year' ? 'info' : 'neutral'}" style="cursor:pointer" onclick="Finance.setFilter('year')">Ano</span>
                    </div>
                    <button class="btn-primary" onclick="Finance.openTransactionForm()">
                        <i data-lucide="plus" class="icon-sm"></i> Nova Transação
                    </button>
                </div>

                <!-- Cards de métricas (visual original) -->
                <div class="cards-grid" style="margin-bottom:24px">
                    ${Components.metricCard({ title: 'Receitas', value: Utils.formatCurrency(totalReceitas), icon: 'arrow-up-circle', color: 'success' })}
                    ${Components.metricCard({ title: 'Despesas', value: Utils.formatCurrency(totalDespesas), icon: 'arrow-down-circle', color: 'danger' })}
                    ${Components.metricCard({ title: 'Lucro Bruto', value: Utils.formatCurrency(lucroBruto), icon: 'dollar-sign', color: lucroBruto >= 0 ? 'success' : 'danger' })}
                    ${Components.metricCard({ title: 'MRR', value: Utils.formatCurrency(mrr), icon: 'repeat', subtitle: `ARR: ${Utils.formatCurrency(arr)}`, color: 'accent' })}
                    ${Components.metricCard({ title: 'Implantações', value: Utils.formatCurrency(totalImplantacoes), icon: 'rocket', color: 'info' })}
                    ${Components.metricCard({ title: 'Ticket Médio', value: receitas.length ? Utils.formatCurrency(totalReceitas / receitas.length) : 'R$ 0,00', icon: 'receipt', color: 'warning' })}
                </div>

                <!-- Gráfico de barras simples -->
                <div class="card" style="margin-bottom:24px;padding:20px">
                    <div style="font-weight:600;margin-bottom:16px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;font-size:0.8rem">Receita vs Despesa (período)</div>
                    <div style="display:flex;align-items:flex-end;gap:40px;height:100px">
                        <div style="text-align:center;flex:1">
                            <div style="height:${(totalReceitas / Math.max(totalReceitas, totalDespesas, 1)) * 80}px;background:var(--success);border-radius:6px 6px 0 0;transition:height 0.5s"></div>
                            <div style="margin-top:8px;font-weight:600">${Utils.formatCurrency(totalReceitas)}</div>
                            <div style="font-size:0.7rem;color:var(--text-tertiary)">Receitas</div>
                        </div>
                        <div style="text-align:center;flex:1">
                            <div style="height:${(totalDespesas / Math.max(totalReceitas, totalDespesas, 1)) * 80}px;background:var(--danger);border-radius:6px 6px 0 0;transition:height 0.5s"></div>
                            <div style="margin-top:8px;font-weight:600">${Utils.formatCurrency(totalDespesas)}</div>
                            <div style="font-size:0.7rem;color:var(--text-tertiary)">Despesas</div>
                        </div>
                    </div>
                </div>

                <!-- Tabela de transações (visual original) -->
                <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Transações (${filtered.length})</h3>
                ${renderTransactionTable(filtered)}
            </div>
        `;
    }

    function renderTransactionTable(transactions) {
        const headers = ['Descrição', 'Tipo', 'Categoria', 'Valor', 'Data', 'Ações'];
        const rows = transactions.map(t => [
            t.description || '-',
            `<span class="badge-tag ${t.type === 'receita' || t.type === 'mensalidade' ? 'success' : 'danger'}">${t.type}</span>`,
            t.category || '-',
            Utils.formatCurrency(t.amount),
            Utils.formatDate(t.date || t.createdAt),
            `<button class="btn-icon btn-sm" onclick="Finance.deleteTransaction('${t.id}')" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>`
        ]);
        return Components.createTable({ headers, rows, emptyMessage: 'Nenhuma transação no período.' });
    }

    // ==================== FILTRO DE PERÍODO ====================
    function applyPeriodFilter(transactions, period) {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let startDate;
        if (period === 'month') startDate = new Date(thisYear, thisMonth, 1);
        else if (period === 'quarter') startDate = new Date(thisYear, Math.floor(thisMonth / 3) * 3, 1);
        else if (period === 'year') startDate = new Date(thisYear, 0, 1);
        else return transactions;
        return transactions.filter(t => {
            const d = new Date(t.date || t.createdAt);
            return d >= startDate;
        });
    }

    function setFilter(period) {
    activeFilter = period;
    PLURI.navigateTo('finance'); // recarrega o módulo com o novo filtro ativo
}

    // ==================== CRUD (INALTERADO) ====================
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
