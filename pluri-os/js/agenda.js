// js/agenda.js

// =====================================================
// FUNÇÕES AUXILIARES DE STATUS (cores corrigidas)
// =====================================================
function getStatusClass(status) {
    switch (status) {
        case 'Aguardando': return 'status-aguardando';
        case 'Confirmado': return 'status-confirmado';
        case 'Cancelado':  return 'status-cancelado';
        default:           return 'status-aguardando';
    }
}

function statusColor(status) {
    // Retorna cor sólida (usada nos dots da visão mensal)
    switch (status) {
        case 'Aguardando': return '#ffc107';
        case 'Confirmado': return '#28a745';
        case 'Cancelado':  return '#dc3545';
        default:           return '#ffc107';
    }
}

function statusDotCorner(status) {
    // Bolinha colorida no canto superior esquerdo dos itens da agenda
    const color = statusColor(status);
    return `<span class="status-dot-corner" style="background:${color};"></span>`;
}

function statusBadge(status) {
    // Pequena etiqueta com texto (usada ao lado do nome na lista do dia)
    const cls = getStatusClass(status);
    return `<span class="appointment-status ${cls}">${status || 'Aguardando'}</span>`;
}

// =====================================================
// FUNÇÕES DE INTERAÇÃO (WhatsApp, edição, exclusão)
// =====================================================
function confirmAppointment(apptId, phone, patientName) {
    // Abre WhatsApp com mensagem de confirmação
    phone = phone.replace(/\D/g, '');
    if (!phone) {
        showToast('Telefone não informado.');
        return;
    }
    const appt = state.appointments.find(a => String(a.id) === String(apptId));
    const date = appt ? appt.date : '';
    const time = appt ? appt.time : '';
    const msg = `Olá ${patientName}, sua consulta está agendada para ${date} às ${time}. Poderia confirmar sua presença?`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

function editAppointment(apptId) {
    // Redireciona para a função de edição do modal
    openEditAppointment(apptId);
}

function deleteAppointment(apptId) {
    // Confirmação e exclusão via API
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    // A função de exclusão deve estar definida em outro lugar (ex.: api.js)
    if (window.pluriAPI && window.pluriAPI.deleteAppointment) {
        window.pluriAPI.deleteAppointment(apptId).then(result => {
            if (result.success) {
                state.appointments = state.appointments.filter(a => String(a.id) !== String(apptId));
                renderPage();
                showToast('Agendamento excluído.');
            } else {
                showToast('Erro ao excluir.');
            }
        });
    } else {
        showToast('API não disponível.');
    }
}

// =====================================================
// RENDERIZAÇÃO DA AGENDA (visão dia e mês)
// =====================================================
function buildAgenda() {
    if (!state || !state.appointments) {
        return '<div class="card"><div class="card-body">Erro ao carregar agenda.</div></div>';
    }

    // Estado de navegação
    if (!state.agendaDate) state.agendaDate = new Date().toISOString().split('T')[0];
    if (!state.agendaTab) state.agendaTab = 'today';
    if (!state.agendaMonth) {
        const now = new Date();
        state.agendaMonth = { year: now.getFullYear(), month: now.getMonth() };
    }

    const currentDate = state.agendaDate;
    const isToday = state.agendaTab === 'today';

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

    const dataFormatada = new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: '2-digit'
    });

    const monthDate = new Date(state.agendaMonth.year, state.agendaMonth.month, 1);
    let monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    return `
        <div class="agenda-toolbar">
            <div class="agenda-toolbar-left">
                <div class="tabs" id="agendaTabs">
                    <button class="tab ${isToday ? 'active' : ''}" data-tab="today">Hoje</button>
                    <button class="tab ${!isToday ? 'active' : ''}" data-tab="month">Mês</button>
                </div>
                <div class="agenda-date-navigator" id="agendaDayNav" style="display:${isToday ? 'flex' : 'none'};">
                    <button class="btn-icon btn-sm" id="agendaPrevDay"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>
                    <span style="font-size:13px;font-weight:500;min-width:150px;text-align:center;">${dataFormatada}</span>
                    <button class="btn-icon btn-sm" id="agendaNextDay"><i data-lucide="chevron-right" style="width:14px;height:14px;"></i></button>
                </div>
                <div class="agenda-date-navigator" id="agendaMonthNav" style="display:${isToday ? 'none' : 'flex'};">
                    <button class="btn-icon btn-sm" id="agendaPrevMonth"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>
                    <span style="font-size:13px;font-weight:500;min-width:150px;text-align:center;">${monthLabel}</span>
                    <button class="btn-icon btn-sm" id="agendaNextMonth"><i data-lucide="chevron-right" style="width:14px;height:14px;"></i></button>
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
        <div id="agendaDayView" class="card" style="display:${isToday ? 'block' : 'none'};"><div class="card-body no-padding">
            <ul class="agenda-list">${allSlots.map(time => {
                const events = grouped[time] || [];
                if (events.length === 0) {
                    return `
                        <li class="agenda-item free-slot">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar" style="background:var(--hover-bg);color:var(--text-secondary);">—</div>
                            <div class="agenda-info"><div class="agenda-name" style="color:var(--text-secondary);">Horário livre</div></div>
                            <button class="btn btn-sm btn-outline" onclick="openModal('${time}')">Agendar</button>
                        </li>`;
                } else {
                    return events.map((appt, index) => `
                        <li class="agenda-item" data-id="${appt.id}" style="cursor:pointer;position:relative; ${index > 0 ? 'border-top:1px dashed var(--border);' : ''}">
                            ${statusDotCorner(appt.status)}
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar">${getInitials(appt.patient)}</div>
                            <div class="agenda-info" onclick="editAppointment('${appt.id}')">
                                <div class="agenda-name">${appt.patient}</div>
                                <div class="agenda-detail">${appt.service} · ${appt.professional}</div>
                            </div>
                            ${statusBadge(appt.status)}
                            <button class="btn-icon-sm" title="Confirmar via WhatsApp" onclick="event.stopPropagation(); confirmAppointment('${appt.id}', '${appt.phone}', '${appt.patient}')">
                                <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="btn-icon-sm" title="Editar" onclick="event.stopPropagation(); editAppointment('${appt.id}')">
                                <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="btn-icon-sm" title="Excluir" onclick="event.stopPropagation(); deleteAppointment('${appt.id}')">
                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            </button>
                        </li>`).join('');
                }
            }).join('')}</ul>
        </div></div>
        <div id="agendaMonthView" style="display:${isToday ? 'none' : 'block'};">${buildAgendaMonthHTML()}</div>`;
}

// =====================================================
// VISÃO MENSAL
// =====================================================
function buildAgendaMonthHTML() {
    if (!state || !state.appointments || !state.agendaMonth) {
        return '<div class="card"><div class="card-body">Erro ao carregar o mês.</div></div>';
    }

    const { year, month } = state.agendaMonth;
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay(); // 0 = Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weekdayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        .map(d => `<div class="agenda-month-weekday">${d}</div>`).join('');

    const maxShow = 3;
    const cellsHtml = cells.map(day => {
        if (day === null) return `<div class="agenda-month-cell empty"></div>`;

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayAppts = state.appointments
            .filter(a => a.date === dateStr)
            .sort((a, b) => String(a.time).localeCompare(String(b.time)));
        const isCellToday = dateStr === todayStr;
        const shown = dayAppts.slice(0, maxShow);
        const extra = dayAppts.length - shown.length;

        return `
            <div class="agenda-month-cell ${isCellToday ? 'is-today' : ''}" data-date="${dateStr}">
                <div class="agenda-month-daynum">${day}</div>
                <div class="agenda-month-events">
                    ${shown.map(a => `
                        <div class="agenda-month-event" title="${a.patient} · ${a.status}" onclick="editAppointment('${a.id}')">
                            <span class="agenda-month-dot" style="background:${statusColor(a.status)};"></span>
                            <span class="agenda-month-event-time">${a.time}</span>
                            <span class="agenda-month-event-name">${a.patient}</span>
                        </div>`).join('')}
                    ${extra > 0 ? `<div class="agenda-month-more" onclick="openDayFromMonth('${dateStr}')">+${extra} mais</div>` : ''}
                </div>
            </div>`;
    }).join('');

    return `
        <div class="card"><div class="card-body no-padding">
            <div class="agenda-month-grid-header">${weekdayHeaders}</div>
            <div class="agenda-month-grid">${cellsHtml}</div>
        </div></div>`;
}

// =====================================================
// EDIÇÃO DE AGENDAMENTO (abre modal preenchido)
// =====================================================
function openEditAppointment(eventId) {
    const appt = state.appointments.find(a => String(a.id) === String(eventId));
    if (!appt) return;
    openModal(appt.time, appt.patient, appt.phone);
    // Preenche os campos adicionais
    getEl('apptProfessional').value = appt.professional || 'Dra. Ana';
    getEl('apptService').value = appt.service || 'Avaliação';
    getEl('apptNotes').value = appt.notes || '';
    getEl('apptDate').value = appt.date;
    const statusInput = getEl('apptStatus');
    if (statusInput) statusInput.value = appt.status || 'Aguardando';
    // Guarda referência e muda o modal para modo edição
    window._editingAppointmentId = eventId;
    if (typeof setModalMode === 'function') setModalMode('edit');
}

// Abre a visão "Hoje" num dia específico (usado pelo "+N mais")
function openDayFromMonth(dateStr) {
    state.agendaDate = dateStr;
    state.agendaTab = 'today';
    renderPage();
}

// Atualiza os ícones Lucide (chamado após renderização)
function refreshAgendaIcons() {
    if (window.lucide) lucide.createIcons();
}
