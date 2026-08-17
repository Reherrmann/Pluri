// js/configuracoes.js

function buildConfiguracoes() {
    setTimeout(() => {
        updateGoogleCalendarStatus();
        updateGoogleDriveStatus();
    }, 0);

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
                <button class="btn btn-primary btn-sm" id="newStaffBtn"><i data-lucide="plus" style="width:14px;height:14px;"></i> Novo membro</button>
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
                    <div style="display:flex;justify-content:space-between;align-items:center;" id="googleCalendarIntegrationStatus">
                        <span>Google Calendar</span>
                        <span style="color:#f59e0b;">Verificando…</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;" id="googleDriveIntegrationStatus">
                        <span>Google Drive</span>
                        <span style="color:#f59e0b;">Verificando…</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>WhatsApp</span> ${statusBadge('Desconectado')}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>E-mail</span> ${statusBadge('Em breve...')}
                    </div>
                </div>
            </div>
        </div>`;
}

function connectedStatusHtml(label) {
    return `
        <span>${label}</span>
        <span style="display:flex;align-items:center;gap:8px;color:#10b981;font-weight:600;">
            <span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;"></span>
            Conectado
        </span>
    `;
}

function disconnectedStatusHtml(label, buttonId) {
    return `
        <span>${label}</span>
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:#f59e0b;font-weight:600;">Não conectado</span>
            <button class="btn btn-sm btn-outline" id="${buttonId}">Conectar</button>
        </div>
    `;
}

async function updateGoogleCalendarStatus() {
    const statusDiv = document.getElementById('googleCalendarIntegrationStatus');
    if (!statusDiv) return;

    if (!window.pluriAPI || !window.pluriAPI.token) {
        statusDiv.innerHTML = disconnectedStatusHtml('Google Calendar', 'btnConnectCalendarConfig');
        return;
    }

    try {
        const connected = await window.pluriAPI.isCalendarConnected();
        if (connected) {
            statusDiv.innerHTML = connectedStatusHtml('Google Calendar');
        } else {
            statusDiv.innerHTML = disconnectedStatusHtml('Google Calendar', 'btnConnectCalendarConfig');
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

async function updateGoogleDriveStatus() {
    const statusDiv = document.getElementById('googleDriveIntegrationStatus');
    if (!statusDiv) return;

    const api = window.pluriAPI;
    const token = api?.token;
    const baseUrl = api?.config?.appsScript?.baseUrl;

    if (!token || !baseUrl) {
        statusDiv.innerHTML = disconnectedStatusHtml('Google Drive', 'btnConnectDriveConfig');
        bindDriveConnectButton();
        return;
    }

    try {
        const url = `${baseUrl}?action=drive_status&token=${encodeURIComponent(token)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data?.success && data.connected) {
            statusDiv.innerHTML = connectedStatusHtml('Google Drive');
            return;
        }

        statusDiv.innerHTML = disconnectedStatusHtml('Google Drive', 'btnConnectDriveConfig');
        bindDriveConnectButton();
    } catch (e) {
        console.error('Erro ao verificar Google Drive:', e);
        statusDiv.innerHTML = disconnectedStatusHtml('Google Drive', 'btnConnectDriveConfig');
        bindDriveConnectButton();
    }
}

function bindDriveConnectButton() {
    document.getElementById('btnConnectDriveConfig')?.addEventListener('click', async () => {
        try {
            const api = window.pluriAPI;
            if (!api?.token || !api?.config?.appsScript?.baseUrl) {
                throw new Error('Token de sessão ausente.');
            }

            const url = `${api.config.appsScript.baseUrl}?action=drive_auth&token=${encodeURIComponent(api.token)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data?.success && data.url) {
                window.location.href = data.url;
                return;
            }

            throw new Error(data?.error || 'Falha ao obter URL de autorização do Google Drive.');
        } catch (e) {
            alert('Erro ao conectar Google Drive: ' + e.message);
        }
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
        <div style="margin-top:16px;display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" id="cancelNewStaff">Cancelar</button>
            <button class="btn btn-primary btn-sm" id="saveNewStaff">Adicionar membro</button>
        </div>
        <p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">O membro será salvo direto no Google Sheets.</p>
    `;

    getEl('cancelNewStaff')?.addEventListener('click', closeSlidePanel);
    getEl('saveNewStaff')?.addEventListener('click', async () => {
        const name = getEl('newStaffName')?.value?.trim() || '';
        const role = getEl('newStaffRole')?.value?.trim() || '';
        const email = getEl('newStaffEmail')?.value?.trim() || '';
        const phone = getEl('newStaffPhone')?.value?.trim() || '';
        const status = getEl('newStaffStatus')?.value || 'Ativo';
        if (!name || !role) { showToast('Preencha ao menos nome e função.'); return; }
        const saveBtn = getEl('saveNewStaff');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }
        try {
            const result = await window.pluriAPI.createStaff({ name, role, email, phone, status });
            if (!result?.success) throw new Error(result?.error || 'Não foi possível salvar.');
            state.staff = await window.pluriAPI.getStaff();
            closeSlidePanel();
            showToast('Membro da equipe adicionado!');
            renderPage();
        } catch (e) {
            console.error('Erro ao criar membro:', e);
            showToast('Não foi possível salvar na planilha.');
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Adicionar membro'; }
        }
    });
    openSlidePanel();
}

function openStaff(row) {
    const member = state.staff.find(s => String(s._row) === String(row));
    if (!member) return;
    const content = getEl('slideContent');
    if (!content) return;

    content.innerHTML = `
        <h3 style="margin-bottom:16px;">Editar membro da equipe</h3>
        <div class="form-group"><label>Nome</label><input type="text" id="editStaffName" value="${member.name || ''}"></div>
        <div class="form-group"><label>Função</label><input type="text" id="editStaffRole" value="${member.role || ''}"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="editStaffEmail" value="${member.email || ''}"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="editStaffPhone" value="${member.phone || ''}"></div>
        <div class="form-group"><label>Status</label>
            <select id="editStaffStatus">
                <option ${member.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                <option ${member.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
            </select>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" id="cancelStaffEdit">Cancelar</button>
            <button class="btn btn-primary btn-sm" id="saveStaffEdit">Salvar alterações</button>
            <button class="btn btn-outline btn-sm" id="deleteStaffBtn" style="color:#B91C1C;border-color:#FCA5A5;">Excluir</button>
        </div>
        <p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">As alterações serão sincronizadas com o Google Sheets.</p>
    `;

    getEl('cancelStaffEdit')?.addEventListener('click', closeSlidePanel);
    getEl('saveStaffEdit')?.addEventListener('click', async () => {
        const name = getEl('editStaffName')?.value?.trim() || member.name;
        const role = getEl('editStaffRole')?.value?.trim() || member.role;
        const email = getEl('editStaffEmail')?.value?.trim() || '';
        const phone = getEl('editStaffPhone')?.value?.trim() || '';
        const status = getEl('editStaffStatus')?.value || member.status;
        const saveBtn = getEl('saveStaffEdit');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }
        try {
            const result = await window.pluriAPI.updateStaff(member._row, { name, role, email, phone, status });
            if (!result?.success) throw new Error(result?.error || 'Não foi possível salvar.');
            state.staff = await window.pluriAPI.getStaff();
            closeSlidePanel();
            showToast('Membro da equipe atualizado!');
            renderPage();
        } catch (e) {
            console.error('Erro ao atualizar membro:', e);
            showToast('Não foi possível salvar na planilha.');
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar alterações'; }
        }
    });

    getEl('deleteStaffBtn')?.addEventListener('click', async () => {
        if (!window.confirm(`Excluir o membro "${member.name}"?`)) return;
        const deleteBtn = getEl('deleteStaffBtn');
        if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.textContent = 'Excluindo...'; }
        try {
            const result = await window.pluriAPI.deleteStaff(member._row);
            if (!result?.success) throw new Error(result?.error || 'Não foi possível excluir.');
            state.staff = await window.pluriAPI.getStaff();
            closeSlidePanel();
            showToast('Membro da equipe excluído.');
            renderPage();
        } catch (e) {
            console.error('Erro ao excluir membro:', e);
            showToast('Não foi possível excluir da planilha.');
            if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.textContent = 'Excluir'; }
        }
    });
    openSlidePanel();
}

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

// =====================================================
// CONVÊNIOS — NAVEGAÇÃO
// O módulo convenios.js já é carregado pelo index.html.
// Aqui garantimos que a aba apareça e seja aberta mesmo
// antes de integrarmos o case definitivo no app.js.
// =====================================================

(function initConveniosNavigation() {
    function setup() {
        const nav = document.querySelector('.sidebar-nav');
        if (!nav || typeof buildConvenios !== 'function') return;

        let link = nav.querySelector('[data-page="convenios"]');

        if (!link) {
            link = document.createElement('a');
            link.setAttribute('data-page', 'convenios');
            link.innerHTML = '<i data-lucide="shield-check"></i><span>Convênios</span>';
            nav.insertBefore(link, nav.querySelector('[data-page="configuracoes"]') || null);
            refreshIcons();
        }

        if (link.dataset.conveniosBound === '1') return;
        link.dataset.conveniosBound = '1';

        link.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            state.currentPage = 'convenios';

            nav.querySelectorAll('a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            const container = getEl('pageContainer');
            if (!container) return;

            try {
                container.innerHTML = buildConvenios();
                if (typeof attachPageEvents === 'function') attachPageEvents();
                if (typeof refreshIcons === 'function') refreshIcons();
                const title = getEl('pageTitle');
                const subtitle = getEl('pageSubtitle');
                if (title) title.textContent = 'Convênios';
                if (subtitle) subtitle.textContent = 'Gerencie operadoras, planos, procedimentos e regras de atendimento.';
            } catch (error) {
                console.error('Erro ao abrir Convênios:', error);
                container.innerHTML = '<div style="padding:40px;text-align:center;color:#B91C1C;">Erro ao carregar a aba Convênios.</div>';
            }

            if (typeof closeSidebar === 'function') closeSidebar();
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
