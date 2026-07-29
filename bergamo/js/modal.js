// js/modal.js
function openModal(time = null, patientName = null, patientPhone = null) {
    const overlay = getEl('modalOverlay');
    if (!overlay) return;
    overlay.classList.add('show');

    const dateInput = getEl('apptDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const timeInput = getEl('apptTime');
    if (timeInput) timeInput.value = time || '09:00';

    const patientInput = getEl('apptPatient');
    if (patientInput && patientName) patientInput.value = patientName;

    const phoneInput = getEl('apptPhone');
    if (phoneInput && patientPhone) phoneInput.value = patientPhone;

    refreshIcons();
}

function closeModal() {
    const overlay = getEl('modalOverlay');
    if (overlay) overlay.classList.remove('show');
}

async function saveAppointment() {
    const patient = getEl('apptPatient')?.value?.trim() || '';
    const phone = getEl('apptPhone')?.value?.trim() || '';
    const professional = getEl('apptProfessional')?.value || 'Dra. Ana';
    const service = getEl('apptService')?.value || 'Avaliação';
    const date = getEl('apptDate')?.value || '';
    const time = getEl('apptTime')?.value || '';
    const notes = getEl('apptNotes')?.value?.trim() || '';

    if (!patient || !date || !time) {
        showToast('Preencha paciente, data e horário.');
        return;
    }

    const newAppt = {
        id: Date.now(),
        time,
        patient,
        professional,
        service,
        status: 'Confirmado',
        date,
    };
    state.appointments.unshift(newAppt);

    // Fecha o modal imediatamente
    closeModal();
    showToast('Agendamento criado com sucesso.');

    // Tenta salvar na planilha via API
    if (window.pluriAPI) {
        try {
            const body = {
                action: 'create',
                sheet: 'Agendamentos',
                values: {
                    ID: newAppt.id.toString(),
                    Horário: newAppt.time,
                    Paciente: newAppt.patient,
                    Profissional: newAppt.professional,
                    Serviço: newAppt.service,
                    Status: newAppt.status,
                    Data: newAppt.date,
                }
            };

            const res = await fetch(PLURI_CONFIG.appsScript.salvarAgendamento, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            console.log('Resultado do salvamento:', result);
            if (!result.success) {
                showToast('Agendamento salvo localmente, mas houve erro ao sincronizar com a planilha.');
            }
        } catch (e) {
            console.warn('Erro ao salvar na planilha:', e.message);
        }
    }

    renderPage();
}
