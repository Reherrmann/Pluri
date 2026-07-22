// js/modules/contracts.js
const Contracts = (() => {
    function render() {
        const contracts = Storage.loadData('contracts', []);
        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3>Contratos (${contracts.length})</h3>
                    <button class="btn-primary" onclick="Contracts.openForm()"><i data-lucide="plus" class="icon-sm"></i> Novo Contrato</button>
                </div>
                ${Components.createTable({
                    headers: ['Cliente', 'Valor', 'Início', 'Fim', 'Status'],
                    rows: contracts.map(c => [
                        c.client || '-',
                        Utils.formatCurrency(c.value),
                        Utils.formatDate(c.startDate),
                        Utils.formatDate(c.endDate),
                        `<span class="badge-tag ${c.status === 'ativo' ? 'success' : 'neutral'}">${c.status || 'pendente'}</span>`,
                    ]),
                    emptyMessage: 'Nenhum contrato cadastrado',
                })}
            </div>`;
    }
    function openForm() {
        Components.openModal({
            title: 'Novo Contrato',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Cliente</label><input type="text" id="ctr-client" class="form-input"></div>
                <div class="form-group"><label class="form-label">Valor</label><input type="number" id="ctr-value" class="form-input" step="0.01"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Início</label><input type="date" id="ctr-start" class="form-input"></div>
                    <div class="form-group"><label class="form-label">Fim</label><input type="date" id="ctr-end" class="form-input"></div>
                </div>`,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                         <button class="btn-primary" onclick="Contracts.save()">Salvar</button>`,
        });
    }
    function save() {
        const contracts = Storage.loadData('contracts', []);
        contracts.push({
            id: Utils.generateId(),
            client: document.getElementById('ctr-client').value,
            value: parseFloat(document.getElementById('ctr-value').value) || 0,
            startDate: document.getElementById('ctr-start').value,
            endDate: document.getElementById('ctr-end').value,
            status: 'ativo',
            createdAt: new Date().toISOString(),
        });
        Storage.saveData('contracts', contracts);
        Components.closeModal();
        Components.showToast('Contrato salvo!', 'success');
        PLURI.navigateTo('contracts');
    }
    window.Contracts = { render, openForm, save };
    return { render, openForm, save };
})();
