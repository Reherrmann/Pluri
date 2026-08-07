// js/configuracoes.js

let clinicData = null;
let teamMembers = [];

async function renderConfig() {
    const container = getEl('pageContainer');
    container.innerHTML = `
        <div class="config-grid">
            <!-- BLOCO: DADOS DA CLÍNICA -->
            <div class="card">
                <div class="card-header">
                    <h2>Clínica</h2>
                    <button class="btn btn-outline btn-sm" id="btnEditClinic">
                        <i data-lucide="edit-2"></i> Editar
                    </button>
                </div>
                <div class="card-body" id="clinicInfo">
                    <p class="text-muted">Carregando…</p>
                </div>
            </div>

            <!-- BLOCO: EQUIPE -->
            <div class="card">
                <div class="card-header">
                    <h2>Equipe</h2>
                    <button class="btn btn-primary btn-sm" id="btnAddMember">
                        <i data-lucide="plus"></i> Novo membro
                    </button>
                </div>
                <div class="card-body" id="teamListContainer">
                    <p class="text-muted">Carregando…</p>
                </div>
            </div>
        </div>`;

    await Promise.all([loadClinicData(), loadTeamData()]);
    bindConfigEvents();
    refreshIcons();
}

// ==================================================
// CLÍNICA
// ==================================================
async function loadClinicData() {
    try {
        const data = await window.pluriAPI.getClinic();
        clinicData = data || {};
        renderClinicInfo();
    } catch (e) {
        showToast('Erro ao carregar dados da clínica.');
        clinicData = {};
        renderClinicInfo();
    }
}

function renderClinicInfo() {
    const container = getEl('clinicInfo');
    if (!container) return;
    container.innerHTML = `
        <div class="info-line"><strong>Nome:</strong> ${clinicData.name || '—'}</div>
        <div class="info-line"><strong>Telefone:</strong> ${clinicData.phone || '—'}</div>
        <div class="info-line"><strong>E-mail:</strong> ${clinicData.email || '—'}</div>
        <div class="info-line"><strong>Endereço:</strong> ${clinicData.address || '—'}</div>
        <div class="info-line"><strong>Horário de funcionamento:</strong> ${clinicData.hours || '—'}</div>
    `;
}

function openClinicEditor() {
    const content = `
        <div class="form-group">
            <label>Nome da clínica</label>
            <input type="text" id="clinicName" value="${clinicData.name || ''}">
        </div>
        <div class="form-group">
            <label>Telefone</label>
            <input type="text" id="clinicPhone" value="${clinicData.phone || ''}">
        </div>
        <div class="form-group">
            <label>E-mail</label>
            <input type="email" id="clinicEmail" value="${clinicData.email || ''}">
        </div>
        <div class="form-group">
            <label>Endereço</label>
            <input type="text" id="clinicAddress" value="${clinicData.address || ''}">
        </div>
        <div class="form-group">
            <label>Horário de funcionamento</label>
            <input type="text" id="clinicHours" value="${clinicData.hours || ''}" placeholder="Ex: Seg a Sex 08h-18h">
        </div>`;

    window.slidePanel.open({
        title: 'Editar clínica',
        content,
        width: '450px',
        onSave: async () => {
            const updated = {
                name: getEl('clinicName')?.value.trim(),
                phone: getEl('clinicPhone')?.value.trim(),
                email: getEl('clinicEmail')?.value.trim(),
                address: getEl('clinicAddress')?.value.trim(),
                hours: getEl('clinicHours')?.value.trim()
            };
            const result = await window.pluriAPI.updateClinic(updated);
            if (result.success) {
                showToast('Dados da clínica atualizados.');
                window.slidePanel.close();
                await loadClinicData();
            } else {
                showToast(result.error || 'Erro ao salvar.');
            }
        }
    });
}

// ==================================================
// EQUIPE
// ==================================================
async function loadTeamData() {
    try {
        const members = await window.pluriAPI.getStaff();
        teamMembers = members || [];
        renderTeamList();
    } catch (e) {
        showToast('Erro ao carregar equipe.');
        teamMembers = [];
        renderTeamList();
    }
}

function renderTeamList() {
    const container = getEl('teamListContainer');
    if (!container) return;
    if (!teamMembers.length) {
        container.innerHTML = '<p class="text-muted text-center">Nenhum membro cadastrado.</p>';
        return;
    }
    container.innerHTML = teamMembers.map(m => `
        <div class="team-card">
            <div class="team-card-info">
                <div class="team-card-name">${m.name}</div>
                <div class="team-card-specialty">${m.specialty || '—'}</div>
                <span class="status-badge ${m.status === 'Ativo' ? 'confirmed' : 'cancelled'}">${m.status}</span>
            </div>
            <div class="team-card-actions">
                <button class="btn-icon-sm" title="Editar" onclick="editTeamMember('${m.id}')">
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="btn-icon-sm" title="Excluir" onclick="deleteTeamMember('${m.id}')">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>`).join('');
    refreshIcons();
}

function openTeamMemberForm(member = null) {
    const isEdit = !!member;
    const title = isEdit ? 'Editar membro' : 'Novo membro';
    const content = `
        <div class="form-group">
            <label>Nome</label>
            <input type="text" id="memberName" value="${member?.name || ''}" placeholder="Nome completo">
        </div>
        <div class="form-group">
            <label>Função</label>
            <input type="text" id="memberSpecialty" value="${member?.specialty || ''}" placeholder="Ex.: Dentista">
        </div>
        <div class="form-group">
            <label>Telefone</label>
            <input type="text" id="memberPhone" value="${member?.phone || ''}" placeholder="(11) 9....">
        </div>
        <div class="form-group">
            <label>E-mail</label>
            <input type="email" id="memberEmail" value="${member?.email || ''}">
        </div>
        <div class="form-group">
            <label>Status</label>
            <select id="memberStatus">
                <option value="Ativo" ${member?.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                <option value="Inativo" ${member?.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
            </select>
        </div>`;

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
                await loadTeamData();
                // Se a função loadProfessionals existir (modal.js), atualiza o select
                if (typeof loadProfessionals === 'function') loadProfessionals();
            } else {
                showToast(result.error || 'Erro ao salvar.');
            }
        }
    });
}

function editTeamMember(id) {
    const member = teamMembers.find(m => m.id === id);
    if (member) openTeamMemberForm(member);
}

async function deleteTeamMember(id) {
    if (!confirm('Excluir este membro?')) return;
    const result = await window.pluriAPI.deleteStaff(id);
    if (result.success) {
        showToast('Membro excluído.');
        await loadTeamData();
        if (typeof loadProfessionals === 'function') loadProfessionals();
    } else {
        showToast('Erro ao excluir.');
    }
}

// ==================================================
// EVENTOS
// ==================================================
function bindConfigEvents() {
    const btnEditClinic = getEl('btnEditClinic');
    if (btnEditClinic) btnEditClinic.onclick = openClinicEditor;

    const btnAddMember = getEl('btnAddMember');
    if (btnAddMember) btnAddMember.onclick = () => openTeamMemberForm();
}
