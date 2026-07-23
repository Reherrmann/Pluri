/**
 * PLURI OS — Módulo Contratos
 * Integrado com Google Sheets (aba "Contratos")
 */
const Contracts = (() => {
  const SHEET_NAME = 'Contratos';

  /**
   * Sincroniza contratos da planilha com localStorage
   */
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
        driveLink: row['Link Drive'] || '',
        notes: row['Observações'] || '',
        source: 'planilha'
      }));

      // Mescla com contratos manuais
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
          <h3 style="font-size:1rem;font-weight:600">Contratos (${contracts.length})</h3>
          <button class="btn-primary" onclick="Contracts.openForm()">
            <i data-lucide="plus" class="icon-sm"></i> Novo Contrato
          </button>
        </div>
        ${renderTable(contracts)}
      </div>
    `;
  }

  function renderTable(contracts) {
    if (!contracts || !contracts.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>Nenhum contrato cadastrado</h3>
          <p>Cadastre contratos para acompanhar vigências e receitas.</p>
        </div>
      `;
    }

    const headers = ['Cliente', 'Valor', 'Início', 'Fim', 'Status', 'Link', 'Ações'];
    const rows = contracts.map(c => [
      c.client || '-',
      Utils.formatCurrency(c.value),
      Utils.formatDate(c.startDate),
      Utils.formatDate(c.endDate),
      `<span class="badge-tag ${c.status === 'ativo' ? 'success' : 'neutral'}">${c.status || 'pendente'}</span>`,
      c.driveLink ? `<a href="${c.driveLink}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none">Abrir</a>` : '-',
      `<div style="display:flex;gap:4px">
        <button class="btn-icon btn-sm" onclick="Contracts.openForm('${c.id}')" title="Editar"><i data-lucide="pencil" class="icon-sm"></i></button>
        <button class="btn-icon btn-sm" onclick="Contracts.deleteContract('${c.id}')" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>
      </div>`
    ]);

    return Components.createTable({ headers, rows });
  }

  function openForm(editId = null) {
    const contracts = Storage.loadData('contracts', []);
    const existing = editId ? contracts.find(c => c.id === editId) : null;

    Components.openModal({
      title: existing ? 'Editar Contrato' : 'Novo Contrato',
      bodyHTML: `
        <div class="form-group">
          <label class="form-label">Cliente</label>
          <input type="text" id="ctr-client" class="form-input" value="${existing?.client || ''}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Valor (R$)</label>
            <input type="number" id="ctr-value" class="form-input" step="0.01" value="${existing?.value || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="ctr-status" class="form-select">
              <option value="ativo" ${existing?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
              <option value="encerrado" ${existing?.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
              <option value="pendente" ${existing?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Início</label>
            <input type="date" id="ctr-start" class="form-input" value="${existing?.startDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Fim</label>
            <input type="date" id="ctr-end" class="form-input" value="${existing?.endDate || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Link do contrato (Google Drive)</label>
          <input type="url" id="ctr-link" class="form-input" value="${existing?.driveLink || ''}" placeholder="https://drive.google.com/...">
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea id="ctr-notes" class="form-textarea" rows="3">${existing?.notes || ''}</textarea>
        </div>
        <input type="hidden" id="ctr-edit-id" value="${existing?.id || ''}">
      `,
      footerHTML: `
        <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Contracts.save()">Salvar</button>
      `,
    });
  }

  async function save() {
    const contracts = Storage.loadData('contracts', []);
    const editId = document.getElementById('ctr-edit-id').value;

    const data = {
      id: editId || Utils.generateId(),
      client: document.getElementById('ctr-client').value.trim(),
      value: parseFloat(document.getElementById('ctr-value').value) || 0,
      startDate: document.getElementById('ctr-start').value,
      endDate: document.getElementById('ctr-end').value,
      status: document.getElementById('ctr-status').value,
      driveLink: document.getElementById('ctr-link').value.trim(),
      notes: document.getElementById('ctr-notes').value.trim(),
      createdAt: editId ? (contracts.find(c => c.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      source: editId ? (contracts.find(c => c.id === editId)?.source || 'manual') : 'manual'
    };

    if (!data.client) {
      Components.showToast('Nome do cliente é obrigatório', 'error');
      return;
    }

    // Atualiza localStorage
    if (editId) {
      const index = contracts.findIndex(c => c.id === editId);
      if (index >= 0) contracts[index] = data;
    } else {
      contracts.push(data);
    }
    Storage.saveData('contracts', contracts);

    // Envia para a planilha (append)
    const row = [
      data.id,
      data.client,
      data.value,
      data.startDate,
      data.endDate,
      data.status,
      data.driveLink,
      data.notes
    ];
    const success = await GoogleSheets.appendRow(SHEET_NAME, row);
    Components.closeModal();
    Components.showToast(success ? 'Contrato salvo na planilha!' : 'Salvo localmente, mas falha ao enviar para planilha.', success ? 'success' : 'warning');
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

        if (contract.source === 'planilha' || contract.id) {
          await GoogleSheets.deleteRow(SHEET_NAME, contract.id);
        }

        Components.showToast('Contrato excluído!', 'success');
        PLURI.navigateTo('contracts');
      },
    });
  }

  window.Contracts = { render, openForm, save, deleteContract };
  return { render, openForm, save, deleteContract };
})();
