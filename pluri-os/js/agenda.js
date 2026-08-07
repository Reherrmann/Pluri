// js/agenda.js

function buildAgenda() {
    if (!state || !state.appointments) {
        return '<div class="card"><div class="card-body">Erro ao carregar agenda.</div></div>';
    }

    // Data selecionada (padrão hoje)
    const currentDate = state.agendaDate || new Date().toISOString().split('T')[0];
    const allSlots = [];
    for (let h = 8; h < 18; h++) {
        for (let m = 0; m < 60; m += 30) {
            allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }

    const appointmentsToday = state.appointments.filter(a => a.date === currentDate);
    // Agrupar múltiplos eventos no mesmo horário
    const grouped = {};
    appointmentsToday.forEach(a => {
        const time = String(a.time).trim();
        if (!grouped[time]) grouped[time] = [];
        grouped[time].push(a);
    });

    // Formatar data para exibição
    const dataFormatada = new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    return `
        <div class="agenda-toolbar">
            <div class="agenda-toolbar-left">
                <div class="tabs" id="agendaTabs">
                    <button class="tab active" data-tab="today">Hoje</button>
                    <button class="tab" data-tab="week">Semana</button>
                </div>
                <div class="agenda-date-navigator" style="display:flex;align-items:center;gap:8px;margin-left:20px;">
                    <button class="btn-icon btn-sm" id="agendaPrevDay" title="Dia anterior"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>
                    <span style="font-size:13px;font-weight:500;min-width:150px;text-align:center;display:inline-block;">${dataFormatada}</span>
                    <button class="btn-icon btn-sm" id="agendaNextDay" title="Próximo dia"><i data-lucide="chevron-right" style="width:14px;height:14px;"></i></button>
                </div>
                <div class="agenda-google-calendar" id="googleCalendarIndicator">
                    <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                    <span>Sincronizado com Google Calendar</span>
                </div>
            </div>
            <div class="agenda-toolbar-right">
                <button class="btn btn-primary" id="openModalBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo agendamento</button>
                <button class="btn btn-outline" id="btnConnectCalendar" style="display:none;">🔗 Conectar Google Calendar</button>
            </div>
        </div>
        <div id="agendaDayView" class="card"><div class="card-body no-padding">
            <ul class="agenda-list">${allSlots.map(time => {
                const events = grouped[time] || [];
                if (events.length === 0) {
                    return `
                        <li class="agenda-item free-slot">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar" style="background:var(--hover-bg);color:var(--text-secondary);">—</div>
                            <div class="agenda-info"><div class="agenda-name" style="color:var(--text-secondary);">Horário livre</div></div>
                            <button class="btn btn-sm btn-outline" onclick="window.pluri.openModal('${time}')">Agendar</button>
                        </li>`;
                } else {
                    return events.map((appt, index) => `
                        <li class="agenda-item" data-id="${appt.id}" style="cursor:pointer; ${index > 0 ? 'border-top:1px dashed var(--border);' : ''}">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar">${getInitials(appt.patient)}</div>
                            <div class="agenda-info" onclick="window.pluri.editAppointment('${appt.id}')">
                                <div class="agenda-name">${appt.patient}</div>
                                <div class="agenda-detail">${appt.service} · ${appt.professional}</div>
                            </div>
                            ${statusBadge(appt.status)}
                            <button class="btn-icon-sm" title="Confirmar via WhatsApp" onclick="event.stopPropagation(); window.pluri.confirmAppointment('${appt.id}', '${appt.phone}', '${appt.patient}')">
                                <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="btn-icon-sm" title="Editar" onclick="event.stopPropagation(); window.pluri.editAppointment('${appt.id}')">
                                <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="btn-icon-sm" title="Excluir" onclick="event.stopPropagation(); window.pluri.deleteAppointment('${appt.id}')">
                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            </button>
                        </li>`).join('');
                }
            }).join('')}</ul>
        </div></div>
        <div id="agendaWeekView" style="display:none;"></div>`;
}

function buildAgendaWeekElement() {
    // Garantir que state existe
    if (!state || !state.appointments) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Erro ao carregar dados da semana.';
        return errorDiv;
    }

    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
        const appts = state.appointments.filter(a => a.date === dateStr);
        days.push({ dateStr, dayName, dd, appts });
    }

    const fragment = document.createDocumentFragment();

    // Legenda das cores
    const legend = document.createElement('div');
    legend.className = 'agenda-week-legend';
    legend.innerHTML = `
        <div class="agenda-week-legend-item"><span class="status-dot green"></span> Confirmado</div>
        <div class="agenda-week-legend-item"><span class="status-dot amber"></span> Pendente</div>
        <div class="agenda-week-legend-item"><span class="status-dot red"></span> Cancelado</div>
    `;
    fragment.appendChild(legend);

    const wrapper = document.createElement('div');
    wrapper.className = 'agenda-week-wrapper';

    const grid = document.createElement('div');
    grid.className = 'agenda-week-grid';

    days.forEach(d => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'agenda-week-day';

        const header = document.createElement('div');
        header.className = 'agenda-week-header';
        header.textContent = `${d.dayName} ${d.dd}`;

        const appointmentsDiv = document.createElement('div');
        appointmentsDiv.className = 'agenda-week-appointments';

        if (d.appts.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'agenda-week-empty';
            empty.textContent = 'Nenhum agendamento';
            appointmentsDiv.appendChild(empty);
        } else {
            d.appts.forEach(a => {
                const apptDiv = document.createElement('div');
                apptDiv.className = 'agenda-week-appointment';

                const timeSpan = document.createElement('span');
                timeSpan.className = 'agenda-week-appointment-time';
                timeSpan.textContent = a.time;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'agenda-week-appointment-name';
                nameSpan.textContent = a.patient;

                const dotSpan = document.createElement('span');
                dotSpan.innerHTML = statusDotOnly(a.status);

                apptDiv.appendChild(timeSpan);
                apptDiv.appendChild(nameSpan);
                apptDiv.appendChild(dotSpan);
                appointmentsDiv.appendChild(apptDiv);
            });
        }

        dayDiv.appendChild(header);
        dayDiv.appendChild(appointmentsDiv);
        grid.appendChild(dayDiv);
    });

    wrapper.appendChild(grid);
    fragment.appendChild(wrapper);

    return fragment; // Retorna um DocumentFragment que pode ser anexado ao DOM
}

function openEditAppointment(eventId) {
    const appt = state.appointments.find(a => a.id === eventId);
    if (!appt) return;
    openModal(appt.time, appt.patient, appt.phone);
    // Preencher campos adicionais
    getEl('apptProfessional').value = appt.professional || 'Dra. Ana';
    getEl('apptService').value = appt.service || 'Avaliação';
    getEl('apptNotes').value = appt.notes || '';
    getEl('apptDate').value = appt.date;
    // Guardar referência para edição/exclusão
    window._editingAppointmentId = eventId;
}
