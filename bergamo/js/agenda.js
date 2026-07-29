// js/agenda.js
function buildAgenda() {
    const todayStr = new Date().toISOString().split('T')[0];
    const allSlots = [];
    for (let h = 8; h < 18; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            allSlots.push(time);
        }
    }
    const appointmentsToday = state.appointments.filter(a => a.date === todayStr);

    return `
        <div class="agenda-toolbar">
            <div class="agenda-toolbar-left">
                <div class="tabs" id="agendaTabs">
                    <button class="tab active" data-tab="today">Hoje</button>
                    <button class="tab" data-tab="week">Semana</button>
                </div>
                <div class="agenda-google-calendar" id="googleCalendarIndicator">
                    <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                    <span>Google Calendar · Preparado para integração</span>
                </div>
            </div>
            <div class="agenda-toolbar-right">
                <button class="btn btn-primary" id="openModalBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo agendamento</button>
            </div>
        </div>
        <div id="agendaDayView" class="card"><div class="card-body no-padding">
            <ul class="agenda-list">${allSlots.map(time => {
                const appt = appointmentsToday.find(a => a.time === time);
                if (appt) {
                    return `
                        <li class="agenda-item">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar">${getInitials(appt.patient)}</div>
                            <div class="agenda-info"><div class="agenda-name">${appt.patient}</div><div class="agenda-detail">${appt.service} · ${appt.professional}</div></div>
                            ${statusBadge(appt.status)}
                        </li>`;
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

function buildAgendaWeekElement() {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayName = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
        const appts = state.appointments.filter(a => a.date === dateStr);
        days.push({ dateStr, dayName, dd, appts });
    }

    const fragment = document.createDocumentFragment();

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

    return fragment;
}
