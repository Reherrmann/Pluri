// js/configuracoes.js

function buildConfiguracoes() {
    return `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Clínica</h3>
                <button class="btn btn-primary" onclick="saveClinicSettings()">Salvar</button>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group"><label>Nome</label><input id="clinicName" type="text" value="${state.clinic?.name || ''}"></div>
                    <div class="form-group"><label>Telefone</label><input id="clinicPhone" type="text" value="${state.clinic?.phone || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>E-mail</label><input id="clinicEmail" type="email" value="${state.clinic?.email || ''}"></div>
                    <div class="form-group"><label>Horário</label><input id="clinicSchedule" type="text" value="${state.clinic?.hours || ''}"></div>
                </div>
                <div class="form-group"><label>Endereço</label><input id="clinicAddress" type="text" value="${state.clinic?.address || ''}"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Equipe</h3>
                <button class="btn btn-primary btn-sm" onclick="openNewStaff()">
                    <i data-lucide="plus" style="width:14px;height:14px;"></i> Novo membro
                </button>
            </div>
            <div class="card-body no-padding">
                <table class="data-table">
                    <thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                    <tbody>
                        ${state.staff.map(s => `
                        <tr onclick="openStaff(${s._row})" style="cursor:pointer">
                            <td>${s.name}</td>
                            <td>${s.role}</td>
                            <td>${statusBadge(s.status)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Integrações</h3></div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>WhatsApp</span> ${statusBadge('Conectado')}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;" id="googleCalendarIntegrationStatus">
                        <span>Google Calendar</span>
                        <span style="color: #f59e0b;">Verificando…</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>E-mail</span> ${statusBadge('Não conectado')}
                    </div>
                </div>
            </div>
        </div>`;
}

// ==================== SLIDE PANEL DA EQUIPE ====================
function openNewStaff() {
    openStaffPanel(null);
}

function openStaff(row) {
    const member = state.staff.find(s => s._row === row);
    if (member) {
        openStaffPanel(member);
    }
}

function openStaffPanel(staffData) {
    const isNew = !staffData;
    const title = isNew ? 'Novo Membro' : 'Editar Membro';

    // Criar overlay e painel
    const overlay = document.createElement('div');
    overlay.className = 'slide-panel-overlay';
    overlay.innerHTML = `
        <div class="slide-panel">
            <div class="slide-panel-header">
                <h4>${title}</h4>
                <button class="btn-close" onclick="closeSlidePanel()">×</button>
            </div>
            <div class="slide-panel-body">
                <div class="form-group">
                    <label>Nome</label>
                    <input id="staffName" type="text" value="${staffData?.name || ''}">
                </div>
                <div class="form-group">
                    <label>Função</label>
                    <input id="staffRole" type="text" value="${staffData?.role || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="staffStatus">
                        <option value="Ativo" ${staffData?.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="Inativo" ${staffData?.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
            </div>
            <div class="slide-panel-footer">
                ${!isNew ? `<button class="btn btn-danger" onclick="deleteStaff(${staffData._row})">Excluir</button>` : ''}
                <button class="btn btn-primary" onclick="saveStaff(${staffData?._row || 'null'})">Salvar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animação de entrada (pode ser feita com CSS)
    setTimeout(() => overlay.classList.add('active'), 10);

    // Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSlidePanel();
    });
}

function closeSlidePanel() {
    const overlay = document.querySelector('.slide-panel-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

async function saveStaff(existingRow) {
    const name = document.getElementById('staffName').value.trim();
    const role = document.getElementById('staffRole').value.trim();
    const status = document.getElementById('staffStatus').value;

    if (!name) {
        alert('Nome é obrigatório.');
        return;
    }

    const data = { name, role, status };

    try {
        let result;
        if (existingRow && existingRow !== 'null') {
            // Atualizar
            result = await window.pluriAPI.updateStaffMember(existingRow, data);
        } else {
            // Novo
            result = await window.pluriAPI.addStaffMember(data);
        }

        if (result.success) {
            closeSlidePanel();
            // Recarregar lista de staff
            const updatedStaff = await window.pluriAPI.getStaff();
            state.staff = updatedStaff;
            renderConfiguracoes(); // Re-renderiza a tela de configurações
            showToast('Membro salvo com sucesso!');
        } else {
            alert('Erro ao salvar: ' + (result.message || ''));
        }
    } catch (e) {
        alert('Erro na comunicação: ' + e.message);
    }
}

async function deleteStaff(row) {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;

    try {
        const result = await window.pluriAPI.deleteStaffMember(row);
        if (result.success) {
            closeSlidePanel();
            const updatedStaff = await window.pluriAPI.getStaff();
            state.staff = updatedStaff;
            renderConfiguracoes();
            showToast('Membro excluído.');
        } else {
            alert('Erro ao excluir: ' + (result.message || ''));
        }
    } catch (e) {
        alert('Erro na comunicação: ' + e.message);
    }
}

// ==================== CLÍNICA ====================
async function saveClinicSettings() {
    const clinic = {
        name: document.getElementById('clinicName').value,
        phone: document.getElementById('clinicPhone').value,
        email: document.getElementById('clinicEmail').value,
        address: document.getElementById('clinicAddress').value,
        hours: document.getElementById('clinicSchedule').value
    };

    const result = await window.pluriAPI.updateClinic(clinic);
    if (result.success) {
        state.clinic = clinic;
        showToast('Dados da clínica salvos.');
    } else {
        showToast('Erro ao salvar.');
    }
}

// ==================== INTEGRAÇÕES ====================
async function updateGoogleCalendarStatus() {
    const statusDiv = document.getElementById('googleCalendarIntegrationStatus');
    if (!statusDiv) return;
    if (!window.pluriAPI || !window.pluriAPI.token) {
        statusDiv.innerHTML = '<span style="color: #f59e0b;">Não configurado</span>';
        return;
    }
    try {
        const connected = await window.pluriAPI.isCalendarConnected();
        if (connected) {
            statusDiv.innerHTML = `
                <span>Google Calendar</span>
                <span style="display:flex; align-items:center; gap:8px; color:#10b981; font-weight:600;">
                    <span style="width:8px; height:8px; border-radius:50%; background:#10b981; display:inline-block;"></span>
                    Conectado
                </span>`;
        } else {
            statusDiv.innerHTML = `
                <span>Google Calendar</span>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:#f59e0b; font-weight:600;">Não conectado</span>
                    <button class="btn btn-sm btn-outline" id="btnConnectCalendarConfig">Conectar</button>
                </div>`;
            document.getElementById('btnConnectCalendarConfig')?.addEventListener('click', async () => {
                try {
                    const url = await window.pluriAPI.getCalendarAuthUrl();
                    window.location.href = url;
                } catch (e) {
                    alert('Erro ao conectar: ' + e.message);
                }
            });
        }
    } catch (e) {
        statusDiv.innerHTML = '<span style="color:#f59e0b;">Erro ao verificar</span>';
    }
}

// ==================== RENDERIZAÇÃO ====================
function renderConfiguracoes() {
    const container = document.getElementById('configuracoesContainer'); // Ajuste para o ID real do container
    if (container) {
        container.innerHTML = buildConfiguracoes();
        lucide.createIcons(); // Se estiver usando ícones Lucide
        updateGoogleCalendarStatus();
    }
}
