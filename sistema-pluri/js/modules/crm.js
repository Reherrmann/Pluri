/**
 * PLURI OS V2 — Módulo CRM V2
 * Pipeline premium, tags, timeline de atividades, busca instantânea.
 * Mantém toda a lógica de negócio e integração com Google Sheets.
 */
console.log('CRM V2 carregado');

const CRM = (() => {
    // ==================== RENDER PRINCIPAL ====================
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
                <!-- TOOLBAR -->
                <div class="dv-crm-toolbar">
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <input type="text" id="crm-search" placeholder="Buscar empresa..." class="form-input" style="width:260px"
                               value="${searchTerm}" oninput="CRM.applyFilter()">
                        <select id="crm-filter" class="form-select" style="width:180px" onchange="CRM.applyFilter()">
                            <option value="all">Todos os status</option>
                            ${stages.map(s => `<option value="${s.id}" ${filter === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display:flex;gap:8px">
                        <button class="btn-secondary btn-sm" onclick="CRM.exportToSheet()" title="Exportar para Google Sheets">
                            <i data-lucide="upload-cloud" class="icon-sm"></i> Exportar para Planilha
                        </button>
                        <button class="btn-primary" onclick="CRM.openCompanyForm()" style="background:var(--dv-accent);color:#0a0e17;border:none;font-weight:600">
                            <i data-lucide="plus" class="icon-sm"></i> Nova Empresa
                        </button>
                    </div>
                </div>

                <!-- PIPELINE -->
                <div style="margin-bottom:24px">
                    <div class="dv-section-title">
                        <i data-lucide="columns" class="icon-sm" style="color:var(--dv-accent)"></i> Pipeline
                    </div>
                    ${renderPipelineV2(stages, filtered)}
                </div>

                <!-- TABELA -->
                <div style="margin-top:32px">
                    <div class="dv-section-title">
                        <i data-lucide="list" class="icon-sm" style="color:var(--dv-accent)"></i> Todas as Empresas (${filtered.length})
                    </div>
                    ${renderTableV2(filtered)}
                </div>

                <!-- TIMELINE -->
                <div style="margin-top:32px">
                    <div class="dv-section-title">
                        <i data-lucide="clock" class="icon-sm" style="color:var(--dv-accent)"></i> Atividades Recentes
                    </div>
                    ${renderTimeline(companies)}
                </div>
            </div>
        `;
    }

    // ==================== PIPELINE V2 ====================
    function renderPipelineV2(stages, items) {
        const stageHTML = stages.map(stage => {
            const stageItems = items.filter(item => item.stage === stage.id || item.status === stage.id);
            const totalValue = stageItems.reduce((sum, item) => sum + (parseFloat(item.value || 0)), 0);

            const cardsHTML = stageItems.map(item => {
                const initials = (item.responsible || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                return `
                    <div class="dv-pipeline-card" draggable="true"
                         data-id="${item.id}" data-stage="${stage.id}"
                         ondragstart="event.dataTransfer.setData('text/plain', '${item.id}'); this.classList.add('dragging')"
                         ondragend="this.classList.remove('dragging')">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                            <strong style="font-size:0.85rem;color:var(--dv-text-primary)">${item.company || item.name || 'Sem nome'}</strong>
                            <div class="dv-pipeline-card-actions">
                                <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CRM.editCompany('${item.id}')" title="Editar" style="color:var(--dv-text-tertiary)">
                                    <i data-lucide="pencil" class="icon-sm"></i>
                                </button>
                                <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CRM.deleteCompany('${item.id}')" title="Excluir" style="color:var(--dv-text-tertiary)">
                                    <i data-lucide="trash-2" class="icon-sm"></i>
                                </button>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                            <div style="width:22px;height:22px;border-radius:50%;background:var(--dv-accent-soft);color:var(--dv-accent);display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:600">${initials}</div>
                            <span style="font-size:0.75rem;color:var(--dv-text-tertiary)">${item.responsible || 'Não atribuído'}</span>
                        </div>
                        ${item.value ? `<div style="font-size:0.9rem;font-weight:600;color:var(--dv-accent)">${Utils.formatCurrency(item.value)}</div>` : ''}
                        ${item.tags && item.tags.length ? `<div style="margin-top:6px">${item.tags.map(t => `<span class="dv-tag">${t}</span>`).join('')}</div>` : ''}
                    </div>
                `;
            }).join('');

            return `
                <div class="dv-pipeline-column"
                     ondragover="event.preventDefault()"
                     ondragenter="event.currentTarget.classList.add('drag-over')"
                     ondragleave="event.currentTarget.classList.remove('drag-over')"
                     ondrop="event.preventDefault();
                              event.currentTarget.classList.remove('drag-over');
                              const itemId = event.dataTransfer.getData('text/plain');
                              const sourceStage = document.querySelector('.dv-pipeline-card.dragging')?.dataset.stage;
                              if (itemId && sourceStage !== '${stage.id}') {
                                  CRM.moveCompanyStage(itemId, '${stage.id}');
                              }">
                    <div class="dv-pipeline-column-header">
                        <span>${stage.name}</span>
                        <div style="display:flex;gap:6px;align-items:center">
                            <span class="badge-tag neutral">${stageItems.length}</span>
                            <span style="font-size:0.7rem;color:var(--dv-accent)">${Utils.formatCurrency(totalValue)}</span>
                        </div>
                    </div>
                    ${cardsHTML || '<div style="padding:16px;text-align:center;color:var(--dv-text-tertiary);font-size:0.8rem">Arraste itens aqui</div>'}
                </div>
            `;
        }).join('');

        return `<div class="dv-pipeline">${stageHTML}</div>`;
    }

    // ==================== TABELA V2 ====================
    function renderTableV2(companies) {
        if (!companies || !companies.length) {
            return `
                <div class="dv-card" style="text-align:center;padding:40px">
                    <div class="empty-icon" style="font-size:2rem;margin-bottom:12px">📋</div>
                    <h4 style="color:var(--dv-text-primary)">Nenhuma empresa encontrada</h4>
                    <p style="color:var(--dv-text-secondary);font-size:0.85rem">Cadastre uma nova empresa ou ajuste os filtros.</p>
                </div>
            `;
        }

        const rows = companies.map(c => `
            <tr onclick="CRM.editCompany('${c.id}')">
                <td><strong>${c.company || c.name || '-'}</strong></td>
                <td>${c.segment || '-'}</td>
                <td>${c.city || ''}${c.city && c.state ? '/' : ''}${c.state || ''}</td>
                <td>${c.responsible || '-'}</td>
                <td><span class="badge-tag ${getStatusClass(c.status)}">${getStatusLabel(c.status)}</span></td>
                <td>${c.lastContact ? Utils.formatDate(c.lastContact) : '-'}</td>
                <td>
                    <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CRM.editCompany('${c.id}')" title="Editar" style="color:var(--dv-text-tertiary)">
                        <i data-lucide="pencil" class="icon-sm"></i>
                    </button>
                    <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CRM.deleteCompany('${c.id}')" title="Excluir" style="color:var(--dv-danger)">
                        <i data-lucide="trash-2" class="icon-sm"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="dv-card" style="overflow-x:auto;padding:0">
                <table class="dv-crm-table">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Segmento</th>
                            <th>Cidade/UF</th>
                            <th>Responsável</th>
                            <th>Status</th>
                            <th>Último Contato</th>
                            <th style="width:80px">Ações</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    // ==================== TIMELINE ====================
    function renderTimeline(companies) {
        const events = [];
        companies
            .filter(c => c.updatedAt)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 10)
            .forEach(c => {
                const statusLabel = getStatusLabel(c.status);
                const actionText = `${c.company || c.name} movida para ${statusLabel}`;
                const who = c.responsible || 'Sistema';
                events.push({
                    text: actionText,
                    time: Utils.timeAgo(c.updatedAt),
                    who: who,
                    icon: 'move-right',
                });
            });

        if (!events.length) {
            return '<div class="dv-card" style="text-align:center;padding:20px;color:var(--dv-text-tertiary)">Nenhuma atividade recente.</div>';
        }

        const items = events.map(e => `
            <div class="dv-timeline-item">
                <div>${e.text}</div>
                <div class="dv-timeline-time">${e.time} • ${e.who}</div>
            </div>
        `).join('');

        return `<div class="dv-card"><div class="dv-timeline">${items}</div></div>`;
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

    // ==================== PIPELINE ACTIONS ====================
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
