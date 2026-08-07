// js/configuracoes.js

let clinicData = null;
let teamMembers = [];

/**
 * Função assíncrona que carrega os dados e retorna o HTML completo.
 * Chamada pelo app.js com await.
 */
async function renderConfig() {
    // Carrega dados da clínica e equipe em paralelo
    await Promise.all([loadClinicData(), loadTeamData()]);

    // Retorna o HTML com os dados já carregados
    return `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Clínica</h3>
                <button class="btn btn-outline btn-sm" id="btnEditClinic">
                    <i data-lucide="edit-2"></i> Editar
                </button>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome</label>
                        <input id="clinicName" type="text" value="${clinicData?.name || ''}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input id="clinicPhone" type="text" value="${clinicData?.phone || ''}" disabled>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>E-mail</label>
                        <input id="clinicEmail" type="email" value="${clinicData?.email || ''}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Horário de funcionamento</label>
                        <input id="clinicSchedule" type="text" value="${clinicData?.hours || ''}" disabled>
                    </div>
                </div>
                <div class="form-group">
                    <label>Endereço</label>
                    <input id="clinicAddress" type="text" value="${clinicData?.address || ''}" disabled>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Equipe</h3>
                <button class="btn btn-primary btn-sm" id="newStaffBtn">
                    <i data-lucide="plus" style="width:14px;height:14px;"></i> Novo membro
                </button>
            </div>
            <div class="card-body no-padding">
                <table class="data-table">
                    <thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                    <tbody>${teamMembers.map(m => `
                        <tr style="cursor:pointer;" data-staff-id="${m.id}">
                            <td style="font-weight:500;">${m.name}</td>
                            <td>${m.specialty || m.role || ''}</td>
                            <td>${statusBadge(m.status)}</td>
                        </tr>`).join('')}</tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Integrações</h3></div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>WhatsApp</span>
                        ${statusBadge('Conectado')}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;" id="googleCalendarIntegrationStatus">
                        <span>Google Calendar</span>
                        <span style="color: #f59e0b;">Verificando…</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>E-mail</span>
                        ${statusBadge('Não conectado')}
                    </div>
                </div>
            </div>
        </div>`;
}

// ==================================================
// CARREGAMENTO DE DADOS (assíncronos)
// ==================================================
async function loadClinicData() {
    try {
        const data = await window.pluriAPI.getClinic();
        clinicData = data || {};
    } catch (e) {
        showToast('Erro ao carregar dados da clínica.');
        clinicData = {};
    }
}

async function loadTeamData() {
    try {
        const members = await window.pluriAPI.getStaff();
        teamMembers = members || [];
    } catch (e) {
        showToast('Erro ao carregar equipe.');
        teamMembers = [];
    }
}

// ==================================================
// EDITOR DA CLÍNICA (slide panel)
// ==================================================
function openClinicEditor() {
    const content = `
        <div class="form-group"><label>Nome</label><input type="text" id="clinicNameEdit" value="${clinicData?.name || ''}"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="clinicPhoneEdit" value="${clinicData?.phone || ''}"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="clinicEmailEdit" value="${clinicData?.email || ''}"></div>
        <div class="form-group"><label>Endereço</label><input type="text" id="clinicAddressEdit" value="${clinicData?.address || ''}"></div>
        <div class="form-group"><label>Horário</label><input type="text" id="clinicScheduleEdit" value="${clinicData?.hours || ''}" placeholder="Ex: Seg a Sex 08h-18h"></div>`;

    window.slidePanel.open({
        title: 'Editar clínica',
        content,
        width: '450px',
        onSave: async () => {
            const updated = {
                name: getEl('clinicNameEdit')?.value.trim(),
                phone: getEl('clinicPhoneEdit')?.value.trim(),
                email: getEl('clinicEmailEdit')?.value.trim(),
                address: getEl('clinicAddressEdit')?.value.trim(),
                hours: getEl('clinicScheduleEdit')?.value.trim()
            };
            const result = await window.pluriAPI.updateClinic(updated);
            if (result.success) {
                showToast('Dados da clínica atualizados.');
                window.slidePanel.close();
                // Recarrega os dados e re-renderiza a página de configurações
                state.currentPage = 'configuracoes';
                renderPage(); // re-renderiza a página inteira (chamada assíncrona, mas sem await)
            } else {
                showToast(result.error || 'Erro ao salvar.');
            }
        }
    });
}

// ==================================================
// EQUIPE (ações de abrir/novo – reutilizando funções antigas)
// ==================================================
function openNewStaff() {
    openTeamMemberForm(null);
}

function openStaff(id) {
    const member = teamMembers.find(m => m.id === id);
    if (member) openTeamMemberForm(member);
}

// (re)define a função de edição/exclusão usada nos botões inline
window.editTeamMember = function(id) { openStaff(id); };
window.deleteTeamMember = async function(id) {
    if (!confirm('Excluir este membro?')) return;
    const result = await window.pluriAPI.deleteStaff(id);
    if (result.success) {
        showToast('Membro excluído.');
        // Recarrega a página de configurações
        state.currentPage = 'configuracoes';
        renderPage();
        // Atualiza também a lista de profissionais no modal, se existir
        if (typeof loadProfessionals === 'function') loadProfessionals();
    } else {
        showToast('Erro ao excluir.');
    }
};

// Função compartilhada de formulário de membro (slide panel)
function openTeamMemberForm(member = null) {
    const isEdit = !!member;
    const title = isEdit ? 'Editar membro' : 'Novo membro';
    const content = `
        <div class="form-group"><label>Nome</label><input type="text" id="memberName" value="${member?.name || ''}" placeholder="Nome completo"></div>
        <div class="form-group"><label>Função</label><input type="text" id="memberSpecialty" value="${member?.specialty || ''}" placeholder="Ex.: Dentista"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="memberPhone" value="${member?.phone || ''}" placeholder="(11) 9...."></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="memberEmail" value="${member?.email || ''}"></div>
        <div class="form-group"><label>Status</label><select id="memberStatus">
            <option value="Ativo" ${member?.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
            <option value="Inativo" ${member?.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
        </select></div>`;

    window.slidePanel.open({
        title,
        content,
        width: '400px',
        onSave: async () => {
            const name = getEl('memberName')?.value.trim();
            if (!name) {
                showToast('Nome é obrigatório.');
                return;
            }
            const data = {
                name,
                specialty: getEl('memberSpecialty')?.value.trim(),
                phone: getEl('memberPhone')?.value.trim(),
                email: getEl('memberEmail')?.value.trim(),
                status: getEl('memberStatus')?.value
            };
            let result;
            if (isEdit) {
                data.id = member.id;
                result = await window.pluriAPI.updateStaff(data);
            } else {
                result = await window.pluriAPI.createStaff(data);
            }
            if (result.success) {
                showToast(isEdit ? 'Membro atualizado.' : 'Membro adicionado.');
                window.slidePanel.close();
                // Recarrega a página de configurações
                state.currentPage = 'configuracoes';
                renderPage();
                if (typeof loadProfessionals === 'function') loadProfessionals();
            } else {
                showToast(result.error || 'Erro ao salvar.');
            }
        }
    });
}

// ==================================================
// EVENTOS (vinculados após renderização)
// ==================================================
function bindConfigEvents() {
    // Botão de editar clínica
    const btnEditClinic = getEl('btnEditClinic');
    if (btnEditClinic) btnEditClinic.onclick = openClinicEditor;

    // Botão novo membro (na tabela de equipe)
    const newStaffBtn = getEl('newStaffBtn');
    if (newStaffBtn) newStaffBtn.onclick = openNewStaff;

    // Linhas da tabela de equipe → abrir membro
    document.querySelectorAll('[data-staff-id]').forEach(row => {
        row.addEventListener('click', function () {
            const id = this.dataset.staffId;
            openStaff(id);
        });
    });
}
