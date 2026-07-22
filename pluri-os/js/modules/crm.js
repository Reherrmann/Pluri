/**
 * PLURI OS — Módulo CRM
 * Cadastro de empresas, pipeline, busca, filtros
 */
const CRM = (() => {
    function render() {
        const companies = Storage.loadData('crm_companies', []);
        const stages = Storage.loadData('crm_pipeline_stages', []);
        const filter = getActiveFilter();

        let filtered = [...companies];
        if (filter && filter !== 'all') {
            filtered = companies.filter(c => c.status === filter || c.stage === filter);
        }

        return `
            <div class="fade-in">
                <!-- Toolbar -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <input type="text" id="crm-search" placeholder="Buscar empresa..." class="form-input" style="width:260px">
                        <select id="crm-filter" class="form-select" style="width:180px" onchange="CRM.applyFilter()">
                            <option value="all">Todos os status</option>
                            ${stages.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn-primary" onclick="CRM.openCompanyForm()">
                        <i data-lucide="plus" class="icon-sm"></i> Nova Empresa
                    </button>
                </div>

                <!-- Pipeline Kanban -->
                <div style="margin-bottom:24px">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Pipeline</h3>
                    ${Components.renderPipeline(stages, filtered, moveCompanyStage)}
                </div>

                <!-- Tabela de empresas -->
                <div style="margin-top:32px">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Todas as Empresas (${filtered.length})</h3>
                    <div id="crm-table-container">
                        ${renderTable(filtered)}
                    </div>
                </div>
            </div>
        `;
    }

    function renderTable(companies) {
        const headers = ['Empresa', 'Segmento', 'Cidade/UF', 'Responsável', 'Status', 'Último Contato'];
        const rows = companies.map(c => [
            c.company || c.name || '-',
            c.segment || '-',
            `${c.city || ''}${c.city && c.state ? '/' : ''}${c.state || ''}`,
            c.responsible || '-',
            `<span class="badge-tag ${getStatusClass(c.status)}">${getStatusLabel(c.status)}</span>`,
            c.lastContact ? Utils.formatDate(c.lastContact) : '-',
        ]);
        return Components.createTable({ headers, rows, emptyMessage: 'Nenhuma empresa cadastrada' });
    }

    function openCompanyForm(editId = null) {
        const companies = Storage.loadData('crm_companies', []);
        const existing = editId ? companies.find(c => c.id === editId) : null;
        const stages = Storage.loadData('crm_pipeline_stages', []);

        Components.openModal({
            title: existing ? 'Editar Empresa' : 'Nova Empresa',
            bodyHTML: `
                <div class="form-group">
                    <label class="form-label">Nome da Empresa *</label>
                    <input type="text" id="crm-name" class="form-input" value="${existing?.company || existing?.name || ''}" placeholder="Nome da empresa">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Segmento</label>
                        <input type="text" id="crm-segment" class="form-input" value="${existing?.segment || ''}" placeholder="Ex: Tecnologia">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="crm-status" class="form-select">
                            ${stages.map(s => `<option value="${s.id}" ${existing?.status === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Cidade</label>
                        <input type="text" id="crm-city" class="form-input" value="${existing?.city || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Estado</label>
                        <input type="text" id="crm-state" class="form-input" value="${existing?.state || ''}" maxlength="2">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Responsável</label>
                    <input type="text" id="crm-responsible" class="form-input" value="${existing?.responsible || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">WhatsApp</label>
                    <input type="text" id="crm-whatsapp" class="form-input" value="${existing?.whatsapp || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" id="crm-email" class="form-input" value="${existing?.email || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Observações</label>
                    <textarea id="crm-notes" class="form-textarea" rows="3">${existing?.notes || ''}</textarea>
                </div>
                <input type="hidden" id="crm-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `
                <button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                <button class="btn-primary" onclick="CRM.saveCompany()">Salvar</button>
            `,
        });
    }

    function saveCompany() {
        const companies = Storage.loadData('crm_companies', []);
        const editId = document.getElementById('crm-edit-id').value;

        const data = {
            id: editId || Utils.generateId(),
            company: document.getElementById('crm-name').value.trim(),
            name: document.getElementById('crm-name').value.trim(),
            segment: document.getElementById('crm-segment').value.trim(),
            status: document.getElementById('crm-status').value,
            stage: document.getElementById('crm-status').value,
            city: document.getElementById('crm-city').value.trim(),
            state: document.getElementById('crm-state').value.trim().toUpperCase(),
            responsible: document.getElementById('crm-responsible').value.trim(),
            whatsapp: document.getElementById('crm-whatsapp').value.trim(),
            email: document.getElementById('crm-email').value.trim(),
            notes: document.getElementById('crm-notes').value.trim(),
            lastContact: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdAt: editId ? (companies.find(c => c.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        };

        if (!data.company) {
            Components.showToast('Nome da empresa é obrigatório', 'error');
            return;
        }

        if (editId) {
            const index = companies.findIndex(c => c.id === editId);
            if (index >= 0) companies[index] = data;
        } else {
            companies.push(data);
        }

        Storage.saveData('crm_companies', companies);
        Components.closeModal();
        Components.showToast(editId ? 'Empresa atualizada!' : 'Empresa cadastrada!', 'success');
        PLURI.navigateTo('crm');
    }

    function moveCompanyStage(companyId, newStage) {
        const companies = Storage.loadData('crm_companies', []);
        const company = companies.find(c => c.id === companyId);
        if (company) {
            company.status = newStage;
            company.stage = newStage;
            company.updatedAt = new Date().toISOString();
            Storage.saveData('crm_companies', companies);
            Components.showToast('Empresa movida no pipeline', 'success');
            PLURI.refreshCurrentModule();
        }
    }

    function applyFilter() {
        PLURI.refreshCurrentModule();
    }

    function getActiveFilter() {
        const select = document.getElementById('crm-filter');
        return select ? select.value : 'all';
    }

    function getStatusClass(status) {
        const map = {
            lead: 'info',
            contact: 'warning',
            proposal: 'warning',
            negotiation: 'accent',
            closed: 'success',
            lost: 'danger',
        };
        return map[status] || 'neutral';
    }

    function getStatusLabel(status) {
        const map = {
            lead: 'Lead',
            contact: 'Contato',
            proposal: 'Proposta',
            negotiation: 'Negociação',
            closed: 'Fechado',
            lost: 'Perdido',
        };
        return map[status] || status;
    }

    // Expor funções globalmente para os event handlers inline
    window.CRM = {
        render,
        openCompanyForm,
        saveCompany,
        moveCompanyStage,
        applyFilter,
        getActiveFilter,
    };

    return { render, openCompanyForm, saveCompany, moveCompanyStage, applyFilter };
})();
