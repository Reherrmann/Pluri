/**
 * PLURI OS — Módulo Financeiro
 * Integrado com Google Sheets (aba PLURI_Financeiro_2026)
 */
const Finance = (() => {

    /**
     * Sincroniza dados da planilha com o localStorage
     */
    async function syncFromSheet() {
        try {
            const sheetData = await GoogleSheets.readSheet('PLURI_Financeiro_2026');
            if (sheetData && sheetData.length) {
                // Mapeia colunas da planilha para campos do sistema
                const transactionsFromSheet = sheetData.map(row => ({
                    id: Utils.generateId(),
                    description: row['Descrição'] || row['Descricao'] || '',
                    type: row['Tipo'] || 'despesa',
                    category: row['Categoria'] || 'unico',
                    amount: parseFloat(row['Valor']) || 0,
                    date: row['Data'] || new Date().toISOString().slice(0, 10),
                    createdAt: new Date().toISOString(),
                    source: 'planilha'
                }));

                // Mescla: mantém transações manuais e adiciona/atualiza as da planilha
                const localTransactions = Storage.loadData('finance_transactions', []);
                const manualTransactions = localTransactions.filter(t => t.source !== 'planilha');
                const merged = [...manualTransactions, ...transactionsFromSheet];
                Storage.saveData('finance_transactions', merged);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Finance] Erro ao sincronizar com planilha:', error);
            return false;
        }
    }

    /**
     * Renderiza o módulo financeiro
     */
    async function render() {
        // Mostra skeleton loading
        Components.showSkeleton(4);

        // Sincroniza com planilha antes de exibir os dados
        await syncFromSheet();

        // Carrega dados do localStorage (já mesclados)
        const transactions = Storage.loadData('finance_transactions', []);
        const implantations = Storage.loadData('finance_implantations', []);

        // Cálculos
        const receitas = transactions.filter(t => t.type === 'receita' || t.type === 'mensalidade');
        const despesas = transactions.filter(t => t.type === 'despesa' || t.type === 'custo' || t.type === 'imposto' || t.type === 'comissao');
        const totalReceitas = receitas.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const totalDespesas = despesas.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const lucroBruto = totalReceitas - totalDespesas;
        const mrr = transactions
            .filter(t => t.category === 'recorrente' || t.type === 'mensalidade')
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const arr = mrr * 12;
        const totalImplantacoes = implantations.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

        // Prepara HTML
        const html = `
            <div class="fade-in">
                <div class="cards-grid" style="margin-bottom:24px">
                    ${Components.metricCard({ title: 'Receitas', value: Utils.formatCurrency(totalReceitas), icon: 'arrow-up-circle', color: 'success' })}
                    ${Components.metricCard({ title: 'Despesas', value: Utils.formatCurrency(totalDespesas), icon: 'arrow-down-circle', color: 'danger' })}
                    ${Components.metricCard({ title: 'Lucro Bruto', value: Utils.formatCurrency(lucroBruto), icon: 'dollar-sign', color: lucroBruto >= 0 ? 'success' : 'danger' })}
                    ${Components.metricCard({ title: 'MRR', value: Utils.formatCurrency(mrr), icon: 'repeat', subtitle: `ARR: ${Utils.formatCurrency(arr)}`, color: 'accent' })}
                </div>

                <div class="cards-grid cards-grid-sm" style="margin-bottom:24px">
                    ${Components.metricCard({ title: 'Implantações', value: Utils.formatCurrency(totalImplantacoes), icon: 'rocket', color: 'info' })}
                    ${Components.metricCard({ title: 'Ticket Médio', value: Utils.formatCurrency(receitas.length ? totalReceitas / receitas.length : 0), icon: 'receipt', color: 'warning' })}
                </div>

                <!-- Toolbar -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <h3 style="font-size:1rem;font-weight:600">Transações (${transactions.length})</h3>
                    <button class="btn-primary" onclick="Finance.openTransactionForm()">
                        <i data-lucide="plus" class="icon-sm"></i> Nova Transação
                    </button>
                </div>

                <!-- Tabela -->
                ${renderTransactionTable(transactions)}
            </div>
        `;

        document.getElementById('content-area').innerHTML = html;
        lucide.createIcons();
    }

    /**
     * Renderiza a tabela de transações
     */
    function renderTransactionTable(transactions) {
        if (!transactions || !transactions.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <h3>Nenhuma transação registrada</h3>
                    <p>Os dados da planilha ou transações manuais aparecerão aqui.</p>
                </div>
            `;
        }

        const headers = ['Descrição', 'Tipo', 'Categoria', 'Valor', 'Data'];
        const rows = transactions.map(t => [
            t.description || '-',
            `<span class="badge-tag ${t.type === 'receita' || t.type === 'mensalidade' ? 'success' : 'danger'}">${t.type}</span>`,
            t.category || '-',
            Utils.formatCurrency(t.amount),
            Utils.formatDate(t.date || t.createdAt),
        ]);
        return Components.createTable({ headers, rows, emptyMessage: 'Nenhuma transação encontrada' });
    }

    /**
     * Abre formulário de nova transação (manual)
     */
    function openTransactionForm(editId = null) {
        const transactions = Storage.loadData('finance_transactions', []);
        const existing = editId ? transactions.find(t => t.id === editId) : null;

        Components.openModal({
            title: existing ? 'Editar Transação' : 'Nova Transação',
            bodyHTML: `
                <div class="form-group">
                    <label class="form-label">Descrição</label>
                    <input type="text" id="fin-desc" class="form-input" value="${existing?.description || ''}">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <select id="fin-type" class="form-select">
                            <option value="receita" ${existing?.type === 'receita' ? 'selected' : ''}>Receita</option>
                            <option value="despesa" ${existing?.type === 'despesa' ? 'selected' : ''}>Despesa</option>
                            <option value="custo" ${existing?.type === 'custo' ? 'selected' : ''}>Custo</option>
                            <option value="mensalidade" ${existing?.type === 'mensalidade' ? 'selected' : ''}>Mensalidade</option>
                            <option value="imposto" ${existing?.type === 'imposto' ? 'selected' : ''}>Imposto</option>
                            <option value="comissao" ${existing?.type === 'comissao' ? 'selected' : ''}>Comissão</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoria</label>
                        <select id="fin-category" class="form-select">
                            <option value="unico">Único</option>
                            <option value="recorrente" ${existing?.category === 'recorrente' ? 'selected' : ''}>Recorrente</option>
                        </select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Valor (R$)</label>
                        <input type="number" id="fin-amount" class="form-input" step="0.01" value="${existing?.amount || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Data</label>
                        <input type="date" id="fin-date" class="form-input" value="${existing?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10)}">
                    </div>
                </div>
                <input type="hidden" id="fin-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `
                <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                <button class="btn-primary" onclick="Finance.saveTransaction()">Salvar</button>
            `,
        });
    }

    /**
     * Salva uma nova transação manual no localStorage
     */
    function saveTransaction() {
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
            source: 'manual' // indica que foi cadastrada manualmente
        };

        if (!data.description || !data.amount) {
            Components.showToast('Preencha descrição e valor', 'error');
            return;
        }

        if (editId) {
            const index = transactions.findIndex(t => t.id === editId);
            if (index >= 0) transactions[index] = data;
        } else {
            transactions.push(data);
        }

        Storage.saveData('finance_transactions', transactions);
        Components.closeModal();
        Components.showToast('Transação salva!', 'success');
        PLURI.navigateTo('finance');
    }

    // Expor funções globalmente
    window.Finance = { render, openTransactionForm, saveTransaction };

    return { render, openTransactionForm, saveTransaction };
})();
