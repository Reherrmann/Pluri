/**
 * PLURI OS — Módulo Financeiro
 * Integração completa com Google Sheets (leitura, escrita, remoção)
 */
const Finance = (() => {

    // Mapeamento das colunas (ajuste se os nomes forem diferentes)
    const SHEET_NAME = 'PLURI_Financeiro_2026';
    const COL_DESCRICAO = 'Descrição';
    const COL_TIPO = 'Tipo';
    const COL_CATEGORIA = 'Categoria';
    const COL_VALOR = 'Valor';
    const COL_DATA = 'Data';
    const COL_ID = 'ID';

    /**
     * Sincroniza dados da planilha com localStorage (em segundo plano)
     */
    async function syncFromSheetInBackground() {
        try {
            const sheetData = await GoogleSheets.readSheet(SHEET_NAME);
            if (sheetData && sheetData.length) {
                const transactionsFromSheet = sheetData.map(row => ({
                    id: row[COL_ID] || Utils.generateId(),
                    description: row[COL_DESCRICAO] || '',
                    type: row[COL_TIPO] || 'despesa',
                    category: row[COL_CATEGORIA] || 'unico',
                    amount: parseFloat(row[COL_VALOR]) || 0,
                    date: row[COL_DATA] || new Date().toISOString().slice(0, 10),
                    createdAt: new Date().toISOString(),
                    source: 'planilha',
                    sheetRowId: row[COL_ID] || null,
                }));

                // Atualiza: remove antigos da planilha e adiciona os novos
                const local = Storage.loadData('finance_transactions', []);
                const manual = local.filter(t => t.source !== 'planilha');
                const merged = [...manual, ...transactionsFromSheet];
                Storage.saveData('finance_transactions', merged);

                if (PLURI.getState().currentModule === 'finance') {
                    PLURI.refreshCurrentModule();
                }
            }
        } catch (error) {
            console.error('[Finance] Erro ao sincronizar:', error);
        }
    }

    function render() {
        syncFromSheetInBackground();

        const transactions = Storage.loadData('finance_transactions', []);
        const implantations = Storage.loadData('finance_implantations', []);

        const receitas = transactions.filter(t => t.type === 'receita' || t.type === 'mensalidade');
        const despesas = transactions.filter(t => t.type === 'despesa' || t.type === 'custo' || t.type === 'imposto' || t.type === 'comissao');
        const totalReceitas = receitas.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const totalDespesas = despesas.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const lucroBruto = totalReceitas - totalDespesas;
        const mrr = transactions.filter(t => t.category === 'recorrente' || t.type === 'mensalidade')
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const arr = mrr * 12;
        const totalImplantacoes = implantations.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

        return `
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
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <h3>Transações (${transactions.length})</h3>
                    <button class="btn-primary" onclick="Finance.openTransactionForm()"><i data-lucide="plus" class="icon-sm"></i> Nova Transação</button>
                </div>
                ${renderTable(transactions)}
            </div>
        `;
    }

    function renderTable(transactions) {
        if (!transactions || !transactions.length) {
            return `<div class="empty-state"><div class="empty-state-icon">💰</div><h3>Nenhuma transação</h3></div>`;
        }
        const headers = ['Descrição', 'Tipo', 'Categoria', 'Valor', 'Data', 'Ações'];
        const rows = transactions.map(t => [
            t.description || '-',
            `<span class="badge-tag ${t.type === 'receita' || t.type === 'mensalidade' ? 'success' : 'danger'}">${t.type}</span>`,
            t.category || '-',
            Utils.formatCurrency(t.amount),
            Utils.formatDate(t.date || t.createdAt),
            `<button class="btn-icon btn-sm" onclick="Finance.deleteTransaction('${t.id}')" title="Excluir">
                <i data-lucide="trash-2" class="icon-sm"></i>
            </button>`,
        ]);
        return Components.createTable({ headers, rows });
    }

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
                    <div class="form-group"><label class="form-label">Data</label><input type="date" id="fin-date" class="form-input" value="${existing?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10)}"></div>
                </div>
                <input type="hidden" id="fin-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                         <button class="btn-primary" onclick="Finance.saveTransaction()">Salvar</button>`,
        });
    }

    async function saveTransaction() {
        const id = document.getElementById('fin-edit-id').value || Utils.generateId();
        const desc = document.getElementById('fin-desc').value.trim();
        const type = document.getElementById('fin-type').value;
        const category = document.getElementById('fin-category').value;
        const amount = parseFloat(document.getElementById('fin-amount').value) || 0;
        const date = document.getElementById('fin-date').value;

        if (!desc || !amount) {
            Components.showToast('Preencha descrição e valor', 'error');
            return;
        }

        const newTransaction = {
            id,
            description: desc,
            type,
            category,
            amount,
            date,
            createdAt: new Date().toISOString(),
            source: 'manual',
        };

        // Salva no localStorage
        const transactions = Storage.loadData('finance_transactions', []);
        const editId = document.getElementById('fin-edit-id').value;
        if (editId) {
            const index = transactions.findIndex(t => t.id === editId);
            if (index >= 0) transactions[index] = newTransaction;
        } else {
            transactions.push(newTransaction);
        }
        Storage.saveData('finance_transactions', transactions);

        // Envia para a planilha (append)
        const row = [id, date, desc, type, category, amount];
        const success = await GoogleSheets.appendRow(SHEET_NAME, row);
        if (success) {
            Components.showToast('Transação salva na planilha!', 'success');
        } else {
            Components.showToast('Erro ao salvar na planilha', 'error');
        }

        Components.closeModal();
        PLURI.navigateTo('finance');
    }

    async function deleteTransaction(transactionId) {
        const transactions = Storage.loadData('finance_transactions', []);
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Confirmação
        Components.confirmDialog({
            title: 'Excluir transação',
            message: `Tem certeza que deseja excluir "${transaction.description}"?`,
            onConfirm: async () => {
                // Remove do localStorage
                const updated = transactions.filter(t => t.id !== transactionId);
                Storage.saveData('finance_transactions', updated);

                // Se a transação estiver na planilha (tem sheetRowId ou foi adicionada manualmente e depois enviada)
                if (transaction.source === 'planilha' || transaction.sheetRowId) {
                    await GoogleSheets.deleteRow(SHEET_NAME, transaction.sheetRowId || transaction.id);
                }

                Components.showToast('Transação excluída', 'success');
                PLURI.navigateTo('finance');
            },
        });
    }

    window.Finance = { render, openTransactionForm, saveTransaction, deleteTransaction };
    return { render, openTransactionForm, saveTransaction, deleteTransaction };
})();
