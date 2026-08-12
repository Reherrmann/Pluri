(function () {
    // ======================================================
    // STATE (dados mockados em memória)
    // ======================================================
    const state = {
        clinic: {
            id: "mock",
            name: "Clínica Bem-Estar",
            phone: "(11) 3000-1234",
            email: "contato@bemestar.com",
            address: "Rua Saúde, 100 - São Paulo/SP",
            hours: "08:00 - 18:00",
            timezone: "America/Sao_Paulo",
            integrations: { calendar: false, whatsapp: false, email: false },
            onboarding: false
        },
        currentPage: 'dashboard',
        agendaDate: new Date().toISOString().split('T')[0],
        agendaTab: 'today',
        agendaMonth: { year: new Date().getFullYear(), month: new Date().getMonth() },
        appointments: [],
        patients: [],
        conversations: [],
        staff: [],
        activities: []
    };

    // ======================================================
    // UTILITIES
    // ======================================================
    const getEl = (id) => document.getElementById(id);
    const toDateStr = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    const getInitials = (name) => {
        const parts = String(name || '').split(' ');
        return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    };
    const showToast = (msg) => {
        const container = getEl('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
    const refreshIcons = () => {
        if (window.lucide && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }
    };

    // ======================================================
    // PERSISTÊNCIA LOCAL — DEMO
    // ======================================================
    const STORAGE_KEY = 'pluri-os-demo-v1';

    function saveState() {
        try {
            const data = {
                clinic: state.clinic,
                appointments: state.appointments,
                patients: state.patients,
                conversations: state.conversations,
                staff: state.staff,
                activities: state.activities
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar dados da demo:', error);
        }
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (data.clinic) state.clinic = { ...state.clinic, ...data.clinic };
            state.appointments = Array.isArray(data.appointments) ? data.appointments : [];
            state.patients = Array.isArray(data.patients) ? data.patients : [];
            state.conversations = Array.isArray(data.conversations) ? data.conversations : [];
            state.staff = Array.isArray(data.staff) ? data.staff : [];
            state.activities = Array.isArray(data.activities) ? data.activities : [];
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados da demo:', error);
            return false;
        }
    }

    // ======================================================
    // STATUS HELPERS (mesma assinatura do pluri-os original)
    // ======================================================
    window.getStatusClass = function(status) {
        switch (String(status || '').trim()) {
            case 'Aguardando': return 'status-aguardando';
            case 'Confirmado': return 'status-confirmado';
            case 'Cancelado': return 'status-cancelado';
            default: return 'status-aguardando';
        }
    };

    window.statusColor = function(status) {
        switch (String(status || '').trim()) {
            case 'Aguardando': return '#ffc107';
            case 'Confirmado': return '#28a745';
            case 'Cancelado': return '#dc3545';
            default: return '#ffc107';
        }
    };

    window.statusBadge = function(status) {
        const normalizedStatus = String(status || '').trim() || 'Aguardando';
        const cls = window.getStatusClass(normalizedStatus);
        return `<span class="appointment-status ${cls}">${normalizedStatus}</span>`;
    };

    const statusBadge = (status) => {
        let cls = '';
        if (status === 'Confirmado' || status === 'Concluído' || status === 'Ativo' || status === 'Resolvido') cls = 'confirmed';
        else if (status === 'Pendente' || status === 'Aguardando' || status === 'Novo') cls = 'pending';
        else cls = 'cancelled';
        const dotColor = cls === 'confirmed' ? 'green' : 'amber';
        return `<span class="status-badge ${cls}"><span class="status-dot ${dotColor}"></span>${status}</span>`;
    };

    const renderBarChart = (values, labels, highlightIdx = -1) => {
        const max = Math.max(...values, 1);
        return values.map((v, i) => {
            const pct = (v / max) * 100;
            return `<div class="bar-col">
                <span class="bar-value">${v}</span>
                <div class="bar-fill${i === highlightIdx ? ' today' : ''}" style="height:${pct}%"></div>
                <span class="bar-label">${labels[i] || ''}</span>
            </div>`;
        }).join('');
    };
    const openSlidePanel = () => {
        getEl('slidePanel')?.classList.add('show');
        getEl('slideOverlay')?.classList.add('show');
    };
    const closeSlidePanel = () => {
        getEl('slidePanel')?.classList.remove('show');
        getEl('slideOverlay')?.classList.remove('show');
    };
    const closeModal = () => {
        getEl('modalOverlay')?.classList.remove('show');
        window._editingAppointmentId = null;
    };
    const closeSidebar = () => {
        const sidebar = getEl('sidebar');
        const overlay = getEl('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    };
    const setModalMode = (mode) => {
        const title = document.querySelector('#modalOverlay .modal-header h3');
        const saveBtn = getEl('modalSave');
        const editDiv = getEl('editActions');
        if (mode === 'edit') {
            if (title) title.textContent = 'Editar agendamento';
            if (saveBtn) saveBtn.textContent = 'Salvar alterações';
            if (editDiv) editDiv.style.display = 'flex';
        } else {
            if (title) title.textContent = 'Novo agendamento';
            if (saveBtn) saveBtn.textContent = 'Salvar agendamento';
            if (editDiv) editDiv.style.display = 'none';
        }
    };

    // ======================================================
    // MOCK DATA INIT
    // ======================================================
    function initMockData() {
        const today = new Date();
        const todayStr = toDateStr(today);
        state.agendaDate = todayStr;
        state.agendaMonth = { year: today.getFullYear(), month: today.getMonth() };

        state.patients = [
            { _row: 1, id: 1, name: 'Maria Silva', phone: '(11) 98765-4321', email: 'maria@email.com', created: '10/01/2026', lastVisit: '22/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Prefere contato pelo WhatsApp.' },
            { _row: 2, id: 2, name: 'João Santos', phone: '(11) 91234-5678', email: 'joao@email.com', created: '15/02/2026', lastVisit: '20/07/2026', nextAppt: '29/07/2026', status: 'Ativo', notes: '' },
            { _row: 3, id: 3, name: 'Ana Oliveira', phone: '(21) 99876-5432', email: 'ana@email.com', created: '05/03/2026', lastVisit: '18/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Prefere atendimento no período da manhã.' },
            { _row: 4, id: 4, name: 'Carlos Souza', phone: '(31) 98765-1234', email: 'carlos@email.com', created: '20/04/2026', lastVisit: '25/07/2026', nextAppt: '30/07/2026', status: 'Ativo', notes: '' },
            { _row: 5, id: 5, name: 'Fernanda Lima', phone: '(41) 99876-1111', email: 'fernanda@email.com', created: '12/05/2026', lastVisit: '15/07/2026', nextAppt: '28/07/2026', status: 'Inativo', notes: 'Retorno pendente.' },
            { _row: 6, id: 6, name: 'Mariana Costa', phone: '(51) 91234-9999', email: 'mariana@email.com', created: '01/06/2026', lastVisit: '-', nextAppt: '28/07/2026', status: 'Novo', notes: '' },
            { _row: 7, id: 7, name: 'Lucas Ferreira', phone: '(61) 98765-0000', email: 'lucas@email.com', created: '18/06/2026', lastVisit: '-', nextAppt: '28/07/2026', status: 'Novo', notes: '' },
            { _row: 8, id: 8, name: 'Beatriz Lima', phone: '(81) 99876-7777', email: 'beatriz@email.com', created: '02/07/2026', lastVisit: '-', nextAppt: '28/07/2026', status: 'Novo', notes: '' },
            { _row: 9, id: 9, name: 'Rafael Alves', phone: '(91) 98765-6666', email: 'rafael@email.com', created: '10/07/2026', lastVisit: '-', nextAppt: '29/07/2026', status: 'Novo', notes: '' },
        ];

        state.appointments = [ 
            { id: 1, time: '09:00', patient: 'Mariana Costa', professional: 'Dra. Ana', service: 'Avaliação', status: 'Aguardando', date: todayStr, phone: '(51) 91234-9999', notes: '' }, 
            { id: 2, time: '10:30', patient: 'João Almeida', professional: 'Dr. Carlos', service: 'Retorno', status: 'Confirmado', date: todayStr, phone: '(11) 91234-5678', notes: '' }, 
            { id: 3, time: '11:30', patient: 'Ana Martins', professional: 'Dra. Fernanda', service: 'Avaliação', status: 'Pendente', date: todayStr, phone: '(21) 99876-5432', notes: '' }, 
            { id: 4, time: '14:00', patient: 'Lucas Ferreira', professional: 'Dra. Ana', service: 'Procedimento', status: 'Confirmado', date: todayStr, phone: '(61) 98765-0000', notes: '' }, 
            { id: 5, time: '15:30', patient: 'Camila Santos', professional: 'Dr. Carlos', service: 'Retorno', status: 'Pendente', date: todayStr, phone: '(71) 91234-8888', notes: '' }, 
            { id: 6, time: '17:00', patient: 'Beatriz Lima', professional: 'Dra. Fernanda', service: 'Avaliação', status: 'Confirmado', date: todayStr, phone: '(81) 99876-7777', notes: '' }, 
            { id: 7, time: '08:30', patient: 'Pedro Rocha', professional: 'Dra. Ana', service: 'Retorno', status: 'Concluído', date: todayStr, phone: '(11) 3000-1234', notes: '' }, 
        ];

        state.staff = [
            { _row: 1, id: 1, name: 'Recepção', role: 'Atendimento', status: 'Ativo', email: 'recepcao@bemestar.com', phone: '(11) 3000-1234' },
            { _row: 2, id: 2, name: 'Dra. Ana', role: 'Dentista', status: 'Ativo', email: 'ana@bemestar.com', phone: '(11) 98765-1111' },
            { _row: 3, id: 3, name: 'Dr. Carlos', role: 'Dentista', status: 'Ativo', email: 'carlos@bemestar.com', phone: '(11) 98765-2222' },
            { _row: 4, id: 4, name: 'Dra. Fernanda', role: 'Ortodontista', status: 'Ativo', email: 'fernanda@bemestar.com', phone: '(11) 98765-3333' },
        ];

        state.activities = [
            { time: '10:42', text: 'Maria confirmou consulta.' },
            { time: '10:38', text: 'Novo paciente cadastrado.' },
            { time: '10:31', text: 'PLURI respondeu solicitação de horário.' },
            { time: '10:24', text: 'Consulta de João reagendada.' },
            { time: '10:17', text: 'Lembrete enviado para Ana.' },
        ];
    }

    // ======================================================
    // NAVIGATION
    // ======================================================
    function navigateTo(page) {
        state.currentPage = page;
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
        if (link) link.classList.add('active');
        renderPage();
        closeSidebar();
    }

    // ======================================================
    // CARDS INSTRUÇÕES
    // ======================================================
    function getFirstVisitTip(page) {
        const tips = {
            dashboard: {
                title: 'Bem-vindo à Visão Geral',
                text: 'Aqui você acompanha rapidamente o que está acontecendo na clínica hoje.'
            },
            agenda: {
                title: 'Como usar a Agenda',
                text: 'Consulte os horários, filtre por profissional e clique em um horário livre para criar um novo agendamento.'
            },
            atendimentos: {
                title: 'Conversas',
                text: 'Acompanhe os contatos e atendimentos realizados pela clínica.'
            },
            pacientes: {
                title: 'Pacientes',
                text: 'Pesquise, cadastre e gerencie os pacientes da clínica.'
            },
            indicadores: {
                title: 'Indicadores',
                text: 'Acompanhe os principais números e o desempenho da clínica.'
            },
            configuracoes: {
                title: 'Configurações',
                text: 'Gerencie as informações e preferências da clínica.'
            }
        };

        const tip = tips[page];
        if (!tip) return '';

        const storageKey = `pluri-demo-tip-${page}`;
        if (localStorage.getItem(storageKey) === 'seen') return '';

        return `
            <div class="card" id="firstVisitTip" style="margin-bottom:16px;border-left:3px solid var(--primary-color);">
                <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
                    <div>
                        <div style="font-weight:600;margin-bottom:4px;">${tip.title}</div>
                        <div style="font-size:13px;color:var(--text-secondary);">${tip.text}</div>
                    </div>
                    <button class="btn btn-outline btn-sm" id="dismissFirstVisitTip">Entendi</button>
                </div>
            </div>`;
    }

    // ======================================================
    // RENDER ENGINE
    // ======================================================
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
            console.error(e);
            html = `<div style="padding:40px;text-align:center;color:#B91C1C;">Erro ao carregar a página.</div>`;
        }

        container.innerHTML = getFirstVisitTip(state.currentPage) + html;
        attachPageEvents();
        refreshIcons();
        updateTitleAndSubtitle(title, subtitle);

        getEl('dismissFirstVisitTip')?.addEventListener('click', () => {
            localStorage.setItem(`pluri-demo-tip-${state.currentPage}`, 'seen');
            getEl('firstVisitTip')?.remove();
        });
    }

    function updateTitleAndSubtitle(title, subtitle) {
        const titles = {
            dashboard: [state.clinic.name ? `Bom dia, ${state.clinic.name}.` : 'Bem-vindo à PLURI.', 'Veja o que está acontecendo na clínica hoje.'],
            agenda: ['Agenda', 'Gerencie os horários da clínica.'],
            atendimentos: ['Conversas', 'Central de conversas com pacientes.'],
            pacientes: ['Pacientes', 'Base de pacientes da clínica.'],
            automacoes: ['Automações', 'Camada operacional inteligente.'],
            indicadores: ['Indicadores', 'Visão operacional da clínica.'],
            configuracoes: ['Configurações', 'Gerencie sua clínica.'],
        };
        const [t, s] = titles[state.currentPage] || titles.dashboard;
        if (title) title.textContent = t;
        if (subtitle) subtitle.textContent = s;
    }

    // ======================================================
    // PAGE BUILDERS
    // ======================================================

    // --- Dashboard ---
    function buildDashboard() {
        const today = new Date();
        const todayStr = toDateStr(today);
        const appointmentsToday = state.appointments.filter(a => a.date === todayStr);
        const confirmed = appointmentsToday.filter(a => a.status === 'Confirmado').length;
        const pending = appointmentsToday.filter(a => a.status === 'Pendente' || a.status === 'Aguardando').length;
        const cancelled = appointmentsToday.filter(a => a.status === 'Cancelado').length;
        const conversationsWaiting = state.conversations.filter(c => c.status === 'Aguardando').length;

        const fakeCounts = [3, 7, 2, 8, 5, 1];
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const weekDays = [];
        for (let i = 0; i < 6; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = toDateStr(date);
            weekDays.push({ date: dateStr, count: fakeCounts[i] });
        }

        return `
        <div class="kpi-row">
            <div class="kpi-card" data-link="agenda">
                <div class="kpi-value">${appointmentsToday.length}</div>
                <div class="kpi-label">Atendimentos hoje</div>
                <div class="kpi-sub">${confirmed} confirmados</div>
            </div>
            <div class="kpi-card" data-link="atendimentos">
                <div class="kpi-value">${conversationsWaiting}</div>
                <div class="kpi-label">Conversas aguardando</div>
                <div class="kpi-sub">Precisam da equipe</div>
            </div>
            <div class="kpi-card" data-link="agenda">
                <div class="kpi-value">${pending}</div>
                <div class="kpi-label">Confirmações pendentes</div>
                <div class="kpi-sub amber">Precisam de atenção</div>
            </div>
            <div class="kpi-card" data-link="agenda">
                <div class="kpi-value">${cancelled}</div>
                <div class="kpi-label">Cancelamentos hoje</div>
                <div class="kpi-sub">${cancelled > 0 ? 'Precisam de atenção' : 'Nenhum'}</div>
            </div>
        </div>
        <div class="grid-2">
            <div class="card">
                <div class="card-header">
                    <h3>Agenda de hoje</h3>
                    <a class="btn btn-sm btn-outline js-nav" data-page="agenda">Ver agenda →</a>
                </div>
                <div class="card-body no-padding">
                    <ul class="agenda-list">${[...appointmentsToday].sort((a,b) => a.time.localeCompare(b.time)).slice(0,6).map(a => `
                        <li class="agenda-item" onclick="window.pluri.editAppointment('${a.id}')" style="cursor:pointer;">
                            <span class="agenda-time">${a.time}</span>
                            <div class="agenda-info">
                                <div class="agenda-name">${a.patient}</div>
                                <div class="agenda-detail">${a.service} · ${a.professional}</div>
                            </div>
                            ${statusBadge(a.status)}
                        </li>`).join('')}
                    </ul>
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
                            <strong style="font-size:13px;">${conversationsWaiting} conversas precisam da equipe</strong>
                            <p style="font-size:12px;color:var(--text-secondary);">Solicitações aguardando atendimento.</p>
                            <a class="btn btn-sm btn-outline js-nav" data-page="atendimentos">Ver conversas</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid-4">
            <div class="card">
                <div class="card-header"><h3>Atendimentos da semana</h3></div>
                <div class="card-body">
                    <div class="chart-container">${renderBarChart(weekDays.map(d => d.count), weekDays.map(d => {
                        const date = new Date(d.date + 'T00:00:00');
                        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                        return `${dayName} ${date.getDate()}`;
                    }), weekDays.findIndex(d => d.date === todayStr))}</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Atividade recente</h3></div>
                <div class="card-body">
                    <div class="timeline">${state.conversations.slice(0,5).map(c => `
                        <div class="timeline-item">
                            <span class="timeline-time">${c.time || '--:--'}</span>
                            <div class="timeline-dot"></div>
                            <span class="timeline-text">${c.summary || c.lastMsg}</span>
                        </div>`).join('')}
                    </div>
                </div>
            </div>
            <div class="card-placeholder">Espaço adaptável para a clínica</div>
            <div class="card-placeholder">Espaço adaptável para a clínica</div>
        </div>`;
    }

    // --- Agenda com filtro ---
    function buildAgenda() {
        if (!state || !state.appointments) {
            return `<div class="card"><div class="card-body">Erro ao carregar agenda.</div></div>`;
        }

        if (!state.agendaDate) state.agendaDate = new Date().toISOString().split('T')[0];
        if (!state.agendaTab) state.agendaTab = 'today';
        if (!state.agendaMonth) {
            const now = new Date();
            state.agendaMonth = { year: now.getFullYear(), month: now.getMonth() };
        }

        const currentDate = state.agendaDate;
        const isToday = state.agendaTab === 'today';
        const selectedProfessional = state.agendaProfessionalFilter || '';

        const allSlots = [];
        for (let h = 8; h < 18; h++) {
            for (let m = 0; m < 60; m += 30) {
                allSlots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
            }
        }

        const appointmentsToday = state.appointments.filter(a =>
            a.date === currentDate &&
            (!selectedProfessional || a.professional === selectedProfessional)
        );

        const grouped = {};
        appointmentsToday.forEach(appt => {
            const time = String(appt.time || '').trim();
            if (!grouped[time]) grouped[time] = [];
            grouped[time].push(appt);
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
                <div class="agenda-date-navigator" id="agendaDayNav" style="display:${isToday ? 'flex' : 'none'};align-items:center;gap:8px;margin-left:20px;">
                    <button class="btn-icon btn-sm" id="agendaPrevDay"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>
                    <span style="font-size:13px;font-weight:500;min-width:150px;text-align:center;display:inline-block;">${dataFormatada}</span>
                    <button class="btn-icon btn-sm" id="agendaNextDay"><i data-lucide="chevron-right" style="width:14px;height:14px;"></i></button>
                </div>
                <div class="agenda-date-navigator" id="agendaMonthNav" style="display:${isToday ? 'none' : 'flex'};align-items:center;gap:8px;margin-left:20px;">
                    <button class="btn-icon btn-sm" id="agendaPrevMonth"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>
                    <span style="font-size:13px;font-weight:500;min-width:150px;text-align:center;display:inline-block;">${monthLabel}</span>
                    <button class="btn-icon btn-sm" id="agendaNextMonth"><i data-lucide="chevron-right" style="width:14px;height:14px;"></i></button>
                </div>
                <div class="agenda-google-calendar">
                    <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                    <span>Sincronizado com Google Calendar</span>
                </div>
            </div>
            <div class="agenda-toolbar-right">
                <select id="agendaProfessionalFilter" class="form-control" style="min-width:210px;">
                    <option value="">Todos os profissionais</option>
                    ${(state.staff || []).map(staff => `
                        <option value="${staff.name}" ${state.agendaProfessionalFilter === staff.name ? 'selected' : ''}>${staff.name}</option>
                    `).join('')}
                </select>
                <button class="btn btn-primary" id="openModalBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo agendamento</button>
                <button class="btn btn-outline" id="btnConnectCalendar" style="display:none;">🔗 Conectar Google Calendar</button>
            </div>
        </div>
        <div id="agendaDayView" class="card" style="display:${isToday ? 'block' : 'none'};">
            <div class="card-body no-padding">
                <ul class="agenda-list">${allSlots.map(time => {
                    const events = grouped[time] || [];
                    if (events.length === 0) {
                        return `<li class="agenda-item free-slot">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar" style="background:var(--hover-bg);color:var(--text-secondary);">—</div>
                            <div class="agenda-info"><div class="agenda-name" style="color:var(--text-secondary);">Horário livre</div></div>
                            <button class="btn btn-sm btn-outline" onclick="openModal('${time}')">Agendar</button>
                        </li>`;
                    }
                    return events.map((appt, index) => {
                        const status = String(appt.status || '').trim() || 'Aguardando';
                        return `<li class="agenda-item" data-id="${appt.id}" style="cursor:pointer;position:relative;${index > 0 ? 'border-top:1px dashed var(--border);' : ''}">
                            <span class="agenda-time">${time}</span>
                            <div class="agenda-avatar">${getInitials(appt.patient)}</div>
                            <div class="agenda-info" onclick="window.pluri.editAppointment('${appt.id}')">
                                <div class="agenda-name">${appt.patient}</div>
                                <div class="agenda-detail">${appt.service} · ${appt.professional}</div>
                                <div style="margin-top:6px;">${window.statusBadge(status)}</div>
                            </div>
                            <button class="btn-icon-sm" title="Editar" onclick="event.stopPropagation();window.pluri.editAppointment('${appt.id}')"><i data-lucide="edit-2" style="width:14px;height:14px;"></i></button>
                            <button class="btn-icon-sm" title="Excluir" onclick="event.stopPropagation();window.pluri.deleteAppointment('${appt.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                        </li>`;
                    }).join('');
                }).join('')}</ul>
            </div>
        </div>
        <div id="agendaMonthView" style="display:${isToday ? 'none' : 'block'};">
            ${buildAgendaMonthHTML()}
        </div>`;
    }

    function buildAgendaMonthHTML() {
        if (!state || !state.appointments || !state.agendaMonth) {
            return `<div class="card"><div class="card-body">Erro ao carregar o mês.</div></div>`;
        }

        const { year, month } = state.agendaMonth;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = toDateStr(new Date());
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        const weekdayHeaders = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
            .map(d => `<div class="agenda-month-weekday">${d}</div>`).join('');

        const selectedProfessional = state.agendaProfessionalFilter || '';
        const maxShow = 3;
        const cellsHtml = cells.map(day => {
            if (day === null) return '<div class="agenda-month-cell empty"></div>';
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayAppts = state.appointments
                .filter(a => a.date === dateStr && (!selectedProfessional || a.professional === selectedProfessional))
                .sort((a, b) => a.time.localeCompare(b.time));
            const shown = dayAppts.slice(0, maxShow);
            const extra = dayAppts.length - shown.length;
            const isToday = dateStr === todayStr;

            return `
            <div class="agenda-month-cell ${isToday ? 'is-today' : ''}" data-date="${dateStr}" onclick="window.openNewAppointmentForDate('${dateStr}')" style="cursor:pointer;">
                <div class="agenda-month-daynum">${day}</div>
                <div class="agenda-month-events">
                    ${shown.map(appt => {
                        const status = String(appt.status || '').trim() || 'Aguardando';
                        return `<div class="agenda-month-event" title="${appt.patient} · ${status}" onclick="event.stopPropagation(); window.pluri.editAppointment('${appt.id}')">
                            <span class="agenda-month-dot" style="background:${window.statusColor(status)}"></span>
                            <span class="agenda-month-event-time">${appt.time}</span>
                            <span class="agenda-month-event-name">${appt.patient}</span>
                        </div>`;
                    }).join('')}
                    ${extra > 0 ? `<div class="agenda-month-more" onclick="event.stopPropagation(); openDayFromMonth('${dateStr}')">+${extra} mais</div>` : ''}
                </div>
            </div>`;
        }).join('');

        return `
        <div class="card">
            <div class="card-body no-padding">
                <div class="agenda-month-grid-header">${weekdayHeaders}</div>
                <div class="agenda-month-grid">${cellsHtml}</div>
            </div>
        </div>`;
    }

    window.openDayFromMonth = function(dateStr) {
        state.agendaDate = dateStr;
        state.agendaTab = 'today';
        renderPage();
    };
    window.openNewAppointmentForDate = function(dateStr) {
        openModal();
        const dateInput = getEl('apptDate');
        if (dateInput) dateInput.value = dateStr;
    };

    // --- As demais funções (atendimentos, pacientes, etc.) permanecem iguais às que você já tinha ---
    // (coloquei apenas as seções alteradas; o restante do seu código está mantido)
    // ... (todo o restante do código original, como buildAtendimentos, openConversation, etc., continua igual)

    // ======================================================
    // INIT
    // ======================================================
    function init() {
        const loaded = loadState();
        if (!loaded) {
            initMockData();
            saveState();
        }

        loadTheme();

        getEl('themeToggle')?.addEventListener('click', toggleTheme);
        getEl('modalClose')?.addEventListener('click', closeModal);
        getEl('modalCancel')?.addEventListener('click', closeModal);
        getEl('modalSave')?.addEventListener('click', saveAppointment);
        getEl('modalOverlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
        getEl('slideOverlay')?.addEventListener('click', closeSlidePanel);
        getEl('notifBtn')?.addEventListener('click', () => showToast('Nenhuma notificação nova.'));

        document.querySelectorAll('.sidebar-nav a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(a.dataset.page);
            });
        });

        getEl('sidebarOverlay')?.addEventListener('click', closeSidebar);

        window.pluri = window.pluri || {};
        Object.assign(window.pluri, {
            navigateTo,
            openConversation,
            openPatient,
            openModal,
            openStaff,
            showToast,
            editAppointment: openEditAppointment,
            deleteAppointment: window.deleteAppointment,
            openDayFromMonth: window.openDayFromMonth,
            confirmAppointment: function() {}
        });

        renderPage();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
