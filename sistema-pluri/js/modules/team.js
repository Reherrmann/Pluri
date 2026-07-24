/**
 * PLURI OS — Módulo de Equipe
 * Cadastro de colaboradores (nome, email, cargo, telefone, status).
 */
const Team = (() => {
    function render() {
        const members = Storage.loadData('team_members', []);
        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
                    <h3 style="font-size:1rem;font-weight:600">Equipe (${members.length})</h3>
                    <button class="btn-primary" onclick="Team.openForm()">
                        <i data-lucide="plus" class="icon-sm"></i> Novo Membro
                    </button>
                </div>
                ${renderTable(members)}
            </div>
        `;
    }

    function renderTable(members) {
        if (!members || !members.length) {
            return `<div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3>Nenhum membro cadastrado</h3>
                <p>Cadastre sua equipe para atribuir responsáveis em CRM, Metas e Contratos.</p>
            </div>`;
        }
        const headers = ['Nome', 'E-mail', 'Cargo', 'Telefone', 'Status', 'Ações'];
        const rows = members.map(m => [
            m.name || '-',
            m.email || '-',
            m.role || '-',
            m.phone || '-',
            `<span class="badge-tag ${m.status === 'ativo' ? 'success' : 'neutral'}">${m.status || 'ativo'}</span>`,
            `<button class="btn-icon btn-sm" onclick="Team.editMember('${m.id}')" title="Editar"><i data-lucide="pencil" class="icon-sm"></i></button>
             <button class="btn-icon btn-sm" onclick="Team.deleteMember('${m.id}')" title="Excluir"><i data-lucide="trash-2" class="icon-sm"></i></button>`
        ]);
        return Components.createTable({ headers, rows });
    }

    function openForm(editId = null) {
        const members = Storage.loadData('team_members', []);
        const existing = editId ? members.find(m => m.id === editId) : null;

        Components.openModal({
            title: existing ? 'Editar Membro' : 'Novo Membro',
            bodyHTML: `
                <div class="form-group">
                    <label class="form-label">Nome *</label>
                    <input type="text" id="team-name" class="form-input" value="${existing?.name || ''}">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">E-mail</label>
                        <input type="email" id="team-email" class="form-input" value="${existing?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cargo</label>
                        <input type="text" id="team-role" class="form-input" value="${existing?.role || ''}" placeholder="Ex: Vendedor">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Telefone</label>
                        <input type="text" id="team-phone" class="form-input" value="${existing?.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="team-status" class="form-select">
                            <option value="ativo" ${existing?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                            <option value="inativo" ${existing?.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                        </select>
                    </div>
                </div>
                <input type="hidden" id="team-edit-id" value="${existing?.id || ''}">
            `,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                         <button class="btn-primary" onclick="Team.saveMember()">Salvar</button>`,
        });
    }

    function saveMember() {
        const members = Storage.loadData('team_members', []);
        const editId = document.getElementById('team-edit-id').value;
        const data = {
            id: editId || Utils.generateId(),
            name: document.getElementById('team-name').value.trim(),
            email: document.getElementById('team-email').value.trim(),
            role: document.getElementById('team-role').value.trim(),
            phone: document.getElementById('team-phone').value.trim(),
            status: document.getElementById('team-status').value,
        };

        if (!data.name) {
            Components.showToast('Nome é obrigatório', 'error');
            return;
        }

        if (editId) {
            const index = members.findIndex(m => m.id === editId);
            if (index >= 0) members[index] = data;
        } else {
            members.push(data);
        }

        Storage.saveData('team_members', members);
        Components.closeModal();
        Components.showToast(editId ? 'Membro atualizado!' : 'Membro cadastrado!', 'success');
        PLURI.navigateTo('team');
    }

    function editMember(id) {
        openForm(id);
    }

    async function deleteMember(id) {
        const members = Storage.loadData('team_members', []);
        const member = members.find(m => m.id === id);
        if (!member) return;

        Components.confirmDialog({
            title: 'Excluir membro',
            message: `Tem certeza que deseja excluir "${member.name}"?`,
            onConfirm: () => {
                const updated = members.filter(m => m.id !== id);
                Storage.saveData('team_members', updated);
                Components.showToast('Membro excluído!', 'success');
                PLURI.navigateTo('team');
            }
        });
    }

    /**
     * Retorna a lista de membros ativos para uso em outros módulos (ex: select no CRM).
     */
    function getActiveMembers() {
        const members = Storage.loadData('team_members', []);
        return members.filter(m => m.status === 'ativo');
    }

    window.Team = { render, openForm, saveMember, editMember, deleteMember, getActiveMembers };
    return { render, openForm, saveMember, editMember, deleteMember, getActiveMembers };
})();
