// js/app.js

function renderPage() {
    const container = getEl('pageContainer');
    if (!container) return;
    const title = getEl('pageTitle');
    const subtitle = getEl('pageSubtitle');
    let html = '';
    try {
        if (state.currentPage === 'pacientes' && state.selectedPatient) {
            updateTitleAndSubtitle(title, subtitle);
            renderPatientProfile();
            return;
        }
        switch (state.currentPage) {
            case 'dashboard': html = buildDashboard(); break;
            case 'agenda': html = buildAgenda(); break;
            case 'atendimentos': html = buildAtendimentos(); break;
            case 'pacientes': html = buildPacientes(); break;
            case 'convenios': html = buildConvenios(); break;
            case 'faturamento': html = buildFaturamento(); break;
            case 'financeiro': html = buildFinanceiro(); break;
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
    if (state.currentPage === 'faturamento' && typeof window.renderFaturamento === 'function') window.renderFaturamento();
    if (state.currentPage === 'financeiro' && typeof window.renderFinanceiro === 'function') window.renderFinanceiro();
    if (state.currentPage === 'configuracoes' && typeof updateGoogleCalendarStatus === 'function') updateGoogleCalendarStatus();
}

function updateTitleAndSubtitle(title, subtitle) {
    const titles = {
        dashboard: ['Visão Geral', 'Acompanhe a agenda, os atendimentos e a rotina da clínica.'],
        agenda: ['Agenda', 'Gerencie os horários da clínica.'],
        atendimentos: ['Conversas', 'Central de conversas com pacientes.'],
        pacientes: ['Pacientes', 'Base de pacientes da clínica.'],
        convenios: ['Convênios', 'Cadastre operadoras e planos da clínica.'],
        faturamento: ['Faturamento', 'Acompanhe guias, lotes, glosas e recebimentos.'],
        financeiro: ['Financeiro', 'Controle receitas, despesas, contas e repasses da clínica.'],
        indicadores: ['Indicadores', 'Visão operacional da clínica.'],
        configuracoes: ['Configurações', 'Gerencie sua clínica.']
    };
    const [t, s] = titles[state.currentPage] || titles.dashboard;
    if (title) title.textContent = t;
    if (subtitle) subtitle.textContent = s;
}

function attachPageEvents() {
    getEl('openModalBtn')?.addEventListener('click', () => openModal());
    getEl('newPatientBtn')?.addEventListener('click', () => openNewPatient());
    getEl('newStaffBtn')?.addEventListener('click', () => openNewStaff());
    getEl('btnConnectCalendar')?.addEventListener('click', async () => { try { const url = await window.pluriAPI.getCalendarAuthUrl(); window.location.href = url; } catch (e) { alert('Erro ao conectar: ' + e.message); } });
    document.querySelectorAll('#agendaTabs .tab').forEach(tab => tab.addEventListener('click', () => { state.agendaTab = tab.dataset.tab; renderPage(); }));
    getEl('agendaPrevDay')?.addEventListener('click', () => { const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'); d.setDate(d.getDate() - 1); state.agendaDate = toDateStr(d); renderPage(); });
    getEl('agendaNextDay')?.addEventListener('click', () => { const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'); d.setDate(d.getDate() + 1); state.agendaDate = toDateStr(d); renderPage(); });
    getEl('agendaPrevMonth')?.addEventListener('click', () => { if (!state.agendaMonth) { const n = new Date(); state.agendaMonth = { year: n.getFullYear(), month: n.getMonth() }; } state.agendaMonth.month -= 1; if (state.agendaMonth.month < 0) { state.agendaMonth.month = 11; state.agendaMonth.year -= 1; } renderPage(); });
    getEl('agendaNextMonth')?.addEventListener('click', () => { if (!state.agendaMonth) { const n = new Date(); state.agendaMonth = { year: n.getFullYear(), month: n.getMonth() }; } state.agendaMonth.month += 1; if (state.agendaMonth.month > 11) { state.agendaMonth.month = 0; state.agendaMonth.year += 1; } renderPage(); });
    document.querySelectorAll('.kpi-card[data-link]').forEach(card => card.addEventListener('click', () => { const page = card.dataset.link; if (page) navigateTo(page); }));
    document.querySelectorAll('.js-nav').forEach(el => { const page = el.dataset.page; if (page) el.addEventListener('click', e => { e.preventDefault(); navigateTo(page); }); });
    document.querySelectorAll('[data-conversation-id]').forEach(el => el.addEventListener('click', () => { const id = el.dataset.conversationId; if (id && typeof openConversation === 'function') openConversation(id); }));
    document.querySelectorAll('[data-patient-row]').forEach(el => el.addEventListener('click', () => { const row = el.dataset.patientRow; if (row) openPatient(row); }));
    document.querySelectorAll('[data-staff-row]').forEach(el => el.addEventListener('click', () => { const row = el.dataset.staffRow; if (row) openStaff(row); }));
    const searchInput = getEl('patientSearch');
    if (searchInput) searchInput.addEventListener('input', e => { const q = e.target.value.toLowerCase(); document.querySelectorAll('#patientTableBody tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none'; }); });
}

function getSessionToken() {
    const session = window.PLURI_AUTH_SESSION;
    if (window.PLURI_SESSION_VALIDATED && session?.access_token) return session.access_token;
    try { const stored = JSON.parse(localStorage.getItem('pluri_session') || 'null'); if (stored?.token) return stored.token; } catch (_) {}
    return null;
}
