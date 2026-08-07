// js/agenda.js

function buildAgenda() {
    if (!state || !state.appointments) {
        return '<div class="card"><div class="card-body">Erro ao carregar agenda.</div></div>';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const allSlots = [];
    for (let h = 8; h < 18; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            allSlots.push(time);
        }
    }

    const appointmentsToday = state.appointments.filter(a => a.date === todayStr);
    appointmentsToday.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return `
        <div class="agenda-toolbar">
            <div class="agenda-toolbar-left">
                <div class="tabs" id="agendaTabs">
                    <button class="tab active" data-tab="today">Hoje</button>
                    <button class="tab" data-tab="week">Semana</button>
                </div>
                <div class="agenda-google-calendar" id="googleCalendarIndicator">
                    <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                    <span>Sincronizado com Google Calendar</span>
                </div>
            </div>
            <div class="agenda-toolbar-right">
                <button class="btn btn-primary" id="openModalBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo agendamento</button>
            </div>
        </div>
        <div id="agendaDayView" class="card"><div class="card-body no-padding">
            <ul class="agenda-list">${allSlots.map(time => {
                const appts = appointmentsToday.filter(a => String(a.time).trim() === time);
                if (appts.length > 0) {
                    return appts.map(appt => `
                        <li class="agenda-item" data-event-id="${appt.id}">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar">${getInitials(appt.patient)}</div>
                            <div class="agenda-info" style="flex:1; cursor:pointer;" onclick="window.pluri.openAppointment('${appt.id}')">
                                <div class="agenda-name">${appt.patient}</div>
                                <div class="agenda-detail">${appt.service} · ${appt.professional}</div>
                            </div>
                            ${statusBadge(appt.status)}
                            <button class="btn-icon-sm" title="Confirmar via WhatsApp" onclick="window.pluri.confirmAppointment('${appt.id}', '${appt.phone}', '${appt.patient}')">
                                <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="btn-icon-sm" title="Editar" onclick="window.pluri.editAppointment('${appt.id}')">
                                <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="btn-icon-sm" title="Excluir" onclick="window.pluri.deleteAppointment('${appt.id}')">
                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            </button>
                        </li>`).join('');
                } else {
                    return `
                        <li class="agenda-item free-slot">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar" style="background:var(--hover-bg);color:var(--text-secondary);">—</div>
                            <div class="agenda-info"><div class="agenda-name" style="color:var(--text-secondary);">Horário livre</div></div>
                            <button class="btn btn-sm btn-outline" onclick="window.pluri.openModal('${time}')">Agendar</button>
                        </li>`;
                }
            }).join('')}</ul>
        </div></div>
        <div id="agendaWeekView" style="display:none;"></div>`;
}

// Mantenha a função buildAgendaWeekElement existente (sem alterações)
function buildAgendaWeekElement() {
    // ... (seu código original) ...
}
