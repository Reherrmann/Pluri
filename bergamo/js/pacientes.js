// js/pacientes.js
function buildPacientes() {
    return `
        <div class="search-bar"><input type="text" id="patientSearch" placeholder="Buscar por nome ou telefone..."></div>
        <div class="card"><div class="card-body no-padding" style="overflow-x:auto;">
            <table class="data-table">
                <thead><tr><th>Paciente</th><th>Telefone</th><th>Último atendimento</th><th>Próxima consulta</th><th>Status</th></tr></thead>
                <tbody id="patientTableBody">
                    ${state.patients.map(p => `
                        <tr style="cursor:pointer;" data-patient-id="${p.id}">
                            <td style="font-weight:500;">${p.name}</td>
                            <td>${p.phone}</td>
                            <td>${p.lastVisit}</td>
                            <td>${p.nextAppt}</td>
                            <td>${statusBadge(p.status)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div></div>`;
}

function openPatient(id) {
    const p = state.patients.find(pt => pt.id === id);
    if (!p) return;
    const content = getEl('slideContent');
    if (!content) return;
    content.innerHTML = `
        <h3 style="margin-bottom:16px;">Editar paciente</h3>
        <div class="form-group"><label>Nome</label><input type="text" id="editPatientName" value="${p.name}"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="editPatientPhone" value="${p.phone}"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="editPatientEmail" value="${p.email || ''}"></div>
        <div class="form-group"><label>Observações</label><textarea id="editPatientNotes" rows="3">${p.notes || ''}</textarea></div>
        <div style="margin-top:16px;display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" id="cancelPatientEdit">Cancelar</button>
            <button class="btn btn-primary btn-sm" id="savePatientEdit">Salvar alterações</button>
        </div>
        <p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">As alterações serão sincronizadas com o Google Sheets.</p>`;
    getEl('cancelPatientEdit')?.addEventListener('click', closeSlidePanel);
    getEl('savePatientEdit')?.addEventListener('click', () => {
        const name = getEl('editPatientName')?.value?.trim() || p.name;
        const phone = getEl('editPatientPhone')?.value?.trim() || p.phone;
        const email = getEl('editPatientEmail')?.value?.trim() || p.email;
        const notes = getEl('editPatientNotes')?.value?.trim() || '';
        p.name = name;
        p.phone = phone;
        p.email = email;
        p.notes = notes;
        closeSlidePanel();
        showToast('Paciente atualizado com sucesso!');
        renderPage();
    });
    openSlidePanel();
}

// Torna a função acessível globalmente (redundante, mas seguro)
window.openPatient = openPatient;
