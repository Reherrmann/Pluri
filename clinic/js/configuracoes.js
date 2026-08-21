// js/configuracoes.js — configurações da Mentalita via Supabase

function buildConfiguracoes() {
    return `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Clínica</h3>
                <button class="btn btn-primary" onclick="saveClinicSettings()">Salvar</button>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group"><label>Nome</label><input id="clinicName" type="text" value="${escapeHtml(state.clinic?.name || '')}"></div>
                    <div class="form-group"><label>Telefone</label><input id="clinicPhone" type="text" value="${escapeHtml(state.clinic?.phone || '')}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>E-mail</label><input id="clinicEmail" type="email" value="${escapeHtml(state.clinic?.email || '')}"></div>
                    <div class="form-group"><label>Horário</label><input id="clinicSchedule" type="text" value="${escapeHtml(state.clinic?.hours || '')}"></div>
                </div>
                <div class="form-group"><label>Endereço</label><input id="clinicAddress" type="text" value="${escapeHtml(state.clinic?.address || '')}"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Equipe</h3>
                <button class="btn btn-primary btn-sm" id="newStaffBtn" onclick="openNewStaff()"><i data-lucide="plus" style="width:14px;height:14px;"></i> Novo membro</button>
            </div>
            <div class="card-body no-padding">
                <table class="data-table">
                    <thead><tr><th>NOME</th><th>FUNÇÃO</th><th>STATUS</th></tr></thead>
                    <tbody>${(state.staff || []).map(s => `
                        <tr data-staff-row="${escapeHtml(String(s._row))}" style="cursor:pointer">
                            <td>${escapeHtml(s.name || '')}</td>
                            <td>${escapeHtml(s.role || '')}</td>
                            <td>${statusBadge(s.status || 'Ativo')}</td>
                        </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:25px;color:var(--text-secondary);">Nenhum membro cadastrado.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Integrações</h3></div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:16px;">
                    <div id="googleCalendarIntegrationStatus" class="integration-row">
                        <span>Google Calendar</span><span class="integration-status pending">Verificando…</span>
                    </div>
                    <div id="googleDriveIntegrationStatus" class="integration-row">
                        <span>Google Drive</span><span class="integration-status pending">Verificando…</span>
                    </div>
                    <div class="integration-row"><span>E-mail</span><span class="integration-status muted">Em breve...</span></div>
                    <div class="integration-row"><span>WhatsApp</span><span class="integration-status muted">Em breve...</span></div>
                </div>
            </div>
        </div>`;
}

function integrationStatusHtml(label, connected, buttonId) {
    if (connected) return `<span>${label}</span><span class="integration-status connected"><span class="status-dot"></span>Conectado</span>`;
    return `<span>${label}</span><div style="display:flex;align-items:center;gap:10px;"><span class="integration-status disconnected">Não conectado</span>${buttonId ? `<button class="btn btn-sm btn-outline" id="${buttonId}">Conectar</button>` : ''}</div>`;
}

async function updateGoogleCalendarStatus() {
    const el = document.getElementById('googleCalendarIntegrationStatus');
    if (!el) return;
    try {
        const connected = await window.pluriAPI?.isCalendarConnected?.();
        el.innerHTML = integrationStatusHtml('Google Calendar', !!connected, connected ? null : 'btnConnectCalendarConfig');
        document.getElementById('btnConnectCalendarConfig')?.addEventListener('click', async () => {
            try {
                const url = await window.pluriAPI.getCalendarAuthUrl();
                window.location.href = url;
            } catch (e) { alert('Erro ao conectar: ' + e.message); }
        });
    } catch (_) {
        el.innerHTML = integrationStatusHtml('Google Calendar', false, null);
    }
}

async function updateGoogleDriveStatus() {
    const el = document.getElementById('googleDriveIntegrationStatus');
    if (!el) return;
    // Nesta etapa, o Drive recebe a mesma apresentação do Calendar, mas a conexão real será ligada depois.
    el.innerHTML = integrationStatusHtml('Google Drive', false, 'btnConnectDriveConfig');
    document.getElementById('btnConnectDriveConfig')?.addEventListener('click', () => {
        showToast('A conexão do Google Drive será configurada na próxima etapa.');
    });
}

function openNewStaff() {
    const content = getEl('slideContent');
    if (!content) return;
    content.innerHTML = `
        <h3 style="margin-bottom:16px;">Novo membro da equipe</h3>
        <div class="form-group"><label>Nome</label><input type="text" id="newStaffName"></div>
        <div class="form-group"><label>Função</label><input type="text" id="newStaffRole"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="newStaffEmail"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="newStaffPhone"></div>
        <div class="form-group"><label>Status</label><select id="newStaffStatus"><option selected>Ativo</option><option>Inativo</option></select></div>
        <div style="margin-top:16px;display:flex;gap:8px;"><button class="btn btn-outline btn-sm" id="cancelNewStaff">Cancelar</button><button class="btn btn-primary btn-sm" id="saveNewStaff">Adicionar membro</button></div>
    `;
    getEl('cancelNewStaff')?.addEventListener('click', closeSlidePanel);
    getEl('saveNewStaff')?.addEventListener('click', async () => {
        const name = getEl('newStaffName')?.value?.trim() || '';
        const role = getEl('newStaffRole')?.value?.trim() || '';
        const email = getEl('newStaffEmail')?.value?.trim() || '';
        const phone = getEl('newStaffPhone')?.value?.trim() || '';
        const status = getEl('newStaffStatus')?.value || 'Ativo';
        if (!name || !role) { showToast('Preencha ao menos nome e função.'); return; }
        const btn = getEl('saveNewStaff'); if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
        try {
            const result = await window.pluriAPI.createStaff({ name, role, email, phone, status });
            if (!result?.success) throw new Error(result?.error || 'Não foi possível salvar.');
            state.staff = await window.pluriAPI.getStaff();
            closeSlidePanel(); showToast('Membro da equipe adicionado!'); renderPage();
        } catch (e) {
            console.error(e); showToast(e.message || 'Não foi possível salvar.');
            if (btn) { btn.disabled = false; btn.textContent = 'Adicionar membro'; }
        }
    });
    openSlidePanel();
}

function openStaff(row) {
    const member = (state.staff || []).find(s => String(s._row) === String(row));
    if (!member) return;
    const content = getEl('slideContent'); if (!content) return;
    content.innerHTML = `
        <h3 style="margin-bottom:16px;">Editar membro da equipe</h3>
        <div class="form-group"><label>Nome</label><input type="text" id="editStaffName" value="${escapeHtml(member.name || '')}"></div>
        <div class="form-group"><label>Função</label><input type="text" id="editStaffRole" value="${escapeHtml(member.role || '')}"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="editStaffEmail" value="${escapeHtml(member.email || '')}"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="editStaffPhone" value="${escapeHtml(member.phone || '')}"></div>
        <div class="form-group"><label>Status</label><select id="editStaffStatus"><option ${member.status === 'Ativo' ? 'selected' : ''}>Ativo</option><option ${member.status === 'Inativo' ? 'selected' : ''}>Inativo</option></select></div>
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;"><button class="btn btn-outline btn-sm" id="cancelStaffEdit">Cancelar</button><button class="btn btn-primary btn-sm" id="saveStaffEdit">Salvar alterações</button><button class="btn btn-outline btn-sm" id="deleteStaffBtn" style="color:#B91C1C;border-color:#FCA5A5;">Excluir</button></div>
    `;
    getEl('cancelStaffEdit')?.addEventListener('click', closeSlidePanel);
    getEl('saveStaffEdit')?.addEventListener('click', async () => {
        const name = getEl('editStaffName')?.value?.trim() || member.name;
        const role = getEl('editStaffRole')?.value?.trim() || member.role;
        const email = getEl('editStaffEmail')?.value?.trim() || '';
        const phone = getEl('editStaffPhone')?.value?.trim() || '';
        const status = getEl('editStaffStatus')?.value || member.status;
        const btn = getEl('saveStaffEdit'); if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
        try {
            const result = await window.pluriAPI.updateStaff(member._row, { name, role, email, phone, status });
            if (!result?.success) throw new Error(result?.error || 'Não foi possível salvar.');
            state.staff = await window.pluriAPI.getStaff(); closeSlidePanel(); showToast('Membro da equipe atualizado!'); renderPage();
        } catch (e) {
            console.error(e); showToast(e.message || 'Não foi possível salvar.');
            if (btn) { btn.disabled = false; btn.textContent = 'Salvar alterações'; }
        }
    });
    getEl('deleteStaffBtn')?.addEventListener('click', async () => {
        if (!confirm(`Excluir o membro "${member.name}"?`)) return;
        try {
            const result = await window.pluriAPI.deleteStaff(member._row);
            if (!result?.success) throw new Error(result?.error || 'Não foi possível excluir.');
            state.staff = await window.pluriAPI.getStaff(); closeSlidePanel(); showToast('Membro da equipe excluído.'); renderPage();
        } catch (e) { console.error(e); showToast(e.message || 'Não foi possível excluir.'); }
    });
    openSlidePanel();
}

async function saveClinicSettings() {
    const clinic = {
        name: getEl('clinicName')?.value?.trim() || '',
        phone: getEl('clinicPhone')?.value?.trim() || '',
        email: getEl('clinicEmail')?.value?.trim() || '',
        address: getEl('clinicAddress')?.value?.trim() || '',
        hours: getEl('clinicSchedule')?.value?.trim() || ''
    };
    const current = {
        name: state.clinic?.name || '',
        phone: state.clinic?.phone || '',
        email: state.clinic?.email || '',
        address: state.clinic?.address || '',
        hours: state.clinic?.hours || ''
    };
    const changed = Object.keys(clinic).some(key => clinic[key] !== current[key]);
    if (!changed) {
        showToast('Nenhuma alteração para salvar.');
        return;
    }
    const confirmed = confirm('Você tem certeza que deseja salvar esta correção nos dados da clínica?');
    if (!confirmed) return;
    const result = await window.pluriAPI.updateClinic(clinic);
    if (result?.success) { state.clinic = { ...state.clinic, ...clinic }; showToast('Dados da clínica salvos.'); }
    else showToast(result?.error || 'Erro ao salvar.');
}
