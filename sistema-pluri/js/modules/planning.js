/**
 * PLURI OS V2 — Módulo Planejamento Estratégico (UX melhorado)
 * Objetivos em destaque no topo, SWOT e identidade na base, botão IA.
 * Integração com Google Sheets preservada.
 */
const Planning = (() => {
  const SHEET_NAME = 'Planejamento';

  // ==================== SINCRONIZAÇÃO (INALTERADA) ====================
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

  // ==================== RENDERIZAÇÃO (NOVO LAYOUT) ====================
  function renderHTML() {
    const planning = Storage.loadData('planning', {
      mission: '', vision: '', values: '',
      swot: { strengths: '', weaknesses: '', opportunities: '', threats: '' },
      objectives: []
    });

    return `
      <div class="fade-in">
        <!-- ===== SEÇÃO 1: OBJETIVOS ESTRATÉGICOS (DESTAQUE) ===== -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="font-weight:700;font-size:1.3rem;letter-spacing:-0.02em">🎯 Objetivos Estratégicos</h2>
          <div style="display:flex;gap:8px">
            <button class="btn-secondary btn-sm" onclick="Planning.showIA()" title="Sugerir com IA">
              <i data-lucide="sparkles" class="icon-sm"></i> Sugerir com IA
            </button>
            <button class="btn-primary btn-sm" onclick="Planning.addObjective()">
              <i data-lucide="plus" class="icon-sm"></i> Novo Objetivo
            </button>
          </div>
        </div>

        <div id="objectives-list" style="margin-bottom:32px">
          ${(planning.objectives || []).length ? planning.objectives.map((obj, i) => `
            <div class="card" style="margin-bottom:12px;display:flex;align-items:center;gap:16px">
              <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-subtle);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${i + 1}</div>
              <div style="flex:1;font-size:0.95rem;color:var(--text-primary)">${obj}</div>
              <div style="display:flex;gap:4px">
                <button class="btn-icon btn-sm" onclick="Planning.editObjective(${i})" title="Editar"><i data-lucide="pencil" class="icon-sm"></i></button>
                <button class="btn-icon btn-sm" onclick="Planning.removeObjective(${i})" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>
              </div>
            </div>
          `).join('') : `
            <div class="card" style="text-align:center;padding:40px;color:var(--text-tertiary)">
              <p style="font-size:1.5rem;margin-bottom:8px">🎯</p>
              <p>Nenhum objetivo estratégico definido ainda.</p>
              <p style="font-size:0.85rem">Clique em "Novo Objetivo" ou use a IA para sugerir.</p>
            </div>
          `}
        </div>

        <!-- ===== SEÇÃO 2: IDENTIDADE (MISSÃO, VISÃO, VALORES) ===== -->
        <h2 style="font-weight:700;font-size:1.3rem;letter-spacing:-0.02em;margin-bottom:16px">📖 Identidade Organizacional</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
          ${editableCard('Missão', 'mission', planning.mission, 'Defina a missão da empresa...')}
          ${editableCard('Visão', 'vision', planning.vision, 'Defina a visão de futuro...')}
        </div>
        <div style="margin-bottom:24px">
          ${editableCard('Valores', 'values', planning.values, 'Defina os valores da empresa...', true)}
        </div>

        <!-- ===== SEÇÃO 3: ANÁLISE SWOT ===== -->
        <h2 style="font-weight:700;font-size:1.3rem;letter-spacing:-0.02em;margin-bottom:16px">🔍 Análise SWOT</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${swotCard('Forças', 'swot_strengths', planning.swot.strengths, 'success')}
          ${swotCard('Fraquezas', 'swot_weaknesses', planning.swot.weaknesses, 'danger')}
          ${swotCard('Oportunidades', 'swot_opportunities', planning.swot.opportunities, 'info')}
          ${swotCard('Ameaças', 'swot_threats', planning.swot.threats, 'warning')}
        </div>
      </div>
    `;
  }

  // ==================== COMPONENTES VISUAIS (NOVOS) ====================
  function editableCard(title, field, content, placeholder, fullWidth = false) {
    return `
      <div class="card" style="${fullWidth ? '' : ''}">
        <div class="card-header">
          <span class="card-title">${title}</span>
          <button class="btn-icon btn-sm" onclick="Planning.editField('${field}')"><i data-lucide="pencil" class="icon-sm"></i></button>
        </div>
        <p style="color:var(--text-secondary);min-height:${fullWidth ? '40px' : '60px'};white-space:pre-wrap">${content || placeholder}</p>
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

  // ==================== EDIÇÃO (INALTERADA) ====================
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

    if (field === 'mission') planning.mission = value;
    else if (field === 'vision') planning.vision = value;
    else if (field === 'values') planning.values = value;
    else if (field.startsWith('swot_')) {
      if (!planning.swot) planning.swot = {};
      planning.swot[field.replace('swot_', '')] = value;
    }
    Storage.saveData('planning', planning);
    Components.closeModal();

    const success = await GoogleSheets.updateCell(SHEET_NAME, field, value);
    Components.showToast(success ? 'Salvo na planilha!' : 'Salvo localmente.', success ? 'success' : 'warning');

    const area = document.getElementById('content-area');
    if (area) {
      area.innerHTML = renderHTML();
      lucide.createIcons();
    }
  }

  // ==================== OBJETIVOS (COM EDIÇÃO) ====================
  function addObjective() {
    Components.openModal({
      title: 'Novo Objetivo',
      bodyHTML: `<textarea id="new-objective" class="form-textarea" rows="4" placeholder="Descreva o objetivo estratégico..."></textarea>`,
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
    Components.showToast(success ? 'Objetivo adicionado e salvo na planilha!' : 'Adicionado localmente.', success ? 'success' : 'warning');

    const area = document.getElementById('content-area');
    if (area) {
      area.innerHTML = renderHTML();
      lucide.createIcons();
    }
  }

  function editObjective(index) {
    const planning = Storage.loadData('planning', {});
    const current = planning.objectives?.[index] || '';

    Components.openModal({
      title: 'Editar Objetivo',
      bodyHTML: `<textarea id="edit-objective" class="form-textarea" rows="4">${current}</textarea>`,
      footerHTML: `
        <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Planning.updateObjective(${index})">Salvar</button>
      `,
    });
  }

  async function updateObjective(index) {
    const planning = Storage.loadData('planning', {});
    if (!planning.objectives) return;
    const newText = document.getElementById('edit-objective').value.trim();
    if (!newText) return;

    planning.objectives[index] = newText;
    Storage.saveData('planning', planning);
    Components.closeModal();

    const success = await GoogleSheets.updateCell(SHEET_NAME, 'objectives', JSON.stringify(planning.objectives));
    Components.showToast(success ? 'Objetivo atualizado!' : 'Atualizado localmente.', success ? 'success' : 'warning');

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
    Components.showToast(success ? 'Objetivo removido.' : 'Removido localmente.', success ? 'success' : 'warning');

    const area = document.getElementById('content-area');
    if (area) {
      area.innerHTML = renderHTML();
      lucide.createIcons();
    }
  }

  // ==================== IA (PLACEHOLDER) ====================
  function showIA() {
    Components.openModal({
      title: '✨ PLURI IA — Assistente Estratégico',
      bodyHTML: `
        <div style="text-align:center;padding:20px">
          <p style="font-size:3rem;margin-bottom:16px">🧠</p>
          <h3 style="margin-bottom:8px">Em breve!</h3>
          <p style="color:var(--text-secondary);margin-bottom:16px">
            A inteligência artificial da PLURI analisará seus objetivos atuais e sugerirá novas estratégias com base no seu mercado, SWOT e metas.
          </p>
          <p style="font-size:0.85rem;color:var(--text-tertiary)">
            Esta funcionalidade estará disponível em uma atualização futura.
          </p>
        </div>
      `,
      footerHTML: `<button class="btn-primary" onclick="Components.closeModal()">Entendido</button>`,
    });
  }

  window.Planning = { render, editField, saveField, addObjective, saveObjective, editObjective, updateObjective, removeObjective, showIA };
  return { render, editField, saveField, addObjective, saveObjective, editObjective, updateObjective, removeObjective, showIA };
})();
