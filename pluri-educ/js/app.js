(function () {
    // ======================================================
    // STATE (dados mockados em memória)
    // ======================================================
    const state = {
        school: {
            id: "mock",
            name: "Escola Bem-Estar",
            phone: "(11) 3000-1234",
            email: "contato@escola.com",
            address: "Rua Educação, 100 - São Paulo/SP",
            academicYear: "2026",
            semesters: ["1º Semestre", "2º Semestre"]
        },
        currentPage: 'dashboard',
        calendarDate: new Date().toISOString().split('T')[0],
        calendarTab: 'today',
        calendarMonth: { year: new Date().getFullYear(), month: new Date().getMonth() },
        calendarClassFilter: '',
        events: [],
        students: [],
        teachers: [],
        classes: [],
        grades: [],
        attendances: [],
        communications: [],
        occurrences: [],
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
    // PERSISTÊNCIA LOCAL
    // ======================================================
    const STORAGE_KEY = 'pluri-educacao-demo-v1';

    function saveState() {
        try {
            const data = {
                school: state.school,
                events: state.events,
                students: state.students,
                teachers: state.teachers,
                classes: state.classes,
                grades: state.grades,
                attendances: state.attendances,
                communications: state.communications,
                occurrences: state.occurrences,
                activities: state.activities
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);

            if (data.school) state.school = { ...state.school, ...data.school };
            state.events = Array.isArray(data.events) ? data.events : [];
            state.students = Array.isArray(data.students) ? data.students : [];
            state.teachers = Array.isArray(data.teachers) ? data.teachers : [];
            state.classes = Array.isArray(data.classes) ? data.classes : [];
            state.grades = Array.isArray(data.grades) ? data.grades : [];
            state.attendances = Array.isArray(data.attendances) ? data.attendances : [];
            state.communications = Array.isArray(data.communications) ? data.communications : [];
            state.occurrences = Array.isArray(data.occurrences) ? data.occurrences : [];
            state.activities = Array.isArray(data.activities) ? data.activities : [];

            return true;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return false;
        }
    }

    // ======================================================
    // STATUS HELPERS
    // ======================================================
    window.getStatusClass = function(status) {
        switch (String(status || '').trim()) {
            case 'Aguardando': return 'status-aguardando';
            case 'Confirmado': return 'status-confirmado';
            case 'Cancelado': return 'status-cancelado';
            case 'Ativo': return 'status-confirmado';
            case 'Inativo': return 'status-cancelado';
            case 'Transferido': return 'status-cancelado';
            default: return 'status-aguardando';
        }
    };

    window.statusColor = function(status) {
        switch (String(status || '').trim()) {
            case 'Aguardando': return '#ffc107';
            case 'Confirmado': return '#28a745';
            case 'Cancelado': return '#dc3545';
            case 'Ativo': return '#28a745';
            case 'Inativo': return '#dc3545';
            case 'Transferido': return '#dc3545';
            default: return '#ffc107';
        }
    };

    const statusBadge = (status) => {
        let cls = '';
        if (status === 'Ativo' || status === 'Confirmado' || status === 'Concluído' || status === 'Resolvido' || status === 'Entregue') cls = 'confirmed';
        else if (status === 'Pendente' || status === 'Aguardando' || status === 'Novo' || status === 'Matriculado' || status === 'Em andamento') cls = 'pending';
        else cls = 'cancelled';
        const dotColor = cls === 'confirmed' ? 'green' : cls === 'pending' ? 'amber' : 'red';
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
        window._editingEventId = null;
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
            if (title) title.textContent = 'Editar evento';
            if (saveBtn) saveBtn.textContent = 'Salvar alterações';
            if (editDiv) editDiv.style.display = 'flex';
        } else {
            if (title) title.textContent = 'Novo evento';
            if (saveBtn) saveBtn.textContent = 'Salvar evento';
            if (editDiv) editDiv.style.display = 'none';
        }
    };

    // ======================================================
    // MOCK DATA INIT
    // ======================================================
    function initMockData() {
        const today = new Date();
        const todayStr = toDateStr(today);
        state.calendarDate = todayStr;
        state.calendarMonth = { year: today.getFullYear(), month: today.getMonth() };

        // PROFESSORES
        state.teachers = [
            { _row: 1, id: 1, name: 'Prof. Carlos', subject: 'Matemática', email: 'carlos@escola.com', phone: '(11) 98765-1111', status: 'Ativo' },
            { _row: 2, id: 2, name: 'Profa. Ana', subject: 'Português', email: 'ana@escola.com', phone: '(11) 98765-2222', status: 'Ativo' },
            { _row: 3, id: 3, name: 'Prof. Roberto', subject: 'Ciências', email: 'roberto@escola.com', phone: '(11) 98765-3333', status: 'Ativo' },
            { _row: 4, id: 4, name: 'Profa. Mariana', subject: 'História', email: 'mariana@escola.com', phone: '(11) 98765-4444', status: 'Ativo' },
            { _row: 5, id: 5, name: 'Profa. Juliana', subject: 'Geografia', email: 'juliana@escola.com', phone: '(11) 98765-5555', status: 'Inativo' }
        ];

        // TURMAS
        state.classes = [
            { _row: 1, id: 1, name: '6º Ano A', grade: '6º Ano', shift: 'Manhã', teacher: 'Prof. Carlos', students: 18, year: '2026' },
            { _row: 2, id: 2, name: '6º Ano B', grade: '6º Ano', shift: 'Tarde', teacher: 'Profa. Ana', students: 16, year: '2026' },
            { _row: 3, id: 3, name: '7º Ano A', grade: '7º Ano', shift: 'Manhã', teacher: 'Prof. Roberto', students: 20, year: '2026' },
            { _row: 4, id: 4, name: '7º Ano B', grade: '7º Ano', shift: 'Tarde', teacher: 'Profa. Mariana', students: 15, year: '2026' },
            { _row: 5, id: 5, name: '8º Ano A', grade: '8º Ano', shift: 'Manhã', teacher: 'Profa. Ana', students: 22, year: '2026' }
        ];

        // ALUNOS
        state.students = [
            { _row: 1, id: 1, name: 'Ana Silva', enrollment: '20260001', class: '6º Ano A', phone: '(11) 98765-4321', email: 'ana@email.com', status: 'Ativo', birthDate: '15/03/2012', responsible: 'Maria Silva', respPhone: '(11) 91234-5678' },
            { _row: 2, id: 2, name: 'João Santos', enrollment: '20260002', class: '6º Ano A', phone: '(11) 91234-5678', email: 'joao@email.com', status: 'Ativo', birthDate: '22/07/2012', responsible: 'Carlos Santos', respPhone: '(11) 98888-9999' },
            { _row: 3, id: 3, name: 'Mariana Costa', enrollment: '20260003', class: '6º Ano B', phone: '(21) 99876-5432', email: 'mariana@email.com', status: 'Ativo', birthDate: '10/11/2012', responsible: 'Fernanda Costa', respPhone: '(21) 97777-8888' },
            { _row: 4, id: 4, name: 'Pedro Oliveira', enrollment: '20260004', class: '7º Ano A', phone: '(31) 98765-1234', email: 'pedro@email.com', status: 'Ativo', birthDate: '05/09/2011', responsible: 'José Oliveira', respPhone: '(31) 96666-7777' },
            { _row: 5, id: 5, name: 'Lucas Ferreira', enrollment: '20260005', class: '7º Ano A', phone: '(41) 99876-1111', email: 'lucas@email.com', status: 'Inativo', birthDate: '18/06/2011', responsible: 'Paula Ferreira', respPhone: '(41) 95555-6666' },
            { _row: 6, id: 6, name: 'Beatriz Lima', enrollment: '20260006', class: '7º Ano B', phone: '(51) 91234-9999', email: 'beatriz@email.com', status: 'Ativo', birthDate: '30/01/2011', responsible: 'Ricardo Lima', respPhone: '(51) 94444-5555' },
            { _row: 7, id: 7, name: 'Rafael Alves', enrollment: '20260007', class: '8º Ano A', phone: '(61) 98765-0000', email: 'rafael@email.com', status: 'Ativo', birthDate: '12/05/2010', responsible: 'Carla Alves', respPhone: '(61) 93333-4444' },
            { _row: 8, id: 8, name: 'Camila Santos', enrollment: '20260008', class: '8º Ano A', phone: '(81) 99876-7777', email: 'camila@email.com', status: 'Transferido', birthDate: '28/08/2010', responsible: 'Roberto Santos', respPhone: '(81) 92222-3333' }
        ];

        // EVENTOS
        const addDays = (date, days) => {
            const d = new Date(date);
            d.setDate(d.getDate() + days);
            return toDateStr(d);
        };

        state.events = [
            { id: 1, time: '08:00', title: 'Aula de Matemática', class: '6º Ano A', teacher: 'Prof. Carlos', type: 'Aula', status: 'Confirmado', date: todayStr, location: 'Sala 101' },
            { id: 2, time: '09:30', title: 'Aula de Português', class: '6º Ano B', teacher: 'Profa. Ana', type: 'Aula', status: 'Confirmado', date: todayStr, location: 'Sala 102' },
            { id: 3, time: '11:00', title: 'Aula de Ciências', class: '7º Ano A', teacher: 'Prof. Roberto', type: 'Aula', status: 'Confirmado', date: todayStr, location: 'Laboratório' },
            { id: 4, time: '14:00', title: 'Prova de História', class: '7º Ano B', teacher: 'Profa. Mariana', type: 'Prova', status: 'Pendente', date: todayStr, location: 'Sala 103' },
            { id: 5, time: '15:30', title: 'Reunião de pais', class: '6º Ano A', teacher: 'Prof. Carlos', type: 'Reunião', status: 'Aguardando', date: todayStr, location: 'Auditório' },
            { id: 6, time: '08:00', title: 'Aula de Geografia', class: '8º Ano A', teacher: 'Profa. Juliana', type: 'Aula', status: 'Cancelado', date: todayStr, location: 'Sala 104' },
            { id: 7, time: '08:00', title: 'Aula de Matemática', class: '6º Ano B', teacher: 'Prof. Carlos', type: 'Aula', status: 'Confirmado', date: addDays(today, 1), location: 'Sala 101' },
            { id: 8, time: '10:00', title: 'Prova de Português', class: '7º Ano A', teacher: 'Profa. Ana', type: 'Prova', status: 'Pendente', date: addDays(today, 1), location: 'Sala 102' },
            { id: 9, time: '09:00', title: 'Aula de História', class: '6º Ano A', teacher: 'Profa. Mariana', type: 'Aula', status: 'Concluído', date: addDays(today, -1), location: 'Sala 103' }
        ];

        // NOTAS
        state.grades = [
            { studentId: 1, studentName: 'Ana Silva', class: '6º Ano A', subject: 'Matemática', bimester: '1º', grade: 8.5, status: 'Aprovado' },
            { studentId: 1, studentName: 'Ana Silva', class: '6º Ano A', subject: 'Português', bimester: '1º', grade: 9.0, status: 'Aprovado' },
            { studentId: 2, studentName: 'João Santos', class: '6º Ano A', subject: 'Matemática', bimester: '1º', grade: 7.0, status: 'Aprovado' },
            { studentId: 2, studentName: 'João Santos', class: '6º Ano A', subject: 'Português', bimester: '1º', grade: 6.5, status: 'Aprovado' },
            { studentId: 3, studentName: 'Mariana Costa', class: '6º Ano B', subject: 'Matemática', bimester: '1º', grade: 9.5, status: 'Aprovado' },
            { studentId: 4, studentName: 'Pedro Oliveira', class: '7º Ano A', subject: 'Ciências', bimester: '1º', grade: 4.0, status: 'Recuperação' },
            { studentId: 5, studentName: 'Lucas Ferreira', class: '7º Ano A', subject: 'História', bimester: '1º', grade: 3.0, status: 'Reprovado' }
        ];

        // FREQUÊNCIA
        state.attendances = [
            { studentId: 1, studentName: 'Ana Silva', class: '6º Ano A', date: todayStr, status: 'Presente' },
            { studentId: 2, studentName: 'João Santos', class: '6º Ano A', date: todayStr, status: 'Presente' },
            { studentId: 3, studentName: 'Mariana Costa', class: '6º Ano B', date: todayStr, status: 'Falta' },
            { studentId: 4, studentName: 'Pedro Oliveira', class: '7º Ano A', date: todayStr, status: 'Presente' },
            { studentId: 6, studentName: 'Beatriz Lima', class: '7º Ano B', date: todayStr, status: 'Justificada' }
        ];

        // OCORRÊNCIAS
        state.occurrences = [
            { id: 1, student: 'Mariana Costa', class: '6º Ano B', date: todayStr, type: 'Disciplinar', description: 'Conversou durante a aula', status: 'Pendente' },
            { id: 2, student: 'Pedro Oliveira', class: '7º Ano A', date: todayStr, type: 'Acadêmica', description: 'Não entregou o trabalho', status: 'Resolvido' }
        ];

        // COMUNICADOS
        state.communications = [
            { id: 1, title: 'Reunião de pais - 6º Ano', to: '6º Ano A e B', date: todayStr, message: 'A reunião será amanhã às 19h.', status: 'Entregue' },
            { id: 2, title: 'Alteração no calendário de provas', to: '7º Ano A e B', date: todayStr, message: 'As provas foram adiadas para próxima semana.', status: 'Pendente' }
        ];

        // ATIVIDADES
        state.activities = [
            { time: '10:42', text: 'Ana Silva presença registrada.' },
            { time: '10:38', text: 'Novo aluno cadastrado: Rafael Alves.' },
            { time: '10:31', text: 'Comunicado enviado para 6º Ano A.' },
            { time: '10:24', text: 'Prova de História reagendada.' },
            { time: '10:17', text: 'Ocorrência registrada para Mariana Costa.' }
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
    // FIRST VISIT TIP
    // ======================================================
    function getFirstVisitTip(page) {
        const tips = {
            dashboard: { title: 'Bem-vindo à Visão Geral', text: 'Acompanhe rapidamente o que está acontecendo na escola hoje.' },
            agenda: { title: 'Como usar a Agenda', text: 'Consulte os horários, filtre por turma e clique em um horário livre para criar um novo evento.' },
            alunos: { title: 'Alunos', text: 'Pesquise, cadastre e gerencie os alunos da escola.' },
            turmas: { title: 'Turmas', text: 'Gerencie turmas, professores, disciplinas e alunos.' },
            notas: { title: 'Notas e Frequência', text: 'Lançe notas, registre frequência e acompanhe o desempenho dos alunos.' },
            comunicacao: { title: 'Comunicação', text: 'Envie comunicados para turmas, professores ou responsáveis.' },
            configuracoes: { title: 'Configurações', text: 'Gerencie as informações e preferências da escola.' }
        };
        const tip = tips[page];
        if (!tip) return '';
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
                case 'alunos': html = buildAlunos(); break;
                case 'turmas': html = buildTurmas(); break;
                case 'notas': html = buildNotas(); break;
                case 'comunicacao': html = buildComunicacao(); break;
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
            getEl('firstVisitTip')?.remove();
        });
    }

    function updateTitleAndSubtitle(title, subtitle) {
        const titles = {
            dashboard: [
                (() => {
                    const hour = new Date().getHours();
                    let greeting = 'Boa noite';
                    if (hour >= 5 && hour < 12) greeting = 'Bom dia';
                    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
                    return state.school.name ? `${greeting}, ${state.school.name}.` : `${greeting}!`;
                })(),
                'Veja o que está acontecendo na escola hoje.'
            ],
            agenda: ['Agenda Escolar', 'Gerencie os horários e eventos da escola.'],
            alunos: ['Alunos', 'Base de alunos da escola.'],
            turmas: ['Turmas', 'Gerencie turmas e professores.'],
            notas: ['Notas e Frequência', 'Acompanhe o desempenho dos alunos.'],
            comunicacao: ['Comunicação', 'Envie comunicados e mensagens.'],
            configuracoes: ['Configurações', 'Gerencie sua escola.']
        };
        const [t, s] = titles[state.currentPage] || titles.dashboard;
        if (title) title.textContent = t;
        if (subtitle) subtitle.textContent = s;
    }

    // ======================================================
    // PAGE BUILDERS
    // ======================================================

    // --- DASHBOARD ---
    function buildDashboard() {
        const today = new Date();
        const todayStr = toDateStr(today);
        const activeStudents = state.students.filter(s => s.status === 'Ativo').length;
        const eventsToday = state.events.filter(e => e.date === todayStr);
        const confirmed = eventsToday.filter(e => e.status === 'Confirmado').length;
        const pending = eventsToday.filter(e => e.status === 'Pendente' || e.status === 'Aguardando').length;
        const commsPending = state.communications.filter(c => c.status === 'Pendente').length;
        const occPending = state.occurrences.filter(o => o.status === 'Pendente').length;

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
            const count = state.events.filter(e => e.date === dateStr).length || 0;
            weekDays.push({ date: dateStr, count: count });
        }

        let html = '';
        html += '<div class="kpi-row">';
        html += `<div class="kpi-card" data-link="alunos"><div class="kpi-value">${activeStudents}</div><div class="kpi-label">Alunos ativos</div><div class="kpi-sub">${state.students.length} total</div></div>`;
        html += `<div class="kpi-card" data-link="agenda"><div class="kpi-value">${eventsToday.length}</div><div class="kpi-label">Eventos hoje</div><div class="kpi-sub">${confirmed} confirmados</div></div>`;
        html += `<div class="kpi-card" data-link="comunicacao"><div class="kpi-value">${commsPending}</div><div class="kpi-label">Comunicados pendentes</div><div class="kpi-sub">${commsPending > 0 ? 'Aguardando envio' : 'Nenhum pendente'}</div></div>`;
        html += `<div class="kpi-card" data-link="notas"><div class="kpi-value">${occPending}</div><div class="kpi-label">Ocorrências pendentes</div><div class="kpi-sub">${occPending > 0 ? 'Precisam de ação' : 'Nenhuma pendente'}</div></div>`;
        html += '</div>';

        html += '<div class="grid-2">';
        html += '<div class="card"><div class="card-header"><h3>Agenda de hoje</h3><a class="btn btn-sm btn-outline js-nav" data-page="agenda">Ver agenda →</a></div><div class="card-body no-padding"><ul class="agenda-list">';
        html += [...eventsToday].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 6).map(e => {
            const typeIcon = e.type === 'Prova' ? '📝' : e.type === 'Reunião' ? '👥' : '📚';
            return `<li class="agenda-item" onclick="window.pluri.editEvent('${e.id}')" style="cursor:pointer;">
                <span class="agenda-time">${e.time}</span>
                <div class="agenda-avatar">${getInitials(e.class)}</div>
                <div class="agenda-info">
                    <div class="agenda-name">${typeIcon} ${e.title}</div>
                    <div class="agenda-detail">${e.class} · ${e.teacher}</div>
                </div>
                ${statusBadge(e.status)}
            </li>`;
        }).join('');
        html += '</ul></div></div>';

        html += '<div class="card"><div class="card-header"><h3>Precisa da sua atenção</h3></div><div class="card-body"><div style="display:flex;flex-direction:column;gap:14px;">';
        html += `<div style="padding:12px 14px;background:var(--hover-bg);border-radius:8px;"><strong style="font-size:13px;">${pending} eventos pendentes</strong><p style="font-size:12px;color:var(--text-secondary);">Eventos aguardando confirmação.</p><a class="btn btn-sm btn-outline js-nav" data-page="agenda">Ver agenda</a></div>`;
        html += `<div style="padding:12px 14px;background:var(--hover-bg);border-radius:8px;"><strong style="font-size:13px;">${occPending} ocorrências pendentes</strong><p style="font-size:12px;color:var(--text-secondary);">Ocorrências aguardando ação.</p><a class="btn btn-sm btn-outline js-nav" data-page="notas">Ver ocorrências</a></div>`;
        html += '</div></div></div></div>';

        html += '<div class="grid-4">';
        html += '<div class="card"><div class="card-header"><h3>Eventos da semana</h3></div><div class="card-body"><div class="chart-container">';
        html += renderBarChart(weekDays.map(d => d.count), weekDays.map(d => {
            const date = new Date(d.date + 'T00:00:00');
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            return dayName + ' ' + date.getDate();
        }), weekDays.findIndex(d => d.date === todayStr));
        html += '</div></div></div>';

        html += '<div class="card"><div class="card-header"><h3>Atividade recente</h3></div><div class="card-body"><div class="timeline">';
        html += state.activities.slice(0, 5).map(a => `<div class="timeline-item"><span class="timeline-time">${a.time}</span><div class="timeline-dot"></div><span class="timeline-text">${a.text}</span></div>`).join('');
        html += '</div></div></div>';

        html += '<div class="card-placeholder">Espaço adaptável para a escola</div>';
        html += '<div class="card-placeholder">Espaço adaptável para a escola</div>';
        html += '</div>';

        return html;
    }

    // ======================================================
    // AGENDA
    // ======================================================
    function buildAgenda() {
        if (!state.calendarDate) state.calendarDate = new Date().toISOString().split('T')[0];
        if (!state.calendarTab) state.calendarTab = 'today';
        if (!state.calendarMonth) {
            const now = new Date();
            state.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
        }

        const currentDate = state.calendarDate;
        const isToday = state.calendarTab === 'today';
        const selectedClass = state.calendarClassFilter || '';

        const allSlots = [];
        for (let h = 7; h < 18; h++) {
            for (let m = 0; m < 60; m += 30) {
                allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }

        const eventsToday = state.events.filter(a => a.date === currentDate && (!selectedClass || a.class === selectedClass));
        const grouped = {};
        eventsToday.forEach(evt => {
            const time = String(evt.time || '').trim();
            if (!grouped[time]) grouped[time] = [];
            grouped[time].push(evt);
        });

        const dataFormatada = new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: '2-digit'
        });

        const monthDate = new Date(state.calendarMonth.year, state.calendarMonth.month, 1);
        let monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

        const classOptions = state.classes.map(c => c.name);

        return `
        <div class="agenda-toolbar">
            <div class="agenda-toolbar-left">
                <div class="tabs" id="agendaTabs">
                    <button class="tab ${isToday ? 'active' : ''}" data-tab="today">Hoje</button>
                    <button class="tab ${!isToday ? 'active' : ''}" data-tab="month">Mês</button>
                </div>

                <div class="agenda-date-navigator" id="agendaDayNav"