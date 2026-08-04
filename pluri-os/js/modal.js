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
    refreshIcons();
}
function closeModal() {
    const overlay = getEl('modalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

async function saveAppointment() {
    const patient =
        getEl('apptPatient')?.value?.trim() || '';
    const phone =
        getEl('apptPhone')?.value?.trim() || '';

    const professional =
        getEl('apptProfessional')?.value || 'Dra. Ana';

    const service =
        getEl('apptService')?.value || 'Avaliação';

    const date =
        getEl('apptDate')?.value || '';

    const time =
        getEl('apptTime')?.value || '';

    const notes =
        getEl('apptNotes')?.value?.trim() || '';

    if (!patient || !date || !time) {

        showToast(
            'Preencha paciente, data e horário.'
        );
        return;
    }
    if (!window.pluriAPI) {
        showToast(
            'API não inicializada.'
        );
        return;
    }
    try {
        const result =
            await window.pluriAPI.createAppointment({

                patient,
                phone,
                professional,
                service,
                date,
                time,
                notes,
                status: 'Confirmado'

            });

        console.log(
            'Resultado do Google Calendar:',
            result
        );

        if (!result.success) {

            showToast(

                result.error ||

                'Erro ao criar evento.'

            );

            return;

        }

        state.appointments =
            await window.pluriAPI.getCalendarAppointments();

        closeModal();

        renderPage();

        showToast(
            'Agendamento criado com sucesso.'
        );

    }

    catch (e) {

        console.error(e);

        showToast(
            'Erro ao sincronizar com o Google Calendar.'
        );

    }

}
