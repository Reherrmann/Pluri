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
            case 'configuracoes': html = buildConfiguracoes(); break;  // ✅ síncrono, função correta
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

    if (window._calendarNotConnected) {
        const connectBtn = document.getElementById('btnConnectCalendar');
        if (connectBtn) connectBtn.style.display = 'inline-block';
    }

    if (state.currentPage === 'configuracoes') {
        updateGoogleCalendarStatus();   // função definida em configuracoes.js
    }
}

function updateTitleAndSubtitle(title, subtitle) {
    const titles = {
        dashboard: [
            state.clinic.name ? `Bom dia, ${state.clinic.name}.` : 'Bem-vindo à PLURI.',
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

    getEl('btnConnectCalendar')?.addEventListener('click', async () => {
        try {
            const url = await window.pluriAPI.getCalendarAuthUrl();
            window.location.href = url;
        } catch (e) {
            alert('Erro ao conectar: ' + e.message);
        }
    });

    document.querySelectorAll('#agendaTabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.agendaTab = tab.dataset.tab; // 'today' | 'month'
            renderPage();
        });
    });

    getEl('agendaPrevDay')?.addEventListener('click', () => {
        const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        state.agendaDate = toDateStr(d);
        renderPage();
    });
    getEl('agendaNextDay')?.addEventListener('click', () => {
        const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        state.agendaDate = toDateStr(d);
        renderPage();
    });
    getEl('agendaPrevMonth')?.addEventListener('click', () => {
        if (!state.agendaMonth) { const n = new Date(); state.agendaMonth = { year: n.getFullYear(), month: n.getMonth() }; }
        state.agendaMonth.month -= 1;
        if (state.agendaMonth.month < 0) { state.agendaMonth.month = 11; state.agendaMonth.year -= 1; }
        renderPage();
    });
    getEl('agendaNextMonth')?.addEventListener('click', () => {
        if (!state.agendaMonth) { const n = new Date(); state.agendaMonth = { year: n.getFullYear(), month: n.getMonth() }; }
        state.agendaMonth.month += 1;
        if (state.agendaMonth.month > 11) { state.agendaMonth.month = 0; state.agendaMonth.year += 1; }
        renderPage();
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

function getSessionToken() {
    if (window.PLURI_SESSION_VALIDATED && window.PLURI_SESSION && window.PLURI_SESSION.token) {
        return window.PLURI_SESSION.token;
    }
    const sessionData = localStorage.getItem('pluri_session');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (session.token) return session.token;
        } catch (e) {
            localStorage.removeItem('pluri_session');
        }
    }
    window.location.href = 'login.html';
    return null;
}

async function init() {
    if (!window.pluriAPI) {
        window.pluriAPI = new PluriAPI(PLURI_CONFIG);
    }

    const token = getSessionToken();
    if (!token) return;
    window.pluriAPI.setSessionToken(token);
    console.log('🔑 Token configurado:', token.substring(0, 10) + '...');

    window.addEventListener('calendar:not_connected', () => {
        window._calendarNotConnected = true;
    });

    try {
        console.log('🔄 Carregando pacientes...');
        const patients = await window.pluriAPI.getPatients();
        state.patients = Array.isArray(patients) ? patients : [];
        console.log('✅ Pacientes:', state.patients.length);

        console.log('🔄 Carregando agenda...');
        const appointments = await window.pluriAPI.getCalendarAppointments();
        state.appointments = Array.isArray(appointments) ? appointments : [];
        console.log('✅ Agenda:', state.appointments.length);

        console.log('🔄 Carregando equipe...');
const staff = await window.pluriAPI.getStaff();
state.staff = Array.isArray(staff) ? staff : [];
console.log('✅ Equipe:', state.staff.length);

console.log('🔄 Carregando clínica...');
state.clinic = await window.pluriAPI.getClinic();
console.log('✅ Clínica carregada:', state.clinic);

console.log('🔄 Carregando conversas...');
const conversations = await window.pluriAPI.getConversations();
state.conversations = Array.isArray(conversations) ? conversations : [];
console.log('✅ Conversas:', state.conversations.length);
    } catch (e) {
        console.error('❌ Erro ao carregar dados:', e.message);
        state.patients = [];
        state.appointments = [];
        state.staff = [];
        state.conversations = [];
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
        openStaff: typeof openStaff === 'function' ? openStaff : () => {},
        showToast,
        editAppointment: openEditAppointment,
        deleteAppointment: deleteAppointmentById,
        confirmAppointment: confirmAppointmentById,
        openDayFromMonth
    };
}

// =====================================================
// AÇÕES DE AGENDAMENTO (editar / apagar / confirmar)
// =====================================================

async function deleteAppointmentById(id) {
    const appt = state.appointments.find(a => String(a.id) === String(id));
    if (!appt) return;
    if (!confirm(`Excluir o agendamento de ${appt.patient}?`)) return;

    const result = await window.pluriAPI.deleteAppointment(id, window.PLURI_USER?.clinicaId);
    if (!result || !result.success) {
        showToast(result?.error || 'Erro ao excluir agendamento.');
        return;
    }

    state.appointments = await window.pluriAPI.getCalendarAppointments();
    renderPage();
    showToast('Agendamento excluído.');
}

async function confirmAppointmentById(id, phone, patient) {
    const appt = state.appointments.find(a => String(a.id) === String(id));
    if (!appt) return;

    const result = await window.pluriAPI.updateAppointment({
        id: appt.id,
        patient: appt.patient,
        professional: appt.professional,
        service: appt.service,
        phone: appt.phone,
        notes: appt.notes,
        status: 'Confirmado',
        date: appt.date,
        time: appt.time,
        clinicaID: window.PLURI_USER?.clinicaId
    });

    if (!result || !result.success) {
        showToast(result?.error || 'Erro ao confirmar agendamento.');
        return;
    }

    state.appointments = await window.pluriAPI.getCalendarAppointments();
    renderPage();
    showToast('Agendamento confirmado.');

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone) {
        const msg = encodeURIComponent(`Olá ${patient}, seu agendamento foi confirmado! ✅`);
        window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
    } else {
        showToast('Status confirmado, mas este agendamento não tem telefone salvo.');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
