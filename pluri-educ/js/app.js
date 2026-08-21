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
            case 'Entregue': return 'status-confirmado';
            case 'Pendente': return 'status-aguardando';
            case 'Resolvido': return 'status-confirmado';
            case 'Aprovado': return 'status-confirmado';
            case 'Recuperação': return 'status-aguardando';
            case 'Reprovado': return 'status-cancelado';
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
            case 'Entregue': return '#28a745';
            case 'Pendente': return '#ffc107';
            case 'Resolvido': return '#28a745';
            case 'Aprovado': return '#28a745';
            case 'Recuperação': return '#ffc107';
            case 'Reprovado': return '#dc3545';
            default: return '#ffc107';
        }
    };

    const statusBadge = (status) => {
        let cls = '';
        if (status === 'Ativo' || status === 'Confirmado' || status === 'Concluído' || status === 'Resolvido' || status === 'Entregue' || status === 'Aprovado') cls = 'confirmed';
        else if (status === 'Pendente' || status === 'Aguardando' || status === 'Novo' || status === 'Matriculado' || status === 'Em andamento' || status === 'Recuperação') cls = 'pending';
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

        // ===== PROFESSORES =====
        state.teachers = [
            { _row: 1, id: 1, name: 'Prof. Carlos', subject: 'Matemática', email: 'carlos@escola.com', phone: '(11) 98765-1111', status: 'Ativo' },
            { _row: 2, id: 2, name: 'Profa. Ana', subject: 'Português', email: 'ana@escola.com', phone: '(11) 98765-2222', status: 'Ativo' },
            { _row: 3, id: 3, name: 'Prof. Roberto', subject: 'Ciências', email: 'roberto@escola.com', phone: '(11) 98765-3333', status: 'Ativo' },
            { _row: 4, id: 4, name: 'Profa. Mariana', subject: 'História', email: 'mariana@escola.com', phone: '(11) 98765-4444', status: 'Ativo' },
            { _row: 5, id: 5, name: 'Profa. Juliana', subject: 'Geografia', email: 'juliana@escola.com', phone: '(11) 98765-5555', status: 'Inativo' }
        ];

        // ===== TURMAS =====
        state.classes = [
            { _row: 1, id: 1, name: '6º Ano A', grade: '6º Ano', shift: 'Manhã', teacher: 'Prof. Carlos', students: 18, year: '2026' },
            { _row: 2, id: 2, name: '6º Ano B', grade: '6º Ano', shift: 'Tarde', teacher: 'Profa. Ana', students: 16, year: '2026' },
            { _row: 3, id: 3, name: '7º Ano A', grade: '7º Ano', shift: 'Manhã', teacher: 'Prof. Roberto', students: 20, year: '2026' },
            { _row: 4, id: 4, name: '7º Ano B', grade: '7º Ano', shift: 'Tarde', teacher: 'Profa. Mariana', students: 15, year: '2026' },
            { _row: 5, id: 5, name: '8º Ano A', grade: '8º Ano', shift: 'Manhã', teacher: 'Profa. Ana', students: 22, year: '2026' }
        ];

        // ===== ALUNOS =====
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

        // ===== EVENTOS =====
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

        // ===== NOTAS =====
        state.grades = [
            { studentId: 1, studentName: 'Ana Silva', class: '6º Ano A', subject: 'Matemática', bimester: '1º', grade: 8.5, status: 'Aprovado' },
            { studentId: 1, studentName: 'Ana Silva', class: '6º Ano A', subject: 'Português', bimester: '1º', grade: 9.0, status: 'Aprovado' },
            { studentId: 2, studentName: 'João Santos', class: '6º Ano A', subject: 'Matemática', bimester: '1º', grade: 7.0, status: 'Aprovado' },
            { studentId: 2, studentName: 'João Santos', class: '6º Ano A', subject: 'Português', bimester: '1º', grade: 6.5, status: 'Aprovado' },
            { studentId: 3, studentName: 'Mariana Costa', class: '6º Ano B', subject: 'Matemática', bimester: '1º', grade: 9.5, status: 'Aprovado' },
            { studentId: 4, studentName: 'Pedro Oliveira', class: '7º Ano A', subject: 'Ciências', bimester: '1º', grade: 4.0, status: 'Recuperação' },
            { studentId: 5, studentName: 'Lucas Ferreira', class: '7º Ano A', subject: 'História', bimester: '1º', grade: 3.0, status: 'Reprovado' }
        ];

        // ===== FREQUÊNCIA =====
        state.attendances = [
            { studentId: 1, studentName: 'Ana Silva', class: '6º Ano A', date: todayStr, status: 'Presente' },
            { studentId: 2, studentName: 'João Santos', class: '6º Ano A', date: todayStr, status: 'Presente' },
            { studentId: 3, studentName: 'Mariana Costa', class: '6º Ano B', date: todayStr, status: 'Falta' },
            { studentId: 4, studentName: 'Pedro Oliveira', class: '7º Ano A', date: todayStr, status: 'Presente' },
            { studentId: 6, studentName: 'Beatriz Lima', class: '7º Ano B', date: todayStr, status: 'Justificada' }
        ];

        // ===== OCORRÊNCIAS =====
        state.occurrences = [
            { id: 1, student: 'Mariana Costa', class: '6º Ano B', date: todayStr, type: 'Disciplinar', description: 'Conversou durante a aula', status: 'Pendente' },
            { id: 2, student: 'Pedro Oliveira', class: '7º Ano A', date: todayStr, type: 'Acadêmica', description: 'Não entregou o trabalho', status: 'Resolvido' }
        ];

        // ===== COMUNICADOS =====
        state.communications = [
            { id: 1, title: 'Reunião de pais - 6º Ano', to: '6º Ano A e B', date: todayStr, message: 'A reunião será amanhã às 19h.', status: 'Entregue' },
            { id: 2, title: 'Alteração no calendário de provas', to: '7º Ano A e B', date: todayStr, message: 'As provas foram adiadas para próxima semana.', status: 'Pendente' }
        ];

        // ===== ATIVIDADES =====
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
            </div>

            <div class="agenda-toolbar-right">
                <select id="agendaClassFilter" class="form-control" style="min-width:180px;">
                    <option value="">Todas as turmas</option>
                    ${state.classes.map(c => `
                        <option value="${c.name}" ${state.calendarClassFilter === c.name ? 'selected' : ''}>
                            ${c.name}
                        </option>
                    `).join('')}
                </select>
                <button class="btn btn-primary" id="openModalBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo evento</button>
            </div>
        </div>

        <div id="agendaDayView" class="card" style="display:${isToday ? 'block' : 'none'};">
            <div class="card-body no-padding">
                <ul class="agenda-list">
                    ${allSlots.map(time => {
                        const events = grouped[time] || [];
                        if (events.length === 0) {
                            return `
                                <li class="agenda-item free-slot">
                                    <span class="agenda-time">${time}</span>
                                    <div class="agenda-avatar" style="background:var(--hover-bg);color:var(--text-secondary);">—</div>
                                    <div class="agenda-info"><div class="agenda-name" style="color:var(--text-secondary);">Horário livre</div></div>
                                    <button class="btn btn-sm btn-outline" onclick="openModal('${time}')">Agendar</button>
                                </li>`;
                        }
                        return events.map((evt, index) => {
                            const status = String(evt.status || '').trim() || 'Aguardando';
                            const typeIcon = evt.type === 'Prova' ? '📝' : evt.type === 'Reunião' ? '👥' : '📚';
                            return `
                                <li class="agenda-item" data-id="${evt.id}" style="cursor:pointer;position:relative;${index > 0 ? 'border-top:1px dashed var(--border);' : ''}">
                                    <span class="agenda-time">${time}</span>
                                    <div class="agenda-avatar">${getInitials(evt.class)}</div>
                                    <div class="agenda-info" onclick="window.pluri.editEvent('${evt.id}')">
                                        <div class="agenda-name">${typeIcon} ${evt.title}</div>
                                        <div class="agenda-detail">${evt.class} · ${evt.teacher}</div>
                                        <div style="margin-top:6px;">${statusBadge(status)}</div>
                                    </div>
                                    <button class="btn-icon-sm" title="Editar" onclick="event.stopPropagation();window.pluri.editEvent('${evt.id}')"><i data-lucide="edit-2" style="width:14px;height:14px;"></i></button>
                                    <button class="btn-icon-sm" title="Excluir" onclick="event.stopPropagation();window.pluri.deleteEvent('${evt.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                                </li>`;
                        }).join('');
                    }).join('')}
                </ul>
            </div>
        </div>

        <div id="agendaMonthView" style="display:${isToday ? 'none' : 'block'};">
            ${buildAgendaMonthHTML()}
        </div>`;
    }

    function buildAgendaMonthHTML() {
        if (!state || !state.events || !state.calendarMonth) {
            return `<div class="card"><div class="card-body">Erro ao carregar o mês.</div></div>`;
        }

        const { year, month } = state.calendarMonth;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = toDateStr(new Date());
        const selectedClass = state.calendarClassFilter || '';

        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        const weekdayHeaders = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
            .map(d => `<div class="agenda-month-weekday">${d}</div>`).join('');

        const maxShow = 3;
        const cellsHtml = cells.map(day => {
            if (day === null) return '<div class="agenda-month-cell empty"></div>';
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayAppts = state.events
                .filter(a => a.date === dateStr && (!selectedClass || a.class === selectedClass))
                .sort((a, b) => a.time.localeCompare(b.time));
            const shown = dayAppts.slice(0, maxShow);
            const extra = dayAppts.length - shown.length;
            const isToday = dateStr === todayStr;

            return `
                <div class="agenda-month-cell ${isToday ? 'is-today' : ''}" data-date="${dateStr}" onclick="window.openNewEventForDate('${dateStr}')" style="cursor:pointer;">
                    <div class="agenda-month-daynum">${day}</div>
                    <div class="agenda-month-events">
                        ${shown.map(evt => {
                            const status = String(evt.status || '').trim() || 'Aguardando';
                            const typeIcon = evt.type === 'Prova' ? '📝' : evt.type === 'Reunião' ? '👥' : '📚';
                            return `
                                <div class="agenda-month-event" title="${evt.title} · ${status}" onclick="event.stopPropagation(); window.pluri.editEvent('${evt.id}')">
                                    <span class="agenda-month-dot" style="background:${window.statusColor(status)}"></span>
                                    <span class="agenda-month-event-time">${evt.time}</span>
                                    <span class="agenda-month-event-name">${typeIcon} ${evt.title}</span>
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
        state.calendarDate = dateStr;
        state.calendarTab = 'today';
        renderPage();
    };

    window.openNewEventForDate = function(dateStr) {
        openModal();
        const dateInput = getEl('eventDate');
        if (dateInput) dateInput.value = dateStr;
    };

    // ======================================================
    // ALUNOS
    // ======================================================
    function buildAlunos() {
        return `
            <div class="search-bar" style="display:flex;gap:8px;">
                <input type="text" id="studentSearch" placeholder="Buscar por nome, matrícula ou telefone..." style="flex:1;">
                <button class="btn btn-primary" id="newStudentBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo aluno</button>
            </div>
            <div class="card"><div class="card-body no-padding" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Matrícula</th><th>Aluno</th><th>Turma</th><th>Telefone</th><th>Responsável</th><th>Status</th></tr></thead>
                    <tbody id="studentTableBody">${state.students.map(p => `
                        <tr style="cursor:pointer;" data-student-row="${p._row}">
                            <td style="font-weight:500;">${p.enrollment}</td>
                            <td>${p.name}</td>
                            <td>${p.class}</td>
                            <td>${p.phone}</td>
                            <td>${p.responsible || '-'}</td>
                            <td>${statusBadge(p.status)}</td>
                        </tr>`).join('')}</tbody>
                </table>
            </div></div>`;
    }

    function openNewStudent() {
        const content = getEl('slideContent');
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">Novo aluno</h3>
            <div class="form-group"><label>Nome completo</label><input type="text" id="newStudentName"></div>
            <div class="form-group"><label>Data de nascimento</label><input type="text" id="newStudentBirth" placeholder="DD/MM/AAAA"></div>
            <div class="form-group"><label>Matrícula</label><input type="text" id="newStudentEnrollment" placeholder="Ex: 20260009"></div>
            <div class="form-group"><label>Turma</label><select id="newStudentClass">
                ${state.classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="newStudentPhone"></div>
            <div class="form-group"><label>E-mail</label><input type="email" id="newStudentEmail"></div>
            <div class="form-group"><label>Responsável</label><input type="text" id="newStudentResponsible"></div>
            <div class="form-group"><label>Telefone do responsável</label><input type="text" id="newStudentRespPhone"></div>
            <div class="form-group"><label>Status</label><select id="newStudentStatus"><option>Ativo</option><option>Inativo</option><option>Transferido</option></select></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelNewStudent">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveNewStudent">Criar aluno</button>
            </div>`;
        getEl('cancelNewStudent').onclick = closeSlidePanel;
        getEl('saveNewStudent').onclick = () => {
            const name = getEl('newStudentName').value.trim();
            const enrollment = getEl('newStudentEnrollment').value.trim();
            if (!name || !enrollment) { showToast('Preencha nome e matrícula.'); return; }
            const newStudent = {
                _row: Date.now(), id: Date.now(),
                name, enrollment,
                class: getEl('newStudentClass').value,
                phone: getEl('newStudentPhone').value.trim(),
                email: getEl('newStudentEmail').value.trim(),
                birthDate: getEl('newStudentBirth').value.trim(),
                responsible: getEl('newStudentResponsible').value.trim(),
                respPhone: getEl('newStudentRespPhone').value.trim(),
                status: getEl('newStudentStatus').value
            };
            state.students.push(newStudent);
            saveState();
            closeSlidePanel();
            showToast('Aluno criado!');
            renderPage();
        };
        openSlidePanel();
    }

    function openStudent(row) {
        const p = state.students.find(pt => pt._row == row);
        if (!p) return;
        const content = getEl('slideContent');
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">Editar aluno</h3>
            <div class="form-group"><label>Nome</label><input type="text" id="editStudentName" value="${p.name}"></div>
            <div class="form-group"><label>Matrícula</label><input type="text" id="editStudentEnrollment" value="${p.enrollment}"></div>
            <div class="form-group"><label>Turma</label><select id="editStudentClass">
                ${state.classes.map(c => `<option value="${c.name}" ${c.name === p.class ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="editStudentPhone" value="${p.phone}"></div>
            <div class="form-group"><label>E-mail</label><input type="email" id="editStudentEmail" value="${p.email || ''}"></div>
            <div class="form-group"><label>Responsável</label><input type="text" id="editStudentResponsible" value="${p.responsible || ''}"></div>
            <div class="form-group"><label>Telefone do responsável</label><input type="text" id="editStudentRespPhone" value="${p.respPhone || ''}"></div>
            <div class="form-group"><label>Status</label><select id="editStudentStatus">
                <option ${p.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                <option ${p.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
                <option ${p.status === 'Transferido' ? 'selected' : ''}>Transferido</option>
            </select></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelStudentEdit">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveStudentEdit">Salvar</button>
            </div>`;
        getEl('cancelStudentEdit').onclick = closeSlidePanel;
        getEl('saveStudentEdit').onclick = () => {
            p.name = getEl('editStudentName').value.trim() || p.name;
            p.enrollment = getEl('editStudentEnrollment').value.trim() || p.enrollment;
            p.class = getEl('editStudentClass').value;
            p.phone = getEl('editStudentPhone').value.trim() || p.phone;
            p.email = getEl('editStudentEmail').value.trim() || p.email;
            p.responsible = getEl('editStudentResponsible').value.trim() || p.responsible;
            p.respPhone = getEl('editStudentRespPhone').value.trim() || p.respPhone;
            p.status = getEl('editStudentStatus').value;
            closeSlidePanel();
            showToast('Aluno atualizado.');
            renderPage();
        };
        openSlidePanel();
    }

    // ======================================================
    // TURMAS
    // ======================================================
    function buildTurmas() {
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <div class="search-bar" style="flex:1;margin-bottom:0;max-width:400px;">
                    <input type="text" id="classSearch" placeholder="Buscar turma..." style="flex:1;">
                </div>
                <button class="btn btn-primary" id="newClassBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Nova turma</button>
            </div>
            <div class="class-grid" id="classGrid">
                ${state.classes.map(c => `
                    <div class="class-card" onclick="openClass(${c._row})" data-class-row="${c._row}">
                        <h4>${c.name}</h4>
                        <div class="class-meta">
                            <span>👨‍🏫 ${c.teacher}</span>
                            <span>👨‍🎓 ${c.students} alunos</span>
                            <span>🕐 ${c.shift}</span>
                        </div>
                        <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">
                            ${c.grade} · ${c.year}
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    function openNewClass() {
        const content = getEl('slideContent');
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">Nova turma</h3>
            <div class="form-group"><label>Nome da turma</label><input type="text" id="newClassName" placeholder="Ex: 6º Ano A"></div>
            <div class="form-group"><label>Série</label><input type="text" id="newClassGrade" placeholder="Ex: 6º Ano"></div>
            <div class="form-group"><label>Professor</label><select id="newClassTeacher">
                ${state.teachers.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>Período</label><select id="newClassShift"><option>Manhã</option><option>Tarde</option></select></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelNewClass">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveNewClass">Criar turma</button>
            </div>`;
        getEl('cancelNewClass').onclick = closeSlidePanel;
        getEl('saveNewClass').onclick = () => {
            const name = getEl('newClassName').value.trim();
            const grade = getEl('newClassGrade').value.trim();
            if (!name || !grade) { showToast('Preencha nome e série.'); return; }
            const newClass = {
                _row: Date.now(), id: Date.now(),
                name, grade,
                teacher: getEl('newClassTeacher').value,
                shift: getEl('newClassShift').value,
                students: 0,
                year: state.school.academicYear
            };
            state.classes.push(newClass);
            saveState();
            closeSlidePanel();
            showToast('Turma criada!');
            renderPage();
        };
        openSlidePanel();
    }

    function openClass(row) {
        const c = state.classes.find(cls => cls._row == row);
        if (!c) return;
        const content = getEl('slideContent');
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">${c.name}</h3>
            <div class="form-group"><label>Nome</label><input type="text" id="editClassName" value="${c.name}"></div>
            <div class="form-group"><label>Série</label><input type="text" id="editClassGrade" value="${c.grade}"></div>
            <div class="form-group"><label>Professor</label><select id="editClassTeacher">
                ${state.teachers.map(t => `<option value="${t.name}" ${t.name === c.teacher ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>Período</label><select id="editClassShift">
                <option ${c.shift === 'Manhã' ? 'selected' : ''}>Manhã</option>
                <option ${c.shift === 'Tarde' ? 'selected' : ''}>Tarde</option>
            </select></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelClassEdit">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveClassEdit">Salvar</button>
            </div>`;
        getEl('cancelClassEdit').onclick = closeSlidePanel;
        getEl('saveClassEdit').onclick = () => {
            c.name = getEl('editClassName').value.trim() || c.name;
            c.grade = getEl('editClassGrade').value.trim() || c.grade;
            c.teacher = getEl('editClassTeacher').value;
            c.shift = getEl('editClassShift').value;
            closeSlidePanel();
            showToast('Turma atualizada.');
            renderPage();
        };
        openSlidePanel();
    }

    // ======================================================
    // NOTAS E FREQUÊNCIA
    // ======================================================
    function buildNotas() {
        const selectedClass = state._selectedClassForGrades || state.classes[0]?.name || '';

        return `
            <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
                <select id="notasClassFilter" class="form-control" style="min-width:180px;">
                    ${state.classes.map(c => `
                        <option value="${c.name}" ${c.name === selectedClass ? 'selected' : ''}>${c.name}</option>
                    `).join('')}
                </select>
                <select id="notasBimesterFilter" class="form-control" style="min-width:150px;">
                    <option value="1º">1º Bimestre</option>
                    <option value="2º">2º Bimestre</option>
                    <option value="3º">3º Bimestre</option>
                    <option value="4º">4º Bimestre</option>
                </select>
                <button class="btn btn-primary" id="addGradeBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Lançar nota</button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Boletim - ${selectedClass || 'Selecione uma turma'}</h3>
                </div>
                <div class="card-body no-padding" style="overflow-x:auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Matemática</th>
                                <th>Português</th>
                                <th>Ciências</th>
                                <th>História</th>
                                <th>Frequência</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.students.filter(s => s.class === selectedClass).map(s => {
                                const studentGrades = state.grades.filter(g => g.studentId === s.id && g.class === selectedClass);
                                const math = studentGrades.find(g => g.subject === 'Matemática');
                                const portugues = studentGrades.find(g => g.subject === 'Português');
                                const ciencias = studentGrades.find(g => g.subject === 'Ciências');
                                const historia = studentGrades.find(g => g.subject === 'História');
                                const att = state.attendances.filter(a => a.studentId === s.id);
                                const present = att.filter(a => a.status === 'Presente').length;
                                const total = att.length || 1;
                                const freq = Math.round((present / total) * 100);

                                const gradeClass = (g) => {
                                    if (!g) return '-';
                                    if (g.grade >= 7) return '<span class="grade-good">' + g.grade + '</span>';
                                    if (g.grade >= 5) return '<span class="grade-warning">' + g.grade + '</span>';
                                    return '<span class="grade-danger">' + g.grade + '</span>';
                                };

                                return `<tr>
                                    <td><strong>${s.name}</strong></td>
                                    <td>${gradeClass(math)}</td>
                                    <td>${gradeClass(portugues)}</td>
                                    <td>${gradeClass(ciencias)}</td>
                                    <td>${gradeClass(historia)}</td>
                                    <td><span class="attendance-indicator"><span class="dot ${freq >= 75 ? 'presente' : freq >= 50 ? 'justificada' : 'falta'}"></span> ${freq}%</span></td>
                                    <td>${statusBadge(s.status)}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Ocorrências</h3>
                </div>
                <div class="card-body no-padding">
                    <ul class="agenda-list">
                        ${state.occurrences.filter(o => o.class === selectedClass || !selectedClass).map(o => `
                            <li class="agenda-item">
                                <div class="agenda-avatar">${getInitials(o.student)}</div>
                                <div class="agenda-info">
                                    <div class="agenda-name">${o.student}</div>
                                    <div class="agenda-detail">${o.type}: ${o.description}</div>
                                </div>
                                ${statusBadge(o.status)}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>`;
    }

    // ======================================================
    // COMUNICAÇÃO
    // ======================================================
    function buildComunicacao() {
        return `
            <div class="grid-2">
                <div class="card">
                    <div class="card-header">
                        <h3>Enviar comunicado</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>Para quem?</label>
                            <select id="commTo" class="form-control">
                                <option value="Todos">Todos os alunos</option>
                                ${state.classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                                <option value="Professores">Professores</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Assunto</label>
                            <input type="text" id="commTitle" placeholder="Ex: Reunião de pais">
                        </div>
                        <div class="form-group">
                            <label>Mensagem</label>
                            <textarea id="commMessage" rows="4" placeholder="Digite sua mensagem..."></textarea>
                        </div>
                        <button class="btn btn-primary" id="sendCommBtn">Enviar comunicado</button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Últimos comunicados</h3>
                    </div>
                    <div class="card-body no-padding">
                        <ul class="agenda-list">
                            ${state.communications.map(c => `
                                <li class="agenda-item">
                                    <div class="agenda-avatar">📢</div>
                                    <div class="agenda-info">
                                        <div class="agenda-name">${c.title}</div>
                                        <div class="agenda-detail">Para: ${c.to} · ${c.date}</div>
                                    </div>
                                    ${statusBadge(c.status)}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>`;
    }

    // ======================================================
    // CONFIGURAÇÕES
    // ======================================================
    function buildConfiguracoes() {
        return `
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>Dados da Escola</h3>
                    <button class="btn btn-primary" onclick="saveSchoolSettings()">Salvar</button>
                </div>
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-group"><label>Nome</label><input id="schoolName" value="${state.school.name}"></div>
                        <div class="form-group"><label>Ano letivo</label><input id="academicYear" value="${state.school.academicYear}"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Telefone</label><input id="schoolPhone" value="${state.school.phone}"></div>
                        <div class="form-group"><label>E-mail</label><input id="schoolEmail" value="${state.school.email}"></div>
                    </div>
                    <div class="form-group"><label>Endereço</label><input id="schoolAddress" value="${state.school.address}"></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>Professores</h3>
                    <button class="btn btn-primary btn-sm" id="newTeacherBtn"><i data-lucide="plus" style="width:14px;height:14px;"></i> Novo professor</button>
                </div>
                <div class="card-body no-padding">
                    <table class="data-table">
                        <thead><tr><th>Nome</th><th>Disciplina</th><th>Status</th></tr></thead>
                        <tbody>${state.teachers.map(t => `
                            <tr onclick="openTeacher(${t._row})" style="cursor:pointer">
                                <td>${t.name}</td><td>${t.subject}</td><td>${statusBadge(t.status)}</td>
                            </tr>`).join('')}</tbody>
                    </table>
                </div>
            </div>`;
    }

    window.saveSchoolSettings = function() {
        state.school.name = getEl('schoolName').value;
        state.school.phone = getEl('schoolPhone').value;
        state.school.email = getEl('schoolEmail').value;
        state.school.address = getEl('schoolAddress').value;
        state.school.academicYear = getEl('academicYear').value;
        showToast('Dados da escola salvos.');
        renderPage();
    };

    // ======================================================
    // MODAL & EVENT ACTIONS
    // ======================================================
    function openModal(time = null) {
        const overlay = getEl('modalOverlay');
        if (!overlay) return;
        overlay.classList.add('show');

        const dateInput = getEl('eventDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        const timeInput = getEl('eventTime');
        if (timeInput) timeInput.value = time || '08:00';

        const titleInput = getEl('eventTitle');
        if (titleInput) titleInput.value = '';

        const locationInput = getEl('eventLocation');
        if (locationInput) locationInput.value = '';

        const statusInput = getEl('eventStatus');
        if (statusInput) statusInput.value = 'Confirmado';

        refreshIcons();
    }

    function openEditEvent(eventId) {
        const evt = state.events.find(a => String(a.id) === String(eventId));
        if (!evt) return;
        openModal(evt.time);

        const titleInput = getEl('eventTitle');
        if (titleInput) titleInput.value = evt.title;

        const classInput = getEl('eventClass');
        if (classInput) classInput.value = evt.class;

        const teacherInput = getEl('eventTeacher');
        if (teacherInput) teacherInput.value = evt.teacher;

        const typeInput = getEl('eventType');
        if (typeInput) typeInput.value = evt.type;

        const locationInput = getEl('eventLocation');
        if (locationInput) locationInput.value = evt.location;

        const dateInput = getEl('eventDate');
        if (dateInput) dateInput.value = evt.date;

        const statusInput = getEl('eventStatus');
        if (statusInput) statusInput.value = evt.status;

        window._editingEventId = eventId;
        setModalMode('edit');
    }

    async function saveEvent() {
        const title = getEl('eventTitle').value.trim();
        const eventClass = getEl('eventClass').value;
        const teacher = getEl('eventTeacher').value;
        const type = getEl('eventType').value;
        const location = getEl('eventLocation').value.trim();
        const date = getEl('eventDate').value;
        const time = getEl('eventTime').value;
        const status = getEl('eventStatus').value;

        if (!title || !date || !time) { showToast('Preencha título, data e horário.'); return; }

        const isEditing = !!window._editingEventId;
        const saveBtn = getEl('modalSave');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }

        await new Promise(resolve => setTimeout(resolve, 300));

        if (isEditing) {
            const evt = state.events.find(a => a.id == window._editingEventId);
            if (evt) {
                Object.assign(evt, { title, class: eventClass, teacher, type, location, date, time, status });
            }
        } else {
            const newEvent = {
                id: Date.now(),
                title, class: eventClass, teacher, type, location, date, time, status
            };
            state.events.push(newEvent);
        }

        closeModal();
        saveState();
        showToast(isEditing ? 'Evento atualizado.' : 'Evento criado.');
        renderPage();
    }

    window.deleteEvent = function(id) {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;
        state.events = state.events.filter(a => a.id != id);
        saveState();
        renderPage();
        showToast('Evento excluído.');
    };

    // ======================================================
    // TEACHER ACTIONS
    // ======================================================
    function openNewTeacher() {
        const content = getEl('slideContent');
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">Novo professor</h3>
            <div class="form-group"><label>Nome</label><input type="text" id="newTeacherName"></div>
            <div class="form-group"><label>Disciplina</label><input type="text" id="newTeacherSubject"></div>
            <div class="form-group"><label>E-mail</label><input type="email" id="newTeacherEmail"></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="newTeacherPhone"></div>
            <div class="form-group"><label>Status</label><select id="newTeacherStatus"><option>Ativo</option><option>Inativo</option></select></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelNewTeacher">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveNewTeacher">Adicionar</button>
            </div>`;
        getEl('cancelNewTeacher').onclick = closeSlidePanel;
        getEl('saveNewTeacher').onclick = () => {
            const name = getEl('newTeacherName').value.trim();
            const subject = getEl('newTeacherSubject').value.trim();
            if (!name || !subject) { showToast('Preencha nome e disciplina.'); return; }
            const newTeacher = {
                _row: Date.now(), id: Date.now(),
                name, subject,
                email: getEl('newTeacherEmail').value.trim(),
                phone: getEl('newTeacherPhone').value.trim(),
                status: getEl('newTeacherStatus').value
            };
            state.teachers.push(newTeacher);
            closeSlidePanel();
            showToast('Professor adicionado!');
            renderPage();
        };
        openSlidePanel();
    }

    function openTeacher(row) {
        const member = state.teachers.find(s => s._row == row);
        if (!member) return;
        const content = getEl('slideContent');
        content.innerHTML = `
            <h3 style="margin-bottom:16px;">Editar professor</h3>
            <div class="form-group"><label>Nome</label><input type="text" id="editTeacherName" value="${member.name}"></div>
            <div class="form-group"><label>Disciplina</label><input type="text" id="editTeacherSubject" value="${member.subject}"></div>
            <div class="form-group"><label>E-mail</label><input type="email" id="editTeacherEmail" value="${member.email || ''}"></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="editTeacherPhone" value="${member.phone || ''}"></div>
            <div class="form-group"><label>Status</label><select id="editTeacherStatus">
                <option ${member.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                <option ${member.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
            </select></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" id="cancelTeacherEdit">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveTeacherEdit">Salvar</button>
            </div>`;
        getEl('cancelTeacherEdit').onclick = closeSlidePanel;
        getEl('saveTeacherEdit').onclick = () => {
            member.name = getEl('editTeacherName').value.trim() || member.name;
            member.subject = getEl('editTeacherSubject').value.trim() || member.subject;
            member.email = getEl('editTeacherEmail').value.trim() || member.email;
            member.phone = getEl('editTeacherPhone').value.trim() || member.phone;
            member.status = getEl('editTeacherStatus').value;
            closeSlidePanel();
            showToast('Professor atualizado.');
            renderPage();
        };
        openSlidePanel();
    }

    // ======================================================
    // THEME
    // ======================================================
    function toggleTheme() {
        document.body.classList.toggle('dark');
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.setAttribute('data-lucide', document.body.classList.contains('dark') ? 'moon' : 'sun');
        localStorage.setItem('pluri-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        refreshIcons();
    }

    function loadTheme() {
        if (localStorage.getItem('pluri-theme') === 'dark') {
            document.body.classList.add('dark');
            const icon = document.querySelector('#themeToggle i');
            if (icon) icon.setAttribute('data-lucide', 'moon');
        }
    }

    // ======================================================
    // ATTACH EVENTS
    // ======================================================
    function attachPageEvents() {
        getEl('openModalBtn')?.addEventListener('click', () => openModal());
        getEl('newStudentBtn')?.addEventListener('click', () => openNewStudent());
        getEl('newTeacherBtn')?.addEventListener('click', () => openNewTeacher());
        getEl('newClassBtn')?.addEventListener('click', () => openNewClass());

        // Agenda tabs
        document.querySelectorAll('#agendaTabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                state.calendarTab = tab.dataset.tab;
                renderPage();
            });
        });

        // Filtro de turma na agenda
        const classFilter = getEl('agendaClassFilter');
        if (classFilter) {
            classFilter.addEventListener('change', () => {
                state.calendarClassFilter = classFilter.value;
                renderPage();
            });
        }

        // Navegação da agenda
        getEl('agendaPrevDay')?.addEventListener('click', () => {
            const d = new Date(state.calendarDate + 'T00:00:00');
            d.setDate(d.getDate() - 1);
            state.calendarDate = toDateStr(d);
            renderPage();
        });
        getEl('agendaNextDay')?.addEventListener('click', () => {
            const d = new Date(state.calendarDate + 'T00:00:00');
            d.setDate(d.getDate() + 1);
            state.calendarDate = toDateStr(d);
            renderPage();
        });
        getEl('agendaPrevMonth')?.addEventListener('click', () => {
            state.calendarMonth.month--;
            if (state.calendarMonth.month < 0) { state.calendarMonth.month = 11; state.calendarMonth.year--; }
            renderPage();
        });
        getEl('agendaNextMonth')?.addEventListener('click', () => {
            state.calendarMonth.month++;
            if (state.calendarMonth.month > 11) { state.calendarMonth.month = 0; state.calendarMonth.year++; }
            renderPage();
        });

        // Navegação dos KPI cards
        document.querySelectorAll('.kpi-card[data-link]').forEach(card => {
            card.addEventListener('click', () => navigateTo(card.dataset.link));
        });

        // Navegação geral
        document.querySelectorAll('.js-nav').forEach(el => {
            el.addEventListener('click', (e) => { e.preventDefault(); navigateTo(el.dataset.page); });
        });

        // Alunos - clique na linha
        document.querySelectorAll('[data-student-row]').forEach(el => {
            el.addEventListener('click', () => openStudent(parseInt(el.dataset.studentRow)));
        });

        // Turmas - clique no card
        document.querySelectorAll('[data-class-row]').forEach(el => {
            el.addEventListener('click', () => openClass(parseInt(el.dataset.classRow)));
        });

        // Busca de alunos
        getEl('studentSearch')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#studentTableBody tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // Busca de turmas
        getEl('classSearch')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#classGrid .class-card').forEach(card => {
                card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // Filtro de notas por turma
        const notasClassFilter = getEl('notasClassFilter');
        if (notasClassFilter) {
            notasClassFilter.addEventListener('change', () => {
                state._selectedClassForGrades = notasClassFilter.value;
                renderPage();
            });
        }

        // Enviar comunicado
        getEl('sendCommBtn')?.addEventListener('click', () => {
            const title = getEl('commTitle').value.trim();
            const message = getEl('commMessage').value.trim();
            const to = getEl('commTo').value;
            if (!title || !message) { showToast('Preencha assunto e mensagem.'); return; }
            const newComm = {
                id: Date.now(),
                title, message, to,
                date: new Date().toISOString().split('T')[0],
                status: 'Pendente'
            };
            state.communications.unshift(newComm);
            saveState();
            getEl('commTitle').value = '';
            getEl('commMessage').value = '';
            showToast('Comunicado enviado!');
            renderPage();
        });
    }

    // ======================================================
    // FEEDBACK FORM
    // ======================================================
    function openFeedbackModal() {
        getEl('feedbackModalOverlay')?.classList.add('show');
    }

    function closeFeedbackModal() {
        getEl('feedbackModalOverlay')?.classList.remove('show');
    }

    document.addEventListener('DOMContentLoaded', function() {
        getEl('feedbackFab')?.addEventListener('click', openFeedbackModal);
        getEl('feedbackCloseBtn')?.addEventListener('click', closeFeedbackModal);
        getEl('feedbackModalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeFeedbackModal();
        });
    });

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
        getEl('modalSave')?.addEventListener('click', saveEvent);
        getEl('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });
        getEl('slideOverlay')?.addEventListener('click', closeSlidePanel);

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
            openStudent,
            openClass,
            openTeacher,
            openModal,
            showToast,
            editEvent: openEditEvent,
            deleteEvent: window.deleteEvent,
            openDayFromMonth: window.openDayFromMonth,
            openNewEventForDate: window.openNewEventForDate
        });

        renderPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();