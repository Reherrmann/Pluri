// js/configuracoes.js

function buildConfiguracoes() {
    return `
        <div class="card">
            <div class="card-header"
     style="display:flex;justify-content:space-between;align-items:center;">
    <h3>Clínica</h3>

    <button
        class="btn btn-primary"
        onclick="saveClinicSettings()">

        Salvar

    </button>

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
        <span style="
            display:flex;
            align-items:center;
            gap:8px;
            color:#10b981;
            font-weight:600;
        ">
            <span style="
                width:8px;
                height:8px;
                border-radius:50%;
                background:#10b981;
                display:inline-block;
            "></span>
            Conectado
        </span>
    `;

} else {
            statusDiv.innerHTML = `
    <span>Google Calendar</span>

    <div style="
        display:flex;
        align-items:center;
        gap:10px;
    ">

        <span style="
            color:#f59e0b;
            font-weight:600;
        ">
            Não conectado
        </span>

        <button
            class="btn btn-sm btn-outline"
            id="btnConnectCalendarConfig">

            Conectar

        </button>

    </div>
`;
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

function openNewStaff() {
    // vamos implementar corretamente depois
}

function openStaff(row) {
    // vamos implementar corretamente depois
}
    

async function saveClinicSettings() {

    const clinic = {

        name: document.getElementById('clinicName').value,

        phone: document.getElementById('clinicPhone').value,

        email: document.getElementById('clinicEmail').value,

        address: document.getElementById('clinicAddress').value,

        hours: document.getElementById('clinicSchedule').value

    };

    const result =
        await window.pluriAPI.updateClinic(clinic);

    if(result.success){

        state.clinic = clinic;

        showToast('Dados da clínica salvos.');

    }else{

        showToast('Erro ao salvar.');

    }

}
