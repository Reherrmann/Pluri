// js/agenda.js

// =====================================================
// STATUS DOS AGENDAMENTOS
// =====================================================

window.getStatusClass = function(status) {
    switch (String(status || '').trim()) {
        case 'Aguardando':
            return 'status-aguardando';

        case 'Confirmado':
            return 'status-confirmado';

        case 'Cancelado':
            return 'status-cancelado';

        default:
            return 'status-aguardando';
    }
};

window.statusColor = function(status) {
    switch (String(status || '').trim()) {
        case 'Aguardando':
            return '#ffc107';

        case 'Confirmado':
            return '#28a745';

        case 'Cancelado':
            return '#dc3545';

        default:
            return '#ffc107';
    }
};

window.statusDotCorner = function(status) {
    const color = window.statusColor(status);

    return `
        <span
            class="status-dot-corner"
            style="background:${color};">
        </span>
    `;
};

window.statusBadge = function(status) {
    const normalizedStatus =
        String(status || '').trim() || 'Aguardando';

    const cls = window.getStatusClass(normalizedStatus);

    return `
        <span class="appointment-status ${cls}">
            ${normalizedStatus}
        </span>
    `;
};


// =====================================================
// FUNÇÕES GLOBAIS
// =====================================================

function openDayFromMonth(dateStr) {

    state.agendaDate = dateStr;
    state.agendaTab = 'today';

    renderPage();
}

function openNewAppointmentForDate(dateStr) {

    openModal();

    const dateInput = getEl('apptDate');

    if (dateInput) {
        dateInput.value = dateStr;
    }
}

window.pluri = window.pluri || {};

window.pluri.openDayFromMonth = openDayFromMonth;


// =====================================================
// CONFIRMAR VIA WHATSAPP
// =====================================================

window.pluri.confirmAppointment = function(
    apptId,
    phone,
    patientName
) {

    // Funcionalidade mantida pausada por enquanto.
};


// =====================================================
// EDITAR AGENDAMENTO
// =====================================================

window.pluri.editAppointment = function(apptId) {

    openEditAppointment(apptId);
};


// =====================================================
// EXCLUIR AGENDAMENTO
// =====================================================

window.pluri.deleteAppointment = function(apptId) {

    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
        return;
    }

    if (
        window.pluriAPI &&
        window.pluriAPI.deleteAppointment
    ) {

        window.pluriAPI
            .deleteAppointment(apptId)
            .then(result => {

                if (result.success) {

                    state.appointments =
                        state.appointments.filter(
                            a =>
                                String(a.id) !==
                                String(apptId)
                        );

                    renderPage();

                    showToast('Agendamento excluído.');

                } else {

                    showToast('Erro ao excluir.');
                }

            })
            .catch(() => {

                showToast('Erro ao excluir.');

            });

    } else {

        showToast('API não disponível.');
    }
};


// =====================================================
// CONSTRUÇÃO DA AGENDA
// =====================================================

function buildAgenda() {

    if (!state || !state.appointments) {

        return `
            <div class="card">
                <div class="card-body">
                    Erro ao carregar agenda.
                </div>
            </div>
        `;
    }


    // -------------------------------------------------
    // ESTADO INICIAL
    // -------------------------------------------------

    if (!state.agendaDate) {

        state.agendaDate =
            new Date()
                .toISOString()
                .split('T')[0];
    }

    if (!state.agendaTab) {

        state.agendaTab = 'today';
    }

    if (!state.agendaMonth) {

        const now = new Date();

        state.agendaMonth = {
            year: now.getFullYear(),
            month: now.getMonth()
        };
    }


    const currentDate =
        state.agendaDate;

    const isToday =
        state.agendaTab === 'today';


    // -------------------------------------------------
    // HORÁRIOS
    // -------------------------------------------------

    const allSlots = [];

    for (let h = 8; h < 18; h++) {

        for (let m = 0; m < 60; m += 30) {

            allSlots.push(
                `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
            );
        }
    }


    // -------------------------------------------------
    // AGENDAMENTOS DO DIA
    // -------------------------------------------------

    const appointmentsToday =
        state.appointments.filter(
            a => a.date === currentDate
        );


    // -------------------------------------------------
    // AGRUPAR POR HORÁRIO
    // -------------------------------------------------

    const grouped = {};

    appointmentsToday.forEach(appt => {

        const time =
            String(appt.time || '').trim();

        if (!grouped[time]) {
            grouped[time] = [];
        }

        grouped[time].push(appt);
    });


    // -------------------------------------------------
    // DATA DO DIA
    // -------------------------------------------------

    const dataFormatada =
        new Date(
            currentDate + 'T00:00:00'
        ).toLocaleDateString(
            'pt-BR',
            {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit'
            }
        );


    // -------------------------------------------------
    // MÊS
    // -------------------------------------------------

    const monthDate =
        new Date(
            state.agendaMonth.year,
            state.agendaMonth.month,
            1
        );

    let monthLabel =
        monthDate.toLocaleDateString(
            'pt-BR',
            {
                month: 'long',
                year: 'numeric'
            }
        );

    monthLabel =
        monthLabel.charAt(0).toUpperCase() +
        monthLabel.slice(1);


    // =================================================
    // HTML
    // =================================================

    return `

        <!-- =========================================
             TOOLBAR
        ========================================== -->

        <div class="agenda-toolbar">

            <div class="agenda-toolbar-left">

                <div class="tabs" id="agendaTabs">

                    <button
                        class="tab ${isToday ? 'active' : ''}"
                        data-tab="today">

                        Hoje

                    </button>

                    <button
                        class="tab ${!isToday ? 'active' : ''}"
                        data-tab="month">

                        Mês

                    </button>

                </div>


                <!-- Navegação do dia -->

                <div
                    class="agenda-date-navigator"
                    id="agendaDayNav"
                    style="
                        display:${isToday ? 'flex' : 'none'};
                        align-items:center;
                        gap:8px;
                        margin-left:20px;
                    "
                >

                    <button
                        class="btn-icon btn-sm"
                        id="agendaPrevDay"
                        title="Dia anterior">

                        <i
                            data-lucide="chevron-left"
                            style="width:14px;height:14px;">
                        </i>

                    </button>


                    <span
                        style="
                            font-size:13px;
                            font-weight:500;
                            min-width:150px;
                            text-align:center;
                            display:inline-block;
                        "
                    >
                        ${dataFormatada}
                    </span>


                    <button
                        class="btn-icon btn-sm"
                        id="agendaNextDay"
                        title="Próximo dia">

                        <i
                            data-lucide="chevron-right"
                            style="width:14px;height:14px;">
                        </i>

                    </button>

                </div>


                <!-- Navegação do mês -->

                <div
                    class="agenda-date-navigator"
                    id="agendaMonthNav"
                    style="
                        display:${isToday ? 'none' : 'flex'};
                        align-items:center;
                        gap:8px;
                        margin-left:20px;
                    "
                >

                    <button
                        class="btn-icon btn-sm"
                        id="agendaPrevMonth"
                        title="Mês anterior">

                        <i
                            data-lucide="chevron-left"
                            style="width:14px;height:14px;">
                        </i>

                    </button>


                    <span
                        style="
                            font-size:13px;
                            font-weight:500;
                            min-width:150px;
                            text-align:center;
                            display:inline-block;
                        "
                    >
                        ${monthLabel}
                    </span>


                    <button
                        class="btn-icon btn-sm"
                        id="agendaNextMonth"
                        title="Próximo mês">

                        <i
                            data-lucide="chevron-right"
                            style="width:14px;height:14px;">
                        </i>

                    </button>

                </div>


                <!-- Google Calendar -->

                <div
                    class="agenda-google-calendar"
                    id="googleCalendarIndicator"
                >

                    <i
                        data-lucide="calendar-check"
                        style="width:14px;height:14px;">
                    </i>

                    <span>
                        Sincronizado com Google Calendar
                    </span>

                </div>

            </div>


            <div class="agenda-toolbar-right">

                <button
                    class="btn btn-primary"
                    id="openModalBtn">

                    <i
                        data-lucide="plus"
                        style="width:16px;height:16px;">
                    </i>

                    Novo agendamento

                </button>


                <button
                    class="btn btn-outline"
                    id="btnConnectCalendar"
                    style="display:none;">

                    🔗 Conectar Google Calendar

                </button>

            </div>

        </div>


        <!-- =========================================
             VISTA HOJE
        ========================================== -->

        <div
            id="agendaDayView"
            class="card"
            style="
                display:${isToday ? 'block' : 'none'};
            "
        >

            <div class="card-body no-padding">

                <ul class="agenda-list">

                    ${allSlots.map(time => {

                        const events =
                            grouped[time] || [];


                        // -----------------------------
                        // HORÁRIO LIVRE
                        // -----------------------------

                        if (events.length === 0) {

                            return `

                                <li class="agenda-item free-slot">

                                    <span class="agenda-time">
                                        ${time}
                                    </span>


                                    <div
                                        class="agenda-avatar"
                                        style="
                                            background:var(--hover-bg);
                                            color:var(--text-secondary);
                                        "
                                    >
                                        —
                                    </div>


                                    <div class="agenda-info">

                                        <div
                                            class="agenda-name"
                                            style="
                                                color:var(--text-secondary);
                                            "
                                        >
                                            Horário livre
                                        </div>

                                    </div>


                                    <button
                                        class="btn btn-sm btn-outline"
                                        onclick="openModal('${time}')"
                                    >
                                        Agendar
                                    </button>

                                </li>

                            `;
                        }


                        // -----------------------------
                        // AGENDAMENTOS
                        // -----------------------------

                        return events.map(
                            (appt, index) => {

                                const status =
                                    String(
                                        appt.status || ''
                                    ).trim() ||
                                    'Aguardando';


                                return `

                                    <li
                                        class="agenda-item"
                                        data-id="${appt.id}"
                                        style="
                                            cursor:pointer;
                                            position:relative;
                                            ${index > 0
                                                ? 'border-top:1px dashed var(--border);'
                                                : ''}
                                        "
                                    >

                                        <span class="agenda-time">
                                            ${time}
                                        </span>


                                        <div class="agenda-avatar">
                                            ${getInitials(appt.patient)}
                                        </div>


                                        <div
                                            class="agenda-info"
                                            onclick="
                                                window.pluri.editAppointment('${appt.id}')
                                            "
                                        >

                                            <div class="agenda-name">
                                                ${appt.patient}
                                            </div>


                                            <div class="agenda-detail">
                                                ${appt.service}
                                                ·
                                                ${appt.professional}
                                            </div>


                                            <!-- STATUS -->

                                            <div
                                                style="
                                                    margin-top:6px;
                                                "
                                            >
                                                ${window.statusBadge(status)}
                                            </div>

                                        </div>


                                        <!-- EDITAR -->

                                        <button
                                            class="btn-icon-sm"
                                            title="Editar"
                                            onclick="
                                                event.stopPropagation();
                                                window.pluri.editAppointment('${appt.id}')
                                            "
                                        >

                                            <i
                                                data-lucide="edit-2"
                                                style="width:14px;height:14px;">
                                            </i>

                                        </button>


                                        <!-- EXCLUIR -->

                                        <button
                                            class="btn-icon-sm"
                                            title="Excluir"
                                            onclick="
                                                event.stopPropagation();
                                                window.pluri.deleteAppointment('${appt.id}')
                                            "
                                        >

                                            <i
                                                data-lucide="trash-2"
                                                style="width:14px;height:14px;">
                                            </i>

                                        </button>

                                    </li>

                                `;

                            }
                        ).join('');

                    }).join('')}

                </ul>

            </div>

        </div>


        <!-- =========================================
             VISTA MÊS
        ========================================== -->

        <div
            id="agendaMonthView"
            style="
                display:${isToday ? 'none' : 'block'};
            "
        >

            ${buildAgendaMonthHTML()}

        </div>

    `;
}


// =====================================================
// CALENDÁRIO MENSAL
// =====================================================

function buildAgendaMonthHTML() {

    if (
        !state ||
        !state.appointments ||
        !state.agendaMonth
    ) {

        return `
            <div class="card">
                <div class="card-body">
                    Erro ao carregar o mês.
                </div>
            </div>
        `;
    }


    const {
        year,
        month
    } = state.agendaMonth;


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const startWeekday =
        firstDay.getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const todayStr =
        new Date()
            .toISOString()
            .split('T')[0];


    // -------------------------------------------------
    // CÉLULAS
    // -------------------------------------------------

    const cells = [];


    for (
        let i = 0;
        i < startWeekday;
        i++
    ) {

        cells.push(null);
    }


    for (
        let d = 1;
        d <= daysInMonth;
        d++
    ) {

        cells.push(d);
    }


    while (
        cells.length % 7 !== 0
    ) {

        cells.push(null);
    }


    // -------------------------------------------------
    // CABEÇALHO
    // -------------------------------------------------

    const weekdayHeaders =
        [
            'Dom',
            'Seg',
            'Ter',
            'Qua',
            'Qui',
            'Sex',
            'Sáb'
        ]
        .map(
            day => `
                <div class="agenda-month-weekday">
                    ${day}
                </div>
            `
        )
        .join('');


    const maxShow = 3;


    // -------------------------------------------------
    // DIAS
    // -------------------------------------------------

    const cellsHtml =
        cells
            .map(day => {

                if (day === null) {

                    return `
                        <div class="agenda-month-cell empty">
                        </div>
                    `;
                }


                const dateStr =
                    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;


                const dayAppts =
                    state.appointments
                        .filter(
                            a => a.date === dateStr
                        )
                        .sort(
                            (a, b) =>
                                String(a.time)
                                    .localeCompare(
                                        String(b.time)
                                    )
                        );


                const isCellToday =
                    dateStr === todayStr;


                const shown =
                    dayAppts.slice(
                        0,
                        maxShow
                    );


                const extra =
                    dayAppts.length -
                    shown.length;


                return `

                    <div
    class="
        agenda-month-cell
        ${isCellToday ? 'is-today' : ''}
    "
    data-date="${dateStr}"
    onclick="openNewAppointmentForDate('${dateStr}')"
    style="cursor:pointer;"
>

                        <div class="agenda-month-daynum">
                            ${day}
                        </div>


                        <div class="agenda-month-events">

                            ${shown.map(
                                appt => {

                                    const status =
                                        String(
                                            appt.status || ''
                                        ).trim() ||
                                        'Aguardando';


                                    return `

                                        <div
                                            class="agenda-month-event"
                                            title="${appt.patient} · ${status}"
                                            onclick="
    event.stopPropagation();
    window.pluri.editAppointment('${appt.id}')
"
                                        >

                                            <span
                                                class="agenda-month-dot"
                                                style="
                                                    background:${window.statusColor(status)};
                                                "
                                            >
                                            </span>


                                            <span
                                                class="agenda-month-event-time"
                                            >
                                                ${appt.time}
                                            </span>


                                            <span
                                                class="agenda-month-event-name"
                                            >
                                                ${appt.patient}
                                            </span>

                                        </div>

                                    `;
                                }
                            ).join('')}


                            ${
                                extra > 0
                                ? `
                                    <div
                                        class="agenda-month-more"
                                        onclick="
    event.stopPropagation();
    openDayFromMonth('${dateStr}')
"
                                    >
                                        +${extra} mais
                                    </div>
                                `
                                : ''
                            }

                        </div>

                    </div>

                `;

            })
            .join('');


    // -------------------------------------------------
    // RETORNO
    // -------------------------------------------------

    return `

        <div class="card">

            <div class="card-body no-padding">

                <div class="agenda-month-grid-header">

                    ${weekdayHeaders}

                </div>


                <div class="agenda-month-grid">

                    ${cellsHtml}

                </div>

            </div>

        </div>

    `;
}


// =====================================================
// EDITAR AGENDAMENTO
// =====================================================

function openEditAppointment(eventId) {

    const appt =
        state.appointments.find(
            a =>
                String(a.id) ===
                String(eventId)
        );


    if (!appt) {
        return;
    }


    openModal(
        appt.time,
        appt.patient,
        appt.phone
    );


    getEl('apptProfessional').value =
        appt.professional ||
        'Dra. Ana';


    getEl('apptService').value =
        appt.service ||
        'Avaliação';


    getEl('apptDate').value =
        appt.date;


    // -------------------------------------------------
    // OBSERVAÇÕES
    // -------------------------------------------------

    let notesValue =
        appt.notes || '';


    try {

        const parsed =
            JSON.parse(notesValue);


        if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.notes !== undefined
        ) {

            notesValue =
                parsed.notes || '';
        }

    } catch (e) {

        // Não é JSON.
        // Mantém o valor original.

    }


    getEl('apptNotes').value =
        notesValue;


    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    const statusInput =
        getEl('apptStatus');


    if (statusInput) {

        statusInput.value =
            appt.status ||
            'Aguardando';
    }


    // -------------------------------------------------
    // ID EM EDIÇÃO
    // -------------------------------------------------

    window._editingAppointmentId =
        eventId;


    if (
        typeof setModalMode === 'function'
    ) {

        setModalMode('edit');
    }
}


// =====================================================
// ÍCONES E TABS
// =====================================================

function refreshAgendaIcons() {

    if (window.lucide) {

        lucide.createIcons();
    }

    if (
        typeof initAgendaTabs === 'function'
    ) {

        initAgendaTabs();
    }
}
