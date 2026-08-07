// js/agenda.js

// js/agenda.js

function buildAgenda() {
    if (!state || !state.appointments) {
        return '<div class="card"><div class="card-body">Erro ao carregar agenda.</div></div>';
    }

    const activeTab = state.activeAgendaTab || 'today';
    const currentDate = state.agendaDate || new Date().toISOString().split('T')[0];
    const allSlots = [];
    for (let h = 8; h < 18; h++) {
        for (let m = 0; m < 60; m += 30) {
            allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }

    const appointmentsToday = state.appointments.filter(a => a.date === currentDate);
    const grouped = {};
    appointmentsToday.forEach(a => {
        const time = String(a.time).trim();
        if (!grouped[time]) grouped[time] = [];
        grouped[time].push(a);
    });

    const dataFormatada = new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    return `
        <div class="agenda-toolbar">
            <div class="agenda-toolbar-left">
                <div class="tabs" id="agendaTabs">
                    <button class="tab ${activeTab === 'today' ? 'active' : ''}" data-tab="today">Hoje</button>
                    <button class="tab ${activeTab === 'week' ? 'active' : ''}" data-tab="week">Semana</button>
                </div>
                <div class="agenda-date-navigator" style="display:flex;align-items:center;gap:8px;margin-left:20px;width:240px;justify-content:center;">
                    <button class="btn-icon btn-sm" id="agendaPrevDay" title="Dia anterior"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>
                    <span style="font-size:13px;font-weight:500;white-space:nowrap;">${dataFormatada}</span>
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
        <div id="agendaDayView" class="card" style="display:${activeTab === 'today' ? 'block' : 'none'};">
            <div class="card-body no-padding">
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
            </div>
        </div>
        <div id="agendaWeekView" style="display:${activeTab === 'week' ? 'block' : 'none'};"></div>`;
}

function buildAgendaWeekElement() {
    if (!state || !state.appointments) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Erro ao carregar dados da semana.';
        return errorDiv;
    }

    const today = new Date();
    const currentWeekStart = state.currentWeekStart || getStartOfWeek(today);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
        const appts = state.appointments.filter(a => a.date === dateStr);
        const isToday = dateStr === today.toISOString().split('T')[0];
        days.push({ dateStr, dayName, dd, appts, isToday });
    }

    const fragment = document.createDocumentFragment();

    // Navegação da semana
    const weekNav = document.createElement('div');
    weekNav.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';
    weekNav.innerHTML = `
        <button class="btn-icon btn-sm" id="weekPrevBtn"><i data-lucide="chevron-left" style="width:16px;height:16px;"></i></button>
        <span style="font-weight:600;font-size:14px;">${formatWeekRange(days[0].dateStr, days[6].dateStr)}</span>
        <button class="btn-icon btn-sm" id="weekNextBtn"><i data-lucide="chevron-right" style="width:16px;height:16px;"></i></button>
    `;
    fragment.appendChild(weekNav);

    // Colunas dos dias
    const weekGrid = document.createElement('div');
    weekGrid.style.cssText = 'display:flex;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:8px;overflow:hidden;';
    days.forEach(day => {
        const dayCol = document.createElement('div');
        dayCol.style.cssText = `flex:1;background:${day.isToday ? 'var(--accent-light)' : 'var(--card-bg)'};padding:8px 4px;min-height:100px;`;
        const dayHeader = document.createElement('div');
        dayHeader.style.cssText = `text-align:center;font-size:12px;font-weight:${day.isToday ? '700' : '500'};color:var(--text);margin-bottom:8px;`;
        dayHeader.innerHTML = `${day.dayName}<br><span style="font-size:16px;">${day.dd}</span>`;
        dayCol.appendChild(dayHeader);

        if (day.appts.length > 0) {
            day.appts.forEach(appt => {
                const apptCard = document.createElement('div');
                apptCard.className = 'agenda-item';
                apptCard.setAttribute('data-id', appt.id);
                apptCard.style.cssText = `
                    font-size:10px;padding:2px 4px;margin-bottom:2px;
                    background:var(--hover-bg);border-radius:4px;cursor:pointer;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                    border-left:3px solid ${appt.status === 'Confirmado' ? '#10b981' : appt.status === 'Pendente' ? '#f59e0b' : '#6b7280'};
                `;
                apptCard.innerHTML = `<span style="font-weight:500;">${appt.time}</span> ${appt.patient}`;
                dayCol.appendChild(apptCard);
            });
        }

        weekGrid.appendChild(dayCol);
    });
    fragment.appendChild(weekGrid);

    // Handlers de navegação semanal
    setTimeout(() => {
        document.getElementById('weekPrevBtn')?.addEventListener('click', () => {
            if (!state.currentWeekStart) state.currentWeekStart = getStartOfWeek(today);
            state.currentWeekStart.setDate(state.currentWeekStart.getDate() - 7);
            const weekView = getEl('agendaWeekView');
            if (weekView) {
                weekView.innerHTML = '';
                weekView.appendChild(buildAgendaWeekElement());
            }
            if (window.lucide) lucide.createIcons();
        });
        document.getElementById('weekNextBtn')?.addEventListener('click', () => {
            if (!state.currentWeekStart) state.currentWeekStart = getStartOfWeek(today);
            state.currentWeekStart.setDate(state.currentWeekStart.getDate() + 7);
            const weekView = getEl('agendaWeekView');
            if (weekView) {
                weekView.innerHTML = '';
                weekView.appendChild(buildAgendaWeekElement());
            }
            if (window.lucide) lucide.createIcons();
        });
        if (window.lucide) lucide.createIcons();
    }, 0);

    return fragment;
}

// Funções auxiliares
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
}

function formatWeekRange(startStr, endStr) {
    const opts = { day: '2-digit', month: '2-digit' };
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    return start.toLocaleDateString('pt-BR', opts) + ' - ' + end.toLocaleDateString('pt-BR', opts);
}

function openEditAppointment(eventId) {
    const appt = state.appointments.find(a => a.id === eventId);
    if (!appt) return;
    openModal(appt.time, appt.patient, appt.phone);
    setTimeout(() => {
        const profEl = getEl('apptProfessional');
        const servEl = getEl('apptService');
        const notesEl = getEl('apptNotes');
        const dateEl = getEl('apptDate');
        if (profEl) profEl.value = appt.professional || 'Dra. Ana';
        if (servEl) servEl.value = appt.service || 'Avaliação';
        if (notesEl) notesEl.value = appt.notes || '';
        if (dateEl) dateEl.value = appt.date;
    }, 100);
    window._editingAppointmentId = eventId;
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
        days.push({ dateStr: '', dayNumber: '', isOtherMonth: true, appts: [] });
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

    // Legenda
    const legendDiv = document.createElement('div');
    legendDiv.className = 'agenda-month-legend';
    legendDiv.style.cssText = 'display:flex;gap:12px;margin-bottom:8px;font-size:11px;color:var(--text-secondary);align-items:center;';
    legendDiv.innerHTML = `
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:4px;"></span> Confirmado</span>
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:4px;"></span> Pendente</span>
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6b7280;margin-right:4px;"></span> Cancelado</span>
    `;
    fragment.appendChild(legendDiv);

    // Cabeçalho do mês
    const headerDiv = document.createElement('div');
    headerDiv.className = 'agenda-month-header';
    headerDiv.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:0 4px;';
    headerDiv.innerHTML = `
        <button class="btn-icon btn-sm" id="monthPrevBtn"><i data-lucide="chevron-left" style="width:18px;height:18px;"></i></button>
        <span style="font-weight:600;font-size:16px;color:var(--text);">${monthNames[month]} ${year}</span>
        <button class="btn-icon btn-sm" id="monthNextBtn"><i data-lucide="chevron-right" style="width:18px;height:18px;"></i></button>
    `;
    fragment.appendChild(headerDiv);

    // Grade do mês
    const grid = document.createElement('div');
    grid.className = 'agenda-month-grid';
    // Estilos responsivos serão aplicados via CSS interno (ou você pode mover para style.css)
    grid.style.cssText = `
        display:grid;grid-template-columns:repeat(7,1fr);gap:1px;
        background:var(--border);border:1px solid var(--border);border-radius:8px;overflow:hidden;
        font-size:12px;
    `;

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach(name => {
        const dayHeader = document.createElement('div');
        dayHeader.style.cssText = 'text-align:center;font-size:10px;font-weight:500;padding:6px 2px;color:var(--text-secondary);background:var(--card-bg);';
        dayHeader.textContent = name;
        grid.appendChild(dayHeader);
    });

    days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.style.cssText = `background:${day.isOtherMonth ? 'var(--hover-bg)' : 'var(--card-bg)'};min-height:70px;padding:3px;opacity:${day.isOtherMonth ? 0.4 : 1};`;

        if (!day.isOtherMonth && day.dateStr) {
            const dayNumber = document.createElement('div');
            dayNumber.textContent = day.dayNumber;
            dayNumber.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text);';
            dayDiv.appendChild(dayNumber);

            if (day.appts && day.appts.length > 0) {
                day.appts.forEach(appt => {
                    const apptCard = document.createElement('div');
                    apptCard.className = 'agenda-item';
                    apptCard.setAttribute('data-id', appt.id);
                    // Estilo do cartão: bolinha no canto superior direito
                    apptCard.style.cssText = `
                        position:relative;
                        display:flex;align-items:center;gap:3px;
                        font-size:10px;padding:2px 4px;margin-bottom:2px;
                        background:var(--hover-bg);border-radius:4px;cursor:pointer;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                    `;
                    // Bolinha de status
                    const statusColor = appt.status === 'Confirmado' ? '#10b981' : appt.status === 'Pendente' ? '#f59e0b' : '#6b7280';
                    apptCard.innerHTML = `
                        <span style="font-weight:500;">${appt.time}</span>
                        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;">${appt.patient}</span>
                        ${appt.phone ? `<i data-lucide="message-circle" style="width:10px;height:10px;color:#25D366;flex-shrink:0;" title="WhatsApp"></i>` : ''}
                        <span style="position:absolute;top:2px;right:2px;width:6px;height:6px;border-radius:50%;background:${statusColor};"></span>
                    `;
                    dayDiv.appendChild(apptCard);
                });
            }
        }

        grid.appendChild(dayDiv);
    });

    fragment.appendChild(grid);

    // Navegação do mês (mantém aba "week" ativa e NÃO recarrega a página inteira)
    setTimeout(() => {
        const prevBtn = document.getElementById('monthPrevBtn');
        const nextBtn = document.getElementById('monthNextBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!state.currentMonth) state.currentMonth = { year: today.getFullYear(), month: today.getMonth() };
                state.currentMonth.month--;
                if (state.currentMonth.month < 0) {
                    state.currentMonth.month = 11;
                    state.currentMonth.year--;
                }
                // Atualiza apenas a parte do mês
                const weekView = getEl('agendaWeekView');
                if (weekView) {
                    weekView.innerHTML = '';
                    weekView.appendChild(buildAgendaMonthElement());
                }
                if (window.lucide) lucide.createIcons();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!state.currentMonth) state.currentMonth = { year: today.getFullYear(), month: today.getMonth() };
                state.currentMonth.month++;
                if (state.currentMonth.month > 11) {
                    state.currentMonth.month = 0;
                    state.currentMonth.year++;
                }
                const weekView = getEl('agendaWeekView');
                if (weekView) {
                    weekView.innerHTML = '';
                    weekView.appendChild(buildAgendaMonthElement());
                }
                if (window.lucide) lucide.createIcons();
            });
        }
        if (window.lucide) lucide.createIcons();
    }, 0);

    return fragment;
}

function openEditAppointment(eventId) {
    const appt = state.appointments.find(a => a.id === eventId);
    if (!appt) return;
    openModal(appt.time, appt.patient, appt.phone);
    setTimeout(() => {
        const profEl = getEl('apptProfessional');
        const servEl = getEl('apptService');
        const notesEl = getEl('apptNotes');
        const dateEl = getEl('apptDate');
        if (profEl) profEl.value = appt.professional || 'Dra. Ana';
        if (servEl) servEl.value = appt.service || 'Avaliação';
        if (notesEl) notesEl.value = appt.notes || '';
        if (dateEl) dateEl.value = appt.date;
    }, 100);
    window._editingAppointmentId = eventId;
}
