// js/modal.js

function openModal(time = null, patientName = null, patientPhone = null) {
    const overlay = getEl('modalOverlay');
    if (!overlay) return;
    overlay.classList.add('show');

    window._editingAppointmentId = null;
    setModalMode('create');

    const dateInput = getEl('apptDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const timeInput = getEl('apptTime');
    if (timeInput) timeInput.value = time || '09:00';

    const patientInput = getEl('apptPatient');
    if (patientInput) patientInput.value = patientName || '';

    const phoneInput = getEl('apptPhone');
    if (phoneInput) phoneInput.value = patientPhone || '';

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
    const patient = getEl('apptPatient')?.value?.trim() || 'Paciente';
    const date = getEl('apptDate')?.value || '';
    const time = getEl('apptTime')?.value || '';

    if (!phone) {
        showToast('Telefone do paciente não informado.');
        return;
    }
    const msg = `Olá ${patient}, sua consulta está agendada para ${date} às ${time}. Poderia confirmar sua presença?`;
    openWhatsApp(phone, msg);
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
