// js/app.js

function renderPage() {
    console.log('🔍 Renderizando página:', state.currentPage);
    // ... resto do código
}
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
        dashboard: [
    state.clinic.name
        ? `Bom dia, ${state.clinic.name}.`
        : 'Bem-vindo à PLURI.',
    'Veja o que está acontecendo na clínica hoje.'
],
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
    getEl('newPatientBtn')?.addEventListener('click', () => openNewPatient());
    getEl('newStaffBtn')?.addEventListener('click', () => openNewStaff());

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

    document.querySelectorAll('[data-patient-row]').forEach(el => {
        el.addEventListener('click', () => {
            const row = parseInt(el.dataset.patientRow, 10);
            if (!isNaN(row)) openPatient(row);
        });
    });

    document.querySelectorAll('[data-staff-row]').forEach(el => {
        el.addEventListener('click', () => {
            const row = parseInt(el.dataset.staffRow, 10);
            if (!isNaN(row)) openStaff(row);
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

        // Carregar agenda SOMENTE do Google Calendar
const appointments =
    await window.pluriAPI.getCalendarAppointments();

state.appointments = appointments || [];

console.log(
    '✅ Agenda carregada do Google Calendar:',
    state.appointments.length
);

// ADICIONE ISSO
console.table(state.appointments);

// ou, se preferir ver tudo:
// console.log(JSON.stringify(state.appointments, null, 2));

const staff = await window.pluriAPI.getStaff();

if (staff && staff.length > 0) {

    state.staff = staff;

    console.log(
        '✅ Equipe carregada:',
        staff.length
    );

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
