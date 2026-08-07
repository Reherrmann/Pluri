// js/modal.js

function openModal(time = null, patientName = null, patientPhone = null) {
    const overlay = getEl('modalOverlay');
    if (!overlay) return;
    overlay.classList.add('show');

    // Todo openModal() começa em modo "novo agendamento".
    // openEditAppointment() troca para 'edit' logo em seguida, se for o caso.
    window._editingAppointmentId = null;
    setModalMode('create');

    const dateInput = getEl('apptDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    const timeInput = getEl('apptTime');
    if (timeInput) {
        timeInput.value = time || '09:00';
    }
    const patientInput = getEl('apptPatient');
    if (patientInput) {
        patientInput.value = patientName || '';
    }
    const phoneInput = getEl('apptPhone');
    if (phoneInput) {
        phoneInput.value = patientPhone || '';
    }
    const notesInput = getEl('apptNotes');
    if (notesInput) notesInput.value = '';
    const statusInput = getEl('apptStatus');
    if (statusInput) statusInput.value = 'Aguardando';

    refreshIcons();
}

// Alterna os textos do modal entre "Novo agendamento" e "Editar agendamento"
function setModalMode(mode) {
    const title = document.querySelector('#modalOverlay .modal-header h3');
    const saveBtn = getEl('modalSave');
    if (mode === 'edit') {
        if (title) title.textContent = 'Editar agendamento';
        if (saveBtn) saveBtn.textContent = 'Salvar alterações';
    } else {
        if (title) title.textContent = 'Novo agendamento';
        if (saveBtn) saveBtn.textContent = 'Salvar agendamento';
    }
}

function closeModal() {
    const overlay = getEl('modalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    window._editingAppointmentId = null;
}

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

    // Desabilita o botão de salvar para evitar duplo clique
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
            clinicaID: window.PLURI_USER?.clinicaId   // envia o clinicaID da sessão
        };

        const result = isEditing
            ? await window.pluriAPI.updateAppointment({ ...payload, id: window._editingAppointmentId })
            : await window.pluriAPI.createAppointment(payload);

        console.log('Resultado do Google Calendar:', result);

        if (!result || !result.success) {
            showToast(result?.error || 'Erro ao salvar evento.');
            if (saveBtn) {
                saveBtn.disabled = false;
                setModalMode(isEditing ? 'edit' : 'create');
            }
            return;
        }

        // Recarrega os agendamentos da API
        state.appointments = await window.pluriAPI.getCalendarAppointments();
        // 🔥 Pula a agenda direto pro dia do agendamento salvo, em vez de
        // ficar parado em "hoje" (era essa a causa de parecer "sempre hoje").
        state.agendaDate = date;
        state.agendaTab = 'today';
        closeModal();
        renderPage(); // Atualiza a página atual
        showToast(isEditing ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.');

        // Fallback: recarrega a página inteira após 1s se a lista não tiver sido atualizada
        setTimeout(() => {
            if (state.appointments.length === 0) {
                location.reload();
            }
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
