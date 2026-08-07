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

    // ✅ Reabilita o botão sempre que o modal é aberto
    const saveBtn = getEl('modalSave');
    if (saveBtn) {
        saveBtn.disabled = false;
    }

    // Configura os botões de WhatsApp (só serão exibidos no modo edição)
    const btnConfirmar = getEl('btnConfirmarPresenca');
    const btnCancelar = getEl('btnCancelarAgendamento');
    if (btnConfirmar) btnConfirmar.onclick = pedirConfirmacao;
    if (btnCancelar) btnCancelar.onclick = comunicarCancelamento;

    refreshIcons();
}

// Alterna os textos do modal entre "Novo agendamento" e "Editar agendamento"
// e mostra/esconde os botões de ação extras
function setModalMode(mode) {
    const title = document.querySelector('#modalOverlay .modal-header h3');
    const saveBtn = getEl('modalSave');
    const editDiv = getEl('editActions');   // div com os botões de WhatsApp

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

// Abre o modal já preenchido para edição (chamada de fora, ex.: ao clicar no card)
function openEditAppointment(appointment) {
    // Aproveita os parâmetros básicos
    openModal(
        appointment.time,
        appointment.patient,
        appointment.phone
    );

    // Preenche os campos restantes
    const professional = getEl('apptProfessional');
    if (professional) professional.value = appointment.professional || 'Dra. Ana';
    const service = getEl('apptService');
    if (service) service.value = appointment.service || 'Avaliação';
    const notes = getEl('apptNotes');
    if (notes) notes.value = appointment.notes || '';
    const status = getEl('apptStatus');
    if (status) status.value = appointment.status || 'Aguardando';

    window._editingAppointmentId = appointment.id;
    setModalMode('edit');
}

function closeModal() {
    const overlay = getEl('modalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    window._editingAppointmentId = null;
}

// --- Funções de WhatsApp ---
function getPatientPhoneForWhatsApp() {
    const phone = getEl('apptPhone')?.value?.trim() || '';
    return phone.replace(/\D/g, '');
}

function openWhatsApp(phone, message) {
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

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

function comunicarCancelamento() {
    const phone = getPatientPhoneForWhatsApp();
    const patient = getEl('apptPatient')?.value?.trim() || 'Paciente';
    const date = getEl('apptDate')?.value || '';
    const time = getEl('apptTime')?.value || '';

    if (!phone) {
        showToast('Telefone do paciente não informado.');
        return;
    }
    const msg = `Olá ${patient}, infelizmente precisamos cancelar sua consulta do dia ${date} às ${time}. Por favor, entre em contato para reagendar.`;
    openWhatsApp(phone, msg);
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

    // Desabilita o botão para evitar duplo clique
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
        // 🔥 Atualiza a data da agenda para o dia do agendamento, mas NÃO força a aba
        state.agendaDate = date;

        closeModal();
        renderPage();
        showToast(isEditing ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.');

        // Fallback
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
