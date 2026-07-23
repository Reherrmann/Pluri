/**
 * PLURI OS — Módulo Planejamento Estratégico
 * Integrado com Google Sheets (aba "Planejamento")
 */
const Planning = (() => {
  const SHEET_NAME = 'Planejamento';

  function flattenPlanning(plan) {
    return {
      mission: plan.mission || '',
      vision: plan.vision || '',
      values: plan.values || '',
      swot_strengths: plan.swot?.strengths || '',
      swot_weaknesses: plan.swot?.weaknesses || '',
      swot_opportunities: plan.swot?.opportunities || '',
      swot_threats: plan.swot?.threats || '',
      objectives: JSON.stringify(plan.objectives || [])
    };
  }

  function unflattenPlanning(flat) {
    return {
      mission: flat.mission || '',
      vision: flat.vision || '',
      values: flat.values || '',
      swot: {
        strengths: flat.swot_strengths || '',
        weaknesses: flat.swot_weaknesses || '',
        opportunities: flat.swot_opportunities || '',
        threats: flat.swot_threats || ''
      },
      objectives: safeParse(flat.objectives, [])
    };
  }

  function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch(e) { return fallback; }
  }

  async function syncFromSheet() {
    try {
      const rows = await GoogleSheets.readSheet(SHEET_NAME);
      if (!rows || !rows.length) return;
      const flat = {};
      rows.forEach(row => {
        if (row.Chave) flat[row.Chave] = row.Valor || '';
      });
      const planning = unflattenPlanning(flat);
      Storage.saveData('planning', planning);
    } catch (error) {
      console.error('[Planning] Erro na sincronização:', error);
    }
  }

  function render() {
    syncFromSheet().then(() => {
      if (PLURI.getState().currentModule === 'planning') {
        const area = document.getElementById('content-area');
        if (area) {
          area.innerHTML = renderHTML();
          lucide.createIcons();
        }
      }
    });

    return renderHTML();
  }

  function renderHTML() {
    const planning = Storage.loadData('planning', {
      mission: '', vision: '', values: '',
      swot: { strengths: '', weaknesses: '', opportunities: '', threats: '' },
      objectives: []
    });

    return `
      <div class="fade-in">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Missão</span>
              <button class="btn-icon btn-sm" onclick="Planning.editField('mission')"><i data-lucide="pencil" class="icon-sm"></i></button>
            </div>
            <p style="color:var(--text-secondary);min-height:60px;white-space:pre-wrap">${planning.mission || 'Defina a missão...'}</p>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="card-title">Visão</span>
              <button class="btn-icon btn-sm" onclick="Planning.editField('vision')"><i data-lucide="pencil" class="icon-sm"></i></button>
            </div>
            <p style="color:var(--text-secondary);min-height:60px;white-space:pre-wrap">${planning.vision || 'Defina a visão...'}</p>
          </div>
        </div>
        <div class="card" style="margin-top:20px">
          <div class="card-header">
            <span class="card-title">Valores</span>
            <button class="btn-icon btn-sm" onclick="Planning.editField('values')"><i data-lucide="pencil" class="icon-sm"></i></button>
          </div>
          <p style="color:var(--text-secondary);min-height:40px;white-space:pre-wrap">${planning.values || 'Defina os valores...'}</p>
        </div>

        <!-- SWOT -->
        <h3 style="margin-top:28px;margin-bottom:16px;font-weight:600">Análise SWOT</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${swotCard('Forças', 'swot_strengths', planning.swot.strengths, 'success')}
          ${swotCard('Fraquezas', 'swot_weaknesses', planning.swot.weaknesses, 'danger')}
          ${swotCard('Oportunidades', 'swot_opportunities', planning.swot.opportunities, 'info')}
          ${swotCard('Ameaças', 'swot_threats', planning.swot.threats, 'warning')}
        </div>

        <!-- Objetivos -->
        <h3 style="margin-top:28px;margin-bottom:16px;font-weight:600">Objetivos Estratégicos</h3>
        <div id="objectives-list">
          ${(planning.objectives || []).map((obj, i) => `
            <div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <span>${obj}</span>
              <button class="btn-icon btn-sm" onclick="Planning.removeObjective(${i})"><i data-lucide="trash-2" class="icon-sm"></i></button>
            </div>
          `).join('')}
          ${!planning.objectives?.length ? '<p style="color:var(--text-tertiary)">Nenhum objetivo definido</p>' : ''}
        </div>
        <button class="btn-secondary" style="margin-top:12px" onclick="Planning.addObjective()">
          <i data-lucide="plus" class="icon-sm"></i> Adicionar Objetivo
        </button>
      </div>
    `;
  }

  function swotCard(title, key, content, color) {
    return `
      <div class="card" style="border-left:3px solid var(--${color})">
        <div class="card-header">
          <span class="card-title">${title}</span>
          <button class="btn-icon btn-sm" onclick="Planning.editField('${key}')"><i data-lucide="pencil" class="icon-sm"></i></button>
        </div>
        <p style="color:var(--text-secondary);min-height:60px;white-space:pre-wrap">${content || 'Clique para editar...'}</p>
      </div>
    `;
  }

  function editField(field) {
    const planning = Storage.loadData('planning', {});
    let currentValue = '';
    if (field === 'mission') currentValue = planning.mission || '';
    else if (field === 'vision') currentValue = planning.vision || '';
    else if (field === 'values') currentValue = planning.values || '';
    else if (field.startsWith('swot_')) {
      const swotKey = field.replace('swot_', '');
      currentValue = planning.swot?.[swotKey] || '';
    }

    Components.openModal({
      title: `Editar ${field.replace('swot_', 'SWOT - ')}`,
      bodyHTML: `<textarea id="planning-edit-value" class="form-textarea" rows="5">${currentValue}</textarea>`,
      footerHTML: `
        <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Planning.saveField('${field}')">Salvar</button>
      `,
    });
  }

  async function saveField(field) {
    const planning = Storage.loadData('planning', {});
    const value = document.getElementById('planning-edit-value').value;

    // Atualiza localmente
    if (field === 'mission') planning.mission = value;
    else if (field === 'vision') planning.vision = value;
    else if (field === 'values') planning.values = value;
    else if (field.startsWith('swot_')) {
      if (!planning.swot) planning.swot = {};
      planning.swot[field.replace('swot_', '')] = value;
    }
    Storage.saveData('planning', planning);
    Components.closeModal();

    // Envia para a planilha
    const success = await GoogleSheets.updateCell(SHEET_NAME, field, value);
    Components.showToast(success ? 'Salvo na planilha!' : 'Salvo localmente, mas falha na planilha', success ? 'success' : 'warning');

    // Recarrega a UI
    const area = document.getElementById('content-area');
    if (area) {
      area.innerHTML = renderHTML();
      lucide.createIcons();
    }
  }

  function addObjective() {
    Components.openModal({
      title: 'Novo Objetivo',
      bodyHTML: `<input type="text" id="new-objective" class="form-input" placeholder="Descreva o objetivo...">`,
      footerHTML: `
        <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Planning.saveObjective()">Adicionar</button>
      `,
    });
  }

  async function saveObjective() {
    const planning = Storage.loadData('planning', {});
    if (!planning.objectives) planning.objectives = [];
    const newObj = document.getElementById('new-objective').value.trim();
    if (!newObj) return;

    planning.objectives.push(newObj);
    Storage.saveData('planning', planning);
    Components.closeModal();

    const success = await GoogleSheets.updateCell(SHEET_NAME, 'objectives', JSON.stringify(planning.objectives));
    Components.showToast(success ? 'Objetivo adicionado e salvo na planilha!' : 'Adicionado localmente, erro na planilha.', success ? 'success' : 'warning');

    const area = document.getElementById('content-area');
    if (area) {
      area.innerHTML = renderHTML();
      lucide.createIcons();
    }
  }

  async function removeObjective(index) {
    const planning = Storage.loadData('planning', {});
    planning.objectives.splice(index, 1);
    Storage.saveData('planning', planning);

    const success = await GoogleSheets.updateCell(SHEET_NAME, 'objectives', JSON.stringify(planning.objectives));
    Components.showToast(success ? 'Removido da planilha!' : 'Removido localmente.', success ? 'success' : 'warning');

    const area = document.getElementById('content-area');
    if (area) {
      area.innerHTML = renderHTML();
      lucide.createIcons();
    }
  }

  window.Planning = { render, editField, saveField, addObjective, saveObjective, removeObjective };
  return { render, editField, saveField, addObjective, saveObjective, removeObjective };
})();
