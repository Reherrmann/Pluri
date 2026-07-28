(function () {
    // ===== STATE =====
    const state = {
        currentPage: 'dashboard',
        appointments: [],
        patients: [],
        conversations: [],
        activities: [],
        staff: [
            { id: 1, name: 'Recepção', role: 'Atendimento', status: 'Ativo', email: 'recepcao@bemestar.com', phone: '(11) 3000-1234' },
            { id: 2, name: 'Dra. Ana', role: 'Dentista', status: 'Ativo', email: 'ana@bemestar.com', phone: '(11) 98765-1111' },
            { id: 3, name: 'Dr. Carlos', role: 'Dentista', status: 'Ativo', email: 'carlos@bemestar.com', phone: '(11) 98765-2222' },
            { id: 4, name: 'Dra. Fernanda', role: 'Ortodontista', status: 'Ativo', email: 'fernanda@bemestar.com', phone: '(11) 98765-3333' },
        ],
    };

    // ===== UTILS =====
    const getEl = (id) => document.getElementById(id);
    const getInitials = (name) => {
        const parts = String(name || '').split(' ');
        return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    };

    function showToast(msg) {
        const container = getEl('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function refreshIcons() {
        if (window.lucide && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }
    }

    // ===== MOCK DATA =====
    function initMockData() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        state.patients = [
            { id: 1, name: 'Maria Silva', phone: '(11) 98765-4321', email: 'maria@email.com', created: '10/01/2026', lastVisit: '22/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Prefere contato pelo WhatsApp.' },
            { id: 2, name: 'João Santos', phone: '(11) 91234-5678', email: 'joao@email.com', created: '15/02/2026', lastVisit: '20/07/2026', nextAppt: '29/07/2026', status: 'Ativo', notes: '' },
            { id: 3, name: 'Ana Oliveira', phone: '(21) 99876-5432', email: 'ana@email.com', created: '05/03/2026', lastVisit: '18/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Prefere atendimento no período da manhã.' },
            { id: 4, name: 'Carlos Souza', phone: '(31) 98765-1234', email: 'carlos@email.com', created: '20/04/2026', lastVisit: '25/07/2026', nextAppt: '30/07/2026', status: 'Ativo', notes: '' },
            { id: 5, name: 'Fernanda Lima', phone: '(41) 99876-1111', email: 'fernanda@email.com', created: '12/05/2026', lastVisit: '15/07/2026', nextAppt: '28/07/2026', status: 'Inativo', notes: 'Retorno pendente.' },
            { id: 6, name: 'Mariana Costa', phone: '(51) 91234-9999', email: 'mariana@email.com', created: '01/06/2026', lastVisit: '-', nextAppt: '28/07/2026', status: 'Novo', notes: '' },
            { id: 7, name: 'Lucas Ferreira', phone: '(61) 98765-0000', email: 'lucas@email.com', created: '18/06/2026', lastVisit: '-', nextAppt: '28/07/2026', status: 'Novo', notes: '' },
            { id: 8, name: 'Camila Santos', phone: '(71) 91234-8888', email: 'camila@email.com', created: '25/06/2026', lastVisit: '10/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: '' },
            { id: 9, name: 'Beatriz Lima', phone: '(81) 99876-7777', email: 'beatriz@email.com', created: '02/07/2026', lastVisit: '-', nextAppt: '28/07/2026', status: 'Novo', notes: '' },
            { id: 10, name: 'Rafael Alves', phone: '(91) 98765-6666', email: 'rafael@email.com', created: '10/07/2026', lastVisit: '-', nextAppt: '29/07/2026', status: 'Novo', notes: '' },
        ];

        state.appointments = [
            { id: 1, time: '09:00', patient: 'Mariana Costa', professional: 'Dra. Ana', service: 'Avaliação', status: 'Confirmado', date: todayStr },
            { id: 2, time: '10:30', patient: 'João Almeida', professional: 'Dr. Carlos', service: 'Retorno', status: 'Confirmado', date: todayStr },
            { id: 3, time: '11:30', patient: 'Ana Martins', professional: 'Dra. Fernanda', service: 'Avaliação', status: 'Pendente', date: todayStr },
            { id: 4, time: '14:00', patient: 'Lucas Ferreira', professional: 'Dra. Ana', service: 'Procedimento', status: 'Confirmado', date: todayStr },
            { id: 5, time: '15:30', patient: 'Camila Santos', professional: 'Dr. Carlos', service: 'Retorno', status: 'Pendente', date: todayStr },
            { id: 6, time: '17:00', patient: 'Beatriz Lima', professional: 'Dra. Fernanda', service: 'Avaliação', status: 'Confirmado', date: todayStr },
            { id: 7, time: '08:30', patient: 'Pedro Rocha', professional: 'Dra. Ana', service: 'Retorno', status: 'Concluído', date: todayStr },
        ];

        state.conversations = [
            { id: 1, patient: 'Maria Silva', channel: 'WhatsApp', lastMsg: 'Gostaria de remarcar minha consulta.', time: '10:15', status: 'Aguardando', responsible: '-', phone: '(11) 98765-4321' },
            { id: 2, patient: 'Fernanda Lima', channel: 'WhatsApp', lastMsg: 'Qual o horário disponível para amanhã?', time: '09:42', status: 'Aguardando', responsible: '-', phone: '(41) 99876-1111' },
            { id: 3, patient: 'Carlos Souza', channel: 'E-mail', lastMsg: 'Preciso de um atestado.', time: '08:30', status: 'Em andamento', responsible: 'Recepção', phone: '(31) 98765-1234' },
            { id: 4, patient: 'Novo contato', channel: 'WhatsApp', lastMsg: 'Olá, gostaria de agendar uma avaliação.', time: '11:02', status: 'Aguardando', responsible: '-', phone: '' },
            { id: 5, patient: 'Rafael Alves', channel: 'Telefone', lastMsg: 'Confirmar horário de amanhã.', time: '07:50', status: 'Resolvido', responsible: 'Recepção', phone: '(91) 98765-6666' },
        ];

        state.activities = [
            { time: '10:42', text: 'Maria confirmou consulta.' },
            { time: '10:38', text: 'Novo paciente cadastrado.' },
            { time: '10:31', text: 'PLURI respondeu solicitação de horário.' },
            { time: '10:24', text: 'Consulta de João reagendada.' },
            { time: '10:17', text: 'Lembrete enviado para Ana.' },
        ];
    }

    // ===== THEME =====
    function toggleTheme() {
        document.body.classList.toggle('dark');
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            const isDark = document.body.classList.contains('dark');
            icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
            refreshIcons();
        }
        localStorage.setItem('pluri-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    }

    function loadTheme() {
        const saved = localStorage.getItem('pluri-theme');
        if (saved === 'dark') {
            document.body.classList.add('dark');
            const icon = document.querySelector('#themeToggle i');
            if (icon) icon.setAttribute('data-lucide', 'moon');
        }
    }

    // ===== GOOGLE CALENDAR STUB =====
    function syncAppointmentWithGoogleCalendar(appointment) {
        // Integração real será adicionada quando houver backend/API.
        console.log('Google Calendar sync stub:', appointment);
    }

    // ===== MODAL CONTROLS =====
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

        syncAppointmentWithGoogleCalendar(newAppt);
        closeModal();
        showToast('Agendamento criado com sucesso.');
        renderPage();
    }

    // ===== SLIDE PANEL =====
    function openSlidePanel() {
        getEl('slidePanel')?.classList.add('show');
        getEl('slideOverlay')?.classList.add('show');
    }

    function closeSlidePanel() {
        getEl('slidePanel')?.classList.remove('show');
        getEl('slideOverlay')?.classList.remove('show');
    }

    // ===== NAVIGATION =====
    function navigateTo(page) {
        state.currentPage = page;
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
        if (link) link.classList.add('active');
        renderPage();
        if (window.innerWidth <= 767) closeSidebar();
    }

    // ===== RENDER ENGINE =====
    function renderPage() {
        const container = getEl('pageContainer');
        if (!container) return;
        const title = getEl('pageTitle');
        const subtitle = getEl('pageSubtitle');

        let html = '';
        try {
            switch (state.currentPage) {
                case 'dashboard': html = buildDashboard(); break;
                case 'agenda': html = buildAgenda(); break;
                case 'atendimentos': html = buildAtendimentos(); break;
                case 'pacientes': html = buildPacientes(); break;
                case 'automacoes': html = buildAutomacoes(); break;
                case 'indicadores': html = buildIndicadores(); break;
                case 'configuracoes': html = buildConfiguracoes(); break;
                default: html = buildDashboard();
            }
        } catch (e) {
            console.error('Erro ao renderizar página:', e);
            html = `<div style="padding:40px;text-align:center;color:#B91C1C;">Erro ao carregar a página.<br><small>${e.message}</small></div>`;
        }

        container.innerHTML = html;
        attachPageEvents();
        refreshIcons();
        updateTitleAndSubtitle(title, subtitle);
    }

    function updateTitleAndSubtitle(title, subtitle) {
        const titles = {
            dashboard: ['Bom dia, Recepção.', 'Veja o que está acontecendo na clínica hoje.'],
            agenda: ['Agenda', 'Gerencie os horários da clínica.'],
            atendimentos: ['Atendimentos', 'Central de conversas com pacientes.'],
            pacientes: ['Pacientes', 'Base de pacientes da clínica.'],
            automacoes: ['Automações', 'Camada operacional inteligente.'],
            indicadores: ['Indicadores', 'Visão operacional da clínica.'],
            configuracoes: ['Configurações', 'Gerencie sua clínica.'],
        };
        const [t, s] = titles[state.currentPage] || titles.dashboard;
        if (title) title.textContent = t;
        if (subtitle) subtitle.textContent = s;
    }

    function attachPageEvents() {
        getEl('openModalBtn')?.addEventListener('click', () => openModal());

        getEl('googleCalendarBtn')?.addEventListener('click', () => {
            showToast('Google Calendar pronto para integração.');
        });

        // Tabs da agenda
        document.querySelectorAll('#agendaTabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#agendaTabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                const dayView = getEl('agendaDayView');
                const weekView = getEl('agendaWeekView');
                if (tabName === 'today') {
                    if (dayView) dayView.style.display = 'block';
                    if (weekView) weekView.style.display = 'none';
                } else {
                    if (dayView) dayView.style.display = 'none';
                    if (weekView) {
                        weekView.style.display = 'flex';
                        weekView.style.gap = '14px';
                        weekView.innerHTML = buildAgendaWeek();
                    }
                }
                refreshIcons();
            });
        });

        // KPIs clicáveis
        document.querySelectorAll('.kpi-card[data-link]').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.link;
                if (page) navigateTo(page);
            });
        });

        // Links de navegação
        document.querySelectorAll('.js-nav').forEach(el => {
            const page = el.dataset.page;
            if (page) el.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(page);
            });
        });

        // Conversas
        document.querySelectorAll('[data-conversation-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.conversationId, 10);
                if (!isNaN(id)) openConversation(id);
            });
        });

        // Pacientes
        document.querySelectorAll('[data-patient-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.patientId, 10);
                if (!isNaN(id)) openPatient(id);
            });
        });

        // Staff
        document.querySelectorAll('[data-staff-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.staffId, 10);
                if (!isNaN(id)) openStaff(id);
            });
        });

        // Busca de pacientes
        const searchInput = getEl('patientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                document.querySelectorAll('#patientTableBody tr').forEach(row => {
                    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        }
    }

    // ===== BUILDERS =====
    function renderBarChart(values, labels, highlightIdx = -1) {
        const max = Math.max(...values, 1);
        return values.map((v, i) => {
            const pct = (v / max) * 100;
            return `<div class="bar-col">
                <span class="bar-value">${v}</span>
                <div class="bar-fill${i === highlightIdx ? ' today' : ''}" style="height:${pct}%"></div>
                <span class="bar-label">${labels[i] || ''}</span>
            </div>`;
        }).join('');
    }

    function statusBadge(status) {
        let cls = '';
        if (status === 'Confirmado' || status === 'Concluído' || status === 'Ativo' || status === 'Resolvido') cls = 'confirmed';
        else if (status === 'Pendente' || status === 'Aguardando' || status === 'Novo') cls = 'pending';
        else cls = 'cancelled';
        const dotColor = cls === 'confirmed' ? 'green' : 'amber';
        return `<span class="status-badge ${cls}"><span class="status-dot ${dotColor}"></span>${status}</span>`;
    }

    function buildDashboard() {
        const confirmed = state.appointments.filter(a => a.status === 'Confirmado').length;
        const pending = state.appointments.filter(a => a.status === 'Pendente').length;
        const totalToday = state.appointments.length;
        const occupation = 92;

        return `
            <div class="kpi-row">
                <div class="kpi-card" data-link="atendimentos">
                    <div class="kpi-value">7</div>
                    <div class="kpi-label">Atendimentos hoje</div>
                    <div class="kpi-sub">5 confirmados</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">18</div>
                    <div class="kpi-label">Atendimentos automatizados</div>
                    <div class="kpi-sub">Hoje</div>
                </div>
                <div class="kpi-card" data-link="agenda">
                    <div class="kpi-value">2</div>
                    <div class="kpi-label">Confirmações pendentes</div>
                    <div class="kpi-sub amber">Precisam de atenção</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${occupation}%</div>
                    <div class="kpi-label">Taxa de ocupação</div>
                    <div class="kpi-sub">+8% esta semana</div>
                </div>
            </div>
            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3>Agenda de hoje</h3><a class="btn btn-sm btn-outline js-nav" data-page="agenda">Ver agenda →</a></div>
                    <div class="card-body no-padding">
                        <ul class="agenda-list">${state.appointments.slice(0,6).map(a => `
                            <li class="agenda-item">
                                <span class="agenda-time">${a.time}</span>
                                <div class="agenda-avatar">${getInitials(a.patient)}</div>
                                <div class="agenda-info"><div class="agenda-name">${a.patient}</div><div class="agenda-detail">${a.service} · ${a.professional}</div></div>
                                ${statusBadge(a.status)}
                            </li>`).join('')}</ul>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>Precisa da sua atenção</h3></div>
                    <div class="card-body">
                        <div style="display:flex;flex-direction:column;gap:14px;">
                            <div style="padding:12px 14px;background:var(--hover-bg);border-radius:8px;">
                                <strong style="font-size:13px;">${pending} confirmações pendentes</strong>
                                <p style="font-size:12px;color:var(--text-secondary);">Pacientes ainda não confirmaram.</p>
                                <a class="btn btn-sm btn-outline js-nav" data-page="agenda">Ver agenda</a>
                            </div>
                            <div style="padding:12px 14px;background:var(--hover-bg);border-radius:8px;">
                                <strong style="font-size:13px;">2 conversas precisam da equipe</strong>
                                <p style="font-size:12px;color:var(--text-secondary);">Solicitações aguardando atendimento.</p>
                                <a class="btn btn-sm btn-outline js-nav" data-page="atendimentos">Ver conversas</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid-3">
                <div class="card"><div class="card-header"><h3>Atendimentos da semana</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([18,22,26,21,28,12],['Seg','Ter','Qua','Qui','Sex','Sáb'],2)}</div></div></div>
                <div class="card"><div class="card-header"><h3>Atividade recente</h3></div><div class="card-body"><div class="timeline">${state.activities.map(a => `<div class="timeline-item"><span class="timeline-time">${a.time}</span><div class="timeline-dot"></div><span class="timeline-text">${a.text}</span></div>`).join('')}</div></div></div>
                <div class="card"><div class="card-header"><h3>Automações ativas</h3></div><div class="card-body">
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${[
                            {name:'Confirmação de consultas',status:'Ativo',sent:'128 enviadas'},
                            {name:'Lembrete 24h antes',status:'Ativo',sent:'256 enviados'},
                            {name:'Atendimento inicial',status:'Ativo',sent:'342 realizados'},
                            {name:'Recuperação de faltas',status:'Pausado',sent:'89 acompanhamentos'}
                        ].map(a => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-light);"><span style="font-size:13px;">${a.name} <small style="color:var(--text-secondary);">${a.sent}</small></span>${statusBadge(a.status)}</div>`).join('')}
                        <a class="btn btn-sm btn-outline js-nav" data-page="automacoes" style="margin-top:8px;width:100%;">Gerenciar</a>
                    </div>
                </div></div>
            </div>`;
    }

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
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div class="tabs" id="agendaTabs">
                    <button class="tab active" data-tab="today">Hoje</button>
                    <button class="tab" data-tab="week">Semana</button>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--green);">
                        <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                        <span>Google Calendar · Preparado para integração</span>
                    </div>
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

    function buildAgendaWeek() {
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
        return days.map(d => `
            <div class="card" style="flex:1;min-width:140px;">
                <div class="card-header"><h3>${d.dayName} ${d.dd}</h3></div>
                <div class="card-body no-padding">
                    ${d.appts.length === 0 ? '<p style="padding:12px;color:var(--text-secondary);font-size:13px;">Nenhum agendamento</p>' :
                    d.appts.map(a => `
                        <div class="agenda-item" style="padding:10px 12px;">
                            <span class="agenda-time">${a.time}</span>
                            <div class="agenda-info"><div class="agenda-name">${a.patient}</div></div>
                            ${statusBadge(a.status)}
                        </div>`).join('')}
                </div>
            </div>`).join('');
    }

    function buildAtendimentos() {
        return `
            <div class="card"><div class="card-body no-padding">
                ${state.conversations.map(c => `
                <div class="agenda-item" style="cursor:pointer;" data-conversation-id="${c.id}">
                    <div class="agenda-avatar">${getInitials(c.patient)}</div>
                    <div class="agenda-info">
                        <div class="agenda-name">${c.patient} <span style="font-weight:400;font-size:11px;color:var(--text-secondary);"><i data-lucide="message-circle" style="width:12px;height:12px;vertical-align:middle;"></i> ${c.channel}</span></div>
                        <div class="agenda-detail">${c.lastMsg}</div>
                    </div>
                    ${statusBadge(c.status)}
                </div>`).join('')}
            </div></div>`;
    }

    function openConversation(id) {
        const conv = state.conversations.find(c => c.id === id);
        if (!conv) return;
        const content = getEl('slideContent');
        if (!content) return;
        content.innerHTML = `
            <h3 style="margin-bottom:12px;">${conv.patient}</h3>
            <p style="font-size:13px;color:var(--text-secondary);">Canal: ${conv.channel}</p>
            <p style="font-size:13px;color:var(--text-secondary);">Última mensagem: ${conv.lastMsg}</p>
            <p style="font-size:13px;color:var(--text-secondary);">Horário: ${conv.time}</p>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-sm btn-outline js-nav" data-page="pacientes">Ver paciente</button>
                <button class="btn btn-sm btn-outline" id="scheduleFromConversation">Agendar</button>
                <button class="btn btn-sm btn-primary" id="resolveConversationBtn">Marcar como resolvido</button>
            </div>`;
        getEl('resolveConversationBtn')?.addEventListener('click', () => {
            conv.status = 'Resolvido';
            closeSlidePanel();
            showToast('Atendimento marcado como resolvido.');
            renderPage();
        });
        getEl('scheduleFromConversation')?.addEventListener('click', () => {
            closeSlidePanel();
            navigateTo('agenda');
            // Pequeno delay para garantir que a página da agenda seja renderizada antes de abrir o modal
            setTimeout(() => {
                openModal(null, conv.patient, conv.phone || '');
            }, 100);
        });
        openSlidePanel();
    }

    function buildPacientes() {
        return `
            <div class="search-bar"><input type="text" id="patientSearch" placeholder="Buscar por nome ou telefone..."></div>
            <div class="card"><div class="card-body no-padding" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Paciente</th><th>Telefone</th><th>Último atendimento</th><th>Próxima consulta</th><th>Status</th></tr></thead>
                    <tbody id="patientTableBody">${state.patients.map(p => `
                        <tr style="cursor:pointer;" data-patient-id="${p.id}">
                            <td style="font-weight:500;">${p.name}</td><td>${p.phone}</td><td>${p.lastVisit}</td><td>${p.nextAppt}</td>
                            <td>${statusBadge(p.status)}</td>
                        </tr>`).join('')}</tbody>
                </table>
            </div></div>`;
    }

    function openPatient(id) {
        const p = state.patients.find(pt => pt.id === id);
        if (!p) return;
        const content = getEl('slideContent');
        if (!content) return;
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">Editar paciente</h3>
            <div class="form-group"><label>Nome</label><input type="text" id="editPatientName" value="${p.name}"></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="editPatientPhone" value="${p.phone}"></div>
            <div class="form-group"><label>E-mail</label><input type="email" id="editPatientEmail" value="${p.email || ''}"></div>
            <div class="form-group"><label>Observações</label><textarea id="editPatientNotes" rows="3">${p.notes || ''}</textarea></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelPatientEdit">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="savePatientEdit">Salvar alterações</button>
            </div>
            <p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">As alterações serão sincronizadas com o Google Sheets (sistema-pluri).</p>`;
        getEl('cancelPatientEdit')?.addEventListener('click', closeSlidePanel);
        getEl('savePatientEdit')?.addEventListener('click', () => {
            const name = getEl('editPatientName')?.value?.trim() || p.name;
            const phone = getEl('editPatientPhone')?.value?.trim() || p.phone;
            const email = getEl('editPatientEmail')?.value?.trim() || p.email;
            const notes = getEl('editPatientNotes')?.value?.trim() || '';
            p.name = name;
            p.phone = phone;
            p.email = email;
            p.notes = notes;
            closeSlidePanel();
            showToast('Paciente atualizado com sucesso!');
            renderPage();
        });
        openSlidePanel();
    }

    function buildAutomacoes() {
        const autos = [
            {name:'Atendimento inicial',desc:'Responde automaticamente novos contatos.',status:'Ativo',last:'Hoje, 10:31',result:'342 atendimentos realizados'},
            {name:'Confirmação de consulta',desc:'Solicita confirmação 48h antes.',status:'Ativo',last:'Hoje, 09:15',result:'128 confirmações enviadas'},
            {name:'Lembrete de consulta',desc:'Envia lembrete 24h antes.',status:'Ativo',last:'Ontem, 18:00',result:'256 lembretes enviados'},
            {name:'Follow-up',desc:'Acompanha pacientes após atendimento.',status:'Pausado',last:'15/07/2026',result:'89 acompanhamentos realizados'}
        ];
        return `<div class="automation-grid">${autos.map(a => `
            <div class="automation-card">
                <h4>${a.name}</h4><p>${a.desc}</p>
                <div class="automation-meta">
                    ${statusBadge(a.status)}
                    <span>${a.result} · Última: ${a.last}</span>
                </div>
            </div>`).join('')}</div>`;
    }

    function buildIndicadores() {
        return `
            <div class="grid-2">
                <div class="card"><div class="card-header"><h3>Agendamentos por dia (semana)</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([18,22,26,21,28,12],['Seg','Ter','Qua','Qui','Sex','Sáb'],2)}</div></div></div>
                <div class="card"><div class="card-header"><h3>Confirmados x Cancelados</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([45,8],['Confirmados','Cancelados'],0)}</div></div></div>
            </div>
            <div class="grid-2">
                <div class="kpi-card"><div class="kpi-value">156</div><div class="kpi-label">Agendamentos no mês</div></div>
                <div class="kpi-card"><div class="kpi-value">89%</div><div class="kpi-label">Taxa de confirmação</div></div>
            </div>`;
    }

    function buildConfiguracoes() {
        return `
            <div class="card"><div class="card-header"><h3>Clínica</h3></div><div class="card-body">
                <div class="form-row"><div class="form-group"><label>Nome</label><input value="Clínica Bem-Estar"></div><div class="form-group"><label>Telefone</label><input value="(11) 3000-1234"></div></div>
                <div class="form-row"><div class="form-group"><label>E-mail</label><input value="contato@bemestar.com"></div><div class="form-group"><label>Horário</label><input value="08:00 - 18:00"></div></div>
                <div class="form-group"><label>Endereço</label><input value="Rua Saúde, 100 - São Paulo/SP"></div>
            </div></div>
            <div class="card"><div class="card-header"><h3>Equipe</h3></div><div class="card-body no-padding">
                <table class="data-table">
                    <thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                    <tbody>${state.staff.map(s => `
                        <tr style="cursor:pointer;" data-staff-id="${s.id}">
                            <td style="font-weight:500;">${s.name}</td><td>${s.role}</td>
                            <td>${statusBadge(s.status)}</td>
                        </tr>`).join('')}</tbody>
                </table>
            </div></div>
            <div class="card"><div class="card-header"><h3>Integrações</h3></div><div class="card-body">
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${[
                        {name:'WhatsApp',status:'Conectado'},
                        {name:'Google Calendar',status:'Preparado para integração'},
                        {name:'E-mail',status:'Não conectado'}
                    ].map(i => `<div style="display:flex;justify-content:space-between;align-items:center;"><span>${i.name}</span>${statusBadge(i.status)}</div>`).join('')}
                </div>
            </div></div>`;
    }

    function openStaff(id) {
        const member = state.staff.find(s => s.id === id);
        if (!member) return;
        const content = getEl('slideContent');
        if (!content) return;
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">Editar membro da equipe</h3>
            <div class="form-group"><label>Nome</label><input type="text" id="editStaffName" value="${member.name}"></div>
            <div class="form-group"><label>Função</label><input type="text" id="editStaffRole" value="${member.role}"></div>
            <div class="form-group"><label>E-mail</label><input type="email" id="editStaffEmail" value="${member.email || ''}"></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="editStaffPhone" value="${member.phone || ''}"></div>
            <div class="form-group"><label>Status</label>
                <select id="editStaffStatus">
                    <option ${member.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                    <option ${member.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
                </select>
            </div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelStaffEdit">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveStaffEdit">Salvar alterações</button>
            </div>
            <p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">As alterações serão sincronizadas com o Google Sheets (sistema-pluri).</p>`;
        getEl('cancelStaffEdit')?.addEventListener('click', closeSlidePanel);
        getEl('saveStaffEdit')?.addEventListener('click', () => {
            member.name = getEl('editStaffName')?.value?.trim() || member.name;
            member.role = getEl('editStaffRole')?.value?.trim() || member.role;
            member.email = getEl('editStaffEmail')?.value?.trim() || member.email;
            member.phone = getEl('editStaffPhone')?.value?.trim() || member.phone;
            member.status = getEl('editStaffStatus')?.value || member.status;
            closeSlidePanel();
            showToast('Membro da equipe atualizado!');
            renderPage();
        });
        openSlidePanel();
    }

    // ===== INIT =====
    function init() {
        initMockData();
        loadTheme();

        getEl('themeToggle')?.addEventListener('click', toggleTheme);

        document.querySelectorAll('.sidebar-nav a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(a.dataset.page);
            });
        });

        // Modal
        getEl('modalClose')?.addEventListener('click', closeModal);
        getEl('modalCancel')?.addEventListener('click', closeModal);
        getEl('modalSave')?.addEventListener('click', saveAppointment);
        getEl('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        getEl('slideOverlay')?.addEventListener('click', closeSlidePanel);
        getEl('notifBtn')?.addEventListener('click', () => showToast('Nenhuma notificação nova.'));

        renderPage();

        window.pluri = {
            navigateTo,
            openConversation,
            openPatient,
            openModal,
            openStaff,
            showToast
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
