// js/configuracoes.js
function buildConfiguracoes() {
    return `
        <div class="card">
    <div class="card-header">
        <h3>Clínica</h3>
    </div>

    <div class="card-body">

        <div class="form-row">

            <div class="form-group">
                <label>Nome</label>
                <input
                    id="clinicName"
                    type="text"
                    value="${state.clinic?.name || ''}">
            </div>

            <div class="form-group">
                <label>Telefone</label>
                <input
                    id="clinicPhone"
                    type="text"
                    value="${state.clinic?.phone || ''}">
            </div>

        </div>

        <div class="form-row">

            <div class="form-group">
                <label>E-mail</label>
                <input
                    id="clinicEmail"
                    type="email"
                    value="${state.clinic?.email || ''}">
            </div>

            <div class="form-group">
                <label>Horário de funcionamento</label>
                <input
                    id="clinicSchedule"
                    type="text"
                    value="${state.clinic?.schedule || ''}">
            </div>

        </div>

        <div class="form-group">
            <label>Endereço</label>
            <input
                id="clinicAddress"
                type="text"
                value="${state.clinic?.address || ''}">
        </div>

    </div>
</div>
        <div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Equipe</h3>
            <button class="btn btn-primary btn-sm" id="newStaffBtn"><i data-lucide="plus" style="width:14px;height:14px;"></i> Novo membro</button>
        </div><div class="card-body no-padding">
            <table class="data-table">
                <thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                <tbody>${state.staff.map(s => `
                    <tr style="cursor:pointer;" data-staff-row="${s._row}">
                        <td style="font-weight:500;">${s.name}</td><td>${s.role}</td>
                        <td>${statusBadge(s.status)}</td>
                    </tr>`).join('')}</tbody>
            </table>
        </div></div>
        <div class="card"><div class="card-header"><h3>Integrações</h3></div><div class="card-body">
            <div style="display:flex;flex-direction:column;gap:10px;">
                ${[
                    {name:'WhatsApp',status:'Conectado'},
                    {name:'Google Calendar',status:'Preparado para integração'},
                    {name:'E-mail',status:'Não conectado'}
                ].map(i => `<div style="display:flex;justify-content:space-between;align-items:center;"><span>${i.name}</span>${statusBadge(i.status)}</div>`).join('')}
            </div>
        </div></div>`;
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
        <div class="form-group"><label>Status</label>
            <select id="newStaffStatus">
                <option selected>Ativo</option>
                <option>Inativo</option>
            </select>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" id="cancelNewStaff">Cancelar</button>
            <button class="btn btn-primary btn-sm" id="saveNewStaff">Adicionar membro</button>
        </div>
        <p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">O membro será salvo direto no Google Sheets.</p>`;
    getEl('cancelNewStaff')?.addEventListener('click', closeSlidePanel);
    getEl('saveNewStaff')?.addEventListener('click', async () => {
        const name = getEl('newStaffName')?.value?.trim() || '';
        const role = getEl('newStaffRole')?.value?.trim() || '';
        const email = getEl('newStaffEmail')?.value?.trim() || '';
        const phone = getEl('newStaffPhone')?.value?.trim() || '';
        const status = getEl('newStaffStatus')?.value || 'Ativo';

        if (!name || !role) {
            showToast('Preencha ao menos nome e função.');
            return;
        }

        const saveBtn = getEl('saveNewStaff');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }

        const values = { name, role, email, phone, status };

        let newRow = null;
        if (window.pluriAPI) {
            const result = await window.pluriAPI.createStaff(values);
            if (result?.success) newRow = result.row;
        }

        if (newRow === null) {
            showToast('Não foi possível salvar na planilha. Tente novamente.');
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Adicionar membro'; }
            return;
        }

        try {

    state.staff = await window.pluriAPI.getStaff();

    closeSlidePanel();

    showToast('Membro da equipe adicionado!');

    renderPage();

} catch (e) {

    console.error(e);

    showToast('Membro salvo, mas não foi possível atualizar a lista.');

}
    });
    openSlidePanel();
}

function openStaff(row) {
    const member = state.staff.find(s => s._row === row);
    if (!member) return;
    const content = getEl('slideContent');
    if (!content) return;
    content.innerHTML = `
        <h3 style="margin-bottom:16px;">Editar membro da equipe</h3>
        <div class="form-group"><label>Nome</label><input type="text" id="editStaffName" value="${member.name}"></div>
        <div class="form-group"><label>Função</label><input type="text" id="editStaffRole" value="${member.role}"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="editStaffEmail" value="${member.email || ''}"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="editStaffPhone" value="${member.phone || ''}"></div>
        <div class="form-group"><label>Status</label>
            <select id="editStaffStatus">
                <option ${member.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                <option ${member.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
            </select>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" id="cancelStaffEdit">Cancelar</button>
            <button class="btn btn-primary btn-sm" id="saveStaffEdit">Salvar alterações</button>
        </div>
        <p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">As alterações serão sincronizadas com o Google Sheets.</p>`;
    getEl('cancelStaffEdit')?.addEventListener('click', closeSlidePanel);
    getEl('saveStaffEdit')?.addEventListener('click', async () => {
        const name = getEl('editStaffName')?.value?.trim() || member.name;
        const role = getEl('editStaffRole')?.value?.trim() || member.role;
        const email = getEl('editStaffEmail')?.value?.trim() || member.email;
        const phone = getEl('editStaffPhone')?.value?.trim() || member.phone;
        const status = getEl('editStaffStatus')?.value || member.status;

        const saveBtn = getEl('saveStaffEdit');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }

        let ok = true;
        if (window.pluriAPI && member._row) {
            const result = await window.pluriAPI.updateStaff(member._row, { name, role, email, phone, status });
            ok = !!result?.success;
        }

        if (!ok) {
            showToast('Não foi possível salvar na planilha. Tente novamente.');
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar alterações'; }
            return;
        }

        try {

    state.staff = await window.pluriAPI.getStaff();

    closeSlidePanel();

    showToast('Membro da equipe atualizado!');

    renderPage();

} catch (e) {

    console.error(e);

    showToast('Membro atualizado.');

}
    });
    openSlidePanel();
}
