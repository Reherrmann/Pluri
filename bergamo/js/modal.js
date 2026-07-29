// js/modal.js
function openModal(time = null, patientName = null, patientPhone = null) {
    getEl('modalOverlay')?.classList.add('show');
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
    getEl('modalOverlay')?.classList.remove('show');
}

function saveAppointment() {
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

    if (!state.patients.some(p => p.name.toLowerCase() === patient.toLowerCase())) {
        state.patients.push({
            id: Date.now(),
            name: patient,
            phone: phone || '-',
            email: '-',
            created: new Date().toLocaleDateString('pt-BR'),
            lastVisit: '-',
            nextAppt: date.split('-').reverse().join('/'),
            status: 'Novo',
            notes,
        });
    }

    // Salvar via Apps Script
    if (window.pluriAPI) {
        window.pluriAPI.saveAppointment(newAppt);
    }

    closeModal();
    showToast('Agendamento criado com sucesso.');
    renderPage();
}
