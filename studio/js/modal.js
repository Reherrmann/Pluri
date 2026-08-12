// js/modal.js

function openModal(time = null, patientName = null, patientPhone = null) {
    const overlay = getEl('modalOverlay');
    if (!overlay) return;
    overlay.classList.add('show');

    window._editingAppointmentId = null;
    setModalMode('create');

// Carrega os profissionais cadastrados na equipe
const professionalSelect = getEl('apptProfessional');

if (professionalSelect) {

    const currentProfessional =
        professionalSelect.value || '';

    const professionals =
        Array.isArray(state.staff)
            ? state.staff.filter(staff =>
                String(staff.status || 'Ativo')
                    .toLowerCase() === 'ativo'
            )
            : [];

    professionalSelect.innerHTML = '';

    if (professionals.length) {

        professionals.forEach(professional => {

            const option =
                document.createElement('option');

            option.value =
                professional.name || '';

            option.textContent =
                professional.name || '';

            professionalSelect.appendChild(option);
        });

        if (
            currentProfessional &&
            professionals.some(
                professional =>
                    professional.name === currentProfessional
            )
        ) {
            professionalSelect.value =
                currentProfessional;
        }

    } else {

        const option =
            document.createElement('option');

        option.value = '';

        option.textContent =
            'Nenhum profissional cadastrado';

        professionalSelect.appendChild(option);
    }
}
    
    const dateInput = getEl('apptDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const timeInput = getEl('apptTime');
    if (timeInput) timeInput.value = time || '09:00';

    const patientInput = getEl('apptPatient');

if (patientInput) {

    patientInput.value = patientName || '';

    patientInput.oninput = () => {

        const term =
            patientInput.value.trim().toLowerCase();

        const results =
            getEl('patientSearchResults');

        if (!results) return;

        if (!term) {
            results.style.display = 'none';
            results.innerHTML = '';
            return;
        }

        const patients =
    (state.patients || []).filter(p =>
        String(p.name || '')
            .toLowerCase()
            .includes(term) ||

        String(p.phone || '')
            .includes(term)
    );

        if (!patients.length) {

            results.innerHTML = `
                <div style="
                    padding:12px;
                    color:var(--text-secondary);
                    font-size:13px;
                ">
                    Nenhum paciente encontrado.
                </div>
            `;

            results.style.display = 'block';

            return;
        }

        results.innerHTML = patients
            .slice(0, 8)
            .map(p => `
                <div
                    class="patient-search-result"
                    data-patient-row="${p._row}"
                    style="
                        padding:10px 12px;
                        cursor:pointer;
                        border-bottom:1px solid var(--border);
                    ">

                    <div style="
                        font-weight:600;
                        font-size:13px;
                    ">
                        ${p.name}
                    </div>

                    <div style="
                        font-size:11px;
                        color:var(--text-secondary);
                        margin-top:2px;
                    ">
                        ${p.phone || 'Sem telefone'}
                    </div>

                </div>
            `)
            .join('');

        results.style.display = 'block';

        results
            .querySelectorAll('.patient-search-result')
            .forEach(item => {

                item.addEventListener('click', () => {

                    const row =
                        item.dataset.patientRow;

                    const patient =
                        state.patients.find(
                            p => String(p._row) === String(row)
                        );

                    if (!patient) return;

                    patientInput.value =
                        patient.name || '';

                    const phoneInput =
                        getEl('apptPhone');

                    if (phoneInput) {
                        phoneInput.value =
                            patient.phone || '';
                    }

                    results.style.display = 'none';
                    results.innerHTML = '';
                });

            });
    };
}


const phoneInput = getEl('apptPhone');

if (phoneInput) {
    phoneInput.value = patientPhone || '';
}
    const notesInput = getEl('apptNotes');
    if (notesInput) notesInput.value = '';

    const statusInput = getEl('apptStatus');
    if (statusInput) statusInput.value = 'Aguardando';

    // Reabilita o botão de salvar
    const saveBtn = getEl('modalSave');
    if (saveBtn) saveBtn.disabled = false;

    // Configura os botões de ação
const btnConfirmar = getEl('btnConfirmarPresenca');
const btnCancelar = getEl('btnCancelarAgendamento');

if (btnConfirmar) btnConfirmar.onclick = pedirConfirmacao;
if (btnCancelar) btnCancelar.onclick = cancelarAgendamento;


// NOVO PACIENTE A PARTIR DO AGENDAMENTO
const newPatientBtn =
    getEl('newPatientFromAppointment');

if (newPatientBtn) {

    newPatientBtn.onclick = () => {

        const currentName =
            getEl('apptPatient')?.value?.trim() || '';

        const currentPhone =
            getEl('apptPhone')?.value?.trim() || '';

        window._returnToAppointment = true;

        closeModal();

        openNewPatient();

        setTimeout(() => {

            const nameInput =
                getEl('newPatientName');

            const phoneInput =
                getEl('newPatientPhone');

            if (nameInput) {
                nameInput.value = currentName;
            }

            if (phoneInput) {
                phoneInput.value = currentPhone;
            }

        }, 50);
    };
}
    
    refreshIcons();
}

function setModalMode(mode) {
    const title = document.querySelector('#modalOverlay .modal-header h3');
    const saveBtn = getEl('modalSave');
    const editDiv = getEl('editActions');

    if (mode === 'edit') {
        if (title) title.textContent = 'Editar agendamento';
        if (saveBtn) saveBtn.textContent = 'Salvar alterações';
        if (editDiv) editDiv.style.display = 'flex';
    } else {
        if (title) title.textContent = 'Novo agendamento';
        if (saveBtn) saveBtn.textContent = 'Salvar agendamento';
        if (editDiv) editDiv.style.display = 'none';
    }
}

function closeModal() {
    const overlay = getEl('modalOverlay');
    if (overlay) overlay.classList.remove('show');
    window._editingAppointmentId = null;
}

// --- Funções auxiliares de WhatsApp ---
function getPatientPhoneForWhatsApp() {
    const phone = getEl('apptPhone')?.value?.trim() || '';
    return phone.replace(/\D/g, '');
}

function openWhatsApp(phone, message) {
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// --- Ação: Pedir confirmação ---
function pedirConfirmacao() {

    const phone = getPatientPhoneForWhatsApp();

    const patient =
        getEl('apptPatient')?.value?.trim() ||
        'Paciente';

    const date =
        getEl('apptDate')?.value || '';

    const time =
        getEl('apptTime')?.value || '';


    if (!phone) {

        showToast(
            'Telefone do paciente não informado.'
        );

        return;
    }


    // Marca como aguardando confirmação
    const statusInput =
        getEl('apptStatus');

    if (statusInput) {
        statusInput.value = 'Aguardando';
    }


    const msg =
        `Olá ${patient}, sua consulta está agendada para ${date} às ${time}. Poderia confirmar sua presença?`;


    openWhatsApp(
        phone,
        msg
    );


    /*
     * Se for um agendamento já existente,
     * salva o status Aguardando.
     */

    if (window._editingAppointmentId) {
        saveAppointment();
    }
}

async function confirmarPresenca() {

    const statusInput = getEl('apptStatus');

    if (statusInput) {
        statusInput.value = 'Confirmado';
    }

    if (!window._editingAppointmentId) {
        showToast('Nenhum agendamento em edição.');
        return;
    }

    await saveAppointment();
}

// --- Ação: Cancelar agendamento (muda status + WhatsApp) ---
async function cancelarAgendamento() {
    const patient = getEl('apptPatient')?.value?.trim() || '';
    const phone = getPatientPhoneForWhatsApp();
    const date = getEl('apptDate')?.value || '';
    const time = getEl('apptTime')?.value || '';

    if (!window._editingAppointmentId) {
        showToast('Nenhum agendamento em edição.');
        return;
    }

    if (!confirm(`Deseja realmente cancelar o agendamento de ${patient}?`)) return;

    // Altera o status no formulário para Cancelado
    const statusInput = getEl('apptStatus');
    if (statusInput) statusInput.value = 'Cancelado';

    // Salva a alteração (reaproveita a lógica de saveAppointment)
    await saveAppointment();

    // Após salvar, envia WhatsApp informando o cancelamento (se houver telefone)
    if (phone) {
        const msg = `Olá ${patient}, infelizmente precisamos cancelar sua consulta do dia ${date} às ${time}. Por favor, entre em contato para reagendar.`;
        openWhatsApp(phone, msg);
    }
}

// --- Salvar (mantido como estava, apenas com a correção do botão) ---
async function saveAppointment() {
    const patient = getEl('apptPatient')?.value?.trim() || '';
    const phone = getEl('apptPhone')?.value?.trim() || '';
    const professional = getEl('apptProfessional')?.value || 'Dra. Ana';
    const service = getEl('apptService')?.value || 'Avaliação';
    const date = getEl('apptDate')?.value || '';
    const time = getEl('apptTime')?.value || '';
    const notes = getEl('apptNotes')?.value?.trim() || '';
    const status = getEl('apptStatus')?.value || 'Aguardando';

    if (!patient || !date || !time) {
        showToast('Preencha paciente, data e horário.');
        return;
    }
    if (!window.pluriAPI) {
        showToast('API não inicializada.');
        return;
    }

    const isEditing = !!window._editingAppointmentId;

    const saveBtn = getEl('modalSave');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvando...';
    }

    try {
        const payload = {
            patient,
            phone,
            professional,
            service,
            date,
            time,
            notes,
            status,
            clinicaID: window.PLURI_USER?.clinicaId
        };

        const result = isEditing
            ? await window.pluriAPI.updateAppointment({ ...payload, id: window._editingAppointmentId })
            : await window.pluriAPI.createAppointment(payload);

        if (!result || !result.success) {
            showToast(result?.error || 'Erro ao salvar evento.');
            if (saveBtn) {
                saveBtn.disabled = false;
                setModalMode(isEditing ? 'edit' : 'create');
            }
            return;
        }

        state.appointments = await window.pluriAPI.getCalendarAppointments();
        state.agendaDate = date;  // mantém a data, mas não força a aba

        closeModal();
        renderPage();
        showToast(isEditing ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.');

        setTimeout(() => {
            if (state.appointments.length === 0) location.reload();
        }, 1000);

    } catch (e) {
        console.error(e);
        showToast('Erro ao sincronizar com o Google Calendar.');
        if (saveBtn) {
            saveBtn.disabled = false;
            setModalMode(isEditing ? 'edit' : 'create');
        }
    }
}
