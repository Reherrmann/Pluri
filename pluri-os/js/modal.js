// js/modal.js

function openModal(time = null, patientName = null, patientPhone = null) {
    const overlay = getEl('modalOverlay');
    if (!overlay) return;
    overlay.classList.add('show');

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

    // Botões de ação (excluir e confirmar WhatsApp) aparecem apenas na edição
    const footer = document.querySelector('.modal-footer');
    if (footer) {
        const oldDeleteBtn = document.getElementById('deleteAppointmentBtn');
        if (oldDeleteBtn) oldDeleteBtn.remove();
        const oldConfirmBtn = document.getElementById('confirmWhatsAppBtn');
        if (oldConfirmBtn) oldConfirmBtn.remove();

        if (window._editingAppointmentId) {
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteAppointmentBtn';
            deleteBtn.className = 'btn btn-outline btn-sm';
            deleteBtn.textContent = 'Excluir';
            deleteBtn.style.marginRight = 'auto';
            deleteBtn.addEventListener('click', deleteAppointment);
            footer.prepend(deleteBtn);

            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirmWhatsAppBtn';
            confirmBtn.className = 'btn btn-primary btn-sm';
            confirmBtn.textContent = 'Confirmar via WhatsApp';
            confirmBtn.addEventListener('click', confirmarEnviarWhatsApp);
            footer.appendChild(confirmBtn);
        }
    }

    refreshIcons();
}

function closeModal() {
    const overlay = getEl('modalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    delete window._editingAppointmentId;
}

async function saveAppointment() {
    const patient = getEl('apptPatient')?.value?.trim() || '';
    const phone = getEl('apptPhone')?.value?.trim() || '';
    const professional = getEl('apptProfessional')?.value || 'Dra. Ana';
    const service = getEl('apptService')?.value || 'Avaliação';
    const date = getEl('apptDate')?.value || '';
    const time = getEl('apptTime')?.value || '';
    const notes = getEl('apptNotes')?.value?.trim() || '';
    const editId = getEl('modalSave')?.getAttribute('data-edit-id');

    if (!patient || !date || !time) {
        showToast('Preencha paciente, data e horário.');
        return;
    }
    if (!window.pluriAPI) {
        showToast('API não inicializada.');
        return;
    }

    const saveBtn = getEl('modalSave');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = editId ? 'Atualizando...' : 'Salvando...';
    }

    try {
        let result;
        if (editId) {
            result = await window.pluriAPI.updateAppointment({
                id: editId,
                patient,
                phone,
                professional,
                service,
                date,
                time,
                notes,
                status: 'Confirmado',
                token: window.pluriAPI.token
            });
        } else {
            result = await window.pluriAPI.createAppointment({
                patient,
                phone,
                professional,
                service,
                date,
                time,
                notes,
                status: 'Confirmado',
                token: window.pluriAPI.token
            });
        }

        console.log('Resultado do Google Calendar:', result);

        if (!result || !result.success) {
            showToast(result?.error || 'Erro ao salvar evento.');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = editId ? 'Atualizar agendamento' : 'Salvar agendamento';
            }
            return;
        }

        state.appointments = await window.pluriAPI.getCalendarAppointments();
        closeModal();
        renderPage();
        showToast(editId ? 'Agendamento atualizado.' : 'Agendamento criado com sucesso.');

    } catch (e) {
        console.error(e);
        showToast('Erro ao sincronizar com o Google Calendar.');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = editId ? 'Atualizar agendamento' : 'Salvar agendamento';
        }
    }
}

async function deleteAppointment() {
    if (!window._editingAppointmentId) return;
    if (!confirm('Deseja realmente excluir este agendamento?')) return;

    try {
        const result = await window.pluriAPI.deleteAppointment(
            window._editingAppointmentId,
            window.pluriAPI.token   // envia token de sessão para o backend validar a clínica
        );
        if (result && result.success) {
            delete window._editingAppointmentId;
            state.appointments = await window.pluriAPI.getCalendarAppointments();
            closeModal();
            renderPage();
            showToast('Agendamento excluído.');
        } else {
            showToast(result?.error || 'Erro ao excluir.');
        }
    } catch (e) {
        console.error(e);
        showToast('Erro ao excluir.');
    }
}

async function confirmarEnviarWhatsApp() {
    const patient = getEl('apptPatient')?.value?.trim();
    const phone = getEl('apptPhone')?.value?.trim();
    const date = getEl('apptDate')?.value;
    const time = getEl('apptTime')?.value;
    const professional = getEl('apptProfessional')?.value;

    if (!patient || !phone || !date || !time) {
        showToast('Dados incompletos para confirmação.');
        return;
    }

    const mensagem = `Olá ${patient}, sua consulta está confirmada para ${date} às ${time} com ${professional}.`;
    const url = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');

    // Atualiza status para Confirmado se estiver editando
    if (window._editingAppointmentId) {
        const appt = state.appointments.find(a => a.id === window._editingAppointmentId);
        if (appt) {
            await window.pluriAPI.updateAppointment({
                id: appt.id,
                patient: appt.patient,
                phone: appt.phone,
                professional: appt.professional || 'Dra. Ana',
                service: appt.service || 'Avaliação',
                date: appt.date,
                time: appt.time,
                notes: appt.notes,
                status: 'Confirmado',
                token: window.pluriAPI.token
            });
            state.appointments = await window.pluriAPI.getCalendarAppointments();
            renderPage();
        }
    }
    showToast('Mensagem enviada e status atualizado!');
}
