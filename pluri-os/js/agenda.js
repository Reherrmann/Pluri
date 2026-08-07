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
                    <span style="font-size:13px;font-weight:500;">${dataFormatada}</span>
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
                            <div class="agenda-info"><div class="agenda-name">${appt.patient}</div><div class="agenda-detail">${appt.service} · ${appt.professional}</div></div>
                            ${statusBadge(appt.status)}
                        </li>`).join('');
                }
            }).join('')}</ul>
        </div></div>
        <div id="agendaWeekView" style="display:none;"></div>`;
}

function buildAgendaMonthElement() {
    if (!state || !state.appointments) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Erro ao carregar dados do mês.';
        return errorDiv;
    }

    const today = new Date();
    const currentMonth = state.currentMonth || { year: today.getFullYear(), month: today.getMonth() };
    const year = currentMonth.year;
    const month = currentMonth.month;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push({ dateStr: '', dayNumber: '', isOtherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const dateStr = `${year}-${mm}-${dd}`;
        const appts = state.appointments.filter(a => a.date === dateStr);
        days.push({ dateStr, dayNumber: d, appts, isOtherMonth: false });
    }

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const fragment = document.createDocumentFragment();

    // Cabeçalho do mês
    const headerDiv = document.createElement('div');
    headerDiv.className = 'agenda-month-header';
    headerDiv.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
    headerDiv.innerHTML = `
        <button class="btn-icon btn-sm" id="monthPrevBtn"><i data-lucide="chevron-left" style="width:16px;height:16px;"></i></button>
        <span style="font-weight:600;font-size:16px;">${monthNames[month]} ${year}</span>
        <button class="btn-icon btn-sm" id="monthNextBtn"><i data-lucide="chevron-right" style="width:16px;height:16px;"></i></button>
    `;
    fragment.appendChild(headerDiv);

    // Grade do mês
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:2px;';

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach(name => {
        const dayHeader = document.createElement('div');
        dayHeader.style.cssText = 'text-align:center;font-size:12px;font-weight:500;padding:4px;color:var(--text-secondary);';
        dayHeader.textContent = name;
        grid.appendChild(dayHeader);
    });

    days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.style.cssText = `min-height:60px;border:1px solid var(--border);padding:4px;background:${day.isOtherMonth ? 'var(--hover-bg)' : 'var(--white)'};opacity:${day.isOtherMonth ? 0.5 : 1};`;

        if (!day.isOtherMonth && day.dateStr) {
            const dayNumber = document.createElement('div');
            dayNumber.textContent = day.dayNumber;
            dayNumber.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:4px;';
            dayDiv.appendChild(dayNumber);

            if (day.appts && day.appts.length > 0) {
                day.appts.forEach(appt => {
                    const apptDiv = document.createElement('div');
                    apptDiv.className = 'agenda-item';
                    apptDiv.setAttribute('data-id', appt.id);
                    apptDiv.style.cssText = 'font-size:10px;padding:2px 4px;margin-bottom:2px;background:var(--accent-light);border-radius:4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                    apptDiv.innerHTML = `${appt.time} ${appt.patient}`;
                    dayDiv.appendChild(apptDiv);
                });
            }
        }

        grid.appendChild(dayDiv);
    });

    fragment.appendChild(grid);

    // Navegação do mês
    setTimeout(() => {
        document.getElementById('monthPrevBtn')?.addEventListener('click', () => {
            if (!state.currentMonth) state.currentMonth = { year: today.getFullYear(), month: today.getMonth() };
            state.currentMonth.month--;
            if (state.currentMonth.month < 0) {
                state.currentMonth.month = 11;
                state.currentMonth.year--;
            }
            renderPage();
        });
        document.getElementById('monthNextBtn')?.addEventListener('click', () => {
            if (!state.currentMonth) state.currentMonth = { year: today.getFullYear(), month: today.getMonth() };
            state.currentMonth.month++;
            if (state.currentMonth.month > 11) {
                state.currentMonth.month = 0;
                state.currentMonth.year++;
            }
            renderPage();
        });
    }, 0);

    return fragment;
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
