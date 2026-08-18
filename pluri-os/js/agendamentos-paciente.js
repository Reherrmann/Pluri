// js/agendamentos-paciente.js
// Agendamentos dentro da ficha do paciente.
// Usa os agendamentos já carregados em state.appointments e não altera a Agenda principal.

function normalizePatientName(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function getPatientAppointments(patient) {
    if (!patient || !Array.isArray(state.appointments)) return [];

    const patientName = normalizePatientName(patient.name);
    if (!patientName) return [];

    return state.appointments
        .filter(appt => normalizePatientName(appt.patient) === patientName)
        .sort((a, b) => {
            const aKey = `${a.date || ''} ${a.time || ''}`;
            const bKey = `${b.date || ''} ${b.time || ''}`;
            return aKey.localeCompare(bKey);
        });
}

function formatPatientAppointmentDate(date) {
    if (!date) return '—';
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return escapeHtml(date);
    return parsed.toLocaleDateString('pt-BR');
}

function patientAppointmentStatus(status) {
    const value = String(status || 'Aguardando').trim() || 'Aguardando';

    if (typeof window.statusBadge === 'function') {
        return window.statusBadge(value);
    }

    return `<span class="appointment-status">${escapeHtml(value)}</span>`;
}

function openNewPatientAppointment() {
    const patient = state.selectedPatient;
    if (!patient) return;

    if (typeof openModal !== 'function') {
        console.error('PLURI OS: openModal não está disponível.');
        return;
    }

    openModal(null, patient.name || '', patient.phone || '');
}

function renderPatientAppointments(patient) {
    const appointments = getPatientAppointments(patient);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);

    const upcoming = appointments.filter(appt => String(appt.date || '') >= todayKey);
    const previous = appointments.filter(appt => String(appt.date || '') < todayKey).reverse();

    const renderRow = (appt) => `
        <div class="patient-appointment-card">
            <div class="patient-appointment-date">
                <strong>${formatPatientAppointmentDate(appt.date)}</strong>
                <span>${escapeHtml(appt.time || '—')}</span>
            </div>
            <div class="patient-appointment-main">
                <div class="patient-appointment-service">${escapeHtml(appt.service || 'Consulta')}</div>
                <div class="patient-appointment-professional">${escapeHtml(appt.professional || 'Profissional não informado')}</div>
            </div>
            <div class="patient-appointment-status">
                ${patientAppointmentStatus(appt.status)}
            </div>
            <div class="patient-appointment-action">
                <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    onclick="event.stopPropagation(); window.pluri.editAppointment('${String(appt.id).replace(/'/g, "\\'")}')"
                >
                    Editar
                </button>
            </div>
        </div>
    `;

    return `
        <div class="patient-section patient-appointments-section">
            <div class="patient-section-header">
                <div>
                    <h2>Agendamentos</h2>
                    <p>Consultas e atendimentos deste paciente.</p>
                </div>
                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="openNewPatientAppointment()"
                >
                    <i data-lucide="plus" style="width:16px;height:16px;"></i>
                    Novo agendamento
                </button>
            </div>

            <div class="patient-appointments-group">
                <h3>Próximos</h3>
                ${upcoming.length
                    ? upcoming.map(renderRow).join('')
                    : `<div class="patient-appointments-empty">Nenhum próximo agendamento para este paciente.</div>`}
            </div>

            <div class="patient-appointments-group">
                <h3>Histórico</h3>
                ${previous.length
                    ? previous.map(renderRow).join('')
                    : `<div class="patient-appointments-empty">Nenhum agendamento anterior encontrado.</div>`}
            </div>
        </div>
    `;
}

window.renderPatientAppointments = renderPatientAppointments;
window.openNewPatientAppointment = openNewPatientAppointment;
