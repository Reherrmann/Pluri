/**
 * PLURI OS — Módulo Planejamento Estratégico
 */
const Planning = (() => {
    function render() {
        const planning = Storage.loadData('planning', {
            mission: '',
            vision: '',
            values: '',
            swot: { strengths: '', weaknesses: '', opportunities: '', threats: '' },
            objectives: [],
        });

        return `
            <div class="fade-in">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                    <!-- Missão, Visão, Valores -->
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Missão</span>
                            <button class="btn-icon btn-sm" onclick="Planning.editField('mission')"><i data-lucide="pencil" class="icon-sm"></i></button>
                        </div>
                        <p style="color:var(--text-secondary);min-height:60px">${planning.mission || 'Defina a missão da PLURI...'}</p>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Visão</span>
                            <button class="btn-icon btn-sm" onclick="Planning.editField('vision')"><i data-lucide="pencil" class="icon-sm"></i></button>
                        </div>
                        <p style="color:var(--text-secondary);min-height:60px">${planning.vision || 'Defina a visão de futuro...'}</p>
                    </div>
                </div>

                <div class="card" style="margin-top:20px">
                    <div class="card-header">
                        <span class="card-title">Valores</span>
                        <button class="btn-icon btn-sm" onclick="Planning.editField('values')"><i data-lucide="pencil" class="icon-sm"></i></button>
                    </div>
                    <p style="color:var(--text-secondary);min-height:40px">${planning.values || 'Defina os valores da empresa...'}</p>
                </div>

                <!-- SWOT -->
                <h3 style="margin-top:28px;margin-bottom:16px;font-weight:600">Análise SWOT</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                    ${swotCard('Forças', 'strengths', planning.swot?.strengths || '', 'success')}
                    ${swotCard('Fraquezas', 'weaknesses', planning.swot?.weaknesses || '', 'danger')}
                    ${swotCard('Oportunidades', 'opportunities', planning.swot?.opportunities || '', 'info')}
                    ${swotCard('Ameaças', 'threats', planning.swot?.threats || '', 'warning')}
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
                    <button class="btn-icon btn-sm" onclick="Planning.editField('swot_${key}')"><i data-lucide="pencil" class="icon-sm"></i></button>
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
            title: `Editar ${field.replace('swot_', 'SWOT — ')}`,
            bodyHTML: `<textarea id="planning-edit-value" class="form-textarea" rows="5">${currentValue}</textarea>`,
            footerHTML: `
                <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                <button class="btn-primary" onclick="Planning.saveField('${field}')">Salvar</button>
            `,
        });
    }

    function saveField(field) {
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
        Components.showToast('Planejamento atualizado!', 'success');
        PLURI.refreshCurrentModule();
    }

    function addObjective() {
        Components.openModal({
            title: 'Novo Objetivo',
            bodyHTML: `<input type="text" id="new-objective" class="form-input" placeholder="Descreva o objetivo estratégico...">`,
            footerHTML: `
                <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                <button class="btn-primary" onclick="Planning.saveObjective()">Adicionar</button>
            `,
        });
    }

    function saveObjective() {
        const planning = Storage.loadData('planning', {});
        if (!planning.objectives) planning.objectives = [];
        const value = document.getElementById('new-objective').value.trim();
        if (value) {
            planning.objectives.push(value);
            Storage.saveData('planning', planning);
            Components.closeModal();
            Components.showToast('Objetivo adicionado!', 'success');
            PLURI.refreshCurrentModule();
        }
    }

    function removeObjective(index) {
        const planning = Storage.loadData('planning', {});
        planning.objectives.splice(index, 1);
        Storage.saveData('planning', planning);
        PLURI.refreshCurrentModule();
    }

    window.Planning = { render, editField, saveField, addObjective, saveObjective, removeObjective };
    return { render, editField, saveField, addObjective, saveObjective, removeObjective };
})();
