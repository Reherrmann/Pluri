// js/app.js
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
        html = '<div style="padding:40px;text-align:center;color:#B91C1C;">Erro ao carregar a página.</div>';
    }

    container.innerHTML = html;
    attachPageEvents();
    refreshIcons();
    updateTitleAndSubtitle(title, subtitle);
}

function updateTitleAndSubtitle(title, subtitle) {
    const titles = {
        dashboard: ['Bom dia, bergamo.', 'Veja o que está acontecendo na clínica hoje.'],
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
                    weekView.style.display = 'block';
                    weekView.innerHTML = '';
                    weekView.appendChild(buildAgendaWeekElement());
                }
            }
            refreshIcons();
        });
    });

    document.querySelectorAll('.kpi-card[data-link]').forEach(card => {
        card.addEventListener('click', () => {
            const page = card.dataset.link;
            if (page) navigateTo(page);
        });
    });

    document.querySelectorAll('.js-nav').forEach(el => {
        const page = el.dataset.page;
        if (page) el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(page);
        });
    });

    document.querySelectorAll('[data-conversation-id]').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.conversationId, 10);
            if (!isNaN(id)) openConversation(id);
        });
    });

    document.querySelectorAll('[data-patient-id]').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.patientId, 10);
            if (!isNaN(id) && typeof openPatient === 'function') openPatient(id);
        });
    });

    document.querySelectorAll('[data-staff-id]').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.staffId, 10);
            if (!isNaN(id) && typeof openStaff === 'function') openStaff(id);
        });
    });

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

async function init() {
    initMockData();
    
    if (!window.pluriAPI) {
        window.pluriAPI = new PluriAPI(PLURI_CONFIG);
    }

    try {
        const patients = await window.pluriAPI.getPatients();
        if (patients && patients.length > 0) {
            state.patients = patients;
            console.log('✅ Pacientes carregados:', patients.length);
        }

        const appointments = await window.pluriAPI.getAppointments();
        if (appointments && appointments.length > 0) {
            state.appointments = appointments;
            console.log('✅ Agendamentos carregados:', appointments.length);
        }

        const staff = await window.pluriAPI.getStaff();
        if (staff && staff.length > 0) {
            state.staff = staff;
            console.log('✅ Equipe carregada:', staff.length);
        }
    } catch (e) {
        console.warn('Usando dados mock:', e.message);
    }

    loadTheme();
    getEl('themeToggle')?.addEventListener('click', toggleTheme);
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(a.dataset.page);
        });
    });
    
    getEl('modalClose')?.addEventListener('click', closeModal);
    getEl('modalCancel')?.addEventListener('click', closeModal);
    getEl('modalSave')?.addEventListener('click', saveAppointment);
    getEl('modalOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    getEl('slideOverlay')?.addEventListener('click', closeSlidePanel);
    getEl('notifBtn')?.addEventListener('click', () => showToast('Nenhuma notificação nova.'));
    
    renderPage();
    
    // Expor API global com segurança
    window.pluri = {
        navigateTo,
        openConversation,
        openPatient: typeof openPatient === 'function' ? openPatient : () => {},
        openModal,
        openStaff: typeof openStaff === 'function' ? openStaff : () => {},
        showToast
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
