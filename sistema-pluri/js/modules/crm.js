/**
 * PLURI OS V2 — CRM (visual original + tags, timeline, busca instantânea)
 */
console.log('CRM carregado');

const CRM = (() => {
    function render() {
        const companies = Storage.loadData('crm_companies', []);
        const stages = Storage.loadData('crm_pipeline_stages', []);
        const filter = getActiveFilter();
        const searchTerm = getSearchTerm();

        let filtered = [...companies];
        if (filter && filter !== 'all') {
            filtered = filtered.filter(c => c.status === filter || c.stage === filter);
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                (c.company || c.name || '').toLowerCase().includes(term) ||
                (c.segment || '').toLowerCase().includes(term) ||
                (c.city || '').toLowerCase().includes(term) ||
                (c.responsible || '').toLowerCase().includes(term)
            );
        }

        return `
            <div class="fade-in">
                <!-- Toolbar -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <input type="text" id="crm-search" placeholder="Buscar empresa..." class="form-input" style="width:260px" value="${searchTerm}" oninput="CRM.applyFilter()">
                        <select id="crm-filter" class="form-select" style="width:180px" onchange="CRM.applyFilter()">
                            <option value="all">Todos os status</option>
                            ${stages.map(s => `<option value="${s.id}" ${filter === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display:flex;gap:8px">
                        <button class="btn-secondary btn-sm" onclick="CRM.exportToSheet()" title="Exportar para Google Sheets">
                            <i data-lucide="upload-cloud" class="icon-sm"></i> Exportar para Planilha
                        </button>
                        <button class="btn-primary" onclick="CRM.openCompanyForm()">
                            <i data-lucide="plus" class="icon-sm"></i> Nova Empresa
                        </button>
                    </div>
                </div>

                <!-- Pipeline (componente original com botões) -->
                <div style="margin-bottom:24px">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Pipeline</h3>
                    ${Components.renderPipeline(stages, filtered, moveCompanyStage)}
                </div>

                <!-- Tabela de empresas (componente original) -->
                <div style="margin-top:32px">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Todas as Empresas (${filtered.length})</h3>
                    ${renderTableOriginal(filtered)}
                </div>

                <!-- Timeline de atividades (simples) -->
                <div style="margin-top:32px">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Atividades Recentes</h3>
                    ${renderTimelineSimple(companies)}
                </div>
            </div>
        `;
    }

    // ==================== TABELA ORIGINAL ====================
    function renderTableOriginal(companies) {
        const headers = ['Empresa', 'Segmento', 'Cidade/UF', 'Responsável', 'Status', 'Tags', 'Último Contato', 'Ações'];
        const rows = companies.map(c => [
            c.company || c.name || '-',
            c.segment || '-',
            `${c.city || ''}${c.city && c.state ? '/' : ''}${c.state || ''}`,
            c.responsible || '-',
            `<span class="badge-tag ${getStatusClass(c.status)}">${getStatusLabel(c.status)}</span>`,
            (c.tags || []).map(t => `<span class="badge-tag neutral" style="margin-right:4px">${t}</span>`).join('') || '-',
            c.lastContact ? Utils.formatDate(c.lastContact) : '-',
            `<button class="btn-icon btn-sm" onclick="CRM.editCompany('${c.id}')" title="Editar"><i data-lucide="pencil" class="icon-sm"></i></button>
             <button class="btn-icon btn-sm" onclick="CRM.deleteCompany('${c.id}')" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>`
        ]);
        return Components.createTable({ headers, rows, emptyMessage: 'Nenhuma empresa encontrada.' });
    }

    // ==================== TIMELINE SIMPLES ====================
    function renderTimelineSimple(companies) {
        const events = companies
            .filter(c => c.updatedAt)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 10)
            .map(c => ({
                text: `${c.company || c.name} → ${getStatusLabel(c.status)}`,
                time: Utils.timeAgo(c.updatedAt),
                who: c.responsible || 'Sistema'
            }));

        if (!events.length) {
            return `<div class="card" style="text-align:center;padding:20px;color:var(--text-tertiary)">Nenhuma atividade recente.</div>`;
        }

        const items = events.map(e => `
            <div class="timeline-item">
                <div class="timeline-time">${e.time} • ${e.who}</div>
                <div class="timeline-content">${e.text}</div>
            </div>
        `).join('');

        return `<div class="card"><div class="timeline">${items}</div></div>`;
    }

    // ==================== FORMULÁRIO (com tags) ====================
    function openCompanyForm(editId = null) {
        const companies = Storage.loadData('crm_companies', []);
        const existing = editId ? companies.find(c => c.id === editId) : null;
        const stages = Storage.loadData('crm_pipeline_stages', []);
        const tagsStr = existing?.tags ? existing.tags.join(', ') : '';

        Components.openModal({
            title: existing ? 'Editar Empresa' : 'Nova Empresa',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Nome da Empresa *</label><input type="text" id="crm-name" class="form-input" value="${existing?.company || existing?.name || ''}"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Segmento</label><input type="text" id="crm-segment" class="form-input" value="${existing?.segment || ''}"></div>
                    <div class="form-group"><label class="form-label">Status</label><select id="crm-status" class="form-select">
                        ${stages.map(s => `<option value="${s.id}" ${existing?.status === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                    </select></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Cidade</label><input type="text" id="crm-city" class="form-input" value="${existing?.city || ''}"></div>
                    <div class="form-group"><label class="form-label">Estado</label><input type="text" id="crm-state" class="form-input" value="${existing?.state || ''}" maxlength="2"></div>
                </div>
                <div class="form-group"><label class="form-label">Responsável</label><input type="text" id="crm-responsible" class="form-input" value="${existing?.responsible || ''}"></div>
                <div class="form-group"><label class="form-label">WhatsApp</label><input type="text" id="crm-whatsapp" class="form-input" value="${existing?.whatsapp || ''}"></div>
                <div class="form-group"><label class="form-label">Email</label><input type="email" id="crm-email" class="form-input" value="${existing?.email || ''}"></div>
                <div class="form-group"><label class="form-label">Tags (separadas por vírgula)</label><input type="text" id="crm-tags" class="form-input" value="${tagsStr}" placeholder="VIP, Urgente, Parceiro"></div>
                <div class="form-group"><label class="form-label">Observações</label><textarea id="crm-notes" class="form-textarea" rows="3">${existing?.notes || ''}</textarea></div>
                <input type="hidden" id="crm-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button><button class="btn-primary" onclick="CRM.saveCompany()">Salvar</button>`,
        });
    }

    function saveCompany() {
        const companies = Storage.loadData('crm_companies', []);
        const editId = document.getElementById('crm-edit-id').value;
        const tagsRaw = document.getElementById('crm-tags').value.trim();
        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

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
            tags: tags,
            notes: document.getElementById('crm-notes').value.trim(),
            lastContact: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdAt: editId ? (companies.find(c => c.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        };

        if (!data.company) { Components.showToast('Nome da empresa é obrigatório', 'error'); return; }

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

    // ==================== AÇÕES DO PIPELINE ====================
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

    function editCompany(id) {
        openCompanyForm(id);
    }

    function deleteCompany(id) {
        const companies = Storage.loadData('crm_companies', []);
        const company = companies.find(c => c.id === id);
        if (!company) return;
        Components.confirmDialog({
            title: 'Excluir empresa',
            message: `Tem certeza que deseja excluir "${company.company || company.name}"?`,
            onConfirm: () => {
                const updated = companies.filter(c => c.id !== id);
                Storage.saveData('crm_companies', updated);
                Components.showToast('Empresa excluída!', 'success');
                PLURI.navigateTo('crm');
            }
        });
    }

    // ==================== EXPORTAÇÃO ====================
    async function exportToSheet() {
        const companies = Storage.loadData('crm_companies', []);
        if (!companies.length) {
            Components.showToast('Nenhuma empresa para exportar.', 'warning');
            return;
        }
        const headers = ['ID', 'Empresa', 'Segmento', 'Cidade', 'Estado', 'Responsável', 'WhatsApp', 'Email', 'Tags', 'Origem', 'Status', 'Último Contato', 'Próximo Contato', 'Observações'];
        const rows = companies.map(c => [
            c.id || '', c.company || c.name || '', c.segment || '', c.city || '', c.state || '',
            c.responsible || '', c.whatsapp || '', c.email || '',
            (c.tags || []).join(', '), c.origin || '', c.status || '',
            c.lastContact || '', c.nextContact || '', c.notes || ''
        ]);
        const data = [headers, ...rows];
        const success = await GoogleSheets.replaceSheet('CRM', data);
        Components.showToast(success ? 'CRM exportado com sucesso!' : 'Erro ao exportar.', success ? 'success' : 'error');
    }

    // ==================== FILTROS ====================
    function applyFilter() {
        PLURI.refreshCurrentModule();
    }

    function getActiveFilter() {
        const select = document.getElementById('crm-filter');
        return select ? select.value : 'all';
    }

    function getSearchTerm() {
        const input = document.getElementById('crm-search');
        return input ? input.value.trim() : '';
    }

    function getStatusClass(status) {
        const map = { lead: 'info', contact: 'warning', proposal: 'warning', negotiation: 'accent', closed: 'success', lost: 'danger' };
        return map[status] || 'neutral';
    }

    function getStatusLabel(status) {
        const map = { lead: 'Lead', contact: 'Contato', proposal: 'Proposta', negotiation: 'Negociação', closed: 'Fechado', lost: 'Perdido' };
        return map[status] || status;
    }

    window.CRM = { render, openCompanyForm, saveCompany, moveCompanyStage, editCompany, deleteCompany, exportToSheet, applyFilter };
    return { render, openCompanyForm, saveCompany, moveCompanyStage, editCompany, deleteCompany, exportToSheet, applyFilter };
})();
