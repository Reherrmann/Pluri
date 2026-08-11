// js/pacientes.js

function buildPacientes() {
    return `
        <div class="search-bar" style="display:flex;gap:8px;">

            <input
                type="text"
                id="patientSearch"
                placeholder="Buscar por nome ou telefone..."
                style="flex:1;"
            >

            <button
                class="btn btn-primary"
                id="newPatientBtn">

                <i
                    data-lucide="plus"
                    style="width:16px;height:16px;">
                </i>

                Novo paciente

            </button>

        </div>

        <div class="card">

            <div
                class="card-body no-padding"
                style="overflow-x:auto;">

                <table class="data-table">

                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Telefone</th>
                            <th>Último atendimento</th>
                            <th>Próxima consulta</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody id="patientTableBody">

                        ${state.patients.map(p => `

                            <tr
                                style="cursor:pointer;"
                                data-patient-row="${p._row}">

                                <td style="font-weight:500;">
                                    ${p.name}
                                </td>

                                <td>
                                    ${p.phone}
                                </td>

                                <td>
                                    ${p.lastVisit}
                                </td>

                                <td>
                                    ${p.nextAppt}
                                </td>

                                <td>
                                    ${statusBadge(p.status)}
                                </td>

                            </tr>

                        `).join('')}

                    </tbody>

                </table>

            </div>

        </div>
    `;
}


function openNewPatient() {

    const content = getEl('slideContent');

    if (!content) return;

    content.innerHTML = `
        <h3 style="margin-bottom:16px;">
            Novo paciente
        </h3>

        <div class="form-group">
            <label>Nome</label>
            <input
                type="text"
                id="newPatientName">
        </div>

        <div class="form-group">
            <label>Telefone</label>
            <input
                type="text"
                id="newPatientPhone">
        </div>

        <div class="form-group">
            <label>E-mail</label>
            <input
                type="email"
                id="newPatientEmail">
        </div>

        <div class="form-group">
            <label>Observações</label>
            <textarea
                id="newPatientNotes"
                rows="3"></textarea>
        </div>

        <div
            style="
                margin-top:16px;
                display:flex;
                gap:8px;
            ">

            <button
                class="btn btn-outline btn-sm"
                id="cancelNewPatient">
                Cancelar
            </button>

            <button
                class="btn btn-primary btn-sm"
                id="saveNewPatient">
                Criar paciente
            </button>

        </div>

        <p
            style="
                font-size:11px;
                color:var(--text-secondary);
                margin-top:8px;
            ">
            O paciente será salvo direto no Google Sheets.
        </p>
    `;

    getEl('cancelNewPatient')
        ?.addEventListener(
            'click',
            closeSlidePanel
        );

    getEl('saveNewPatient')
        ?.addEventListener(
            'click',
            async () => {

                const name =
                    getEl('newPatientName')
                        ?.value?.trim() || '';

                const phone =
                    getEl('newPatientPhone')
                        ?.value?.trim() || '';

                const email =
                    getEl('newPatientEmail')
                        ?.value?.trim() || '';

                const notes =
                    getEl('newPatientNotes')
                        ?.value?.trim() || '';


                if (!name || !phone) {

                    showToast(
                        'Preencha ao menos nome e telefone.'
                    );

                    return;
                }


                const saveBtn =
                    getEl('saveNewPatient');

                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Salvando...';
                }


                const values = {
                    name,
                    phone,
                    email,
                    notes,
                    created:
                        new Date()
                            .toLocaleDateString('pt-BR'),
                    lastVisit: '-',
                    nextAppt: '-',
                    status: 'Novo'
                };


                let newRow = null;


                if (window.pluriAPI) {

                    const result =
                        await window.pluriAPI.createPatient(
                            values
                        );

                    if (result?.success) {
                        newRow = result.row;
                    }
                }


                if (newRow === null) {

                    showToast(
                        'Não foi possível salvar na planilha. Tente novamente.'
                    );

                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent =
                            'Criar paciente';
                    }

                    return;
                }


                try {

                    state.patients =
                        await window.pluriAPI.getPatients();

                    closeSlidePanel();

                    showToast(
                        'Paciente criado com sucesso!'
                    );

                    renderPage();

                } catch (e) {

                    console.error(e);

                    showToast(
                        'Paciente salvo, mas não foi possível atualizar a lista.'
                    );
                }

            }
        );

    openSlidePanel();
}


function openPatient(row) {

    const p =
        state.patients.find(
            pt => pt._row === row
        );

    if (!p) return;

    const content =
        getEl('slideContent');

    if (!content) return;

    content.innerHTML = `
        <h3 style="margin-bottom:16px;">
            Editar paciente
        </h3>

        <div class="form-group">
            <label>Nome</label>
            <input
                type="text"
                id="editPatientName"
                value="${p.name}">
        </div>

        <div class="form-group">
            <label>Telefone</label>
            <input
                type="text"
                id="editPatientPhone"
                value="${p.phone}">
        </div>

        <div class="form-group">
            <label>E-mail</label>
            <input
                type="email"
                id="editPatientEmail"
                value="${p.email || ''}">
        </div>

        <div class="form-group">
            <label>Observações</label>
            <textarea
                id="editPatientNotes"
                rows="3">${p.notes || ''}</textarea>
        </div>

        <div
            style="
                margin-top:16px;
                display:flex;
                gap:8px;
            ">

            <button
                class="btn btn-outline btn-sm"
                id="cancelPatientEdit">
                Cancelar
            </button>

            <button
                class="btn btn-primary btn-sm"
                id="savePatientEdit">
                Salvar alterações
            </button>

        </div>

        <p
            style="
                font-size:11px;
                color:var(--text-secondary);
                margin-top:8px;
            ">
            As alterações serão sincronizadas com o Google Sheets.
        </p>
    `;


    getEl('cancelPatientEdit')
        ?.addEventListener(
            'click',
            closeSlidePanel
        );


    getEl('savePatientEdit')
        ?.addEventListener(
            'click',
            async () => {

                const name =
                    getEl('editPatientName')
                        ?.value?.trim() ||
                    p.name;

                const phone =
                    getEl('editPatientPhone')
                        ?.value?.trim() ||
                    p.phone;

                const email =
                    getEl('editPatientEmail')
                        ?.value?.trim() ||
                    p.email;

                const notes =
                    getEl('editPatientNotes')
                        ?.value?.trim() || '';


                const saveBtn =
                    getEl('savePatientEdit');

                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Salvando...';
                }


                let ok = true;


                if (window.pluriAPI && p._row) {

                    const result =
                        await window.pluriAPI.updatePatient(
                            p._row,
                            {
                                name,
                                phone,
                                email,
                                notes
                            }
                        );

                    ok = !!result?.success;
                }


                if (!ok) {

                    showToast(
                        'Não foi possível salvar na planilha. Tente novamente.'
                    );

                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent =
                            'Salvar alterações';
                    }

                    return;
                }


                try {

    state.patients =
        await window.pluriAPI.getPatients();


    // Se o cadastro foi iniciado pelo agendamento,
// volta automaticamente para o Novo agendamento.

if (window._returnToAppointment) {

    window._returnToAppointment = false;

    closeSlidePanel();

    setTimeout(() => {

        openModal(
            null,
            name,
            phone
        );

    }, 150);

    return;
}


// Cadastro normal pela aba Pacientes

closeSlidePanel();

showToast(
    'Paciente criado com sucesso!'
);

renderPage();
} catch (e) {

                    console.error(e);

                    showToast(
                        'Paciente atualizado.'
                    );
                }

            }
        );


    openSlidePanel();
}
