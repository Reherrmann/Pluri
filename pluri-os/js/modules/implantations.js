const Implantations = (() => {
  const SHEET_NAME = 'Implantacoes';
  let isSyncing = false;

  async function syncFromSheet() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const rows = await GoogleSheets.readSheet(SHEET_NAME);
      if (!rows || !rows.length) { isSyncing = false; return; }

      const implantationsFromSheet = rows.map(row => ({
        id: row['ID'] || Utils.generateId(),
        client: row['Cliente'] || '',
        status: row['Status'] || 'pendente',
        startDate: row['Início'] || '',
        estimatedEnd: row['Previsão'] || '',
        progress: parseInt(row['Progresso']) || 0,
        responsible: row['Responsável'] || '',
        source: 'planilha',
        createdAt: new Date().toISOString()
      }));

      const local = Storage.loadData('implantations', []);
      const manual = local.filter(i => i.source !== 'planilha');
      const merged = [...manual, ...implantationsFromSheet];
      Storage.saveData('implantations', merged);

      if (PLURI.getState().currentModule === 'implantations') {
        const area = document.getElementById('content-area');
        if (area) {
          area.innerHTML = renderInternal();
          lucide.createIcons();
        }
      }
    } catch (error) {
      console.error('[Implantations] Erro na sincronização:', error);
    } finally {
      isSyncing = false;
    }
  }

  function render() {
    syncFromSheet();
    return renderInternal();
  }

  function renderInternal() {
    const implantations = Storage.loadData('implantations', []);
    return `
      <div class="fade-in">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h3 style="font-size:1rem;font-weight:600">Implantações (${implantations.length})</h3>
          <button class="btn-primary" onclick="Implantations.openForm()"><i data-lucide="plus" class="icon-sm"></i> Nova Implantação</button>
        </div>
        ${renderTable(implantations)}
      </div>
    `;
  }

  function renderTable(implantations) {
    if (!implantations || !implantations.length) {
      return `<div class="empty-state"><div class="empty-state-icon">🚀</div><h3>Nenhuma implantação em andamento</h3><p>Cadastre uma nova implantação para começar.</p></div>`;
    }
    const headers = ['Cliente', 'Status', 'Início', 'Previsão', 'Progresso', 'Ações'];
    const rows = implantations.map(imp => [
      imp.client || '-',
      `<span class="badge-tag ${imp.status === 'concluida' ? 'success' : imp.status === 'em_andamento' ? 'warning' : 'info'}">${imp.status || 'pendente'}</span>`,
      Utils.formatDate(imp.startDate),
      Utils.formatDate(imp.estimatedEnd),
      `<div class="progress-bar" style="width:100px"><div class="progress-fill" style="width:${imp.progress || 0}%"></div></div> ${imp.progress || 0}%`,
      `<button class="btn-icon btn-sm" onclick="Implantations.editForm('${imp.id}')" title="Editar"><i data-lucide="pencil" class="icon-sm"></i></button>
       <button class="btn-icon btn-sm" onclick="Implantations.deleteImplantation('${imp.id}')" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>`
    ]);
    return Components.createTable({ headers, rows });
  }

  function openForm(editId = null) {
    const implantations = Storage.loadData('implantations', []);
    const existing = editId ? implantations.find(i => i.id === editId) : null;
    Components.openModal({
      title: existing ? 'Editar Implantação' : 'Nova Implantação',
      bodyHTML: `
        <div class="form-group"><label class="form-label">Cliente</label><input type="text" id="imp-client" class="form-input" value="${existing?.client || ''}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Início</label><input type="date" id="imp-start" class="form-input" value="${existing?.startDate || ''}"></div>
          <div class="form-group"><label class="form-label">Previsão de Término</label><input type="date" id="imp-end" class="form-input" value="${existing?.estimatedEnd || ''}"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Progresso (%)</label><input type="number" id="imp-progress" class="form-input" value="${existing?.progress || 0}" min="0" max="100"></div>
          <div class="form-group"><label class="form-label">Status</label><select id="imp-status" class="form-select">
            <option value="pendente" ${existing?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="em_andamento" ${existing?.status === 'em_andamento' ? 'selected' : ''}>Em andamento</option>
            <option value="concluida" ${existing?.status === 'concluida' ? 'selected' : ''}>Concluída</option>
          </select></div>
        </div>
        <div class="form-group"><label class="form-label">Responsável</label><input type="text" id="imp-responsible" class="form-input" value="${existing?.responsible || ''}"></div>
        <input type="hidden" id="imp-edit-id" value="${existing?.id || ''}">
      `,
      footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button><button class="btn-primary" onclick="Implantations.save()">Salvar</button>`,
    });
  }

  async function save() {
    const implantations = Storage.loadData('implantations', []);
    const editId = document.getElementById('imp-edit-id').value;
    const data = {
      id: editId || Utils.generateId(),
      client: document.getElementById('imp-client').value.trim(),
      status: document.getElementById('imp-status').value,
      startDate: document.getElementById('imp-start').value,
      estimatedEnd: document.getElementById('imp-end').value,
      progress: parseInt(document.getElementById('imp-progress').value) || 0,
      responsible: document.getElementById('imp-responsible').value.trim(),
      createdAt: editId ? (implantations.find(i => i.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      source: editId ? (implantations.find(i => i.id === editId)?.source || 'manual') : 'manual'
    };
    if (!data.client) { Components.showToast('Nome do cliente é obrigatório', 'error'); return; }

    if (editId) {
      const index = implantations.findIndex(i => i.id === editId);
      if (index >= 0) implantations[index] = data;
    } else {
      implantations.push(data);
    }
    Storage.saveData('implantations', implantations);

    const row = [data.id, data.client, data.status, data.startDate, data.estimatedEnd, data.progress, data.responsible];
    const success = await GoogleSheets.appendRow(SHEET_NAME, row);
    Components.closeModal();
    Components.showToast(success ? 'Implantação salva na planilha!' : 'Salva localmente.', success ? 'success' : 'warning');

    const area = document.getElementById('content-area');
    if (area) {
      area.innerHTML = renderInternal();
      lucide.createIcons();
    }
  }

  async function deleteImplantation(id) {
    const implantations = Storage.loadData('implantations', []);
    const imp = implantations.find(i => i.id === id);
    if (!imp) return;
    Components.confirmDialog({
      title: 'Excluir implantação',
      message: `Tem certeza que deseja excluir a implantação de "${imp.client}"?`,
      onConfirm: async () => {
        const updated = implantations.filter(i => i.id !== id);
        Storage.saveData('implantations', updated);
        if (imp.source === 'planilha' || imp.id) await GoogleSheets.deleteRow(SHEET_NAME, imp.id);
        Components.showToast('Implantação excluída!', 'success');
        const area = document.getElementById('content-area');
        if (area) {
          area.innerHTML = renderInternal();
          lucide.createIcons();
        }
      },
    });
  }

  function editForm(id) { openForm(id); }

  window.Implantations = { render, openForm, save, editForm, deleteImplantation };
  return { render, openForm, save, editForm, deleteImplantation };
})();
