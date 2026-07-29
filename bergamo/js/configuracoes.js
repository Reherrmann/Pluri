// js/configuracoes.js
function buildConfiguracoes() {
    return `
        <div class="card"><div class="card-header"><h3>Clínica</h3></div><div class="card-body">
            <div class="form-row"><div class="form-group"><label>Nome</label><input value="Bergamo"></div><div class="form-group"><label>Telefone</label><input value="(11) 3000-1234"></div></div>
            <div class="form-row"><div class="form-group"><label>E-mail</label><input value="contato@bergamo.com"></div><div class="form-group"><label>Horário</label><input value="08:00 - 18:00"></div></div>
            <div class="form-group"><label>Endereço</label><input value="Rua Saúde, 100 - São Paulo/SP"></div>
        </div></div>
        <div class="card"><div class="card-header"><h3>Equipe</h3></div><div class="card-body no-padding">
            <table class="data-table">
                <thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                <tbody>${state.staff.map(s => `
                    <tr style="cursor:pointer;" data-staff-id="${s.id}">
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

function openStaff(id) {
    const member = state.staff.find(s => s.id === id);
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
    getEl('saveStaffEdit')?.addEventListener('click', () => {
        member.name = getEl('editStaffName')?.value?.trim() || member.name;
        member.role = getEl('editStaffRole')?.value?.trim() || member.role;
        member.email = getEl('editStaffEmail')?.value?.trim() || member.email;
        member.phone = getEl('editStaffPhone')?.value?.trim() || member.phone;
        member.status = getEl('editStaffStatus')?.value || member.status;
        closeSlidePanel();
        showToast('Membro da equipe atualizado!');
        renderPage();
    });
    openSlidePanel();
}
