(function () {
    // ===== STATE =====
    const state = {
        currentPage: 'dashboard',
        appointments: [],
        patients: [],
        conversations: [],
        activities: [],
    };

    // ===== UTILS =====
    const getEl = (id) => document.getElementById(id);
    const getInitials = (name) => {
        const parts = String(name || '').split(' ');
        return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    };

    function safeStr(val) { return val ?? ''; }

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
            { id: 1, name: 'Maria Silva', phone: '(11) 98765-4321', email: 'maria@email.com', created: '10/01/2026', lastVisit: '22/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Prefere horário pela manhã.' },
            { id: 2, name: 'João Santos', phone: '(11) 91234-5678', email: 'joao@email.com', created: '15/02/2026', lastVisit: '20/07/2026', nextAppt: '29/07/2026', status: 'Ativo', notes: '' },
            { id: 3, name: 'Ana Oliveira', phone: '(21) 99876-5432', email: 'ana@email.com', created: '05/03/2026', lastVisit: '18/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Alergia a dipirona.' },
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
            { id: 1, patient: 'Maria Silva', channel: 'WhatsApp', lastMsg: 'Gostaria de remarcar minha consulta.', time: '10:15', status: 'Aguardando', responsible: '-' },
            { id: 2, patient: 'Fernanda Lima', channel: 'WhatsApp', lastMsg: 'Qual o horário disponível para amanhã?', time: '09:42', status: 'Aguardando', responsible: '-' },
            { id: 3, patient: 'Carlos Souza', channel: 'E-mail', lastMsg: 'Preciso de um atestado.', time: '08:30', status: 'Em andamento', responsible: 'Recepção' },
            { id: 4, patient: 'Novo contato', channel: 'WhatsApp', lastMsg: 'Olá, gostaria de agendar uma avaliação.', time: '11:02', status: 'Aguardando', responsible: '-' },
            { id: 5, patient: 'Rafael Alves', channel: 'Telefone', lastMsg: 'Confirmar horário de amanhã.', time: '07:50', status: 'Resolvido', responsible: 'Recepção' },
        ];

        state.activities = [
            { time: '10:42', text: 'Maria confirmou consulta.' },
            { time: '10:38', text: 'Novo paciente cadastrado.' },
            { time: '10:31', text: 'PLURI respondeu solicitação de horário.' },
            { time: '10:24', text: 'Consulta de João reagendada.' },
            { time: '10:17', text: 'Lembrete enviado para Ana.' },
        ];
    }

    // ===== SIDEBAR / MOBILE =====
    function toggleSidebar() {
        getEl('sidebar')?.classList.toggle('open');
        getEl('sidebarOverlay')?.classList.toggle('show');
    }

    function closeSidebar() {
        getEl('sidebar')?.classList.remove('open');
        getEl('sidebarOverlay')?.classList.remove('show');
    }

    // Expor funções globais (também garantidas via script inline no HTML, mas redundância não prejudica)
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;

    // ===== MODAL CONTROLS =====
    function openModal() {
        getEl('modalOverlay')?.classList.add('show');
        const dateInput = getEl('apptDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        const timeInput = getEl('apptTime');
        if (timeInput) timeInput.value = '09:00';
        refreshIcons();
    }

    function openModalWithTime(time) {
        openModal();
        const timeInput = getEl('apptTime');
        if (timeInput) timeInput.value = time;
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

        closeModal();
        showToast('Agendamento criado com sucesso!');
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

    // ===== RENDER ENGINE (com fallback) =====
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
        attachPageEvents();  // listeners que dependem de elementos recém-criados
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
        // Agenda: botão de novo agendamento
        getEl('openModalBtn')?.addEventListener('click', openModal);

        // Google Calendar simulado
        getEl('googleCalendarBtn')?.addEventListener('click', () => {
            showToast('Integração com Google Calendar em breve.');
        });

        // Tabs da agenda (Hoje / Semana)
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

        // Dashboard: links internos
        document.querySelectorAll('.js-nav').forEach(el => {
            const page = el.dataset.page;
            if (page) el.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(page);
            });
        });

        // Conversas (atendimentos) - clique na linha
        document.querySelectorAll('[data-conversation-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.conversationId, 10);
                if (!isNaN(id)) openConversation(id);
            });
        });

        // Pacientes - clique na linha
        document.querySelectorAll('[data-patient-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.patientId, 10);
                if (!isNaN(id)) openPatient(id);
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
                <div class="kpi-card"><div class="kpi-value">${totalToday}</div><div class="kpi-label">Atendimentos hoje</div><div class="kpi-sub">${confirmed} confirmados</div></div>
                <div class="kpi-card"><div class="kpi-value">${occupation}%</div><div class="kpi-label">Taxa de ocupação</div><div class="kpi-sub">+8% esta semana</div></div>
                <div class="kpi-card"><div class="kpi-value">${pending}</div><div class="kpi-label">Confirmações pendentes</div><div class="kpi-sub amber">Precisam de atenção</div></div>
                <div class="kpi-card"><div class="kpi-value">12</div><div class="kpi-label">Novos pacientes</div><div class="kpi-sub">Nos últimos 7 dias</div></div>
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
                            <div style="padding:12px 14px;background:#FAFBFC;border-radius:8px;">
                                <strong style="font-size:13px;">${pending} confirmações pendentes</strong>
                                <p style="font-size:12px;color:var(--text-secondary);">Pacientes ainda não confirmaram.</p>
                                <a class="btn btn-sm btn-outline js-nav" data-page="agenda">Ver agenda</a>
                            </div>
                            <div style="padding:12px 14px;background:#FAFBFC;border-radius:8px;">
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
                        ${[{name:'Confirmação de consultas',status:'Ativo'},{name:'Lembrete 24h antes',status:'Ativo'},{name:'Atendimento inicial',status:'Ativo'},{name:'Recuperação de faltas',status:'Pausado'}].map(a => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #F9FAFB;"><span style="font-size:13px;">${a.name}</span>${statusBadge(a.status)}</div>`).join('')}
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
        const occupiedTimes = new Set(appointmentsToday.map(a => a.time));

        return `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div class="tabs" id="agendaTabs">
                    <button class="tab active" data-tab="today">Hoje</button>
                    <button class="tab" data-tab="week">Semana</button>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-outline btn-sm" id="googleCalendarBtn"><i data-lucide="calendar-plus" style="width:16px;height:16px;"></i> Conectar Google Calendar</button>
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
                                <div class="agenda-avatar" style="background:#F0F4F8;color:var(--text-secondary);">—</div>
                                <div class="agenda-info"><div class="agenda-name" style="color:var(--text-secondary);">Horário livre</div></div>
                                <button class="btn btn-sm btn-outline" onclick="window.pluri.openModalWithTime('${time}')">Agendar</button>
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
                        <div class="agenda-name">${c.patient} <span style="font-weight:400;font-size:11px;color:var(--text-secondary);">${c.channel}</span></div>
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
                <button class="btn btn-sm btn-primary" id="resolveConversationBtn">Marcar como resolvido</button>
            </div>`;
        getEl('resolveConversationBtn')?.addEventListener('click', () => {
            conv.status = 'Resolvido';
            closeSlidePanel();
            showToast('Atendimento marcado como resolvido.');
            renderPage();
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
            <h3 style="margin-bottom:8px;">${p.name}</h3>
            <p style="font-size:13px;color:var(--text-secondary);">📞 ${p.phone}</p>
            <p style="font-size:13px;color:var(--text-secondary);">✉️ ${p.email}</p>
            <p style="font-size:13px;color:var(--text-secondary);">📅 Cadastro: ${p.created}</p>
            <hr style="margin:12px 0;border-color:#F2F4F7;">
            <p style="font-size:13px;"><strong>Último atendimento:</strong> ${p.lastVisit}</p>
            <p style="font-size:13px;"><strong>Próxima consulta:</strong> ${p.nextAppt}</p>
            <p style="font-size:13px;"><strong>Observações:</strong> ${p.notes||'Nenhuma.'}</p>
            <div style="margin-top:16px;">
                <button class="btn btn-sm btn-outline js-nav" data-page="agenda">Agendar</button>
            </div>`;
        openSlidePanel();
    }

    function buildAutomacoes() {
        const autos = [
            {name:'Atendimento inicial',desc:'Responde automaticamente novos contatos.',status:'Ativo',last:'Hoje, 10:31',count:342},
            {name:'Confirmação de consulta',desc:'Solicita confirmação 48h antes.',status:'Ativo',last:'Hoje, 09:15',count:128},
            {name:'Lembrete de consulta',desc:'Envia lembrete 24h antes.',status:'Ativo',last:'Ontem, 18:00',count:256},
            {name:'Follow-up',desc:'Acompanha pacientes após atendimento.',status:'Pausado',last:'15/07/2026',count:89}
        ];
        return `<div class="automation-grid">${autos.map(a => `
            <div class="automation-card">
                <h4>${a.name}</h4><p>${a.desc}</p>
                <div class="automation-meta">
                    ${statusBadge(a.status)}
                    <span>Última: ${a.last} · ${a.count}x</span>
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
                <table class="data-table"><thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                    <tbody>${['Recepção|Atendimento|Ativo','Dra. Ana|Dentista|Ativo','Dr. Carlos|Dentista|Ativo','Dra. Fernanda|Ortodontista|Ativo'].map(u => {
                        const [n,f,s] = u.split('|');
                        return `<tr><td>${n}</td><td>${f}</td><td>${statusBadge(s)}</td></tr>`;
                    }).join('')}</tbody></table>
            </div></div>
            <div class="card"><div class="card-header"><h3>Integrações</h3></div><div class="card-body">
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${[{name:'WhatsApp',connected:true},{name:'Google Calendar',connected:false},{name:'E-mail',connected:false}].map(i => `<div style="display:flex;justify-content:space-between;align-items:center;"><span>${i.name}</span>${statusBadge(i.connected?'Conectado':'Não conectado')}</div>`).join('')}
                </div>
            </div></div>`;
    }

    // ===== INIT =====
    function init() {
        initMockData();

        // Sidebar navigation
        document.querySelectorAll('.sidebar-nav a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(a.dataset.page);
            });
        });

        // Hamburger
        getEl('hamburgerBtn')?.addEventListener('click', toggleSidebar);
        getEl('sidebarOverlay')?.addEventListener('click', closeSidebar);

        // Modal
        getEl('modalClose')?.addEventListener('click', closeModal);
        getEl('modalCancel')?.addEventListener('click', closeModal);
        getEl('modalSave')?.addEventListener('click', saveAppointment);
        getEl('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Slide panel overlay
        getEl('slideOverlay')?.addEventListener('click', closeSlidePanel);

        // Notifications
        getEl('notifBtn')?.addEventListener('click', () => showToast('Nenhuma notificação nova.'));

        // Renderiza a página inicial
        renderPage();

        // API global
        window.pluri = {
            navigateTo,
            openConversation,
            openPatient,
            openModal,
            openModalWithTime,
            showToast
        };
    }

    // Arranque seguro
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
