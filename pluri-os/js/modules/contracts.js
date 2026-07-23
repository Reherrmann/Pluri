const Contracts = (() => {
    const SHEET_NAME = 'Contratos';

    async function syncFromSheet() {
        try {
            const rows = await GoogleSheets.readSheet(SHEET_NAME);
            if (!rows || !rows.length) return;

            const contracts = rows.map(row => ({
                id: row['ID'] || Utils.generateId(),
                client: row['Cliente'] || '',
                value: parseFloat(row['Valor']) || 0,
                startDate: row['Início'] || '',
                endDate: row['Fim'] || '',
                status: row['Status'] || 'ativo',
                linkDrive: row['Link Drive'] || '',
                obs: row['Observações'] || '',
                createdAt: new Date().toISOString(),
                source: 'planilha'
            }));

            const local = Storage.loadData('contracts', []);
            const manual = local.filter(c => c.source !== 'planilha');
            const merged = [...manual, ...contracts];
            Storage.saveData('contracts', merged);

            if (PLURI.getState().currentModule === 'contracts') {
                PLURI.refreshCurrentModule();
            }
        } catch (error) {
            console.error('[Contracts] Erro na sincronização:', error);
        }
    }

    function render() {
        syncFromSheet();
        const contracts = Storage.loadData('contracts', []);

        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3>Contratos (${contracts.length})</h3>
                    <button class="btn-primary" onclick="Contracts.openForm()"><i data-lucide="plus" class="icon-sm"></i> Novo Contrato</button>
                </div>
                ${renderTable(contracts)}
            </div>`;
    }

    function renderTable(contracts) {
        if (!contracts || !contracts.length) {
            return `<div class="empty-state"><div class="empty-state-icon">📄</div><h3>Nenhum contrato</h3><p>Cadastre contratos e associe links do Drive.</p></div>`;
        }
        const headers = ['Cliente', 'Valor', 'Início', 'Fim', 'Status', 'Drive', 'Ações'];
        const rows = contracts.map(c => [
            c.client || '-',
            Utils.formatCurrency(c.value),
            Utils.formatDate(c.startDate),
            Utils.formatDate(c.endDate),
            `<span class="badge-tag ${c.status === 'ativo' ? 'success' : 'neutral'}">${c.status || 'pendente'}</span>`,
            c.linkDrive ? `<a href="${c.linkDrive}" target="_blank" class="btn-secondary btn-sm">Abrir</a>` : '-',
            `<button class="btn-icon btn-sm" onclick="Contracts.deleteContract('${c.id}')" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>`
        ]);
        return Components.createTable({ headers, rows });
    }

    function openForm(editId = null) {
        const contracts = Storage.loadData('contracts', []);
        const existing = editId ? contracts.find(c => c.id === editId) : null;

        Components.openModal({
            title: existing ? 'Editar Contrato' : 'Novo Contrato',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Cliente</label><input type="text" id="ctr-client" class="form-input" value="${existing?.client || ''}"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Valor</label><input type="number" id="ctr-value" class="form-input" step="0.01" value="${existing?.value || ''}"></div>
                    <div class="form-group"><label class="form-label">Status</label>
                        <select id="ctr-status" class="form-select">
                            <option value="ativo" ${existing?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                            <option value="encerrado">Encerrado</option>
                            <option value="pendente">Pendente</option>
                        </select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Início</label><input type="date" id="ctr-start" class="form-input" value="${existing?.startDate || ''}"></div>
                    <div class="form-group"><label class="form-label">Fim</label><input type="date" id="ctr-end" class="form-input" value="${existing?.endDate || ''}"></div>
                </div>
                <div class="form-group"><label class="form-label">Link do Drive</label><input type="url" id="ctr-link" class="form-input" value="${existing?.linkDrive || ''}" placeholder="https://drive.google.com/..."></div>
                <div class="form-group"><label class="form-label">Observações</label><textarea id="ctr-obs" class="form-textarea" rows="2">${existing?.obs || ''}</textarea></div>
                <input type="hidden" id="ctr-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button><button class="btn-primary" onclick="Contracts.save()">Salvar</button>`,
        });
    }

    async function save() {
        const id = document.getElementById('ctr-edit-id').value || Utils.generateId();
        const data = {
            id,
            client: document.getElementById('ctr-client').value.trim(),
            value: parseFloat(document.getElementById('ctr-value').value) || 0,
            startDate: document.getElementById('ctr-start').value,
            endDate: document.getElementById('ctr-end').value,
            status: document.getElementById('ctr-status').value,
            linkDrive: document.getElementById('ctr-link').value.trim(),
            obs: document.getElementById('ctr-obs').value.trim(),
            createdAt: new Date().toISOString(),
            source: 'manual'
        };

        if (!data.client) {
            Components.showToast('Nome do cliente é obrigatório', 'error');
            return;
        }

        // Atualiza localStorage
        const contracts = Storage.loadData('contracts', []);
        const editId = document.getElementById('ctr-edit-id').value;
        if (editId) {
            const idx = contracts.findIndex(c => c.id === editId);
            if (idx >= 0) contracts[idx] = data;
        } else {
            contracts.push(data);
        }
        Storage.saveData('contracts', contracts);

        // Envia para a planilha
        const row = [data.id, data.client, data.value, data.startDate, data.endDate, data.status, data.linkDrive, data.obs];
        const success = await GoogleSheets.appendRow(SHEET_NAME, row);
        Components.closeModal();
        Components.showToast(success ? 'Contrato salvo na planilha!' : 'Salvo localmente. Verifique a planilha.', success ? 'success' : 'warning');
        PLURI.navigateTo('contracts');
    }

    async function deleteContract(id) {
        const contracts = Storage.loadData('contracts', []);
        const contract = contracts.find(c => c.id === id);
        if (!contract) return;

        Components.confirmDialog({
            title: 'Excluir contrato',
            message: `Tem certeza que deseja excluir o contrato de "${contract.client}"?`,
            onConfirm: async () => {
                const updated = contracts.filter(c => c.id !== id);
                Storage.saveData('contracts', updated);
                await GoogleSheets.deleteRow(SHEET_NAME, id);
                Components.showToast('Contrato excluído!', 'success');
                PLURI.navigateTo('contracts');
            },
        });
    }

    window.Contracts = { render, openForm, save, deleteContract };
    return { render, openForm, save, deleteContract };
})();
